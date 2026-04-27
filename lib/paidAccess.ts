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

export async function hasUsedFreeImprovement(userId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { count } = await supabase
    .from("resume_improvements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}
