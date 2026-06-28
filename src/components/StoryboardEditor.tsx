"use client"

import { useState, useCallback } from "react"
import { type StoryboardShot, type CharacterTemplate, type SceneTemplate } from "@/lib/character-engine"

interface StoryboardEditorProps {
  shots: StoryboardShot[]
  character?: CharacterTemplate
  scene?: SceneTemplate
  onUpdateShot: (shotId: string, updates: Partial<StoryboardShot>) => void
  onGenerateKeyframe: (shotId: string) => Promise<void>
  generatingShot?: string | null
}

export default function StoryboardEditor({ shots, character, scene, onUpdateShot, onGenerateKeyframe, generatingShot }: StoryboardEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<StoryboardShot>>({})

  const startEdit = useCallback((shot: StoryboardShot) => {
    setEditingId(shot.id)
    setEditValues({ ...shot })
  }, [])

  const saveEdit = useCallback(() => {
    if (editingId && editValues) {
      onUpdateShot(editingId, editValues)
      setEditingId(null)
      setEditValues({})
    }
  }, [editingId, editValues, onUpdateShot])

  if (shots.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/50 font-medium">
          故事板 · {shots.length} 个镜头
          {character && <span className="ml-2 text-[#F59E0B]/60">主角：{character.name}</span>}
        </div>
      </div>

      {/* 镜头卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shots.map((shot, i) => (
          <div key={shot.id} className={`glass-card rounded-xl overflow-hidden border transition-all ${
            editingId === shot.id ? "border-[#F59E0B]/40 ring-1 ring-[#F59E0B]/20" : "border-white/[0.06] hover:border-white/20"
          }`}>
            {/* 缩略图 */}
            <div className="aspect-video bg-[#0C0C14] relative">
              {shot.keyframeUrl ? (
                <img src={shot.keyframeUrl} alt={`镜头 ${shot.shotNumber}`} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect fill='%230C0C14' width='320' height='180'/><text x='160' y='90' text-anchor='middle' fill='%235A5A72' font-size='12'>加载失败</text></svg>" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                  🎬 镜头 {shot.shotNumber}
                </div>
              )}
              {/* 镜头编号 */}
              <div className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-[#F59E0B]/80 text-[#0C0C14] text-[10px] font-bold flex items-center justify-center">
                {shot.shotNumber}
              </div>
              {/* 时长 */}
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white/60">
                {shot.duration}s
              </div>
              {/* 生成按钮 */}
              <button onClick={() => onGenerateKeyframe(shot.id)} disabled={generatingShot === shot.id}
                className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] text-[9px] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/30 disabled:opacity-40">
                {generatingShot === shot.id ? "🔄" : shot.keyframeUrl ? "🔄 重生成" : "🎨 生成画面"}
              </button>
            </div>

            {/* 编辑区 */}
            <div className="p-3 space-y-2">
              {editingId === shot.id ? (
                <>
                  <textarea value={editValues.description || ""} onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))}
                    rows={2} className="w-full text-[10px] bg-[#0C0C14] rounded-lg p-2 text-white/70 border border-white/10 focus:outline-none focus:border-[#F59E0B]/40" placeholder="画面描述" />
                  <div className="grid grid-cols-2 gap-1">
                    <input value={editValues.characterActions || ""} onChange={e => setEditValues(v => ({ ...v, characterActions: e.target.value }))}
                      className="px-2 py-1 text-[9px] bg-[#0C0C14] rounded-lg text-white/70 border border-white/10 focus:outline-none" placeholder="角色动作" />
                    <input value={editValues.sceneSetting || ""} onChange={e => setEditValues(v => ({ ...v, sceneSetting: e.target.value }))}
                      className="px-2 py-1 text-[9px] bg-[#0C0C14] rounded-lg text-white/70 border border-white/10 focus:outline-none" placeholder="场景" />
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <select value={editValues.cameraAngle || ""} onChange={e => setEditValues(v => ({ ...v, cameraAngle: e.target.value }))}
                      className="px-1 py-1 text-[8px] bg-[#0C0C14] rounded-lg text-white/60 border border-white/10 focus:outline-none">
                      <option>特写</option><option>中景</option><option>全景</option><option>远景</option><option>仰拍</option><option>俯拍</option>
                    </select>
                    <select value={editValues.cameraMovement || ""} onChange={e => setEditValues(v => ({ ...v, cameraMovement: e.target.value }))}
                      className="px-1 py-1 text-[8px] bg-[#0C0C14] rounded-lg text-white/60 border border-white/10 focus:outline-none">
                      <option>固定</option><option>推</option><option>拉</option><option>摇</option><option>跟</option><option>环绕</option>
                    </select>
                    <select value={editValues.mood || ""} onChange={e => setEditValues(v => ({ ...v, mood: e.target.value }))}
                      className="px-1 py-1 text-[8px] bg-[#0C0C14] rounded-lg text-white/60 border border-white/10 focus:outline-none">
                      <option>温馨</option><option>紧张</option><option>悬疑</option><option>欢乐</option><option>悲伤</option><option>燃</option>
                    </select>
                  </div>
                  <input value={editValues.dialogue || ""} onChange={e => setEditValues(v => ({ ...v, dialogue: e.target.value }))}
                    className="w-full px-2 py-1 text-[9px] bg-[#0C0C14] rounded-lg text-white/70 border border-white/10 focus:outline-none" placeholder="对白/旁白" />
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="px-3 py-1 rounded-lg bg-[#F59E0B] text-[#0C0C14] text-[9px] font-bold">💾 保存</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded-lg bg-white/[0.04] text-white/40 text-[9px]">取消</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-[10px] text-white/60 line-clamp-2">{shot.description}</div>
                      {shot.characterActions && (
                        <div className="text-[9px] text-[#F59E0B]/50 mt-0.5">🎬 {shot.characterActions}</div>
                      )}
                    </div>
                    <button onClick={() => startEdit(shot)}
                      className="shrink-0 ml-1 px-1.5 py-0.5 rounded text-[8px] text-white/30 hover:text-white/60">✏️</button>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-white/30">
                    {shot.sceneSetting && <span>📍 {shot.sceneSetting}</span>}
                    <span>📷 {shot.cameraAngle}{shot.cameraMovement ? `·${shot.cameraMovement}` : ""}</span>
                    {shot.mood && <span>🎭 {shot.mood}</span>}
                    {shot.dialogue && <span className="text-[#F59E0B]/40">💬 {shot.dialogue.slice(0, 20)}</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
