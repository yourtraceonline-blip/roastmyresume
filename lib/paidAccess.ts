import { createSupabaseServiceClient } from "./supabaseServer";

export async function hasPaidAccess(userId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("paid_entitlements")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.status === "active";
}
