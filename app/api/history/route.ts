import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getVerifiedUser } from "@/lib/serverAuth";

export async function GET(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only", history: [] });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required", history: [] }, { status: 401 });

  const { data, error } = await supabase
    .from("learning_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, history: data ?? [] });
}
