import WeekCalendar from "@/components/WeekCalendar";
import { getSession } from "@/lib/session";

export default async function PanelHome() {
  const { userId, isAdmin } = await getSession();

  return <WeekCalendar userId={userId} isAdmin={isAdmin} />;
}
