-- ============================================================
-- 思见 · 完整 Supabase 数据库 Schema
-- 覆盖：用户、订阅、思维空间、认知日志、企业/机构、视频项目
-- ============================================================

-- 1. 用户画像（扩展 auth.users）
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nickname text not null default '',
  avatar_url text default '',
  role text not null default 'student' check (role in ('student','parent','teacher','enterprise_admin','enterprise_member')),
  phone text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. 订阅
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  plan_id text not null default 'free' check (plan_id in ('free','pro','student','teacher','org_standard','org_flagship')),
  start_date date default current_date,
  expiry_date date,
  payment_method text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- 3. 每日使用量
create table if not exists public.daily_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  usage_date date not null default current_date,
  chat_count int not null default 0,
  space_count int not null default 0,
  created_at timestamptz default now(),
  unique(user_id, usage_date)
);
alter table public.daily_usage enable row level security;
create policy "Users can view own usage" on public.daily_usage for select using (auth.uid() = user_id);
create policy "Users can insert own usage" on public.daily_usage for insert with check (auth.uid() = user_id);
create policy "Users can update own usage" on public.daily_usage for update using (auth.uid() = user_id);

-- 4. 思维空间
create table if not exists public.mind_spaces (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  input_text text not null default '',
  mind_space_json jsonb not null default '{}',
  domain_type text default 'general',
  frame_type text default 'tree',
  node_count int generated always as (jsonb_array_length(mind_space_json->'nodes')) stored,
  edge_count int generated always as (jsonb_array_length(mind_space_json->'edges')) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.mind_spaces enable row level security;
create policy "Users can CRUD own mind spaces" on public.mind_spaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_mind_spaces_user_id on public.mind_spaces(user_id);
create index idx_mind_spaces_created_at on public.mind_spaces(created_at desc);

-- 5. 对话历史
create table if not exists public.chat_sessions (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  messages jsonb not null default '[]',
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  domain_type text default 'general',
  frame_type text default 'tree',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id, user_id)
);
alter table public.chat_sessions enable row level security;
create policy "Users can CRUD own chat sessions" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index idx_chat_sessions_updated_at on public.chat_sessions(updated_at desc);

-- 6. 认知日志
create table if not exists public.cognition_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id text not null default '',
  state text,
  intent text,
  emotion text,
  cognitive_load numeric,
  dominant_lines jsonb default '[]',
  message_length int default 0,
  created_at timestamptz default now()
);
alter table public.cognition_logs enable row level security;
create policy "Users can view own cognition logs" on public.cognition_logs for select using (auth.uid() = user_id);
create policy "Users can insert own cognition logs" on public.cognition_logs for insert with check (auth.uid() = user_id);

-- 7. 视频项目
create table if not exists public.video_projects (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  one_liner text not null default '',
  genre text default 'short_drama',
  style text default '',
  duration int default 60,
  aspect_ratio text default '16:9',
  status text default 'draft' check (status in ('draft','running','completed','failed')),
  stages jsonb default '[]',
  viral_template jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.video_projects enable row level security;
create policy "Users can CRUD own video projects" on public.video_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_video_projects_user_id on public.video_projects(user_id);

-- 8. 班级
create table if not exists public.classes (
  id text primary key,
  name text not null,
  teacher_id uuid references auth.users(id) on delete cascade not null,
  subject text not null default '',
  grade text not null default '',
  invite_code text not null,
  student_count int default 0,
  created_at timestamptz default now()
);
alter table public.classes enable row level security;
create policy "Teachers can CRUD own classes" on public.classes
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- 9. 用户关系（家长-孩子、教师-学生、企业-成员）
create table if not exists public.user_relations (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users(id) on delete cascade not null,
  to_user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('parent_child','teacher_student','enterprise_member')),
  class_id text,
  org_id text,
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id, type)
);
alter table public.user_relations enable row level security;
create policy "Users can view own relations" on public.user_relations for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- 10. 邀请码
create table if not exists public.invite_codes (
  code text primary key,
  created_by uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('parent_child','teacher_student','enterprise_member')),
  class_id text,
  org_id text,
  max_uses int default 60,
  used_count int default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);
alter table public.invite_codes enable row level security;
create policy "Users can CRUD own invites" on public.invite_codes
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- 11. 企业组织
create table if not exists public.enterprise_orgs (
  id text primary key,
  name text not null,
  admin_id uuid references auth.users(id) on delete cascade not null,
  invite_code text not null,
  member_count int default 0,
  created_at timestamptz default now()
);
alter table public.enterprise_orgs enable row level security;
create policy "Admins can CRUD own orgs" on public.enterprise_orgs
  for all using (auth.uid() = admin_id) with check (auth.uid() = admin_id);

-- 12. 功能请求（B端反馈）
create table if not exists public.feature_requests (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category text default 'other',
  status text default 'pending' check (status in ('pending','planned','done','declined')),
  created_at timestamptz default now()
);
alter table public.feature_requests enable row level security;
create policy "Anyone can insert feature requests" on public.feature_requests for insert with check (auth.uid() = user_id);
create policy "Users can view own requests" on public.feature_requests for select using (auth.uid() = user_id);

-- ============================================================
-- 信号机制：思维空间创建时自动更新用户成长
-- ============================================================
create table if not exists public.user_growth (
  user_id uuid references auth.users(id) on delete cascade primary key,
  total_generations int default 0,
  weekly_generations int default 0,
  total_nodes int default 0,
  level text default '青铜',
  last_active_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.user_growth enable row level security;
create policy "Users can view own growth" on public.user_growth for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname) values (new.id, coalesce(new.raw_user_meta_data->>'nickname', '用户'));
  insert into public.subscriptions (user_id, plan_id) values (new.id, 'free');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
