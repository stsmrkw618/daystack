-- ============================================================
-- DayStack: Supabase Schema
-- Run this in your Supabase SQL Editor
-- テーブル名は daystack_ プレフィックス付き（他プロジェクトとの競合回避）
-- ============================================================

-- 1. Profiles テーブル（サインアップ時にトリガーで自動作成）
create table if not exists public.daystack_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

alter table public.daystack_profiles enable row level security;

create policy "daystack_profiles: read own"
  on public.daystack_profiles for select
  using (auth.uid() = id);

create policy "daystack_profiles: update own"
  on public.daystack_profiles for update
  using (auth.uid() = id);

-- トリガー: サインアップ時にプロフィール自動作成
create or replace function public.handle_daystack_new_user()
returns trigger as $$
begin
  insert into public.daystack_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_daystack_user_created on auth.users;
create trigger on_daystack_user_created
  after insert on auth.users
  for each row execute procedure public.handle_daystack_new_user();

-- 2. Categories テーブル
create table if not exists public.daystack_categories (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  label text not null,
  color text not null default '#4ECDC4',
  icon text not null default '💻',
  sort_order int not null default 0,
  created_at timestamptz default now(),
  primary key (user_id, id)
);

alter table public.daystack_categories enable row level security;

create policy "daystack_categories: read own"
  on public.daystack_categories for select
  using (auth.uid() = user_id);

create policy "daystack_categories: insert own"
  on public.daystack_categories for insert
  with check (auth.uid() = user_id);

create policy "daystack_categories: update own"
  on public.daystack_categories for update
  using (auth.uid() = user_id);

create policy "daystack_categories: delete own"
  on public.daystack_categories for delete
  using (auth.uid() = user_id);

-- 3. Tasks テーブル
create table if not exists public.daystack_tasks (
  id bigint primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text not null,
  minutes int not null,
  start_time text not null,
  end_time text not null,
  date text not null,
  created_at timestamptz default now()
);

alter table public.daystack_tasks enable row level security;

create policy "daystack_tasks: read own"
  on public.daystack_tasks for select
  using (auth.uid() = user_id);

create policy "daystack_tasks: insert own"
  on public.daystack_tasks for insert
  with check (auth.uid() = user_id);

create policy "daystack_tasks: update own"
  on public.daystack_tasks for update
  using (auth.uid() = user_id);

create policy "daystack_tasks: delete own"
  on public.daystack_tasks for delete
  using (auth.uid() = user_id);

create index if not exists daystack_tasks_user_date_idx
  on public.daystack_tasks (user_id, date);

-- 4. Realtime有効化
alter publication supabase_realtime add table public.daystack_categories;
alter publication supabase_realtime add table public.daystack_tasks;
