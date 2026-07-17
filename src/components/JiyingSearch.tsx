"use client"

import { useState, useEffect, useRef } from "react"

interface SearchResult {
  id: string
  type: "media" | "template" | "work"
  title: string
  description: string
  url: string
}

const DEMO_RESULTS: SearchResult[] = [
  { id: "s1", type: "media", title: "冬日养生汤封面", description: "素材库 \u00b7 图片", url: "/jiying/media-library" },
  { id: "s2", type: "template", title: "生活技巧 \u00b7 3秒钩子模板", description: "模板 \u00b7 短视频", url: "/jiying/agents" },
  { id: "s3", type: "work", title: "2026夏季穿搭指南", description: "作品展示 \u00b7 已发布", url: "/jiying/portfolio" },
  { id: "s4", type: "media", title: "产品开箱实拍", description: "素材库 \u00b7 视频", url: "/jiying/media-library" },
  { id: "s5", type: "template", title: "美食 Vlog 开头模板", description: "模板 \u00b7 短视频", url: "/jiying/agents" },
  { id: "s6", type: "media", title: "夏日饮品制作", description: "素材库 \u00b7 图片", url: "/jiying/media-library" },
  { id: "s7", type: "work", title: "2026秋季新品发布", description: "作品展示 \u00b7 草稿", url: "/jiying/portfolio" },
]

const TYPE_LABELS: Record<string, string> = {
  media: "素材",
  template: "模板",
  work: "作品",
}

export default function JiyingSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>(DEMO_RESULTS.slice(0, 3))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults(DEMO_RESULTS.slice(0, 3)); return }
    const q = query.toLowerCase()
    setResults(DEMO_RESULTS.filter(r =>
      r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    ))
  }, [query])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0C0C14] text-[#5A5A72] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8 text-[10px] border border-[#2A2A38] transition-all"
        title="搜索 (Ctrl+K)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="text-[#5A5A72]">搜索</span>
        <kbd className="hidden lg:inline text-[8px] text-[#3A3A52] bg-[#0C0C14] px-1 py-0.5 rounded border border-[#2A2A38]">\u2318K</kbd>
      </button>

      <button
        onClick={() => setOpen(true)}
        className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[#0C0C14] text-[#9898B0] hover:text-[#FBBF24]"
        title="搜索"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[2147483647] flex items-start justify-center pt-[15vh] p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-[#1A1A2E] rounded-2xl shadow-2xl shadow-black/40 border border-[#2A2A38] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A38]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索素材、模板、作品..."
                className="flex-1 bg-transparent text-sm text-[#E8E8F0] placeholder-[#5A5A72] focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[#5A5A72] hover:text-[#9898B0] text-xs">\u2715</button>
              )}
              <kbd className="text-[10px] text-[#5A5A72] bg-[#0C0C14] px-1.5 py-0.5 rounded border border-[#2A2A38]">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-3xl mb-2 opacity-30">\ud83d\udd0d</div>
                  <p className="text-xs text-[#5A5A72]">未找到 &ldquo;{query}&rdquo; 相关内容</p>
                </div>
              ) : (
                results.map(r => (
                  <a key={r.id} href={r.url}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F59E0B]/5 border-b border-[#2A2A38]/50 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F59E0B]/10 text-xs shrink-0">
                      {r.type === "media" ? "\ud83d\udcc1" : r.type === "template" ? "\ud83d\udcc4" : "\ud83d\uddbc\ufe0f"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#E8E8F0] truncate">{r.title}</div>
                      <div className="text-[10px] text-[#5A5A72]">{r.description}</div>
                    </div>
                    <span className="text-[10px] text-[#F59E0B]/60 bg-[#F59E0B]/8 px-1.5 py-0.5 rounded">{TYPE_LABELS[r.type]}</span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
