"use client"
import { useState } from "react"

export default function TestPage() {
  const [count, setCount] = useState(0)
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">测试页面</h1>
      <p className="text-gray-500 mb-4">点击次数: {count}</p>
      <button onClick={() => setCount(c => c + 1)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
        点我
      </button>
    </div>
  )
}
