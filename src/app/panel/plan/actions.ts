"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/session";
import { addDays, berlinToday } from "./datetime";

type DbClient = Awaited<ReturnType<typeof createClient>>;

/** Columns that may be written per table — the security boundary for mutations. */
const EDITABLE: Record<string, string[]> = {
  studios: ["name", "city"],
  rooms: ["room", "studio"],
  course_types: ["name", "description"],
  course_units: ["time_start", "duration_mins", "course_type", "room", "leader"],
  sick_notes: ["user", "text", "start_date", "end_date"],
};

export type RowId = string | number;

function assertTable(table: string): string[] {
  const columns = EDITABLE[table];
  if (!columns) throw new Error(`Unbekannte Tabelle: ${table}`);
  return columns;
}

/** Keep only whitelisted columns and normalise empty values to NULL. */
function sanitize(columns: string[], values: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  for (const column of columns) {
    if (!(column in values)) continue;
    const value = values[column];
    payload[column] = value === "" || value === undefined ? null : value;
  }
  return payload;
}

async function requireAdmin() {
  const { isAdmin } = await getSession();
  if (!isAdmin) throw new Error("Nicht autorisiert");
}

export async function saveRow(
  table: string,
  id: RowId | null,
  values: Record<string, unknown>
) {
  await requireAdmin();
  const columns = assertTable(table);
  const supabase = await createClient();
  const payload = sanitize(columns, values);

  const { error } =
    id == null
      ? await supabase.from(table).insert(payload)
      : await supabase.from(table).update(payload).eq("id", id);

  if (error) throw new Error(error.message);

  // Collapse any overlapping ranges the edit may have created for this employee.
  if (table === "sick_notes") {
    let userId = payload.user as string | undefined;
    if (!userId && id != null) {
      const { data } = await supabase
        .from("sick_notes")
        .select("user")
        .eq("id", id)
        .maybeSingle();
      userId = data?.user ?? undefined;
    }
    if (userId) await mergeUserSickNotes(supabase, userId);
  }

  revalidatePath("/panel/plan");
}

export async function deleteRow(table: string, id: RowId) {
  await requireAdmin();
  assertTable(table);
  const supabase = await createClient();

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/plan");
}

type SickNote = { id: number; start_date: string; end_date: string; text: string | null };

/**
 * Merge a user's overlapping or directly adjacent sick notes into single
 * continuous ranges, keeping one row per range and removing the redundant ones.
 */
async function mergeUserSickNotes(
  supabase: DbClient,
  userId: string
): Promise<void> {
  const { data: notes } = await supabase
    .from("sick_notes")
    .select("id, start_date, end_date, text")
    .eq("user", userId)
    .order("start_date", { ascending: true });

  if (!notes || notes.length < 2) return;

  type Group = { ids: number[]; start: string; end: string; texts: string[] };
  const groups: Group[] = [];
  for (const note of notes as SickNote[]) {
    const last = groups[groups.length - 1];
    // Overlapping or back-to-back (gap of at most one day) ranges belong together.
    if (last && note.start_date <= addDays(last.end, 1)) {
      if (note.end_date > last.end) last.end = note.end_date;
      last.ids.push(note.id);
      if (note.text) last.texts.push(note.text);
    } else {
      groups.push({
        ids: [note.id],
        start: note.start_date,
        end: note.end_date,
        texts: note.text ? [note.text] : [],
      });
    }
  }

  for (const group of groups) {
    if (group.ids.length < 2) continue;
    const [keep, ...drop] = group.ids;
    const text = [...new Set(group.texts)].join("\n") || null;
    await supabase
      .from("sick_notes")
      .update({ start_date: group.start, end_date: group.end, text })
      .eq("id", keep);
    await supabase.from("sick_notes").delete().in("id", drop);
  }
}

/**
 * Employee self-service: report sick from today for `days` additional days
 * (0 = today only). Overlapping ranges are merged automatically.
 */
export async function submitSickLeave(days: number, text: string) {
  if (!Number.isInteger(days) || days < 0 || days > 6) {
    throw new Error("Ungültige Dauer");
  }

  const { userId } = await getSession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("login", userId)
    .maybeSingle();
  if (!profile) throw new Error("Profil nicht gefunden");

  const start = berlinToday();
  const { error } = await supabase.from("sick_notes").insert({
    user: profile.id,
    start_date: start,
    end_date: addDays(start, days),
    text: text.trim() || null,
  });
  if (error) throw new Error(error.message);

  await mergeUserSickNotes(supabase, profile.id);
  revalidatePath("/panel/sickleave");
  revalidatePath("/panel/plan");
}
