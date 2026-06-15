"use client"

import { useState, useEffect } from "react"
import MindSpace2D from "@/components/MindSpace2D"
import NodeDetail from "@/components/NodeDetail"
import type { MindNode, MindEdge, Position, DomainType, FrameType } from "@/lib/types"

export default function SharePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(null)

  useEffect(() => {
    // 从 URL 中提取 share ID
    const path = window.location.pathname
    const id = path.split("/").pop() || ""
    if (!id || id === "share") {
      setError("无效的分享链接")
      setLoading(false)
      return
    }

    fetch(`/api/b-end/publish?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setData(d)
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false))
  }, [])

  const handleNodeClick = (node: MindNode) => setSelectedNode(node)
  const handleNodePositionChange = (id: string, pos: Position) => {
    if (!data) return
    setData({
      ...data,
      nodes: data.nodes.map((n: MindNode) =>
        n.id === id ? { ...n, position: pos } : n,
      ),
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#e8f4f8" }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center animate-pulse">
            <span className="text-2xl opacity-40">✦</span>
          </div>
          <p className="text-gray-500 text-sm">正在加载知识空间……</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#e8f4f8" }}>
        <div className="text-center bg-white rounded-2xl p-8 border border-[#b8d8e8]">
          <p className="text-4xl mb-3 opacity-30">🔗</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <p className="text-xs text-gray-400 mt-2">链接可能已过期或不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen" style={{ background: "#e8f4f8" }}>
      {/* 左侧：思维空间 */}
      <div className="flex-[60] min-w-0 relative">
        <div className="absolute top-4 left-4 z-10 text-[11px] text-gray-500 pointer-events-none">
          滚轮缩放 · 拖拽平移 · 点击节点查看详情
        </div>

        <MindSpace2D
          nodes={data.nodes || []}
          edges={data.edges || []}
          domainType={(data.domainType || "general") as DomainType}
          frameType={(data.frameType || "tree") as FrameType}
          onNodeClick={handleNodeClick}
          onNodePositionChange={handleNodePositionChange}
          onExport={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `knowledge-${data.topic || "export"}.json`
            a.click()
          }}
        />

        <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
      </div>

      {/* 右侧：知识点信息 */}
      <div className="w-[340px] shrink-0 border-l border-[#c8dce8] bg-white/70 backdrop-blur-sm p-6 flex flex-col overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-800 mb-1">{data.topic || "知识空间"}</h1>
          <div className="flex gap-2 text-xs text-gray-400">
            <span>{data.subject}</span>
            <span>·</span>
            <span>{data.grade}</span>
            <span>·</span>
            <span>{data.nodes?.length || 0}个概念</span>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-600 mb-2">知识框架</h2>
          <span className="inline-block text-xs text-gray-500 bg-[#e8f4f8] px-3 py-1 rounded-full">
            {data.frameType || "tree"}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-600 mb-2">核心概念</h2>
          <div className="space-y-2">
            {(data.nodes || []).map((n: MindNode) => (
              <div
                key={n.id}
                className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer hover:bg-[#e8f4f8] p-1.5 rounded-lg transition-colors"
                onClick={() => setSelectedNode(n)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: n.color }}
                />
                <span className="font-medium">{n.label}</span>
                <span className="text-gray-400 text-[11px] truncate">{n.content?.slice(0, 30)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-600 mb-2">应用锚点</h2>
          {(data.nodes || []).filter((n: MindNode) => n.anchors?.length > 0).map((n: MindNode) => (
            <div key={n.id} className="mb-3">
              <div className="text-[12px] font-medium text-gray-500 mb-1">{n.label}</div>
              {n.anchors?.map((a) => (
                <div key={a.id} className="text-[12px] text-gray-400 pl-3 py-1 border-l-2 border-green-200 mb-1">
                  <div className="text-gray-600 mb-0.5">📍 {a.label}</div>
                  <div>{a.profession} · {a.domain}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{a.parameters}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-[#c8dce8]">
          <p className="text-[11px] text-gray-400">
            由思见 B端构建 · {new Date(data.createdAt).toLocaleDateString("zh-CN")}
          </p>
          <p className="text-[11px] text-gray-300 mt-1">
            浏览 {data.views || 0} 次
          </p>
        </div>
      </div>
    </div>
  )
}
