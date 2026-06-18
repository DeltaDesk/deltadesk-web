import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import {
  IconTriangle,
  IconArrowRight,
  IconKey ,
  IconLayoutDashboard,
  IconCalendar,
  IconClipboardList,
  IconUsers,
  IconHeartbeat,
  IconBell,
} from "@tabler/icons-react";

const features = [
  {
    icon: IconCalendar,
    title: "Stundenplan",
    description: "Behalte alle Stunden im Blick – übersichtlich und immer aktuell.",
  },
  {
    icon: IconClipboardList,
    title: "Planung",
    description: "Erstelle und verwalte Schichtpläne in wenigen Sekunden.",
  },
  {
    icon: IconUsers,
    title: "Mitarbeiter",
    description: "Alle Kolleginnen und Kollegen an einem Ort verwaltet.",
  },
  {
    icon: IconHeartbeat,
    title: "Krankmeldungen",
    description: "Abwesenheiten transparent und nachvollziehbar dokumentiert.",
  },
  {
    icon: IconBell,
    title: "Benachrichtigungen",
    description: "Wichtiges erfährst du sofort und zuverlässig.",
  },
  {
    icon: IconLayoutDashboard,
    title: "Übersicht",
    description: "Direkt nach dem Login alles Wichtige auf einen Blick.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isLoggedIn = !!user;
  const cta = isLoggedIn
    ? { href: "/panel", label: "Panel öffnen", Icon: IconLayoutDashboard }
    : { href: "/login", label: "Anmelden", Icon: IconKey  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 -right-48 h-[36rem] w-[36rem] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-56 -left-56 h-[36rem] w-[36rem] rounded-full bg-blue-50 blur-3xl" />
      </div>

      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <IconTriangle size={22} stroke={2} className="text-blue-500" />
          <span className="text-lg font-semibold tracking-tight text-gray-900">DeltaDesk</span>
        </div>
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
        >
          <cta.Icon size={18} stroke={2} />
          {cta.label}
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-20 text-center sm:pt-28">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-700">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Schichtplanung, neu gedacht
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-6xl">
          Willkommen bei <span className="text-blue-500">DeltaDesk</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
          Die zentrale Plattform für Stundenpläne, Mitarbeiter und Krankmeldungen –
          übersichtlich, schnell und immer aktuell.
        </p>

        <div className="mt-10">
          <Link
            href={cta.href}
            className="group inline-flex items-center gap-2.5 rounded-xl bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-600 hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <cta.Icon size={20} stroke={2} />
            {cta.label}
            <IconArrowRight
              size={18}
              stroke={2}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                <Icon size={22} stroke={2} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <div className="border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Alle Rechte vorbehalten. 
        </div>
      </footer>
    </main>
  );
}
