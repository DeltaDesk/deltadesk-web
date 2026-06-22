"use client";

import { useState, useTransition } from "react";
import { IconChevronLeft, IconChevronRight, IconCalendarEvent } from "@tabler/icons-react";
import CourseBlock from "./CourseBlock";
import { type CourseUnit } from "@/lib/models/courses";
import { getMondayOf, addDays, formatWeekRange } from "@/lib/time";
import { fetchWeekUnits } from "@/app/panel/actions";

const DAY_START = 10;
const DAY_END = 20;
const SLOT_HEIGHT = 28;
const TOTAL_SLOTS = (DAY_END - DAY_START) * 2;

const DE_DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface WeekCalendarProps {
  weekStart: Date;
  initialUnits: CourseUnit[];
}

export default function WeekCalendar({ weekStart: initialWeekStart, initialUnits }: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(initialWeekStart);
  const [units, setUnits] = useState<CourseUnit[]>(initialUnits);
  const [pending, startTransition] = useTransition();

  function changeWeek(newWeekStart: Date) {
    setWeekStart(newWeekStart);
    startTransition(async () => {
      const data = await fetchWeekUnits(newWeekStart);
      setUnits(data);
    });
  }

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
              onClick={() => changeWeek(today)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Heute
            </button>
          )}
          <button
            onClick={() => changeWeek(addDays(weekStart, -7))}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Vorherige Woche"
          >
            <IconChevronLeft size={20} stroke={2} />
          </button>
          <button
            onClick={() => changeWeek(addDays(weekStart, 7))}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Nächste Woche"
          >
            <IconChevronRight size={20} stroke={2} />
          </button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white transition-opacity duration-150 ${pending ? "opacity-60" : ""}`}>
        <div className="min-w-160 relative">
          {/* Day headers */}
          <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20">
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

        {/* Empty state */}
        {!pending && units.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <IconCalendarEvent size={40} stroke={1.2} />
            <p className="text-sm">Keine Kurse in dieser Woche</p>
          </div>
        )}
      </div>
    </div>
  );
}