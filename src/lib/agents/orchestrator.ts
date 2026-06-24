// ─── 即影 · 主调度Agent ──────────────────────────
// 15 Agent 协同的大脑：理解用户→拆解任务→分配→审核→汇总

import { AgentRegistry } from "./registry"
import type { AgentInput, AgentOutput, AgentId } from "./types"
import { AGENT_META } from "./types"

export interface OrchestratorInput {
  userInput: string                    // 用户的核心需求
  platform?: string                    // 目标平台
  niche?: string                       // 赛道/行业
  brand?: string                       // 品牌名
  referenceImages?: string[]
  referenceText?: string
  mode?: "auto" | "manual"            // 全自动/半自动
  agents?: AgentId[]                   // 手动指定用哪些Agent
}

export interface OrchestratorOutput {
  success: boolean
  taskId: string
  plan: {
    description: string               // 任务描述
    steps: {                          // 执行步骤
      agentId: AgentId
      agentName: string
      status: "pending" | "running" | "done" | "skipped" | "failed"
      input: string
      output?: AgentOutput
    }[]
  }
  results: AgentOutput[]
  summary: string
  totalTime: number
}

// ═══════════════════════════════════════════════════
// 意图分析 → 自动拆解为Agent任务链
// ═══════════════════════════════════════════════════

export interface IntentAnalysis {
  type: "new_account" | "daily_content" | "single_image" | "single_video" | "strategy_adjust" | "data_review" | "custom"
  description: string
  pipeline: AgentId[]
}

export function analyzeIntent(input: string): IntentAnalysis {
  const lower = input.toLowerCase()

  // 新账号启动：品牌定位→人设建模→知识图谱→选题分析
  if (/^(我想|我准备|帮我注册|新账号|起号|刚开始|创业|自媒体公司)/.test(input)) {
    return {
      type: "new_account",
      description: "新自媒体账号启动",
      pipeline: ["agent_00", "agent_02", "agent_09", "agent_13"],
    }
  }

  // 单图生成：提示词大师→封面灵感（或只用提示词）
  if (/^生成.*图|画.*|图片|封面|海报/.test(input)) {
    return {
      type: "single_image",
      description: "单图/封面生成",
      pipeline: ["agent_03", "agent_12"],
    }
  }

  // 视频生成：选题→脚本→提示词→BGM→音效→封面
  if (/^生成.*视频|拍.*|视频|短剧|漫剧/.test(input)) {
    return {
      type: "single_video",
      description: "视频/短剧生成",
      pipeline: ["agent_13", "agent_04", "agent_03", "agent_05", "agent_06", "agent_12"],
    }
  }

  // 数据分析：数据→投流→评论
  if (/^分析|数据|复盘|投流|评论/.test(input)) {
    return {
      type: "data_review",
      description: "数据复盘与优化",
      pipeline: ["agent_07", "agent_08", "agent_11B"],
    }
  }

  // 默认：走完整内容链路
  return {
    type: "daily_content",
    description: "日常内容创作",
    pipeline: ["agent_13", "agent_03", "agent_12", "agent_14"],
  }
}

// ═══════════════════════════════════════════════════
// 执行引擎
// ═══════════════════════════════════════════════════

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const startTime = Date.now()
  const taskId = `orchestrator_${Date.now()}`

  // 1. 分析意图
  const intent = analyzeIntent(input.userInput)
  const pipeline = input.agents || intent.pipeline

  // 2. 构建步骤计划
  const steps = pipeline.map((agentId) => ({
    agentId,
    agentName: AGENT_META[agentId]?.name || agentId,
    status: "pending" as const,
    input: input.userInput,
  }))

  const results: AgentOutput[] = []

  // 3. 按序执行
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    steps[i].status = "running"

    try {
      const agentInput: AgentInput = {
        instruction: step.input,
        context: {
          userProfile: {
            platform: input.platform,
            niche: input.niche,
          },
        },
        referenceImages: input.referenceImages,
        referenceText: input.referenceText,
      }

      const output = await AgentRegistry.execute(step.agentId, agentInput)
      results.push(output)

      if (output.success) {
        steps[i].status = "done"
        steps[i].output = output
        // 将前一个Agent的输出传递给下一个
        if (i + 1 < pipeline.length) {
          steps[i + 1].input = output.mainOutput.slice(0, 500)
        }
      } else {
        steps[i].status = "failed"
      }
    } catch {
      steps[i].status = "failed"
    }
  }

  // 4. 生成摘要
  const doneCount = steps.filter((s) => s.status === "done").length
  const summary = `${doneCount}/${steps.length} 个Agent执行成功。${intent.description}`
  const totalTime = Date.now() - startTime

  return {
    success: doneCount > 0,
    taskId,
    plan: { description: intent.description, steps },
    results,
    summary,
    totalTime,
  }
}

// ── 快速分析接口（给前端实时反馈） ──
export function getPipelinePreview(input: string) {
  const intent = analyzeIntent(input)
  return {
    type: intent.type,
    description: intent.description,
    agents: intent.pipeline.map((id) => ({
      id,
      name: AGENT_META[id]?.name || id,
      icon: AGENT_META[id]?.icon || "🤖",
    })),
  }
}
