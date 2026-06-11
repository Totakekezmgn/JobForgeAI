import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getVerifiedUser } from "@/lib/serverAuth";

export async function GET(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only", documents: [] });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required", documents: [] }, { status: 401 });

  const { data, error } = await supabase
    .from("job_es_documents")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, documents: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only" });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("job_es_documents")
    .insert({
      user_id: user.id,
      company_name: body.companyName ?? "",
      document_type: body.documentType,
      title: body.title ?? "",
      content: body.content ?? "",
      ai_review: body.aiReview ?? "",
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, document: data });
}
