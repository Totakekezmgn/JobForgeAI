import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return NextResponse.json({ error: "Stripe webhook env is not configured." }, { status: 400 });

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 400 });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id || session.metadata?.userId || "anonymous";
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

    await supabase.from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      status: "active",
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
  }

  // v2.7追加: 解約・支払い失敗時にPro状態を落とす(課金状態の整合性)
  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const active = sub.status === "active" || sub.status === "trialing";
    await supabase
      .from("subscriptions")
      .update({ status: active ? sub.status : "inactive", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
