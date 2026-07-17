// GET /api/payment/plans — 从数据库获取价格（后台可调）
import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function GET() {
  const sb = getSupabase()
  if (!sb) {
    return NextResponse.json([
      { id: "free", name: "免费体验", price: "\u00a50", priceYearly: null, dailyLimit: 3, features: ["每日 3 次内容生成"], hot: false, icon: "\ud83c\udf31" },
      { id: "pro", name: "专业版", price: "\u00a520/月", priceYearly: "\u00a5199/年", dailyLimit: 50, features: ["每日 50 次内容生成", "全部 15 个 AI Agent", "无水印导出"], hot: true, icon: "\ud83d\ude80" },
      { id: "enterprise", name: "企业版", price: "\u00a5199/月", priceYearly: null, dailyLimit: 999999, features: ["不限量内容生成"], hot: false, icon: "\ud83c\udfe2" },
    ])
  }
  const { data } = await sb.from("payment_plans").select("*").eq("active", true).order("id")
  if (!data) return NextResponse.json([])
  return NextResponse.json(data.map((p) => ({
    id: p.id, name: p.name,
    price: p.price_monthly > 0 ? ("\u00a5" + (p.price_monthly/100) + "/月") : "\u00a50",
    priceYearly: p.price_yearly > 0 ? ("\u00a5" + (p.price_yearly/100) + "/年") : null,
    dailyLimit: p.daily_limit, features: p.features, hot: p.hot, icon: p.icon,
  })))
}
