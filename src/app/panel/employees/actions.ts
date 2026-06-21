"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function toggleAdminAction(profileId: string, makeAdmin: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_employee_admin", {
    p_profile_id: profileId,
    p_is_admin: makeAdmin,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/panel/employees");
}

export async function setWorkingTimeAction(profileId: string, workingTimeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_employee_working_time", {
    p_profile_id: profileId,
    p_working_time_id: workingTimeId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/panel/employees");
}

export async function acceptEmployeeAction(userId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_employee", {
    p_user_id: userId,
    p_name: name.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/panel/employees");
}
