import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"
import { AGENT_META } from "./types"

export abstract class BaseAgent {
  abstract id: AgentId
  abstract getRegistration(): AgentRegistration
  abstract execute(input: AgentInput): Promise<AgentOutput>

  async run(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now()
    try {
      const meta = AGENT_META[this.id]
      const reg = this.getRegistration()
      for (const required of reg.requiredInputs) {
        if (required === "instruction" && !input.instruction?.trim()) {
          return this.error(`缺少必填输入: ${required}`)
        }
      }
      const output = await this.execute(input)
      output.agentId = this.id
      output.agentName = meta.name
      output.processingTime = Date.now() - startTime
      output.modelUsed = output.modelUsed || reg.defaultModel
      return output
    } catch (err: any) {
      return this.error(err.message || "未知错误")
    }
  }

  protected async callLLM(systemPrompt: string, userMessage: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const res = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        existingNodes: [], stream: false,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2048,
      }),
    })
    if (!res.ok) throw new Error(`LLM调用失败 [${res.status}]`)
    const data = await res.json()
    return data.message || ""
  }

  protected parseJSON<T = Record<string, any>>(text: string): T | null {
    try { return JSON.parse(text.trim()) } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) try { return JSON.parse(match[1].trim()) } catch {}
      return null
    }
  }

  protected error(message: string): AgentOutput {
    return { success: false, agentId: this.id, agentName: AGENT_META[this.id]?.name || this.id, mainOutput: `执行失败: ${message}`, qualityScore: 0, confidence: 0, error: message }
  }
}
