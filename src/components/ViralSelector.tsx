"use client"

import { useState, useCallback } from "react"
import { buildRewritePrompt, buildDeconstructPromptForSelection, type ViralTemplate, type ViralCandidate } from "@/lib/prompt-engine"

interface ViralSelectorProps {
  niche: string
  platform: string
  userContentSamples: string[]
  onTemplateReady: (template: ViralTemplate, rewrittenPrompt: string) => void
  onClose: () => void
}

export default function ViralSelector({ niche, platform, userContentSamples, onTemplateReady, onClose }: ViralSelectorProps) {
  const [keyword, setKeyword] = useState(niche)
  const [searching, setSearching] = useState(false)
  const [candidates, setCandidates] = useState<ViralCandidate[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [deconstructing, setDeconstructing] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // 搜索爆款
  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return
    setSearching(true)
    setError("")
    setCandidates([])
    setSelectedIdx(null)
    setMessage("")
    try {
      const res = await fetch("/api/viral/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, keyword: keyword.trim(), platform }),
      })
      const data = await res.json()
      if (data.candidates?.length > 0) {
        setCandidates(data.candidates)
        setMessage(data.message || "")
      } else {
        setError(data.message || "未找到相关内容，试试其他关键词")
      }
    } catch { setError("搜索失败") }
    setSearching(false)
  }, [keyword, niche, platform])

  // 选择爆款 → 拆解 → 改写
  const handleSelect = useCallback(async (idx: number) => {
    setSelectedIdx(idx)
    setDeconstructing(true)
    try {
      const selected = candidates[idx]
      // 先尝试用 DeepSeek 拆解
      const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_KEY || ""}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "你只输出JSON，不要任何其他文字。" },
            { role: "user", content: buildDeconstructPromptForSelection(selected) },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      })

      let template: ViralTemplate | null = null
      if (dsRes.ok) {
        const dsData = await dsRes.json()
        const content = dsData.choices?.[0]?.message?.content || ""
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as ViralTemplate
          parsed.sourceTitle = selected.title
          parsed.sourceLikes = selected.estimatedLikes
          template = parsed
        }
      }

      if (!template) {
        // 兜底拆解
        template = {
          hookStyle: "反常识/悬念开篇",
          scriptStructure: "问题→解决方案→案例→总结",
          pacing: "前3秒钩子，中间递进",
          emotionalCurve: "好奇→信任→行动",
          conversionTactic: "引导评论+收藏",
          visualStyle: "高清实拍/图文结合",
          keywords: [niche, platform, "教程", "干货"],
          sourceTitle: selected.title,
          sourceLikes: selected.estimatedLikes,
        }
      }

      // 生成改写 prompt
      const rewritePrompt = buildRewritePrompt(userContentSamples, template, niche, platform)
      onTemplateReady(template, rewritePrompt)
    } catch {}
    setDeconstructing(false)
  }, [candidates, niche, platform, userContentSamples, onTemplateReady])

  // 热度标签
  const getHotLabel = (likes: number): { text: string; color: string } => {
    if (likes >= 10000) return { text: `🔥 ${(likes / 10000).toFixed(1)}万`, color: "text-red-400 bg-red-500/10 border-red-500/20" }
    if (likes >= 5000) return { text: `💥 ${Math.round(likes / 1000)}k`, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" }
    if (likes >= 1000) return { text: `👍 ${Math.round(likes / 1000)}k`, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
    return { text: `📈 ${likes}`, color: "text-gray-400 bg-gray-500/10 border-gray-500/20" }
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* 顶栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span className="text-sm font-medium text-white/70">爆款参考 · {platform}</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-sm">✕</button>
      </div>

      {/* 搜索 */}
      <div className="flex gap-2">
        <input value={keyword} onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder={`在${platform}搜索 "${niche}" 同类爆款...`}
          className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#0C0C14] border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
        <button onClick={handleSearch} disabled={searching || !keyword.trim()}
          className="px-4 py-1.5 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40">
          {searching ? "🔄" : "🔍 搜索"}
        </button>
      </div>

      {/* 状态 */}
      {message && <div className="text-[10px] text-[#F59E0B]/60">{message}</div>}
      {error && <div className="text-[10px] text-red-400">{error}</div>}
      {searching && <div className="text-center py-4 text-[10px] text-white/30 animate-pulse">搜索中...</div>}

      {/* 搜索结果列表 */}
      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-white/30 font-medium">
            推荐以下爆款结构（按热度排序{selectedIdx !== null ? "· 已选" : "· 请选择"})
          </div>
          {candidates.map((c, i) => {
            const label = getHotLabel(c.estimatedLikes)
            return (
              <div key={i}
                onClick={() => !deconstructing && handleSelect(i)}
                className={`rounded-xl border p-3 cursor-pointer transition-all ${
                  selectedIdx === i
                    ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 ring-1 ring-[#F59E0B]/20"
                    : "bg-[#0C0C14] border-white/[0.06] hover:border-white/20"
                } ${deconstructing ? "opacity-60 pointer-events-none" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/80 font-medium line-clamp-1">{c.title}</div>
                    <div className="text-[9px] text-white/30 mt-0.5 line-clamp-1">{c.description.slice(0, 80)}</div>
                  </div>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] border ${label.color}`}>{label.text}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[8px] text-white/20">
                  <span>📱 {c.source || platform}</span>
                  <span>💬 {c.estimatedShares} 转发</span>
                  <span className="flex-1 text-right">{selectedIdx === i ? "✅ 已选择·拆解中..." : "点击选择"}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 拆解中 */}
      {deconstructing && (
        <div className="text-center py-4">
          <span className="inline-block text-lg animate-spin">⚙️</span>
          <p className="text-[10px] text-white/40 mt-2">正在拆解爆款结构并改写...</p>
        </div>
      )}
    </div>
  )
}
