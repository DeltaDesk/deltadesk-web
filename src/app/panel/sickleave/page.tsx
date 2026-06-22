import { createClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { formatDate } from "../plan/datetime";
import SickLeaveForm from "./SickLeaveForm";

export default async function KrankmeldungenPage() {
  const { userId } = await requireProfile();
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("sick_notes")
    .select("id, start_date, end_date, text")
    .eq("user", userId)
    .order("start_date", { ascending: false });

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
  }).format(new Date());

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Krankmeldungen</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Melde dich krank – der Zeitraum beginnt immer heute.
        </p>
      </header>

      <div className="p-8 grid gap-6 md:grid-cols-2">
        <SickLeaveForm />

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3.5 bg-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Meine Krankmeldungen
            </h2>
          </div>
          {!notes || notes.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              Keine Krankmeldungen vorhanden
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notes.map((note) => {
                const active = note.end_date >= today;
                return (
                  <li key={note.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(note.start_date)} – {formatDate(note.end_date)}
                      </span>
                      {active && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                          Aktiv
                        </span>
                      )}
                    </div>
                    {note.text && (
                      <p className="mt-0.5 text-xs text-gray-500">{note.text}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
