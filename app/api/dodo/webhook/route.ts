import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

type DodoPaymentPayload = {
  type: string;
  data?: {
    payment_id?: string;
    checkout_session_id?: string | null;
    customer?: {
      customer_id?: string;
      email?: string;
      name?: string;
      metadata?: Record<string, unknown>;
    };
    metadata?: Record<string, unknown>;
  };
};

async function unlockPaidAccess(payload: DodoPaymentPayload) {
  const data = payload.data;
  const metadata = data?.metadata ?? data?.customer?.metadata ?? {};
  const userId = typeof metadata.user_id === "string" ? metadata.user_id : null;
  const email =
    (typeof metadata.email === "string" ? metadata.email : null) ??
    data?.customer?.email ??
    null;

  if (!userId) {
    console.warn("Dodo payment succeeded without user_id metadata", payload);
    return;
  }

  const supabase = createSupabaseServiceClient();
  await supabase.from("paid_entitlements").upsert({
    user_id: userId,
    email,
    status: "active",
    source: "dodo",
    dodo_payment_id: data?.payment_id ?? null,
    dodo_customer_id: data?.customer?.customer_id ?? null,
    dodo_checkout_session_id: data?.checkout_session_id ?? null,
    metadata,
    updated_at: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
  if (!webhookKey) {
    return NextResponse.json({ error: "Dodo webhook secret is not configured." }, { status: 500 });
  }

  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  const { verifyWebhookPayload } = await import("@dodopayments/core/webhook");
  const payload = await verifyWebhookPayload({ webhookKey, headers, body });

  if (payload.type === "payment.succeeded") {
    await unlockPaidAccess(payload as DodoPaymentPayload);
  }

  return NextResponse.json({ ok: true });
}
