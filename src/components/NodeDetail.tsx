"use client"

import type { MindNode, ShapeType } from "@/lib/types"

interface NodeDetailProps {
  node: MindNode | null
  onClose: () => void
}

const shapeLabels: Record<ShapeType, string> = {
  sphere: "球体",
  box: "立方体",
  cylinder: "圆柱体",
  torus: "环面",
}

export default function NodeDetail({ node, onClose }: NodeDetailProps) {
  if (!node) return null

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 animate-fade-in">
      <div className="card-light rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-4 h-4 rounded-full ring-1 ring-black/5"
              style={{
                backgroundColor: node.color,
                boxShadow: `0 0 12px ${node.color}40`,
              }}
            />
            <h3 className="text-[15px] font-semibold text-[#1a1a2e]">
              {node.label}
            </h3>
            <span className="text-[11px] text-[#1a1a2e]/35 bg-[#f3f2f0] px-2 py-0.5 rounded-md border border-[#e8e5df]">
              {shapeLabels[node.shape]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#1a1a2e]/25 hover:text-[#1a1a2e]/60 text-sm px-1 transition-all"
          >
            ✕
          </button>
        </div>
        <p className="text-[14px] text-[#1a1a2e]/65 leading-relaxed">
          {node.content}
        </p>
        <div className="mt-2.5 flex gap-4 text-[11px] text-[#1a1a2e]/30">
          <span>
            位置: ({node.position?.x?.toFixed(1) ?? "0.0"}, {node.position?.y?.toFixed(1) ?? "0.0"},{" "}
            {node.position?.z?.toFixed(1) ?? "0.0"})
          </span>
        </div>
      </div>
    </div>
  )
}
