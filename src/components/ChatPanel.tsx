"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ChatMessage } from "@/lib/types"
import LatexRenderer from "@/components/LatexRenderer"

interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (content: string) => void
  onFileSelect: (file: File) => void
  loading: boolean
}

export default function ChatPanel({
  messages,
  onSend,
  onFileSelect,
  loading,
}: ChatPanelProps) {
  const [input, setInput] = useState("")
  const [pastePreview, setPastePreview] = useState<string | null>(null)
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

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center mt-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#5b5f97]/8 to-[#8b7e74]/8 flex items-center justify-center">
              <span className="text-2xl opacity-40">✦</span>
            </div>
            <p className="text-[15px] font-medium text-gray-500">
              说出你的想法，我来陪你想
            </p>
            <p className="text-[13px] text-gray-400 mt-1.5 leading-relaxed">
              AI 不会直接给答案——它会先问你"你怎么看？"
            </p>
            <p className="text-[12px] text-gray-300 mt-2">
              Ctrl+V 可直接粘贴图片
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

      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="shrink-0 px-4 py-3 pb-5 border-t border-[#e8e5df] bg-white/60 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          {/* 上传按钮 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all disabled:opacity-30"
            title="上传图片/文件 (支持图片、PDF、文档)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.webm"
            onChange={handleFileChange}
            className="hidden"
          />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说你的想法……  AI 回复中也可以继续输入"
            rows={1}
            className="flex-1 resize-none rounded-2xl input-light px-4 py-2.5 text-[14px]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 rounded-2xl btn-primary px-5 py-2.5 text-[14px] font-medium disabled:opacity-40"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  )
}
