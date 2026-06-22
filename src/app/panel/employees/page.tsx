import { redirect } from "next/navigation";
import { IconUsers, IconUserCheck } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/session";
import EmployeeCard from "@/app/panel/employees/EmployeeCard";
import AcceptEmployeeDialog from "@/app/panel/employees/AcceptEmployeeDialog";
import { type Employee, type WorkingTimeOption } from "@/lib/models/employees";

interface PendingUser {
  id: string;
  email: string;
  created_at: string;
}

export default async function MitarbeiterPage() {
  const { isAdmin, userId } = await getSession();
  if (!isAdmin) redirect("/panel");

  const supabase = await createClient();

  const [{ data: employeesRaw, error }, { data: pendingRaw }, { data: workingTimeRaw }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, name, is_admin, working_time, working_time_hours, default_studio_name"),
      supabase.rpc("get_pending_users"),
      supabase.from("working_time").select("id, name, hours_per_week").order("hours_per_week"),
    ]);

  if (error) console.error("Error fetching employees:", error);

  const employees = ((employeesRaw as Employee[] | null) ?? []).slice().sort((a, b) => {
    if (a.is_admin !== b.is_admin) return a.is_admin ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "", "de");
  });

  const pendingUsers = (pendingRaw as PendingUser[] | null) ?? [];
  const currentProfileId = userId;
  const workingTimeOptions = (workingTimeRaw as WorkingTimeOption[] | null) ?? [];

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Mitarbeiter</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {employees.length} Mitarbeiter insgesamt
        </p>
      </header>

      <div className="p-6 space-y-8">
        {/* Pending registrations */}
        {pendingUsers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <IconUserCheck size={17} stroke={2} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Ausstehende Registrierungen
              </h2>
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-blue-500 rounded-full">
                {pendingUsers.length}
              </span>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 divide-y divide-blue-100">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      Registriert{" "}
                      {new Intl.DateTimeFormat("de", { dateStyle: "short" }).format(
                        new Date(user.created_at)
                      )}
                    </p>
                  </div>
                  <AcceptEmployeeDialog user={user} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Employee list */}
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <IconUsers size={40} stroke={1.2} />
            <p className="text-sm">Keine Mitarbeiter gefunden</p>
          </div>
        ) : (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  isCurrentUser={employee.id === currentProfileId}
                  currentUserIsAdmin={isAdmin}
                  workingTimeOptions={workingTimeOptions}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
