import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export const FREE_DAILY_AI_LIMIT = 5;

/**
 * リクエストのAuthorizationヘッダーからSupabaseのJWTを検証し、
 * 本人確認済みのユーザーを返す。
 *
 * なぜ必要か:
 * 旧実装はクライアントが送る userId をそのまま信用していたため、
 * 任意のIDを名乗って他人のデータを読み書きできた。
 * JWTはSupabaseが署名したトークンなので、偽造できない。
 */
export async function getVerifiedUser(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null; // Supabase未設定(local_onlyモード)

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;

  const supabase = createClient(supabaseUrl, anonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user; // user.id がDBの user_id として使う値
}

/**
 * サーバーサイドの無料枠チェック。
 * localStorageのカウンタは削除すれば回避できるため、DBで数える。
 *
 * 戻り値: { allowed, used, limit }
 * Pro契約者(subscriptions.status = active/trialing)は無制限。
 */
export async function checkAndCountUsage(userId: string, feature: string) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return { allowed: true, used: 0, limit: FREE_DAILY_AI_LIMIT };

  // Pro判定
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (sub) {
    await supabase.from("usage_events").insert({ user_id: userId, feature });
    return { allowed: true, used: 0, limit: Infinity };
  }

  // 当日の利用回数(全AI機能合算)
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("used_on", today);

  const used = count ?? 0;
  if (used >= FREE_DAILY_AI_LIMIT) {
    return { allowed: false, used, limit: FREE_DAILY_AI_LIMIT };
  }

  await supabase.from("usage_events").insert({ user_id: userId, feature });
  return { allowed: true, used: used + 1, limit: FREE_DAILY_AI_LIMIT };
}
