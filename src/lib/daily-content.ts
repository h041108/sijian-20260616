// ─── 每日内容生成流水线 ─────────────────────────
// 每天凌晨自动执行：选题 → 分镜 → 出图 → 封面 → 标签 → 推送审核

import { AgentRegistry } from "./agents/registry"
import type { AgentId } from "./agents/types"

export interface DailyContentResult {
  date: string
  userId: string
  niche: string
  platform: string
  items: {
    type: "text" | "image" | "video"
    title: string
    content: string
    imageUrls: string[]
    hashtags: string[]
    status: "pending"
  }[]
}

export async function generateDailyContent(
  userId: string,
  platform: string,
  niche: string,
): Promise<DailyContentResult> {
  const date = new Date().toISOString().slice(0, 10)

  // Step 1: Agent 13 选题分析
  const topicResult = await AgentRegistry.execute("agent_13", {
    instruction: `我是一名${platform}平台的${niche}领域博主，请推荐今日最佳选题（TOP 1）`,
    context: { userProfile: { platform, niche } },
  })

  let topic = topicResult.mainOutput || "今天分享什么"
  // 尝试从structuredOutput提取标题
  if (topicResult.structuredOutput?.topics?.[0]?.title) {
    topic = topicResult.structuredOutput.topics[0].title
  }

  // Step 2: Agent 04 生成6个分镜
  const scriptResult = await AgentRegistry.execute("agent_04", {
    instruction: `为以下选题生成6个分镜脚本：${topic}。平台：${platform}，风格：适合${niche}领域`,
    parameters: { duration: "60" },
  })
  const script = scriptResult.mainOutput || topic

  // Step 3: 用即梦出关键帧图片
  const frames: string[] = []
  const prompt = `关于"${topic}"的插图，${niche}风格，适合${platform}平台，电影质感`

  try {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'https://sijian.cc.cd')
    const frameRes = await fetch(baseUrl + "/api/video/frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt.slice(0, 380),
        width: 1080,
        height: 1920,
      }),
    })
    const frameData = await frameRes.json()
    if (frameData.url && !frameData.placeholder) {
      frames.push(frameData.url)
    }
  } catch {}

  // 生成多个变体
  const variations = [
    prompt + "，主视觉突出",
    prompt + "，细节特写",
    prompt + "，场景全景",
  ]

  for (const v of variations.slice(0, 3)) {
    if (frames.length >= 3) break
    try {
      const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'https://sijian.cc.cd')
      const res = await fetch(baseUrl + "/api/video/frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: v.slice(0, 380),
          width: 1080,
          height: 1920,
        }),
      })
      const data = await res.json()
      if (data.url && !data.placeholder) {
        frames.push(data.url)
      }
    } catch {}
  }

  // Step 4: Agent 14 标签SEO
  const tagResult = await AgentRegistry.execute("agent_14", {
    instruction: topic,
    context: { userProfile: { platform } },
  })

  let hashtags: string[] = []
  if (tagResult.structuredOutput?.coreTags) {
    hashtags = tagResult.structuredOutput.coreTags.map((t: any) => t.tag).slice(0, 5)
  }

  // Step 5: Agent 12 封面
  await AgentRegistry.execute("agent_12", {
    instruction: topic,
    context: { userProfile: { platform } },
  })

  // 组装结果
  return {
    date,
    userId,
    niche,
    platform,
    items: [
      {
        type: "text",
        title: topic,
        content: `${topic}\n\n#${niche} #${platform}`,
        imageUrls: frames.slice(0, 1),
        hashtags,
        status: "pending",
      },
      {
        type: "image",
        title: topic + " - 配图",
        content: topic,
        imageUrls: frames,
        hashtags,
        status: "pending",
      },
    ],
  }
}
