import WeekCalendar from "@/components/WeekCalendar";
import { requireProfile } from "@/lib/session";

export default async function PanelHome() {
  const { userId } = await requireProfile();

  return <WeekCalendar userId={userId} />;
}
