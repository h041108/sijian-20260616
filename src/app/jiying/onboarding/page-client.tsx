"use client"
import { useState, useEffect, useRef, useCallback } from "react"

interface Platform {
  id: string; name: string; icon: string; url: string; guide: string; needsVPN?: boolean
}

const PLATFORMS: Platform[] = [
  { id: "xiaohongshu", name: "小红书", icon: "📕", url: "https://www.xiaohongshu.com", guide: "官网首页，点击右上角登录→选择注册方式" },
  { id: "douyin", name: "抖音", icon: "🎵", url: "https://www.douyin.com", guide: "点击登录→手机号或邮箱注册" },
  { id: "shipinhao", name: "视频号", icon: "💬", url: "https://channels.weixin.qq.com/login.html", guide: "微信扫码登录后创建" },
  { id: "kuaishou", name: "快手", icon: "📹", url: "https://www.kuaishou.com", guide: "点击注册登录" },
  { id: "bilibili", name: "B站", icon: "📺", url: "https://www.bilibili.com", guide: "点击登录→注册账号" },
  { id: "weixin", name: "微信公众号", icon: "📱", url: "https://mp.weixin.qq.com", guide: "点击立即注册" },
  { id: "twitter", name: "X (Twitter)", icon: "🐦", url: "https://x.com/i/flow/signup", guide: "支持邮箱/手机号注册", needsVPN: true },
  { id: "youtube", name: "YouTube", icon: "▶️", url: "https://www.youtube.com", guide: "Google账号登录即开通", needsVPN: true },
  { id: "tiktok", name: "TikTok", icon: "🎵", url: "https://www.tiktok.com", guide: "需海外手机号或邮箱", needsVPN: true },
  { id: "facebook", name: "Facebook", icon: "👍", url: "https://www.facebook.com/r.php", guide: "直接进入注册页面", needsVPN: true },
  { id: "instagram", name: "Instagram", icon: "📷", url: "https://www.instagram.com", guide: "点击注册填写信息", needsVPN: true },
  { id: "threads", name: "Threads", icon: "🧵", url: "https://www.threads.net", guide: "需Instagram账号登录", needsVPN: true },
  { id: "pinterest", name: "Pinterest", icon: "📌", url: "https://www.pinterest.com", guide: "点击注册创建账号", needsVPN: true },
  { id: "linkedin", name: "LinkedIn", icon: "💼", url: "https://www.linkedin.com", guide: "点击加入填写信息", needsVPN: true },
]

interface PState {
  mode: "idle" | "binding" | "registering"
  profileUrl: string; nickname: string; verifyStatus: "idle" | "verifying" | "passed" | "failed"
  verified: boolean; paid: boolean; regConfirm: boolean
}

export default function OnboardingPage() {
  const [states, setStates] = useState<Record<string, PState>>({})
  const [showJumpPopup, setShowJumpPopup] = useState<string | null>(null)
  const [showBatchPay, setShowBatchPay] = useState(false)
  const [paying, setPaying] = useState(false)
  const [activePay, setActivePay] = useState<string | null>(null)
  const [showAllDone, setShowAllDone] = useState(false)
  const origTitle = useRef("即影AI·账户设立")

  useEffect(() => { origTitle.current = document.title }, [])
  useEffect(() => {
    const h = () => { if (document.visibilityState === "visible") document.title = origTitle.current }
    document.addEventListener("visibilitychange", h)
    return () => document.removeEventListener("visibilitychange", h)
  }, [])

  const gs = (id: string): PState => states[id] || { mode: "idle", profileUrl: "", nickname: "", verifyStatus: "idle", verified: false, paid: false, regConfirm: false }
  const us = (id: string, p: Partial<PState>) => setStates(prev => ({ ...prev, [id]: { ...gs(id), ...p } }))

  // 已有账号：验证
  const handleVerify = async (id: string) => {
    const s = gs(id)
    if (!s.profileUrl.trim() || !s.nickname.trim()) return
    us(id, { verifyStatus: "verifying" })
    await new Promise(r => setTimeout(r, 1200))
    const domainCheck = (url: string) => PLATFORMS.find(p => p.id === id)?.name && url.length > 5
    if (domainCheck(s.profileUrl) && s.nickname.length >= 2) us(id, { verifyStatus: "passed", verified: true })
    else us(id, { verifyStatus: "failed" })
  }

  // 新窗口跳转注册
  const handleJump = (id: string) => {
    const p = PLATFORMS.find(x => x.id === id)
    if (!p) return
    setShowJumpPopup(id)
  }
  const confirmJump = (id: string) => {
    window.open(PLATFORMS.find(x => x.id === id)?.url, "_blank")
    document.title = "↩️ 注册完成后请返回即影"
    us(id, { regConfirm: true })
    setShowJumpPopup(null)
    const handler = () => { if (document.visibilityState === "visible") { document.title = origTitle.current; document.removeEventListener("visibilitychange", handler) } }
    document.addEventListener("visibilitychange", handler)
  }
  const handleRegistered = (id: string) => { us(id, { verified: true }); document.title = origTitle.current }

  // 写入已绑定账号到 localStorage（直接从 PLATFORMS + states 组装）
  const writeBoundAccounts = useCallback(() => {
    const existing = JSON.parse(localStorage.getItem("sijian_bound_accounts") || "[]")
    const bound = PLATFORMS.map(p => {
      const s = states[p.id]
      if (!s?.verified || !s?.paid) return null
      return { platformId: p.id, platformName: p.name, icon: p.icon, nickname: s.nickname, profileUrl: s.profileUrl, verified: true, paid: true }
    }).filter(Boolean)
    if (bound.length > existing.length) localStorage.setItem("sijian_bound_accounts", JSON.stringify(bound))
  }, [states])

  // 每次 state 变化时同步写入 bound accounts（供 launch 页读取）
  useEffect(() => { writeBoundAccounts() }, [writeBoundAccounts])

  // 支付
  const handlePay = async (id: string) => {
    setPaying(true)
    await new Promise(r => setTimeout(r, 1000))
    us(id, { paid: true })
    localStorage.setItem("sijian_paid", "true")
    setPaying(false)
    setActivePay(null)
  }
  const handleBatchPay = async () => {
    setPaying(true)
    await new Promise(r => setTimeout(r, 1500))
    const ns = { ...states }
    Object.keys(ns).forEach(k => { if (ns[k].verified && !ns[k].paid) ns[k] = { ...ns[k], paid: true } })
    setStates(ns)
    localStorage.setItem("sijian_paid", "true")
    setPaying(false)
    setShowBatchPay(false)
  }

  const allP = PLATFORMS.map(p => ({ ...p, s: gs(p.id) }))
  const vCount = allP.filter(x => x.s.verified && x.s.paid).length
  const uCount = allP.filter(x => x.s.verified && !x.s.paid).length
  const allDone = allP.filter(x => x.s.verified).length > 0 && allP.filter(x => x.s.verified).every(x => x.s.paid)

  useEffect(() => {
    if (allDone && vCount > 0) {
      setShowAllDone(true)
      setTimeout(() => window.location.href = "/jiying/launch", 3000)
    }
  }, [allDone, vCount])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

      {/* 全部已激活弹窗 */}
      {showAllDone && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#0f1929] border border-white/[0.06] rounded-3xl p-8 max-w-sm w-full mx-4 text-center space-y-4 shadow-2xl">
            <div className="text-5xl">🎉</div>
            <h3 className="text-lg font-bold text-white">全部账户已激活！</h3>
            <p className="text-xs text-white/40">正在扫描您的账号内容，AI智能启动即将开启</p>
            <div className="w-12 h-12 mx-auto border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-teal-400/60">即将进入AI智能启动...</p>
            <button onClick={() => window.location.href = "/jiying/launch"}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 transition-all">立即进入</button>
          </div>
        </div>
      )}

      {/* 头部 */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-lg shadow-lg shadow-teal-500/15">📢</div>
        <div>
          <h1 className="text-xl font-bold text-white/90">添加您要运营的自媒体账号</h1>
          <p className="text-sm text-white/30 mt-0.5">已有账号可直接绑定，没有账号可跳转注册。每个账户20元。</p>
        </div>
      </div>

      {/* 平台列表 */}
      <div className="space-y-3">
        {PLATFORMS.map(p => {
          const st = gs(p.id)
          const isVerified = st.verified
          const isPaid = st.paid

          return (
            <div key={p.id} className={`rounded-2xl border p-4 transition-all ${isPaid ? "border-teal-500/20 bg-teal-500/5" : isVerified ? "border-teal-500/15 bg-teal-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
              {/* 标题行 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-semibold text-white/80">{p.name}</span>
                  {p.needsVPN && <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/60">翻墙</span>}
                  {isPaid && <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300">✅ 已激活</span>}
                  {isVerified && !isPaid && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300/60">⏳ 待支付</span>}
                </div>
              </div>

              {!isVerified && (
                <div className="space-y-3">
                  {/* 方式一：已有账号绑定 */}
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-[8px] text-teal-400 shrink-0 mt-0.5">B</div>
                    <div className="flex-1 space-y-1.5">
                      <input value={st.profileUrl} onChange={e => us(p.id, { profileUrl: e.target.value, mode: "binding" })}
                        placeholder={`输入您的${p.name}主页链接`}
                        className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-white/70 text-xs py-2" />
                      <input value={st.nickname} onChange={e => us(p.id, { nickname: e.target.value, mode: "binding" })}
                        placeholder={`输入您的账号昵称`}
                        className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-white/70 text-xs py-2" />
                      <button onClick={() => handleVerify(p.id)}
                        disabled={!st.profileUrl.trim() || !st.nickname.trim() || st.verifyStatus === "verifying"}
                        className="w-full py-1.5 rounded-xl text-xs font-medium text-white bg-teal-500/20 border border-teal-500/20 hover:bg-teal-500/30 disabled:opacity-30 transition-all">
                        {st.verifyStatus === "verifying" ? <span className="flex items-center justify-center gap-1"><span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />验证中...</span> : "验证账号"}
                      </button>
                      {st.verifyStatus === "failed" && <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-2 text-[10px] text-red-400"><p>验证失败，请检查链接或昵称是否正确</p></div>}
                      {st.verifyStatus === "passed" && <div className="text-[10px] text-teal-400">✅ 账号验证通过</div>}
                    </div>
                  </div>

                  {/* 分隔 */}
                  <div className="flex items-center gap-2"><div className="flex-1 h-px bg-white/[0.04]" /><span className="text-[9px] text-white/20">或</span><div className="flex-1 h-px bg-white/[0.04]" /></div>

                  {/* 方式二：新注册 */}
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[8px] text-amber-400 shrink-0 mt-0.5">R</div>
                    <div className="flex-1 space-y-1.5">
                      <div className="text-xs text-white/30">注册地址：<span className="text-teal-400/60">{p.url}</span></div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleJump(p.id)} className="flex-1 py-1.5 rounded-xl text-xs font-medium text-white bg-amber-500/15 border border-amber-500/20 hover:bg-amber-500/25 transition-all">跳转注册</button>
                        {st.regConfirm && <button onClick={() => handleRegistered(p.id)} className="flex-1 py-1.5 rounded-xl text-xs font-medium text-white bg-teal-500/20 border border-teal-500/20 hover:bg-teal-500/30 transition-all">✅ 我已注册</button>}
                      </div>
                      <p className="text-[9px] text-white/20">新窗口打开，原页面保留。注册后点击「我已注册」</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 待支付状态 */}
              {isVerified && !isPaid && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-teal-400/60">✅ {st.nickname || p.name} 已确认</span>
                  <button onClick={() => setActivePay(p.id)} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 transition-all">支付 ¥20</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部汇总 */}
      <div className="glass rounded-2xl p-4 sticky bottom-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/50">已选：<strong className="text-white">{vCount + uCount}</strong> 个</span>
            <span className="text-white/50">费用：<strong className="text-teal-400">¥{((vCount + uCount) * 20).toFixed(2)}</strong></span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBatchPay(true)} disabled={uCount === 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-20 transition-all shadow-lg shadow-teal-500/15">
              确认并支付（¥{((vCount + uCount) * 20).toFixed(2)}）
            </button>
          </div>
        </div>
      </div>

      {/* 单账户支付弹窗 */}
      {activePay && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setActivePay(null)}>
          <div className="bg-[#0f1929] border border-white/[0.06] rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-4xl">💳</div>
              <h3 className="text-base font-bold text-white">支付开户费用</h3>
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-white/50"><span>账户</span><span className="text-white">{PLATFORMS.find(x => x.id === activePay)?.name}主号</span></div>
                <div className="flex justify-between border-t border-white/[0.04] pt-2 mt-2"><span className="text-white/50">费用</span><span className="font-bold text-teal-400 text-lg">¥20.00</span></div>
              </div>
              <button onClick={() => handlePay(activePay)} disabled={paying}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-30">💚 支付</button>
              <button onClick={() => setActivePay(null)} className="text-xs text-white/30 hover:text-white/50">稍后支付</button>
            </div>
          </div>
        </div>
      )}

      {/* 批量支付弹窗 */}
      {showBatchPay && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowBatchPay(false)}>
          <div className="bg-[#0f1929] border border-white/[0.06] rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-4xl">💳</div>
              <h3 className="text-base font-bold text-white">批量支付</h3>
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2 text-sm">
                {PLATFORMS.filter(x => gs(x.id).verified && !gs(x.id).paid).map(p => (
                  <div key={p.id} className="flex justify-between text-white/50"><span>{p.icon} {p.name}主号</span><span className="text-teal-400">¥20</span></div>
                ))}
                <div className="flex justify-between border-t border-white/[0.04] pt-2 mt-2 font-bold"><span className="text-white">合计</span><span className="text-teal-400">¥{(uCount * 20).toFixed(2)}</span></div>
              </div>
              <button onClick={handleBatchPay} disabled={paying}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-30">💚 批量支付</button>
              <button onClick={() => setShowBatchPay(false)} className="text-xs text-white/30 hover:text-white/50">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 跳转弹窗 */}
      {showJumpPopup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowJumpPopup(null)}>
          <div className="bg-[#0f1929] border border-white/[0.06] rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="space-y-4">
              <div className="text-center"><div className="text-4xl mb-2">🚀</div><h3 className="text-base font-bold text-white">即将离开即影</h3></div>
              <div className="bg-white/[0.03] rounded-xl p-4 text-xs text-white/40 space-y-1.5">
                <p>✅ 新窗口打开，即影页面不会关闭</p>
                <p>✅ 注册完成后返回，点击「我已注册」</p>
                <p className="text-white/20">注册大约1-2分钟</p>
              </div>
              <button onClick={() => confirmJump(showJumpPopup)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400">继续跳转</button>
              <button onClick={() => setShowJumpPopup(null)} className="w-full py-2 text-xs text-white/30 hover:text-white/50">稍后再说</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
