"use client"
import { useState, useCallback, useEffect } from "react"

interface NicheCandidate {
  niche: string
  confidence: number
  reason: string
}

interface AnalysisResult {
  nicheCandidates: NicheCandidate[]
  contentStyle: string[]
  audience: string
  contentTags: string[]
  contentSamples: string[]
  accountExists: boolean
  searchResultsCount: number
  message: string
}

const ANALYSIS_KEY = "jiying_account_analysis"

export default function LaunchPage() {
  const [phase, setPhase] = useState<"scanning" | "result">("scanning")
  const [progress, setProgress] = useState(0)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [selectedNiche, setSelectedNiche] = useState("")
  const [error, setError] = useState("")

  const runAnalysis = useCallback(async () => {
    const accounts: any[] = (() => { try { return JSON.parse(localStorage.getItem("sijian_bound_accounts") || "[]") } catch { return [] } })()
    if (accounts.length === 0) { setError("尚未绑定账号"); setPhase("result"); return }
    const account = accounts.find((a: any) => a.verified && a.paid) || accounts[0]
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch("/api/account/analyze", {
        signal: controller.signal, method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: account.platformName, profileUrl: account.profileUrl, nickname: account.nickname }),
      })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        if (data.verified) {
          // 保存完整分析结果（含内容样本）
          localStorage.setItem(ANALYSIS_KEY, JSON.stringify(data))
          setAnalysis(data)
        } else { setError(data.error || "分析失败") }
      } else { setError("服务不可用") }
    } catch { setError("分析超时") }
    setPhase("result")
  }, [])

  useEffect(() => {
    const pt = setInterval(() => setProgress(p => p >= 100 ? 100 : p + 1.5), 60)
    const ht = setTimeout(() => { clearInterval(pt); setProgress(100); setPhase("result") }, 5000)
    runAnalysis()
    return () => { clearInterval(pt); clearTimeout(ht) }
  }, [])

  const handleConfirm = () => {
    if (!selectedNiche) return
    // 写入专用 key + 全页面刷新，不再读任何其他 localStorage
    localStorage.setItem("jiying_niche_redirect", selectedNiche)
    document.location.replace("/jiying/daily-content")
  }

  // 扫描阶段
  if (phase === "scanning") {
    return (
      <div className="fixed inset-0 z-50 bg-[#070b17] flex flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-6xl animate-bounce">🚀</div>
          <h1 className="text-xl font-bold text-white/90">AI 智能启动</h1>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/30"><span>分析账号内容...</span><span>{Math.round(progress)}%</span></div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </div>
    )
  }

  const candidates = analysis?.nicheCandidates || []

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h1 className="text-xl font-bold text-[#E8E8F0]">选择你的内容赛道</h1>
        <p className="text-sm text-[#9898B0] mt-1">根据账号分析结果，推荐以下方向</p>
      </div>

      {error && <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>}

      {/* Top 3 赛道候选 */}
      {candidates.length > 0 ? (
        <div className="space-y-3">
          {candidates.map((c, i) => {
            const colors = [
              { border: "border-[#F59E0B]/30", bg: "bg-[#F59E0B]/5", ring: "ring-[#F59E0B]" },
              { border: "border-blue-500/20", bg: "bg-blue-500/5", ring: "ring-blue-500" },
              { border: "border-green-500/20", bg: "bg-green-500/5", ring: "ring-green-500" },
            ]
            const badges = ["🥇 最匹配", "🥈 其次", "🥉 候选"]
            const color = colors[i] || colors[2]
            return (
              <div key={i}
                onClick={() => setSelectedNiche(c.niche)}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  selectedNiche === c.niche
                    ? `${color.bg} ${color.border} ring-2 ${color.ring}`
                    : "bg-[#1A1A2E] border-white/[0.06] hover:border-white/20"
                }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    i === 0 ? "bg-[#F59E0B]/15" : i === 1 ? "bg-blue-500/15" : "bg-green-500/15"
                  }`}>{i === 0 ? "🔥" : i === 1 ? "💡" : "📌"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{c.niche}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                        c.confidence >= 0.6 ? "bg-green-500/15 text-green-400" : c.confidence >= 0.3 ? "bg-amber-500/15 text-amber-400" : "bg-gray-500/15 text-gray-400"
                      }`}>置信度 {Math.round(c.confidence * 100)}%</span>
                      {selectedNiche === c.niche && <span className="text-[10px] text-[#F59E0B]">✓ 已选择</span>}
                    </div>
                    <p className="text-xs text-white/40 mt-1">{c.reason || ""}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass rounded-2xl p-5">
          <div className="text-center mb-4">
            <div className="text-xs text-amber-400/80">分析结果暂未返回赛道数据，请手动选择</div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {["程序开发","金融投资","科技","知识付费","自媒体运营","美食","美妆","穿搭","数码","教育","生活","健康","旅行","商业财经","设计创意"].map(n => (
              <button key={n} onClick={() => setSelectedNiche(n)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedNiche === n ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]" : "border-white/[0.06] text-white/40 hover:text-white/60"}`}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {/* 风格/受众信息 */}
      {analysis && (
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-white/30 font-medium mb-3">📊 账号分析详情</div>
          <div className="bg-[#0C0C14] rounded-xl p-4 space-y-3">
            {analysis.contentStyle && analysis.contentStyle[0] !== "待分析" && (
              <div><div className="text-[10px] text-white/40 mb-1">🎨 内容风格</div><div className="flex gap-1.5">{analysis.contentStyle.map((s: string) => <span key={s} className="px-2 py-0.5 text-[9px] rounded-full bg-[#F59E0B]/10 text-[#F59E0B]/70">{s}</span>)}</div></div>
            )}
            {analysis.audience && analysis.audience !== "待分析" && (
              <div><div className="text-[10px] text-white/40 mb-1">👥 目标受众</div><p className="text-[11px] text-white/60">{analysis.audience}</p></div>
            )}
            {analysis.contentTags && analysis.contentTags.length > 0 && (
              <div><div className="text-[10px] text-white/40 mb-1">🏷️ 标签</div><div className="flex flex-wrap gap-1">{analysis.contentTags.map((t: string) => <span key={t} className="text-[9px] text-[#F59E0B]/50">#{t}</span>)}</div></div>
            )}
          </div>
        </div>
      )}

      {/* 确认按钮 */}
      <div className="flex justify-center">
        <button onClick={handleConfirm} disabled={!selectedNiche}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40 transition-all">
          {selectedNiche ? `✅ 确认：${selectedNiche} → 开始每日内容生成` : "请选择一个赛道"}
        </button>
      </div>
    </div>
  )
}
