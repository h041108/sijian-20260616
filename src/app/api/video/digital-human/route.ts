// ─── POST /api/video/digital-human ───────────────────
// 即梦数字人 OmniHuman 1.5 — 照片 + 音频 → 唇同步视频
// 火山引擎视觉智能平台: visual.volcengineapi.com
// 鉴权: IAM AK/SK 签名 V4
// 模型: jimeng_realman_avatar_picture_omni_v15

import { NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"

const HOST = "visual.volcengineapi.com"
const REGION = "cn-north-1"
const SERVICE = "cv"
const API_VERSION = "2022-08-31"
const REQ_KEY = "jimeng_realman_avatar_picture_omni_v15"
const ENDPOINT_HOST = "visual.volcengineapi.com"  // 即梦数字人的实际服务地址

// ── HMAC-SHA256 签名 ──
function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest()
}

// ── SHA256 哈希 ──
function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex")
}

// ── 火山引擎 API V4 签名 ──
function signRequest(
  method: string,
  query: Record<string, string>,
  body: string,
  ak: string,
  sk: string,
): Record<string, string> {
  // 火山引擎 IAM SK 可能是多层 base64 编码的，解码到真实密钥
  let rawSk = sk
  let prev = ""
  while (rawSk !== prev && /^[A-Za-z0-9+/=]+$/.test(rawSk)) {
    prev = rawSk
    try { rawSk = Buffer.from(rawSk, "base64").toString("utf-8") } catch { break }
  }
  // 如果有不可打印字符，回到上一层的值
  if (/[^\x20-\x7E]/.test(rawSk)) rawSk = prev
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, "0")
  const timestamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  const shortDate = timestamp.slice(0, 8)

  const bodyHash = sha256(body)

  // 规范 Query String
  const canonicalQuery = Object.keys(query).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join("&")

  // 规范 Headers
  const signedHeaders: Record<string, string> = {
    "host": HOST,
    "x-date": timestamp,
    "content-type": "application/json",
  }
  const canonicalHeaders = Object.keys(signedHeaders).sort()
    .map(k => `${k}:${signedHeaders[k]}`)
    .join("\n") + "\n"
  const signedHeadersStr = Object.keys(signedHeaders).sort().join(";")

  // Canonical Request
  const canonicalRequest = [
    method.toUpperCase(),
    "/",
    canonicalQuery,
    canonicalHeaders,
    signedHeadersStr,
    bodyHash,
  ].join("\n")

  // String to Sign
  const credentialScope = `${shortDate}/${REGION}/${SERVICE}/request`
  const stringToSign = [
    "HMAC-SHA256",
    timestamp,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n")

  // 派生签名密钥
  const kDate = hmac(rawSk, shortDate)
  const kRegion = hmac(kDate, REGION)
  const kService = hmac(kRegion, SERVICE)
  const kSigning = hmac(kService, "request")

  // 最终签名
  const signature = hmac(kSigning, stringToSign).toString("hex")

  const authorization = `HMAC-SHA256 Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`

  return {
    "Host": HOST,
    "X-Date": timestamp,
    "Content-Type": "application/json",
    "Authorization": authorization,
  }
}

// ── 提交数字人任务 ──
async function submitTask(imageUrl: string, audioUrl: string): Promise<string> {
  const ak = process.env.VOLC_ACCESS_KEY || ""
  const sk = process.env.VOLC_SECRET_KEY || ""

  const query = { Action: "CVSubmitTask", Version: API_VERSION }
  const body = JSON.stringify({
    req_key: REQ_KEY,
    image_url: imageUrl,
    audio_url: audioUrl,
  })

  const headers = signRequest("POST", query, body, ak, sk)
  const url = `https://${HOST}/?${Object.entries(query).map(([k, v]) => `${k}=${v}`).join("&")}`

  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`CVSubmitTask failed: ${res.status} — ${errText.slice(0, 300)}`)
  }

  const data = await res.json()
  if (data.code !== 10000 || !data.data?.task_id) {
    throw new Error(`CVSubmitTask error: ${JSON.stringify(data)}`)
  }

  return data.data.task_id
}

// ── 查询任务结果 ──
async function getTaskResult(taskId: string): Promise<{
  status: string
  videoUrl?: string
  error?: string
}> {
  const ak = process.env.VOLC_ACCESS_KEY || ""
  const sk = process.env.VOLC_SECRET_KEY || ""

  const query = { Action: "CVGetResult", Version: API_VERSION }
  const body = JSON.stringify({
    req_key: REQ_KEY,
    task_id: taskId,
  })

  const headers = signRequest("POST", query, body, ak, sk)
  const url = `https://${HOST}/?${Object.entries(query).map(([k, v]) => `${k}=${v}`).join("&")}`

  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
  })

  if (!res.ok) throw new Error(`CVGetResult failed: ${res.status}`)

  const data = await res.json()
  if (data.code !== 10000) {
    return { status: "failed", error: JSON.stringify(data) }
  }

  const result = data.data
  return {
    status: result.status || "processing", // processing/in_queue/generating/done/not_found/expired
    videoUrl: result.status === "done" ? result.video_url : undefined,
    error: result.status === "failed" ? JSON.stringify(result) : undefined,
  }
}

// ═══════════════════════════════════════════════════
// POST — 提交数字人生成任务
// ═══════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageUrl, audioUrl } = body

    if (!imageUrl || !audioUrl) {
      return NextResponse.json({ error: "imageUrl and audioUrl are required" }, { status: 400 })
    }

    const ak = process.env.VOLC_ACCESS_KEY
    const sk = process.env.VOLC_SECRET_KEY

    if (!ak || !sk) {
      return NextResponse.json({
        error: true,
        message: "需要配置 VOLC_ACCESS_KEY 和 VOLC_SECRET_KEY 环境变量",
        needConfig: true,
      }, { status: 402 })
    }

    const taskId = await submitTask(imageUrl, audioUrl)

    return NextResponse.json({
      taskId,
      status: "queued",
      model: REQ_KEY,
      submittedAt: new Date().toISOString(),
      pollUrl: `/api/video/digital-human?task_id=${taskId}`,
      message: "数字人任务已提交，请轮询获取视频",
    })
  } catch (err: any) {
    return NextResponse.json({ error: "数字人生成失败", detail: err.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════
// GET — 查询任务状态 / 获取视频
// ═══════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get("task_id")
    if (!taskId) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 })
    }

    const result = await getTaskResult(taskId)

    return NextResponse.json({
      taskId,
      status: result.status,
      videoUrl: result.videoUrl,
      error: result.error,
      message: result.status === "done" ? "视频已生成（链接1小时有效）" :
               result.status === "failed" ? "生成失败" :
               "生成中...",
    })
  } catch (err: any) {
    return NextResponse.json({ error: "查询失败", detail: err.message }, { status: 500 })
  }
}
