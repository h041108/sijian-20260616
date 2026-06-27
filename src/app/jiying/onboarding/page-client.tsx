"use client"
import { useState, useEffect, useRef } from "react"
import { validateAccount, getBindingFields, supportsBinding } from "@/lib/account-verify"

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

// 验证状态
type VerifyStatus = "idle" | "verifying" | "passed" | "failed"

// 身份选择
type UserType = "existing" | "new" | null

// 每个平台的状态
interface PlatformState {
  userType: "existing" | "new" | null     // 选择的方式
  profileUrl: string                       // 主页链接
  nickname: string                         // 账号昵称
  verifyStatus: VerifyStatus               // 验证状态
  verified: boolean                        // 最终是否已绑定/已注册
  paid: boolean                            // 是否已支付
  registered: boolean                      // 新用户注册后确认
  showRegConfirm: boolean                  // 显示"我已注册"按钮
}

export default function OnboardingPage() {
  // ─── 状态 ───
  const [globalUserType, setGlobalUserType] = useState<UserType>(null)
  const [states, setStates] = useState<Record<string, PlatformState>>({})
  const [showJumpPopup, setShowJumpPopup] = useState<string | null>(null)
  const [dontRemind, setDontRemind] = useState(false)
  const [showBatchPay, setShowBatchPay] = useState(false)
  const [paying, setPaying] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const origTitle = useRef("即影AI·账户设立")

  // 原始浏览器标题保存
  useEffect(() => {
    origTitle.current = document.title
  }, [])

  // Tab可见性检测 — 用户切回时恢复标题
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === "visible") {
        document.title = origTitle.current
      }
    }
    document.addEventListener("visibilitychange", handle)
    return () => document.removeEventListener("visibilitychange", handle)
  }, [])

  const getState = (id: string): PlatformState => states[id] || {
    userType: null, profileUrl: "", nickname: "", verifyStatus: "idle",
    verified: false, paid: false, registered: false, showRegConfirm: false,
  }

  const updateState = (id: string, patch: Partial<PlatformState>) => {
    setStates(prev => ({
      ...prev,
      [id]: { ...getState(id), ...patch },
    }))
  }

  // ─── 计算 ───
  const allPlatforms = PLATFORMS.map(p => ({ ...p, state: getState(p.id) }))
  const verifiedCount = allPlatforms.filter(p => p.state.verified && p.state.paid).length
  const unpaidVerified = allPlatforms.filter(p => p.state.verified && !p.state.paid).length
  const totalFee = (verifiedCount + unpaidVerified) * 20

  // ─── 路径A：已有账号 验证 ───
  const handleVerify = async (id: string) => {
    const s = getState(id)
    if (!s.profileUrl.trim() || !s.nickname.trim()) return

    updateState(id, { verifyStatus: "verifying" })
    // 模拟验证
    const result = validateAccount(id, s.profileUrl, s.nickname)
    await new Promise(r => setTimeout(r, 800))
    if (result.passed) {
      updateState(id, { verifyStatus: "passed", verified: true })
    } else {
      updateState(id, { verifyStatus: "failed" })
    }
  }

  // ─── 路径B：新用户 跳转注册 ───
  const handleJumpRegister = (id: string) => {
    const platform = PLATFORMS.find(p => p.id === id)
    if (!platform) return

    // 弹窗提醒
    setShowJumpPopup(id)
  }

  const confirmJump = (id: string) => {
    const platform = PLATFORMS.find(p => p.id === id)
    if (!platform) return

    // 新窗口打开
    window.open(platform.url, "_blank")

    // Tab标题改为提醒文字
    document.title = "↩️ 注册完成后请返回即影"

    // 更新状态
    updateState(id, { showRegConfirm: true })
    setActiveTab(id)
    setShowJumpPopup(null)

    // 监听Tab可见性 - 用户切回时恢复标题
    const handler = () => {
      if (document.visibilityState === "visible") {
        document.title = origTitle.current
        document.removeEventListener("visibilitychange", handler)
      }
    }
    document.addEventListener("visibilitychange", handler)
  }

  // ─── 新用户注册完成 点击"我已注册" ───
  const handleRegistered = (id: string) => {
    updateState(id, { verified: true, registered: true, showRegConfirm: false })
    document.title = origTitle.current
  }

  // ─── 支付 ───
  const handleSinglePay = async (id: string) => {
    setPaying(true)
    await new Promise(r => setTimeout(r, 1000))
    updateState(id, { paid: true })
    setPaying(false)
    setActiveTab(null)
  }

  const handleBatchPay = async () => {
    setPaying(true)
    await new Promise(r => setTimeout(r, 1500))
    const newStates = { ...states }
    for (const id of Object.keys(newStates)) {
      if (newStates[id].verified && !newStates[id].paid) {
        newStates[id] = { ...newStates[id], paid: true }
      }
    }
    setStates(newStates)
    setPaying(false)
    setShowBatchPay(false)
  }

  // ─── 身份选择页 ───
  if (!globalUserType) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="text-5xl">📢</div>
          <h1 className="text-2xl font-extrabold text-gray-900">确认您的身份</h1>
          <p className="text-sm text-gray-400">请选择您的情况，我们将为您提供最优路径</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => setGlobalUserType("existing")}
            className="bg-white rounded-2xl border-2 border-indigo-200 p-6 text-left hover:border-indigo-500 hover:shadow-lg transition-all group">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">我已有自媒体账号</h3>
            <p className="text-xs text-gray-400 mb-3">最快3步完成绑定 · 无需离开即影平台</p>
            <span className="text-sm text-indigo-600 font-medium group-hover:gap-2 transition-all">选择此选项 →</span>
          </button>
          <button onClick={() => setGlobalUserType("new")}
            className="bg-white rounded-2xl border-2 border-gray-200 p-6 text-left hover:border-indigo-500 hover:shadow-lg transition-all group">
            <div className="text-4xl mb-3">🆕</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">我是新手，需要注册新账号</h3>
            <p className="text-xs text-gray-400 mb-3">新窗口打开，原页面保留 · 注册完成后自动返回</p>
            <span className="text-sm text-indigo-600 font-medium group-hover:gap-2 transition-all">选择此选项 →</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* 步骤条 */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <a href="/jiying/agents/agent-router" className="hover:text-indigo-600">← 返回</a>
        <span className="text-gray-300">|</span>
        <span className="font-medium text-indigo-600">即影自媒体工厂</span>
        <span className="text-gray-300 mx-1">[步骤 2/3]</span>
        <span className="flex gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="w-3 h-3 rounded-full bg-indigo-600" />
          <span className="w-3 h-3 rounded-full bg-gray-200" />
        </span>
        <span className="ml-auto text-indigo-600 font-medium">✅ 已激活: {verifiedCount}个账户</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">📢</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">请添加您要运营的自媒体账号</h1>
          <p className="text-xs text-gray-400">每个账户需支付20元开户/绑定费用。{globalUserType === "existing" ? "已有账号可直接绑定，无需跳转。" : "新窗口打开注册，即影页面不会关闭。"}</p>
        </div>
        <button onClick={() => setGlobalUserType(null)}
          className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">切换身份</button>
      </div>

      {/* 平台列表 */}
      <div className="space-y-3">
        {PLATFORMS.map(p => {
          const st = getState(p.id)
          const isVerified = st.verified
          const isPaid = st.paid

          return (
            <div key={p.id}
              className={`bg-white rounded-2xl border p-4 transition-all ${isPaid ? "border-green-300 bg-green-50/30" : isVerified ? "border-indigo-300 bg-indigo-50/30" : "border-gray-200"}`}>

              {/* 平台标题行 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-bold text-gray-800">{p.name}</span>
                  {p.needsVPN && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">翻墙</span>}
                  {isPaid && <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">✅ 已激活</span>}
                  {isVerified && !isPaid && <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">⏳ 待支付</span>}
                </div>
              </div>

              {/* 已有账号 - 直接绑定路径 */}
              {(globalUserType === "existing" || st.userType === "existing") && !isVerified && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">推荐</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600">无需跳转</span>
                    <span className="text-[10px] text-gray-400">已有账号，直接绑定</span>
                  </div>
                  <input value={st.profileUrl} onChange={e => updateState(p.id, { profileUrl: e.target.value })}
                    placeholder={`请输入您的${p.name}主页链接`}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input value={st.nickname} onChange={e => updateState(p.id, { nickname: e.target.value })}
                    placeholder={`请输入您的账号昵称`}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => handleVerify(p.id)}
                    disabled={!st.profileUrl.trim() || !st.nickname.trim() || st.verifyStatus === "verifying"}
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400">
                    {st.verifyStatus === "verifying" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        正在验证账号信息，请稍候...
                      </span>
                    ) : "验证账号"}
                  </button>
                  {st.verifyStatus === "failed" && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-xs text-red-700 font-medium">验证失败：未找到该账号</p>
                      <ul className="text-[10px] text-red-600 mt-1 space-y-0.5">
                        <li>• 主页链接不正确，请检查是否完整</li>
                        <li>• 账号昵称与平台不一致</li>
                        <li>• 该平台暂不支持自动验证</li>
                      </ul>
                      <button onClick={() => updateState(p.id, { verifyStatus: "idle" })}
                        className="text-xs text-indigo-600 mt-2 hover:text-indigo-800">重新验证</button>
                    </div>
                  )}
                  {st.verifyStatus === "passed" && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-xs text-green-700 flex items-center gap-2">
                      <span>✅</span>
                      <span>账号「{st.nickname}」验证通过，已加入账户列表</span>
                    </div>
                  )}
                  {st.verifyStatus === "idle" && globalUserType === "existing" && (
                    <div className="flex justify-end">
                      <button onClick={() => { updateState(p.id, { userType: "new" }); setGlobalUserType("new") }}
                        className="text-[10px] text-gray-400 hover:text-indigo-600">还没有账号？改用注册方式</button>
                    </div>
                  )}
                </div>
              )}

              {/* 新用户 - 注册路径 */}
              {(globalUserType === "new" || st.userType === "new") && !isVerified && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">注册</span>
                    <span className="text-[10px] text-gray-400">我是新手，需要注册新账号</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-600">
                      <span className="text-gray-400">官方注册链接：</span>
                      <span className="text-indigo-600">{p.url}</span>
                    </div>
                  </div>
                  <button onClick={() => handleJumpRegister(p.id)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700">
                    点击跳转注册
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">
                    新窗口打开，即影页面不会关闭。注册完成后请关闭新窗口，返回此处。
                  </p>

                  {/* 注册完成后 */}
                  {st.showRegConfirm && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                      <p className="text-xs text-amber-700">已在{globalUserType === "new" ? "新窗口" : "该平台"}完成注册？</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleRegistered(p.id)}
                          className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-medium hover:bg-amber-700">
                          ✅ 我已注册
                        </button>
                        <button className="px-3 py-2 bg-white text-gray-500 rounded-xl text-xs border border-gray-200">
                          稍后注册
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 验证通过后 待支付状态 */}
              {isVerified && !isPaid && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-600">
                    ✅ {st.registered ? "已完成注册" : `账号「${st.nickname || p.name}」已验证`}
                  </span>
                  <button onClick={() => setActiveTab(p.id)}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                    支付 ¥20
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部汇总 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky bottom-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">已选账户：<strong className="text-gray-900">{verifiedCount + unpaidVerified}</strong> 个</span>
            <span className="text-gray-600">预计费用：<strong className="text-indigo-600">¥{totalFee.toFixed(2)}</strong></span>
          </div>
          <div className="flex gap-2">
            <a href="/jiying/agents/agent-router" className="px-4 py-2 bg-white text-gray-600 rounded-xl text-xs border border-gray-200 hover:border-indigo-300">稍后设置</a>
            <button onClick={() => setShowBatchPay(true)}
              disabled={unpaidVerified === 0}
              className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400">
              确认并支付（¥{totalFee.toFixed(2)}）
            </button>
          </div>
        </div>
      </div>

      {/* ─── 单账户支付弹窗 ─── */}
      {activeTab && !showBatchPay && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setActiveTab(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-4xl">💳</div>
              <h3 className="text-base font-bold text-gray-800">支付开户费用</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>账户名称</span>
                  <span className="font-medium text-gray-800">{PLATFORMS.find(p => p.id === activeTab)?.name}主号</span>
                </div>
                <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-2 mt-2">
                  <span>开户费用</span>
                  <span className="font-bold text-indigo-600 text-lg">¥20.00</span>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => handleSinglePay(activeTab)} disabled={paying}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50">💚 微信支付</button>
                <button onClick={() => handleSinglePay(activeTab)} disabled={paying}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50">💙 支付宝</button>
              </div>
              <button onClick={() => setActiveTab(null)} className="text-xs text-gray-400 hover:text-gray-600">稍后支付</button>
              {paying && <p className="text-xs text-indigo-500 animate-pulse">支付处理中...</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── 批量支付弹窗 ─── */}
      {showBatchPay && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowBatchPay(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-4xl">💳</div>
              <h3 className="text-base font-bold text-gray-800">批量支付</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-2 text-sm text-left">
                  {PLATFORMS.filter(p => getState(p.id).verified && !getState(p.id).paid).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-gray-600">
                      <span>{p.icon}</span>
                      <span>{p.name}主号</span>
                      <span className="ml-auto text-indigo-600 font-medium">¥20</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>合计</span>
                  <span className="text-indigo-600">¥{(unpaidVerified * 20).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={handleBatchPay} disabled={paying}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50">💚 微信支付</button>
                <button onClick={handleBatchPay} disabled={paying}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50">💙 支付宝</button>
              </div>
              <button onClick={() => setShowBatchPay(false)} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
              {paying && <p className="text-xs text-indigo-500 animate-pulse">批量支付处理中...</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── 跳转前弹窗提醒 ─── */}
      {showJumpPopup && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowJumpPopup(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🚀</div>
                <h3 className="text-base font-bold text-gray-800">即将离开即影</h3>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-xs text-gray-600 space-y-2">
                <p>即将跳转至 <strong>{PLATFORMS.find(p => p.id === showJumpPopup)?.name}</strong> 官方注册页面</p>
                <p>✅ 注册将在新窗口中打开，即影页面不会关闭</p>
                <p>✅ 注册完成后请关闭新窗口，返回即影继续操作</p>
                <p>✅ 浏览器Tab标题会提醒您「注册完成后请返回即影」</p>
                <p className="text-gray-400">注册大约需要1-2分钟</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={dontRemind} onChange={e => setDontRemind(e.target.checked)} className="rounded" />
                我知道了，7天内不再提醒
              </label>
              <button onClick={() => confirmJump(showJumpPopup)}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                继续跳转
              </button>
              <button onClick={() => setShowJumpPopup(null)}
                className="w-full py-2 bg-white text-gray-600 rounded-xl text-xs border border-gray-200 hover:border-indigo-300">
                稍后再说
              </button>
              <p className="text-[10px] text-gray-400 text-center">如遇问题，可随时返回即影，点击「稍后注册」继续</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
