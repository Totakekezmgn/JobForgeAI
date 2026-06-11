import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getVerifiedUser } from "@/lib/serverAuth";

export async function GET(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only", logs: [] });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required", logs: [] }, { status: 401 });

  const { data, error } = await supabase
    .from("job_interview_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("interview_date", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, logs: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only" });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("job_interview_logs")
    .insert({
      user_id: user.id,
      company_name: body.companyName ?? "",
      role: body.role ?? "",
      interview_date: body.interviewDate || null,
      questions: body.questions ?? "",
      answers: body.answers ?? "",
      reflection: body.reflection ?? "",
      next_actions: body.nextActions ?? ""
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, log: data });
}
