"use client"
import { useState, useMemo } from "react"
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

  const selectedCategory = selectedItem
    ? NICHE_CATEGORIES.find(c => c.items.some(i => i.id === selectedId))
    : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* 步骤条 */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <a href="/jiying" className="hover:text-indigo-600">← 返回</a>
        <span className="text-gray-300">|</span>
        <span className="font-medium text-indigo-600">即影自媒体工厂</span>
        <span className="text-gray-300 mx-1">[步骤 1/3]</span>
        <span className="flex gap-1">
          <span className="w-3 h-3 rounded-full bg-indigo-600" />
          <span className="w-3 h-3 rounded-full bg-gray-200" />
          <span className="w-3 h-3 rounded-full bg-gray-200" />
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">🎯</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">选择您的赛道</h1>
          <p className="text-xs text-gray-400 max-w-3xl">
            请选择您要深耕的垂直领域，系统将根据您的选择智能匹配最优Agent组合。
            以下100个赛道均经过大数据筛选，优先选择竞争度低、增长快、用户粘性高的细分领域。
          </p>
        </div>
      </div>

      {/* 搜索 + 热门推荐 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 搜索赛道..."
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {!search && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">🔥 热门推荐：</span>
              {HOT_NICHES.map(name => {
                const n = allNiches.find(x => x.name === name)
                return n ? (
                  <button key={n.id} onClick={() => setSelectedId(n.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedId === n.id ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                    {name}
                  </button>
                ) : null
              })}
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        {search && (
          <div className="p-4 max-h-60 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">没有找到匹配的赛道</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {searchResults.map(r => (
                  <button key={r.item.id} onClick={() => { setSelectedId(r.item.id); setSearch("") }}
                    className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors ${selectedId === r.item.id ? "bg-indigo-50 border-indigo-300" : "border-gray-200 hover:border-indigo-200"}`}>
                    <div className="font-medium text-gray-800">{r.item.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{r.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 分类列表 */}
        {!search && (
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {NICHE_CATEGORIES.map(cat => (
              <div key={cat.id}>
                <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-gray-700">
                    {cat.icon} {cat.name}
                    <span className="text-xs text-gray-400 font-normal ml-2">（{cat.items.length}个）</span>
                  </span>
                  <span className="text-gray-300 transition-transform" style={{ transform: expandedCat === cat.id ? "rotate(180deg)" : "" }}>▼</span>
                </button>
                {expandedCat === cat.id && (
                  <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {cat.items.map(item => (
                      <button key={item.id} onClick={() => setSelectedId(item.id)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${selectedId === item.id ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200" : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"}`}>
                        <div className="font-medium text-gray-800">{item.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 已选赛道 + Agent路由 */}
      {selectedItem && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-600 font-semibold">✅ 您已选择</span>
                <h3 className="text-base font-bold text-gray-800 mt-0.5">{selectedItem.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedItem.desc}</p>
                {selectedItem.data && <p className="text-[10px] text-indigo-500 mt-0.5">📊 {selectedItem.data}</p>}
              </div>
            </div>
          </div>

          {route && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 font-medium mb-2">🤖 已匹配Agent流水线</div>
              <div className="flex items-center gap-1 flex-wrap">
                {route.agents.map((id: string, i: number) => {
                  const meta = (AGENT_META as any)[id]
                  return (
                    <div key={id} className="flex items-center">
                      <div className="px-2.5 py-1.5 bg-indigo-50 rounded-lg text-xs text-indigo-700 border border-indigo-200 whitespace-nowrap">
                        {meta?.icon} {meta?.name}
                      </div>
                      {i < route.agents.length - 1 && <span className="text-gray-300 mx-1">→</span>}
                    </div>
                  )
                })}
              </div>
              <div className="text-[10px] text-gray-400 mt-2">{route.description}</div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            💡 建议：优先选择与自身兴趣、资源匹配的冷门赛道，避免在红海领域与头部创作者直接竞争。
          </div>

          <button className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
            ✅ 确认选择，进入下一步 →
          </button>
        </div>
      )}
    </div>
  )
}
