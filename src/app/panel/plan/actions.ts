"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/session";
import { addDays, berlinToday, isoToLocalInput, localInputToIso } from "./datetime";
import { assignSubstitute, assignSubstitutesForSick } from "./substitution";
import type { SaveDecision, SickConflict } from "./resources";

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

/**
 * Detect whether making `leader` the head of a unit starting at `timeStart`
 * clashes with one of their sick notes. Returns the details the form needs to
 * confirm, or null when the assignment is unproblematic.
 * - `overlap`: the unit's Berlin date lies inside a sick range.
 * - `warn`: a sick note ends exactly the day before the unit.
 */
async function findSickConflict(
  supabase: DbClient,
  leader: string,
  timeStart: string,
): Promise<SickConflict | null> {
  const unitDate = isoToLocalInput(timeStart).slice(0, 10); // YYYY-MM-DD (Berlin)
  const dayBefore = addDays(unitDate, -1);

  // Notes that either cover the unit's date or end the day right before it.
  const { data } = await supabase
    .from("sick_notes")
    .select("start_date, end_date, user_info:user(name)")
    .eq("user", leader)
    .lte("start_date", unitDate)
    .gte("end_date", dayBefore)
    .order("end_date", { ascending: false });

  const notes = data ?? [];
  if (notes.length === 0) return null;

  const name =
    (notes[0].user_info as { name?: string } | null)?.name ?? "Mitarbeiter";

  // Overlap takes priority over the day-before warning.
  const overlap = notes.find(
    (n) => n.start_date <= unitDate && n.end_date >= unitDate,
  );
  if (overlap)
    return { kind: "overlap", name, until: overlap.end_date, unitDate };

  const warn = notes.find((n) => n.end_date === dayBefore);
  if (warn) return { kind: "warn", name, until: warn.end_date, unitDate };

  return null;
}

export async function saveRow(
  table: string,
  id: RowId | null,
  values: Record<string, unknown>,
  decision?: SaveDecision,
): Promise<{ error: string } | { confirm: SickConflict } | undefined> {
  try {
    await requireAdmin();
    const columns = assertTable(table);
    const supabase = await createClient();
    const payload = sanitize(columns, values);

    if (table === "course_units") {
      const leader = payload.leader as string | null;
      const timeStart = payload.time_start as string | null;

      // Sick-leave guard: assigning a sick employee needs explicit confirmation.
      // Without a decision yet, hand the conflict back so the form can ask.
      if (leader && timeStart && !decision) {
        const conflict = await findSickConflict(supabase, leader, timeStart);
        if (conflict) return { confirm: conflict };
      }

      // "Ersatz suchen": save the unit without the sick leader; the engine picks
      // a replacement after the row is written.
      if (decision === "substitute") payload.leader = null;

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
      // Admin assigned a sick employee and chose "Ersatz suchen" → the leader was
      // nulled above; let the engine fill the now-empty slot.
      if (decision === "substitute") {
        await assignSubstitute(supabase, id == null ? newUnitId! : String(id));
      } else if (id == null && !payload.leader) {
        // New unit created without a leader → find a substitute.
        await assignSubstitute(supabase, newUnitId!);
      } else if (
        id != null &&
        "leader" in payload &&
        payload.leader == null &&
        previousLeader != null
      ) {
        // Admin cleared the leader of an existing unit → find a substitute.
        await assignSubstitute(supabase, String(id), previousLeader);
      }
    }

    revalidatePath("/panel/plan");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Speichern fehlgeschlagen" };
  }
}

export async function deleteRow(table: string, id: RowId): Promise<{ error: string } | undefined> {
  try {
    await requireAdmin();
    assertTable(table);
    const supabase = await createClient();

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/panel/plan");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Löschen fehlgeschlagen" };
  }
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
export async function submitSickLeave(days: number, text: string): Promise<{ error: string } | undefined> {
  try {
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
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Einreichen fehlgeschlagen" };
  }
}

export interface AutoFillOptions {
  /** Total weekly course hours to schedule (each course is a 60-minute slot). */
  hoursPerWeek: number;
  /** ISO weekdays (1 = Mon … 7 = Sun) on which courses may be placed. */
  weekdays: number[];
  /** Earliest course start as "HH:MM" (Europe/Berlin). */
  minTime: string;
  /** Latest course end as "HH:MM" (Europe/Berlin). */
  maxTime: string;
}

export type AutoFillResult =
  | { error: string }
  | { created: number; assigned: number; cancelled: number; capped: boolean };

/** Parse an "HH:MM" string into minutes since midnight, or null if malformed. */
function parseHm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

const COURSE_LEN_MINS = 60;

/**
 * Fill the current Europe/Berlin week (Mon–Sun) with course units, then let the
 * substitution engine staff each one. Places one 60-minute course per time slot,
 * cycling through the existing course types and rooms, on the chosen weekdays
 * within [minTime, maxTime). Only future, still-empty slots are used, so the
 * action is safe to re-run. Each created unit is handed to `assign_substitute`,
 * which picks an available trainer (skipping the sick and those over their
 * weekly hours) or leaves the slot leaderless — i.e. cancelled.
 */
export async function autoFillSchedule(opts: AutoFillOptions): Promise<AutoFillResult> {
  try {
    await requireAdmin();

    const hours = Math.floor(opts.hoursPerWeek);
    if (!Number.isFinite(hours) || hours < 1) {
      throw new Error("Bitte eine gültige Stundenzahl pro Woche angeben.");
    }
    const weekdays = [...new Set(opts.weekdays)].filter((d) => d >= 1 && d <= 7);
    if (weekdays.length === 0) {
      throw new Error("Bitte mindestens einen Wochentag auswählen.");
    }
    const minM = parseHm(opts.minTime);
    const maxM = parseHm(opts.maxTime);
    if (minM == null || maxM == null) {
      throw new Error("Ungültige Uhrzeit.");
    }
    if (maxM - minM < COURSE_LEN_MINS) {
      throw new Error("Das Zeitfenster muss mindestens eine Stunde umfassen.");
    }

    const supabase = await createClient();

    // Course types are required (each unit cycles through them); rooms optional.
    const [{ data: typeRows }, { data: roomRows }] = await Promise.all([
      supabase.from("course_types").select("id").order("name"),
      supabase.from("rooms").select("id").order("room"),
    ]);
    const courseTypes = (typeRows ?? []).map((r) => r.id as string);
    const rooms = (roomRows ?? []).map((r) => r.id as string);
    if (courseTypes.length === 0) {
      throw new Error("Keine Kursarten vorhanden. Bitte zuerst Kursarten anlegen.");
    }

    // Current Berlin week's Monday (ISO, Monday-based — matches the weekly-hours
    // window used by the substitution engine).
    const today = berlinToday();
    const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0=Sun … 6=Sat
    const isoDow = dow === 0 ? 7 : dow; // 1=Mon … 7=Sun
    const monday = addDays(today, -(isoDow - 1));

    const nowMs = Date.now();

    // Existing units this week → block their exact start times so re-runs and
    // manual courses are never doubled up (one course per slot ⇒ no clashes).
    const weekStartIso = localInputToIso(`${monday}T00:00`)!;
    const weekEndIso = localInputToIso(`${addDays(monday, 7)}T00:00`)!;
    const { data: existing } = await supabase
      .from("course_units")
      .select("time_start")
      .gte("time_start", weekStartIso)
      .lt("time_start", weekEndIso);
    const occupied = new Set<number>(
      (existing ?? [])
        .map((u) => (u.time_start ? new Date(u.time_start).getTime() : NaN))
        .filter((n) => !Number.isNaN(n)),
    );

    // Build each enabled day's list of free, future slot ISO times.
    const slotsByDay: string[][] = [];
    for (const wd of weekdays.sort((a, b) => a - b)) {
      const date = addDays(monday, wd - 1);
      const daySlots: string[] = [];
      for (let m = minM; m + COURSE_LEN_MINS <= maxM; m += COURSE_LEN_MINS) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        const iso = localInputToIso(`${date}T${hh}:${mm}`);
        if (!iso) continue;
        const ms = new Date(iso).getTime();
        if (ms <= nowMs || occupied.has(ms)) continue;
        daySlots.push(iso);
      }
      slotsByDay.push(daySlots);
    }

    // Interleave across days (day0 09:00, day1 09:00, … day0 10:00, …) so the
    // courses spread over the week rather than piling onto the first day.
    const chosen: string[] = [];
    const maxLen = Math.max(0, ...slotsByDay.map((d) => d.length));
    for (let i = 0; i < maxLen && chosen.length < hours; i++) {
      for (const day of slotsByDay) {
        if (i < day.length) {
          chosen.push(day[i]);
          if (chosen.length >= hours) break;
        }
      }
    }

    if (chosen.length === 0) {
      throw new Error(
        "Keine freien Zeitfenster in dieser Woche. Eventuell sind alle passenden Zeiten bereits belegt oder vergangen.",
      );
    }

    // Insert the units (leaderless), cycling course types and rooms.
    const payload = chosen.map((iso, i) => ({
      time_start: iso,
      duration_mins: COURSE_LEN_MINS,
      course_type: courseTypes[i % courseTypes.length],
      room: rooms.length ? rooms[i % rooms.length] : null,
      leader: null as string | null,
    }));
    const { data: inserted, error } = await supabase
      .from("course_units")
      .insert(payload)
      .select("id");
    if (error) throw new Error(error.message);

    // Staff each new unit via the substitution engine; a null result means no
    // eligible trainer was available → the course is effectively cancelled.
    let assigned = 0;
    for (const unit of inserted ?? []) {
      const chosenLeader = await assignSubstitute(supabase, unit.id as string);
      if (chosenLeader) assigned += 1;
    }
    const created = inserted?.length ?? 0;

    revalidatePath("/panel/plan");
    revalidatePath("/schedule");

    return {
      created,
      assigned,
      cancelled: created - assigned,
      capped: chosen.length < hours,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Füllen fehlgeschlagen" };
  }
}

/**
 * A trainer declines a course they were assigned to as a substitute. Their
 * rejection is recorded (so the engine excludes them on the retry), they are
 * removed as leader, a fresh substitute is searched, and their own
 * notification is neutralised. Authorisation is enforced inside the RPC
 * (only the current user may decline for themselves).
 */
export async function declineSubstitute(unitId: string): Promise<{ error: string } | undefined> {
  try {
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
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ablehnen fehlgeschlagen" };
  }
}
