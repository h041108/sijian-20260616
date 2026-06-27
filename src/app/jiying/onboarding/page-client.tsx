"use client"
import { useState } from "react"

interface Platform {
  id: string
  name: string
  icon: string
  url: string
  guide: string
  needsVPN?: boolean
}

const PLATFORMS: Platform[] = [
  { id: "xiaohongshu", name: "小红书", icon: "📕", url: "https://www.xiaohongshu.com", guide: "官网首页，点击右上角「登录」→选择「注册」方式" },
  { id: "douyin", name: "抖音", icon: "🎵", url: "https://www.douyin.com", guide: "点击「登录」→手机号或邮箱注册" },
  { id: "shipinhao", name: "视频号", icon: "💬", url: "https://channels.weixin.qq.com/login.html", guide: "微信扫码登录后创建，需在微信发现页操作" },
  { id: "kuaishou", name: "快手", icon: "📹", url: "https://www.kuaishou.com", guide: "或 mp.kuaishou.com 点击「注册登录」" },
  { id: "bilibili", name: "B站", icon: "📺", url: "https://www.bilibili.com", guide: "点击「登录」→「注册账号」，手机号或邮箱注册" },
  { id: "weixin", name: "微信公众号", icon: "📱", url: "https://mp.weixin.qq.com", guide: "点击「立即注册」，选择订阅号/服务号" },
  { id: "twitter", name: "X (Twitter)", icon: "🐦", url: "https://x.com/i/flow/signup", guide: "直接进入注册页面，支持邮箱/手机号注册", needsVPN: true },
  { id: "youtube", name: "YouTube", icon: "▶️", url: "https://www.youtube.com", guide: "使用Google账号登录即开通", needsVPN: true },
  { id: "tiktok", name: "TikTok", icon: "🎵", url: "https://www.tiktok.com", guide: "需海外手机号或邮箱注册（国内版为抖音）", needsVPN: true },
  { id: "facebook", name: "Facebook", icon: "👍", url: "https://www.facebook.com/r.php", guide: "直接进入注册页面", needsVPN: true },
  { id: "instagram", name: "Instagram", icon: "📷", url: "https://www.instagram.com", guide: "点击「注册」填写信息", needsVPN: true },
  { id: "threads", name: "Threads", icon: "🧵", url: "https://www.threads.net", guide: "需使用Instagram账号登录", needsVPN: true },
  { id: "pinterest", name: "Pinterest", icon: "📌", url: "https://www.pinterest.com", guide: "点击「注册」创建账号", needsVPN: true },
  { id: "linkedin", name: "LinkedIn", icon: "💼", url: "https://www.linkedin.com", guide: "点击「加入」填写注册信息", needsVPN: true },
]

type PaymentMode = "single" | "batch"

export default function OnboardingPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [paid, setPaid] = useState<Record<string, boolean>>({})
  const [customName, setCustomName] = useState("")
  const [customUrl, setCustomUrl] = useState("")

  // 单账户支付弹窗
  const [singlePay, setSinglePay] = useState<string | null>(null)
  // 批量支付弹窗
  const [batchPay, setBatchPay] = useState(false)
  const [paying, setPaying] = useState(false)

  const checkedCount = Object.values(checked).filter(Boolean).length
  const paidCount = Object.values(paid).filter(Boolean).length
  const unpaidChecked = checkedCount - paidCount
  const totalFee = checkedCount * 20

  // 勾选/取消勾选
  const toggleCheck = (id: string) => {
    const newChecked = !checked[id]
    setChecked(prev => ({ ...prev, [id]: newChecked }))

    // 如果是勾选（非取消），且该账户未支付，弹出单账户支付
    if (newChecked && !paid[id]) {
      setSinglePay(id)
    }
  }

  // 单账户支付完成
  const handleSinglePay = async () => {
    setPaying(true)
    await new Promise(r => setTimeout(r, 1000))
    if (singlePay) {
      setPaid(prev => ({ ...prev, [singlePay]: true }))
    }
    setPaying(false)
    setSinglePay(null)
  }

  // 批量支付完成
  const handleBatchPay = async () => {
    setPaying(true)
    await new Promise(r => setTimeout(r, 1500))

    const newPaid = { ...paid }
    // 把所有已勾选但未支付的都设为已支付
    for (const id of Object.keys(checked)) {
      if (checked[id] && !paid[id]) {
        newPaid[id] = true
      }
    }
    setPaid(newPaid)
    setPaying(false)
    setBatchPay(false)
  }

  const pendingPlatforms = PLATFORMS.filter(p => checked[p.id] && !paid[p.id])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

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
        <span className="ml-auto text-indigo-600 font-medium">✅ 已激活: {paidCount}个账户</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">📢</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">确认您的自媒体账号</h1>
          <p className="text-xs text-gray-400">
            如果您已有账号，直接勾选确认即可（20元/账户）。还没有账号？点击链接跳转注册，注册完成后回来勾选确认。
          </p>
        </div>
      </div>

      {/* 平台表格 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-8 px-3 py-2.5"></th>
              <th className="text-left px-2 py-2.5 font-semibold text-gray-600">平台名称</th>
              <th className="text-left px-2 py-2.5 font-semibold text-gray-600">官方注册入口</th>
              <th className="w-28 px-3 py-2.5 font-semibold text-gray-600 text-center">状态 / 操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PLATFORMS.map(p => {
              const isChecked = !!checked[p.id]
              const isPaid = !!paid[p.id]
              return (
                <tr key={p.id} className={isPaid ? "bg-green-50/50" : isChecked ? "bg-indigo-50/30" : ""}>
                  <td className="px-3 py-3 text-center align-top pt-4">
                    <input type="checkbox" checked={isChecked}
                      onChange={() => toggleCheck(p.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                      {p.needsVPN && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-600">翻墙</span>}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline text-xs block">
                      {p.url}
                    </a>
                    <span className="text-[10px] text-gray-400">{p.guide}</span>
                  </td>
                  <td className="px-3 py-3 text-center align-top pt-4">
                    {isPaid ? (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">✅ 已激活</span>
                    ) : isChecked ? (
                      <span className="text-xs text-amber-600 font-medium">⏳ 待支付</span>
                    ) : (
                      <span className="text-xs text-gray-400">未注册</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {/* 自定义行 */}
            <tr className="bg-gray-50/50">
              <td className="px-3 py-3 text-center"><input type="checkbox" disabled className="w-4 h-4 opacity-30" /></td>
              <td className="px-2 py-3">
                <input value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="其他自定义平台" className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </td>
              <td className="px-2 py-3">
                <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                  placeholder="手动输入平台注册链接" className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </td>
              <td className="px-3 py-3 text-center text-xs text-gray-300">自定义</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 注意事项 */}
      <details className="bg-white rounded-xl border border-gray-200">
        <summary className="px-4 py-2.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">平台注册注意事项</summary>
        <div className="px-4 pb-4 text-xs text-gray-500 space-y-2">
          <p><strong className="text-gray-700">小红书：</strong>个人创作者可直接通过官网注册；商家入驻需通过App内「创作中心-开通店铺」</p>
          <p><strong className="text-gray-700">抖音：</strong>网页版支持手机号/邮箱注册，企业认证 renzheng.douyin.com</p>
          <p><strong className="text-gray-700">视频号：</strong>一个微信账号只能注册一个视频号，需在手机微信内完成</p>
          <p><strong className="text-gray-700">TikTok：</strong>国内用户使用抖音即可；TikTok为海外版，需海外手机号或邮箱</p>
          <p><strong className="text-gray-700">微信公众号：</strong>需准备未注册过的邮箱，企业和个人均可注册</p>
          <p className="text-amber-600">⚠️ 国外平台（带"翻墙"标签）需要科学上网才能访问注册页面</p>
        </div>
      </details>

      {/* 底部统计 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">📊 已选账户：<strong className="text-gray-900">{checkedCount}</strong> 个</span>
            <span className="text-gray-600">已支付：<strong className="text-green-600">{paidCount}</strong> 个</span>
            <span className="text-gray-600">待支付：<strong className="text-amber-600">{unpaidChecked}</strong> 个</span>
            <span className="text-gray-600">费用：<strong className="text-indigo-600">¥{totalFee.toFixed(2)}</strong></span>
          </div>
          <div className="flex gap-2">
            <a href="/jiying/agents/agent-router" className="px-4 py-2 bg-white text-gray-600 rounded-xl text-xs border border-gray-200 hover:border-indigo-300">稍后设置</a>
            <button onClick={() => setBatchPay(true)}
              disabled={unpaidChecked === 0}
              className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400">
              确认并支付（¥{totalFee.toFixed(2)}）
            </button>
          </div>
        </div>
      </div>

      {/* ─── 单账户支付弹窗 ─── */}
      {singlePay && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setSinglePay(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-4xl">💳</div>
              <h3 className="text-base font-bold text-gray-800">支付开户费用</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>账户名称</span>
                  <span className="font-medium text-gray-800">{PLATFORMS.find(p => p.id === singlePay)?.name}主号</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>所属平台</span>
                  <span className="font-medium text-gray-800">{PLATFORMS.find(p => p.id === singlePay)?.name}</span>
                </div>
                <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-2 mt-2">
                  <span>开户费用</span>
                  <span className="font-bold text-indigo-600 text-lg">¥20.00</span>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={handleSinglePay} disabled={paying}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50">
                  💚 微信支付
                </button>
                <button onClick={handleSinglePay} disabled={paying}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
                  💙 支付宝
                </button>
              </div>
              <button onClick={() => setSinglePay(null)}
                className="text-xs text-gray-400 hover:text-gray-600">稍后支付</button>
              {paying && <p className="text-xs text-indigo-500 animate-pulse">支付处理中...</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── 批量支付弹窗 ─── */}
      {batchPay && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setBatchPay(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-4xl">💳</div>
              <h3 className="text-base font-bold text-gray-800">批量支付</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-2 text-sm text-left">
                  {pendingPlatforms.length > 0 && pendingPlatforms.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-gray-600">
                      <span>{p.icon}</span>
                      <span>{p.name}主号</span>
                      <span className="ml-auto text-indigo-600 font-medium">¥20</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>合计</span>
                  <span className="text-indigo-600">¥{(unpaidChecked * 20).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={handleBatchPay} disabled={paying}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50">💚 微信支付</button>
                <button onClick={handleBatchPay} disabled={paying}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50">💙 支付宝</button>
              </div>
              <button onClick={() => setBatchPay(false)}
                className="text-xs text-gray-400 hover:text-gray-600">取消</button>
              {paying && <p className="text-xs text-indigo-500 animate-pulse">批量支付处理中...</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
