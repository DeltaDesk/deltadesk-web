import type { ReactNode } from "react";
import {
  IconBuildingStore,
  IconDoor,
  IconBarbell,
  IconCalendarEvent,
  IconHeartbeat,
  type Icon,
} from "@tabler/icons-react";
import { formatDate, formatDateTime } from "./datetime";

// Rows are generic record bags shaped by each resource's `select` string.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export interface Option {
  value: string;
  label: string;
}

export type OptionsMap = Record<string, Option[]>;

export type FieldType = "text" | "textarea" | "number" | "datetime" | "date" | "select";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Key into the OptionsMap for `select` fields. */
  optionsKey?: string;
}

export interface ColumnDef {
  label: string;
  /** Optional fixed width class for the table header/cell. */
  className?: string;
  render: (row: Row) => ReactNode;
}

export interface ResourceDef {
  key: string;
  table: string;
  /** Plural label, e.g. for the tab and counts. */
  label: string;
  /** Singular label, e.g. for the "add" button and dialog titles. */
  singular: string;
  icon: Icon;
  /** PostgREST select string used to load the rows (incl. embeds for display). */
  select: string;
  orderBy: string;
  orderDesc?: boolean;
  columns: ColumnDef[];
  fields: FieldDef[];
  /** Optional cross-field validation; returns an error message or null. */
  validate?: (values: Record<string, string>) => string | null;
}

const muted = (value: ReactNode) =>
  value ? value : <span className="text-gray-400">–</span>;

export const RESOURCES: ResourceDef[] = [
  {
    key: "studios",
    table: "studios",
    label: "Studios",
    singular: "Studio",
    icon: IconBuildingStore,
    select: "id, name, city",
    orderBy: "name",
    columns: [
      { label: "Name", render: (r) => r.name },
      { label: "Stadt", render: (r) => muted(r.city) },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "city", label: "Stadt", type: "text", required: true },
    ],
  },
  {
    key: "rooms",
    table: "rooms",
    label: "Räume",
    singular: "Raum",
    icon: IconDoor,
    select: "id, room, studio, studios(name)",
    orderBy: "room",
    columns: [
      { label: "Raum", render: (r) => r.room },
      { label: "Studio", render: (r) => muted(r.studios?.name) },
    ],
    fields: [
      { key: "room", label: "Raum", type: "text", required: true },
      {
        key: "studio",
        label: "Studio",
        type: "select",
        required: true,
        optionsKey: "studios",
      },
    ],
  },
  {
    key: "course_types",
    table: "course_types",
    label: "Kursarten",
    singular: "Kursart",
    icon: IconBarbell,
    select: "id, name, description",
    orderBy: "name",
    columns: [
      { label: "Name", render: (r) => r.name },
      { label: "Beschreibung", render: (r) => muted(r.description) },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Beschreibung", type: "textarea" },
    ],
  },
  {
    key: "course_units",
    table: "course_units",
    label: "Kurseinheiten",
    singular: "Kurseinheit",
    icon: IconCalendarEvent,
    select:
      "id, time_start, duration_mins, course_type, room, leader, type_info:course_type(name), room_info:room(room), leader_info:leader(name)",
    orderBy: "time_start",
    columns: [
      { label: "Beginn", render: (r) => formatDateTime(r.time_start) },
      { label: "Dauer", render: (r) => `${r.duration_mins ?? "?"} Min.` },
      { label: "Kursart", render: (r) => muted(r.type_info?.name) },
      { label: "Raum", render: (r) => muted(r.room_info?.room) },
      { label: "Leitung", render: (r) => muted(r.leader_info?.name) },
    ],
    fields: [
      { key: "time_start", label: "Beginn", type: "datetime", required: true },
      {
        key: "duration_mins",
        label: "Dauer (Min.)",
        type: "number",
        required: true,
        placeholder: "60",
      },
      {
        key: "course_type",
        label: "Kursart",
        type: "select",
        optionsKey: "course_types",
      },
      { key: "room", label: "Raum", type: "select", optionsKey: "rooms" },
      { key: "leader", label: "Leitung", type: "select", optionsKey: "profiles" },
    ],
  },
  {
    key: "sick_notes",
    table: "sick_notes",
    label: "Krankmeldungen",
    singular: "Krankmeldung",
    icon: IconHeartbeat,
    select: "id, created_at, user, text, start_date, end_date, user_info:user(name)",
    orderBy: "start_date",
    orderDesc: true,
    columns: [
      { label: "Mitarbeiter", render: (r) => muted(r.user_info?.name) },
      {
        label: "Zeitraum",
        render: (r) => `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`,
      },
      { label: "Notiz", render: (r) => muted(r.text) },
      { label: "Eingereicht", render: (r) => formatDateTime(r.created_at) },
    ],
    fields: [
      {
        key: "user",
        label: "Mitarbeiter",
        type: "select",
        required: true,
        optionsKey: "profiles",
      },
      { key: "start_date", label: "Von", type: "date", required: true },
      { key: "end_date", label: "Bis", type: "date", required: true },
      { key: "text", label: "Notiz", type: "textarea" },
    ],
    validate: (v) =>
      v.start_date && v.end_date && v.end_date < v.start_date
        ? "Das Enddatum muss am oder nach dem Startdatum liegen"
        : null,
  },
];
