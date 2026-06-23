"use client";

import { useEffect, useState } from "react";
import { IconChevronRight, IconClock } from "@tabler/icons-react";
import { type CourseUnit } from "@/lib/models/courses";
import { cityColor } from "@/lib/cityColor";

const DE_DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** "Heute · 14:00" / "Morgen · 10:00" / "Mi · 09:30" */
function whenLabel(start: Date, now: Date): string {
  const time = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (isSameDay(start, now)) return `Heute · ${time}`;
  if (isSameDay(start, tomorrow)) return `Morgen · ${time}`;
  return `${DE_DAYS[start.getDay()]} · ${time}`;
}

/**
 * Mobile-only banner that surfaces the next upcoming course so users with a
 * small viewport know something is coming up – even when it's off-screen.
 * Tapping it smooth-scrolls the calendar to that course.
 */
export default function MobileUpNext({ units }: { units: CourseUnit[] }) {
  // Compute "now" only after mount to avoid SSR/hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), [units]);

  if (!now) return null;

  const upcoming = units
    .filter((u) => new Date(u.time_start).getTime() > now.getTime())
    .sort((a, b) => new Date(a.time_start).getTime() - new Date(b.time_start).getTime());

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const start = new Date(next.time_start);
  const c = cityColor(next.rooms?.studios?.city);
  const courseName = next.course_types?.name ?? "Kurs";
  const remaining = upcoming.length - 1;

  function scrollToNext() {
    document
      .getElementById(`unit-${next.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }

  return (
    <div className="md:hidden shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
      <button
        onClick={scrollToNext}
        className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm active:scale-[.99] transition-transform"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: c.bg, color: c.accent }}
        >
          <IconClock size={18} stroke={2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.accent }} />
            Nächster Kurs
            {remaining > 0 && (
              <span className="ml-auto text-[11px] font-normal text-gray-400">
                +{remaining} diese Woche
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{courseName}</p>
          <p className="truncate text-xs font-medium" style={{ color: c.sub }}>
            {whenLabel(start, now)}
          </p>
        </div>

        <IconChevronRight size={18} stroke={2} className="shrink-0 text-gray-300" />
      </button>
    </div>
  );
}
