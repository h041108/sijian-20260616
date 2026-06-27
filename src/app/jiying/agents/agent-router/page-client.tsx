"use client"
import { useState, useEffect, useCallback } from "react"
import { routeAgents } from "@/lib/agent-router"
import { NICHE_TREE, PLATFORMS } from "@/lib/agent-router"
import type { AgentId } from "@/lib/agents/types"
import { AGENT_META } from "@/lib/agents/types"

const AGENT_ALL: AgentId[] = [
  "agent_00", "agent_01", "agent_02", "agent_03", "agent_04",
  "agent_05", "agent_06", "agent_07", "agent_08", "agent_09",
  "agent_10", "agent_11A", "agent_11B", "agent_12", "agent_13", "agent_14",
]

export default function AgentRouterPage() {
  const [selectedCat, setSelectedCat] = useState<string>("")
  const [selectedSub, setSelectedSub] = useState<string>("")
  const [selectedLeaf, setSelectedLeaf] = useState<string>("")
  const [route, setRoute] = useState<any>(null)
  const [showAll, setShowAll] = useState(false)

  const currentCat = NICHE_TREE.find(c => c.id === selectedCat)
  const currentSub = currentCat?.children?.find(s => s.id === selectedSub)

  const getNicheId = () => selectedLeaf || selectedSub || selectedCat

  useEffect(() => {
    const id = getNicheId()
    if (id) {
      setRoute(routeAgents(id))
    }
  }, [selectedCat, selectedSub, selectedLeaf])

  const activeAgentIds = new Set(route?.agents || [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🧠</span>
        <div><h1 className="text-xl font-bold text-gray-800">15Agent 智能路由</h1><p className="text-sm text-gray-400">根据你选的赛道，自动匹配最合适的AI专家组合</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧：赛道选择 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">选择你的赛道</h2>

          {/* 一级 */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">一级分类</label>
            <div className="flex flex-wrap gap-1.5">
              {NICHE_TREE.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCat(cat.id); setSelectedSub(""); setSelectedLeaf("") }}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${selectedCat === cat.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 二级 */}
          {currentCat?.children && (
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">二级分类</label>
              <div className="flex flex-wrap gap-1.5">
                {currentCat.children.map(sub => (
                  <button key={sub.id} onClick={() => { setSelectedSub(sub.id); setSelectedLeaf("") }}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${selectedSub === sub.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 三级 */}
          {currentSub?.children && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">三级分类</label>
              <div className="flex flex-wrap gap-1.5">
                {currentSub.children.map(leaf => (
                  <button key={leaf.id} onClick={() => setSelectedLeaf(leaf.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${selectedLeaf === leaf.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                    {leaf.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!selectedCat && (
            <div className="text-xs text-gray-300 text-center py-6">请先选择一个一级赛道</div>
          )}
        </div>

        {/* 右侧：路由结果 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">
            {route ? `已激活 ${route.agents.length} 个Agent` : "等待选择赛道"}
          </h2>

          {route && (
            <div className="mb-3 bg-indigo-50 rounded-xl p-2 text-xs text-indigo-700">
              {route.description}
            </div>
          )}

          <div className="space-y-1">
            {[
              { group: "🎯 策划群", agents: ["agent_00", "agent_01", "agent_02", "agent_09", "agent_13"] },
              { group: "⚙️ 生产群", agents: ["agent_03", "agent_04", "agent_05", "agent_06", "agent_12"] },
              { group: "🚀 优化群", agents: ["agent_07", "agent_08", "agent_10", "agent_11A", "agent_11B", "agent_14"] },
            ].map(g => (
              <div key={g.group}>
                <div className="text-[10px] text-gray-400 font-medium mb-1 mt-2">{g.group}</div>
                <div className="grid grid-cols-2 gap-1">
                  {g.agents.map(id => {
                    const meta = (AGENT_META as any)[id]
                    const active = activeAgentIds.has(id as AgentId)
                    return (
                      <div key={id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all ${active ? "bg-indigo-50 text-indigo-700 font-medium" : "bg-gray-50 text-gray-300"}`}>
                        <span className="text-sm">{meta?.icon || "🤖"}</span>
                        <span className="truncate">{meta?.name || id}</span>
                        {active && <span className="ml-auto text-[9px] text-indigo-400">✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {!selectedCat && (
            <div className="text-xs text-gray-300 text-center py-6">左侧选择赛道后，自动显示匹配的Agent组合</div>
          )}
        </div>
      </div>

      {/* 流水线预览 */}
      {route && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">🧩 自动流水线</h2>
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
        </div>
      )}
    </div>
  )
}
