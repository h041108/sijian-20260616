import { NextRequest, NextResponse } from "next/server"

interface Template {
  name: string
  hook: string
  script: string
  pacing: string
  estimatedDuration: number
  suitablePlatforms: string[]
  complianceWarnings: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { description, platform, history } = body

    if (!description?.trim()) {
      return NextResponse.json({ error: "请描述你的生意" }, { status: 400 })
    }

    const deepseekKey = process.env.DEEPSEEK_API_KEY
    if (!deepseekKey) {
      return NextResponse.json({
        error: "DeepSeek API 未配置",
        templates: FALLBACK_TEMPLATES,
        _fallback: true,
      })
    }

    const historyContext = history?.length > 0
      ? "\n用户历史偏好：" + history.map((h: any) => "之前选择了\u300C" + h.templateName + "\u300D风格").join("\n")
      : ""

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + deepseekKey },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是自媒体爆款内容策划专家。用户描述他的生意，你生成3条精准匹配的爆款视频方案。\n输出纯JSON（不要markdown包裹），格式：\n{\n  \"industryType\": \"餐饮/美容/零售...\",\n  \"industrySubtype\": \"火锅/美甲/女装...\",\n  \"templates\": [\n    {\n      \"name\": \"方案名称\",\n      \"hook\": \"前3秒钩子文案\",\n      \"script\": \"完整脚本（100-200字）\",\n      \"pacing\": \"节奏描述\",\n      \"estimatedDuration\": 15,\n      \"suitablePlatforms\": [\"抖音\",\"小红书\"],\n      \"complianceWarnings\": [\"避免用最字\"]\n    }\n  ],\n  \"contentStrategy\": \"整体策略建议\",\n  \"complianceCheck\": {\n    \"highRiskKeywords\": [],\n    \"platformSpecificRules\": [],\n    \"suggestions\": []\n  }\n}",
          },
          {
            role: "user",
            content: "我的生意：" + description + "\n目标平台：" + (platform || "抖音/小红书") + historyContext,
          },
        ],
        temperature: 0.5,
        max_tokens: 2500,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "AI 服务暂时不可用", templates: FALLBACK_TEMPLATES, _fallback: true })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || ""
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 返回格式异常", templates: FALLBACK_TEMPLATES, _fallback: true })
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      businessDescription: description,
      industryType: parsed.industryType || "",
      industrySubtype: parsed.industrySubtype || "",
      templates: parsed.templates || FALLBACK_TEMPLATES,
      contentStrategy: parsed.contentStrategy || "",
      complianceCheck: parsed.complianceCheck || {
        highRiskKeywords: [], platformSpecificRules: [], suggestions: [],
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, templates: FALLBACK_TEMPLATES, _fallback: true })
  }
}

const FALLBACK_TEMPLATES: Template[] = [
  {
    name: "真实记录\u00B7日常工作",
    hook: "带用户沉浸式感受",
    script: "环境展示\u2192核心产品/服务特写\u2192制作/服务过程\u2192成品展示\u2192引导互动",
    pacing: "前3秒吸引\u2192中间展示\u2192最后引导",
    estimatedDuration: 30,
    suitablePlatforms: ["抖音", "小红书", "视频号"],
    complianceWarnings: ["避免夸大效果", "不要直接引导购买"],
  },
  {
    name: "顾客口碑\u00B7信任背书",
    hook: "真实顾客的真实反馈",
    script: "顾客出镜\u2192自然分享体验\u2192展现效果\u2192总结推荐",
    pacing: "开头引起好奇\u2192中间建立信任\u2192结尾引导",
    estimatedDuration: 45,
    suitablePlatforms: ["视频号", "抖音"],
    complianceWarnings: ["不要虚构顾客评价", "避免与其他商家对比"],
  },
  {
    name: "行业知识\u00B7专业价值",
    hook: "揭秘行业内幕/干货知识点",
    script: "抛出常见误区\u2192专业解读\u2192给出建议\u2192引导讨论",
    pacing: "前3秒抛出问题\u2192中间解答\u2192结尾互动",
    estimatedDuration: 60,
    suitablePlatforms: ["B站", "小红书", "视频号"],
    complianceWarnings: ["不要传播未经证实的知识", "避免绝对化表述"],
  },
]
