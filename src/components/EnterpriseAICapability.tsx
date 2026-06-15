"use client"

import { useState } from "react"
import L1SecuritySandbox from "./enterprise/L1SecuritySandbox"
import L2PromptTraining from "./enterprise/L2PromptTraining"
import L3AIJudgment from "./enterprise/L3AIJudgment"
import L4HumanAICollab from "./enterprise/L4HumanAICollab"
import L5OrgCognition from "./enterprise/L5OrgCognition"

const LAYERS = [
  { id: "l1" as const, icon: "🛡️", label: "L1 数据安全", desc: "沙盘推演" },
  { id: "l2" as const, icon: "✍️", label: "L2 AI工具力", desc: "Prompt 工程" },
  { id: "l3" as const, icon: "🧠", label: "L3 AI判断力", desc: "批判审阅" },
  { id: "l4" as const, icon: "🔗", label: "L4 人机协作", desc: "工作流设计" },
  { id: "l5" as const, icon: "🏛️", label: "L5 组织认知", desc: "决策追溯" },
] as const

type LayerId = typeof LAYERS[number]["id"]

export default function EnterpriseAICapability() {
  const [activeLayer, setActiveLayer] = useState<LayerId>("l1")

  return (
    <div className="space-y-6">
      {/* ── 层级导航 ── */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-1 flex">
        {LAYERS.map(layer => (
          <button key={layer.id} onClick={() => setActiveLayer(layer.id)}
            className={`flex-1 py-3 px-2 rounded-xl text-center transition-all ${
              activeLayer === layer.id
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}>
            <div className="text-lg">{layer.icon}</div>
            <div className="text-xs font-semibold mt-0.5">{layer.label}</div>
            <div className="text-[10px] opacity-60">{layer.desc}</div>
          </button>
        ))}
      </div>

      {/* ── 层级内容 ── */}
      {activeLayer === "l1" && <L1SecuritySandbox />}
      {activeLayer === "l2" && <L2PromptTraining />}
      {activeLayer === "l3" && <L3AIJudgment />}
      {activeLayer === "l4" && <L4HumanAICollab />}
      {activeLayer === "l5" && <L5OrgCognition />}
    </div>
  )
}
