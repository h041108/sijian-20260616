// ─── POST /api/video/seedance ──────────────────────────
// Seedance 2.0 视频生成 API
// 火山引擎 ARK 平台 → 异步任务 → 轮询获取视频
// 模型：doubao-seedance-2-0-260128 / doubao-seedance-2-0-fast-260128

import { NextRequest, NextResponse } from "next/server"

const ARK_BASE = "https://ark.cn-beijing.volces.com/api/v3"
const SEEDANCE_TASKS = `${ARK_BASE}/contents/generations/tasks`

const MODEL_IDS: Record<string, string> = {
  "seedance-2.0": "doubao-seedance-2-0-260128",
  "seedance-2.0-fast": "doubao-seedance-2-0-fast-260128",
  "seedance-1.0-lite-i2v": "doubao-seedance-1-0-lite-i2v-250428",
}

function getApiKey(): string | null {
  return process.env.SEEDANCE_API_KEY || process.env.JIMENG_API_KEY || null
}

// ═══════════════════════════════════════════════════
// POST — 提交视频生成任务
// ═══════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      prompt,
      imageUrl,
      model = "seedance-2.0-fast",
      resolution = "720p",
      ratio = "9:16",       // 默认竖屏（抖音）
      duration = 5,
      generateAudio = false,
      watermark = false,
      seed,
      returnLastFrame = false,
      referenceImageUrls,    // 参考图（0-9张）
    } = body

    if (!prompt && !imageUrl) {
      return NextResponse.json({ error: "prompt or imageUrl is required" }, { status: 400 })
    }

    const apiKey = getApiKey()
    if (!apiKey) {
      return NextResponse.json({
        error: true,
        message: "请配置 SEEDANCE_API_KEY 或 JIMENG_API_KEY 环境变量",
        placeholder: true,
      }, { status: 402 })
    }

    const modelId = MODEL_IDS[model] || model

    // 构建 content 数组
    const content: any[] = []

    // 参考图（多模态参考生视频）
    if (referenceImageUrls && Array.isArray(referenceImageUrls) && referenceImageUrls.length > 0) {
      for (const refUrl of referenceImageUrls) {
        content.push({
          type: "image_url",
          image_url: { url: refUrl },
          role: "reference_image",
        })
      }
    }

    // 首帧图（图生视频）
    if (imageUrl) {
      content.push({
        type: "image_url",
        image_url: { url: imageUrl },
        role: "first_frame",
      })
    }

    // 文本提示词
    const textPrompt = prompt || "画面缓慢运镜，电影感画质"
    content.push({ type: "text", text: textPrompt })

    const requestBody: Record<string, any> = {
      model: modelId,
      content,
      resolution,
      ratio,
      duration,
      generate_audio: generateAudio,
      watermark,
    }
    if (seed !== undefined) requestBody.seed = seed
    if (returnLastFrame) requestBody.return_last_frame = true

    console.log("[Seedance] Submitting task:", { model: modelId, prompt: textPrompt.slice(0, 80), ratio, duration })

    const res = await fetch(SEEDANCE_TASKS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[Seedance] Submit failed:", res.status, errText.slice(0, 500))
      return NextResponse.json({
        error: true,
        statusCode: res.status,
        apiResponse: errText.slice(0, 500),
        message: `Seedance 任务提交失败: ${res.status}`,
      }, { status: 502 })
    }

    const data = await res.json()
    const taskId = data.id

    return NextResponse.json({
      taskId,
      status: "queued",
      model: modelId,
      prompt: textPrompt.slice(0, 200),
      ratio,
      duration,
      submittedAt: new Date().toISOString(),
      pollUrl: `/api/video/seedance?task_id=${taskId}`,
      message: "任务已提交，请轮询获取视频",
    })
  } catch (err: any) {
    console.error("[Seedance] Error:", err)
    return NextResponse.json({ error: "视频生成请求失败", detail: err.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════
// GET — 查询任务状态 / 获取视频
// ═══════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get("task_id")
    if (!taskId) {
      return NextResponse.json({ error: "task_id query param is required" }, { status: 400 })
    }

    const apiKey = getApiKey()
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 402 })
    }

    const url = `${SEEDANCE_TASKS}/${taskId}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({
        error: true,
        statusCode: res.status,
        apiResponse: errText.slice(0, 300),
      }, { status: 502 })
    }

    const data = await res.json()

    const result: any = {
      taskId: data.id,
      status: data.status, // queued | running | succeeded | failed | expired
      model: data.model,
      resolution: data.resolution,
      ratio: data.ratio,
      duration: data.duration,
    }

    if (data.status === "succeeded") {
      result.videoUrl = data.content?.video_url || ""
      result.expiresAt = data.content?.video_url_expires_at || ""
      result.usage = data.usage
      result.message = "视频已生成（直链24小时有效，请及时下载）"
    } else if (data.status === "failed") {
      result.error = data.error || data.last_error || "未知错误"
      result.message = "视频生成失败"
    } else {
      result.message = `任务${data.status === "running" ? "生成中" : "排队中"}...`
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error("[Seedance] Poll error:", err)
    return NextResponse.json({ error: "查询任务状态失败", detail: err.message }, { status: 500 })
  }
}
