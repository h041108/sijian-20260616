// ─── 爆款趋势抓取与拆解引擎 ──────────────────────────
// 对标 Coze 工作流能力：搜索 → 拆解 → 模板化
// 使用 Tavily 搜索 + DeepSeek 结构拆解

export interface ViralTemplate {
  title: string
  platform: string
  category: string
  hookStyle: string        // 开头钩子风格
  scriptStructure: string  // 脚本结构模式
  pacing: string           // 节奏/时长
  emotionalCurve: string   // 情绪曲线
  conversionTactic: string // 转化话术
  visualStyle: string      // 视觉风格
  keywords: string[]       // 关键词
  sourceUrl: string        // 来源
}

export interface TrendDeconstructResult {
  query: string
  searchedAt: string
  rawResults: { title: string; url: string; content: string }[]
  viralTemplates: ViralTemplate[]
  recommendedApproach: string
}

export async function searchViralTrends(
  query: string,
  platform: string = "抖音",
): Promise<{ title: string; url: string; content: string }[]> {
  const fullQuery = `${platform} ${query} viral trending short video 2026`

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY || "",
        query: fullQuery,
        search_depth: "advanced",
        max_results: 8,
        include_raw_content: true,
      }),
    })

    if (!res.ok) return []

    const data = await res.json()
    return (data.results || []).slice(0, 6).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      content: (r.raw_content || r.content || "").slice(0, 3000),
    }))
  } catch {
    return []
  }
}

export function buildDeconstructPrompt(results: { title: string; content: string }[], query: string): string {
  const context = results
    .map((r, i) => `[来源${i + 1}] ${r.title}\n${r.content.slice(0, 800)}`)
    .join("\n---\n")

  return `你是一位抖音/TikTok爆款视频拆解专家。以下是关于「${query}」的爆款内容参考：

${context}

请拆解这些爆款内容，提取可复用的「爆款模板」。严格按照以下JSON格式返回（不要```json标记，直接返回JSON）：

{
  "viralTemplates": [
    {
      "title": "模板名称（≤10字）",
      "platform": "抖音/快手/TikTok",
      "category": "类目（美妆/食品/家居/穿搭/数码/知识/剧情）",
      "hookStyle": "开头钩子策略（一句话描述，如：反常识提问/痛点直击/视觉冲击/悬念留白）",
      "scriptStructure": "脚本结构（如：问题→放大痛点→产品登场→效果对比→限时催促）",
      "pacing": "节奏描述（如：前3秒抛出钩子，中间15秒展示，最后5秒转化）",
      "emotionalCurve": "情绪曲线（如：好奇→共鸣→渴望→冲动下单）",
      "conversionTactic": "转化话术策略（如：限时折扣暗示/从众心理/权威背书/场景植入）",
      "visualStyle": "视觉风格（如：明亮暖色调/暗调高级感/手机原相机/后期字幕密集）",
      "keywords": ["关键词1", "关键词2", "关键词3"],
      "sourceUrl": ""
    }
  ],
  "recommendedApproach": "综合建议：针对「${query}」品类，推荐使用什么模板策略，为什么（≤150字）"
}

要求：
- 每个模板必须具体可操作，不能空泛
- 至少提取3个不同的模板
- scriptStructure和hookStyle必须是可直接用于脚本生成的模式
- 所有字段用中文填写`
}

export async function deconstructTrends(
  query: string,
  platform?: string,
): Promise<TrendDeconstructResult> {
  const rawResults = await searchViralTrends(query, platform)

  if (rawResults.length === 0) {
    return {
      query,
      searchedAt: new Date().toISOString(),
      rawResults: [],
      viralTemplates: [],
      recommendedApproach: "",
    }
  }

  const deconstructPrompt = buildDeconstructPrompt(rawResults, query)

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: "你是一位专业的短视频爆款分析专家。你只返回JSON，不返回任何其他内容。" },
          { role: "user", content: deconstructPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!res.ok) {
      return { query, searchedAt: new Date().toISOString(), rawResults, viralTemplates: [], recommendedApproach: "" }
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ""

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { query, searchedAt: new Date().toISOString(), rawResults, viralTemplates: [], recommendedApproach: "" }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      query,
      searchedAt: new Date().toISOString(),
      rawResults,
      viralTemplates: parsed.viralTemplates || [],
      recommendedApproach: parsed.recommendedApproach || "",
    }
  } catch (err: any) {
    return {
      query,
      searchedAt: new Date().toISOString(),
      rawResults,
      viralTemplates: [],
      recommendedApproach: "",
    }
  }
}

// 将拆解结果注入到故事创世的 prompt 中
export function injectViralTemplateIntoPrompt(
  originalPrompt: string,
  template: ViralTemplate,
): string {
  return `${originalPrompt}

【参考爆款模板——来自抖音/快手数据分析】
- 钩子策略：${template.hookStyle}
- 脚本结构：${template.scriptStructure}
- 节奏控制：${template.pacing}
- 情绪曲线：${template.emotionalCurve}
- 转化话术：${template.conversionTactic}
- 视觉参考：${template.visualStyle}

请借鉴以上爆款模板的脚本结构和节奏,但内容用自己的创意重新构建。`
}
