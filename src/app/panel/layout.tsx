import Sidebar from "@/components/sidebar";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase-server";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, isAdmin, hasProfile } = await getSession();

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user", userId)
    .eq("is_read", false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} isApproved={hasProfile} notificationCount={count ?? 0} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
