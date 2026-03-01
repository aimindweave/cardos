-- ================================================
-- CardOS Database Schema
-- ================================================
-- 在 Supabase Dashboard → SQL Editor 里运行这个文件
-- 它会创建所有需要的表和安全策略
-- ================================================

-- 1. Profiles — 每个用户的卡片数据
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slug text unique not null,
  name text not null,
  title text,
  tagline text,
  avatar_url text,
  location text,
  links jsonb default '[]',
  companies jsonb default '[]',
  builds jsonb default '[]',
  ai_stack jsonb default '[]',
  philosophy jsonb default '[]',
  event jsonb,
  theme text default 'dark',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_profiles_slug on profiles(slug);

alter table profiles enable row level security;

-- 任何人都能看卡片（公开）
create policy "Public read profiles" on profiles
  for select using (true);

-- 只有自己能改自己的卡片
create policy "Owner insert profile" on profiles
  for insert with check (auth.uid() = user_id);

create policy "Owner update profile" on profiles
  for update using (auth.uid() = user_id);

create policy "Owner delete profile" on profiles
  for delete using (auth.uid() = user_id);


-- 2. Exchanges — 访客留下的联系方式
create table if not exists exchanges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  company text,
  linkedin text,
  note text,
  source text default 'manual',
  status text default 'new',
  created_at timestamptz default now()
);

alter table exchanges enable row level security;

-- 任何人都能提交 exchange（不需要登录）
create policy "Public insert exchanges" on exchanges
  for insert with check (true);

-- 只有卡片主人能看到自己收到的 exchange
create policy "Owner read exchanges" on exchanges
  for select using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- 卡片主人可以更新状态
create policy "Owner update exchanges" on exchanges
  for update using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );


-- 3. Views — 匿名访问记录
create table if not exists views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  referrer text,
  created_at timestamptz default now()
);

alter table views enable row level security;

create policy "Public insert views" on views
  for insert with check (true);

create policy "Owner read views" on views
  for select using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );
