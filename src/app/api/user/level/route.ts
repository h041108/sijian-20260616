// ─── GET /api/user/level ─────────────────────────────────
// 获取用户等级、经验值和升级进度
// 依赖: user_growth 表 (level, total_generations)

import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

// 等级配置
const LEVEL_CONFIG: Record<string, { minExp: number; benefits: string[]; icon: string }> = {
  青铜: { minExp: 0,    benefits: ["基础模板2个", "每日3次生成"], icon: "🥉" },
  白银: { minExp: 100,  benefits: ["高级模型", "无水印导出", "每日50次生成"], icon: "🥈" },
  黄金: { minExp: 500,  benefits: ["专属客服", "优先渲染", "多模型路由", "每日不限量"], icon: "🥇" },
}

export async function GET(_req: NextRequest) {
  const sb = getSupabase()
  if (!sb) {
    return NextResponse.json({ level: "青铜", exp: 0, nextLevelExp: 100, benefits: LEVEL_CONFIG["青铜"].benefits, icon: "🥉" })
  }

  const { data: { user }, error: authErr } = await sb.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ level: "青铜", exp: 0, nextLevelExp: 100, benefits: LEVEL_CONFIG["青铜"].benefits, icon: "🥉" })
  }

  // 从 user_growth 表获取等级和生成次数（经验值）
  const { data: growth } = await sb
    .from("user_growth")
    .select("level, total_generations, weekly_generations, last_active_at")
    .eq("user_id", user.id)
    .single()

  const currentLevel = growth?.level || "青铜"
  const exp = growth?.total_generations || 0

  // 计算下一个等级的升级进度
  const levels = ["青铜", "白银", "黄金"]
  const currentIdx = levels.indexOf(currentLevel)
  const nextLevel = currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null
  const nextLevelExp = nextLevel ? LEVEL_CONFIG[nextLevel].minExp : exp
  const currentMinExp = LEVEL_CONFIG[currentLevel].minExp

  return NextResponse.json({
    level: currentLevel,
    exp,
    nextLevelExp,
    progress: nextLevel ? Math.min(100, Math.round((exp - currentMinExp) / (nextLevelExp - currentMinExp) * 100)) : 100,
    benefits: LEVEL_CONFIG[currentLevel].benefits,
    icon: LEVEL_CONFIG[currentLevel].icon,
    nextLevel,
    weeklyGenerations: growth?.weekly_generations || 0,
    lastActiveAt: growth?.last_active_at || null,
  })
}
