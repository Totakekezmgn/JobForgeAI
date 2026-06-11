create table if not exists public.learning_history (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  created_at timestamp with time zone default now(),
  level text not null,
  category text not null,
  problem text not null,
  answer text not null,
  review text not null,
  score integer
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamp with time zone default now()
);

alter table public.learning_history enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;

create policy if not exists "allow anonymous insert learning history"
on public.learning_history for insert to anon with check (true);

create policy if not exists "allow anonymous read learning history"
on public.learning_history for select to anon using (true);

create policy if not exists "allow anonymous read subscriptions"
on public.subscriptions for select to anon using (true);


-- JobForge v2.2 cloud persistence

create table if not exists public.job_companies (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  user_id text not null,
  name text not null,
  status text,
  deadline date,
  next_action text,
  memo text,
  official_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.job_interview_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  company_name text,
  role text,
  interview_date date,
  questions text,
  answers text,
  reflection text,
  next_actions text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.job_companies enable row level security;
alter table public.job_interview_logs enable row level security;

drop policy if exists "allow anonymous job companies select" on public.job_companies;
drop policy if exists "allow anonymous job companies insert" on public.job_companies;
drop policy if exists "allow anonymous job companies update" on public.job_companies;
drop policy if exists "allow anonymous interview logs select" on public.job_interview_logs;
drop policy if exists "allow anonymous interview logs insert" on public.job_interview_logs;
drop policy if exists "allow anonymous interview logs update" on public.job_interview_logs;

create policy "allow anonymous job companies select"
on public.job_companies for select to anon using (true);

create policy "allow anonymous job companies insert"
on public.job_companies for insert to anon with check (true);

create policy "allow anonymous job companies update"
on public.job_companies for update to anon using (true);

create policy "allow anonymous interview logs select"
on public.job_interview_logs for select to anon using (true);

create policy "allow anonymous interview logs insert"
on public.job_interview_logs for insert to anon with check (true);

create policy "allow anonymous interview logs update"
on public.job_interview_logs for update to anon using (true);


-- JobForge v2.4 ES documents

create table if not exists public.job_es_documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  company_name text,
  document_type text not null,
  title text,
  content text,
  ai_review text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.job_es_documents enable row level security;

drop policy if exists "allow anonymous es documents select" on public.job_es_documents;
drop policy if exists "allow anonymous es documents insert" on public.job_es_documents;
drop policy if exists "allow anonymous es documents update" on public.job_es_documents;

create policy "allow anonymous es documents select"
on public.job_es_documents for select to anon using (true);

create policy "allow anonymous es documents insert"
on public.job_es_documents for insert to anon with check (true);

create policy "allow anonymous es documents update"
on public.job_es_documents for update to anon using (true);
