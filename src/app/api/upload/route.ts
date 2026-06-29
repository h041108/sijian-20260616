import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // 限制文件大小 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 })
    }

    // 方案A：尝试写入本地文件系统（开发环境有效，Vercel serverless 只读）
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      await mkdir(uploadDir, { recursive: true })
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const filePath = path.join(uploadDir, `${timestamp}_${safeName}`)
      await writeFile(filePath, buffer)
      const url = `/uploads/${timestamp}_${safeName}`
      return NextResponse.json({ success: true, url, name: file.name, size: file.size, type: file.type })
    } catch {
      // Vercel 环境写文件失败，回退到 base64
    }

    // 方案B：回退到 base64 data URL（适用于 < 5MB 图片，Vercel 生产环境）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件过大，请压缩后上传" }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const dataUrl = `data:${file.type || "image/png"};base64,${base64}`

    return NextResponse.json({
      success: true,
      url: dataUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: true, // 前端标记：这是 base64 data URL，不是可上传链接
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "上传失败" }, { status: 500 })
  }
}
