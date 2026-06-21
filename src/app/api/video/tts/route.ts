// ─── POST /api/video/tts ─────────────────────────────
// Seedance 1.5 Pro 图文生视频 → 自带音频
// 不做独立TTS，直接返回文本，上游用 Seedance generateAudio

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { text } = body
  return NextResponse.json({
    text,
    message: "使用 Seedance generateAudio 模式生成带语音的视频",
    useSeedanceAudio: true,
  })
}

