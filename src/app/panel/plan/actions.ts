"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/session";

/** Columns that may be written per table — the security boundary for mutations. */
const EDITABLE: Record<string, string[]> = {
  studios: ["name", "city"],
  rooms: ["room", "studio"],
  course_types: ["name", "description"],
  course_units: ["time_start", "duration_mins", "course_type", "room", "leader"],
  sick_notes: ["user", "text"],
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
