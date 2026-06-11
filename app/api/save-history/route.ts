import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getVerifiedUser } from "@/lib/serverAuth";

export async function POST(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only" });

  // 変更点: クライアントが送るuserIdを信用せず、JWTから本人を特定する
  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required" }, { status: 401 });

  const body = await request.json();
  const { error } = await supabase.from("learning_history").insert({
    user_id: user.id,
    level: body.level,
    category: body.category,
    problem: body.problem,
    answer: body.answer,
    review: body.review,
    score: body.score ?? null
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
