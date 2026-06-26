"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

const GROUP_ORDER = ["planning", "production", "optimization"]
const GROUP_LABELS: Record<string,string> = { planning: "🎯 策划群", production: "⚙️ 生产群", optimization: "🚀 优化群" }
const COLORS: Record<string,string> = { planning: "border-l-indigo-400 bg-indigo-50/30", production: "border-l-emerald-400 bg-emerald-50/30", optimization: "border-l-amber-400 bg-amber-50/30" }

export default function AgentsPage() {
  const [groups, setGroups] = useState<any>(null)
  useEffect(() => { fetch("/api/agents").then(r=>r.json()).then(d=>setGroups(d.groups)) }, [])
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-gray-900">🤖 即影 Agent 中心</h1>
        <p className="text-sm text-gray-400">15个AI自媒体专家，全部可点击使用</p>
      </div>
      {GROUP_ORDER.map(gk => {
        const g = groups?.[gk]
        if (!g?.agents?.length) return null
        return (
          <div key={gk} className={"border-l-4 rounded-xl p-4 " + (COLORS[gk] || "")}>
            <h2 className="text-base font-bold text-gray-700 mb-3">{GROUP_LABELS[gk]}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {g.agents.map((a: any) => (
                <Link key={a.id} href={"/jiying/agents/" + a.id.replace(/_/g, "-")}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/80 border border-gray-200/60 hover:border-indigo-300 hover:shadow-sm transition-all group">
                  <span className="text-lg">{a.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">{a.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{a.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
