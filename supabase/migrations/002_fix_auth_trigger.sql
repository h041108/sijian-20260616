-- ============================================================
-- 修复：注册时 "Database error saving new user"
-- 原因：handle_new_user trigger 中 profiles 或 subscriptions 表不存在
-- 修复：增加 exception 捕获，表不存在时跳过，不影响注册
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- 尝试写入 profiles，表不存在或冲突时跳过
  begin
    insert into public.profiles (id, nickname)
    values (new.id, coalesce(new.raw_user_meta_data->>'nickname', '用户'))
    on conflict (id) do nothing;
  exception when others then
    -- 表不存在等错误，不阻塞注册
    raise warning 'handle_new_user: profiles insert failed: %', SQLERRM;
  end;

  -- 尝试写入 subscriptions，表不存在或冲突时跳过
  begin
    insert into public.subscriptions (user_id, plan_id)
    values (new.id, 'free')
    on conflict (user_id) do nothing;
  exception when others then
    raise warning 'handle_new_user: subscriptions insert failed: %', SQLERRM;
  end;

  return new;
end;
$$ language plpgsql security definer;

-- 确保 trigger 存在
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
