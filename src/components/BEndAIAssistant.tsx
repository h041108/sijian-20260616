"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import {
  B_END_KNOWLEDGE, ModuleGuide,
  logFeatureRequest, getTopRequestedFeatures,
} from "@/lib/b-end-assistant-kb"

export default function BEndAIAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [chat, setChat] = useState<{ role: "assistant" | "user"; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [topRequests, setTopRequests] = useState<{ module: string; count: number }[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat])

  useEffect(() => {
    setTopRequests(getTopRequestedFeatures())
  }, [chat])

  const modules = useMemo(() => Object.values(B_END_KNOWLEDGE), [])

  const findAnswer = useCallback((query: string): string => {
    const q = query.toLowerCase()

    // Try exact module name match first
    for (const mod of modules) {
      if (q.includes(mod.label) || q.includes(mod.id)) {
        return `${mod.icon} **${mod.label}**\n\n${mod.usage}\n\n📖 使用步骤：\n${mod.steps.map(s => `  ${s}`).join("\n")}${mod.commonQuestions.length > 0 ? "\n\n💡 常见问题：\n" + mod.commonQuestions.map(qa => `Q: ${qa.q}\nA: ${qa.a}`).join("\n\n") : ""}`
      }
    }

    // Try question matching across all modules
    for (const mod of modules) {
      for (const qa of mod.commonQuestions) {
        if (qa.q.includes(q) || q.includes(qa.q.slice(0, 6))) {
          return `${mod.icon} **${mod.label}**\n\nQ: ${qa.q}\nA: ${qa.a}`
        }
      }
    }

    // Keyword matching
    const keywordMap: Record<string, string> = {
      "安全":"ai_capability", "钓鱼":"ai_capability", "prompt":"ai_capability", "判断":"ai_capability", "工作流":"ai_capability",
      "培训":"training", "考核":"training", "记忆":"training", "艾宾浩斯":"training", "复习":"training",
      "班级":"heatmap", "热力":"heatmap", "课堂":"heatmap", "学生":"heatmap",
      "机构":"institution", "SaaS":"institution", "订阅":"institution", "账单":"institution", "品牌":"institution",
      "模型":"orchestrator", "编排":"orchestrator", "路由":"orchestrator",
      "知识图谱":"intelligence", "Token":"intelligence", "评估":"intelligence", "复利":"intelligence",
      "克隆":"strategy", "成熟度":"strategy", "教案":"strategy", "周报":"strategy", "名片":"strategy",
      "视频":"video_factory", "漫剧":"video_factory", "分镜":"video_factory",
      "人格":"persona", "模板":"persona", "API":"persona",
      "知识构建":"knowledge", "解题":"solve", "地铁":"metro", "实验":"experiment",
      "仪表盘":"dashboard", "成员":"members", "报告":"reports", "设置":"settings",
    }
    for (const [kw, modId] of Object.entries(keywordMap)) {
      if (q.includes(kw)) {
        const mod = modules.find(m => m.id === modId)
        if (mod) return `${mod.icon} **${mod.label}**\n\n${mod.usage}\n\n📖 使用步骤：\n${mod.steps.map(s => `  ${s}`).join("\n")}`
      }
    }

    // Can't answer → this is a feature request
    // Find which module they're probably asking about
    let guessedModule = "unknown"
    for (const [kw, modId] of Object.entries(keywordMap)) {
      if (q.includes(kw)) { guessedModule = modId; break }
    }
    logFeatureRequest(query, guessedModule)

    return `🤔 这个问题在当前的帮助文档中还没有收录。\n\n我已经记录下来了——思见团队会根据这个反馈改进该功能。\n\n在此期间，你可以：\n• 试试换个关键词搜索\n• 在左侧导航浏览各个功能模块\n• 直接在页面上操作，每个模块都有操作指引`
  }, [modules])

  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return
    const reply = findAnswer(input.trim())
    setChat(prev => [
      ...prev,
      { role: "user", content: input.trim() },
      { role: "assistant", content: reply },
    ])
    setInput("")
  }, [input, loading, findAnswer])

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl hover:scale-110 transition-all flex items-center justify-center">
        <span className="text-2xl">💬</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-fade-in"
      style={{ maxHeight: "min(600px, 80vh)" }}>
      {/* 头部 */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <div>
            <div className="text-sm font-bold">思见 B端助手</div>
            <div className="text-[10px] opacity-70">问任何功能使用问题</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg">✕</button>
      </div>

      {/* 对话区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {chat.length === 0 && (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 text-center">
              👋 你好！我是思见 B端助手
            </div>
            <div className="text-xs text-gray-400 text-center mb-2">
              你可以问我任何模块的使用方法
            </div>
            {/* 快捷问题 */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                "知识克隆怎么用？",
                "视频工厂如何运作？",
                "AI能力建设有哪些内容？",
                "如何创建班级和管理学生？",
                "L2 Prompt训练有AI反馈吗？",
                "企业AI成熟度诊断怎么看？",
              ].map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => handleSend(), 50) }}
                  className="text-left text-[10px] text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.map((msg, i) => (
          <div key={i} className={`animate-fade-in ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-left">
            <span className="inline-flex gap-1.5 px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0.3s" }} />
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 特征请求摘要 */}
      {topRequests.length > 0 && (
        <div className="shrink-0 px-4 py-1.5 border-t border-gray-100 bg-amber-50/50 flex items-center gap-2 text-[10px] text-amber-600">
          <span>📊</span>
          <span>有待处理反馈:</span>
          {topRequests.slice(0, 2).map(r => (
            <span key={r.module} className="bg-amber-100 px-1.5 py-0.5 rounded">
              {modules.find(m => m.id === r.module)?.label || r.module} ×{r.count}
            </span>
          ))}
        </div>
      )}

      {/* 输入区 */}
      <div className="shrink-0 px-3 py-2 border-t border-gray-100">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="问任何模块的使用问题……"
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
            onKeyDown={e => e.key === "Enter" && handleSend()} />
          <button onClick={handleSend} disabled={!input.trim()}
            className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-medium disabled:opacity-30">
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
