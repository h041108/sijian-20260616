"use client"
import Link from "next/link"
import { AGENT_META } from "@/lib/agents/types"
import type { AgentId } from "@/lib/agents/types"

const GROUP_ORDER = ["planning", "production", "optimization"]
const GROUP_LABELS: Record<string, string> = { planning: "🎯 策划群", production: "⚙️ 生产群", optimization: "🚀 优化群" }
const COLORS: Record<string, string> = { planning: "border-l-[#F59E0B]", production: "border-l-[#F97316]", optimization: "border-l-[#EA580C]" }

export default function AgentsPage() {
  const groups: Record<string, { id: AgentId; icon: string; name: string; description: string }[]> = { planning: [], production: [], optimization: [] }
  for (const [id, meta] of Object.entries(AGENT_META)) {
    if (groups[meta.group]) groups[meta.group].push({ id: id as AgentId, icon: meta.icon, name: meta.name, description: meta.description })
  }
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center text-lg">🤖</div>
        <div><h1 className="text-xl font-bold">Agent中心</h1><p className="text-sm text-[#9898B0]">15个AI专家</p></div>
      </div>
      {GROUP_ORDER.map(gk => (
        <div key={gk} className={"border-l-4 rounded-2xl p-4 bg-white/[0.03] border-white/[0.06] " + (COLORS[gk] || "")}>
          <h2 className="text-base font-bold text-[#E8E8F0] mb-3">{GROUP_LABELS[gk]}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {groups[gk].map(a => (
              <Link key={a.id} href={`/jiying/agents/${a.id.replace(/_/g, "-")}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#F59E0B]/20 hover:bg-[#F59E0B]/5 transition-all group">
                <span className="text-lg">{a.icon}</span>
                <div><div className="text-sm font-medium text-[#E8E8F0] group-hover:text-[#FBBF24]">{a.name}</div><div className="text-[10px] text-[#5A5A72]">{a.description}</div></div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
