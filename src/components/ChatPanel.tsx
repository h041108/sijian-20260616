"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ChatMessage } from "@/lib/types"
import LatexRenderer from "@/components/LatexRenderer"

interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (content: string) => void
  onFileSelect: (file: File) => void
  loading: boolean
  onToggleDrawer?: () => void
  nodesCount?: number
  extraToolbar?: React.ReactNode
}

export default function ChatPanel({
  messages, onSend, onFileSelect, loading,
  onToggleDrawer, nodesCount, extraToolbar,
}: ChatPanelProps) {
  const [input, setInput] = useState("")
  const [pastePreview, setPastePreview] = useState<string | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

          // 生成预览
          const reader = new FileReader()
          reader.onload = () => setPastePreview(reader.result as string)
          reader.readAsDataURL(blob)

          // 传给父组件处理
          onFileSelect(new File([blob], `paste_${Date.now()}.png`, { type: blob.type }))
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
      onSend(input.trim())
      setInput("")
    },
    [input, loading, onSend],
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
        {messages.length === 0 && (
          <div className="text-center w-full max-w-md mb-8">
            <p className="text-2xl font-bold text-gray-800 mb-2">
              有什么我可以帮你的？
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              任何问题、想法、创意——我陪你一起想
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex animate-fade-in ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="relative group max-w-[85%]">
              {msg.role === "user" ? (
                <div className="bubble-user px-4 py-2.5 text-[14px] leading-relaxed">
                  <LatexRenderer text={msg.content} />
                </div>
              ) : (
                <div className="bubble-ai px-4 py-2.5 text-[14px] leading-relaxed">
                  <LatexRenderer text={msg.content} />
                </div>
              )}
              {msg.role === "assistant" && null}
            </div>
          </div>
        ))}

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

      {/* 输入区 — 两排布局 */}
      <div className="shrink-0 border-t border-gray-100 bg-white/80 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]">
        <form onSubmit={handleSubmit} className="px-3 sm:px-4 pt-2.5 pb-1.5">
          {/* 第一排：文本框 + 发送 */}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="说点什么……"
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 h-[42px] w-[42px] rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>

          {/* 第二排：工具图标栏 */}
          <div className="flex items-center justify-between mt-1.5 px-1">
            {/* 左侧工具组 */}
            <div className="flex items-center gap-0.5">
              {/* 上传 */}
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                title="上传文件">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
              <input ref={fileInputRef} type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.webm"
                onChange={handleFileChange} className="hidden" />

              {/* 语音 */}
              <button type="button"
                onClick={() => setVoiceActive(!voiceActive)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${voiceActive ? "bg-red-100 text-red-500" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
                title={voiceActive ? "停止录音" : "语音输入"}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>

              {/* 思维空间 */}
              {onToggleDrawer && (
                <button type="button"
                  onClick={onToggleDrawer}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  title="思维空间">
                  {nodesCount && nodesCount > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: "#6366F1" }}>
                      ◈<span className="text-[10px]">{nodesCount}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">◈</span>
                  )}
                </button>
              )}
            </div>

            {/* 中间分隔 */}
            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* 右侧快捷入口 */}
            <div className="flex items-center gap-0.5">
              {extraToolbar || (
                <>
                  <a href="/pricing" className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded transition-colors">定价</a>
                  <a href="/b-end" className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded transition-colors">B端</a>
                </>
              )}
              <span className="text-[10px] text-gray-300 mx-0.5">·</span>
              <span className="text-[10px] text-gray-400">Ctrl+V 粘贴图片</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
