"use client";

import { useTransition } from "react";
import { logout } from "@/app/auth/actions";
import { IconLogout } from "@tabler/icons-react";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={pending}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <IconLogout size={18} />
      Abmelden
    </button>
  );
}
