import { NextResponse } from "next/server"
import { AGENT_META, AGENT_GROUPS } from "@/lib/agents/types"
import type { AgentId } from "@/lib/agents/types"

export async function GET() {
  const grouped: Record<string, { id: AgentId; name: string; icon: string; description: string }[]> = {
    planning: [], production: [], optimization: [],
  }
  for (const [id, meta] of Object.entries(AGENT_META)) {
    if (grouped[meta.group]) {
      grouped[meta.group].push({
        id: id as AgentId, name: meta.name, icon: meta.icon, description: meta.description,
      })
    }
  }
  return NextResponse.json({
    groups: {
      planning: { label: AGENT_GROUPS.planning, agents: grouped.planning },
      production: { label: AGENT_GROUPS.production, agents: grouped.production },
      optimization: { label: AGENT_GROUPS.optimization, agents: grouped.optimization },
    },
    total: Object.keys(AGENT_META).length,
  })
}
