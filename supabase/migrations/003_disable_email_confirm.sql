-- ============================================================
-- 关闭 Supabase 邮箱确认（让注册后直接可用）
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 方法1：通过修改 auth 配置关闭邮箱确认
-- 这需要在 Supabase Dashboard → Authentication → Settings 中操作：
-- 将 "Confirm email" 开关关闭

-- 方法2：通过 trigger 自动确认所有新用户的邮箱
-- 这个方法代码层面实现，无需改后台配置
create or replace function public.auto_confirm_email()
returns trigger as $$
begin
  update auth.users set email_confirmed_at = now()
  where id = new.id and email_confirmed_at is null;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created_confirm
  after insert on auth.users
  for each row
  execute function public.auto_confirm_email();
