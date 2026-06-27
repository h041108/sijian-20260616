"use client"
import { useState } from "react"

interface Platform {
  id: string
  name: string
  icon: string
  url: string
  guide: string
  needsVPN?: boolean
  note?: string
}

const PLATFORMS: Platform[] = [
  { id: "xiaohongshu", name: "小红书", icon: "📕", url: "https://www.xiaohongshu.com", guide: "官网首页，点击右上角「登录」→选择「注册」方式" },
  { id: "douyin", name: "抖音", icon: "🎵", url: "https://www.douyin.com", guide: "点击「登录」→手机号或邮箱注册" },
  { id: "shipinhao", name: "视频号", icon: "💬", url: "https://channels.weixin.qq.com/login.html", guide: "微信扫码登录后创建，需在微信发现页操作" },
  { id: "kuaishou", name: "快手", icon: "📹", url: "https://www.kuaishou.com", guide: "或 https://mp.kuaishou.com 点击「注册登录」" },
  { id: "bilibili", name: "B站", icon: "📺", url: "https://www.bilibili.com", guide: "点击「登录」→「注册账号」，手机号或邮箱注册" },
  { id: "weixin", name: "微信公众号", icon: "📱", url: "https://mp.weixin.qq.com", guide: "点击「立即注册」，选择订阅号/服务号" },
  { id: "twitter", name: "X (Twitter)", icon: "🐦", url: "https://x.com/i/flow/signup", guide: "直接进入注册页面，支持邮箱/手机号注册", needsVPN: true },
  { id: "youtube", name: "YouTube", icon: "▶️", url: "https://www.youtube.com", guide: "使用Google账号登录即开通", needsVPN: true },
  { id: "tiktok", name: "TikTok", icon: "🎵", url: "https://www.tiktok.com", guide: "需海外手机号或邮箱注册（国内版为抖音）", needsVPN: true },
  { id: "facebook", name: "Facebook", icon: "👍", url: "https://www.facebook.com/r.php", guide: "直接进入注册页面", needsVPN: true },
  { id: "instagram", name: "Instagram", icon: "📷", url: "https://www.instagram.com", guide: "点击「注册」填写信息，支持邮箱/手机号", needsVPN: true },
  { id: "threads", name: "Threads", icon: "🧵", url: "https://www.threads.net", guide: "需使用Instagram账号登录", needsVPN: true },
  { id: "pinterest", name: "Pinterest", icon: "📌", url: "https://www.pinterest.com", guide: "点击「注册」创建账号，支持邮箱/Google登录", needsVPN: true },
  { id: "linkedin", name: "LinkedIn", icon: "💼", url: "https://www.linkedin.com", guide: "点击「加入」填写注册信息", needsVPN: true },
]

export default function OnboardingPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [customName, setCustomName] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [showPayment, setShowPayment] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  const checkedCount = Object.values(checked).filter(Boolean).length
  const totalFee = checkedCount * 20

  const toggleCheck = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
    // 弹出支付
    if (!checked[id]) {
      setShowPayment(id)
    }
  }

  const handlePay = async () => {
    setPaying(true)
    // 模拟支付
    await new Promise(r => setTimeout(r, 1500))
    setPaying(false)
    setShowPayment(null)
  }

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
        <span className="ml-auto text-indigo-600 font-medium">已选: {checkedCount}个账户</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">📢</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">请为您在以下平台的账号开设做好准备</h1>
          <p className="text-xs text-gray-400">点击链接一键跳转注册，已完成注册的账号请勾选确认。每确认一个账户将产生20元开户费用。</p>
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
              <th className="w-24 px-3 py-2.5 font-semibold text-gray-600 text-center">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PLATFORMS.map(p => (
              <tr key={p.id} className={checked[p.id] ? "bg-green-50/50" : ""}>
                <td className="px-3 py-3 text-center">
                  <input type="checkbox" checked={!!checked[p.id]} onChange={() => toggleCheck(p.id)}
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
                <td className="px-3 py-3 text-center">
                  {checked[p.id] ? (
                    <span className="text-xs text-green-600 font-medium">✅ 已激活</span>
                  ) : (
                    <span className="text-xs text-gray-400">未注册</span>
                  )}
                </td>
              </tr>
            ))}
            {/* 自定义行 */}
            <tr className="bg-gray-50/50">
              <td className="px-3 py-3 text-center">
                <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300 opacity-30" />
              </td>
              <td className="px-2 py-3">
                <input value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="其他自定义平台"
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </td>
              <td className="px-2 py-3">
                <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                  placeholder="手动输入平台注册链接"
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
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
          <p><strong className="text-gray-700">小红书：</strong>个人创作者可直接通过官网注册登录；商家入驻需通过App内「创作中心-开通店铺」</p>
          <p><strong className="text-gray-700">抖音：</strong>网页版支持手机号/邮箱注册，企业认证请访问 renzheng.douyin.com</p>
          <p><strong className="text-gray-700">视频号：</strong>一个微信账号只能注册一个视频号，注册需在手机微信内完成</p>
          <p><strong className="text-gray-700">TikTok：</strong>国内用户直接使用抖音App即可；TikTok为海外版，需海外手机号或邮箱</p>
          <p><strong className="text-gray-700">微信公众号：</strong>需准备邮箱（未注册过微信公众平台的），企业和个人均可注册</p>
          <p><strong className="text-gray-700">YouTube：</strong>需先拥有Google账号，注册后可直接发布内容</p>
          <p className="text-amber-600">⚠️ 国外平台（带"翻墙"标签）需要科学上网才能访问注册页面</p>
        </div>
      </details>

      {/* 底部统计 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">📊 已选账户：<strong className="text-gray-900">{checkedCount}</strong> 个</span>
            <span className="text-gray-600">预计费用：<strong className="text-indigo-600">¥{totalFee.toFixed(2)}</strong></span>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white text-gray-600 rounded-xl text-xs border border-gray-200 hover:border-indigo-300">稍后设置</button>
            <button disabled={checkedCount === 0}
              className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400">
              确认并支付
            </button>
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowPayment(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-4xl">💳</div>
              <h3 className="text-base font-bold text-gray-800">支付开户费用</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>账户名称</span>
                  <span className="font-medium text-gray-800">{PLATFORMS.find(p => p.id === showPayment)?.name}主号</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>所属平台</span>
                  <span className="font-medium text-gray-800">{PLATFORMS.find(p => p.id === showPayment)?.name}</span>
                </div>
                <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-2 mt-2">
                  <span>开户费用</span>
                  <span className="font-bold text-indigo-600 text-lg">¥20.00</span>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600">💚 微信支付</button>
                <button className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600">💙 支付宝</button>
              </div>
              <button onClick={handlePay} disabled={paying}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300">
                {paying ? "支付中..." : "确认支付"}
              </button>
              <button onClick={() => setShowPayment(null)} className="text-xs text-gray-400 hover:text-gray-600">稍后支付</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
