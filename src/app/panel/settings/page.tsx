import { IconShieldStar, IconShieldOff } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, name, is_admin, login")
    .eq("login", user?.id)
    .maybeSingle();

    if (error) {
      console.error("Error fetching employee data:", error);
    }

    const isAdmin = employee?.is_admin === true;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900">Einstellungen</h1>
      <p className="mt-1 text-sm text-gray-500">Systemeinstellungen und Konfiguration.</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-500">E-Mail</label>
          <p className="mt-1 font-mono text-sm text-gray-900 break-all">{user?.email ?? "Unbekannt"}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-500">Name</label>
          <p className="mt-1 text-sm text-gray-900">{employee?.name ?? "Unbekannt"}</p>
        </div>


        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-500">Rolle</label>
          <p className="mt-1 flex items-center gap-1.5 text-sm">
            {isAdmin ? (
              <>
                <IconShieldStar size={14} stroke={2.2} className="text-blue-600 shrink-0" />
                <span className="text-gray-900">Administrator</span>
              </>
            ) : (
              <>
                <IconShieldOff size={14} stroke={2} className="text-gray-400 shrink-0" />
                <span className="text-gray-900">Mitarbeiter</span>
              </>
            )}
          </p>
        </div>

        
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-500">Benutzer-ID</label>
          <p className="mt-1 font-mono text-sm text-gray-900 break-all">
            Employee Profile: {employee?.id}
            <br/>
            Login (legacy): {employee?.login}</p>
        </div>


        <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-500">Logout</label>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
