import Link from "next/link";
import {
  IconTriangle,
  IconKey,
  IconLayoutDashboard,
  IconCalendarEvent,
  IconAlertTriangle,
  IconClock,
  IconMapPin,
  IconUser,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase-server";
import { cityColor } from "@/lib/cityColor";
import { isoToLocalInput, formatWeekday } from "@/app/panel/plan/datetime";

interface ScheduleRow {
  id: string;
  time_start: string;
  duration_mins: number;
  course_name: string | null;
  room_name: string | null;
  studio_name: string | null;
  city: string | null;
  leader_name: string | null;
  cancelled: boolean;
}

const DAYS_AHEAD = 4;

/** "HH:MM" (Europe/Berlin) for an ISO timestamp. */
function berlinTime(iso: string): string {
  return isoToLocalInput(iso).slice(11, 16);
}

/** "HH:MM – HH:MM" start/end label in Europe/Berlin. */
function timeRange(iso: string, durationMins: number): string {
  const endIso = new Date(new Date(iso).getTime() + durationMins * 60_000).toISOString();
  return `${berlinTime(iso)} – ${berlinTime(endIso)}`;
}

function roomLabel(row: ScheduleRow): string | null {
  if (!row.room_name) return null;
  return row.studio_name ? `${row.room_name} · ${row.studio_name}` : row.room_name;
}

export default async function SchedulePage() {
  const supabase = await createClient();

  const [{ data, error }, { data: { user } }] = await Promise.all([
    supabase.rpc("get_public_schedule", { p_days: DAYS_AHEAD }),
    supabase.auth.getUser(),
  ]);
  if (error) console.error("Error loading public schedule:", error.message);

  const rows = (data as ScheduleRow[] | null) ?? [];
  const cancelled = rows.filter((r) => r.cancelled);
  const active = rows.filter((r) => !r.cancelled);

  // Group active courses by Berlin day, preserving the time-sorted order.
  const groups = new Map<string, ScheduleRow[]>();
  for (const row of active) {
    const day = isoToLocalInput(row.time_start).slice(0, 10);
    const list = groups.get(day);
    if (list) list.push(row);
    else groups.set(day, [row]);
  }

  const cta = user
    ? { href: "/panel", label: "Panel", Icon: IconLayoutDashboard }
    : { href: "/login", label: "Anmelden", Icon: IconKey };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <IconTriangle size={20} stroke={2} className="text-blue-500" />
            <span className="font-space-grotesk text-base font-semibold tracking-tight text-gray-900">
              DeltaDesk
            </span>
          </Link>
          <Link
            href={cta.href}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            <cta.Icon size={17} stroke={2} />
            {cta.label}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Stundenplan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Alle Kurse der nächsten {DAYS_AHEAD} Tage.
        </p>

        {/* Cancelled courses — surfaced at the top in red. */}
        {cancelled.length > 0 && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <IconAlertTriangle size={18} stroke={2} />
              Ausgefallene Kurse
            </h2>
            <ul className="mt-3 space-y-2">
              {cancelled.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-white px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-red-700 line-through decoration-red-400">
                      {row.course_name ?? "Kurs"}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-red-600/90">
                      {formatWeekday(isoToLocalInput(row.time_start).slice(0, 10))},{" "}
                      {timeRange(row.time_start, row.duration_mins)}
                      {roomLabel(row) ? ` · ${roomLabel(row)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                    Fällt aus
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Day-by-day schedule of running courses. */}
        {groups.size === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <IconCalendarEvent size={40} stroke={1.2} />
            <p className="text-sm">Keine Kurse in den nächsten Tagen</p>
          </div>
        ) : (
          <div className="mt-8 space-y-7">
            {[...groups.entries()].map(([day, dayRows]) => (
              <section key={day}>
                <h2 className="sticky top-[57px] z-[5] -mx-4 bg-gray-50/90 px-4 py-1.5 text-sm font-semibold text-gray-900 backdrop-blur">
                  {formatWeekday(day)}
                </h2>
                <ul className="mt-2 space-y-2.5">
                  {dayRows.map((row) => {
                    const c = cityColor(row.city);
                    return (
                      <li
                        key={row.id}
                        className="flex gap-3 rounded-2xl border bg-[var(--c-bg)] p-3.5"
                        style={
                          {
                            "--c-bg": c.bg,
                            borderColor: c.border,
                          } as React.CSSProperties
                        }
                      >
                        <div
                          className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-white/70 py-2 text-center"
                          style={{ color: c.text }}
                        >
                          <span className="text-sm font-bold leading-tight">
                            {berlinTime(row.time_start)}
                          </span>
                          <span className="mt-0.5 text-[10px] font-medium" style={{ color: c.sub }}>
                            {row.duration_mins} Min.
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold" style={{ color: c.text }}>
                            {row.course_name ?? "Kurs"}
                          </p>
                          <div className="mt-1 space-y-0.5" style={{ color: c.sub }}>
                            <p className="flex items-center gap-1.5 text-xs">
                              <IconClock size={13} stroke={2} className="shrink-0" />
                              {timeRange(row.time_start, row.duration_mins)}
                            </p>
                            {roomLabel(row) && (
                              <p className="flex items-center gap-1.5 text-xs">
                                <IconMapPin size={13} stroke={2} className="shrink-0" />
                                <span className="truncate">{roomLabel(row)}</span>
                              </p>
                            )}
                            {row.leader_name && (
                              <p className="flex items-center gap-1.5 text-xs">
                                <IconUser size={13} stroke={2} className="shrink-0" />
                                <span className="truncate">{row.leader_name}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
