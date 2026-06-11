import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getVerifiedUser } from "@/lib/serverAuth";

/**
 * 旧UUIDデータの引き継ぎ(v2.7)
 *
 * 背景:
 * v2.5以前はlocalStorageの乱数UUIDを user_id としてクラウド保存していた。
 * v2.6でJWT本人確認(auth.uid)に統一したため、旧UUIDで保存されたデータが
 * ログイン後のアカウントから見えなくなる。このルートは旧UUIDのデータを
 * 現在ログイン中のアカウントへ付け替える。
 *
 * セキュリティ上の考え方:
 * 旧UUIDは128bitの乱数で、本人の端末のlocalStorageにしか存在しない。
 * 「そのUUIDを提示できる = 旧データの持ち主である」とみなす。
 * 推測攻撃は事実上不可能だが、引き継ぎは1回限り・ログイン必須とする。
 */
export async function POST(request: Request) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, mode: "local_only" });

  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ ok: false, mode: "login_required" }, { status: 401 });

  const { legacyId } = await request.json();

  // UUID形式チェック(任意の文字列でテーブル全体を書き換えられないようにする)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof legacyId !== "string" || !uuidPattern.test(legacyId)) {
    return NextResponse.json({ ok: false, error: "legacyId is invalid" }, { status: 400 });
  }
  if (legacyId === user.id) {
    return NextResponse.json({ ok: true, migrated: 0, message: "引き継ぎ不要です。" });
  }

  const tables = ["learning_history", "job_companies", "job_interview_logs", "job_es_documents"];
  const migrated: Record<string, number> = {};

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .update({ user_id: user.id })
      .eq("user_id", legacyId)
      .select("id");
    migrated[table] = error ? 0 : (data?.length ?? 0);
  }

  const total = Object.values(migrated).reduce((a, b) => a + b, 0);
  return NextResponse.json({ ok: true, migrated: total, detail: migrated });
}
