import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getVerifiedUser } from "@/lib/serverAuth";

export async function GET(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ plan: "free", isPro: false, mode: "local_only" });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ plan: "free", isPro: false, mode: "login_required" });

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    plan: data ? "pro" : "free",
    isPro: Boolean(data),
    subscription: data ?? null
  });
}
