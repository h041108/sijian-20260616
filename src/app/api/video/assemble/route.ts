// ─── POST /api/video/assemble ────────────────────────
// 返回 HTML 页面用于客户端 Canvas 合成
// Vercel 无法运行 FFmpeg → 用客户端 MediaRecorder API 合成

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { frames, audioUrl, duration, width = 1920, height = 1080 } = body

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: "frames array is required" }, { status: 400 })
    }

    // 返回合成参数给客户端处理
    return NextResponse.json({
      status: "ready",
      frames: frames.map((f: any, i: number) => ({
        ...f,
        index: i,
        startTime: i * (duration / frames.length),
        endTime: (i + 1) * (duration / frames.length),
      })),
      totalFrames: frames.length,
      totalDuration: duration,
      width, height,
      assemblyScript: "client_side_canvas", // 指示客户端用 Canvas + MediaRecorder 合成
      message: "请在前端使用 Canvas API 合成视频。图片已就绪。",
    })
  } catch (err) {
    console.error("Assemble API error:", err)
    return NextResponse.json({ error: "合成失败" }, { status: 500 })
  }
}
