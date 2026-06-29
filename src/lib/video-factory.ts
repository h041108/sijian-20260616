// ─── 思见视频/漫剧智能工厂 ─────────────────────────
// 多模型协作流水线：一句话 → 故事 → 分镜 → 画面 → 视频 → 成品
// 架构：Orchestrator → Stage Agents → Model Registry → Output

import { loadRegistry, classifyTask, route } from "./orchestrator"

// ═══════════════════════════════════════════════════
// 流水线阶段定义
// ═══════════════════════════════════════════════════

export type PipelineStageId =
  | "story_genesis"       // 第1步：一句话 → 完整故事
  | "script_breakdown"    // 第2步：故事 → 分镜脚本（场景/镜头/时长）
  | "prompt_engineering"  // 第3步：分镜 → 各模型专用提示词
  | "visual_generation"   // 第4步：提示词 → 图片/视频片段
  | "audio_production"    // 第5步：脚本 → 配音/音效/背景音乐
  | "final_assembly"      // 第6步：视频+音频 → 剪辑合成

export interface StageAgent {
  id: PipelineStageId
  name: string
  icon: string
  description: string
  primaryModel: string       // 首选模型ID
  fallbackModels: string[]   // 备选模型
  inputFormat: string
  outputFormat: string
  systemPrompt: string
  estimatedTime: number      // 预估耗时（秒）
}

export interface VideoProject {
  id: string
  oneLiner: string
  genre: "short_drama" | "comic" | "tutorial" | "ad" | "storytelling"
  style: string
  duration: number
  aspectRatio: string
  viralTemplate?: {
    hookStyle: string
    scriptStructure: string
    pacing: string
    emotionalCurve: string
    conversionTactic: string
    visualStyle: string
    keywords: string[]
  }
  // 参考图：所有分镜共用，保持角色/产品一致性
  characterRefUrls?: string[]    // 角色参考图（正面/侧面/背面）
  productImageUrls?: string[]    // 产品实拍图（广告模式）
  charName?: string              // 角色名（用于构建 prompt）
  charDescription?: string       // 角色外貌描述
  createdAt: string
  status: "draft" | "running" | "completed" | "failed"
  stages: PipelineStageResult[]
}

export interface PipelineStageResult {
  stageId: PipelineStageId
  status: "pending" | "running" | "done" | "failed"
  input: string
  output: string
  modelUsed: string
  startedAt?: string
  completedAt?: string
  error?: string
  qaResult?: any   // 内置质检报告（故事创世+分镜拆解后自动生成）
}

// ═══════════════════════════════════════════════════
// 模型注册表 — 每个岗位的"员工"
// ═══════════════════════════════════════════════════

export interface VideoModel {
  id: string
  name: string
  type: "llm" | "image_gen" | "video_gen" | "tts" | "editor"
  provider: string
  strengths: string[]
  apiEndpoint?: string
  available: boolean
}

const VIDEO_MODELS: VideoModel[] = [
  // ── LLM 剧本组 ──
  { id: "deepseek", name: "DeepSeek V3", type: "llm", provider: "DeepSeek", strengths: ["中文故事","逻辑结构","分镜脚本"], available: true },
  { id: "claude", name: "Claude 4", type: "llm", provider: "Anthropic", strengths: ["创意叙事","角色塑造","情感表达"], available: !!process.env.CLAUDE_API_KEY },
  { id: "qwen", name: "通义千问", type: "llm", provider: "Alibaba", strengths: ["中文理解","文化适配","文言风格"], available: !!process.env.QWEN_API_KEY },
  { id: "doubao_llm", name: "豆包大模型", type: "llm", provider: "ByteDance", strengths: ["短剧本","网感文案","口语化"], available: !!process.env.DOUBAO_API_KEY },

  // ── 图像生成组 ──
  { id: "midjourney", name: "Midjourney", type: "image_gen", provider: "Midjourney", strengths: ["艺术质感","光影构图","概念设计"], available: !!process.env.MJ_API_KEY },
  { id: "stable_diffusion", name: "Stable Diffusion XL", type: "image_gen", provider: "Stability AI", strengths: ["快速迭代","风格迁移","开源可控"], available: !!process.env.SD_API_KEY },
  { id: "jimeng", name: "即梦", type: "image_gen", provider: "ByteDance", strengths: ["中式美学","古风场景","角色一致性"], available: !!process.env.JIMENG_API_KEY },
  { id: "dalle3", name: "DALL-E 3", type: "image_gen", provider: "OpenAI", strengths: ["精确指令跟随","文字渲染","干净构图"], available: !!process.env.OPENAI_API_KEY },

  // ── 视频生成组 ──
  { id: "kling", name: "可灵 Kling", type: "video_gen", provider: "Kuaishou", strengths: ["物理模拟","动作连贯","人物表情"], available: !!process.env.KLING_API_KEY },
  { id: "jimeng_video", name: "即梦视频", type: "video_gen", provider: "ByteDance", strengths: ["短视频生态","模板丰富","一键成片"], available: !!process.env.JIMENG_API_KEY },
  { id: "runway", name: "Runway Gen-3", type: "video_gen", provider: "RunwayML", strengths: ["好莱坞级画质","运动模糊","电影感"], available: !!process.env.RUNWAY_API_KEY },
	  { id: "pika", name: "Pika 2.0", type: "video_gen", provider: "Pika Labs", strengths: ["卡通动画","风格化","快速生成"], available: !!process.env.PIKA_API_KEY },
	  { id: "seedance2", name: "Seedance 2.0", type: "video_gen", provider: "ByteDance", strengths: ["文生视频","图生视频","1080p","动作流畅"], available: !!(process.env.SEEDANCE_API_KEY || process.env.JIMENG_API_KEY), apiEndpoint: "https://ark.cn-beijing.volces.com/api/v3" },
	  { id: "seedance2_fast", name: "Seedance 2.0 Fast", type: "video_gen", provider: "ByteDance", strengths: ["快速生成","720p","文生视频","性价比"], available: !!(process.env.SEEDANCE_API_KEY || process.env.JIMENG_API_KEY), apiEndpoint: "https://ark.cn-beijing.volces.com/api/v3" },
	  { id: "seedance_lite_i2v", name: "Seedance Lite I2V", type: "video_gen", provider: "ByteDance", strengths: ["图生视频","首帧动画","轻量快速"], available: !!(process.env.SEEDANCE_API_KEY || process.env.JIMENG_API_KEY), apiEndpoint: "https://ark.cn-beijing.volces.com/api/v3" },
  { id: "infinitetalk", name: "InfiniteTalk", type: "video_gen", provider: "MeiGen-AI", strengths: ["口播数字人","唇同步1.8mm","全身体动","本地GPU","无限时长"], available: false, apiEndpoint: "http://localhost:7860" },

  // ── 配音/TTS 组 ──
  { id: "doubao_tts", name: "豆包语音合成", type: "tts", provider: "ByteDance", strengths: ["多角色配音","情感语调","自然口语"], available: !!process.env.DOUBAO_API_KEY },
  { id: "qwen_tts", name: "通义千问TTS", type: "tts", provider: "Alibaba", strengths: ["多语言","朗读风格","长文本"], available: !!process.env.QWEN_API_KEY },

  // ── 剪辑合成组 ──
  { id: "jianying", name: "剪映", type: "editor", provider: "ByteDance", strengths: ["模板剪辑","自动字幕","转场特效"], available: false }, // 需要桌面端SDK
]

// ═══════════════════════════════════════════════════
// 六阶段流水线配置
// ═══════════════════════════════════════════════════

export const PIPELINE_STAGES: StageAgent[] = [
  {
    id: "story_genesis",
    name: "故事创世",
    icon: "📖",
    description: "将一句话扩展为完整故事：世界观、角色、冲突、起承转合",
    primaryModel: "deepseek",
    fallbackModels: ["claude", "qwen"],
    inputFormat: "一句话梗概",
    outputFormat: "完整故事大纲（含场景列表）",
    systemPrompt: `你是一位资深编剧。用户给你一句话的创意，请扩展为完整故事。
格式：
## 故事标题（≤10字）
## 世界观设定（2-3句）
## 主要角色
- 角色名：性格、外貌、动机（各1句）
## 故事梗概（5-8句话，含起承转合）
## 场景列表
编1-N个场景，每个场景标注：场景名、地点、时间、事件（1-2句）

风格：{style}  时长目标：{duration}秒  类型：{genre}`,
    estimatedTime: 10,
  },
  {
    id: "script_breakdown",
    name: "分镜拆解",
    icon: "🎬",
    description: "将故事拆解为逐镜头的分镜脚本",
    primaryModel: "deepseek",
    fallbackModels: ["claude", "doubao_llm"],
    inputFormat: "完整故事大纲",
    outputFormat: "分镜脚本表（N个镜头）",
    systemPrompt: `你是一位分镜导演。请将故事拆解为逐一镜头的拍摄脚本。

⚠️ 视觉连贯性要求（最重要！）：
1. 主角外观一次性定义：第一个镜头必须给出主角的"性别、年龄、发型、上衣颜色、裤子颜色、体型"，后续镜头直接引用（如"穿着同一件蓝色外套的他"），不得重新描述
2. 色调统一：所有镜头使用同一色调（如"全程暖金色夕阳"或"全程蓝灰冷调"），光影方向一致
3. 动作桥接：镜头之间的主体动作要连贯，用"他继续往前走""她转身面对镜头"等衔接
4. 画面描述必须包含四要素：主体是谁 + 在做什么动作 + 环境/光线 + 镜头构图（特写/全景/仰拍/逆光等）

每个镜头严格按此格式输出：
---
镜头{N} | 时长{t}秒 | 景别{CU/MS/LS/WS} | 运镜{固定/推/拉/摇/跟}
画面描述：{主体+动作+环境+构图，50-150字，具体到能直接喂给AI图像生成器}
对白/旁白：{本镜头台词或旁白，如无则写"无"}
情绪氛围：{紧张/温馨/悬疑/燃/悲/日常}
转场：{切/淡入淡出/擦除}
---

共生成{sceneCount}个镜头，总时长控制在{duration}秒。风格：{style}。`,
    estimatedTime: 15,
  },
  {
    id: "prompt_engineering",
    name: "提示词工程",
    icon: "🎨",
    description: "每个镜头的画面描述 → 适配不同模型的专用提示词",
    primaryModel: "deepseek",
    fallbackModels: ["claude"],
    inputFormat: "分镜脚本",
    outputFormat: "多模型适配提示词表",
    systemPrompt: `你是一位AI图像提示词工程师。请将每个镜头的画面描述转化为适配不同AI模型的专用提示词。

对每个镜头，生成以下模型的提示词：
[Midjourney] 英文，格式：{场景描述}, {艺术风格}, {光照}, {镜头参数}, {氛围} --ar 16:9 --style {style} --v 6
[Stable Diffusion] 英文，格式：{场景描述}, {艺术风格}, masterpiece, best quality, {光照}, {镜头参数}
[即梦] 中文，格式：{风格关键词}风格，{主体}，{动作}，{环境场景}，{光线描述}，{镜头构图}，{氛围词}，高质量，画质清晰
[DALL-E 3] 英文，格式：A cinematic shot of {场景描述}, in the style of {艺术风格}

⚠️ 即梦提示词要求（最重要，用户使用即梦生成）：
1. 必须是流畅的中文描述，不是一个关键词列表，要像在描述一幅画
2. 每个镜头的主体必须一致（同一角色的外貌、服装保持完全相同）
3. 必须包含：谁/什么东西 + 在做什么动作 + 在哪（场景）+ 什么光线 + 什么镜头角度 + 什么氛围
4. 正面例子：写实风格，一位灰发少年穿着破旧蓝色夹克，站在废墟顶端远眺，夕阳逆光，全景俯拍，孤寂悲壮的氛围，高质量，画质清晰
5. 所有镜头使用统一的风格关键词（如"写实电影风格"或"日系动漫风格"）

艺术风格参考：{style}
对每个镜头只输出提示词，不要额外说明。`,
    estimatedTime: 12,
  },
  {
    id: "visual_generation",
    name: "视觉生成",
    icon: "🖼️",
    description: "调用图像/视频生成API，产出每个镜头的关键帧或视频片段",
    primaryModel: "jimeng",
    fallbackModels: ["seedance2_fast", "jimeng", "stable_diffusion", "dalle3"],
    inputFormat: "多模型提示词表",
    outputFormat: "图片URL列表 + Seedance视频任务",
    systemPrompt: `请根据提示词生成图像。每个镜头生成1张关键帧。
将关键帧提交到 Seedance 2.0 Fast 生成短视频片段（竖屏9:16，配抖音BGM）。
如果配置了视频生成API，对每个关键帧生成对应的短视频片段。`,
    estimatedTime: 60,
  },
  {
    id: "audio_production",
    name: "音频制作",
    icon: "🎙️",
    description: "根据对白/旁白生成配音，添加背景音乐和音效",
    primaryModel: "doubao_tts",
    fallbackModels: ["qwen_tts"],
    inputFormat: "分镜脚本中的对白/旁白",
    outputFormat: "音频文件列表 + 字幕时间轴",
    systemPrompt: `请根据对白生成配音。为每个有对白的镜头生成对应的音频时间轴。
格式：镜头{N} | 开始时间 | 结束时间 | 角色 | 台词
注意语速和情感匹配。`,
    estimatedTime: 20,
  },
  {
    id: "final_assembly",
    name: "最终合成",
    icon: "🎞️",
    description: "视频片段 + 音频 + 字幕 → 剪辑预览 + 导出",
    primaryModel: "jianying",
    fallbackModels: [],
    inputFormat: "视频片段URL + 音频文件 + 字幕时间轴",
    outputFormat: "最终视频播放链接 + 下载地址",
    systemPrompt: `请将所有素材合成为最终视频。输出格式：MP4, H.264, 1080p。
添加片头和片尾。`,
    estimatedTime: 30,
  },
]

// ═══════════════════════════════════════════════════
// Agent 导演模式：根据类型和内容动态决定流水线阶段
// ═══════════════════════════════════════════════════

export interface DirectorPlan {
  stages: PipelineStageId[]
  mode: "full" | "quick" | "visual_only"
  label: string
  description: string
}

// 各类型的默认流水线配置
const DIRECTOR_PLANS: Record<string, { full: PipelineStageId[]; quick: PipelineStageId[] }> = {
  short_drama: {
    full: ["story_genesis", "script_breakdown", "prompt_engineering", "visual_generation", "audio_production", "final_assembly"],
    quick: ["story_genesis", "script_breakdown", "visual_generation", "final_assembly"],
  },
  comic: {
    full: ["story_genesis", "script_breakdown", "prompt_engineering", "visual_generation", "audio_production", "final_assembly"],
    quick: ["story_genesis", "script_breakdown", "visual_generation", "final_assembly"],
  },
  tutorial: {
    full: ["story_genesis", "script_breakdown", "prompt_engineering", "visual_generation", "final_assembly"],
    quick: ["story_genesis", "visual_generation", "final_assembly"],
  },
  ad: {
    full: ["story_genesis", "script_breakdown", "prompt_engineering", "visual_generation", "final_assembly"],
    quick: ["story_genesis", "visual_generation", "final_assembly"],
  },
  storytelling: {
    full: ["story_genesis", "script_breakdown", "prompt_engineering", "visual_generation", "audio_production", "final_assembly"],
    quick: ["story_genesis", "script_breakdown", "visual_generation", "final_assembly"],
  },
}

export function getDirectorPlan(genre: string, mode: "full" | "quick" = "full"): DirectorPlan {
  const plans = DIRECTOR_PLANS[genre] || DIRECTOR_PLANS.short_drama
  const stages = mode === "quick" ? plans.quick : plans.full

  const labels: Record<string, string> = {
    full: "完整模式（6阶段）",
    quick: "快速模式（精简阶段）",
  }

  const descriptions: Record<string, string> = {
    full: "故事创世 → 分镜 → 提示词 → 视觉 → 音频 → 合成",
    quick: "故事创世 → 视觉 → 合成（跳过中间步骤）",
  }

  return { stages, mode, label: labels[mode] || labels.full, description: descriptions[mode] || descriptions.full }
}

export function getDirectorModeLabel(genre: string, stagesCount: number): string {
  const full = (DIRECTOR_PLANS[genre] || DIRECTOR_PLANS.short_drama).full.length
  return stagesCount >= full ? "🎬 完整导演" : "⚡ 快速导演"
}

// ═══════════════════════════════════════════════════
// 视频类型预设
// ═══════════════════════════════════════════════════

export interface GenrePreset {
  id: string
  label: string
  icon: string
  description: string
  defaultDuration: number
  sceneCount: number
  styleSuggestions: string[]
}

export const GENRE_PRESETS: Record<string, GenrePreset> = {
  short_drama: {
    id: "short_drama", label: "短剧", icon: "🎭",
    description: "剧情向短视频，有完整起承转合，适合抖音/快手",
    defaultDuration: 90, sceneCount: 6,
    styleSuggestions: ["写实风格", "日系清新", "电影质感", "韩系唯美"],
  },
  comic: {
    id: "comic", label: "漫剧", icon: "📚",
    description: "漫画风格叙事，配合对话框和动态效果",
    defaultDuration: 120, sceneCount: 8,
    styleSuggestions: ["日系动漫", "国风水墨", "美式卡通", "赛博朋克", "皮克斯3D"],
  },
  tutorial: {
    id: "tutorial", label: "知识讲解", icon: "📖",
    description: "教育类短视频，图文配合讲解",
    defaultDuration: 60, sceneCount: 5,
    styleSuggestions: ["扁平设计", "白板风格", "3D演示", "手绘风格"],
  },
  ad: {
    id: "ad", label: "产品广告", icon: "📢",
    description: "15-30秒产品展示短视频",
    defaultDuration: 30, sceneCount: 5,
    styleSuggestions: ["高端质感", "科技感", "温馨生活", "潮流炫酷"],
  },
  storytelling: {
    id: "storytelling", label: "故事叙述", icon: "📖",
    description: "叙事性视频，配合旁白讲述完整故事",
    defaultDuration: 180, sceneCount: 10,
    styleSuggestions: ["水彩插画", "复古胶片", "极简黑白", "童话绘本"],
  },
}

// ═══════════════════════════════════════════════════
// 作品存储
// ═══════════════════════════════════════════════════

const PROJECTS_KEY = "sijian_video_projects"

export function loadProjects(): VideoProject[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]") } catch { return [] }
}

export function saveProjects(projects: VideoProject[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function deleteProject(projectId: string) {
  const projects = loadProjects()
  saveProjects(projects.filter(p => p.id !== projectId))
}

export function createProject(
  oneLiner: string, genre: VideoProject["genre"], style: string,
  duration: number = 60, aspectRatio: string = "16:9",
  viralTemplate?: VideoProject["viralTemplate"],
  userId?: string,
  refs?: { characterRefUrls?: string[]; productImageUrls?: string[]; charName?: string; charDescription?: string },
): VideoProject {
  const project: VideoProject = {
    id: `vp_${Date.now()}`,
    oneLiner, genre, style, duration, aspectRatio, viralTemplate,
    characterRefUrls: refs?.characterRefUrls,
    productImageUrls: refs?.productImageUrls,
    charName: refs?.charName,
    charDescription: refs?.charDescription,
    createdAt: new Date().toISOString(),
    status: "draft",
    stages: PIPELINE_STAGES.map(s => ({
      stageId: s.id, status: "pending" as const,
      input: "", output: "", modelUsed: s.primaryModel,
    })),
  }
  if (userId && typeof window !== "undefined") {
    localStorage.setItem(`sijian_project_owner_${project.id}`, userId)
  }
  const projects = loadProjects()
  projects.unshift(project)
  saveProjects(projects)
  // 异步同步到 Supabase
  if (userId && typeof window !== "undefined") {
    try {
      import("./data-persistence").then(m => {
        m.saveVideoProject(userId, project)
      }).catch(() => {})
    } catch {}
  }
  return project
}

// ═══════════════════════════════════════════════════
// 流水线执行引擎（模拟 + 真实API混合）
// ═══════════════════════════════════════════════════

// ── 从分镜脚本中提取单个镜头 ──
interface ParsedShot {
  shotNumber: number
  duration: number       // 秒
  description: string    // 画面描述
  dialogue: string       // 对白/旁白
}

function parseShotsFromScript(scriptText: string, promptText?: string): ParsedShot[] {
  const shots: ParsedShot[] = []

  // ── 优先从 script_breakdown 格式解析（镜头{N} | 时长{t}秒）──
  let sourceText = scriptText
  // 如果传入的文本没有镜头格式，尝试从项目脚本拆解阶段取
  if (!/镜头\d+\s*[|｜]\s*时长/.test(sourceText) && promptText && /镜头\d+\s*[|｜]\s*时长/.test(promptText)) {
    sourceText = promptText
  }

  const shotRegex = /镜头(\d+)\s*[|｜]\s*时长(\d+(?:\.\d+)?)\s*秒/gi
  const matches = [...sourceText.matchAll(shotRegex)]

  for (const match of matches) {
    const shotNum = parseInt(match[1])
    const duration = parseFloat(match[2])
    const start = match.index! + match[0].length

    const rest = sourceText.slice(start)
    const nextShot = rest.search(/镜头\d+\s*[|｜]/)
    const block = nextShot >= 0 ? rest.slice(0, nextShot) : rest

    const descMatch = block.match(/画面描述[：:]([\s\S]*?)(?=对白|旁白|情绪|转场|镜头|\n\n|$)/i)
    const desc = descMatch ? descMatch[1].trim() : block.slice(0, 200).trim()

    const dialMatch = block.match(/(?:对白|旁白)[：:]([\s\S]*?)(?=情绪|转场|镜头|\n\n|$)/i)
    const dialogue = dialMatch ? dialMatch[1].trim() : ""

    if (desc.length >= 10) {
      shots.push({ shotNumber: shotNum, duration: Math.min(30, Math.max(2, duration || 5)), description: desc, dialogue })
    }
  }

  // ── 兜底A：从 prompt_engineering 的 [即梦] 行提取 ──
  if (shots.length === 0) {
    const jimengLines = (promptText || scriptText)
      .split("\n")
      .filter(l => /\[即梦\]|\[jimeng\]|\[Midjourney\]/.test(l))
    jimengLines.forEach((l, i) => {
      const desc = l.replace(/\[即梦\]|\[jimeng\]|\[Midjourney\]/gi, "").replace(/^\s*[-–—:：]\s*/, "").trim()
      if (desc.length >= 10) {
        shots.push({ shotNumber: i + 1, duration: 5, description: desc.slice(0, 400), dialogue: "" })
      }
    })
  }

  // ── 兜底B：整个脚本作为一段 ──
  if (shots.length === 0) {
    shots.push({ shotNumber: 1, duration: 10, description: (promptText || scriptText).slice(0, 500), dialogue: "" })
  }

  return shots.slice(0, 6)
}

export async function executeStage(
  projectId: string,
  stageId: PipelineStageId,
  previousStageOutput?: string,
): Promise<PipelineStageResult | null> {
  const projects = loadProjects()
  const project = projects.find(p => p.id === projectId)
  if (!project) return null

  const stage = project.stages.find(s => s.stageId === stageId)
  const stageConfig = PIPELINE_STAGES.find(s => s.id === stageId)
  if (!stage || !stageConfig) return null

  stage.status = "running"
  stage.startedAt = new Date().toISOString()
  saveProjects(projects)

  // ── 视觉生成：E04引擎驱动 · 每个镜头一张图 ──
  if (stageId === "visual_generation") {
    try {
      const prevOutput = previousStageOutput || ""
      const sbStage = project.stages.find(s => s.stageId === "script_breakdown")
      const sbOutput = sbStage?.output || ""
      const storyStage = project.stages.find(s => s.stageId === "story_genesis")
      const storyOutput = storyStage?.output || ""
      const shots = parseShotsFromScript(prevOutput, sbOutput)
      stage.input = prevOutput.slice(0, 300) || "视觉生成"

      // ── E04引擎：从角色模板或故事文本提取角色锚点 ──
      // 优先使用用户创建的角色模板信息（角色参考图+外观描述）
      // 回退到从故事文本中正则提取
      const charName = project.charName || (storyOutput.match(/角色名[：:](\S+)/))?.[1] || "主角"
      const charDesc = project.charDescription || ""
      const storyAppearMatch = storyOutput.match(/外貌[：:]([^\n]+)/)
      const firstShotAppear = sbOutput.match(/画面描述[：:]([^\n]+)/)
      const characterLook = charDesc || storyAppearMatch?.[1]?.trim() || firstShotAppear?.[1]?.split(/[,，]/).slice(0, 3).join("，") || ""
      const shotPrefix = `${project.style}风格${charDesc ? "，" + charDesc + "，" + charName : characterLook ? "，" + characterLook + "，" + charName : ""}`

      const peStage = project.stages.find(s => s.stageId === "prompt_engineering")
      const jimengLines = peStage?.output
        ? peStage.output.split("\n").filter((l: string) => /\[即梦\]/.test(l)).map((l: string) => l.replace(/\[即梦\]\s*/i, "").trim()).filter((l: string) => l.length >= 10)
        : []

      const frames: Array<{
        shotNumber: number; duration: number; imageUrl: string
        description: string; dialogue: string; seedanceTaskId: string | null
      }> = []

      let previousImageUrl: string | null = null
      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i]
        try {
          const jimengDesc = jimengLines[i] || ""
          const sceneDesc = jimengDesc || shot.description

          // 收集角色/产品参考图（所有镜头共享，保持一致性）
          const allRefUrls: string[] = []
          if (project.characterRefUrls?.length) allRefUrls.push(...project.characterRefUrls)
          if (project.productImageUrls?.length) allRefUrls.push(...project.productImageUrls)

          // 无缝衔接：镜头1用参考图，后续镜头用上一帧图生图（保证帧间连续）
          const useImageRef = i > 0 && previousImageUrl && !previousImageUrl.includes("placehold.co")
          const continuityNote = useImageRef
            ? `延续上一帧画面，仅改变以下内容：${sceneDesc}。保持角色外观、色调、光影完全不变。`
            : `${shotPrefix}。${sceneDesc}，电影级画质，16:9`
          const imagePrompt = continuityNote.slice(0, 380)

          const frameBody: any = { prompt: imagePrompt, width: 1920, height: 1080 }
          // 优先用上一帧（帧间连续性），首帧用角色/产品参考图
          if (useImageRef) {
            frameBody.image = previousImageUrl
            frameBody.image_strength = 0.35
          } else if (allRefUrls.length > 0) {
            frameBody.image = allRefUrls[0]
            frameBody.image_strength = 0.4
          }

          const frameRes = await fetch("/api/video/frame", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(frameBody),
          })
          const frameData = await frameRes.json()
          const imageUrl = frameData.url || ""
          if (imageUrl && !frameData.placeholder) previousImageUrl = imageUrl

          // 收集参考图（角色+产品）传入 Seedance 保证多镜头一致性
          const refImageUrls: string[] = []
          if (project.characterRefUrls?.length) refImageUrls.push(...project.characterRefUrls)
          if (project.productImageUrls?.length) refImageUrls.push(...project.productImageUrls)

          // Seedance: 间隔1秒避免限流，失败重试1次
          if (i > 0) await new Promise(r => setTimeout(r, 1200))
          let seedanceTaskId: string | null = null
          if (imageUrl && !frameData.placeholder) {
            for (let attempt = 0; attempt < 2 && !seedanceTaskId; attempt++) {
              try {
                const sdBody: any = {
                  prompt: imagePrompt.slice(0, 400), imageUrl,
                  model: shot.dialogue && shot.dialogue.length > 5 && shot.dialogue !== "无" ? "seedance-1.5-pro" : "seedance-2.0-fast",
                  ratio: project.aspectRatio === "9:16" ? "9:16" : "16:9",
                  duration: 5,
                  generateAudio: !!shot.dialogue && shot.dialogue.length > 5,
                }
                if (refImageUrls.length > 0) sdBody.referenceImageUrls = refImageUrls.slice(0, 9)
                const sdRes = await fetch("/api/video/seedance", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(sdBody),
                })
                const sdData = await sdRes.json()
                if (sdData.taskId) seedanceTaskId = sdData.taskId
              } catch {}
            }
          }
          frames.push({ shotNumber: shot.shotNumber, duration: shot.duration, imageUrl, description: shot.description.slice(0, 100), dialogue: shot.dialogue.slice(0, 80), seedanceTaskId })
        } catch {
          frames.push({ shotNumber: shot.shotNumber, duration: shot.duration, imageUrl: "", description: shot.description.slice(0, 100), dialogue: shot.dialogue.slice(0, 80), seedanceTaskId: null })
        }
      }

      const realFrames = frames.filter(f => f.imageUrl && !f.imageUrl.includes("placehold.co"))
      stage.output = JSON.stringify({
        frames, totalShots: shots.length, generatedShots: realFrames.length,
        placeholder: realFrames.length === 0,
        message: frames.length > 0
          ? `${realFrames.length}/${frames.length} 个镜头`
           
            + (frames.some(f => f.seedanceTaskId) ? "，视频片段生成中" : "")
          : "视觉生成失败",
      })
      stage.status = "done"; stage.modelUsed = "jimeng"; stage.completedAt = new Date().toISOString()
      saveProjects(projects)
      return stage
    } catch (err: any) {
      stage.status = "failed"; stage.error = err.message; saveProjects(projects); return stage
    }
  }

  // ── 最终合成：返回多镜头组装指令（含音频） ──
  if (stageId === "final_assembly") {
    try {
      const visStage = project.stages.find(s => s.stageId === "visual_generation")
      let frames: Array<{
        shotNumber: number; duration: number; imageUrl: string; description: string; dialogue: string
        seedanceTaskId: string | null
      }> = []
      let seedanceTaskIds: string[] = []
      if (visStage?.output) {
        try {
          const vo = JSON.parse(visStage.output)
          if (vo.frames) {
            frames = vo.frames
            seedanceTaskIds = frames.filter((f: any) => f.seedanceTaskId).map((f: any) => f.seedanceTaskId as string)
          } else if (vo.url) {
            frames = [{ shotNumber: 1, duration: project.duration || 10, imageUrl: vo.url, description: "", dialogue: "", seedanceTaskId: vo.seedance?.taskId || null }]
          }
        } catch {}
      }
      stage.input = frames.length > 0 ? `准备合成 ${frames.length} 个镜头` : "等待视觉生成"
      const videoClips = frames
        .filter(f => f.imageUrl)
        .map((f, idx) => ({
          url: f.imageUrl,
          startTime: frames.slice(0, idx).reduce((s, p) => s + p.duration, 0),
          endTime: frames.slice(0, idx + 1).reduce((s, p) => s + p.duration, 0),
          index: idx,
          shotNumber: f.shotNumber,
          description: f.description,
          dialogue: f.dialogue,
          seedanceTaskId: f.seedanceTaskId,
        }))
      const totalDuration = videoClips.length > 0 ? videoClips[videoClips.length - 1].endTime : 10
      stage.output = JSON.stringify({
        status: videoClips.length > 0 ? "ready" : "no_frames",
        frames: videoClips,
        totalDuration,
        seedanceTaskIds,
        message: videoClips.length > 0
          ? `${videoClips.length} 个镜头 · 约 ${totalDuration} 秒 · 点击每个镜头下载 Seedance 视频`
          : "请先运行视觉生成阶段",
      })
      stage.status = "done"
      stage.completedAt = new Date().toISOString()
      stage.modelUsed = "client_canvas"
      saveProjects(projects)
      return stage
    } catch (err: any) {
      stage.status = "failed"
      stage.error = err.message
      saveProjects(projects)
      return stage
    }
  }

  try {
    // ── LLM 阶段 ──
    let input = ""
    if (stageId === "story_genesis") {
      input = `一句话创意：${project.oneLiner}\n风格：${project.style}\n类型：${GENRE_PRESETS[project.genre]?.label || project.genre}`
    } else {
      input = previousStageOutput || stage.input || ""
    }

    stage.input = input.slice(0, 300)

    // 构建prompt — 优先从 Skill 引擎加载，回退硬编码
    const skillPrompt = typeof window !== "undefined"
      ? (() => { try { return require("./skill-engine").getSkill(`pipeline_${stageId}`)?.systemPrompt } catch { return null } })()
      : null
    const basePrompt = skillPrompt || stageConfig.systemPrompt
    const fullPrompt = basePrompt
      .replace("{style}", project.style)
      .replace("{duration}", String(project.duration))
      .replace("{genre}", GENRE_PRESETS[project.genre]?.label || project.genre)
      .replace("{sceneCount}", String(GENRE_PRESETS[project.genre]?.sceneCount || 6))

    // ── 注入爆款模板到故事创世阶段 ──
    let finalSystemPrompt = fullPrompt
    if (stageId === "story_genesis" && project.viralTemplate) {
      const vt = project.viralTemplate
      finalSystemPrompt = `${fullPrompt}

【参考爆款模板——已分析抖音/TikTok热门趋势】
▪ 钩子策略：${vt.hookStyle}
▪ 脚本结构：${vt.scriptStructure}
▪ 节奏控制：${vt.pacing}
▪ 情绪曲线：${vt.emotionalCurve}
▪ 转化话术：${vt.conversionTactic}
▪ 视觉风格：${vt.visualStyle}
▪ 热门关键词：${vt.keywords?.join("、") || ""}

请借鉴以上爆款模板的结构和节奏，将关键元素融入故事中，但用新的创意重新构建内容。`
    }

    // 调用LLM
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: input },
        ],
        existingNodes: [],
      }),
    })

    if (!response.ok) throw new Error(`API ${response.status}`)

    const data = await response.json()
    stage.output = data.message || ""
    stage.status = "done"
    stage.modelUsed = stageConfig.primaryModel
    stage.completedAt = new Date().toISOString()

    // ── 内置质检：故事创世/分镜拆解完成后自动跑认知分析 ──
    if (stageId === "story_genesis" || stageId === "script_breakdown") {
      try {
        const { analyzeScript } = await import("./video-cognition-qa")
        stage.qaResult = analyzeScript(stage.output)

        // ── 自动修复：评分低于阈值时自动调用DeepSeek修正 ──
        const qaThreshold = 65
        if (stage.qaResult.overallScore < qaThreshold && stage.output.length > 100) {
          try {
            const { autoFixScript } = await import("./script-auto-fix")
            const fixResult = await autoFixScript({
              originalScript: stage.output,
              stage: stageId === "story_genesis" ? "story" : "script_breakdown",
              qaReport: stage.qaResult,
              style: project.style,
              genre: GENRE_PRESETS[project.genre]?.label || project.genre,
              targetDuration: project.duration,
            })
            if (fixResult && fixResult.fixedScript.length > 50) {
              stage.output = fixResult.fixedScript
              // 对修复后脚本重新质检
              try {
                stage.qaResult = analyzeScript(fixResult.fixedScript)
              } catch {}
            }
          } catch {}
        }
      } catch {}
    }

    saveProjects(projects)
    return stage
  } catch (err: any) {
    stage.status = "failed"
    stage.error = err.message
    saveProjects(projects)
    return stage
  }
}

// ═══════════════════════════════════════════════════
// 模型可用性检查
// ═══════════════════════════════════════════════════

export function getAvailableModels(): { byType: Record<string, VideoModel[]>; total: number; recommended: string[][] } {
  const byType: Record<string, VideoModel[]> = {}
  for (const m of VIDEO_MODELS) {
    if (!byType[m.type]) byType[m.type] = []
    byType[m.type].push(m)
  }

  const available = VIDEO_MODELS.filter(m => m.available).length

  // 推荐组合
  const recommended = [
    ["deepseek", "jimeng", "seedance2_fast", "doubao_tts"],
    ["deepseek", "jimeng", "kling", "doubao_tts"],
    ["claude", "midjourney", "runway", "doubao_tts"],
    ["qwen", "jimeng", "seedance2", "qwen_tts"],
  ]

  return { byType, total: available, recommended }
}

export { VIDEO_MODELS }

// Seedance video generation helper
export async function submitSeedanceTask(opts: {
  prompt: string
  imageUrl?: string
  model?: string
  ratio?: string
  duration?: number
  generateAudio?: boolean
  referenceImageUrls?: string[]
}): Promise<{ taskId: string; pollUrl: string } | null> {
  try {
    const body: any = {
      prompt: opts.prompt.slice(0, 400),
      imageUrl: opts.imageUrl,
      model: opts.model || "seedance-2.0-fast",
      ratio: opts.ratio || "9:16",
      duration: opts.duration || 5,
      generateAudio: opts.generateAudio ?? false,
    }
    if (opts.referenceImageUrls?.length) body.referenceImageUrls = opts.referenceImageUrls.slice(0, 9)
    const res = await fetch("/api/video/seedance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.taskId) {
      return { taskId: data.taskId, pollUrl: `/api/video/seedance?task_id=${data.taskId}` }
    }
    return null
  } catch {
    return null
  }
}

export async function pollSeedanceTask(taskId: string): Promise<{
  status: string
  videoUrl?: string
  message?: string
}> {
  try {
    const res = await fetch(`/api/video/seedance?task_id=${taskId}`)
    const data = await res.json()
    return {
      status: data.status || "unknown",
      videoUrl: data.videoUrl,
      message: data.message,
    }
  } catch {
    return { status: "error", message: "Failed to poll task" }
  }
}
