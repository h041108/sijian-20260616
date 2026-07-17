// GET /api/payment/status
import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function GET() {
  const sb = getSupabase()
  if (!sb) return NextResponse.json({ status: "unknown" })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ status: "unknown" })

  const { data } = await sb.from("payment_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single()
  if (!data) return NextResponse.json({ status: "none" })
  return NextResponse.json({ id: data.id, planId: data.plan_id, amount: data.amount, status: data.status })
}