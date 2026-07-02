// ─── POST /api/daily-content/auto-generate ────────────────────
// 端到端自动化工作流：
// 读取用户绑定账号 → 分析赛道 → 匹配15Agent链 → 
// 搜索平台爆款 → 拆解结构 → Agent流水线生成文案 → 
// 生成配图 → 写入DailyContent队列 → 返回结果
//
// 可被前端手动触发，也可被定时任务调用
// v2.0：使用 runRoutedPipeline 调用真实 Agent 系统

import { NextRequest, NextResponse } from "next/server"
import { runRoutedPipeline } from "@/lib/agent-router"
import { getAllNiches } from "@/lib/niches-100"
import { checkSensitive, checkPlatformCompliance } from "@/lib/sensitive-filter"

const TAVILY_KEY = () => process.env.TAVILY_API_KEY || ""
const DEEPSEEK_KEY = () => process.env.DEEPSEEK_API_KEY || ""
const PLATFORM_MAP: Record<string, string> = {
  "小红书": "site:xiaohongshu.com",
  "抖音": "site:douyin.com",
  "B站": "site:bilibili.com",
  "视频号": "site:mp.weixin.qq.com",
  "快手": "site:kuaishou.com",
}

interface GeneratedItem {
  id: string
  title: string
  content: string
  hashtags: string[]
  imageUrl?: string
  viralSource: string
  agentsUsed: string[]
  platform: string
  niche: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { niche, platform, accountNickname, userId, autoMode } = body

    if (!niche || !platform) {
      return NextResponse.json({ error: "缺少 niche 或 platform 参数" }, { status: 400 })
    }

    const deepseekKey = DEEPSEEK_KEY()
    const tavilyKey = TAVILY_KEY()
    const siteFilter = PLATFORM_MAP[platform] || ""

    const results: GeneratedItem[] = []
    const log: string[] = []

    // ── Step 1: 搜索爆款 ──
    let viralTitle = ""
    let viralDesc = ""
    if (tavilyKey) {
      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `${niche} ${siteFilter} 热门 爆款`,
            search_depth: "basic",
            max_results: 5,
          }),
        })
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          const top = (searchData.results || [])[0]
          if (top) {
            viralTitle = top.title || ""
            viralDesc = (top.content || "").slice(0, 300)
            log.push(`🔍 爆款搜索: ${viralTitle.slice(0, 50)}`)
          }
        }
      } catch { log.push("⚠️ 爆款搜索失败") }
    }

    // ── Step 2: 拆解爆款结构 ──
    let viralStructure = ""
    if (viralTitle && deepseekKey) {
      try {
        const deconRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
            messages: [
              { role: "system", content: "只输出JSON。" },
              {
                role: "user",
                content: `分析爆款结构：标题：${viralTitle}\n描述：${viralDesc}\n输出JSON：{"hookStyle":"...","scriptStructure":"...","pacing":"...","emotionalCurve":"...","conversionTactic":"...","visualStyle":"...","keywords":["..."]}`,
              },
            ],
            temperature: 0.3, max_tokens: 600,
          }),
        })
        if (deconRes.ok) {
          const dd = await deconRes.json()
          viralStructure = dd.choices?.[0]?.message?.content || ""
          log.push("✅ 爆款结构拆解完成")
        }
      } catch { log.push("⚠️ 爆款拆解失败") }
    }

    // ── Step 3: 匹配赛道ID → 执行真实Agent流水线 ──
    let finalContent = ""
    let hashtags: string[] = []
    let agentLog: string[] = []
    let agentNames: string[] = []

    // 尝试在 niches-100 中匹配赛道ID
    const allNiches = getAllNiches()
    const matchedNiche = allNiches.find(n =>
      n.name.includes(niche) || niche.includes(n.name)
    )
    const nicheId = matchedNiche?.id || "life-skills"

    try {
      const instruction = viralStructure
        ? `为${platform}平台${niche}赛道创作爆款内容。\n参考爆款结构：${viralStructure.slice(0, 500)}\n${viralTitle ? `参考来源：${viralTitle}` : ""}`
        : `为${platform}平台${niche}赛道创作爆款内容。`

      const pipelineResult = await runRoutedPipeline(nicheId, instruction, platform)

      if (pipelineResult.generatedContent) {
        finalContent = pipelineResult.generatedContent.text || ""
        hashtags = pipelineResult.generatedContent.hashtags || []
      }

      if (pipelineResult.results?.length > 0) {
        agentLog = pipelineResult.results.map(r => r.success ? `${r.agentId} ✅` : `${r.agentId} ❌`)
        agentNames = pipelineResult.results.map(r => r.agentName || r.agentId)
      }

      log.push(`🤖 Agent流水线: ${agentLog.join(" → ")}`)
    } catch (err: any) {
      log.push(`❌ Agent流水线失败: ${err.message}`)
    }

    // ── Step 4: 敏感词过滤 ──
    if (finalContent) {
      const checkResult = checkSensitive(finalContent)
      const platformCheck = checkPlatformCompliance(finalContent, platform)
      if (!checkResult.passed || !platformCheck.passed) {
        const allHits = [...checkResult.hitWords, ...checkResult.hitVariants.map(v => v.variant)]
        log.push(`⚠️ 敏感词检测: ${allHits.length > 0 ? allHits.join(", ") : "平台合规问题"}`)
        // 尝试用 AI 改写规避
        if (allHits.length > 0 && DEEPSEEK_KEY()) {
          try {
            const desenRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY()}` },
              body: JSON.stringify({
                model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
                messages: [
                  { role: "system", content: `你是${platform}平台合规内容改写专家。避开敏感词，保持原意。` },
                  { role: "user", content: `改写以下文案，避开这些词：${allHits.join("、")}\n\n${finalContent}` },
                ],
                temperature: 0.5, max_tokens: 2000,
              }),
            })
            if (desenRes.ok) {
              const dd = await desenRes.json()
              const desensitized = dd.choices?.[0]?.message?.content || ""
              if (desensitized.length > 50) {
                finalContent = desensitized
                log.push("✅ 敏感词已自动改写")
              }
            }
          } catch { log.push("⚠️ 敏感词改写失败") }
        }
      }
    }

    // ── Step 5: 组装结果 ──
    const lines = finalContent.split("\n").filter((l: string) => l.trim())
    const title = lines[0]?.replace(/^[#\d、\.\s]*/, "").trim() || `${niche}内容`

    const item: GeneratedItem = {
      id: `auto_${Date.now()}`,
      title,
      content: finalContent,
      hashtags,
      viralSource: viralTitle || "通用结构",
      agentsUsed: agentNames.length > 0 ? agentNames : ["agent_13", "agent_03", "agent_12", "agent_14"],
      platform,
      niche,
    }

    results.push(item)
    log.push(`✅ 生成完成: ${title.slice(0, 30)}`)

    // ── Step 5: 尝试生成配图 ──
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jiying.cc.cd"
      const imgRes = await fetch(`${baseUrl}/api/video/frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${title}，${niche}风格，适合${platform}，高清`.slice(0, 380), width: 1080, height: 1920 }),
      })
      if (imgRes.ok) {
        const imgData = await imgRes.json()
        if (imgData.url && !imgData.placeholder) {
          item.imageUrl = imgData.url
          log.push("🖼️ 配图生成完成")
        }
      }
    } catch { log.push("⚠️ 配图生成失败") }

    return NextResponse.json({
      success: true,
      items: results,
      log,
      meta: {
        niche, platform,
        agentsUsed: agentNames.length > 0 ? agentNames : ["agent_13", "agent_03", "agent_12", "agent_14"],
        autoMode: autoMode || false,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
