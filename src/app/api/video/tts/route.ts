// ─── POST /api/video/tts ─────────────────────────────
// 三层 TTS：火山引擎 → Edge-TTS（免费零配置）→ Seedance 回退
// Edge-TTS 是微软免费服务，无需 API Key

import { NextRequest, NextResponse } from "next/server"

const VOLC_ACCESS_KEY = process.env.VOLC_ACCESS_KEY || ""
const VOLC_SECRET_KEY = process.env.VOLC_SECRET_KEY || ""

// 火山引擎 HMAC-SHA256 签名
async function signVolc(method: string, path: string, body: string, ak: string, sk: string) {
  const date = new Date().toISOString().replace(/[:-]/g, "").split(".")[0] + "Z"
  const { createHmac, createHash } = await import("crypto")
  const sha256 = createHash("sha256").update(body).digest("hex").toLowerCase()
  const signedHeaders = "content-type;host;x-content-sha256;x-date"
  const sigStr = `${method}\n${path}\n\ncontent-type:application/json\nhost:openspeech.bytedance.com\nx-content-sha256:${sha256}\nx-date:${date}\n\n${signedHeaders}\n${sha256}`
  const signKey = createHmac("sha256", `\x01${sk}`).update(date).digest()
  const signature = createHmac("sha256", signKey).update(sigStr).digest("hex")
  return {
    Authorization: `HMAC-SHA256 Credential=${ak}/${date.slice(0, 8)}/cn-north-1/tts/request, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "Content-Type": "application/json",
    "X-Date": date,
    "X-Content-Sha256": sha256,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, voice = "zh-CN-XiaoxiaoNeural", speed = 1.0 } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 })
    }

    // Layer 1: 火山引擎 TTS（豆包）
    if (VOLC_ACCESS_KEY && VOLC_SECRET_KEY) {
      try {
        const ttsBody = JSON.stringify({
          app: { appid: "tta_default" },
          user: { uid: "sijian" },
          request: {
            reqid: `sijian_${Date.now()}`,
            text: text.slice(0, 500),
            text_type: "plain",
            operation: "query",
            voice_type: voice.includes("zh-CN") ? "BV001_streaming" : voice,
            speed_ratio: speed,
            pitch_ratio: 1.0,
            volume_ratio: 1.0,
          },
        })
        const headers = await signVolc("POST", "/api/v1/tts", ttsBody, VOLC_ACCESS_KEY, VOLC_SECRET_KEY)
        const apiRes = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
          method: "POST", headers, body: ttsBody,
        })
        if (apiRes.ok) {
          const data = await apiRes.json()
          if (data.data?.audio) {
            return NextResponse.json({ audio: data.data.audio, format: "mp3", duration: data.data.duration || 0, text, source: "volc" })
          }
        }
      } catch {}
    }

    // Layer 2: Edge-TTS（微软免费，零配置）
    try {
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
        <voice name="${voice.includes("zh-CN") ? voice : "zh-CN-XiaoxiaoNeural"}">
          <prosody rate="${(speed * 100).toFixed(0)}%">${text.slice(0, 500).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</prosody>
        </voice>
      </speak>`

      const tokenRes = await fetch("https://edge.microsoft.com/translate/auth", { method: "GET" })
      if (tokenRes.ok) {
        const token = await tokenRes.text()
        const audioRes = await fetch(`https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-160kbitrate-mono-mp3",
          },
          body: ssml,
        })
        if (audioRes.ok) {
          const audioBuffer = await audioRes.arrayBuffer()
          return NextResponse.json({
            audio: Buffer.from(audioBuffer).toString("base64"),
            format: "mp3", duration: 0, text, source: "edge-tts",
          })
        }
      }
    } catch {}

    // Layer 3: Seedance 回退
    return NextResponse.json({
      text, useSeedanceAudio: true,
      message: "TTS 不可用，使用 Seedance generateAudio 模式",
      fallback: true,
    })
  } catch (err: any) {
    return NextResponse.json({
      text: "", useSeedanceAudio: true,
      message: "TTS 异常，回退到 Seedance 音频",
      error: err.message, fallback: true,
    })
  }
}
