// ─── 即影 · 赛道专家 ──────────────────────────
// 输入你的想法 → 自动调取合适的Agent → 汇总成完整方案

import { AgentRegistry } from "./registry"
import type { AgentInput, AgentOutput, AgentId } from "./types"
import { AGENT_META } from "./types"

export interface TrackExpertInput {
  userInput: string
  platform?: string
  niche?: string
  referenceImages?: string[]
  referenceText?: string
}

export interface TrackExpertOutput {
  success: boolean
  taskId: string
  summary: string           // 整合后的最终方案
  details: {
    agentId: AgentId
    agentName: string
    output: string
  }[]
  totalTime: number
}

// ── 分析用户意图，拆解任务 ──
function analyzeIntent(input: string): { description: string; pipeline: AgentId[] } {
  const lower = input.toLowerCase()

  // 新赛道启动：品牌定位→人设建模→知识图谱→选题分析
  if (/^(我想|我准备|帮我|新账号|起号|刚开始|创业|自媒体|赛道|选方向|适合什么)/.test(input)) {
    return {
      description: "赛道诊断与人设定位",
      pipeline: ["agent_00", "agent_02", "agent_09", "agent_13"],
    }
  }

  // 内容创作：选题→提示词→封面→标签
  return {
    description: "日常内容创作方案",
    pipeline: ["agent_13", "agent_03", "agent_12", "agent_14"],
  }
}

// ── 把多个Agent的输出合成一份完整方案 ──
async function synthesizeSummary(
  userInput: string,
  results: { agentId: AgentId; agentName: string; output: string }[],
): Promise<string> {
  const outputs = results.map(r =>
    `【${r.agentName}】\n${r.output.slice(0, 300)}`
  ).join("\n\n")

  const prompt = `你是一位赛道专家。用户输入了以下需求：

用户需求：${userInput}

AI分析团队已经输出了以下结果：
${outputs}

请将以上结果整合成一份完整的、用户直接能用的方案。要求：
1. 去掉"Agent"、"输出"等技术术语
2. 用用户能看懂的语言重新组织
3. 分三个板块输出：赛道分析、人设建议、行动建议
4. 直接给结论，不要解释过程
5. 控制在500字以内`

  const res = await fetch(process.env.DEEPSEEK_API_BASE + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.DEEPSEEK_API_KEY,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: "你是一位赛道专家。把多个AI分析结果整合成一份用户直接能看的方案。不要用术语，只说人话。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    }),
  })

  if (!res.ok) {
    // 降级：直接拼接
    return results.map(r => r.output).join("\n\n---\n\n")
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || results.map(r => r.output).join("\n\n---\n\n")
}

// ── 运行赛道专家 ──
export async function runTrackExpert(input: TrackExpertInput): Promise<TrackExpertOutput> {
  const startTime = Date.now()
  const taskId = `track_${Date.now()}`
  const intent = analyzeIntent(input.userInput)
  const pipeline = intent.pipeline

  const details: { agentId: AgentId; agentName: string; output: string }[] = []

  for (let i = 0; i < pipeline.length; i++) {
    const agentId = pipeline[i]
    try {
      const agentInput: AgentInput = {
        instruction: input.userInput,
        context: {
          userProfile: {
            platform: input.platform,
            niche: input.niche,
          },
        },
      }
      const output = await AgentRegistry.execute(agentId, agentInput)
      if (output.success) {
        details.push({ agentId, agentName: AGENT_META[agentId]?.name || agentId, output: output.mainOutput })
        // 用上个结果增强下一个
        if (i + 1 < pipeline.length) {
          input.userInput = input.userInput + "\n参考：" + output.mainOutput.slice(0, 200)
        }
      }
    } catch {
      details.push({ agentId, agentName: AGENT_META[agentId]?.name || agentId, output: "分析失败" })
    }
  }

  // 合成最终方案
  const summary = await synthesizeSummary(input.userInput, details)
  const totalTime = Date.now() - startTime

  return {
    success: details.some(d => d.output !== "分析失败"),
    taskId,
    summary,
    details,
    totalTime,
  }
}
