import type { createClient } from "@/lib/supabase-server";

type DbClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Run the substitution engine for a single course unit. Finds an available
 * trainer (excluding the outgoing person, prior rejecters, the sick and
 * time-conflicting, respecting weekly hours), writes them as `leader` and
 * notifies them — or warns all admins if nobody is available. All of this
 * happens inside the `assign_substitute` SECURITY DEFINER function, which is
 * the only way to satisfy RLS (substitute_rejections is fully locked,
 * notifications has no INSERT policy, course_units writes are admin-only).
 *
 * @param outgoing         the trainer being replaced (excluded from the search)
 * @param recordRejection  true only for an explicit decline — adds the outgoing
 *                         person to `substitute_rejections` for this unit
 */
export async function assignSubstitute(
  supabase: DbClient,
  unitId: string,
  outgoing: string | null = null,
  recordRejection = false,
) {
  const { error } = await supabase.rpc("assign_substitute", {
    p_unit: unitId,
    p_outgoing: outgoing,
    p_record_rejection: recordRejection,
  });
  if (error) throw new Error(error.message);
}

/**
 * Reassign every course a trainer leads within the Berlin date range
 * [start, end] away from them — used when they are reported sick. Idempotent:
 * units that have already been reassigned no longer have this leader and are
 * skipped.
 */
export async function assignSubstitutesForSick(
  supabase: DbClient,
  profileId: string,
  start: string, // YYYY-MM-DD
  end: string, // YYYY-MM-DD
) {
  const { error } = await supabase.rpc("assign_substitutes_for_sick", {
    p_user: profileId,
    p_start: start,
    p_end: end,
  });
  if (error) throw new Error(error.message);
}
