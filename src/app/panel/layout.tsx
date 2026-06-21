import Sidebar from "@/components/sidebar";
import { getSession } from "@/lib/session";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, hasProfile } = await getSession();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} isApproved={hasProfile} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
