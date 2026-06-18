import { createClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Einstellungen</h1>
      <p className="mt-1 text-sm text-gray-500">Systemeinstellungen und Konfiguration.</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-500">Benutzer-ID</label>
          <p className="mt-1 font-mono text-sm text-gray-900 break-all">{user?.id}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Abmelden</p>
            <p className="text-sm text-gray-500">Von DeltaDesk abmelden</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
