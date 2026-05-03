import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized } from "../../../lib/authServer";
import { createSupabaseServiceClient } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await getAuthedUser(req);
  if (!auth) return unauthorized();

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("paid_entitlements")
    .select("status, source, created_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const hasPaid = data?.status === "active";
  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.user_metadata?.full_name ?? auth.user.user_metadata?.name ?? null,
    },
    hasPaid,
    entitlement: data ?? null,
  });
}
