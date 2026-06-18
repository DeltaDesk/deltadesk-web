import { redirect } from "next/navigation";
import { IconUsers } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/session";
import EmployeeCard from "@/app/panel/employees/EmployeeCard";
import { type Employee } from "@/lib/models/employees";

export default async function MitarbeiterPage() {
  const { isAdmin } = await getSession();
  if (!isAdmin) redirect("/panel");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, is_admin, working_time_hours, default_studio_name");

  if (error) console.error("Error fetching employees:", error);

  const employees = ((data as Employee[] | null) ?? []).slice().sort((a, b) => {
    if (a.is_admin !== b.is_admin) return a.is_admin ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "", "de");
  });

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Mitarbeiter</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {employees.length} Mitarbeiter insgesamt
        </p>
      </header>

      <div className="p-6">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <IconUsers size={40} stroke={1.2} />
            <p className="text-sm">Keine Mitarbeiter gefunden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
