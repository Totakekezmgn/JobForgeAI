-- =========================================================
-- JobForge v2.6 セキュリティ移行
-- 目的:
--   1. 全開放されていたRLSポリシーを撤去する(anonキーでの直接読み書きを遮断)
--   2. データアクセスは全て「APIルート(service role) + JWT検証」経由に統一
--   3. 無料枠のサーバーサイド管理用テーブルを追加
--
-- 実行方法: SupabaseダッシュボードのSQL Editorに貼り付けて実行
-- 注意: 実行後、未ログインユーザーはクラウド保存不可(localStorageのみ)になります。
-- =========================================================

-- 1. 旧・全開放ポリシーの削除 ------------------------------

drop policy if exists "allow anonymous insert learning history" on public.learning_history;
drop policy if exists "allow anonymous read learning history" on public.learning_history;
drop policy if exists "allow anonymous read subscriptions" on public.subscriptions;

drop policy if exists "allow anonymous job companies select" on public.job_companies;
drop policy if exists "allow anonymous job companies insert" on public.job_companies;
drop policy if exists "allow anonymous job companies update" on public.job_companies;

drop policy if exists "allow anonymous interview logs select" on public.job_interview_logs;
drop policy if exists "allow anonymous interview logs insert" on public.job_interview_logs;
drop policy if exists "allow anonymous interview logs update" on public.job_interview_logs;

drop policy if exists "allow anonymous es documents select" on public.job_es_documents;
drop policy if exists "allow anonymous es documents insert" on public.job_es_documents;
drop policy if exists "allow anonymous es documents update" on public.job_es_documents;

-- RLSは有効のまま、anon向けポリシーを一切作らない。
-- → anonキーでのテーブル直接アクセスは全て拒否される。
-- → service role(APIルート側)はRLSをバイパスするので、
--    アクセス制御の責任はAPIルートのJWT検証(lib/serverAuth.ts)が持つ。

-- 2. 本人のみ読み取り許可(ログイン済みクライアント用・任意) ----
-- 将来クライアントから直接Supabaseを読む場合に備えた最小権限ポリシー。
-- user_idカラムはtextなので auth.uid()::text と比較する。

create policy "own rows select" on public.learning_history
  for select to authenticated using (user_id = auth.uid()::text);

create policy "own rows select" on public.job_companies
  for select to authenticated using (user_id = auth.uid()::text);

create policy "own rows select" on public.job_interview_logs
  for select to authenticated using (user_id = auth.uid()::text);

create policy "own rows select" on public.job_es_documents
  for select to authenticated using (user_id = auth.uid()::text);

create policy "own subscription select" on public.subscriptions
  for select to authenticated using (user_id = auth.uid()::text);

-- 3. サーバーサイド利用回数管理 ------------------------------
-- localStorageのカウンタは改ざん可能なため、無料枠はDBで数える。

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  feature text not null,           -- 例: 'interview-sim', 'review-answer'
  used_on date not null default current_date,
  created_at timestamp with time zone default now()
);

create index if not exists usage_events_user_day_idx
  on public.usage_events (user_id, used_on);

alter table public.usage_events enable row level security;
-- anon/authenticatedともポリシーなし = APIルート(service role)のみが操作可能
