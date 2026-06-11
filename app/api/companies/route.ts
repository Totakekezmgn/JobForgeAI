import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getVerifiedUser } from "@/lib/serverAuth";

export async function GET(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only", companies: [] });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required", companies: [] }, { status: 401 });

  const { data, error } = await supabase
    .from("job_companies")
    .select("*")
    .eq("user_id", user.id)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, companies: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only" });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("job_companies")
    .insert({
      local_id: body.localId ?? body.id ?? null,
      user_id: user.id,
      name: body.name,
      status: body.status ?? "検討中",
      deadline: body.deadline || null,
      next_action: body.nextAction ?? "",
      memo: body.memo ?? "",
      official_url: body.officialUrl ?? ""
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, company: data });
}
