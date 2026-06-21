import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export interface Session {
  userId: string;
  isAdmin: boolean;
  hasProfile: boolean;
}

export async function getSession(): Promise<Session> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("login", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    isAdmin: data?.is_admin === true,
    hasProfile: data !== null,
  };
}

/** Like getSession but redirects non-employees to /panel/settings. */
export async function requireProfile(): Promise<Session> {
  const session = await getSession();
  if (!session.hasProfile) redirect("/panel/settings");
  return session;
}
