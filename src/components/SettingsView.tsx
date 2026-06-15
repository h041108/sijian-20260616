"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, getMyClasses, getMyOrgs } from "@/lib/sijian-user"
import { loadRooms } from "@/lib/memory-palace"

interface Props {
  role: "education" | "enterprise"
}

export default function SettingsView({ role }: Props) {
  const [spaceName, setSpaceName] = useState("")
  const [defaultFrame, setDefaultFrame] = useState("tree")
  const [autoSave, setAutoSave] = useState(true)
  const [seedRoomsCount, setSeedRoomsCount] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const rooms = loadRooms()
    setSeedRoomsCount(rooms.length)
    const saved = localStorage.getItem("sijian_space_config")
    if (saved) {
      try {
        const cfg = JSON.parse(saved)
        if (cfg.spaceName) setSpaceName(cfg.spaceName)
        if (cfg.defaultFrame) setDefaultFrame(cfg.defaultFrame)
        if (cfg.autoSave !== undefined) setAutoSave(cfg.autoSave)
      } catch {}
    }
  }, [])

  const handleSave = () => {
    const cfg = { spaceName, defaultFrame, autoSave }
    localStorage.setItem("sijian_space_config", JSON.stringify(cfg))
    alert("配置已保存")
  }

  const handleResetData = () => {
    if (confirm("确定要重置所有思维空间数据吗？此操作不可撤销。")) {
      localStorage.removeItem("sijian_memory_palace")
      localStorage.removeItem("sijian_users")
      localStorage.removeItem("sijian_relations")
      localStorage.removeItem("sijian_invites")
      localStorage.removeItem("sijian_classes")
      localStorage.removeItem("sijian_orgs")
      localStorage.removeItem("sijian_session")
      alert("数据已重置，刷新页面生效")
    }
  }

  const handleExportData = () => {
    const rooms = loadRooms()
    const data = {
      rooms,
      users: JSON.parse(localStorage.getItem("sijian_users") || "[]"),
      classes: JSON.parse(localStorage.getItem("sijian_classes") || "[]"),
      orgs: JSON.parse(localStorage.getItem("sijian_orgs") || "[]"),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sijian-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const user = typeof window !== "undefined" ? getCurrentUser() : null

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 基本信息 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">⚙️ 空间配置</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">空间名称</label>
            <input value={spaceName} onChange={e => setSpaceName(e.target.value)}
              placeholder={role === "education" ? "如：高三数学教学空间" : "如：产品研发知识空间"}
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">默认思维框架</label>
            <select value={defaultFrame} onChange={e => setDefaultFrame(e.target.value)}
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-700">
              <option value="tree">🌳 树形结构</option>
              <option value="network">🕸️ 网状结构</option>
              <option value="helix">🧬 螺旋结构</option>
              <option value="orbital">🪐 轨道结构</option>
              <option value="pipeline">🔗 管道结构</option>
              <option value="lens">🔍 透镜结构</option>
              <option value="cycle">🔄 循环结构</option>
              <option value="spectrum">🌈 光谱结构</option>
              <option value="matrix">📐 矩阵结构</option>
              <option value="diffusion">💨 扩散结构</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-700">自动保存</div>
              <div className="text-xs text-gray-400">对话完成后自动保存</div>
            </div>
            <button onClick={() => setAutoSave(!autoSave)}
              className={`w-12 h-6 rounded-full transition-all ${autoSave ? "bg-green-500" : "bg-gray-300"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-all ${autoSave ? "translate-x-[26px]" : "translate-x-[2px]"}`} />
            </button>
          </div>
          <button onClick={handleSave}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-medium transition-all">
            保存配置
          </button>
        </div>
      </div>

      {/* 当前状态 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 空间状态</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-lg font-bold text-gray-700">{seedRoomsCount}</div>
            <div className="text-xs text-gray-400">思维房间</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-lg font-bold text-gray-700">
              {user?.role === "teacher" ? "教师" : user?.role === "parent" ? "家长" : user?.role || "未设定"}
            </div>
            <div className="text-xs text-gray-400">当前角色</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-lg font-bold text-gray-700">
              {typeof window !== "undefined" ? localStorage.getItem("sijian_memory_palace") ? "有数据" : "空" : "-"}
            </div>
            <div className="text-xs text-gray-400">记忆宫殿</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-lg font-bold text-gray-700">
              {typeof window !== "undefined" ? JSON.parse(localStorage.getItem("sijian_users") || "[]").length : 0}
            </div>
            <div className="text-xs text-gray-400">注册用户</div>
          </div>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🗄️ 数据管理</h3>
        <div className="flex gap-3">
          <button onClick={handleExportData}
            className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 text-sm font-medium transition-all">
            📥 导出数据
          </button>
          <button onClick={handleResetData}
            className="rounded-xl bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2.5 text-sm font-medium transition-all border border-red-200">
            🗑️ 重置所有数据
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">导出包含所有思维房间、用户和班级/组织数据的 JSON 备份文件</p>
      </div>
    </div>
  )
}
