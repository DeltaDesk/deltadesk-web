import { createClient } from "@/lib/supabase-server";
import WeekCalendar from "@/components/WeekCalendar";

export default async function PanelHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("login", user.id)
      .maybeSingle();
    isAdmin = data?.is_admin === true;
  }

  return <WeekCalendar userId={user?.id ?? ""} isAdmin={isAdmin} />;
}
