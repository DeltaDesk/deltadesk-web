"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/session";
import { addDays, berlinToday, isoToLocalInput, localInputToIso } from "./datetime";
import { assignSubstitute, assignSubstitutesForSick } from "./substitution";

type DbClient = Awaited<ReturnType<typeof createClient>>;

/** Columns that may be written per table — the security boundary for mutations. */
const EDITABLE: Record<string, string[]> = {
  studios: ["name", "city"],
  rooms: ["room", "studio"],
  course_types: ["name", "description"],
  course_units: [
    "time_start",
    "duration_mins",
    "course_type",
    "room",
    "leader",
  ],
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

/** Throws if the given course_unit payload would overlap an existing unit's room or leader. */
async function checkCourseUnitConflicts(
  supabase: DbClient,
  payload: Record<string, unknown>,
  editId: RowId | null,
) {
  const timeStart = payload.time_start as string | null;
  const durationMins = payload.duration_mins as number | null;
  if (!timeStart || !durationMins) return;

  const startMs = new Date(timeStart).getTime();
  const endIso = new Date(startMs + durationMins * 60_000).toISOString();

  const room = payload.room as string | null;
  const leader = payload.leader as string | null;

  if (room) {
    const { data } = await supabase
      .from("course_units")
      .select("id, time_start, duration_mins, room_info:room(room)")
      .eq("room", room)
      .lt("time_start", endIso);

    const conflict = (data ?? []).find((u) => {
      if (editId != null && String(u.id) === String(editId)) return false;
      const uEndMs = new Date(u.time_start).getTime() + (u.duration_mins ?? 0) * 60_000;
      return uEndMs > startMs;
    });

    if (conflict) {
      const roomName = (conflict.room_info as { room?: string } | null)?.room ?? "Raum";
      throw new Error(`Raumkonflikt: „${roomName}" ist zu diesem Zeitpunkt bereits belegt`);
    }
  }

  if (leader) {
    const { data } = await supabase
      .from("course_units")
      .select("id, time_start, duration_mins, type_info:course_type(name)")
      .eq("leader", leader)
      .lt("time_start", endIso);

    const conflict = (data ?? []).find((u) => {
      if (editId != null && String(u.id) === String(editId)) return false;
      const uEndMs = new Date(u.time_start).getTime() + (u.duration_mins ?? 0) * 60_000;
      return uEndMs > startMs;
    });

    if (conflict) {
      const courseName = (conflict.type_info as { name?: string } | null)?.name;
      const msg = courseName
        ? `Mitarbeiterkonflikt: Leitung führt zu diesem Zeitpunkt bereits „${courseName}"`
        : "Mitarbeiterkonflikt: Leitung ist zu diesem Zeitpunkt bereits verplant";
      throw new Error(msg);
    }
  }
}

/** Render a minute count as a German "X Std. Y Min." string. */
function formatHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

/**
 * Monday-based Europe/Berlin ISO week [startIso, endIso) containing `iso`.
 * Mirrors the week computation inside the `assign_substitute` RPC so the manual
 * and automatic paths agree on which courses count toward the weekly total.
 */
function berlinWeekRange(iso: string): { startIso: string; endIso: string } {
  const date = isoToLocalInput(iso).slice(0, 10); // YYYY-MM-DD in Berlin
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0=Sun … 6=Sat
  const isoDow = dow === 0 ? 7 : dow; // 1=Mon … 7=Sun
  const monday = addDays(date, -(isoDow - 1));
  return {
    startIso: localInputToIso(`${monday}T00:00`)!,
    endIso: localInputToIso(`${addDays(monday, 7)}T00:00`)!,
  };
}

/**
 * Throws if assigning this leader would push their scheduled minutes for the
 * Berlin week past their working-time model (hours_per_week). A missing model is
 * treated as zero hours, matching the substitution engine.
 */
async function checkWeeklyHours(
  supabase: DbClient,
  payload: Record<string, unknown>,
  editId: RowId | null,
) {
  const leader = payload.leader as string | null;
  const timeStart = payload.time_start as string | null;
  if (!leader || !timeStart) return;
  const durationMins = (payload.duration_mins as number | null) ?? 60;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, working_time_info:working_time(hours_per_week)")
    .eq("id", leader)
    .maybeSingle();

  const hours =
    (profile?.working_time_info as { hours_per_week?: number } | null)
      ?.hours_per_week ?? 0;
  const limitMins = hours * 60;

  const { startIso, endIso } = berlinWeekRange(timeStart);
  const { data: units } = await supabase
    .from("course_units")
    .select("id, duration_mins")
    .eq("leader", leader)
    .gte("time_start", startIso)
    .lt("time_start", endIso);

  let existing = 0;
  for (const u of units ?? []) {
    if (editId != null && String(u.id) === String(editId)) continue;
    existing += u.duration_mins ?? 60;
  }

  const total = existing + durationMins;
  if (total > limitMins) {
    const name = (profile?.name as string | null) ?? "Mitarbeiter";
    throw new Error(
      `Arbeitszeitmodell überschritten: „${name}" käme in dieser Woche auf ` +
        `${formatHours(total)} (zulässig: ${formatHours(limitMins)}).`,
    );
  }
}

export async function saveRow(
  table: string,
  id: RowId | null,
  values: Record<string, unknown>,
) {
  await requireAdmin();
  const columns = assertTable(table);
  const supabase = await createClient();
  const payload = sanitize(columns, values);

  if (table === "course_units") {
    await checkCourseUnitConflicts(supabase, payload, id);
    await checkWeeklyHours(supabase, payload, id);
  }

  // A cleared leader is only detectable by comparing against the stored value.
  let previousLeader: string | null = null;
  if (table === "course_units" && id != null && "leader" in payload) {
    const { data } = await supabase
      .from("course_units")
      .select("leader")
      .eq("id", id)
      .maybeSingle();
    previousLeader = data?.leader ?? null;
  }

  let newUnitId: string | null = null;
  if (id == null) {
    // course_units needs its new id to kick off the substitution search.
    if (table === "course_units") {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      newUnitId = data.id as string;
    } else {
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from(table).update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  }

  if (table === "sick_notes") {
    // Collapse overlapping ranges, then find substitutes for any course the
    // employee leads within the reported range.
    let userId = (payload.user as string | null) ?? null;
    if (!userId && id != null) {
      const { data } = await supabase
        .from("sick_notes")
        .select("user")
        .eq("id", id)
        .maybeSingle();
      userId = data?.user ?? null;
    }
    if (userId) {
      await mergeUserSickNotes(supabase, userId);
      const start = payload.start_date as string | null;
      const end = payload.end_date as string | null;
      if (start && end)
        await assignSubstitutesForSick(supabase, userId, start, end);
    }
  } else if (table === "course_units") {
    // New unit without a leader, or an admin clearing the leader → find a substitute.
    // An explicit reassignment to a different person stays untouched.
    if (id == null && !payload.leader) {
      await assignSubstitute(supabase, newUnitId!);
    } else if (
      id != null &&
      "leader" in payload &&
      payload.leader == null &&
      previousLeader != null
    ) {
      await assignSubstitute(supabase, String(id), previousLeader);
    }
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

type SickNote = {
  id: number;
  start_date: string;
  end_date: string;
  text: string | null;
};

/**
 * Merge a user's overlapping or directly adjacent sick notes into single
 * continuous ranges, keeping one row per range and removing the redundant ones.
 */
async function mergeUserSickNotes(
  supabase: DbClient,
  userId: string,
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

  console.log(`User ${userId} meldet sich krank für ${days} Tage: ${text}`);

  const start = berlinToday();
  const { error } = await supabase.from("sick_notes").insert({
    user: userId,
    start_date: start,
    end_date: addDays(start, days),
    text: text.trim() || null,
  });
  if (error) throw new Error(error.message);

  await mergeUserSickNotes(supabase, userId);
  await assignSubstitutesForSick(supabase, userId, start, addDays(start, days));
  revalidatePath("/panel/sickleave");
  revalidatePath("/panel/plan");
}

/**
 * A trainer declines a course they were assigned to as a substitute. Their
 * rejection is recorded (so the engine excludes them on the retry), they are
 * removed as leader, a fresh substitute is searched, and their own
 * notification is neutralised. Authorisation is enforced inside the RPC
 * (only the current user may decline for themselves).
 */
export async function declineSubstitute(unitId: string) {
  const { userId } = await getSession();
  const supabase = await createClient();

  await assignSubstitute(supabase, unitId, userId, true);

  // Defuse the request notification so its button disappears (own-row update).
  await supabase
    .from("notifications")
    .update({ kind: "INFO", is_read: true })
    .eq("user", userId)
    .eq("unit", unitId)
    .eq("kind", "SUBSTITUTE_REQUEST");

  revalidatePath("/panel/notifications");
  revalidatePath("/panel/plan");
}
