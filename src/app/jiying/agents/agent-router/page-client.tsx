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
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg text-white shadow-md">🎯</div>
        <div><h1 className="text-xl font-bold text-gray-800">选择你的赛道</h1><p className="text-sm text-gray-400 mt-0.5">100个细分赛道，智能匹配最优Agent组合</p></div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索赛道..."
        className="w-full rounded-2xl border-gray-200 bg-white text-sm" />

      {!search && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 py-1">🔥 热门：</span>
          {HOT_NICHES.slice(0, 8).map(name => {
            const n = allNiches.find(x => x.name === name)
            return n ? (
              <button key={n.id} onClick={() => setSelectedId(n.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedId === n.id ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-gray-200 text-gray-400 hover:border-indigo-200 hover:text-indigo-500"}`}>{name}</button>
            ) : null
          })}
        </div>
      )}

      {search && searchResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
          {searchResults.map(r => (
            <button key={r.item.id} onClick={() => { setSelectedId(r.item.id); setSearch("") }}
              className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${selectedId === r.item.id ? "bg-indigo-50 border-indigo-200" : "border-gray-200 hover:border-indigo-200"}`}>
              <div className="font-medium text-gray-700">{r.item.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{r.category}</div>
            </button>
          ))}
        </div>
      )}

      {!search && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {NICHE_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left">
                <span className="text-sm font-medium text-gray-700">{cat.icon} {cat.name} <span className="text-gray-300 font-normal">({cat.items.length})</span></span>
                <span className={`text-gray-300 transition-transform ${expandedCat === cat.id ? "rotate-180" : ""}`}>▼</span>
              </button>
              {expandedCat === cat.id && (
                <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-1.5">
                  {cat.items.map(item => (
                    <button key={item.id} onClick={() => setSelectedId(item.id)}
                      className={`text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedId === item.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-600"}`}>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{item.desc}</div>
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
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
            <div className="flex items-center gap-1.5 text-xs text-indigo-500 mb-1">✅ 已选择</div>
            <h3 className="text-lg font-bold text-gray-800">{selectedItem.name}</h3>
            <p className="text-sm text-gray-400 mt-0.5">{selectedItem.desc}</p>
            {selectedItem.data && <p className="text-xs text-gray-400 mt-1">📊 {selectedItem.data}</p>}
          </div>
          {route && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-xs text-gray-400 mb-3">🤖 已匹配Agent流水线</div>
              <div className="flex items-center gap-1 flex-wrap">
                {route.agents.map((id: string, i: number) => {
                  const meta = (AGENT_META as any)[id]
                  return (
                    <div key={id} className="flex items-center">
                      <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-600 whitespace-nowrap">{meta?.icon} {meta?.name}</div>
                      {i < route.agents.length - 1 && <span className="text-gray-300 mx-1.5">→</span>}
                    </div>
                  )
                })}
              </div>
              <div className="text-[10px] text-gray-400 mt-2">{route.description}</div>
            </div>
          )}
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs text-amber-600">💡 优先选择冷门赛道，避免红海竞争</div>
          <Link href="/jiying/onboarding"
            className="block w-full py-3 btn-primary rounded-xl text-sm font-semibold text-center">✅ 确认选择，进入账户设立 →</Link>
        </div>
      )}
    </div>
  )
}
