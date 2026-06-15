"use client"

import { useState, useEffect, useCallback } from "react"
import type { MindNode, MindEdge, DomainType, FrameType } from "@/lib/types"
import MindTransit from "@/components/MindTransit"

type SharedListItem = { id: string; topic: string; subject: string; grade: string; createdAt: string; views: number }
type SharedSpaceFull = { id: string; topic: string; subject: string; grade: string; nodes: any[]; edges: any[]; frameType: string; domainType: string; createdAt: string; views: number }

export default function SharedList() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<(SharedListItem & { hasPassword: boolean; expireAt: string | null; publisher: string })[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<SharedSpaceFull | null>(null)
  const [needPassword, setNeedPassword] = useState(false)
  const [password, setPassword] = useState("")

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/b-end/publish/list")
      const d = await r.json()
      setList(d.list || [])
    } catch { setList([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (open) loadList() }, [open, loadList])

  const openSpace = useCallback(async (id: string, pwd?: string) => {
    const url = `/api/b-end/publish?id=${id}${pwd ? `&password=${pwd}` : ""}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.needPassword) { setNeedPassword(true); return }
    if (d.error) { alert(d.error); return }
    setNeedPassword(false)
    setPassword("")
    setSelected(d)
  }, [])

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="text-xs text-gray-500 hover:text-gray-800 transition-all px-3 py-1.5 rounded-xl border border-[#a5d6a7] hover:bg-[#c8e6c9] flex items-center gap-1">
        📨 收到的分享
        {list.length > 0 && <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] flex items-center justify-center">{list.length}</span>}
      </button>

      {/* 列表 */}
      {open && !selected && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-start justify-end" onClick={() => setOpen(false)}>
          <div className="w-[420px] h-screen bg-white shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#e8e5df] px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-base font-bold text-gray-800">📨 收到的分享</h2>
                <p className="text-xs text-gray-400 mt-0.5">教师/机构发布的知识空间</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="px-4 py-3">
              {loading ? (
                <div className="text-center py-12 text-gray-400">加载中…</div>
              ) : list.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3 opacity-20">📭</div>
                  <p className="text-sm text-gray-500">还没有收到任何分享</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {list.map(item => (
                    <button key={item.id}
                      onClick={() => openSpace(item.id)}
                      className="w-full text-left p-4 rounded-xl border border-[#e8e5df] hover:border-green-300 hover:bg-green-50/30 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800">{item.topic || "知识空间"}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.subject} · {item.grade}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                        {item.hasPassword && <span className="text-amber-500">🔒</span>}
                        <span>👁 {item.views || 0} 次</span>
                        <span>{new Date(item.createdAt).toLocaleDateString("zh")}</span>
                        <span>· {item.publisher}</span>
                        {item.expireAt && <span className="text-red-400">过期: {new Date(item.expireAt).toLocaleDateString("zh")}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 密码验证 */}
      {needPassword && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setNeedPassword(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">🔒 需要访问密码</h3>
            <p className="text-xs text-gray-400 mb-3">此空间已设置密码保护</p>
            <input type="text" maxLength={4} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="输入4位数字密码" className="w-full rounded-xl border border-[#e8e5df] bg-gray-50 px-4 py-2.5 text-sm text-center tracking-widest text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 mb-3"
              onKeyDown={e => e.key === "Enter" && openSpace(list.find(l => !l.hasPassword)?.id || "", password)} />
            <button onClick={() => openSpace(list.find(l => !l.hasPassword)?.id || "", password)}
              disabled={!password}
              className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all disabled:opacity-40">
              确认密码
            </button>
          </div>
        </div>
      )}

      {/* 详情预览 */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e5df]">
              <div>
                <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-1">← 关闭</button>
                <h3 className="text-base font-bold text-gray-800">{selected.topic || "知识空间"}</h3>
                <div className="text-xs text-gray-400">{selected.subject} · {selected.grade} · {selected.nodes?.length || 0} 概念</div>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{selected.frameType || "tree"} · 👁 {selected.views}</span>
            </div>
            <div style={{ height: "450px" }}>
              <MindTransit
                nodes={selected.nodes || []}
                edges={selected.edges || []}
                domainType={(selected.domainType || "general") as DomainType}
                frameType={(selected.frameType || "tree") as FrameType}
                onExport={() => { const b = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `shared-space.json`; a.click() }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
