// ─── /api/video/projects ─────────────────────────────
// 作品云端持久化 — Supabase 存储
// GET: 拉取用户所有作品
// POST: 保存作品到云端
// DELETE: 删除作品

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  const userId = req.nextUrl.searchParams.get("userId") || "anonymous"

  try {
    const { data, error } = await supabase
      .from("video_projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      // 表可能还不存在，返回空
      return NextResponse.json({ projects: [], message: "表尚未创建，请执行建表SQL" })
    }

    return NextResponse.json({ projects: data || [] })
  } catch {
    return NextResponse.json({ projects: [] })
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { id, userId = "anonymous", oneLiner, genre, style, duration, aspectRatio, status, stages, createdAt } = body

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const { error } = await supabase
      .from("video_projects")
      .upsert({
        id,
        user_id: userId,
        one_liner: oneLiner || "",
        genre: genre || "short_drama",
        style: style || "",
        duration: duration || 60,
        aspect_ratio: aspectRatio || "16:9",
        status: status || "draft",
        stages: stages || [],
        created_at: createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: "作品已同步到云端" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  try {
    const { error } = await supabase
      .from("video_projects")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: "作品已从云端删除" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
