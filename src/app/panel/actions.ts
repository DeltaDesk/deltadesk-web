"use server";

import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase-server";
import { type CourseUnit } from "@/lib/models/courses";
import { addDays } from "@/lib/time";

const COURSE_UNIT_SELECT = `
  id, time_start, duration_mins, leader,
  course_types!course_type ( name ),
  rooms!room ( room, studios!studio ( name, city ) )
` as const;

export async function fetchWeekUnits(weekStart: Date): Promise<CourseUnit[]> {
  const { userId } = await getSession();
  const supabase = await createClient();
  const weekEnd = addDays(weekStart, 7);

  const { data, error } = await supabase
    .from("course_units")
    .select(COURSE_UNIT_SELECT)
    .gte("time_start", weekStart.toISOString())
    .lt("time_start", weekEnd.toISOString())
    .eq("leader", userId);

  if (error) {
    console.error("Error fetching course units:", error);
    return [];
  }

  return (data as unknown as CourseUnit[]) ?? [];
}
