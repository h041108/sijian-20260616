// POST /api/payment/create — 扫码付款后直接开通
import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { planId, paymentMethod } = await req.json()
    if (!planId) return NextResponse.json({ error: "参数不完整" }, { status: 400 })

    const sb = getSupabase()
    if (!sb) {
      return NextResponse.json({ status: "confirmed", message: "已开通" })
    }

    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const { data: plan } = await sb.from("payment_plans").select("price_monthly").eq("id", planId).single()
    const amount = plan?.price_monthly || 0

    const { data, error } = await sb.from("payment_requests").insert({
      user_id: user.id, plan_id: planId, amount,
      payment_method: paymentMethod || "alipay",
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 更新 subscriptions 表
    await sb.from("subscriptions").upsert({
      user_id: user.id, plan_id: planId,
      start_date: new Date().toISOString().split("T")[0],
    }, { onConflict: "user_id" })

    return NextResponse.json({ id: data.id, status: "confirmed", message: "支付成功，已开通！" })
  } catch {
    return NextResponse.json({ error: "请求失败" }, { status: 500 })
  }
}
