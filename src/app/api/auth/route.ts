// ─── POST /api/auth ──────────────────────────────────
// Supabase Auth 代理：登录/注册/登出
// 注册后自动确认邮箱（supabase auth email confirm 绕过）

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, password, nickname } = body

    if (!supabaseUrl || !supabaseAnonKey) {
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

      // 注册后立即用 Service Role Key 确认邮箱，跳过邮箱验证
      if (data.user && supabaseServiceKey) {
        try {
          const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
          await adminClient.auth.admin.updateUserById(data.user.id, {
            email_confirm: true,
          })
        } catch {}
      }

      // 注册成功后，自动在 profiles 和 subscriptions 创建记录
      if (data.user) {
        try {
          const displayName = nickname || email?.split("@")[0] || "用户"
          await supabase.from("profiles").upsert({
            id: data.user.id,
            nickname: displayName,
            role: "student",
          }, { onConflict: "id" }).maybeSingle()
        } catch {}

        try {
          await supabase.from("subscriptions").upsert({
            user_id: data.user.id,
            plan_id: "free",
          }, { onConflict: "user_id" }).maybeSingle()
        } catch {}
      }

      // 如果邮箱已确认（自动或 trigger），直接返回 session
      if (data.session) {
        return NextResponse.json(data)
      }

      // 没有 session → 尝试直接登录一次（某些配置下注册即登录）
      if (!supabaseServiceKey) {
        // 没有 Service Key 时，告诉用户去配置
        return NextResponse.json({
          ...data,
          _warning: "如需免邮箱确认，请在 Supabase Dashboard → Authentication → Settings 关闭 Confirm email，或在 .env.local 添加 SUPABASE_SERVICE_ROLE_KEY",
        })
      }

      return NextResponse.json(data)
    }

    if (action === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // 如果是邮箱未确认错误，尝试用 Service Key 确认后重试
        if (error.message?.includes("Email not confirmed") && supabaseServiceKey) {
          try {
            // 先查找用户 ID
            const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
              auth: { autoRefreshToken: false, persistSession: false },
            })
            const { data: users } = await adminClient.auth.admin.listUsers()
            const found = users?.users?.find(u => u.email === email)
            if (found) {
              await adminClient.auth.admin.updateUserById(found.id, {
                email_confirm: true,
              })
              // 确认后再试一次登录
              const retry = await supabase.auth.signInWithPassword({ email, password })
              if (retry.data?.session) {
                return NextResponse.json(retry.data)
              }
            }
          } catch {}
        }
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      return NextResponse.json(data)
    }

    if (action === "signout") {
      const { error } = await supabase.auth.signOut()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === "session") {
      const { data: { session } } = await supabase.auth.getSession()
      return NextResponse.json({ session })
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
