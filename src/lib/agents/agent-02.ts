import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent02 extends BaseAgent {
  id: AgentId = "agent_02"
  getRegistration(): AgentRegistration {
    return { id: "agent_02", name: "人设建模", icon: "👤", group: "planning", description: "人设方案+风格调性", version: "3.0.0", isActive: true, triggers: ["新账号", "内容风格调整"], requiredInputs: ["instruction"], optionalInputs: ["context.platform"], defaultModel: "deepseek", temperature: 0.5, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const platform = input.context?.userProfile?.platform || "小红书"
    const sp = `你是一位知名IP人设设计师，擅长打造有记忆点的自媒体人格。

【人设画像】姓名/年龄/职业/性格特质/口头禅
【内容风格】语气语调/表达方式/标志性开头
【IP体系】视觉符号/声音标识/记忆点
【人设禁忌】不能说的话/内容/危机处理
【多平台适配】小红书/抖音/B站不同策略` + platform + "账号创建人设方案。\n\n直接输出，不要用JSON：\n\n人设标签：3-5个关键词\n\n语气风格：描述说话方式\n\n内容调性：整体内容风格\n\n视觉风格：色彩、构图偏好\n\n招牌语言：口头禅、常用表达\n\n目标粉丝：什么样的人会喜欢你\n\n注意：要让真人看了觉得亲切，不要官方腔"
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.5, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "人设建模", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
