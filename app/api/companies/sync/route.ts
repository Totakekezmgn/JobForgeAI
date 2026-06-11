import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getVerifiedUser } from "@/lib/serverAuth";

export async function POST(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only", synced: 0 });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required", synced: 0 }, { status: 401 });

  const { companies } = await request.json();
  if (!Array.isArray(companies)) {
    return NextResponse.json({ ok: false, error: "companies must be array" }, { status: 400 });
  }

  let synced = 0;
  for (const c of companies) {
    if (!c.name) continue;
    const payload = {
      local_id: c.id ?? null,
      user_id: user.id,
      name: c.name,
      status: c.status ?? "検討中",
      deadline: c.deadline || null,
      next_action: c.nextAction ?? "",
      memo: c.memo ?? "",
      official_url: c.officialUrl ?? "",
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("job_companies").upsert(payload, { onConflict: "id" });
    if (!error) synced += 1;
  }

  return NextResponse.json({ ok: true, synced });
}
