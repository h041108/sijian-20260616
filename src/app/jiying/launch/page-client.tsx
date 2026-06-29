"use client"
import { useState, useCallback, useEffect } from "react"
import Link from "next/link"

interface AccountBind {
  platformId: string; platformName: string; icon: string; nickname: string
  profileUrl: string; verified: boolean; paid: boolean
}

interface AnalysisResult {
  niche: string; nicheConfidence: number; contentStyle: string[]
  audience: string; contentTags: string[]
  accountExists: boolean; searchResultsCount: number; message: string
}

const ANALYSIS_KEY = "jiying_account_analysis"

export default function LaunchPage() {
  const [phase, setPhase] = useState<"scanning" | "result">(() => {
    try { const c = JSON.parse(localStorage.getItem(ANALYSIS_KEY) || "{}"); if (c.niche && c.niche !== "待确认") return "result" } catch {}
    return "scanning"
  })
  const [progress, setProgress] = useState(0)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => {
    try { const c = JSON.parse(localStorage.getItem(ANALYSIS_KEY) || "{}"); if (c.niche) return c as AnalysisResult } catch {}
    return null
  })
  const [confirmedNiche, setConfirmedNiche] = useState(() => {
    try { const c = JSON.parse(localStorage.getItem(ANALYSIS_KEY) || "{}"); return c.niche || "" } catch { return "" }
  })
  const [error, setError] = useState("")
  const [editingNiche, setEditingNiche] = useState(false)
  const [nicheInput, setNicheInput] = useState("")

  const NICHE_LIST = ["美食", "美妆", "穿搭", "数码", "教育", "生活", "健康", "母婴", "旅行", "家居", "宠物", "汽车", "游戏", "影视", "科技", "健身", "音乐", "摄影", "手工", "园艺", "金融投资", "程序开发", "自媒体运营", "知识付费"]

  const runAnalysis = useCallback(async () => {
    const accounts: AccountBind[] = (() => { try { return JSON.parse(localStorage.getItem("sijian_bound_accounts") || "[]") } catch { return [] } })()
    if (accounts.length === 0) { setError("尚未绑定账号"); setPhase("result"); return }
    const account = accounts.find(a => a.verified && a.paid) || accounts[0]
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
          const result = {
            niche: data.niche || "待确认", nicheConfidence: data.nicheConfidence || 0,
            contentStyle: data.contentStyle || ["待分析"], audience: data.audience || "待分析",
            contentTags: data.contentTags || [], contentSamples: data.contentSamples || [],
            accountExists: data.accountExists || false,
            searchResultsCount: data.searchResultsCount || 0, message: data.message || "",
          }
          // 只存分析结果（含内容样本、风格等），不设 niche 值
          // niche 必须由用户手动确认后才能生效
          localStorage.setItem(ANALYSIS_KEY, JSON.stringify(result))
          setAnalysis(result)
          setConfirmedNiche("") // 用户必须手动选择赛道
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

  const handleGoDaily = () => {
    // 从 localStorage 直接读取（绕过 React state 闭包）
    let niche = ""
    try {
      const saved = JSON.parse(localStorage.getItem(ANALYSIS_KEY) || "{}")
      if (saved.niche && saved.niche !== "待确认") niche = saved.niche
    } catch {}
    if (!niche) niche = confirmedNiche || analysis?.niche || ""
    // 写入专用 key + 全页面刷新
    if (niche) localStorage.setItem("jiying_niche_redirect", niche)
    document.location.replace("/jiying/daily-content")
  }

  if (phase === "scanning") {
    return (
      <div className="fixed inset-0 z-50 bg-[#070b17] flex flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-6xl animate-bounce">🚀</div>
          <h1 className="text-xl font-bold text-white/90">AI智能启动</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3"><span className="text-3xl">🎉</span>
          <div><h1 className="text-lg font-bold text-white/90">账号分析完成</h1>
            <p className="text-xs text-white/30 mt-0.5">{analysis ? `赛道: ${confirmedNiche || analysis.niche}` : ""}</p></div></div>
      </div>

      {error && <div className="glass rounded-2xl p-4 border-red-500/20"><div className="text-xs text-red-400">{error}</div></div>}

      {analysis && (
        <div className="glass rounded-2xl p-5 border-[#F59E0B]/15">
          <div className="bg-[#0C0C14] rounded-xl p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">🎯 内容赛道</span>
                <button onClick={() => { setNicheInput(confirmedNiche || analysis.niche); setEditingNiche(true) }}
                  className="text-[9px] text-white/30 hover:text-white/50">✏️ 修改</button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-white">{confirmedNiche || analysis.niche}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${analysis.nicheConfidence >= 0.6 ? "bg-green-500/15 text-green-400" : analysis.nicheConfidence >= 0.3 ? "bg-amber-500/15 text-amber-400" : "bg-gray-500/15 text-gray-400"}`}>
                  置信度 {Math.round(analysis.nicheConfidence * 100)}%
                </span>
              </div>
            </div>
            {analysis.contentStyle[0] !== "待分析" && <div><div className="text-[10px] text-white/40 mb-1">🎨 风格</div><div className="flex gap-1.5">{analysis.contentStyle.map(s => <span key={s} className="px-2 py-0.5 text-[9px] rounded-full bg-[#F59E0B]/10 text-[#F59E0B]/70">{s}</span>)}</div></div>}
            {analysis.audience !== "待分析" && <div><div className="text-[10px] text-white/40 mb-1">👥 受众</div><p className="text-[11px] text-white/60">{analysis.audience}</p></div>}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button onClick={handleGoDaily}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold shadow-lg cursor-pointer">
          📋 开始每日内容生成
        </button>
        <Link href="/jiying/manga" className="px-6 py-2.5 rounded-xl border border-white/[0.08] text-white/40 hover:text-white text-sm transition-all">🎬 进入影片工厂</Link>
      </div>
    </div>
  )
}
