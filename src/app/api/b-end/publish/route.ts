import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, readFile, readdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, subject, grade, nodes, edges, frameType, domainType, password, expireDays, publisher } = body

    if (!nodes?.length) {
      return NextResponse.json({ error: "nodes required" }, { status: 400 })
    }

    const shareId = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const shareData = {
      id: shareId,
      topic, subject, grade,
      nodes, edges, frameType, domainType,
      password: password || null,
      expireAt: expireDays ? new Date(Date.now() + expireDays * 86400000).toISOString() : null,
      publisher: publisher || "匿名",
      createdAt: new Date().toISOString(),
      views: 0,
      viewLog: [] as { time: string }[],
    }

    const shareDir = path.join(process.cwd(), "public", "shared")
    await mkdir(shareDir, { recursive: true })
    await writeFile(path.join(shareDir, `${shareId}.json`), JSON.stringify(shareData, null, 2))

    return NextResponse.json({ success: true, shareUrl: `/share/${shareId}`, shareId })
  } catch (error) {
    console.error("Publish error:", error)
    return NextResponse.json({ error: "发布失败" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  const password = req.nextUrl.searchParams.get("password")

  // 无 id → 列出所有分享（不含敏感数据）
  if (!id || id === "list") {
    try {
      const dir = path.join(process.cwd(), "public", "shared")
      await mkdir(dir, { recursive: true })
      const files = await readdir(dir)
      const list = []
      for (const f of files) {
        if (!f.endsWith(".json")) continue
        try {
          const data = await readFile(path.join(dir, f), "utf-8")
          const item = JSON.parse(data)
          // 检查过期
          if (item.expireAt && new Date(item.expireAt) < new Date()) continue
          list.push({
            id: item.id,
            topic: item.topic || "知识空间",
            subject: item.subject || "",
            grade: item.grade || "",
            publisher: item.publisher || "匿名",
            hasPassword: !!item.password,
            createdAt: item.createdAt || "",
            expireAt: item.expireAt || null,
            views: item.views || 0,
          })
        } catch { continue }
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return NextResponse.json({ list })
    } catch {
      return NextResponse.json({ list: [] })
    }
  }

  // 有 id → 读取单个分享 + 密码验证
  try {
    const filePath = path.join(process.cwd(), "public", "shared", `${id}.json`)
    const data = await readFile(filePath, "utf-8")
    const share = JSON.parse(data)

    // 检查过期
    if (share.expireAt && new Date(share.expireAt) < new Date()) {
      return NextResponse.json({ error: "此分享已过期" }, { status: 410 })
    }

    // 密码验证
    if (share.password && share.password !== password) {
      return NextResponse.json({ needPassword: true, error: "需要访问密码" }, { status: 401 })
    }

    // 更新浏览记录
    share.views = (share.views || 0) + 1
    if (!share.viewLog) share.viewLog = []
    share.viewLog.push({ time: new Date().toISOString() })
    await writeFile(filePath, JSON.stringify(share, null, 2))

    return NextResponse.json(share)
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
}
