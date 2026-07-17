"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

interface JiyingPlan {
  id: string
  name: string
  price: string
  priceYearly?: string
  target: string
  color: string
  gradient: string
  icon: string
  features: string[]
  dailyLimit: number
  hot: boolean
}

const JIYING_PLANS: JiyingPlan[] = [
  {
    id: "free",
    name: "免费体验",
    price: "¥0",
    target: "尝鲜自媒体创作",
    color: "from-gray-500 to-gray-600",
    gradient: "from-gray-50 to-gray-100",
    icon: "🌱",
    dailyLimit: 3,
    hot: false,
    features: [
      "每日 3 次内容生成",
      "1 个 AI 引擎 Agent",
      "基础图片社（2 模板）",
      "每日内容审核预览",
      "水印输出",
    ],
  },
  {
    id: "pro",
    name: "专业版",
    price: "¥20/月",
    priceYearly: "¥199/年",
    target: "个人自媒体创业者",
    color: "from-[#F59E0B] to-[#F97316]",
    gradient: "from-amber-50 to-orange-50",
    icon: "🚀",
    dailyLimit: 50,
    hot: true,
    features: [
      "每日 50 次内容生成",
      "全部 15 个 AI Agent",
      "漫剧引擎（即刻影片工厂）",
      "数字人口播",
      "超级图片社（全部模板）",
      "每日 30 秒审核模式",
      "无水印导出",
      "素材库 5GB",
    ],
  },
  {
    id: "enterprise",
    name: "企业版",
    price: "¥199/月",
    target: "自媒体团队/MCN",
    color: "from-[#8B5CF6] to-[#6366F1]",
    gradient: "from-purple-50 to-indigo-50",
    icon: "🏢",
    dailyLimit: -1,
    hot: false,
    features: [
      "不限量内容生成",
      "全部 15 个 AI Agent",
      "API 接口接入",
      "多账号管理（5 席位）",
      "品牌定制（去即影标识）",
      "素材库 100GB",
      "优先技术支持",
      "自动发布到多平台",
    ],
  },
]

export default function JiyingPricing() {
  const [yearly, setYearly] = useState(false)
  const [plans, setPlans] = useState<JiyingPlan[]>(JIYING_PLANS)
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    fetch("/api/payment/plans")
      .then(r => r.json())
      .then(apiPlans => {
        if (apiPlans && apiPlans.length > 0) {
          setPlans(prev => prev.map(p2 => {
            const api = apiPlans.find(a => a.id === p2.id)
            return api ? { ...p2, price: api.price, priceYearly: api.priceYearly || undefined, dailyLimit: api.dailyLimit, features: api.features } : p2
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false))
  }, [])
  // 支付弹窗状态
  const [payOpen, setPayOpen] = useState(false)
  const [payPlan, setPayPlan] = useState<JiyingPlan | null>(null)
  const [payMethod, setPayMethod] = useState<"alipay" | "wechat">("alipay")
  const [paySubmitted, setPaySubmitted] = useState(false)

  const handleSubmitPayment = async () => {
    if (!payPlan) return
    setPaySubmitted(true)
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: payPlan.id, paymentMethod: payMethod }),
      })
      const data = await res.json()
      if (data.error) { alert("提交失败: " + data.error); setPaySubmitted(false) }
      else if (data.status === "confirmed") { localStorage.setItem("sijian_paid", "true"); window.location.reload() }
    } catch { alert("网络错误，请重试"); setPaySubmitted(false) }
  }

  const PayModal = payOpen && payPlan ? (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4" onClick={() => { if (!paySubmitted) setPayOpen(false) }}>
      <div className="absolute inset-0 bg-black/85" />
      <div className="relative bg-[#1A1A2E] rounded-2xl p-6 shadow-2xl w-full max-w-sm border border-[#F59E0B]/15" onClick={e => e.stopPropagation()}>
        <button onClick={() => { if (!paySubmitted) setPayOpen(false) }} className="float-right text-white/30 hover:text-white/60 text-lg leading-none">X</button>
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">{payPlan.icon}</div>
          <h2 className="text-base font-bold text-[#E8E8F0]">{payPlan.name}</h2>
          <p className="text-2xl font-bold text-[#F59E0B] mt-1">{payPlan.price}{payPlan.priceYearly && yearly ? payPlan.priceYearly : ""}</p>
        </div>
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 mb-4">
          <button onClick={() => setPayMethod("alipay")}
            className={"flex-1 py-2 rounded-lg text-xs font-medium transition-all " + (payMethod === "alipay" ? "bg-blue-500/15 text-blue-400" : "text-white/40")}>支付宝</button>
          <button onClick={() => setPayMethod("wechat")}
            className={"flex-1 py-2 rounded-lg text-xs font-medium transition-all " + (payMethod === "wechat" ? "bg-green-500/15 text-green-400" : "text-white/40")}>微信</button>
        </div>
        <div className="bg-[#0C0C14] rounded-xl p-4 mb-4 text-center">
          <div className="w-48 h-48 mx-auto bg-white/5 rounded-xl flex items-center justify-center text-[#5A5A72] text-sm mb-2">
            {payMethod === "alipay" ? "支付宝收款码" : "微信收款码"}
          </div>
          <p className="text-[10px] text-[#5A5A72]">请使用{payMethod === "alipay" ? "支付宝" : "微信"}扫描上方二维码付款</p>
          <p className="text-[10px] text-[#F59E0B] mt-1">付款后点击下方"我已付款"按钮</p>
        </div>
        {paySubmitted ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">&#9200;</div>
            <p className="text-sm text-[#E8E8F0]">已提交，请等待管理员确认到账...</p>
            <p className="text-[10px] text-[#5A5A72] mt-2">通常 5-30 分钟内确认，确认后自动开通</p>
            <button onClick={() => window.location.reload()} className="mt-4 w-full py-2.5 rounded-xl bg-white/10 text-[#E8E8F0] text-xs hover:bg-white/15">刷新状态</button>
          </div>
        ) : (
          <button onClick={handleSubmitPayment} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold hover:shadow-lg hover:shadow-[#F59E0B]/20">我已付款</button>
        )}
        <p className="text-[10px] text-[#5A5A72] text-center mt-3">管理员手动确认到账后开通，如有问题请联系客服</p>
      </div>
    </div>
  ) : null


  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #0C0C14 0%, #1A1A2E 50%, #0C0C14 100%)" }}>
      {/* 顶部导航 */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <Link href="/jiying" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-xs">🎬</div>
          <span className="text-sm font-bold text-[#E8E8F0]">即影</span>
        </Link>
        <Link href="/jiying" className="text-xs text-[#5A5A72] hover:text-[#FBBF24] transition-colors">
          ← 返回工作台
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#E8E8F0] mb-3">
            选择你的自媒体方案
          </h1>
          <p className="text-sm text-[#5A5A72] max-w-lg mx-auto">
            20元 = 15个AI自媒体专家 + 1个智能调度大脑 + 每天30秒审核
          </p>
        </div>

        {/* 年付/月付切换 */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={"text-xs " + (!yearly ? "text-[#FBBF24] font-medium" : "text-[#5A5A72]")}>月付</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={"relative w-12 h-6 rounded-full transition-colors " + (yearly ? "bg-[#F59E0B]" : "bg-[#2A2A38]")}
          >
            <span className={"absolute top-1 w-4 h-4 rounded-full bg-white transition-all " + (yearly ? "left-7" : "left-1")} />
          </button>
          <span className={"text-xs " + (yearly ? "text-[#FBBF24] font-medium" : "text-[#5A5A72]")}>
            年付 <span className="text-[#22C55E]">省2个月</span>
          </span>
        </div>

        {/* 套餐卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={"relative rounded-2xl border p-6 flex flex-col transition-all hover:translate-y-[-2px] " +
                (plan.hot
                  ? "border-[#F59E0B]/40 shadow-lg shadow-[#F59E0B]/5 bg-[#1A1A2E]"
                  : "border-white/5 bg-black/20 hover:border-white/10")
              }
            >
              {/* 最受欢迎标签 */}
              {plan.hot && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-[10px] font-bold px-4 py-1 rounded-full">
                  🔥 最受欢迎
                </div>
              )}

              {/* 图标 + 名称 */}
              <div className="flex items-center gap-3 mb-4">
                <div className={"w-10 h-10 rounded-xl bg-gradient-to-br " + plan.color + " flex items-center justify-center text-lg shadow-lg"}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#E8E8F0]">{plan.name}</h3>
                  <p className="text-[10px] text-[#5A5A72]">{plan.target}</p>
                </div>
              </div>

              {/* 价格 */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#E8E8F0]">
                  {yearly && plan.priceYearly ? plan.priceYearly : plan.price}
                </span>
                {plan.priceYearly && (
                  <span className="text-[10px] text-[#5A5A72] ml-1.5">
                    {yearly ? "（≈" + Math.round(parseInt(plan.priceYearly.replace(/[¥/年]/g,""))/12) + "/月）" : plan.priceYearly}
                  </span>
                )}
              </div>

              {/* 每日限额 */}
              <div className="mb-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                <span className="text-xs text-[#5A5A72]">每日生成 </span>
                <span className="text-sm font-bold text-[#FBBF24]">
                  {plan.dailyLimit === -1 ? "∞ 不限量" : plan.dailyLimit + " 次"}
                </span>
              </div>

              {/* 功能列表 */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-[12px] text-[#9898B0] flex items-start gap-2">
                    <span className="text-[#22C55E] shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* 按钮 */}
              <button
                className={"w-full rounded-xl py-2.5 text-sm font-bold transition-all " +
                  (plan.id === "free"
                    ? "bg-white/5 text-[#5A5A72] cursor-default"
                    : plan.id === "pro"
                    ? "bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] hover:shadow-lg hover:shadow-[#F59E0B]/20"
                    : "bg-white/10 text-[#E8E8F0] hover:bg-white/15")
                }
                onClick={() => {
                  if (plan.id !== "free") {
                    setPayPlan(plan);
                    setPayOpen(true)
                  }
                }}
              >
                {plan.id === "free" ? "当前方案" : "扫码支付"}
              </button>
            </div>
          ))}
        </div>

        {/* 功能对比表格 */}
        <div className="rounded-2xl border border-white/5 bg-black/20 p-6 mb-12">
          <h2 className="text-base font-bold text-[#E8E8F0] mb-5">完整功能对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 pr-4 text-[#5A5A72] font-medium">功能</th>
                  <th className="py-3 px-4 text-[#9898B0] font-medium">🌱 免费</th>
                  <th className="py-3 px-4 text-[#FBBF24] font-medium">🚀 专业</th>
                  <th className="py-3 px-4 text-[#9898B0] font-medium">🏢 企业</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["每日生成次数", "3 次", "50 次", "不限量"],
                  ["AI Agent 数量", "1 个", "15 个全部", "15 个全部"],
                  ["主调度 Agent", "✗", "✓", "✓"],
                  ["漫剧引擎（影片工厂）", "✗", "✓", "✓"],
                  ["数字人口播", "✗", "✓", "✓"],
                  ["超级图片社模板", "2 个", "全部", "全部"],
                  ["每日审核模式", "预览", "30 秒审核", "30 秒审核"],
                  ["无水印导出", "✗", "✓", "✓"],
                  ["素材库", "500MB", "5GB", "100GB"],
                  ["多账号管理", "—", "—", "5 席位"],
                  ["API 接口", "—", "—", "✓"],
                  ["品牌定制", "—", "—", "✓"],
                  ["自动多平台发布", "—", "—", "✓"],
                  ["优先技术支持", "—", "—", "✓"],
                ].map((row, i) => (
                  <tr key={i} className={"border-b border-white/[0.02] " + (i % 2 === 0 ? "bg-white/[0.02]" : "")}>
                    <td className="py-2.5 pr-4 text-[#9898B0]">{row[0]}</td>
                    <td className="py-2.5 px-4 text-[#5A5A72]">{row[1]}</td>
                    <td className="py-2.5 px-4 text-[#E8E8F0] font-medium">{row[2]}</td>
                    <td className="py-2.5 px-4 text-[#9898B0]">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="rounded-2xl border border-white/5 bg-black/20 p-6">
          <h2 className="text-base font-bold text-[#E8E8F0] mb-5">常见问题</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ["20元专业版包含什么？", "15个AI自媒体专家Agent + 智能调度大脑 + 每天50次生成 + 漫剧引擎 + 数字人 + 超级图片社。核心价值：每天只需30秒审核，AI替你完成99%的工作。"],
              ["免费用户能做什么？", "每天3次体验，可以使用1个基础Agent和2个图片模板。适合先尝尝AI自媒体创作的玩法。"],
              ["我可以随时升级或取消吗？", "可以。月付随时取消（当前周期结束后降级为免费）。年付不支持退款。"],
              ["企业版和拼团购买有优惠吗？", "有的。企业版5席位起售。如果3人以上拼团购买专业版，可享8折优惠。联系 pricing@jiying.ai"],
              ["素材和创作内容归属谁？", "所有创作内容（图片、视频、脚本等）版权归你所有。即影不会用你的内容训练模型。"],
              ["支持哪些自媒体平台？", "目前支持小红书、抖音、视频号的内容格式。企业版支持API自动发布。"],
            ].map(([q, a], i) => (
              <div key={i}>
                <div className="text-sm font-medium text-[#E8E8F0] mb-1">{q}</div>
                <p className="text-xs text-[#5A5A72] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center mt-12">
          <p className="text-[10px] text-[#5A5A72]">
            上线后老用户享永久折扣 · 自媒体创作者可申请免费体验 · 联系: pricing@jiying.ai
          </p>
        </div>
      </div>
    
      {PayModal}
</div>
  )
}
