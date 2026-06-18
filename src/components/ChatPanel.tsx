"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ChatMessage, MindNode } from "@/lib/types"
import LatexRenderer from "@/components/LatexRenderer"
import { detectThinkingLines, getLineInfo } from "@/lib/thinking-lines"
import type { ThinkingLineId } from "@/lib/thinking-lines"

// 框架类型 → 思维线颜色
const FRAME_COLORS: Record<string, string> = {
  tree: "#4C51BF", network: "#E53E3E", helix: "#805AD5", strata: "#D53F8C",
  orbital: "#319795", pipeline: "#38A169", lens: "#00B5D8", cycle: "#ED8936",
  spectrum: "#DD6B20", matrix: "#D69E2E", diffusion: "#3182CE",
}

interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (content: string, imageData?: string) => void
  onFileSelect: (file: File) => void
  loading: boolean
  onToggleDrawer?: () => void
  nodesCount?: number
  mindFrame?: string
  extraToolbar?: React.ReactNode
  onOpenVideoFactory?: () => void
}

const FRAME_LABELS: Record<string, string> = {
  tree: "🌳 层级", network: "🕸️ 网络", helix: "🧬 螺旋",
  strata: "📐 分层", orbital: "🪐 轨道", pipeline: "🔗 流程",
  lens: "🔍 透镜", cycle: "🔄 循环", spectrum: "🌈 光谱",
  matrix: "📊 矩阵", diffusion: "💧 扩散",
}

export default function ChatPanel({
  messages, onSend, onFileSelect, loading,
  onToggleDrawer, nodesCount, mindFrame, extraToolbar,
  onOpenVideoFactory,
}: ChatPanelProps) {
  const [input, setInput] = useState("")
  const [pastePreview, setPastePreview] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null)
  const [liveThinking, setLiveThinking] = useState<{ lineId: string; name: string; icon: string; color: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── 即时思维检测 — 300ms 防抖，零 API 调用 ──
  useEffect(() => {
    if (!input || input.trim().length < 2) { setLiveThinking(null); return }
    const timer = setTimeout(() => {
      const lines = detectThinkingLines(input)
      if (lines.length > 0) {
        const top = getLineInfo(lines[0].lineId as ThinkingLineId)
        if (top) setLiveThinking({ lineId: top.id, name: top.name, icon: top.icon, color: top.color })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [input])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // ── 全局粘贴监听：捕获剪切板中的图片 ──────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handlePaste = (e: ClipboardEvent) => {
      // 如果焦点在 textarea/input 中且粘贴的是文本，不拦截
      const target = e.target as HTMLElement
      const isInput = target.tagName === "TEXTAREA" || target.tagName === "INPUT"
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (!blob) continue

          const reader = new FileReader()
          reader.onload = () => {
            setPendingImage(reader.result as string)
            setPastePreview(reader.result as string)
          }
          reader.readAsDataURL(blob)
          return
        }
      }

      // 如果是文本粘贴在非输入区域，聚焦到输入框
      if (!isInput && items.length === 1 && items[0].type === "text/plain") {
        // 不拦截，让浏览器默认行为
      }
    }

    el.addEventListener("paste", handlePaste)
    return () => el.removeEventListener("paste", handlePaste)
  }, [onFileSelect])

  // 3秒后自动清除粘贴预览
  useEffect(() => {
    if (!pastePreview) return
    const t = setTimeout(() => setPastePreview(null), 3000)
    return () => clearTimeout(t)
  }, [pastePreview])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || loading) return
      onSend(input.trim(), pendingImage || undefined)
      setInput("")
      setPendingImage(null)
      setPastePreview(null)
    },
    [input, loading, onSend, pendingImage],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    },
    [handleSubmit],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileSelect(file)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [onFileSelect],
  )

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      {/* 粘贴预览提示 */}
      {pastePreview && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
          <span>📋 图片已粘贴</span>
          <span className="text-white/50">正在分析……</span>
        </div>
      )}

      {/* 消息区 — 有消息时滚动，无消息时弹性撑开以便输入框居中 */}
      <div className={`overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar ${messages.length === 0 ? "flex-1 flex flex-col justify-center items-center" : "flex-1"}`}>
        {messages.length === 0 && <ThinkingDiary />}

        {messages.map((msg) => {
          const hasMindSpace = msg.role === "assistant" && msg.mindSpace?.nodes && msg.mindSpace.nodes.length > 0
          const frameType = msg.mindSpace?.frameType || "tree"
          const lineColor = FRAME_COLORS[frameType] || "#6366F1"
          const isExpanded = expandedMsgId === msg.id

          return (
            <div key={msg.id}
              className={`flex animate-fade-in ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`relative ${msg.role === "assistant" ? "flex items-stretch gap-2 max-w-[88%]" : "max-w-[85%]"}`}>
                {/* 彩色思维线 — AI 消息左侧 */}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => setExpandedMsgId(isExpanded ? null : msg.id)}
                    className={`shrink-0 w-[3px] rounded-full transition-all cursor-pointer ${
                      hasMindSpace ? "hover:w-[5px]" : ""
                    }`}
                    style={{ backgroundColor: hasMindSpace ? lineColor : "#e5e7eb" }}
                    title={hasMindSpace ? `思维框架: ${FRAME_LABELS[frameType]} · 点击展开节点` : ""}
                  />
                )}

                <div className="flex-1 min-w-0">
                  {/* 气泡 */}
                  {msg.role === "user" ? (
                    <div className="bubble-user px-4 py-2.5 text-[14px] leading-relaxed">
                      <LatexRenderer text={msg.content} />
                    </div>
                  ) : (
                    <>
                      {/* R1 推理过程 — 可折叠 */}
                      {(msg as any).reasoning && (msg as any).reasoning.length > 20 && (
                        <div className="mb-1">
                          <button
                            onClick={() => setExpandedMsgId(isExpanded ? null : msg.id + "_reasoning")}
                            className="text-[10px] text-purple-500 hover:text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>🧠</span> AI 思考过程 {(expandedMsgId === msg.id + "_reasoning") ? "▾" : "▸"}
                          </button>
                          {(expandedMsgId === msg.id + "_reasoning") && (
                            <div className="mt-1 p-2.5 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                              {(msg as any).reasoning}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="bubble-ai px-4 py-2.5 text-[14px] leading-relaxed">
                        <LatexRenderer text={msg.content} />
                      </div>
                      {/* 底部复制工具栏 — 按内容智能分类 */}
                      <CopyBar content={msg.content} />
                    </>
                  )}

                  {/* 内嵌思维节点预览 — 点击思维线展开 */}
                  {isExpanded && hasMindSpace && (
                    <div className="mt-1.5 p-3 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-200 animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lineColor }} />
                        <span className="text-[10px] font-medium text-gray-600">
                          {FRAME_LABELS[frameType]} · {msg.mindSpace!.nodes.length} 节点
                        </span>
                        {onToggleDrawer && (
                          <button onClick={onToggleDrawer}
                            className="ml-auto text-[10px] text-indigo-500 hover:text-indigo-700">
                            展开全图 →
                          </button>
                        )}
                      </div>
                      {/* 微型节点列表 */}
                      <div className="flex flex-wrap gap-1.5">
                        {msg.mindSpace!.nodes.slice(0, 5).map((n: MindNode) => (
                          <span key={n.id}
                            className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full inline-block mr-1 align-middle"
                              style={{ backgroundColor: n.color || lineColor }} />
                            {n.label}
                          </span>
                        ))}
                        {(msg.mindSpace!.nodes.length > 5) && (
                          <span className="text-[10px] text-gray-400">+{msg.mindSpace!.nodes.length - 5} 更多</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bubble-ai px-4 py-3">
              <span className="inline-flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5b5f97]/30 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#5b5f97]/30 animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-2 h-2 rounded-full bg-[#5b5f97]/30 animate-bounce" style={{ animationDelay: "0.3s" }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入区 — 统一钝角圆角容器 */}
      <div className="shrink-0 px-3 sm:px-4 pb-[0.5cm]">
        <form onSubmit={handleSubmit}
          className="rounded-[22px] border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow px-3 py-2.5">
          {/* 第一排：文本框 + 发送 */}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingImage ? "输入文字描述你要识别的内容……" : "说点什么……"}
              rows={1}
              className="flex-1 resize-none bg-transparent px-1 py-2 text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 h-[36px] w-[36px] rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>

          {/* 粘贴/上传的图片预览 */}
          {pendingImage && (
            <div className="px-1 mt-1.5 flex items-start gap-2">
              <img src={pendingImage} alt="预览" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
              <div className="flex-1 text-xs text-gray-400 pt-1">
                图片已粘贴，输入文字后一起发送
                <button type="button" onClick={() => { setPendingImage(null); setPastePreview(null) }}
                  className="ml-2 text-red-400 hover:text-red-600">移除</button>
              </div>
            </div>
          )}

          {/* 分隔线 */}
          <div className="h-px bg-gray-100 mx-1 my-0.5" />

          {/* 第二排：工具 + 状态 + 入口 — 收拢在容器内 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all" title="上传文件">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
              <input ref={fileInputRef} type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.webm"
                onChange={handleFileChange} className="hidden" />

              <button type="button"
                onClick={() => setVoiceActive(!voiceActive)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${voiceActive ? "bg-red-100 text-red-500" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
                title={voiceActive ? "停止录音" : "语音输入"}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>

              {onToggleDrawer && (
                <button type="button" onClick={onToggleDrawer}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded-md transition-all">
                  {liveThinking ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: liveThinking.color }} />
                      <span style={{ color: liveThinking.color }}>{liveThinking.icon} {liveThinking.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: nodesCount && nodesCount > 0 ? "#6366F1" : "#d4d4d4" }} />
                      {nodesCount && nodesCount > 0 && mindFrame
                        ? <span>{FRAME_LABELS[mindFrame] || "思维"} · {nodesCount}概念</span>
                        : <span>暂无概念</span>}
                    </>
                  )}
                </button>
              )}

              {/* 视频工厂入口 */}
              {onOpenVideoFactory && (
                <button type="button" onClick={onOpenVideoFactory}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                  title="视频工厂 — 一句话生成视频">
                  <span className="text-sm">🎬</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-0.5">
              {extraToolbar || (
                <>
                  <a href="/pricing" className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded transition-colors">定价</a>
                  <a href="/b-end" className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded transition-colors">B端</a>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── 智能复制工具栏 — 按内容自动分类 ─────────────

function CopyBar({ content }: { content: string }) {
  const buttons = classifyContent(content)
  if (buttons.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
      {buttons.map((btn, i) => (
        <button key={i}
          onClick={() => { navigator.clipboard.writeText(btn.text); btn.onCopy?.() }}
          className="text-[10px] text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-2 py-0.5 rounded-md border border-gray-150 transition-colors flex items-center gap-1"
          title={btn.hint}>
          <span>{btn.icon}</span>
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  )
}

interface CopyButton {
  icon: string
  label: string
  text: string
  hint: string
  onCopy?: () => void
}

function classifyContent(text: string): CopyButton[] {
  const buttons: CopyButton[] = []

  const hasCode = /```[\s\S]*?```/.test(text)
  const hasTable = /\|.+\|/.test(text) && text.split("\n").filter(l => l.includes("|")).length >= 3
  const hasLinks = /https?:\/\/[^\s)]+/.test(text) || /\[.+\]\(.+\)/.test(text)
  const hasSteps = /第[一二三四五六七八九十\d]+[步条阶段]|步骤\s*\d|^\d+[\.\、]/m.test(text)
  const codeBlockCount = (text.match(/```/g) || []).length / 2

  // Always: copy full text
  buttons.push({ icon: "📋", label: "全文", text, hint: "复制全部内容" })

  // Code blocks: each gets its own button
  if (hasCode) {
    const blocks = text.match(/```(\w*)\n?([\s\S]*?)```/g) || []
    blocks.forEach((block, i) => {
      const lang = block.match(/```(\w*)/)?.[1] || ""
      const code = block.replace(/```\w*\n?/, "").replace(/```$/, "").trim()
      if (code.length > 0) {
        buttons.push({
          icon: "<>", label: `代码${blocks.length > 1 ? i + 1 : ""}${lang ? ` ${lang}` : ""}`,
          text: code, hint: `复制代码块 · ${code.split("\n").length}行`,
        })
      }
    })
  }

  // Text without code: useful when content mixes code and explanation
  if (hasCode) {
    const textOnly = text.replace(/```[\s\S]*?```/g, "").replace(/\n{3,}/g, "\n\n").trim()
    if (textOnly.length > 20) {
      buttons.push({ icon: "📝", label: "纯文字", text: textOnly, hint: "复制不含代码的文字内容" })
    }
  }

  // Structured content detection
  if (hasTable) {
    const tableLines = text.split("\n").filter(l => l.includes("|") && l.trim().length > 5)
    buttons.push({ icon: "📊", label: "表格", text: tableLines.join("\n"), hint: "复制表格数据" })
  }

  if (hasLinks) {
    const links = text.match(/(https?:\/\/[^\s)\]]+)/g) || []
    const uniqueLinks = [...new Set(links)]
    if (uniqueLinks.length > 0 && uniqueLinks.length <= 10) {
      buttons.push({ icon: "🔗", label: `链接(${uniqueLinks.length})`, text: uniqueLinks.join("\n"), hint: "复制所有链接" })
    }
  }

  if (hasSteps) {
    buttons.push({ icon: "📋", label: "要点", text: text, hint: "复制结构化要点" })
  }

  return buttons
}

// ─── 思维日记 — 首页空状态 ─────────────────────────

function ThinkingDiary() {
  const [logs, setLogs] = useState<any[]>([])
  const [mirror, setMirror] = useState<any>(null)

  useEffect(() => {
    const { loadCognitionLogs } = require("@/lib/cognition")
    const { generateThinkingMirror } = require("@/lib/cognition")
    const { getCurrentUser } = require("@/lib/sijian-user")

    const all = loadCognitionLogs()
    const user = getCurrentUser()
    const userId = user?.id || "anonymous"
    const nickname = user?.nickname || "访客"
    setLogs(all.slice(-10).reverse())
    setMirror(generateThinkingMirror(userId, nickname))
  }, [])

  const hasData = logs.length > 0

  return (
    <div className="text-center w-full max-w-2xl mb-8 space-y-6">
      {/* 品牌 */}
      <div>
        <p className="text-[28px] font-extrabold text-gray-900 mb-1 tracking-tight">思见</p>
        <p className="text-sm text-gray-400">所思即所见</p>
      </div>

      {hasData && mirror ? (
        <>
          {/* 最近的思维记录 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">📖 最近的思维轨迹</span>
              <span className="text-[10px] text-gray-400">{mirror.totalMessages} 条记录</span>
            </div>
            <div className="space-y-1.5">
              {logs.slice(0, 5).map((log: any, i: number) => {
                const stateColors: Record<string, string> = {
                  exploring: "#6366F1", focusing: "#22C55E", stuck: "#EF4444",
                  curious: "#F59E0B", building: "#8B5CF6", questioning: "#EC4899", resting: "#6B7280",
                }
                const intentLabels: Record<string, string> = {
                  learning: "学习", solving: "解题", creating: "创造", deciding: "决策",
                  understanding: "理解", venting: "倾诉", exploring: "探索",
                }
                return (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-gray-600 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stateColors[log.state] || "#d4d4d4" }} />
                    <span className="text-gray-500 w-12">{intentLabels[log.intent] || log.intent}</span>
                    <span className="text-gray-300 flex-1 truncate">
                      {log.dominantLines?.slice(0, 2).join(" · ") || ""}
                    </span>
                    <span className="text-gray-300">{new Date(log.timestamp).toLocaleTimeString("zh", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 思维快照 */}
          {mirror.dominantStyles.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-gray-400">你的主导思维：</span>
              {mirror.dominantStyles.slice(0, 3).map((s: any, i: number) => (
                <span key={s.style} className="text-xs px-2.5 py-1 rounded-full border"
                  style={{ borderColor: ["#6366F1","#EC4899","#F59E0B"][i], color: ["#6366F1","#EC4899","#F59E0B"][i] }}>
                  {s.style} · {Math.round(s.percentage)}%
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-base text-gray-500">
            你的专属思维伙伴
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            <span className="px-3 py-1.5 bg-gray-50 rounded-full">提问 · 想法的深度对话</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded-full">反思 · 看清自己的思考方式</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded-full">创造 · 代码/文案/分析/方案</span>
          </div>
          <p className="text-xs text-gray-300">
            开始对话，思见会记录你的思维轨迹
          </p>
        </div>
      )}
    </div>
  )
}
