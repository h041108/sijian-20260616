import type { AgentInput, AgentOutput, AgentId, AgentRegistration } from "./types"
import { AGENT_META } from "./types"
import { BaseAgent } from "./base"

const agentModules: Record<string, () => Promise<{ default: new () => BaseAgent }>> = {
  agent_00: () => import("./agent-00"), agent_01: () => import("./agent-01"),
  agent_02: () => import("./agent-02"), agent_03: () => import("./agent-03"),
  agent_04: () => import("./agent-04"), agent_05: () => import("./agent-05"),
  agent_06: () => import("./agent-06"), agent_07: () => import("./agent-07"),
  agent_08: () => import("./agent-08"), agent_09: () => import("./agent-09"),
  agent_10: () => import("./agent-10"), agent_11A: () => import("./agent-11A"),
  agent_11B: () => import("./agent-11B"), agent_12: () => import("./agent-12"),
  agent_13: () => import("./agent-13"), agent_14: () => import("./agent-14"),
}

const agentCache = new Map<AgentId, BaseAgent>()

export class AgentRegistry {
  static async getAgent(id: AgentId): Promise<BaseAgent> {
    if (agentCache.has(id)) return agentCache.get(id)!
    const loader = agentModules[id]
    if (!loader) throw new Error(`未知Agent: ${id}`)
    const module = await loader()
    const instance = new module.default()
    agentCache.set(id, instance)
    return instance
  }

  static async execute(id: AgentId, input: AgentInput): Promise<AgentOutput> {
    const agent = await AgentRegistry.getAgent(id)
    return agent.run(input)
  }

  static async executeParallel(tasks: { agentId: AgentId; input: AgentInput }[]): Promise<Map<AgentId, AgentOutput>> {
    const results = await Promise.allSettled(tasks.map((t) =>
      AgentRegistry.execute(t.agentId, t.input).then((o) => ({ id: t.agentId, output: o }))
    ))
    const map = new Map<AgentId, AgentOutput>()
    for (const r of results) {
      if (r.status === "fulfilled") map.set(r.value.id, r.value.output)
    }
    return map
  }

  static listByGroup(group: string): { id: AgentId; name: string; icon: string }[] {
    return Object.entries(AGENT_META)
      .filter(([_, meta]) => meta.group === group || group === "all")
      .map(([id, meta]) => ({ id: id as AgentId, name: meta.name, icon: meta.icon }))
  }

  static async getAllRegistrations(): Promise<AgentRegistration[]> {
    const list: AgentRegistration[] = []
    for (const [id] of Object.entries(agentModules)) {
      try { const agent = await AgentRegistry.getAgent(id as AgentId); list.push(agent.getRegistration()) } catch {}
    }
    return list.sort((a, b) => a.id.localeCompare(b.id))
  }

  static clearCache(): void { agentCache.clear() }
}
