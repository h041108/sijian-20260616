// ─── 即影 · 赛道诊断 ──────────────────────────
// 输入你的想法 → 一次调取DeepSeek → 输出完整诊断方案

export interface TrackExpertInput {
  userInput: string
  platform?: string
  niche?: string
}

export interface TrackExpertOutput {
  success: boolean
  taskId: string
  summary: string
  totalTime: number
}

export async function runTrackExpert(input: TrackExpertInput): Promise<TrackExpertOutput> {
  const startTime = Date.now()
  const taskId = "track_" + Date.now()
  const platform = input.platform || "小红书"

  const systemPrompt = "你是一位赛道诊断专家。用户会告诉你他的情况，你需要输出一份完整的自媒体创业诊断报告。\n\n直接输出，不要用JSON，不要用markdown。\n\n格式：\n\n🎯 赛道分析\n推荐你做什么方向：\n为什么适合你：\n这个方向的前景：\n\n👤 人设建议\n账号定位：\n内容风格：\n视觉方向：\n\n📅 内容规划\n每天发什么：\n每周发什么：\n爆款选题方向：\n\n💰 变现路径\n短期（1-2月）：\n中期（3-6月）：\n长期（6月+）：\n\n⚡ 行动建议\n现在立刻做的3件事：\n1.\n2.\n3.\n\n注意：给出的建议要具体、可执行、说人话。不要官方腔。"

  const userMessage = "我准备在" + platform + "做自媒体。" + input.userInput

  try {
    // 服务端：直接调DeepSeek
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return { success: false, taskId, summary: "DeepSeek API key 未配置", totalTime: Date.now() - startTime }
    }

    const base = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1"
    const res = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "未知错误")
      return { success: false, taskId, summary: "DeepSeek调用失败: " + errText.slice(0, 200), totalTime: Date.now() - startTime }
    }

    const data = await res.json()
    const summary = data.choices?.[0]?.message?.content || "诊断完成"

    return { success: true, taskId, summary, totalTime: Date.now() - startTime }
  } catch (err: any) {
    return { success: false, taskId, summary: "诊断失败: " + (err.message || "未知错误"), totalTime: Date.now() - startTime }
  }
}
