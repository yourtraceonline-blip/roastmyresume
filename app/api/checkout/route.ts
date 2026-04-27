import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized } from "../../../lib/authServer";
import { createSupabaseServiceClient } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

function dodoBaseUrl() {
  const mode = (process.env.DODO_PAYMENTS_ENVIRONMENT ?? "live_mode").toLowerCase();
  if (mode === "test_mode" || mode === "test") return "https://test.dodopayments.com";
  return "https://live.dodopayments.com";
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser(req);
  if (!auth) return unauthorized();

  const apiKey = process.env.DODO_PAYMENTS_API_KEY ?? process.env.DODO_API_KEY;
  const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
  if (!apiKey || !productId) {
    return NextResponse.json(
      { error: "Dodo Payments is not configured yet. Add DODO_PAYMENTS_API_KEY and DODO_PAYMENTS_PRODUCT_ID." },
      { status: 500 }
    );
  }

  const supabase = createSupabaseServiceClient();
  const { data: existing } = await supabase
    .from("paid_entitlements")
    .select("status")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (existing?.status === "active") {
    return NextResponse.json({ checkout_url: "/improve?paid=1", alreadyPaid: true });
  }

  const origin = req.nextUrl.origin;
  const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL ?? `${origin}/improve?checkout=success`;
  const name =
    auth.user.user_metadata?.full_name ??
    auth.user.user_metadata?.name ??
    auth.user.email?.split("@")[0] ??
    "Roast My Resume user";

  const response = await fetch(`${dodoBaseUrl()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: auth.user.email,
        name,
      },
      return_url: returnUrl,
      metadata: {
        user_id: auth.user.id,
        email: auth.user.email ?? "",
        product: "resume_improvement_unlimited",
      },
    }),
  });

  const text = await response.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    console.error("Dodo checkout failed:", payload);
    return NextResponse.json({ error: "Could not start checkout.", details: payload }, { status: 502 });
  }

  return NextResponse.json(payload);
}
