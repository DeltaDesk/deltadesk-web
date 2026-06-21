"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function updateDefaultStudio(studioId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_default_studio", {
    p_studio_id: studioId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/panel/settings");
}
