"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import MetroMap from "@/components/MetroMap"

function MetroContent() {
  const searchParams = useSearchParams()
  const role = (searchParams.get("role") || "education") as "education" | "enterprise"
  return <MetroMap role={role} />
}

export default function MetroPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0F0F1A] flex items-center justify-center text-[#8888A0]">加载中...</div>}>
      <MetroContent />
    </Suspense>
  )
}
