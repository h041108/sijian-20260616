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
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">🎯</div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">选择你的赛道</h1>
          <p className="text-sm text-white/40 mt-1">100个细分赛道，智能匹配最优Agent组合</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索赛道..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border-white/[0.06] bg-white/[0.02] text-sm" />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm">🔍</span>
      </div>

      {/* Hot tags */}
      {!search && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/30">🔥 热门：</span>
          {HOT_NICHES.slice(0, 8).map(name => {
            const n = allNiches.find(x => x.name === name)
            return n ? (
              <button key={n.id} onClick={() => setSelectedId(n.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedId === n.id ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10"}`}>{name}</button>
            ) : null
          })}
        </div>
      )}

      {/* Search results */}
      {search && searchResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
          {searchResults.map(r => (
            <button key={r.item.id} onClick={() => { setSelectedId(r.item.id); setSearch("") }}
              className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${selectedId === r.item.id ? "bg-amber-500/10 border-amber-500/20" : "border-white/[0.06] hover:border-white/10"}`}>
              <div className="font-medium text-white/70">{r.item.name}</div>
              <div className="text-[10px] text-white/20 mt-0.5">{r.category}</div>
            </button>
          ))}
        </div>
      )}

      {/* Categories */}
      {!search && (
        <div className="space-y-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {NICHE_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-medium text-white/60">{cat.icon} {cat.name} <span className="text-white/20 font-normal">({cat.items.length})</span></span>
                <span className={`text-white/20 transition-transform ${expandedCat === cat.id ? "rotate-180" : ""}`}>▼</span>
              </button>
              {expandedCat === cat.id && (
                <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  {cat.items.map(item => (
                    <button key={item.id} onClick={() => setSelectedId(item.id)}
                      className={`text-left px-3 py-2 rounded-xl border text-xs transition-all ${selectedId === item.id ? "bg-amber-500/10 border-amber-500/20" : "border-transparent hover:bg-white/[0.02] hover:border-white/[0.06]"}`}>
                      <div className="font-medium text-white/60 hover:text-white/80">{item.name}</div>
                      <div className="text-[9px] text-white/20 mt-0.5 line-clamp-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected */}
      {selectedItem && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
              <span>✅</span> <span>已选择</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{selectedItem.name}</h3>
            <p className="text-sm text-white/40 mt-0.5">{selectedItem.desc}</p>
            {selectedItem.data && <p className="text-xs text-white/20 mt-1">📊 {selectedItem.data}</p>}
          </div>

          {route && (
            <div className="glass rounded-2xl p-5">
              <div className="text-xs text-white/30 mb-3">🤖 已匹配Agent流水线</div>
              <div className="flex items-center gap-1 flex-wrap">
                {route.agents.map((id: string, i: number) => {
                  const meta = (AGENT_META as any)[id]
                  return (
                    <div key={id} className="flex items-center">
                      <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 whitespace-nowrap">
                        {meta?.icon} {meta?.name}
                      </div>
                      {i < route.agents.length - 1 && <span className="text-white/10 mx-1.5">→</span>}
                    </div>
                  )
                })}
              </div>
              <div className="text-[10px] text-white/20 mt-2">{route.description}</div>
            </div>
          )}

          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4 text-xs text-amber-300/60">
            💡 优先选择冷门赛道，避免在红海领域与头部创作者直接竞争。
          </div>

          <Link href="/jiying/onboarding"
            className="block w-full py-3.5 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20">
            ✅ 确认选择，进入账户设立 →
          </Link>
        </div>
      )}
    </div>
  )
}
