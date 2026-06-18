"use client"

import { useState, useEffect, useCallback } from "react"
import {
  PERSONA_LIBRARY, AIPersona, PROMPT_TEMPLATES, PromptTemplate,
  executeTemplate, getTemplatesByCategory,
} from "@/lib/persona-engine"
import SkillEditorPanel from "@/components/SkillEditorPanel"

export default function PersonaTemplateDashboard() {
  const [tab, setTab] = useState<"personas" | "templates" | "api" | "skills">("personas")

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-3 flex gap-1.5">
        {[
          { id: "personas" as const, icon: "🎭", label: "AI 人格库" },
          { id: "templates" as const, icon: "📋", label: "Prompt 模板引擎" },
          { id: "skills" as const, icon: "📝", label: "Skill 编辑" },
          { id: "api" as const, icon: "🔌", label: "认知 API" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "personas" && <PersonaPanel />}
      {tab === "templates" && <TemplatePanel />}
      {tab === "skills" && <SkillEditorPanel />}
      {tab === "api" && <APIPanel />}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// AI 人格库面板
// ═══════════════════════════════════════════════════

function PersonaPanel() {
  const [selectedPersona, setSelectedPersona] = useState<AIPersona | null>(null)
  const [filterCat, setFilterCat] = useState<string>("")

  const categories = [...new Set(PERSONA_LIBRARY.map(p => p.category))]
  const catLabels: Record<string, string> = {
    education: "教育", business: "商业", creative: "创意", developer: "开发", life: "生活",
  }

  const filtered = filterCat ? PERSONA_LIBRARY.filter(p => p.category === filterCat) : PERSONA_LIBRARY

  return (
    <div className="space-y-4">
      {!selectedPersona ? (
        <>
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🎭 AI 人格库</h3>
            <p className="text-xs text-gray-400 mb-4">每个角色有预设的思维模式、对话语气和框架偏好。在C端切换人格后，思见会按该角色的方式思考。</p>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setFilterCat("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filterCat ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>全部</button>
              {categories.map(c => (
                <button key={c} onClick={() => setFilterCat(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === c ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                  {catLabels[c]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(p => (
                <div key={p.id} onClick={() => setSelectedPersona(p)}
                  className="p-4 rounded-xl border border-[#e8e5df] cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                      <div className="text-[10px] text-gray-400">{catLabels[p.category]}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.thinkingStyle.slice(0, 3).map(s => (
                      <span key={s} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">{s}</span>
                    ))}
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{p.defaultFrame}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6">
          <button onClick={() => setSelectedPersona(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-3">← 返回人格库</button>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{selectedPersona.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{selectedPersona.name}</h2>
              <p className="text-xs text-gray-400">{selectedPersona.description} · {selectedPersona.tone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-[10px] text-gray-400 mb-1">思维偏好</div>
              <div className="flex flex-wrap gap-1">
                {selectedPersona.thinkingStyle.map(s => (
                  <span key={s} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-[10px] text-gray-400 mb-1">框架+语气</div>
              <div className="text-xs text-gray-700">框架: {selectedPersona.defaultFrame}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedPersona.tone}</div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
            <div className="text-[10px] text-indigo-500 font-medium mb-2">System Prompt</div>
            <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">{selectedPersona.systemPrompt.slice(0, 800)}</pre>
          </div>

          <div className="mt-3 text-[10px] text-gray-400">💡 复制这个 System Prompt 到思见中即可使用该人格</div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Prompt 模板引擎面板
// ═══════════════════════════════════════════════════

function TemplatePanel() {
  const [selectedTpl, setSelectedTpl] = useState<PromptTemplate | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const cats = getTemplatesByCategory()

  const handleExecute = useCallback(async () => {
    if (!selectedTpl) return
    const prompt = executeTemplate(selectedTpl, values)
    setRunning(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], existingNodes: [] }),
      })
      const data = await res.json()
      setOutput(data.message || "生成失败")
    } catch {
      setOutput("请求失败")
    } finally { setRunning(false) }
  }, [selectedTpl, values])

  useEffect(() => { setOutput("") }, [selectedTpl])

  return (
    <div className="space-y-4">
      {!selectedTpl ? (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 Prompt 模板引擎</h3>
          <p className="text-xs text-gray-400 mb-4">参数化模板，填变量 → 自动生成Prompt → AI执行。机构可自定义模板。</p>
          {Object.entries(cats).map(([cat, tpls]) => (
            <div key={cat} className="mb-4 last:mb-0">
              <div className="text-[10px] text-gray-400 mb-2">{cat}</div>
              <div className="grid grid-cols-2 gap-2">
                {tpls.map(tpl => (
                  <div key={tpl.id} onClick={() => { setSelectedTpl(tpl); setValues({}) }}
                    className="p-3 rounded-xl border border-[#e8e5df] cursor-pointer hover:border-indigo-300 transition-all">
                    <div className="text-sm font-semibold text-gray-800">{tpl.name}</div>
                    <p className="text-xs text-gray-400 mt-0.5">{tpl.description}</p>
                    <span className="text-[9px] text-gray-300 mt-1">{tpl.variables.length} 个参数</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6">
          <button onClick={() => setSelectedTpl(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-3">← 返回模板库</button>
          <h2 className="text-base font-bold text-gray-800 mb-4">{selectedTpl.name}</h2>

          {/* 变量表单 */}
          <div className="space-y-3 mb-4">
            {selectedTpl.variables.map(v => (
              <div key={v.name}>
                <label className="text-[10px] text-gray-400 block mb-1">{v.label}</label>
                {v.type === "select" ? (
                  <select value={values[v.name] || ""} onChange={e => setValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                    className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm">
                    <option value="">选择{v.label}</option>
                    {v.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input value={values[v.name] || ""} onChange={e => setValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                    placeholder={v.placeholder}
                    className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm" />
                )}
              </div>
            ))}
          </div>

          {/* 生成的 Prompt 预览 */}
          <div className="p-3 bg-gray-50 rounded-xl mb-3">
            <div className="text-[10px] text-gray-400 mb-1">生成的 Prompt</div>
            <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
              {selectedTpl ? executeTemplate(selectedTpl, values) : ""}
            </pre>
          </div>

          <div className="flex gap-3">
            <button onClick={handleExecute} disabled={running}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-medium disabled:opacity-40">
              {running ? "⏳ 执行中" : "🚀 生成内容"}
            </button>
            <button onClick={() => {
              const prompt = selectedTpl ? executeTemplate(selectedTpl, values) : ""
              navigator.clipboard.writeText(prompt)
              setCopied(true); setTimeout(() => setCopied(false), 1500)
            }} className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">
              {copied ? "✅ 已复制" : "📋 复制 Prompt"}
            </button>
          </div>

          {output && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-green-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {output}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 认知 API 面板
// ═══════════════════════════════════════════════════

function APIPanel() {
  const [testText, setTestText] = useState("")
  const [result, setResult] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleTest = async () => {
    if (!testText.trim()) return
    setRunning(true)
    try {
      const res = await fetch("/api/cognition", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText.trim() }),
      })
      const data = await res.json()
      setResult(data)
    } catch { } finally { setRunning(false) }
  }

  return (
    <div className="space-y-6">
      {/* API 文档 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🔌 认知引擎 API</h3>
        <p className="text-xs text-gray-400 mb-4">
          第三方系统调用此 API 获取思维诊断能力——输入一段文字，返回L1思维状态+L2意图+L3情绪认知负荷。
        </p>

        <div className="bg-gray-900 rounded-xl p-4 mb-4">
          <pre className="text-xs text-green-400 font-mono leading-relaxed">
{`POST /api/cognition
Content-Type: application/json

{
  "text": "要分析的文本（至少4字）",
  "options": {
    "previousState": "exploring",    // 可选
    "previousEmotion": "neutral"     // 可选
  }
}

Response 200:
{
  "cognition": {
    "l1_thinking_state": {
      "state": "exploring",
      "stateLabel": "探索",
      "confidence": 0.85,
      "dominantLines": ["analogy","divergent"],
      "divergenceVsConvergence": -0.4
    },
    "l2_cognitive_intent": {
      "intent": "learning",
      "intentLabel": "学习",
      "urgency": "normal",
      "patience": 0.7
    },
    "l3_emotion_cognitive_load": {
      "emotion": "curious",
      "emotionLabel": "好奇",
      "intensity": 0.6,
      "cognitiveLoad": 0.35,
      "loadTrend": "stable"
    },
    "meta": {
      "summary": "...",
      "suggestion": "..."
    }
  }
}`}
          </pre>
        </div>

        <div className="flex gap-2 text-xs">
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">零 API 调用成本（纯本地引擎）</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">延迟 &lt; 10ms</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">无外部依赖</span>
        </div>
      </div>

      {/* 在线测试 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🧪 在线测试</h3>
        <textarea value={testText} onChange={e => setTestText(e.target.value)}
          placeholder="输入一段文字，如：我觉得这个方案有很多问题，但我又说不清具体是什么问题，你能帮我分析一下吗？"
          rows={3}
          className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-3 text-sm resize-none mb-3" />
        <button onClick={handleTest} disabled={!testText.trim() || running}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40">
          {running ? "⏳ 分析中" : "🔍 认知分析"}
        </button>

        {result && !result.error && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="text-[10px] text-purple-500 mb-1">L1 思维状态</div>
                <div className="text-lg font-bold text-purple-700">{result.cognition.l1_thinking_state.stateLabel}</div>
                <div className="text-xs text-purple-500">置信 {Math.round(result.cognition.l1_thinking_state.confidence * 100)}%</div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <div className="text-[10px] text-indigo-500 mb-1">L2 认知意图</div>
                <div className="text-lg font-bold text-indigo-700">{result.cognition.l2_cognitive_intent.intentLabel}</div>
                <div className="text-xs text-indigo-500">紧急度: {result.cognition.l2_cognitive_intent.urgency}</div>
              </div>
              <div className="p-3 bg-pink-50 rounded-xl">
                <div className="text-[10px] text-pink-500 mb-1">L3 情绪负荷</div>
                <div className="text-lg font-bold text-pink-700">{result.cognition.l3_emotion_cognitive_load.emotionLabel}</div>
                <div className="text-xs text-pink-500">负荷: {Math.round(result.cognition.l3_emotion_cognitive_load.cognitiveLoad * 100)}%</div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
              🤖 {result.cognition.meta.summary}
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700">
              💡 {result.cognition.meta.suggestion}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
