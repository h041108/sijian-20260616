// ─── 视频思维质检引擎 ──────────────────────────────
// 思见独有能力的商业化：不在生成赛道竞争，在"认知质检"赛道定义品类
// 寄生在即梦/剪映/Sora之上，提供它们无法提供的思维质量分析

import { detectThinkingLines } from "./thinking-lines"
import { fullCognitionAnalysis } from "./cognition"
import { detectThinkingState } from "./cognition"
import { detectCognitiveIntent } from "./cognition"
import { detectEmotion } from "./cognition"
import { detectThinkingLines as dtl, getLineInfo } from "./thinking-lines"
import type { ThinkingLineId } from "./thinking-lines"

// ═══════════════════════════════════════════════════
// 1. 脚本思维诊断
// ═══════════════════════════════════════════════════

export interface ScriptCognitionReport {
  scriptText: string
  analyzedAt: string
  overallScore: number            // 0-100 综合思维质量
  grade: "excellent" | "good" | "average" | "weak"
  narrative: {
    causalClarity: number         // 因果清晰度 0-1
    logicalFlow: number           // 逻辑流畅度 0-1
    gaps: string[]                // 逻辑跳跃的具体位置
  }
  emotion: {
    curve: { position: number; intensity: number }[]  // 位置(0-1) → 情绪强度
    peakPosition: number          // 情绪高潮在什么位置
    isMonotone: boolean           // 是否太平淡
    suggestions: string[]
  }
  cognitiveLoad: {
    segments: { start: string; end: string; load: number; label: string }[]
    overloadPoints: string[]      // 观众可能"听不懂"的位置
    boringZones: string[]         // 观众可能"走神"的位置
    optimalDuration: number       // 建议的最佳时长（秒）
  }
  thinkingFramework: {
    detected: string[]            // 检测到的思维框架
    bestMatch: string             // 最匹配的叙事框架
    alternative: string           // 替代方案
  }
  aiAdvice: string                // 自然语言改进建议
}

export function analyzeScript(scriptText: string): ScriptCognitionReport {
  if (!scriptText || scriptText.trim().length < 10) {
    return {
      scriptText, analyzedAt: new Date().toISOString(),
      overallScore: 0, grade: "weak",
      narrative: { causalClarity: 0, logicalFlow: 0, gaps: ["脚本内容过短"] },
      emotion: { curve: [], peakPosition: 0, isMonotone: true, suggestions: ["增加脚本长度以进行有效分析"] },
      cognitiveLoad: { segments: [], overloadPoints: [], boringZones: [], optimalDuration: 0 },
      thinkingFramework: { detected: [], bestMatch: "无", alternative: "无" },
      aiAdvice: "脚本太短，无法进行分析。请提供至少50字的完整脚本。",
    }
  }

  // ── 段落拆分：按空行（\n\n）→ 按换行 → 2-3句一组 ──
  let rawParagraphs = scriptText
    .split(/\n\n+/)
    .map(s => s.trim())
    .filter(s => s.length >= 10)
  if (rawParagraphs.length < 3) {
    rawParagraphs = scriptText
      .split(/\n/)
      .map(s => s.trim())
      .filter(s => s.length >= 10)
  }
  // 如果拆分后仍太多（按句号拆出了每句话），按3句一组重新合并
  let paragraphs: string[]
  if (rawParagraphs.length > 20) {
    const sentences = scriptText.split(/[。！？\n]/).map(s => s.trim()).filter(s => s.length >= 6)
    paragraphs = []
    let chunk = ""
    for (let i = 0; i < sentences.length; i++) {
      chunk += (chunk ? "。" : "") + sentences[i]
      if ((i + 1) % 3 === 0 || i === sentences.length - 1) {
        if (chunk.length >= 10) paragraphs.push(chunk)
        chunk = ""
      }
    }
    if (paragraphs.length < 3) paragraphs = rawParagraphs.slice(0, 15)
  } else {
    paragraphs = rawParagraphs
  }

  const totalChars = scriptText.replace(/\s/g, "").length
  const lines = detectThinkingLines(scriptText)

  // ── 因果清晰度：因果关键词密度 ──
  const causalKeywords = ["因为","所以","导致","原因","结果","因此","由于","于是","从而"]
  const logicalKeywords = ["第一","第二","首先","然后","接着","最后","第一步","其次","接下来"]
  const causalHits = causalKeywords.filter(k => scriptText.includes(k)).length
  const logicalHits = logicalKeywords.filter(k => scriptText.includes(k)).length
  const causalClarity = Math.min(1, causalHits / Math.max(paragraphs.length / 3, 1))
  const logicalFlow = Math.min(1, logicalHits / Math.max(paragraphs.length / 4, 1))

  // ── 逻辑跳跃检测：相邻段共享关键词 ≥ 1 即视为连贯 ──
  const gaps: string[] = []
  for (let i = 1; i < paragraphs.length; i++) {
    const prev = paragraphs[i - 1]
    const curr = paragraphs[i]
    // 提取前一段的关键词（2字以上的中文词+4字以上英文词）
    const prevWords = new Set(prev.match(/[一-龥]{2,}|[a-zA-Z]{4,}/g) || [])
    const currWords = curr.match(/[一-龥]{2,}|[a-zA-Z]{4,}/g) || []
    const hasOverlap = currWords.some(w => prevWords.has(w))
    const hasConnector = /但是|然而|不过|而且|此外|另外|同时|接着|然后|所以|因此|接下来|于是|总之|综上所述/.test(curr)
    if (!hasOverlap && !hasConnector && prev.length > 15 && curr.length > 15) {
      gaps.push(`第${i}段→第${i+1}段缺乏主题衔接`)
    }
  }

  // ── 情绪曲线：采样每段情绪 ──
  const curve = paragraphs.map((p, i) => {
    const emo = detectEmotion(p)
    return { position: i / Math.max(paragraphs.length - 1, 1), intensity: emo.intensity * 0.6 + (emo.emotion !== "neutral" ? 0.4 : 0) }
  })
  const peakPosition = curve.length > 0
    ? curve.reduce((max, c) => c.intensity > max.intensity ? c : max, curve[0]).position
    : 0
  const isMonotone = curve.filter(c => c.intensity > 0.5).length < Math.max(2, paragraphs.length * 0.2)

  const emotionSuggestions: string[] = []
  if (isMonotone) emotionSuggestions.push("情绪曲线太平，建议在开头或中段加入冲突、悬念或反转")
  if (peakPosition > 0.85) emotionSuggestions.push("情绪高潮过于靠后——观众可能在前半段流失，建议亮点前置到前30%")

  // ── 认知负荷分析 ──
  const segments: ScriptCognitionReport["cognitiveLoad"]["segments"] = []
  const overloadPoints: string[] = []
  const boringZones: string[] = []

  for (const p of paragraphs.slice(0, 15)) {
    const cog = fullCognitionAnalysis(p, detectThinkingLines(p))
    const load = cog.l3.cognitiveLoad
    const label = load > 0.7 ? "⚠️ 高负荷" : load > 0.4 ? "适中" : "偏低"
    segments.push({ start: p.slice(0, 20), end: p.slice(-20), load, label })
    if (load > 0.75) overloadPoints.push(p.slice(0, 40) + "...")
    if (load < 0.15 && p.length > 20) boringZones.push(p.slice(0, 40) + "...")
  }

  const avgLoad = segments.length > 0 ? segments.reduce((s, seg) => s + seg.load, 0) / segments.length : 0.5

  // ── 建议时长：按字数估算（中文口播约 4字/秒）+ 画面停留 ──
  const optimalDuration = Math.round(
    Math.min(300, Math.max(15, totalChars / 4 + paragraphs.length * 3))
  )

  // ── 思维框架检测 ──
  const detectedFrames = lines.slice(0, 3).map(l => {
    const info = getLineInfo(l.lineId as ThinkingLineId)
    return info?.name || l.lineId
  })
  const bestMatch = detectedFrames[0] || "叙事线"
  const alternative = detectedFrames.length > 1 ? detectedFrames[1] : "对比线"

  // ── 综合评分：每个维度加权 ──
  const gapPenalty = Math.max(0, 1 - gaps.length / Math.max(paragraphs.length, 1))
  const emotionScore = isMonotone ? 0.3 : 0.8
  const overallScore = Math.round(
    Math.min(100, Math.max(10,
      causalClarity * 25 + logicalFlow * 25 + gapPenalty * 25 + emotionScore * 15 + Math.min(1, avgLoad * 1.2) * 10
    ))
  )

  let grade: ScriptCognitionReport["grade"] = "weak"
  if (overallScore >= 80) grade = "excellent"
  else if (overallScore >= 60) grade = "good"
  else if (overallScore >= 40) grade = "average"

  // ── AI 建议：按严重程度排序 ──
  const advice: string[] = []
  if (causalClarity < 0.3) advice.push(`因果清晰度仅${Math.round(causalClarity*100)}%，建议增加"因为/所以/导致/因此"等因果词连接段落逻辑`)
  if (logicalFlow < 0.3) advice.push(`逻辑结构不够清晰，建议使用"首先/然后/接着/最后"等序列词组织内容`)
  if (gaps.length > 2) advice.push(`${gaps.length}处段落间主题跳跃，建议增加过渡句或保持主题连贯`)
  if (isMonotone) advice.push("叙事节奏太平，建议加入对比、冲突或悬念元素")
  if (overloadPoints.length > 2) advice.push("部分段落认知负荷过高，建议拆分长句或降低信息密度")
  if (boringZones.length > 2) advice.push("存在信息密度偏低的段落，可能让观众走神")
  if (advice.length === 0) advice.push("整体思维结构良好，可以继续优化细节")

  return {
    scriptText: scriptText.slice(0, 300),
    analyzedAt: new Date().toISOString(),
    overallScore, grade,
    narrative: { causalClarity, logicalFlow, gaps },
    emotion: { curve, peakPosition, isMonotone, suggestions: emotionSuggestions },
    cognitiveLoad: { segments, overloadPoints, boringZones, optimalDuration },
    thinkingFramework: { detected: detectedFrames, bestMatch, alternative },
    aiAdvice: advice.join("；"),
  }
}

// ═══════════════════════════════════════════════════
// 2. 分镜智商评分
// ═══════════════════════════════════════════════════

export interface ShotIQ {
  shotIndex: number
  label: string
  description: string
  duration: number
  scores: {
    informationDensity: number    // 信息密度 0-1
    narrativeClarity: number      // 叙事清晰度 0-1
    emotionalImpact: number       // 情感冲击力 0-1
    visualGuidance: number        // 视觉引导力 0-1
    pacing: number               // 节奏感 0-1
    overall: number              // 综合 0-100
  }
  issues: string[]
  suggestions: string[]
  heatLevel: "cold" | "warm" | "hot"  // 需要重点关注的镜头
}

export function scoreShots(
  shots: { label: string; description: string; duration: number; dialogue?: string }[],
): ShotIQ[] {
  return shots.map((shot, i) => {
    const text = `${shot.description} ${shot.dialogue || ""}`
    const lines = detectThinkingLines(text)
    const cog = fullCognitionAnalysis(text, lines)

    // 信息密度：描述越详细 + 有对白 + 镜头时长 < 5秒 = 高密度
    const infoDensity = Math.min(1,
      (shot.description.length / 100) * 0.5 +
      (shot.dialogue ? 0.3 : 0) +
      (shot.duration < 5 ? 0.2 : shot.duration > 15 ? -0.1 : 0)
    )
    // 叙事清晰度：有明确的情感关键词 + 场景描述具体
    const narrativeClarity = Math.min(1,
      (/情绪|氛围|光线|构图|景别/.test(shot.description) ? 0.4 : 0.1) +
      (shot.description.length > 30 ? 0.3 : 0.1) +
      (cog.l1.confidence * 0.3)
    )
    // 情感冲击力
    const emotionalImpact = cog.l3.intensity * 0.5 + (cog.l3.emotion !== "neutral" ? 0.5 : 0)
    // 视觉引导：描述中有镜头运动、构图描述
    const visualGuidance = (/推|拉|摇|跟|特写|全景|中景|近景|构图|光影|色彩/.test(shot.description) ? 0.6 : 0.2)
    // 节奏感：时长适中
    const pacing = shot.duration >= 3 && shot.duration <= 10 ? 0.8 : shot.duration < 3 ? 0.4 : 0.5

    const overall = Math.round((infoDensity * 0.25 + narrativeClarity * 0.25 + emotionalImpact * 0.2 + visualGuidance * 0.15 + pacing * 0.15) * 100)

    const issues: string[] = []
    if (emotionalImpact < 0.3) issues.push("情感表达偏弱")
    if (visualGuidance < 0.4) issues.push("缺少镜头运动/构图描述")
    if (infoDensity < 0.2) issues.push("信息密度过低")
    if (infoDensity > 0.8) issues.push("信息密度过高，观众可能来不及理解")

    const suggestions: string[] = []
    if (emotionalImpact < 0.3) suggestions.push("增加情绪氛围描述，使用具体的情绪形容词和光影词汇")
    if (visualGuidance < 0.4) suggestions.push("补充镜头参数：景别、运镜方式、构图规则")
    if (infoDensity > 0.8) suggestions.push("拆分为2个镜头或延长时长")

    return {
      shotIndex: i,
      label: shot.label,
      description: shot.description.slice(0, 80),
      duration: shot.duration,
      scores: { informationDensity: infoDensity, narrativeClarity, emotionalImpact, visualGuidance, pacing, overall },
      issues, suggestions,
      heatLevel: overall < 45 ? "hot" : overall < 65 ? "warm" : "cold",
    }
  })
}

// ═══════════════════════════════════════════════════
// 3. 品牌思维一致性检测
// ═══════════════════════════════════════════════════

export interface BrandThinkingFingerprint {
  brandName: string
  dominantFrameworks: { name: string; prevalence: number }[]
  emotionalSignature: { emotion: string; intensity: number }[]
  pacingProfile: { avgShotDuration: number; narrativeArc: "build_up" | "reveal" | "contrast" | "teach" }
  cognitiveLoadProfile: { peakLoad: number; avgLoad: number; fluctuation: number }
  keywords: string[]
}

export interface ConsistencyReport {
  videoName: string
  brandFingerprint: BrandThinkingFingerprint
  videoProfile: Partial<BrandThinkingFingerprint>
  matchScore: number              // 0-100
  deviations: { category: string; description: string; severity: "minor" | "moderate" | "major" }[]
  recommendations: string[]
}

export function analyzeBrandConsistency(
  brandFingerprint: BrandThinkingFingerprint,
  videoScript: string,
  videoShots: { label: string; description: string; duration: number }[],
): ConsistencyReport {
  const scriptAnalysis = analyzeScript(videoScript)
  const shotsIQ = scoreShots(videoShots)

  const deviations: ConsistencyReport["deviations"] = []
  const recommendations: string[] = []

  // 框架匹配度
  const frameworkMatch = brandFingerprint.dominantFrameworks.filter(bf =>
    scriptAnalysis.thinkingFramework.detected.includes(bf.name)
  ).length

  if (frameworkMatch === 0) {
    deviations.push({ category: "思维框架", description: "视频使用的思维框架与品牌历史风格完全不匹配", severity: "major" })
    recommendations.push(`品牌常用框架: ${brandFingerprint.dominantFrameworks.map(f => f.name).join("、")}。建议重新组织叙事的思维结构`)
  }

  // 情绪匹配
  const videoEmotions = shotsIQ.map(s => s.scores.emotionalImpact)
  const avgEmotion = videoEmotions.reduce((a, b) => a + b, 0) / videoEmotions.length
  const brandEmotionIntensity = brandFingerprint.emotionalSignature.reduce((s, e) => s + e.intensity, 0) / brandFingerprint.emotionalSignature.length

  if (Math.abs(avgEmotion - brandEmotionIntensity) > 0.3) {
    deviations.push({ category: "情绪调性", description: `视频情绪强度(${Math.round(avgEmotion*100)}%)与品牌调性(${Math.round(brandEmotionIntensity*100)}%)偏差较大`, severity: "moderate" })
    recommendations.push(avgEmotion > brandEmotionIntensity ? "视频情绪偏强，考虑收敛情感表达" : "视频情绪偏弱，考虑增加情感元素")
  }

  // 认知负荷匹配
  const videoLoad = scriptAnalysis.cognitiveLoad.segments.reduce((s, seg) => s + seg.load, 0) / Math.max(scriptAnalysis.cognitiveLoad.segments.length, 1)
  if (Math.abs(videoLoad - brandFingerprint.cognitiveLoadProfile.avgLoad) > 0.25) {
    deviations.push({ category: "认知负荷", description: "视频的信息密度与品牌历史水平不一致", severity: "minor" })
  }

  // 节奏匹配
  const shotDurations = videoShots.map(s => s.duration)
  const avgShotDuration = shotDurations.reduce((a, b) => a + b, 0) / shotDurations.length
  if (Math.abs(avgShotDuration - brandFingerprint.pacingProfile.avgShotDuration) > 3) {
    deviations.push({ category: "节奏", description: `平均镜头时长(${avgShotDuration.toFixed(1)}s)与品牌(${brandFingerprint.pacingProfile.avgShotDuration}s)不一致`, severity: "moderate" })
  }

  const matchScore = Math.round(Math.max(0, 100 -
    deviations.filter(d => d.severity === "major").length * 25 -
    deviations.filter(d => d.severity === "moderate").length * 12 -
    deviations.filter(d => d.severity === "minor").length * 6
  ))

  return {
    videoName: videoScript.slice(0, 30) || "未命名视频",
    brandFingerprint,
    videoProfile: {
      dominantFrameworks: scriptAnalysis.thinkingFramework.detected.map(f => ({ name: f, prevalence: 0.5 })),
      pacingProfile: { avgShotDuration, narrativeArc: "build_up" },
    },
    matchScore, deviations, recommendations,
  }
}

// ═══════════════════════════════════════════════════
// 4. 受众认知匹配
// ═══════════════════════════════════════════════════

export interface AudienceCognitionMatch {
  videoName: string
  summary: string
  suitableAudiences: {
    profile: string
    matchScore: number
    reason: string
  }[]
  cognitiveTags: string[]
  optimalPlatforms: { platform: string; fit: number; reason: string }[]
  durationAdvice: string
  peakAttention: { start: number; end: number; label: string }[]
}

export function matchAudience(
  script: string,
  shots: { duration: number }[],
): AudienceCognitionMatch {
  const analysis = analyzeScript(script)
  const totalDuration = shots.reduce((s, sh) => s + sh.duration, 0)
  const lines = detectThinkingLines(script)
  const cognition = fullCognitionAnalysis(script, lines)

  // 认知标签
  const tags: string[] = []
  if (analysis.thinkingFramework.detected.includes("因果线")) tags.push("逻辑驱动")
  if (analysis.thinkingFramework.detected.includes("对比线")) tags.push("思辨型")
  if (analysis.thinkingFramework.detected.includes("叙事线")) tags.push("故事型")
  if (analysis.emotion.isMonotone) tags.push("信息型")
  else tags.push("情感型")
  if (analysis.cognitiveLoad.overloadPoints.length > 2) tags.push("高认知负荷")
  if (totalDuration <= 45) tags.push("碎片时间")
  if (totalDuration > 60) tags.push("深度内容")

  // 受众匹配
  const audiences = [
    {
      profile: "好奇心探索型",
      matchScore: analysis.thinkingFramework.detected.includes("发散线") || analysis.thinkingFramework.detected.includes("类比线") ? 88 : 55,
      reason: "喜欢被新奇的视角和跨领域联想所吸引",
    },
    {
      profile: "效率优先型",
      matchScore: totalDuration <= 45 && analysis.cognitiveLoad.overloadPoints.length < 2 ? 90 : 55,
      reason: "需要快速获取核心信息的简洁内容",
    },
    {
      profile: "深度思考型",
      matchScore: analysis.grade === "excellent" && totalDuration >= 60 ? 85 : totalDuration >= 60 ? 70 : 40,
      reason: "享受信息密度高、逻辑完整的深度内容",
    },
    {
      profile: "情感共鸣型",
      matchScore: !analysis.emotion.isMonotone && cognition.l3.emotion !== "neutral" ? 82 : 45,
      reason: "被情感起伏和故事讲述所打动",
    },
    {
      profile: "学习提升型",
      matchScore: analysis.narrative.logicalFlow > 0.6 && analysis.narrative.causalClarity > 0.5 ? 80 : 50,
      reason: "需要清晰的因果逻辑和结构化知识传递",
    },
  ].sort((a, b) => b.matchScore - a.matchScore)

  // 平台匹配
  const platforms = [
    { platform: "抖音/快手", fit: totalDuration <= 45 ? 90 : 40, reason: "碎片化内容平台，短视频为主" },
    { platform: "B站", fit: totalDuration >= 90 && analysis.grade !== "weak" ? 85 : 55, reason: "中长视频内容生态，用户耐心较高" },
    { platform: "视频号", fit: totalDuration <= 90 ? 75 : 55, reason: "社交分发，适合中等时长内容" },
    { platform: "小红书", fit: totalDuration <= 30 && tags.includes("故事型") ? 80 : 50, reason: "种草型短内容，强情感属性" },
  ].sort((a, b) => b.fit - a.fit)

  // 注意力高峰
  const peakAttention = analysis.emotion.curve
    .filter(c => c.intensity > 0.6)
    .map(c => ({
      start: c.position * totalDuration * 0.9,
      end: Math.min((c.position + 0.15) * totalDuration, totalDuration),
      label: c.intensity > 0.8 ? "高潮区" : "关注区",
    }))

  return {
    videoName: script.slice(0, 30),
    summary: `${analysis.grade === "excellent" ? "优秀的" : analysis.grade === "good" ? "良好" : "可优化"}叙事结构，${tags.slice(0, 3).join("·")}，建议时长${totalDuration.toFixed(0)}秒`,
    suitableAudiences: audiences,
    cognitiveTags: tags,
    optimalPlatforms: platforms,
    durationAdvice: totalDuration > 45 ? `当前${totalDuration.toFixed(0)}秒偏长，${tags.includes("碎片时间") ? "建议压缩到45秒以内" : "适合中视频平台"}` : "时长合理",
    peakAttention,
  }
}

// ═══════════════════════════════════════════════════
// 品牌指纹提取器
// ═══════════════════════════════════════════════════

export function extractBrandFingerprint(
  brandName: string,
  historicalScripts: string[],
  historicalShots: { label: string; description: string; duration: number }[][] = [],
): BrandThinkingFingerprint {
  // 聚合所有历史脚本的思维分析
  const allFrames = new Map<string, number>()
  const allEmotions = new Map<string, number>()
  const allShotDurations: number[] = []

  for (const script of historicalScripts) {
    const analysis = analyzeScript(script)
    for (const frame of analysis.thinkingFramework.detected) {
      allFrames.set(frame, (allFrames.get(frame) || 0) + 1)
    }
    const emo = detectEmotion(script)
    allEmotions.set(emo.emotion, (allEmotions.get(emo.emotion) || 0) + 1)
  }

  for (const shots of historicalShots) {
    for (const shot of shots) {
      allShotDurations.push(shot.duration)
    }
  }

  const totalFrames = Array.from(allFrames.values()).reduce((s, v) => s + v, 0)
  const totalEmotions = Array.from(allEmotions.values()).reduce((s, v) => s + v, 0)
  const avgShotDuration = allShotDurations.length > 0
    ? allShotDurations.reduce((s, d) => s + d, 0) / allShotDurations.length
    : 5

  return {
    brandName,
    dominantFrameworks: Array.from(allFrames.entries())
      .map(([name, count]) => ({ name, prevalence: count / totalFrames }))
      .sort((a, b) => b.prevalence - a.prevalence),
    emotionalSignature: Array.from(allEmotions.entries())
      .map(([emotion, count]) => ({ emotion, intensity: count / totalEmotions }))
      .sort((a, b) => b.intensity - a.intensity),
    pacingProfile: { avgShotDuration, narrativeArc: "build_up" },
    cognitiveLoadProfile: { peakLoad: 0.65, avgLoad: 0.45, fluctuation: 0.2 },
    keywords: [],
  }
}
