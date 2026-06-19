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
  oneLiner: string           // 用户的一句话
  genre: "short_drama" | "comic" | "tutorial" | "ad" | "storytelling"
  style: string              // "日系动漫"/"写实"/"水墨风"/"赛博朋克"/"皮克斯3D"
  duration: number           // 目标时长（秒），默认60
  aspectRatio: string        // "16:9" | "9:16" | "1:1"
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
每个镜头严格按此格式输出：
---
镜头{N} | 时长{t}秒 | 景别{CU/MS/LS/WS} | 运镜{固定/推/拉/摇/跟}
画面描述：{详细描述这个镜头中的画面内容——构图、光线、色彩、人物动作}
对白/旁白：{这个镜头的台词或旁白，如无则写"无"}
情绪氛围：{紧张/温馨/悬疑/燃/悲/日常}
转场：{切/淡入淡出/擦除}
---
共生成{sceneCount}个镜头，总时长控制在{duration}秒。画面描述要具体到可以被AI图像生成器直接使用。格式：16:9横屏。`,
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
[即梦] 中文，格式：{场景描述}，{艺术风格}，{画质词}，{光影}，{氛围词}
[DALL-E 3] 英文，格式：A cinematic shot of {场景描述}, in the style of {艺术风格}

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
// 项目存储
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

export function createProject(
  oneLiner: string, genre: VideoProject["genre"], style: string,
  duration: number = 60, aspectRatio: string = "16:9",
): VideoProject {
  const project: VideoProject = {
    id: `vp_${Date.now()}`,
    oneLiner, genre, style, duration, aspectRatio,
    createdAt: new Date().toISOString(),
    status: "draft",
    stages: PIPELINE_STAGES.map(s => ({
      stageId: s.id, status: "pending" as const,
      input: "", output: "", modelUsed: s.primaryModel,
    })),
  }
  const projects = loadProjects()
  projects.unshift(project)
  saveProjects(projects)
  return project
}

// ═══════════════════════════════════════════════════
// 流水线执行引擎（模拟 + 真实API混合）
// ═══════════════════════════════════════════════════

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

  // ── 视觉生成：调 /api/video/frame ──
  if (stageId === "visual_generation") {
    try {
      // 从上一阶段输出提取 prompt，或从项目一句话生成兜底提示词
      const prevOutput = previousStageOutput || ""
      const promptLines = prevOutput.split("\n").filter(l => l.startsWith("[即梦]") || l.startsWith("[Midjourney]"))
      const firstPrompt = promptLines[0] || prevOutput.slice(0, 500) || project.oneLiner
      const imagePrompt = firstPrompt.slice(0, 400) || `${project.style}风格的${project.oneLiner}·电影级光影·8K画质`
      stage.input = imagePrompt.slice(0, 200) || "即梦生成"

      const frameRes = await fetch("/api/video/frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: firstPrompt.slice(0, 400), width: 1920, height: 1080 }),
      })
      const frameData = await frameRes.json()
      // 异步提交 Seedance 视频任务
      let seedanceTaskId: string | null = null
      try {
        const sdRes = await fetch("/api/video/seedance", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: firstPrompt.slice(0, 400),
            imageUrl: frameData.url && !frameData.placeholder ? frameData.url : undefined,
            model: "seedance-2.0-fast",
            ratio: project.aspectRatio === "9:16" ? "9:16" : "16:9",
            duration: 5,
            generateAudio: false,
          }),
        })
        const sdData = await sdRes.json()
        if (sdData.taskId) seedanceTaskId = sdData.taskId
      } catch { /* Seedance submission is non-critical */ }
      stage.output = JSON.stringify({
        url: frameData.url,
        placeholder: frameData.placeholder || false,
        message: frameData.message || (frameData.debug?.hasEnv === false ? "未配置 JIMENG_API_KEY" : ""),
        seedance: seedanceTaskId ? { taskId: seedanceTaskId, pollUrl: `/api/video/seedance?task_id=${seedanceTaskId}` } : null,
      })
      stage.status = "done"; stage.modelUsed = "jimeng"; stage.completedAt = new Date().toISOString()
      saveProjects(projects)
      return stage
    } catch (err: any) {
      stage.status = "failed"; stage.error = err.message; saveProjects(projects); return stage
    }
  }

  // ── 最终合成：返回客户端组装指令 ──
  if (stageId === "final_assembly") {
    try {
      // 找到视觉生成阶段的图片
      const visStage = project.stages.find(s => s.stageId === "visual_generation")
      let frameUrl = ""
      let seedanceTaskId: string | null = null
      if (visStage?.output) {
        try {
          const vo = JSON.parse(visStage.output)
          frameUrl = vo.url || ""
          seedanceTaskId = vo.seedance?.taskId || null
        } catch {}
      }
      stage.input = frameUrl ? "已获取关键帧" : "关键帧未生成"
      stage.output = JSON.stringify({
        status: "ready_for_client_assembly",
        frames: frameUrl ? [{ url: frameUrl }] : [],
        requiresClientRender: true,
        message: "请点击下载按钮合成视频",
        seedance: seedanceTaskId ? { taskId: seedanceTaskId, pollUrl: `/api/video/seedance?task_id=${seedanceTaskId}` } : null,
      })
      stage.status = "done"; stage.completedAt = new Date().toISOString(); stage.modelUsed = "client_canvas"
      saveProjects(projects)
      return stage
    } catch (err: any) {
      stage.status = "failed"; stage.error = err.message; saveProjects(projects); return stage
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

    // 调用LLM
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: fullPrompt },
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

export async function runFullPipeline(projectId: string): Promise<VideoProject> {
  const projects = loadProjects()
  const project = projects.find(p => p.id === projectId)
  if (!project) throw new Error("项目不存在")

  project.status = "running"
  saveProjects(projects)

  let previousOutput = ""

  for (const stageAgent of PIPELINE_STAGES) {
    // ── 视觉生成：调用 /api/video/frame 生成关键帧 ──
    if (stageAgent.id === "visual_generation") {
      const stage = project.stages.find(s => s.stageId === stageAgent.id)
      if (!stage) continue
      stage.status = "running"
      stage.startedAt = new Date().toISOString()
      stage.input = previousOutput.slice(0, 300)

      try {
        // 从上一阶段提取提示词
        const promptLines = previousOutput
          .split("\n")
          .filter(l => l.trim().startsWith("[Midjourney]") || l.trim().startsWith("[即梦]"))
        const firstPrompt = promptLines[0] || previousOutput.slice(0, 500)

        const frameRes = await fetch("/api/video/frame", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `cinematic shot, ${firstPrompt.slice(0, 400)}`,
            width: 1920, height: 1080,
          }),
        })
        const frameData = await frameRes.json()
        // Seedance video submission
        let seedanceTaskId: string | null = null
        try {
          const sdRes = await fetch("/api/video/seedance", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: firstPrompt.slice(0, 400),
              imageUrl: frameData.url && !frameData.placeholder ? frameData.url : undefined,
              model: "seedance-2.0-fast",
              ratio: project.aspectRatio === "9:16" ? "9:16" : "16:9",
              duration: 5,
              generateAudio: false,
            }),
          })
          const sdData = await sdRes.json()
          if (sdData.taskId) seedanceTaskId = sdData.taskId
        } catch { /* non-critical */ }
        stage.output = JSON.stringify({
          url: frameData.url,
          prompt: firstPrompt.slice(0, 200),
          placeholder: frameData.placeholder || false,
          message: frameData.message || "",
          seedance: seedanceTaskId ? { taskId: seedanceTaskId, pollUrl: `/api/video/seedance?task_id=${seedanceTaskId}` } : null,
        })
        stage.status = "done"
        stage.completedAt = new Date().toISOString()
      } catch {
        stage.status = "done"
        stage.output = JSON.stringify({ url: "", placeholder: true, message: "图片生成失败·请检查即梦API Key", seedance: null })
        stage.completedAt = new Date().toISOString()
      }
      stage.modelUsed = stageAgent.primaryModel
      saveProjects(projects)
      continue
    }

    // ── 最终合成：调用 renderVideoOnClient 指示符 ──
    if (stageAgent.id === "final_assembly") {
      const stage = project.stages.find(s => s.stageId === stageAgent.id)
      if (!stage) continue
      stage.status = "done"
      stage.startedAt = new Date().toISOString()
      stage.completedAt = new Date().toISOString()
      const visStage = project.stages.find(s => s.stageId === "visual_generation")
      let frameUrl = ""
      let seedanceTaskId: string | null = null
      if (visStage?.output) {
        try {
          const vo = JSON.parse(visStage.output)
          frameUrl = vo.url || ""
          seedanceTaskId = vo.seedance?.taskId || null
        } catch {}
      }
      stage.input = previousOutput.slice(0, 300)
      stage.output = JSON.stringify({
        status: "ready_for_client_assembly",
        frames: frameUrl ? [{ url: frameUrl }] : [],
        message: "请点击下载按钮在浏览器中合成并下载视频",
        requiresClientRender: true,
        seedance: seedanceTaskId ? { taskId: seedanceTaskId, pollUrl: `/api/video/seedance?task_id=${seedanceTaskId}` } : null,
      })
      stage.modelUsed = stageAgent.primaryModel
      saveProjects(projects)
      continue
    }

    const result = await executeStage(projectId, stageAgent.id, previousOutput)
    if (result) {
      previousOutput = result.output
    }

    // 重新加载（避免被 executeStage 覆盖）
    const refreshed = loadProjects()
    const refreshedProject = refreshed.find(p => p.id === projectId)
    if (refreshedProject) {
      Object.assign(project, refreshedProject)
    }
  }

  project.status = "completed"
  saveProjects(projects)
  return project
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
}): Promise<{ taskId: string; pollUrl: string } | null> {
  try {
    const res = await fetch("/api/video/seedance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: opts.prompt.slice(0, 400),
        imageUrl: opts.imageUrl,
        model: opts.model || "seedance-2.0-fast",
        ratio: opts.ratio || "9:16",
        duration: opts.duration || 5,
        generateAudio: opts.generateAudio ?? false,
      }),
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
