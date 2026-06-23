"use client";

import { useEffect, useState } from "react";
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
  IconTriangle,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";

const navItems = [
  { label: "Stundenplan", href: "/panel", icon: IconCalendar, exact: true, adminOnly: false, requiresApproval: true },
  { label: "Planung", href: "/panel/plan", icon: IconClipboardList, adminOnly: true, requiresApproval: true },
  { label: "Mitarbeiter", href: "/panel/employees", icon: IconUsers, adminOnly: true, requiresApproval: true },
  { label: "Krankmeldungen", href: "/panel/sickleave", icon: IconHeartbeat, adminOnly: false, requiresApproval: true },
  { label: "Benachrichtigungen", href: "/panel/notifications", icon: IconBell, adminOnly: false, requiresApproval: true },
];

const bottomItems = [
  { label: "Einstellungen", href: "/panel/settings", icon: IconSettings, exact: false },
];

type NavItemData = {
  label: string;
  href: string;
  icon: typeof IconCalendar;
  exact?: boolean;
  requiresApproval?: boolean;
  badge?: number;
};

function Brand() {
  return (
    <span className="font-space-grotesk text-[20px] font-semibold text-gray-900 tracking-tight">
      <IconTriangle size={18} stroke={2} className="text-blue-500 inline mb-1.25 mr-3 stroke-4" />
      DeltaDesk
    </span>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItemData;
  active: boolean;
  onNavigate: () => void;
}) {
  const { label, href, icon: Icon, badge } = item;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={clsx(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[.98]",
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
          active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      <span className="truncate">{label}</span>
      {badge ? (
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold leading-none text-white bg-blue-500 rounded-full">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : (
        active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
      )}
    </Link>
  );
}

function SidebarContent({
  visibleNavItems,
  isActive,
  onNavigate,
  isApproved,
}: {
  visibleNavItems: NavItemData[];
  isActive: (href: string, exact?: boolean) => boolean;
  onNavigate: () => void;
  isApproved: boolean;
}) {
  return (
    <>
      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto px-3 py-3">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href, item.exact)}
            onNavigate={onNavigate}
          />
        ))}
        {!isApproved && (
          <div className="mt-2 mx-0.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <p className="text-xs font-medium text-amber-800">Konto ausstehend</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-snug">
              Dein Konto muss noch von einem Administrator freigegeben werden.
            </p>
          </div>
        )}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        {bottomItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href, item.exact)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </>
  );
}

export default function Sidebar({
  isAdmin = false,
  isApproved = false,
  notificationCount = 0,
}: {
  isAdmin?: boolean;
  isApproved?: boolean;
  notificationCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const visibleNavItems = navItems
    .filter((item) => (!item.adminOnly || isAdmin) && (!item.requiresApproval || isApproved))
    .map((item) =>
      item.href === "/panel/notifications"
        ? { ...item, badge: notificationCount }
        : item
    );

  // Close the mobile drawer whenever the route changes (incl. back/forward).
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white/90 backdrop-blur border-b border-gray-200">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menü öffnen"
          className="flex items-center justify-center w-10 h-10 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
        >
          <IconMenu2 size={22} stroke={1.8} />
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        onClick={() => setOpen(false)}
        className={clsx(
          "md:hidden fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Mobile drawer */}
      <aside
        className={clsx(
          "md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[80%] bg-white shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-14 border-b border-gray-200 select-none">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Menü schließen"
            className="flex items-center justify-center w-10 h-10 -mr-2 rounded-lg text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
          >
            <IconX size={20} stroke={1.8} />
          </button>
        </div>
        <SidebarContent
          visibleNavItems={visibleNavItems}
          isActive={isActive}
          onNavigate={() => setOpen(false)}
          isApproved={isApproved}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 shrink-0">
        <div className="px-6 py-4 select-none border-b border-gray-200">
          <Brand />
        </div>
        <SidebarContent
          visibleNavItems={visibleNavItems}
          isActive={isActive}
          onNavigate={() => {}}
          isApproved={isApproved}
        />
      </aside>
    </>
  );
}
