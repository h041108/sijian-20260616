// ─── POST /api/sync/project ────────────────────────
// 将 video project 异步同步到 Supabase
// 不阻塞前端，失败不影响用户体验

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ synced: false, reason: "no supabase config" })
  }
  try {
    const body = await req.json()
    const { project } = body
    if (!project?.id) return NextResponse.json({ synced: false }, { status: 400 })

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ synced: false, reason: "no session" })

    await supabase.from("video_projects").upsert({
      id: project.id,
      user_id: user.id,
      one_liner: project.oneLiner || "",
      genre: project.genre || "short_drama",
      style: project.style || "",
      duration: project.duration || 60,
      aspect_ratio: project.aspectRatio || "16:9",
      status: project.status || "draft",
      stages: project.stages || [],
      viral_template: project.viralTemplate || null,
    }, { onConflict: "id" })

    return NextResponse.json({ synced: true })
  } catch {
    return NextResponse.json({ synced: false })
  }
}
