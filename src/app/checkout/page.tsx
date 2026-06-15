"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { PLANS, PlanId, setSubscription } from "@/lib/subscription"

type Step = "plan" | "pay" | "qr" | "done"

const planIds: PlanId[] = ["pro", "student", "teacher"]

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("plan")
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [method, setMethod] = useState<"wechat" | "alipay">("wechat")
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const plan = selectedPlan ? PLANS[selectedPlan] : null

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [])

  const handleSelectPlan = useCallback((id: PlanId) => {
    setSelectedPlan(id)
    setStep("pay")
  }, [])

  const handleShowQR = useCallback((m: "wechat" | "alipay") => {
    setMethod(m)
    setStep("qr")
    setCountdown(5)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setSubscription(selectedPlan || "pro")
          setStep("done")
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [selectedPlan])

  const handleReset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStep("plan"); setSelectedPlan(null); setCountdown(0)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #faf8f5 0%, #f3f0eb 50%, #f8f5f2 100%)" }}>
      <div className="w-full max-w-md mx-4">
        {/* ── 步骤1：选方案 ────────────────────── */}
        {step === "plan" && (
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">升级你的思见</h2>
            <p className="text-sm text-gray-500 mb-6">选择方案后选择支付方式</p>
            {planIds.map((id) => {
              const p = PLANS[id]
              return (
                <button key={id} onClick={() => handleSelectPlan(id)}
                  className="w-full text-left p-4 rounded-xl border border-[#e8e5df] hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{p.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{p.target}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{p.price}</div>
                    {p.priceYearly && <div className="text-[11px] text-gray-400 line-through">{p.priceYearly}</div>}
                  </div>
                </button>
              )
            })}
            <a href="/pricing" className="block text-center text-xs text-gray-400 hover:text-indigo-600 mt-2">查看完整方案对比 →</a>
          </div>
        )}

        {/* ── 步骤2：选支付方式 ────────────────── */}
        {step === "pay" && plan && (
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-8 shadow-sm">
            <button onClick={() => setStep("plan")} className="text-xs text-gray-400 hover:text-gray-600 mb-4">← 返回选方案</button>
            <h2 className="text-lg font-bold text-gray-800 mb-1">{plan.name}</h2>
            <p className="text-sm text-gray-500 mb-6">应付金额：<span className="font-bold text-gray-800">{plan.price}</span></p>

            <div className="space-y-3">
              <button onClick={() => handleShowQR("wechat")}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${method === "wechat" ? "border-green-400 bg-green-50" : "border-[#e8e5df]"}`}>
                <div className="w-11 h-11 rounded-xl bg-[#07C160] flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-7.6 4.9c.8.3 1.7.5 2.6.5a6.2 6.2 0 0 0 5.3-3.7 5.2 5.2 0 0 1-2.5 3.2H8.4c-.8 0-1.5-.3-2-.7l-1.4.4.5-1.3a3.2 3.2 0 0 1-.6-1.8c0-.3 0-.6.1-.9a6.4 6.4 0 0 0 5.9 4.3zM12 2a10 10 0 1 0 9.1 14.2c.6-.3 1.2-.5 1.9-.7A10 10 0 0 0 12 2z"/></svg>
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-800">微信支付</div>
                  <div className="text-xs text-gray-400">扫码支付，即时到账</div>
                </div>
                <div className="text-gray-300 text-lg">›</div>
              </button>

              <button onClick={() => handleShowQR("alipay")}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${method === "alipay" ? "border-blue-400 bg-blue-50" : "border-[#e8e5df]"}`}>
                <div className="w-11 h-11 rounded-xl bg-[#1677FF] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">支</span>
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-800">支付宝</div>
                  <div className="text-xs text-gray-400">扫码或跳转App支付</div>
                </div>
                <div className="text-gray-300 text-lg">›</div>
              </button>
            </div>
          </div>
        )}

        {/* ── 步骤3：扫码支付 ──────────────────── */}
        {step === "qr" && plan && (
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-8 shadow-sm text-center">
            <div className="text-xs text-gray-400 mb-2">请使用{method === "wechat" ? "微信" : "支付宝"}扫一扫支付</div>

            {/* 金额 */}
            <div className="text-3xl font-bold text-gray-800 mb-1">{plan.price.split("/")[0]}</div>
            <div className="text-sm text-gray-500 mb-6">{plan.name}</div>

            {/* 二维码 */}
            <div className="w-48 h-48 mx-auto mb-6 relative">
              <div className="w-full h-full rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                <img
                  src={method === "wechat"
                    ? "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="white"/><rect x="30" y="30" width="35" height="35" rx="4" fill="#07C160"/><rect x="75" y="30" width="35" height="35" rx="4" fill="#07C160"/><rect x="120" y="30" width="35" height="35" rx="4" fill="#07C160"/><rect x="30" y="75" width="35" height="35" rx="4" fill="#07C160"/><rect x="120" y="75" width="35" height="35" rx="4" fill="#07C160"/><rect x="30" y="120" width="35" height="35" rx="4" fill="#07C160"/><rect x="75" y="120" width="35" height="35" rx="4" fill="#07C160"/><rect x="120" y="120" width="35" height="35" rx="4" fill="#07C160"/><circle cx="90" cy="90" r="18" fill="#07C160"/></svg>')
                    : "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="white"/><rect x="30" y="30" width="35" height="35" rx="4" fill="#1677FF"/><rect x="75" y="30" width="35" height="35" rx="4" fill="#1677FF"/><rect x="120" y="30" width="35" height="35" rx="4" fill="#1677FF"/><rect x="30" y="75" width="35" height="35" rx="4" fill="#1677FF"/><rect x="120" y="75" width="35" height="35" rx="4" fill="#1677FF"/><rect x="30" y="120" width="35" height="35" rx="4" fill="#1677FF"/><rect x="75" y="120" width="35" height="35" rx="4" fill="#1677FF"/><rect x="120" y="120" width="35" height="35" rx="4" fill="#1677FF"/><circle cx="90" cy="90" r="18" fill="#1677FF"/></svg>')
                  }
                  alt="扫码支付"
                  className="w-full h-full rounded-xl"
                />
                {countdown > 0 && (
                  <div className="absolute inset-0 bg-black/5 rounded-xl flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                      {countdown}s 后自动完成
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-green-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={method === "wechat" ? "#07C160" : "#1677FF"} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 7h10M7 12h10M7 17h6"/></svg>
                </div>
                <div className="text-[10px] text-gray-400">打开{method === "wechat" ? "微信" : "支付宝"}</div>
              </div>
              <div className="text-gray-300">→</div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-green-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={method === "wechat" ? "#07C160" : "#1677FF"} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>
                </div>
                <div className="text-[10px] text-gray-400">扫描二维码</div>
              </div>
              <div className="text-gray-300">→</div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-green-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={method === "wechat" ? "#07C160" : "#1677FF"} strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div className="text-[10px] text-gray-400">支付成功</div>
              </div>
            </div>

            <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">取消支付</button>

            <p className="text-center text-[10px] text-gray-300 mt-6">
              当前为开发环境，扫码模拟 · 正式上线后接入真实微信/支付宝支付
            </p>
          </div>
        )}

        {/* ── 步骤4：支付成功 ──────────────────── */}
        {step === "done" && plan && (
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-8 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">支付成功！</h2>
            <p className="text-sm text-gray-500 mb-2">已通过{method === "wechat" ? "微信支付" : "支付宝"}完成</p>
            <p className="text-sm text-gray-500 mb-1">
              升级为 <span className="font-semibold text-gray-700">{plan.name}</span>
            </p>
            <div className="inline-block bg-gray-50 rounded-lg px-4 py-2 text-xs text-gray-500 mb-6 mt-2">
              {plan.price.split("/")[0]} · {method === "wechat" ? "微信支付" : "支付宝"} · 即时到账
            </div>
            <div className="flex gap-3 justify-center">
              <a href="/" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 text-sm font-medium transition-all">开始使用</a>
              <button onClick={handleReset} className="rounded-xl border border-[#e8e5df] hover:bg-gray-50 text-gray-600 px-6 py-2.5 text-sm">管理订阅</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
