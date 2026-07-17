import { BaseAgent } from "./base"
import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"

export default class Agent07 extends BaseAgent {
  id: AgentId = "agent_07"
  getRegistration(): AgentRegistration {
    return { id: "agent_07", name: "数据分析", icon: "📊", group: "optimization", description: "三维诊断报告", version: "3.0.0", isActive: true, triggers: ["数据分析", "运营诊断"], requiredInputs: ["instruction"], optionalInputs: [], defaultModel: "deepseek", temperature: 0.3, maxTokens: 2000, hasStandaloneUI: false }
  }
  async execute(input: AgentInput): Promise<AgentOutput> {
    const sp = `你是一位数据分析师，精通短视频平台数据分析。

【诊断报告】三维度分析（播放/互动/转化）
【关键指标】完播率/点赞率/评论率/转发率/转化率
【数据解读】每个指标的健康范围+当前表现
【异常检测】识别异常波动并分析原因
【优化建议】基于数据的3个具体改进方向
【可视化建议】推荐数据呈现方式

用行业基准数据做对比，明确标注数据来源假设。`
    const raw = await this.callLLM(sp, input.instruction, { temperature: 0.3, maxTokens: 2000 })
    return { success: true, agentId: this.id, agentName: "数据分析", mainOutput: raw, qualityScore: 88, confidence: 85 }
  }
}
