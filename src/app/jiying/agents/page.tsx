"use client"
import Link from "next/link"
import { AGENT_META } from "@/lib/agents/types"
import type { AgentId } from "@/lib/agents/types"

const GROUP_ORDER = ["planning", "production", "optimization"]
const GROUP_LABELS: Record<string, string> = { planning: "🎯 策划群", production: "⚙️ 生产群", optimization: "🚀 优化群" }
const GROUP_DESC: Record<string, string> = { planning: "品牌定位、选题策略、人设建模", production: "内容创作、脚本分镜、视觉设计", optimization: "数据分析、爆款复刻、标签优化" }
const GROUP_COLORS: Record<string, string> = { planning: "from-amber-500 to-yellow-500", production: "from-orange-500 to-red-500", optimization: "from-rose-500 to-pink-500" }
const GROUP_BG: Record<string, string> = { planning: "bg-amber-500/5 border-amber-500/15", production: "bg-orange-500/5 border-orange-500/15", optimization: "bg-rose-500/5 border-rose-500/15" }
const GROUP_BORDER_CARD: Record<string, string> = { planning: "hover:border-amber-500/30", production: "hover:border-orange-500/30", optimization: "hover:border-rose-500/30" }
const GROUP_BG_CARD: Record<string, string> = { planning: "hover:bg-amber-500/5", production: "hover:bg-orange-500/5", optimization: "hover:bg-rose-500/5" }

export default function AgentsPage() {
  const groups: Record<string, { id: AgentId; icon: string; name: string; description: string }[]> = { planning: [], production: [], optimization: [] }
  for (const [id, meta] of Object.entries(AGENT_META)) {
    if (groups[meta.group]) groups[meta.group].push({ id: id as AgentId, icon: meta.icon, name: meta.name, description: meta.description })
  }
  const totalCount = Object.values(groups).reduce((s, a) => s + a.length, 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* 标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center text-xl shadow-lg shadow-[#F59E0B]/20">🤖</div>
          <div>
            <h1 className="text-2xl font-bold text-[#E8E8F0]">AI引擎</h1>
            <p className="text-sm text-[#9898B0]">{totalCount} 个智能体 · 策划→生产→优化全链路</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/jiying/agents/agent-router"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium hover:bg-teal-500/20 transition-all">
            🎯 工作流调度 →
          </Link>
        </div>
      </div>

      {/* 双模式引导 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-lg mb-1">🧩 单独使用</div>
          <p className="text-xs text-[#9898B0] leading-relaxed">点击下方任意智能体卡片，进入独立工作台。每个智能体专注一个任务，输入即得结果。</p>
        </div>
        <div className="rounded-2xl border border-teal-500/10 bg-teal-500/[0.02] p-5">
          <div className="text-lg mb-1">🔗 组合工作流</div>
          <p className="text-xs text-[#9898B0] leading-relaxed">选择赛道后，多个智能体自动串联成流水线。选题→文案→封面→标签，一气呵成。</p>
        </div>
      </div>

      {/* 工作流概览 */}
      <div className="glass rounded-2xl p-5 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-white/40">🔄 协作链路</span>
          <span className="flex-1 h-px bg-white/[0.06]" />
        </div>
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {GROUP_ORDER.map((gk, gi) => (
            <span key={gk} className="flex items-center gap-1">
              {gi > 0 && <span className="text-white/10 text-lg">→</span>}
              <span className={`px-3 py-1 rounded-full text-[10px] font-medium bg-gradient-to-r ${GROUP_COLORS[gk]} text-white/90`}>
                {GROUP_LABELS[gk]} ({groups[gk].length})
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 三群展示 */}
      {GROUP_ORDER.map(gk => (
        <div key={gk} className={`rounded-2xl p-5 border ${GROUP_BG[gk]}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold bg-gradient-to-r ${GROUP_COLORS[gk]} bg-clip-text text-transparent`}>
              {GROUP_LABELS[gk]}
            </span>
            <span className="text-[10px] text-white/20">{groups[gk].length} 个</span>
          </div>
          <p className="text-[10px] text-white/15 mb-4">{GROUP_DESC[gk]}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups[gk].map(a => (
              <Link key={a.id} href={`/jiying/agents/${a.id.replace(/_/g, "-")}`}
                className={`flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all group ${GROUP_BG_CARD[gk]} ${GROUP_BORDER_CARD[gk]}`}>
                <span className="text-2xl shrink-0 mt-0.5">{a.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#E8E8F0] group-hover:text-[#FBBF24] transition-colors">{a.name}</div>
                  <div className="text-[10px] text-[#5A5A72] mt-0.5 leading-relaxed">{a.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* 底部入口 */}
      <div className="text-center">
        <Link href="/jiying/agents/agent-router"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 text-teal-300/70 text-xs hover:text-teal-300 hover:border-teal-500/30 transition-all">
          🎯 选择赛道，自动匹配最佳Agent组合
          <span className="text-teal-300/30">→</span>
        </Link>
      </div>
    </div>
  )
}
