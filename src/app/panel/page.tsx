import WeekCalendar from "@/components/WeekCalendar";
import { requireProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase-server";
import { getMondayOf, addDays } from "@/lib/time";
import { type CourseUnit } from "@/lib/models/courses";

const COURSE_UNIT_SELECT = `
  id, time_start, duration_mins, leader,
  course_types!course_type ( name ),
  rooms!room ( room, studios!studio ( name, city ) )
` as const;

export default async function PanelHome() {
  const { userId } = await requireProfile();
  const supabase = await createClient();

  const weekStart = getMondayOf(new Date());
  const weekEnd = addDays(weekStart, 7);

  const { data, error } = await supabase
    .from("course_units")
    .select(COURSE_UNIT_SELECT)
    .gte("time_start", weekStart.toISOString())
    .lt("time_start", weekEnd.toISOString())
    .eq("leader", userId);

  if (error) console.error("Error fetching course units:", error);

  const initialUnits = (data as unknown as CourseUnit[]) ?? [];

  return <WeekCalendar weekStart={weekStart} initialUnits={initialUnits} />;
}
