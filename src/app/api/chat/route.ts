import { NextRequest, NextResponse } from "next/server"
import { chat } from "@/lib/deepseek"
import { deepSearch } from "@/lib/search"
import { detectThinkingLines } from "@/lib/thinking-lines"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, existingNodes, imageData } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 })
    }

    const lastUserMsg = messages[messages.length - 1]?.content || ""

    // 更全面的搜索触发词检测
    const searchPatterns = [
      /下载/, /试卷/, /真题/, /考题/, /试题/, /高考/, /考卷/, /历年/,
      /中考/, /考研/, /考公/, /模拟/, /真题卷/, /真题答案/,
      /最新的/, /今年/, /2024/, /2025/, /2026/, /今天/, /新闻/, /最新/,
      /搜索/, /帮我查/, /帮我找/, /帮我搜/, /网上/, /查一下/,
      /找一下/, /现在/, /当前/, /最近/, /现在/, /目前/,
      /全国卷/, /省份卷/, /新课标/, /考试说明/, /考试大纲/,
    ]
    const needsSearch = searchPatterns.some(p => p.test(lastUserMsg))

    let enhancedMessages = messages

    if (needsSearch) {
      // 提取核心搜索词（去命令词）
      const searchQuery = lastUserMsg
        .replace(/请|帮我|给我|能不能|可以|下载下来|下载|/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100)

      console.log("[搜索] 触发:", searchQuery)
      const searchContent = await deepSearch(searchQuery, 3)
      console.log("[搜索] 获取:", searchContent.length, "字符")

      if (searchContent.length > 80) {
        enhancedMessages = messages.map((m: any, i: number) => {
          if (i === messages.length - 1 && m.role === "user") {
            return {
              role: m.role,
              content: `${m.content}\n\n[以下是联网搜索获取的最新真实信息。你必须基于这些信息回答——不要说你搜不到，搜到了多少就用多少。如果结果中包含题目就逐题展示。如果信息不完整就把已有信息整理出来，同时诚实告知搜到的内容有限]\n\n${searchContent.slice(0, 8000)}`,
            }
          }
          return m
        })
      } else if (searchContent.length > 0) {
        // 搜索结果很少，让AI如实告知
        enhancedMessages = messages.map((m: any, i: number) => {
          if (i === messages.length - 1 && m.role === "user") {
            return {
              role: m.role,
              content: `${m.content}\n\n[联网搜索尝试获取了信息但结果很少。请诚实告知用户搜索到的内容有限，并给出替代建议——比如建议用户直接粘贴试卷内容或拍照上传]`,
            }
          }
          return m
        })
      }
    }

    const result = await chat(enhancedMessages, existingNodes || [], imageData || null)

    // 检测思维线路
    const thinkingLines = detectThinkingLines(lastUserMsg)

    return NextResponse.json({ ...result, thinkingLines })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "AI 服务暂时不可用，请稍后重试。" }, { status: 500 })
  }
}
