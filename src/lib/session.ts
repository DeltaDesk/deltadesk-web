import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export interface Session {
  userId: string;
  isAdmin: boolean;
  hasProfile: boolean;
}

export const getSession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("login", user.id)
    .maybeSingle();

  return {
    userId: data?.id ?? user.id,
    isAdmin: data?.is_admin === true,
    hasProfile: data !== null,
  };
});

/** Like getSession but redirects non-employees to /panel/settings. */
export async function requireProfile(): Promise<Session> {
  const session = await getSession();
  if (!session.hasProfile) redirect("/panel/settings");
  return session;
}
