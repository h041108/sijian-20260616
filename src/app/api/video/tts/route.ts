// ─── POST /api/video/tts ─────────────────────────────
// 文字转语音 — 火山引擎语音合成
// 备用方案：如果 ARK 不支持独立 TTS，使用 Seedance 1.5 Pro 的 TextToAudioVideo 能力
// 客户端兜底：浏览器 SpeechSynthesis API（无需 API Key）

import { NextRequest, NextResponse } from "next/server"

const ARK_BASE = "https://ark.cn-beijing.volces.com/api/v3"

// 火山引擎语音合成配置
const VOICE_MAP: Record<string, string> = {
  "zh_female_qingxin": "BV001_streaming",
  "zh_male_qingse": "BV002_streaming",
  "zh_female_tianmei": "BV003_streaming",
  "zh_female_shuiniu": "BV004_streaming",
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, voice = "zh_female_qingxin", speed = 1.0, volume = 1.0 } = body

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 })
    }

    const apiKey = process.env.JIMENG_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: true,
        message: "需要配置 JIMENG_API_KEY 环境变量",
        useClientTTS: true,
      }, { status: 402 })
    }

    // 火山引擎语音合成 API v2
    const voiceType = VOICE_MAP[voice] || "BV001_streaming"

    try {
      const ttsRes = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          app: { appid: "sijian" },
          user: { uid: "sijian-user" },
          audio: {
            voice_type: voiceType,
            encoding: "mp3",
            speed_ratio: speed,
            volume_ratio: volume,
          },
          request: {
            text,
            text_type: "plain",
            operation: "query",
          },
        }),
      })

      if (ttsRes.ok) {
        const data = await ttsRes.json()
        if (data.audio) {
          return NextResponse.json({
            audioUrl: `data:audio/mp3;base64,${data.audio}`,
            format: "mp3",
            message: "TTS 生成成功",
          })
        }
      }
    } catch {}

    // 兜底：返回文本，提示客户端使用浏览器 TTS
    return NextResponse.json({
      error: true,
      message: "TTS API 暂不可用，已降级为浏览器语音合成",
      useClientTTS: true,
      text,
    })
  } catch (err: any) {
    return NextResponse.json({ error: "TTS 请求失败", detail: err.message, useClientTTS: true }, { status: 500 })
  }
}
