"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { declineSubstitute } from "../plan/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  IconInfoCircle,
  IconCircleCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconBell,
  IconMailOpened,
  IconTrash,
  IconUserOff,
} from "@tabler/icons-react";

type Severity = "INFO" | "SUCCESS" | "WARN" | "ERROR";

export interface Notification {
  id: string;
  created_at: string;
  severity: Severity;
  title: string;
  text: string | null;
  is_read: boolean;
  unit: string | null;
  kind: "INFO" | "SUBSTITUTE_REQUEST";
}

const severityConfig: Record<
  Severity,
  { icon: React.ElementType; bg: string; border: string; iconColor: string }
> = {
  INFO: {
    icon: IconInfoCircle,
    bg: "bg-blue-50",
    border: "border-blue-400",
    iconColor: "text-blue-500",
  },
  SUCCESS: {
    icon: IconCircleCheck,
    bg: "bg-green-50",
    border: "border-green-400",
    iconColor: "text-green-500",
  },
  WARN: {
    icon: IconAlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-400",
    iconColor: "text-amber-500",
  },
  ERROR: {
    icon: IconAlertCircle,
    bg: "bg-red-50",
    border: "border-red-400",
    iconColor: "text-red-500",
  },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `Vor ${diffMins} Min.`;
  if (diffHours < 24) return `Vor ${diffHours} Std.`;
  if (diffDays < 7) return `Vor ${diffDays} Tag${diffDays !== 1 ? "en" : ""}`;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function NotificationList({ initial }: { initial: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [pending, startTransition] = useTransition();
  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  function decline(n: Notification) {
    if (!n.unit) return;
    startTransition(async () => {
      try {
        await declineSubstitute(n.unit!);
        setNotifications((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, is_read: true, kind: "INFO" } : x
          )
        );
        toast.success("Du wurdest ausgetragen. Eine Vertretung wird gesucht.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Ablehnen fehlgeschlagen"
        );
      }
    });
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function deleteAll() {
    startTransition(async () => {
      const ids = notifications.map((n) => n.id);
      if (!ids.length) return;
      const { error } = await supabase.from("notifications").delete().in("id", ids);
      if (error) {
        toast.error("Löschen fehlgeschlagen");
        return;
      }
      setNotifications([]);
      toast.success("Alle Benachrichtigungen gelöscht");
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <IconBell size={40} stroke={1.2} />
        <p className="text-sm">Keine Benachrichtigungen vorhanden</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      {notifications.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <IconTrash size={16} stroke={2} />
                Alle löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alle Benachrichtigungen löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle {notifications.length} Benachrichtigungen werden entfernt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  onClick={(e) => {
                    e.preventDefault();
                    deleteAll();
                  }}
                  className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                >
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <IconMailOpened size={16} stroke={2} />
              Alle als gelesen markieren
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {notifications.map((n) => {
          const cfg = severityConfig[n.severity];
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={clsx(
                "rounded-xl px-4 py-3.5 shadow-sm transition-opacity duration-300",
                cfg.bg,
                cfg.border,
                n.is_read ? "opacity-40" : "opacity-100"
              )}
            >
              <div className="flex items-start gap-3">
                <Icon
                  size={20}
                  stroke={2}
                  className={clsx("shrink-0 mt-0.5", cfg.iconColor)}
                />
                
                {/* Main content wrapper */}
                <div className="flex flex-1 items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    {n.text && (
                      <p className="mt-0.5 text-sm text-gray-600">{n.text}</p>
                    )}
                    <span className="block mt-1 text-xs text-gray-400">
                      {formatDate(n.created_at)}
                    </span>

                    {n.kind === "SUBSTITUTE_REQUEST" && n.unit && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <IconUserOff size={16} stroke={2} />
                            Ablehnen / sich austragen lassen
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Kurs ablehnen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Du wirst aus diesem Kurs ausgetragen und es wird automatisch
                              eine andere Vertretung gesucht. Diese Aktion kann nicht
                              rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={pending}
                              onClick={(e) => {
                                e.preventDefault();
                                decline(n);
                              }}
                              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                            >
                              Ablehnen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {/* Action button on the right */}
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white/50 px-2 py-1 rounded-md border border-gray-200"
                      title="Als gelesen markieren"
                    >
                      <IconMailOpened size={16} stroke={2} />
                      Gelesen
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}