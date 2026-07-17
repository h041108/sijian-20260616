-- 005_payment_plans.sql: 可后台配置的套餐价格表
create table if not exists public.payment_plans (
  id text primary key,
  name text not null,
  price_monthly integer not null,
  price_yearly integer default 0,
  daily_limit integer not null default 3,
  features text[] default '{}',
  hot boolean default false,
  icon text default '',
  active boolean default true,
  updated_at timestamptz default now()
);
alter table public.payment_plans enable row level security;
create policy "Anyone read payment_plans" on public.payment_plans for select using (true);

insert into public.payment_plans (id, name, price_monthly, price_yearly, daily_limit, features, hot, icon) values
  ('free', '免费体验', 0, 0, 3, '{"每日 3 次","1 个 Agent","基础图片社","水印输出"}', false, '🌱'),
  ('pro', '专业版', 2000, 19900, 50, '{"每日 50 次","全部 15 个 Agent","漫剧引擎","数字人口播","无水印","5GB 素材库"}', true, '🚀'),
  ('enterprise', '企业版', 19900, 0, 999999, '{"不限量","全部 Agent","API 接口","多账号","100GB 素材库","多平台发布"}', false, '🏢')
on conflict (id) do nothing;
