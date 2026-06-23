import { createClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import NotificationList, { type Notification } from "./NotificationList";

export default async function BenachrichtigungenPage() {
  const { userId } = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, created_at, severity, title, text, is_read, unit, kind")
    .eq("user", userId)
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching notifications:", error);

  const notifications = (data as Notification[] | null) ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">Benachrichtigungen</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {unreadCount > 0
            ? `${unreadCount} ungelesen`
            : "Alle Benachrichtigungen gelesen"}
        </p>
      </header>

      <NotificationList initial={notifications} />
    </div>
  );
}
