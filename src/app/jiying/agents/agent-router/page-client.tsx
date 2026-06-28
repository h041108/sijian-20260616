"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { NICHE_CATEGORIES, HOT_NICHES, getAllNiches, searchNiches } from "@/lib/niches-100"
import { routeAgents } from "@/lib/agent-router"
import { AGENT_META } from "@/lib/agents/types"

export default function AgentRouterPage() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const allNiches = useMemo(() => getAllNiches(), [])
  const selectedItem = useMemo(() => allNiches.find(n => n.id === selectedId), [selectedId, allNiches])
  const searchResults = useMemo(() => search ? searchNiches(search) : [], [search])
  const route = useMemo(() => selectedId ? routeAgents(selectedId) : null, [selectedId])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-lg shadow-lg shadow-teal-500/15">🎯</div>
        <div><h1 className="text-xl font-bold text-white/90">选择你的赛道</h1><p className="text-sm text-white/30 mt-0.5">100个细分赛道，智能匹配最优Agent组合</p></div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索赛道..."
        className="w-full rounded-2xl border-white/[0.06] bg-white/[0.03] text-white/80 placeholder-white/20" />

      {!search && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-white/30 py-1">🔥 热门：</span>
          {HOT_NICHES.slice(0, 8).map(name => {
            const n = allNiches.find(x => x.name === name)
            return n ? (
              <button key={n.id} onClick={() => setSelectedId(n.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedId === n.id ? "bg-teal-500/15 border-teal-500/25 text-teal-300" : "border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/20"}`}>{name}</button>
            ) : null
          })}
        </div>
      )}

      {search && searchResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
          {searchResults.map(r => (
            <button key={r.item.id} onClick={() => { setSelectedId(r.item.id); setSearch("") }}
              className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${selectedId === r.item.id ? "bg-teal-500/10 border-teal-500/20 text-teal-300" : "border-white/[0.06] hover:border-white/20 text-white/50"}`}>
              <div className="font-medium">{r.item.name}</div>
              <div className="text-[10px] text-white/20 mt-0.5">{r.category}</div>
            </button>
          ))}
        </div>
      )}

      {!search && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {NICHE_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left">
                <span className="text-sm font-medium text-white/60">{cat.icon} {cat.name} <span className="text-white/20 font-normal">({cat.items.length})</span></span>
                <span className={`text-white/20 transition-transform ${expandedCat === cat.id ? "rotate-180" : ""}`}>▼</span>
              </button>
              {expandedCat === cat.id && (
                <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  {cat.items.map(item => (
                    <button key={item.id} onClick={() => setSelectedId(item.id)}
                      className={`text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedId === item.id ? "bg-teal-500/10 text-teal-300" : "text-white/40 hover:bg-white/[0.02]"}`}>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-[9px] text-white/20 mt-0.5 line-clamp-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="space-y-4">
          <div className="card-elevated rounded-2xl p-5">
            <div className="flex items-center gap-1.5 text-xs text-teal-400 mb-1">✅ 已选择</div>
            <h3 className="text-lg font-bold text-white/90">{selectedItem.name}</h3>
            <p className="text-sm text-white/40 mt-0.5">{selectedItem.desc}</p>
            {selectedItem.data && <p className="text-xs text-white/30 mt-1">📊 {selectedItem.data}</p>}
          </div>
          {route && (
            <div className="glass rounded-2xl p-5">
              <div className="text-xs text-white/30 mb-3">🤖 已匹配Agent流水线</div>
              <div className="flex items-center gap-1 flex-wrap">
                {route.agents.map((id: string, i: number) => {
                  const meta = (AGENT_META as any)[id]
                  return (
                    <div key={id} className="flex items-center">
                      <div className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/15 text-xs text-teal-300 whitespace-nowrap">{meta?.icon} {meta?.name}</div>
                      {i < route.agents.length - 1 && <span className="text-white/10 mx-1.5">→</span>}
                    </div>
                  )
                })}
              </div>
              <div className="text-[10px] text-white/20 mt-2">{route.description}</div>
            </div>
          )}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 text-xs text-amber-400/60">💡 优先选择冷门赛道，避免红海竞争</div>
          <Link href="/jiying/onboarding"
            className="block w-full py-3 btn-primary rounded-xl text-sm font-semibold text-center shadow-lg shadow-teal-500/15">✅ 确认选择，进入账户设立 →</Link>
        </div>
      )}
    </div>
  )
}
