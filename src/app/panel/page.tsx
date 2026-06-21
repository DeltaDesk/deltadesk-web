import WeekCalendar from "@/components/WeekCalendar";
import { requireProfile } from "@/lib/session";

export default async function PanelHome() {
  const { userId, isAdmin } = await requireProfile();

  return <WeekCalendar userId={userId} isAdmin={isAdmin} />;
}
