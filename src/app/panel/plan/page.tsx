import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/session";
import { RESOURCES, type Row, type OptionsMap } from "./resources";
import PlanManager from "./PlanManager";

export default async function PlanungPage() {
  const { isAdmin } = await getSession();
  if (!isAdmin) redirect("/panel");

  const supabase = await createClient();

  // Load every resource's rows in parallel.
  const entries = await Promise.all(
    RESOURCES.map(async (resource) => {
      const { data, error } = await supabase
        .from(resource.table)
        .select(resource.select)
        .order(resource.orderBy, { ascending: !resource.orderDesc });
      if (error) console.error(`Error loading ${resource.table}:`, error.message);
      return [resource.key, (data as Row[] | null) ?? []] as const;
    })
  );
  const data = Object.fromEntries(entries) as Record<string, Row[]>;

  // Load the option lists used by the select fields.
  const [studios, courseTypes, rooms, profiles] = await Promise.all([
    supabase.from("studios").select("id, name").order("name"),
    supabase.from("course_types").select("id, name").order("name"),
    supabase.from("rooms").select("id, room, studios(name)").order("room"),
    supabase.from("profiles").select("id, name").order("name"),
  ]);

  const options: OptionsMap = {
    studios: (studios.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    course_types: (courseTypes.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    rooms: ((rooms.data as Row[] | null) ?? []).map((r) => ({
      value: r.id,
      label: r.studios?.name ? `${r.room} · ${r.studios.name}` : r.room,
    })),
    profiles: (profiles.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  };

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Planung</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Räume, Kurse, Studios und Krankmeldungen verwalten
        </p>
      </header>

      <div className="p-6">
        <PlanManager data={data} options={options} />
      </div>
    </div>
  );
}
