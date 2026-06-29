"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { genId, saveCharacter, loadCharacters, type CharacterTemplate, type CharacterGender, type CharacterSource } from "@/lib/character-engine"
import { useJiyingUser } from "@/app/jiying/layout"

interface CharacterCreatorProps {
  onSelect?: (char: CharacterTemplate) => void
  selectedId?: string
}

export default function CharacterCreator({ onSelect, selectedId }: CharacterCreatorProps) {
  const { user } = useJiyingUser()
  const [chars, setChars] = useState<CharacterTemplate[]>([])
  const [showCreator, setShowCreator] = useState(false)
  const [mode, setMode] = useState<"ai" | "upload">("ai")

  const [name, setName] = useState("")
  const [gender, setGender] = useState<CharacterGender>("女")
  const [age, setAge] = useState("18岁青少年")
  const [hairStyle, setHairStyle] = useState("黑色长直发")
  const [height, setHeight] = useState("165cm")
  const [bodyType, setBodyType] = useState("苗条")
  const [top, setTop] = useState("白色衬衫")
  const [bottom, setBottom] = useState("牛仔裤")
  const [shoes, setShoes] = useState("白色运动鞋")
  const [personality, setPersonality] = useState("活泼开朗")
  const [styleHint, setStyleHint] = useState("写实电影风格")

  const [generating, setGenerating] = useState(false)
  const [candidates, setCandidates] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const [editingChar, setEditingChar] = useState<CharacterTemplate | null>(null)

  useEffect(() => { setChars(loadCharacters()) }, [])

  const resetForm = () => {
    setName(""); setGender("女"); setAge("18岁青少年"); setHairStyle("黑色长直发")
    setHeight("165cm"); setBodyType("苗条"); setTop("白色衬衫"); setBottom("牛仔裤")
    setShoes("白色运动鞋"); setPersonality("活泼开朗"); setStyleHint("写实电影风格")
    setCandidates([]); setSelectedImages([]); setSelectedImage(""); setEditingChar(null)
  }

  // ─── 上传后直接保存，不经过中间 state ───
  const handleUploadAndSave = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (name.trim() && user) {
        const char: CharacterTemplate = {
          id: genId(), userId: user.id, name: name.trim(),
          description: `${gender}性·${age}·${personality}`,
          referenceImages: { front: dataUrl },
          appearance: { gender, age, hairStyle, hairColor: "黑色", height, bodyType },
          costume: { top, bottom, shoes, style: styleHint },
          personality, styleHint, source: "user_upload", thumbnailUrl: dataUrl,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }
        saveCharacter(char)
        setChars(loadCharacters())
        setShowCreator(false)
        resetForm()
        onSelect?.(char)
      } else {
        setCandidates([dataUrl])
        setSelectedImage(dataUrl)
      }
      setUploading(false)
    }
    reader.onerror = () => setUploading(false)
    reader.readAsDataURL(file)
  }, [name, gender, age, hairStyle, height, bodyType, top, bottom, shoes, personality, styleHint, user, onSelect])

  const handleGenerate = useCallback(async () => {
    if (!name.trim()) return
    setGenerating(true)
    setCandidates([]); setSelectedImages([]); setSelectedImage("")
    try {
      const prompt = `${gender}性，${age}，${hairStyle}，${height}，${bodyType}身材，穿${top}和${bottom}，脚穿${shoes}，性格${personality}，半身肖像，纯色背景，正脸看向镜头`
      const res = await fetch("/api/character/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: styleHint, count: 4 }),
      })
      const data = await res.json()
      if (data.images?.length) setCandidates(data.images)
    } catch {}
    setGenerating(false)
  }, [name, gender, age, hairStyle, height, bodyType, top, bottom, shoes, personality, styleHint])

  const handleSave = useCallback(() => {
    const imageUrl = selectedImage || (candidates.length > 0 ? candidates[0] : "")
    if (!imageUrl || !name.trim()) return
    const char: CharacterTemplate = {
      id: editingChar?.id || genId(),
      userId: user?.id || "anonymous", name: name.trim(),
      description: `${gender}性·${age}·${personality}`,
      referenceImages: { front: imageUrl },
      appearance: { gender, age, hairStyle, hairColor: "黑色", height, bodyType },
      costume: { top, bottom, shoes, style: styleHint },
      personality, styleHint,
      source: mode === "upload" ? "user_upload" : "ai_generated",
      thumbnailUrl: imageUrl,
      createdAt: editingChar?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveCharacter(char)
    setChars(loadCharacters())
    resetForm()
    setShowCreator(false)
    setCandidates([])
    onSelect?.(char)
  }, [selectedImage, candidates, name, gender, age, hairStyle, height, bodyType, top, bottom, shoes, personality, styleHint, mode, editingChar, user, onSelect])

  const handleEdit = useCallback((char: CharacterTemplate) => {
    setName(char.name); setGender(char.appearance.gender); setAge(char.appearance.age)
    setHairStyle(char.appearance.hairStyle); setHeight(char.appearance.height)
    setBodyType(char.appearance.bodyType); setTop(char.costume.top)
    setBottom(char.costume.bottom); setShoes(char.costume.shoes)
    setPersonality(char.personality); setStyleHint(char.styleHint || "写实电影风格")
    setSelectedImage(char.referenceImages.front)
    setCandidates([char.referenceImages.front])
    setEditingChar(char); setShowCreator(true)
    setMode(char.source === "user_upload" ? "upload" : "ai")
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/50 font-medium">角色库 · {chars.length} 个</div>
        <button onClick={() => { resetForm(); setShowCreator(true) }}
          className="px-3 py-1 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold">+ 新建角色</button>
      </div>

      {chars.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {chars.map(c => (
            <div key={c.id} onClick={() => onSelect?.(c)}
              className={`glass-card rounded-xl p-2 cursor-pointer transition-all border-2 ${selectedId === c.id ? "border-[#F59E0B] bg-[#F59E0B]/5" : "border-transparent hover:border-white/10"}`}>
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#0C0C14] mb-1">
                <img src={c.thumbnailUrl} alt={c.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-[10px] font-medium text-white/70 truncate">{c.name}</div>
              <div className="text-[9px] text-white/30 truncate">{c.description}</div>
              <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="text-[8px] text-[#F59E0B]/60 hover:text-[#F59E0B] mt-1">编辑</button>
            </div>
          ))}
        </div>
      )}

      {chars.length === 0 && !showCreator && (
        <div className="text-center py-6 text-[10px] text-white/30 border border-dashed border-white/10 rounded-xl">还没有角色，点击上方"新建角色"开始创建</div>
      )}

      {showCreator && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCreator(false)}>
          <div className="bg-[#1A1A2E] rounded-2xl w-[min(95vw,500px)] max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#1A1A2E] z-10 px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-bold text-white/80">{editingChar ? "编辑角色" : "新建角色"}</span>
              <button onClick={() => setShowCreator(false)} className="text-white/30 hover:text-white/60 text-lg">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* 模式 */}
              <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
                <button onClick={() => setMode("ai")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${mode === "ai" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>🤖 AI 生成</button>
                <button onClick={() => setMode("upload")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${mode === "upload" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>📁 本地上传</button>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="角色名"
                  className="col-span-2 px-3 py-2 text-sm rounded-xl bg-[#0C0C14] border border-white/10 text-white/80 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
                <select value={gender} onChange={e => setGender(e.target.value as CharacterGender)}
                  className="px-3 py-2 text-xs rounded-xl bg-[#0C0C14] border border-white/10 text-white/60"><option>男</option><option>女</option><option>其他</option></select>
                <input value={age} onChange={e => setAge(e.target.value)} placeholder="年龄"
                  className="px-3 py-2 text-xs rounded-xl bg-[#0C0C14] border border-white/10 text-white/80" />
              </div>

              <div><div className="text-[10px] text-white/40 mb-1.5">外貌</div>
                <div className="grid grid-cols-3 gap-2">
                  <input value={hairStyle} onChange={e => setHairStyle(e.target.value)} placeholder="发型" className="px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/80" />
                  <input value={height} onChange={e => setHeight(e.target.value)} placeholder="身高" className="px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/80" />
                  <input value={bodyType} onChange={e => setBodyType(e.target.value)} placeholder="体型" className="px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/80" />
                </div>
              </div>

              <div><div className="text-[10px] text-white/40 mb-1.5">服饰</div>
                <div className="grid grid-cols-3 gap-2">
                  <input value={top} onChange={e => setTop(e.target.value)} placeholder="上衣" className="px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/80" />
                  <input value={bottom} onChange={e => setBottom(e.target.value)} placeholder="下装" className="px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/80" />
                  <input value={shoes} onChange={e => setShoes(e.target.value)} placeholder="鞋子" className="px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/80" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input value={personality} onChange={e => setPersonality(e.target.value)} placeholder="性格特点" className="px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/80" />
                <select value={styleHint} onChange={e => setStyleHint(e.target.value)}
                  className="px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/60">
                  <option>写实电影风格</option><option>日系动漫</option><option>国风水墨</option><option>赛博朋克</option><option>皮克斯3D</option><option>油画风格</option>
                </select>
              </div>

              {/* AI 生成模式 */}
              {mode === "ai" && (
                <>
                  <button onClick={handleGenerate} disabled={generating || !name.trim()}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold disabled:opacity-40">
                    {generating ? "🔄 生成中..." : "🎨 AI 生成角色形象"}
                  </button>
                  {candidates.length > 0 && (
                    <div>
                      <div className="text-[10px] text-white/40 mb-1.5">选择一张作为角色形象</div>
                      <div className="grid grid-cols-2 gap-2">
                        {candidates.map((url, i) => (
                          <div key={i} onClick={() => { setSelectedImage(url); setSelectedImages([url]) }}
                            className={`aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedImage === url ? "border-[#F59E0B] ring-1 ring-[#F59E0B]/30" : "border-white/10 hover:border-white/30"}`}>
                            <img src={url} alt={`候选 ${i+1}`} className="w-full h-full object-cover" />
                            {selectedImage === url && <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#F59E0B] flex items-center justify-center text-[8px]">✓</div>}
                          </div>
                        ))}
                      </div>
                      {/* AI 模式：保存按钮 */}
                      <button onClick={handleSave} disabled={!selectedImage}
                        className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
                        💾 保存角色
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* 上传模式：选择即保存 */}
              {mode === "upload" && (
                <div className="text-center">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadAndSave} hidden />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="px-6 py-3 rounded-xl bg-white/[0.04] text-white/60 text-xs border border-white/[0.06] hover:bg-white/[0.08]">
                    {uploading ? "处理中..." : "📁 选择图片上传并保存"}
                  </button>
                  {uploading && <div className="text-[10px] text-white/30 mt-2 animate-pulse">处理中...</div>}
                  {candidates.length > 0 && (
                    <div className="mt-3 space-y-3">
                      <img src={candidates[0]} className="rounded-xl w-40 mx-auto aspect-[3/4] object-cover border border-white/10" />
                      <button onClick={handleSave} disabled={!name.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
                        💾 保存角色
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 编辑模式：保存修改 */}
              {editingChar && (
                <button onClick={() => {
                  const imageUrl = selectedImage || (candidates.length > 0 ? candidates[0] : "")
                  if (!imageUrl || !name.trim()) return
                  const char: CharacterTemplate = { ...editingChar, name: name.trim(), description: `${gender}性·${age}·${personality}`, referenceImages: { front: imageUrl }, thumbnailUrl: imageUrl, updatedAt: new Date().toISOString() }
                  saveCharacter(char)
                  setChars(loadCharacters())
                  setShowCreator(false); resetForm()
                  onSelect?.(char)
                }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">💾 保存修改</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
