"use client"

import { PLANS } from "@/lib/subscription"
import Link from "next/link"
import type { Plan } from "@/lib/subscription"

const cPlans = [PLANS.free, PLANS.pro, PLANS.student] as Plan[]
const bPlans = [PLANS.teacher, PLANS.org_standard, PLANS.org_flagship] as Plan[]

export default function PricingPage() {
  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: "linear-gradient(160deg, #faf8f5 0%, #f3f0eb 50%, #f8f5f2 100%)" }}>
      {/* 顶部 */}
      <div className="border-b border-[#e8e5df] bg-white/70 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-lg font-bold text-gray-800 hover:opacity-80 transition-opacity">
            推信 · 思见
          </Link>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← 返回
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">选择适合你的方案</h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
            当前产品仍在内测阶段，所有功能免费开放。以下为未来定价方案预览。
          </p>
          <div className="inline-flex items-center gap-2 mt-4 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-xs text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            当前：免费体验 · 上线后老用户享永久折扣
          </div>
        </div>

        {/* C端方案 */}
        <h2 className="text-lg font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">👤</span>
          个人版
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {cPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* B端方案 */}
        <h2 className="text-lg font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-xs">🏫</span>
          教师 / 机构版
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {bPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isBusiness />
          ))}
        </div>

        {/* 常见问题 */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">常见问题</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-medium text-gray-700 mb-1">学生年卡和 Pro 版有什么区别？</div>
              <p className="text-gray-500 text-xs leading-relaxed">功能相同。学生年卡多了「高考/考研专项知识库」和「错题思维追踪」，且价格更低（¥99/年 ≈ ¥8.3/月）。需认证学生身份。</p>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">机构版可以开发票吗？</div>
              <p className="text-gray-500 text-xs leading-relaxed">可以。机构标准版和旗舰版均支持开增值税普票/专票。旗舰版支持对公转账。</p>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">可以随时升级或降级吗？</div>
              <p className="text-gray-500 text-xs leading-relaxed">可以随时升级，费用按天折算。年卡不支持降级退款。月付可随时取消，当前周期结束后自动降为免费版。</p>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">学生分享链接需要登录吗？</div>
              <p className="text-gray-500 text-xs leading-relaxed">不需要。教师分发的知识空间链接，学生打开即可查看3D思维空间，无需注册登录。</p>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center mt-12 pb-8">
          <p className="text-xs text-gray-400">
            上线后老用户永久折扣 · 学校/公益组织可申请免费 · 联系: pricing@sijian.ai
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan, isBusiness }: { plan: Plan; isBusiness?: boolean }) {
  const isFree = plan.id === "free"
  const isPopular = plan.id === "pro" || plan.id === "org_standard"

  const accentBorder = isBusiness ? "border-green-400" : "border-indigo-400"
  const accentBg = isBusiness ? "bg-green-500" : "bg-indigo-500"
  const accentBtn = isBusiness ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"
  const accentTag = isBusiness ? "bg-green-500" : "bg-indigo-500"

  return (
    <div className={`relative bg-white rounded-2xl border p-6 flex flex-col transition-all hover:shadow-lg ${
      isPopular ? `${accentBorder} shadow-md` : "border-[#e8e5df]"
    }`}>
      {isPopular && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${accentTag} text-white text-xs font-medium px-4 py-1 rounded-full`}>
          最受欢迎
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-800">{plan.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{plan.target}</p>
      </div>

      <div className="mb-4">
        <span className="text-2xl font-bold text-gray-800">{plan.price}</span>
        {plan.priceYearly && (
          <span className="text-xs text-gray-400 ml-1.5 line-through">{plan.priceYearly}</span>
        )}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="text-[13px] text-gray-600 flex items-start gap-2">
            <span className="text-green-500 shrink-0 mt-0.5">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        disabled={isFree}
        className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${
          isFree
            ? "bg-gray-100 text-gray-400 cursor-default"
            : `${accentBtn} text-white`
        }`}
        onClick={() => {
          if (!isFree) {
            alert("思见目前仍在内测阶段，所有功能免费开放。\n\n定价将于正式版上线后生效，届时老用户可享永久折扣。")
          }
        }}
      >
        {isFree ? "当前方案" : "即将开放"}
      </button>
    </div>
  )
}
