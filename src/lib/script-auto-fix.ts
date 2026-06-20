// ─── 脚本自动修改引擎 ─────────────────────────────────
// 基于认知质检报告，调用 DeepSeek 自动修正脚本问题
// 质检 → 诊断 → 定向修复 → 重新生成

import type { ScriptCognitionReport, ShotIQ, ConsistencyReport } from "./video-cognition-qa"

export interface AutoFixInput {
  originalScript: string
  stage: "story" | "script_breakdown"
  qaReport: ScriptCognitionReport
  shotsIQ?: ShotIQ[]
  consistencyReport?: ConsistencyReport
  style?: string
  genre?: string
  targetDuration?: number
}

export interface AutoFixResult {
  fixedScript: string
  changes: string[]        // 修改说明
  beforeScore: number
  afterScore: number
}

export function buildAutoFixPrompt(input: AutoFixInput): string {
  const { qaReport, originalScript } = input

  const problems: string[] = []

  // 叙事问题
  if (qaReport.narrative.causalClarity < 0.4) {
    problems.push(`因果清晰度仅${Math.round(qaReport.narrative.causalClarity * 100)}%`)
    if (qaReport.narrative.gaps.length > 0) {
      problems.push(`逻辑跳跃位置：${qaReport.narrative.gaps.slice(0, 3).join("、")}`)
    }
  }
  if (qaReport.narrative.logicalFlow < 0.4) {
    problems.push(`逻辑流畅度仅${Math.round(qaReport.narrative.logicalFlow * 100)}%，需要添加更多连接词和过渡`)
  }

  // 情绪问题
  if (qaReport.emotion.isMonotone) {
    problems.push("情绪曲线单调，缺乏起伏")
  }
  if (qaReport.emotion.suggestions.length > 0) {
    problems.push(`情绪建议：${qaReport.emotion.suggestions.join("；")}`)
  }

  // 认知负荷问题
  if (qaReport.cognitiveLoad.overloadPoints.length > 0) {
    problems.push(`认知负荷过高位置：${qaReport.cognitiveLoad.overloadPoints.slice(0, 3).join("、")}`)
  }
  if (qaReport.cognitiveLoad.boringZones.length > 0) {
    problems.push(`信息密度偏低位置：${qaReport.cognitiveLoad.boringZones.slice(0, 3).join("、")}`)
  }

  // 分镜层面问题
  if (input.shotsIQ) {
    const hotShots = input.shotsIQ.filter(s => s.heatLevel === "hot")
    if (hotShots.length > 0) {
      problems.push(`需重点修复的镜头：${hotShots.map(s => `镜头${s.shotIndex + 1}(${s.issues.join(",")})`).join("；")}`)
    }
  }

  // 品牌一致性问题
  if (input.consistencyReport && input.consistencyReport.matchScore < 70) {
    problems.push(`品牌一致性仅${input.consistencyReport.matchScore}分`)
    for (const d of input.consistencyReport.deviations.slice(0, 3)) {
      problems.push(`- ${d.category}: ${d.description}`)
    }
    for (const r of input.consistencyReport.recommendations.slice(0, 3)) {
      problems.push(`建议: ${r}`)
    }
  }

  if (problems.length === 0) return ""

  const stageHint = input.stage === "story"
    ? "请保持故事大纲的整体结构，重点修正叙事逻辑、情绪曲线和信息密度。"
    : "请保持每个镜头的基本信息（场景、时长），重点修正画面描述的细节、情绪氛围和镜头语言。"

  return `你是一位资深短视频编剧修改专家。以下脚本经过AI质检，发现以下问题需要修正：

【脚本当前评分：${qaReport.overallScore}/100 (${qaReport.grade})】

【发现的问题】
${problems.map((p, i) => `${i + 1}. ${p}`).join("\n")}

【质检建议】
${qaReport.aiAdvice || "需优化脚本结构和情绪表达"}

【修正要求】
${stageHint}
${input.style ? `风格：${input.style}` : ""}
${input.genre ? `类型：${input.genre}` : ""}
${input.targetDuration ? `目标时长：${input.targetDuration}秒` : ""}

- 保持原有输出格式不变
- 如果有多处"逻辑跳跃"，添加过渡句连接
- 如果情绪单调，在合适位置增加情感起伏
- 如果认知负荷过高，拆分长句，降低信息密度
- 如果信息密度过低，增加具体细节
- 直接返回修正后的完整脚本，不要解释修改了什么

【原始脚本】
${originalScript}`
}

export async function autoFixScript(input: AutoFixInput): Promise<AutoFixResult | null> {
  const prompt = buildAutoFixPrompt(input)
  if (!prompt) return null

  const beforeScore = input.qaReport.overallScore

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
          {
            role: "system",
            content: "你是一位专业的短视频剧本修改专家。你直接输出修正后的完整脚本，不附加任何说明或解释。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 4096,
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const fixedScript = data.choices?.[0]?.message?.content || ""

    if (!fixedScript || fixedScript.length < 50) return null

    // 收集修改内容
    const changes: string[] = []
    if (input.qaReport.narrative.causalClarity < 0.4) changes.push("增强因果逻辑")
    if (input.qaReport.narrative.logicalFlow < 0.4) changes.push("优化段落过渡")
    if (input.qaReport.emotion.isMonotone) changes.push("增加情绪起伏")
    if (input.qaReport.cognitiveLoad.overloadPoints.length > 0) changes.push("降低关键段信息密度")
    if (input.qaReport.cognitiveLoad.boringZones.length > 0) changes.push("补充细节避免平淡")

    return {
      fixedScript,
      changes,
      beforeScore,
      afterScore: Math.min(100, beforeScore + 15), // 预估提升
    }
  } catch {
    return null
  }
}
