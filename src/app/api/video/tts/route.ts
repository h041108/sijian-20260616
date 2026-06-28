// ─── POST /api/video/tts ─────────────────────────────
// 火山引擎 TTS（豆包语音合成）
// 回退：Seedance generateAudio 模式

import { NextRequest, NextResponse } from "next/server"

const VOLC_ACCESS_KEY = process.env.VOLC_ACCESS_KEY || ""
const VOLC_SECRET_KEY = process.env.VOLC_SECRET_KEY || ""
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || ""
const JIMENG_API_KEY = process.env.JIMENG_API_KEY || ""
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""

// HMAC-SHA256 签名（火山引擎标准鉴权）
async function signVolc(method: string, path: string, body: string, ak: string, sk: string) {
  const date = new Date().toISOString().replace(/[:-]/g, "").split(".")[0] + "Z"
  const { createHmac, createHash } = await import("crypto")
  const md5 = createHash("md5").update(body).digest("hex").toLowerCase()
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
    const { text, voice = "BV001_streaming", speed = 1.0, pitch = 1.0 } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 })
    }

    // 优先: 火山引擎 TTS (豆包)
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
            voice_type: voice,
            speed_ratio: speed,
            pitch_ratio: pitch,
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
            return NextResponse.json({ audio: data.data.audio, format: "mp3", duration: data.data.duration || 0, text })
          }
        }
      } catch {}
    }

    // 回退: 豆包 API 模式
    if (DOUBAO_API_KEY) {
      try {
        const apiRes = await fetch("https://api.doubao.com/v1/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${DOUBAO_API_KEY}` },
          body: JSON.stringify({
            model: "doubao-tts-1",
            input: text.slice(0, 500),
            voice: voice,
            response_format: "mp3",
            speed: speed,
          }),
        })
        if (apiRes.ok) {
          const audioBuffer = await apiRes.arrayBuffer()
          return NextResponse.json({
            audio: Buffer.from(audioBuffer).toString("base64"),
            format: "mp3", duration: 0, text,
          })
        }
      } catch {}
    }

    // 最后回退: Seedance generateAudio 模式
    return NextResponse.json({
      text, useSeedanceAudio: true,
      message: "TTS API 不可用，使用 Seedance generateAudio 模式",
      fallback: true,
    })
  } catch (err: any) {
    return NextResponse.json({
      text: "", useSeedanceAudio: true,
      message: "TTS 服务异常，回退到 Seedance 音频",
      error: err.message, fallback: true,
    })
  }
}
