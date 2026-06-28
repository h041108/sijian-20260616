// ─── POST /api/auth ──────────────────────────────────
// Supabase Auth 代理：登录/注册/登出

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, password, nickname } = body

    if (!supabaseUrl || !supabaseAnonKey) {
      // 无 Supabase 配置：返回模拟成功
      return NextResponse.json({
        user: { id: `mock_${Date.now()}`, email, nickname: nickname || "用户" },
        session: { access_token: "mock_token" },
        mock: true,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nickname: nickname || email?.split("@")[0] || "用户" } },
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json(data)
    }

    if (action === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return NextResponse.json({ error: error.message }, { status: 401 })
      return NextResponse.json(data)
    }

    if (action === "signout") {
      const { error } = await supabase.auth.signOut()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // 获取 Session
    if (action === "session") {
      const { data: { session } } = await supabase.auth.getSession()
      return NextResponse.json({ session })
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
