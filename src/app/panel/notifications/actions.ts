"use server";

import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase-server";

export async function markNotificationAsRead(id: string) {
  const { userId } = await getSession();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user", userId);
}

export async function markAllNotificationsAsRead(ids: string[]) {
  if (!ids.length) return;
  const { userId } = await getSession();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .in("id", ids)
    .eq("user", userId);
}

export async function deleteAllNotifications(ids: string[]) {
  if (!ids.length) return;
  const { userId } = await getSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .in("id", ids)
    .eq("user", userId);
  if (error) throw new Error("Löschen fehlgeschlagen");
}
