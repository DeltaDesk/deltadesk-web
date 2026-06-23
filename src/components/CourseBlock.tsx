import { IconMapPin, IconClock } from "@tabler/icons-react";
import { type CourseUnit } from "@/lib/models/courses";
import { cityColor } from "@/lib/cityColor";

interface CourseBlockProps {
  unit: CourseUnit;
  slotHeight: number;
  dayStart: number;
}

export default function CourseBlock({ unit, slotHeight, dayStart }: CourseBlockProps) {
  const start = new Date(unit.time_start);
  const startHour = start.getHours();
  const startMin = start.getMinutes();

  const topSlots = (startHour - dayStart) * 2 + startMin / 30;
  const heightSlots = unit.duration_mins / 30;

  const top = topSlots * slotHeight;
  const height = heightSlots * slotHeight;

  const endDate = new Date(start.getTime() + unit.duration_mins * 60000);
  const timeLabel = `${pad(startHour)}:${pad(startMin)} – ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
  const courseName = unit.course_types?.name ?? "Kurs";
  const roomLabel = unit.rooms
    ? `${unit.rooms.room}${unit.rooms.studios ? `, ${unit.rooms.studios.name}` : ""}`
    : null;

  const c = cityColor(unit.rooms?.studios?.city);

  return (
    <div
      id={`unit-${unit.id}`}
      className="absolute left-1 right-1 border rounded-md px-2 py-1 overflow-hidden cursor-default select-none transition-colors bg-[var(--c-bg)] hover:bg-[var(--c-bg-hover)] border-[var(--c-border)]"
      style={
        {
          top,
          height: Math.max(height, slotHeight),
          "--c-bg": c.bg,
          "--c-bg-hover": c.bgHover,
          "--c-border": c.border,
        } as React.CSSProperties
      }
    >
      <p className="text-xs font-semibold truncate leading-tight" style={{ color: c.text }}>
        {courseName}
      </p>
      <p className="flex items-center gap-0.5 text-[10px] mt-0.5 truncate" style={{ color: c.sub }}>
        <IconClock size={10} stroke={2} className="shrink-0" />
        {timeLabel}
      </p>
      {roomLabel && (
        <p className="flex items-center gap-0.5 text-[10px] truncate" style={{ color: c.sub }}>
          <IconMapPin size={10} stroke={2} className="shrink-0" />
          {roomLabel}
        </p>
      )}
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
