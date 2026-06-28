// ─── POST /api/usage/check ──────────────────────────
// 服务端用量检查 + 限流
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const PLAN_LIMITS: Record<string, number> = {
  free: 10, pro: -1, student: -1, teacher: -1, org_standard: -1, org_flagship: -1,
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ allowed: true, remaining: Infinity, mock: true })
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const { data: sub } = await supabase.from("subscriptions").select("plan_id").eq("user_id", user.id).single()
    const planId = (sub?.plan_id as string) || "free"
    const limit = PLAN_LIMITS[planId] || 10
    if (limit === -1) return NextResponse.json({ allowed: true, remaining: Infinity, plan: planId })

    const today = new Date().toISOString().slice(0, 10)
    const { data: usage } = await supabase.from("daily_usage")
      .select("chat_count").eq("user_id", user.id).eq("usage_date", today).maybeSingle()
    const used = usage?.chat_count || 0
    const remaining = Math.max(0, limit - used)

    return NextResponse.json({ allowed: remaining > 0, remaining, limit, plan: planId })
  } catch {
    return NextResponse.json({ allowed: true, remaining: Infinity })
  }
}
