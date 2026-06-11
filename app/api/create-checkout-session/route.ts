import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getVerifiedUser } from "@/lib/serverAuth";

/**
 * v2.7変更: クライアントが送るuserIdを廃止し、JWTで本人確認したauth.uidを
 * client_reference_id に渡す。これにより「他人のIDで課金状態を作る」攻撃と、
 * 「課金したのに旧UUIDに紐づいてPro判定されない」事故の両方を防ぐ。
 */
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!secretKey || !priceId) {
    return NextResponse.json({ ok: false, message: "Stripe env is not configured." }, { status: 400 });
  }

  const user = await getVerifiedUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: "課金にはログインが必要です。/login からログインしてください。" }, { status: 401 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    metadata: { userId: user.id },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?success=true`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    allow_promotion_codes: true
  });

  return NextResponse.json({ ok: true, url: session.url });
}
