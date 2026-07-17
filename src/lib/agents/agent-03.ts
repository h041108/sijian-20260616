import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent03 extends BaseAgent {
  id: AgentId = "agent_03"
  getRegistration(): AgentRegistration {
    return { id: "agent_03", name: "提示词大师", icon: "🎨", group: "production", description: "为不同AI模型生成优化提示词", version: "3.0.0", isActive: true, triggers: ["图片生成", "视频生成", "prompt优化"], requiredInputs: ["instruction"], optionalInputs: ["parameters.style"], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2500, hasStandaloneUI: true }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const style = input.parameters?.style || "写实电影风格"
    const sp = `你是一位AI提示词工程专家，精通各大模型的提示词设计。

【需求分析】核心目标/输出格式/风格调性
【优化后提示词】含角色设定/任务/格式/约束/示例
【多模型适配】GPT版/DeepSeek版/中文优化版
【使用建议】推荐参数/常见问题调整方法` + style
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2500 })
    return { success: true, agentId: this.id, agentName: "提示词大师", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
