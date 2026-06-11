import { supabase } from "@/lib/supabase";

/**
 * ログイン済みならAuthorizationヘッダーを付けてfetchするヘルパー。
 * 各ページの fetch("/api/...") をこれに置き換えるだけで、
 * サーバー側(lib/serverAuth.ts)が本人確認できるようになる。
 *
 * 使用例:
 *   const res = await authFetch("/api/companies");
 *   const res = await authFetch("/api/save-history", { method: "POST", body: JSON.stringify(payload) });
 */
export async function authFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}

/** 現在のログインユーザーを取得(未ログインならnull) */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
