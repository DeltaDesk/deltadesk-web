"use client";

import { useState, useTransition } from "react";
import { IconTool, IconUser } from "@tabler/icons-react";
import { toggleAdminAction } from "./actions";

interface AdminToggleButtonProps {
  profileId: string;
  isAdmin: boolean;
}

export default function AdminToggleButton({ profileId, isAdmin }: AdminToggleButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      try {
        await toggleAdminAction(profileId, !isAdmin);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={pending}
        title={isAdmin ? "Admin-Rechte entziehen" : "Zum Admin machen"}
        className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-all duration-100 disabled:opacity-50 cursor-pointer hover:opacity-80 ${
          isAdmin ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {isAdmin
          ? <><IconTool size={11} stroke={2.2} /><span>Administrator</span></>
          : <><IconUser size={11} stroke={2.2} /><span>Mitarbeiter</span></>
        }
      </button>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
