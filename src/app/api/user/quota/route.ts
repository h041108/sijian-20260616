// ─── GET /api/user/quota ────────────────────────────────
// 获取用户当前套餐配额和今日已使用次数
// 依赖: daily_usage 表 (chat_count + space_count 合计), subscriptions 表 (plan_id)

import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  student: 10,
  teacher: 30,
  pro: 50,
  org_standard: 200,
  org_flagship: 999999,
}

export async function GET(_req: NextRequest) {
  const sb = getSupabase()
  if (!sb) {
    // 无 Supabase 配置时返回默认值
    return NextResponse.json({ used: 0, limit: 3, plan: "free" })
  }

  const { data: { user }, error: authErr } = await sb.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ used: 0, limit: 3, plan: "guest" })
  }

  // 获取订阅套餐
  const { data: sub } = await sb
    .from("subscriptions")
    .select("plan_id")
    .eq("user_id", user.id)
    .single()

  const plan = sub?.plan_id || "free"
  const limit = PLAN_LIMITS[plan] ?? 3

  // 统计今日使用次数（chat_count + space_count）
  const today = new Date().toISOString().split("T")[0]
  const { data: usage } = await sb
    .from("daily_usage")
    .select("chat_count, space_count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .single()

  const used = usage ? (usage.chat_count + usage.space_count) : 0

  // 同时从 user_growth 获取等级信息（聚合返回，减少一次请求）
  const { data: growth } = await sb
    .from("user_growth")
    .select("level, total_generations")
    .eq("user_id", user.id)
    .single()

  return NextResponse.json({
    used,
    limit,
    plan,
    level: growth?.level || "青铜",
    totalGenerations: growth?.total_generations || 0,
  })
}
