"use client";

import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconCalendarEvent } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase-client";
import CourseBlock from "./CourseBlock";
import { type CourseUnit } from "@/lib/models/courses";

const DAY_START = 10;
const DAY_END = 20;
const SLOT_HEIGHT = 28; // px per 30 min
const TOTAL_SLOTS = (DAY_END - DAY_START) * 2;

const supabase = createClient();

const DE_DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const DE_MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const start = `${monday.getDate()}. ${sameMonth ? "" : DE_MONTHS[monday.getMonth()] + " "}${monday.getFullYear() !== sunday.getFullYear() ? monday.getFullYear() : ""}`.trim();
  const end = `${sunday.getDate()}. ${DE_MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`;
  return `${start} – ${end}`;
}

interface WeekCalendarProps {
  userId: string;
  isAdmin: boolean;
}

export default function WeekCalendar({ userId, isAdmin }: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const weekEnd = addDays(weekStart, 7);

      let query = supabase
        .from("course_units")
        .select(`
          id, time_start, duration_mins, leader,
          course_types!course_type ( name ),
          rooms!room ( room, studios!studio ( name ) )
        `)
        .gte("time_start", weekStart.toISOString())
        .lt("time_start", weekEnd.toISOString());

      if (!isAdmin) {
        query = query.eq("leader", userId);
      }

      const { data, error: supabaseError } = await query;
      if (cancelled) return;

      if (supabaseError) {
        console.error("Error fetching course units:", supabaseError);
        setUnits([]);
      } else {
        setUnits((data as unknown as CourseUnit[]) ?? []);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [weekStart, isAdmin, userId]);

  const today = getMondayOf(new Date());
  const isCurrentWeek = weekStart.getTime() === today.getTime();

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

  function unitsByDay(day: Date): CourseUnit[] {
    const dayStr = day.toDateString();
    return units.filter((u) => new Date(u.time_start).toDateString() === dayStr);
  }

  return (
    <div className="flex flex-col h-full bg-white max-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 bg-white z-30">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Stundenplan</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatWeekRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekStart(today)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Heute
            </button>
          )}
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Vorherige Woche"
          >
            <IconChevronLeft size={20} stroke={2} />
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Nächste Woche"
          >
            <IconChevronRight size={20} stroke={2} />
          </button>
        </div>
      </div>

      {/* 2. Modified Container: Added flex-1, min-h-0, overflow-y-auto to allow vertical scrolling inside */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
            Lädt…
          </div>
        ) : (
          <div className="min-w-160 relative">
            {/* 3. Changed sticky container settings for Day Headers so they stick to the top of THIS container during vertical scroll */}
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20">
              {/* Time gutter */}
              <div className="w-14 shrink-0 bg-white" />
              {days.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className="flex-1 min-w-30 text-center py-2 border-l border-gray-100"
                  >
                    <span className="text-xs text-gray-400 font-medium">{DE_DAYS[i]}</span>
                    <p
                      className={`text-sm font-semibold mt-0.5 mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday ? "bg-blue-600 text-white" : "text-gray-800"
                      }`}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time + event grid */}
            <div className="flex">
              {/* Time labels (sticky left) */}
              <div className="w-14 shrink-0 sticky left-0 bg-white z-10">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="flex items-start justify-end pr-2 text-[10px] text-gray-500 font-medium bg-white"
                    style={{ height: SLOT_HEIGHT * 2 }}
                  >
                    <span className="-mt-1.5">{String(h).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-30 relative border-l border-gray-150"
                  style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}
                >
                  {/* Hour lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-gray-150"
                      style={{ top: (h - DAY_START) * 2 * SLOT_HEIGHT }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {hours.map((h) => (
                    <div
                      key={`${h}-half`}
                      className="absolute left-0 right-0 border-t border-gray-50"
                      style={{ top: ((h - DAY_START) * 2 + 1) * SLOT_HEIGHT }}
                    />
                  ))}

                  {/* Course blocks */}
                  {unitsByDay(day).map((unit) => (
                    <CourseBlock
                      key={unit.id}
                      unit={unit}
                      slotHeight={SLOT_HEIGHT}
                      dayStart={DAY_START}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && units.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <IconCalendarEvent size={40} stroke={1.2} />
            <p className="text-sm">Keine Kurse in dieser Woche</p>
          </div>
        )}
      </div>
    </div>
  );
}