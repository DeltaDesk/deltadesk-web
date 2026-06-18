"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { IconLogout } from "@tabler/icons-react";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
    >
      <IconLogout size={18} />
      Abmelden
    </button>
  );
}
