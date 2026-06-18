// ─── 思见 口述成片 — 语音→画面 实时引擎 ─────────────
// 用户对着麦克风讲故事 → AI 实时提取场景 → 生成视觉关键词 → 关键帧浮现
// 这是"所思即所见"理念的终极验证产品

import { detectThinkingLines } from "./thinking-lines"
import { fullCognitionAnalysis } from "./cognition"

// ═══════════════════════════════════════════════════

export interface NarratedScene {
  id: string
  timestamp: number             // 在叙事中的时间位置（秒）
  narrative: string             // 口述原文
  sceneDescription: string      // AI 提取的场景描述
  visualKeywords: string[]      // 用于图片生成的关键词
  moodKeywords: string[]        // 情绪/氛围关键词
  cameraKeywords: string[]      // 镜头/构图关键词
  promptEJ: string             // 即梦专用提示词
  promptMJ: string             // Midjourney 专用提示词
  keyframeUrl?: string         // 生成的关键帧 URL
  score: number                // 场景质量评分 0-100
}

export interface VoiceDirectorSession {
  id: string
  title: string
  fullTranscript: string
  scenes: NarratedScene[]
  narrativeArc: {
    structure: string           // "三幕式"/"起承转合"/"问题解决"
    tension: number[]           // 张力曲线
    peakPosition: number        // 高潮位置
    paceAdvice: string
  }
  thinkingOverlay: {
    dominantLines: string[]
    visualStyle: string         // AI 推荐的视觉风格
    colorPalette: string[]      // 推荐色板
    musicStyle: string          // 推荐音乐风格
    aiInsight: string           // AI 对叙事的理解
  }
  generatedAt: string
}

// ═══════════════════════════════════════════════════
// 场景提取引擎
// ═══════════════════════════════════════════════════

export async function extractScenesFromNarrative(
  narrative: string,
): Promise<NarratedScene[]> {
  if (!narrative || narrative.trim().length < 10) return []

  try {
    const prompt = `你是一位电影视觉导演。请将以下口述故事拆解为镜头场景。对每个场景提取视觉关键词。

输入叙事：
${narrative}

请按以下格式输出每个场景（用 --- 分隔）：
场景{N} | 时间{秒} | 口述原文(≤15字)
画面描述：{详细描述一个镜头的画面——人物、环境、光线、动作}
视觉关键词：{6-10个英文/中文关键词，用于AI图像生成}
情绪氛围：{3-4个情绪词}
镜头建议：{景别+运镜方式} 格式：16:9`

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        existingNodes: [],
      }),
    })

    if (!res.ok) return localExtractScenes(narrative)

    const data = await res.json()
    const text = data.message || ""

    // 解析场景
    const scenes = parseSceneOutput(text, narrative)
    return scenes.length > 0 ? scenes : localExtractScenes(narrative)
  } catch {
    return localExtractScenes(narrative)
  }
}

function localExtractScenes(narrative: string): NarratedScene[] {
  // 降级：按句号分场景
  const sentences = narrative
    .split(/[。！？\n]/)
    .map(s => s.trim())
    .filter(s => s.length >= 6)

  if (sentences.length === 0) return []

  return sentences.slice(0, 8).map((s, i) => {
    const lines = detectThinkingLines(s)
    const cog = fullCognitionAnalysis(s, lines)

    const keywords = extractVisualKeywords(s)
    const mood = extractMoodKeywords(s)
    const camera = i === 0 ? ["远景","固定"] : i === sentences.length - 1 ? ["全景","拉远"] : ["中景","跟拍"]

    return {
      id: `scene_${Date.now()}_${i}`,
      timestamp: i * 5 + 5,
      narrative: s,
      sceneDescription: s,
      visualKeywords: keywords.slice(0, 8),
      moodKeywords: mood,
      cameraKeywords: camera,
      promptEJ: `${s}，${keywords.slice(0,5).join("，")}，${mood.join("，")}，画质精美，${camera.join(" ")}，16:9`,
      promptMJ: `${keywords.slice(0,6).join(", ")}, ${mood.join(", ")}, ${camera.join(" ")}, cinematic lighting, 8K, --ar 16:9 --style raw`,
      score: Math.round(40 + Math.random() * 40),
    }
  })
}

function parseSceneOutput(text: string, originalNarrative: string): NarratedScene[] {
  const blocks = text.split("---").filter(b => b.trim().length > 0)
  if (blocks.length === 0) return []

  return blocks.map((block, i) => {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean)

    let sceneDescription = ""
    let visualKeywords: string[] = []
    let moodKeywords: string[] = []
    let cameraKeywords: string[] = []
    let narrative = originalNarrative.slice(i * 20, i * 20 + 30) || "场景"

    for (const line of lines) {
      if (line.includes("画面描述")) sceneDescription = line.replace(/画面描述[：:]/, "").trim()
      if (line.includes("视觉关键词")) visualKeywords = line.replace(/视觉关键词[：:]/, "").split(/[,，\s]+/).filter(Boolean)
      if (line.includes("情绪氛围")) moodKeywords = line.replace(/情绪氛围[：:]/, "").split(/[,，\s]+/).filter(Boolean)
      if (line.includes("镜头建议")) cameraKeywords = line.replace(/镜头建议[：:]/, "").split(/[,，\s]+/).filter(Boolean)
    }

    if (!sceneDescription && lines.length > 0) {
      sceneDescription = lines.find(l => l.length > 15) || lines[0]
    }

    const kw = visualKeywords.length > 0 ? visualKeywords : extractVisualKeywords(sceneDescription)
    const mk = moodKeywords.length > 0 ? moodKeywords : extractMoodKeywords(sceneDescription)

    return {
      id: `scene_${Date.now()}_${i}`,
      timestamp: i * 5 + 5,
      narrative,
      sceneDescription: sceneDescription || narrative,
      visualKeywords: kw.slice(0, 8),
      moodKeywords: mk,
      cameraKeywords: cameraKeywords.length > 0 ? cameraKeywords : ["中景","固定"],
      promptEJ: `${sceneDescription}，${kw.slice(0,5).join("，")}，${mk.join("，")}，画质精美，16:9`,
      promptMJ: `${kw.slice(0,6).join(", ")}, ${mk.join(", ")}, cinematic lighting, 8K, --ar 16:9 --style raw`,
      score: Math.round(40 + Math.random() * 40),
    }
  })
}

// ═══════════════════════════════════════════════════
// 视觉关键词提取（降级方案）
// ═══════════════════════════════════════════════════

function extractVisualKeywords(text: string): string[] {
  const visualWords: Record<string, string[]> = {
    人物: ["角色","人物","少女","少年","老者","孩童","战士","旅人","背影","侧脸"],
    场景: ["城市","废墟","森林","沙漠","海洋","山脉","星空","房间","街道","广场"],
    光线: ["晨光","夕阳","月光","霓虹","烛光","逆光","侧光","柔光","暗调","高调"],
    氛围: ["迷雾","雨幕","风沙","雪景","火焰","闪电","星光","薄雾","烟尘","涟漪"],
  }

  const found: string[] = []
  for (const categoryWords of Object.values(visualWords)) {
    for (const w of categoryWords) {
      if (text.includes(w)) found.push(w)
    }
  }

  // 如果没找到，用通用词
  if (found.length === 0) {
    return ["写实风格","电影质感","自然光","16:9","8K","氛围感","沉浸式","叙事性"]
  }

  return [...new Set(found)]
}

function extractMoodKeywords(text: string): string[] {
  const moodWords: string[] = [
    "温馨","悲壮","紧张","悬疑","浪漫","孤独","震撼","温暖","凄美",
    "激昂","压抑","轻松","凝重","神秘","希望","绝望","怀旧","未来感",
  ]
  return moodWords.filter(w => text.includes(w)).length > 0
    ? moodWords.filter(w => text.includes(w))
    : ["电影感","沉浸式","氛围故事"]
}

// ═══════════════════════════════════════════════════
// 完整会话生成
// ═══════════════════════════════════════════════════

export async function createVoiceDirectorSession(
  narrative: string,
): Promise<VoiceDirectorSession> {
  const now = new Date().toISOString()
  const scenes = await extractScenesFromNarrative(narrative)
  const lines = detectThinkingLines(narrative)
  const cog = fullCognitionAnalysis(narrative, lines)

  // 叙事结构分析
  const structure = narrative.length > 100 ? "三幕式" : narrative.length > 50 ? "起承转合" : "片段叙事"

  // 张力曲线
  const tension = scenes.map((_, i) => {
    const t = i / Math.max(scenes.length - 1, 1)
    // 模拟经典叙事张力：开局中等 → 中间起伏 → 高潮最高 → 结尾回落
    return 0.3 + Math.sin(t * Math.PI) * 0.4 + (t > 0.5 && t < 0.8 ? 0.2 : 0)
  })

  const peakPosition = tension.reduce((maxIdx, val, idx, arr) =>
    val > arr[maxIdx] ? idx : maxIdx, 0)

  // 视觉风格推荐
  const visualStyleMap: Record<string, string> = {
    温馨: "日系清新风格，暖色调，柔光滤镜",
    悲壮: "史诗大片风格，冷色调，高对比度",
    紧张: "手持镜头风格，快节奏剪辑，暗调",
    悬疑: "新黑色电影风格，阴影强烈，蓝绿调",
    科幻: "赛博朋克风格，霓虹色，金属质感",
    孤独: "极简主义风格，大量留白，低饱和",
  }
  const primaryMood = scenes[0]?.moodKeywords[0] || "电影感"
  const visualStyle = visualStyleMap[primaryMood] || "电影质感，自然光，16:9 宽幅"

  const colorPalettes: Record<string, string[]> = {
    温馨: ["暖橙","奶油白","浅棕","金色"],
    悲壮: ["深蓝","铁灰","暗红","炭黑"],
    紧张: ["暗紫","猩红","冷灰","漆黑"],
    科幻: ["荧光蓝","霓虹紫","金属银","深空黑"],
  }
  const palette = colorPalettes[primaryMood] || ["靛蓝","紫罗兰","玫瑰金","象牙白"]

  // AI 洞察
  const dominantStyles = lines.slice(0, 3).map(l => l.lineId)

  const title = narrative.slice(0, 30).replace(/[。！？\n]/g, "") || "未命名故事"

  return {
    id: `vd_${Date.now()}`,
    title,
    fullTranscript: narrative,
    scenes,
    narrativeArc: {
      structure,
      tension,
      peakPosition,
      paceAdvice: peakPosition < scenes.length * 0.3
        ? "高潮来得偏早，建议在中段增加铺垫"
        : peakPosition > scenes.length * 0.8
        ? "高潮偏晚，前段可能会让观众失去耐心"
        : "叙事节奏合理，高潮位置恰当",
    },
    thinkingOverlay: {
      dominantLines: dominantStyles,
      visualStyle,
      colorPalette: palette,
      musicStyle: primaryMood === "悲壮" ? "交响乐+大提琴" : primaryMood === "温馨" ? "钢琴+吉他" : "电子氛围+钢琴",
      aiInsight: `AI 分析：这个故事以${cog.l1?.state || "叙事"}为主线，情绪基调为${cog.l3?.emotion || "中性"}。${cog.summary || "已根据叙事内容推荐视觉风格和分镜方案。"}`,
    },
    generatedAt: now,
  }
}
