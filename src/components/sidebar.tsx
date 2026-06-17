"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  IconCalendar,
  IconClipboardList,
  IconUsers,
  IconHeartbeat,
  IconBell,
  IconSettings,
  IconLayoutDashboard,
} from "@tabler/icons-react";

const navItems = [
  { label: "Stundenplan", href: "/panel", icon: IconCalendar, exact: true },
  { label: "Planung", href: "/panel/planung", icon: IconClipboardList },
  { label: "Mitarbeiter", href: "/panel/mitarbeiter", icon: IconUsers },
  { label: "Krankmeldungen", href: "/panel/krankmeldungen", icon: IconHeartbeat },
  { label: "Benachrichtigungen", href: "/panel/benachrichtigungen", icon: IconBell },
];

const bottomItems = [
  { label: "Einstellungen", href: "/panel/einstellungen", icon: IconSettings },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col w-64 h-screen bg-white border-r border-gray-200 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
          <IconLayoutDashboard size={18} stroke={2} />
        </div>
        <span className="text-[15px] font-semibold text-gray-900 tracking-tight">
          DeltaDesk
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto px-3 py-3">
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon
                size={19}
                stroke={active ? 2.2 : 1.8}
                className={clsx(
                  "shrink-0 transition-colors duration-150",
                  active
                    ? "text-blue-600"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              <span className="truncate">{label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        {bottomItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon
                size={19}
                stroke={active ? 2.2 : 1.8}
                className={clsx(
                  "shrink-0 transition-colors duration-150",
                  active
                    ? "text-blue-600"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              <span className="truncate">{label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
