import { AgentRegistry } from "./agents/registry"

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
  origin?: string,
): Promise<DailyContentResult> {
  const date = new Date().toISOString().slice(0, 10)
  const apiBase = origin || "https://sijian.cc.cd"

  // Step 1: Agent 13 选题分析
  const topicResult = await AgentRegistry.execute("agent_13", {
    instruction: `我是一名${platform}平台的${niche}领域博主，请推荐今日最佳选题（TOP 1）`,
    context: { userProfile: { platform, niche } },
  })

  let topic = topicResult.mainOutput || "今天分享什么"
  if (topicResult.structuredOutput?.topics?.[0]?.title) {
    topic = topicResult.structuredOutput.topics[0].title
  }

  // Step 2: Agent 04 生成分镜
  await AgentRegistry.execute("agent_04", {
    instruction: `为以下选题生成6个分镜脚本：${topic}。平台：${platform}，风格：${niche}`,
    parameters: { duration: "60" },
  })

  // Step 3: 用即梦出图
  const frames: string[] = []
  const prompts = [
    `关于"${topic}"的插图，${niche}风格，适合${platform}，电影质感，高清`,
    `"${topic}"，细节特写，高质量摄影风格，精致`,
    `"${topic}"，场景全景，氛围感，柔和光线`,
  ]

  for (const p of prompts) {
    if (frames.length >= 3) break
    try {
      const res = await fetch(apiBase + "/api/video/frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p.slice(0, 380), width: 1080, height: 1920 }),
      })
      const data = await res.json()
      if (data.url && !data.placeholder) {
        frames.push(data.url)
      } else if (data.error) {
        console.error("Frame API error:", data.error)
      }
    } catch (e: any) {
      console.error("Frame fetch error:", e.message)
    }
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

  return {
    date,
    userId,
    niche,
    platform,
    items: [
      {
        type: "text",
        title: topic,
        content: topic + "\n\n#" + niche + " #" + platform,
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
