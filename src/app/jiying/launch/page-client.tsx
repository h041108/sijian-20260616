"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useJiyingUser } from "../layout"

interface AccountBind {
  platformId: string
  platformName: string
  icon: string
  nickname: string
  profileUrl: string
  verified: boolean
  paid: boolean
}

interface AnalysisResult {
  niche: string
  nicheConfidence: number
  contentStyle: string[]
  audience: string
  contentTags: string[]
  accountExists: boolean
  searchResultsCount: number
  message: string
}

const ANALYSIS_KEY = "jiying_account_analysis"

export default function LaunchPage() {
  const { user } = useJiyingUser()
  const [phase, setPhase] = useState<"scanning" | "result">(() => {
    // 如果有缓存的分析结果，直接跳过扫描阶段
    try {
      const cached = JSON.parse(localStorage.getItem("jiying_account_analysis") || "{}")
      if (cached.niche && cached.niche !== "待确认") return "result"
    } catch {}
    return "scanning"
  })
  const [progress, setProgress] = useState(0)
  const [scanStep, setScanStep] = useState(0)
  const [accounts] = useState<AccountBind[]>(() => {
    try {
      const raw = localStorage.getItem("sijian_bound_accounts")
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("jiying_account_analysis") || "{}")
      if (cached.niche) return cached as AnalysisResult
    } catch {}
    return null
  })
  const [error, setError] = useState("")
  const [confirmedNiche, setConfirmedNiche] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("jiying_account_analysis") || "{}")
      return cached.niche || ""
    } catch { return "" }
  })
  const [editingNiche, setEditingNiche] = useState(false)
  const [nicheInput, setNicheInput] = useState("")

  const NICHE_LIST = ["美食", "美妆", "穿搭", "数码", "教育", "生活", "健康", "母婴", "旅行", "家居", "宠物", "汽车", "游戏", "影视", "科技", "健身", "音乐", "摄影", "手工", "园艺"]

  // 执行真实分析（最多等5秒，超时自动结束扫描）
  const runAnalysis = useCallback(async () => {
    if (accounts.length === 0) {
      setError("尚未绑定账号，请先完成账户设立")
      setPhase("result")
      return
    }

    const account = accounts.find(a => a.verified && a.paid) || accounts[0]

    // 扫描进度动画
    const stepTimer = setInterval(() => setScanStep(s => Math.min(s + 1, 4)), 800)

    // 超时控制：最多等10秒
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const res = await fetch("/api/account/analyze", {
        signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: account.platformName,
          profileUrl: account.profileUrl,
          nickname: account.nickname,
        }),
      })
      clearTimeout(timeoutId)
      clearInterval(stepTimer)
      setScanStep(4)

      if (res.ok) {
        const data = await res.json()
        if (data.verified) {
          const result: AnalysisResult = {
            niche: data.niche || "待确认",
            nicheConfidence: data.nicheConfidence || 0,
            contentStyle: data.contentStyle || ["待分析"],
            audience: data.audience || "待分析",
            contentTags: data.contentTags || [],
            accountExists: data.accountExists || false,
            searchResultsCount: data.searchResultsCount || 0,
            message: data.message || "",
          }
          setAnalysis(result)
          setConfirmedNiche(result.niche)
          localStorage.setItem(ANALYSIS_KEY, JSON.stringify(result))
        } else {
          setError(data.error || "分析失败")
        }
      } else {
        setError("分析服务暂时不可用")
      }
    } catch (err: any) {
      clearInterval(stepTimer)
      if (err.name === "AbortError") {
        setError("分析超时，已加载缓存数据。可在设置中重试。")
      } else {
        setError("分析服务暂时不可用")
      }
    }
    setPhase("result")
  }, [accounts])

  // 扫描阶段：进度 0→100% 在 5 秒内完成，无论 API 是否返回
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progressTimer); return 100 }
        return p + 1.5
      })
    }, 60)

    // 5秒硬上限：无论 API 是否返回，都结束扫描
    const hardTimeout = setTimeout(() => {
      clearInterval(progressTimer)
      setProgress(100)
      setScanStep(4)
      // 如果没有分析结果，尝试从缓存加载
      if (!analysis) {
        try {
          const cached = JSON.parse(localStorage.getItem("jiying_account_analysis") || "{}")
          if (cached.niche) setConfirmedNiche(cached.niche)
        } catch {}
      }
      setPhase("result")
    }, 5000)

    runAnalysis()

    return () => {
      clearInterval(progressTimer)
      clearTimeout(hardTimeout)
    }
  }, [])

  const handleConfirmNiche = useCallback(() => {
    if (editingNiche) {
      if (nicheInput.trim()) {
        setConfirmedNiche(nicheInput.trim())
        if (analysis) {
          const updated = { ...analysis, niche: nicheInput.trim() }
          setAnalysis(updated)
          localStorage.setItem(ANALYSIS_KEY, JSON.stringify(updated))
        }
      }
      setEditingNiche(false)
    }
  }, [editingNiche, nicheInput, analysis])

  // 扫描阶段
  if (phase === "scanning") {
    const steps = [
      { label: "读取账号信息", done: scanStep >= 1 || progress > 20 },
      { label: "搜索公开内容", done: scanStep >= 2 || progress > 40 },
      { label: "AI 赛道识别", done: scanStep >= 3 || progress > 60 },
      { label: "风格特征分析", done: scanStep >= 4 || progress > 80 },
    ]

    return (
      <div className="fixed inset-0 z-50 bg-[#070b17] flex flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-6xl animate-bounce">🚀</div>
          <h1 className="text-xl font-bold text-white/90">AI智能启动已自动开启</h1>
          {error ? (
            <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/30">
                  <span>正在分析您的账号内容...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {steps.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${s.done ? "bg-white/[0.04] text-white/70" : "text-white/20"}`}>
                    <span>{s.done ? "✅" : "⏳"}</span>
                    <span>{s.label}</span>
                    <span className="ml-auto text-xs">{s.done ? "已完成" : "进行中..."}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // 结果页
  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      {/* 恭喜条 */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎉</span>
          <div>
            <h1 className="text-lg font-bold text-white/90">
              {accounts.filter(a => a.verified && a.paid).length > 0 ? "所有账户已激活" : "账户已就绪"}
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              {analysis ? `已分析 ${accounts.length} 个账号 · ${analysis.searchResultsCount > 0 ? `搜索到 ${analysis.searchResultsCount} 条公开内容` : "已完成基础分析"}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="glass rounded-2xl p-4 border-red-500/20">
          <div className="text-xs text-red-400">{error}</div>
          <button onClick={runAnalysis} className="mt-2 text-[10px] text-[#F59E0B] hover:text-[#FBBF24]">重新分析</button>
        </div>
      )}

      {/* 赛道分析结果 */}
      {analysis && (
        <div className={`glass rounded-2xl p-5 ${analysis.nicheConfidence >= 0.6 ? "border-[#F59E0B]/15" : "border-amber-500/15"}`}>
          <div className="text-xs text-white/30 font-medium mb-3">📊 账号分析报告</div>
          <div className="bg-[#0C0C14] rounded-xl p-4 space-y-3">
            {/* 赛道 */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">🎯 内容赛道</span>
                {editingNiche ? (
                  <div className="flex gap-1">
                    <input value={nicheInput} onChange={e => setNicheInput(e.target.value)}
                      className="w-24 px-2 py-0.5 text-[10px] bg-[#1A1A2E] rounded text-white/80 border border-[#F59E0B]/40 focus:outline-none" />
                    <button onClick={handleConfirmNiche} className="text-[9px] text-[#F59E0B]">确认</button>
                    <button onClick={() => setEditingNiche(false)} className="text-[9px] text-white/30">取消</button>
                  </div>
                ) : (
                  <button onClick={() => { setNicheInput(confirmedNiche || analysis.niche); setEditingNiche(true) }}
                    className="text-[9px] text-white/30 hover:text-white/50">✏️ 修改</button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-white">{confirmedNiche || analysis.niche}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  analysis.nicheConfidence >= 0.6 ? "bg-green-500/15 text-green-400" :
                  analysis.nicheConfidence >= 0.3 ? "bg-amber-500/15 text-amber-400" : "bg-gray-500/15 text-gray-400"
                }`}>
                  置信度 {Math.round(analysis.nicheConfidence * 100)}%
                </span>
              </div>
            </div>

            {/* 内容风格 */}
            {analysis.contentStyle.length > 0 && analysis.contentStyle[0] !== "待分析" && (
              <div>
                <div className="text-[10px] text-white/40 mb-1">🎨 内容风格</div>
                <div className="flex gap-1.5">
                  {analysis.contentStyle.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 text-[9px] rounded-full bg-[#F59E0B]/10 text-[#F59E0B]/70">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 目标受众 */}
            {analysis.audience !== "待分析" && (
              <div>
                <div className="text-[10px] text-white/40 mb-1">👥 目标受众</div>
                <p className="text-[11px] text-white/60">{analysis.audience}</p>
              </div>
            )}

            {/* 内容标签 */}
            {analysis.contentTags.length > 0 && (
              <div>
                <div className="text-[10px] text-white/40 mb-1">🏷️ 内容标签</div>
                <div className="flex flex-wrap gap-1">
                  {analysis.contentTags.map((t, i) => (
                    <span key={i} className="text-[9px] text-[#F59E0B]/50">#{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 搜索提示 */}
            {analysis.message && (
              <div className="text-[9px] text-white/30 mt-1">{analysis.message}</div>
            )}

            {/* 置信度低于 60% 时用户可手动选赛道 */}
            {analysis.nicheConfidence < 0.6 && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <div className="text-[10px] text-white/40 mb-2">🤔 置信度偏低，建议手动确认赛道</div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {NICHE_LIST.map(n => (
                    <button key={n} onClick={() => { setConfirmedNiche(n); if (analysis) { const u = { ...analysis, niche: n }; setAnalysis(u); localStorage.setItem(ANALYSIS_KEY, JSON.stringify(u)) } }}
                      className={`px-2.5 py-1 text-[10px] rounded-full border transition-all ${confirmedNiche === n ? "bg-[#F59E0B]/15 border-[#F59E0B]/25 text-[#F59E0B]" : "border-white/[0.06] text-white/40 hover:text-white/60"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 已绑定的账号 */}
      {accounts.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-white/30 font-medium mb-3">🔗 已绑定账号</div>
          <div className="flex flex-wrap gap-2">
            {accounts.filter(a => a.verified && a.paid).map(a => (
              <div key={a.platformId} className="px-3 py-2 rounded-xl bg-[#0C0C14] border border-white/[0.06] flex items-center gap-2">
                <span>{a.icon}</span>
                <span className="text-xs text-white/60">{a.platformName}</span>
                <span className="text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">已激活</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent 推荐 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs text-white/30 mb-3">🧠 智能路由系统已为您推荐</div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: "📝", name: "文案生成", active: true },
            { icon: "🎨", name: "封面设计", active: true },
            { icon: "🔥", name: "热点追踪", active: true },
            { icon: "🔍", name: "内容分析", active: confirmedNiche ? true : false },
            { icon: "📊", name: "数据看板", active: true },
          ].map((a, i) => (
            <div key={i} className={`rounded-xl p-3 text-center border ${a.active ? "bg-[#F59E0B]/5 border-[#F59E0B]/10" : "bg-white/[0.02] border-white/[0.06]"}`}>
              <div className={`text-xl mb-1 ${a.active ? "" : "opacity-30"}`}>{a.icon}</div>
              <div className={`text-[10px] ${a.active ? "text-white/70" : "text-white/30"}`}>{a.name}</div>
              <div className={`text-[8px] mt-1 ${a.active ? "text-[#F59E0B]/60" : "text-white/10"}`}>{a.active ? "已就绪" : "待开启"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 下一步操作 */}
      <div className="flex gap-3 justify-center">
        <button onClick={() => {
          const final = confirmedNiche || analysis?.niche || ""
          try {
            // 同时存入 sessionStorage 和 localStorage，双重保证
            sessionStorage.setItem('jiying_niche_redirect', final)
            localStorage.setItem('jiying_niche_redirect', final)
          } catch {}
          document.location.replace('/jiying/daily-content')
        }}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold shadow-lg cursor-pointer">
          📋 开始每日内容生成
        </button>
        <Link href="/jiying/manga"
          className="px-6 py-2.5 rounded-xl border border-white/[0.08] text-white/40 hover:text-white text-sm transition-all">
          🎬 进入影片工厂
        </Link>
      </div>
    </div>
  )
}
