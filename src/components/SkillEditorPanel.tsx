"use client"

import { useState, useEffect, useCallback } from "react"
import {
  loadSkills, loadPipelineSkills, updateSkill, resetSkill,
  SkillFile, getAllCategories,
} from "@/lib/skill-engine"

const CAT_LABELS: Record<string, string> = {
  education:"教育", business:"商业", creative:"创意", developer:"开发", life:"生活", video_pipeline:"视频流水线",
}

export default function SkillEditor() {
  const [skills, setSkills] = useState<SkillFile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [saved, setSaved] = useState(false)
  const [filterCat, setFilterCat] = useState("")

  const refresh = useCallback(() => {
    const all = [...loadSkills(), ...loadPipelineSkills().filter(p => !loadSkills().some(s => s.id === p.id))]
    setSkills(all)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const selected = selectedId ? skills.find(s => s.id === selectedId) : null
  const categories = getAllCategories()

  const handleSave = () => {
    if (!selectedId || !editText.trim()) return
    updateSkill(selectedId, editText.trim())
    refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (!selectedId) return
    resetSkill(selectedId)
    refresh()
    const s = skills.find(sk => sk.id === selectedId)
    if (s) setEditText(s.systemPrompt)
  }

  const filtered = filterCat ? skills.filter(s => s.category === filterCat) : skills

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📝 Skill 技能文件编辑</h3>
        <p className="text-xs text-gray-400 mb-4">
          所有 AI 角色的 System Prompt 都以 Markdown 文件存储，可在线编辑。修改后即时生效，无需重新部署。
        </p>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setFilterCat("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filterCat ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>全部</button>
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === c ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
              {CAT_LABELS[c] || c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map(s => (
            <div key={s.id} onClick={() => { setSelectedId(s.id); setEditText(s.systemPrompt); setSaved(false) }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedId === s.id ? "border-indigo-300 bg-indigo-50" : "border-[#e8e5df] hover:border-indigo-200"
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full">{CAT_LABELS[s.category] || s.category}</span>
                <span className="text-[9px] text-gray-300 ml-auto">v{s.version}</span>
              </div>
              <p className="text-xs text-gray-400 truncate">{s.systemPrompt.slice(0, 80)}</p>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {selected.icon} {selected.name} · 当前版本 {selected.version}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={handleReset}
                className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">↩ 恢复默认</button>
              <button onClick={handleSave} disabled={editText === selected.systemPrompt}
                className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${
                  saved ? "bg-green-100 text-green-700" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}>
                {saved ? "✅ 已保存" : "💾 保存"}
              </button>
            </div>
          </div>

          <textarea value={editText} onChange={e => setEditText(e.target.value)}
            className="w-full h-[400px] rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-4 text-sm font-mono text-gray-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span>框架: {selected.defaultFrame}</span>
            <span>思维: {selected.thinkingStyle.join(" · ")}</span>
            <span className="ml-auto">更新于: {new Date(selected.updatedAt).toLocaleString("zh")}</span>
          </div>
        </div>
      )}
    </div>
  )
}
