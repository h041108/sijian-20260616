"use client"

import { useState, useCallback } from "react"

export interface FilmParams {
  visualStyle: string
  lensFocal: string
  shotScale: string
  cameraAngle: string
  cameraMove: string
  lighting: string
  colorTone: string
  environment: string
  timeOfDay: string
  mood: string
  actionDesc: string
  soundDesign: string
  editRhythm: string
}

// ─── 导演控制台参数预设 ─── 每个参数都有导演术语和中文说明
const DIRECTOR_PARAMS: Record<string, {
  label: string
  icon: string
  category: string  // 属于哪组（视觉/镜头/光影/氛围/节奏）
  presets: string[]
  placeholder?: string
}> = {
  visualStyle: {
    label: "视觉风格", icon: "🎬", category: "视觉",
    presets: ["FPV第一人称视角","无人机航拍视角","电影级浅景深","纪实跟拍风格","赛博朋克霓虹","胶片颗粒质感","急速运动镜头","广角畸变夸张","慢动作诗意","手持晃动写实","轨道平滑运镜","微距特写"],
  },
  lensFocal: {
    label: "镜头焦段", icon: "🔭", category: "镜头",
    presets: ["超广角14mm（夸张透视）","广角24mm（环境叙事）","标准35mm（人文视角）","中焦50mm（人眼视角）","中长焦85mm（人像特写）","长焦200mm（压缩空间）","微距（细节放大）"],
  },
  shotScale: {
    label: "景别", icon: "📐", category: "镜头",
    presets: ["远景（环境全貌）","全景（全身+环境）","中景（腰部以上）","近景（胸部以上）","特写（局部细节）","大特写（极近距离）"],
  },
  cameraAngle: {
    label: "拍摄角度", icon: "📍", category: "镜头",
    presets: ["平视（客观视角）","俯视（上帝视角）","仰视（压迫感）","荷兰角（倾斜不安）","过肩镜头","主观视角POV","航拍顶视"],
  },
  cameraMove: {
    label: "运镜方式", icon: "🎯", category: "镜头",
    presets: ["固定镜头（三脚架）","推（缓慢靠近）","拉（缓慢远离）","摇（水平旋转）","仰俯（垂直转动）","跟拍（平行跟随）","环绕（围绕主体）","斯坦尼康（平滑行走）","手持（纪实晃动）","航拍（无人机）","滑动变焦（希区柯克）","穿梭（穿越障碍物）"],
  },
  lighting: {
    label: "光线设计", icon: "💡", category: "光影",
    presets: ["自然光（日光）","黄金时刻（日落前1h）","蓝色时刻（日落后）","硬光（直射高反差）","柔光（散射柔和）","逆光（剪影轮廓）","侧光（立体感）","顶光（戏剧压抑）","底光（恐怖诡异）","霓虹灯光","烛光（温暖亲密）","混合色温（电影感）"],
  },
  colorTone: {
    label: "色彩基调", icon: "🎨", category: "光影",
    presets: ["暖色调（橙黄温馨）","冷色调（蓝青冷静）","高饱和（鲜艳活力）","低饱和（忧郁写实）","单色调（艺术感）","互补色对比（橙青电影感）","褪色旧胶片","赛博朋克紫蓝","森系绿色","黑白"],
  },
  environment: {
    label: "环境设定", icon: "🏔️", category: "视觉",
    presets: [], placeholder: "例如：拥挤的摩洛哥集市，阳光强烈",
  },
  timeOfDay: {
    label: "时间背景", icon: "⏰", category: "光影",
    presets: ["黎明（蓝调雾气）","清晨（柔光清新）","正午（顶光高反差）","黄昏（黄金光线）","蓝调时刻（日落后）","夜晚（人造光源）","深夜（冷清暗部细节）"],
  },
  mood: {
    label: "氛围情绪", icon: "🎭", category: "氛围",
    presets: ["紧张不安","温馨浪漫","孤独压抑","悬疑神秘","宏大史诗","急促紧迫","宁静平和","荒诞幽默","恐惧惊悚","梦幻超现实"],
  },
  actionDesc: {
    label: "动作说明", icon: "🏃", category: "氛围",
    presets: [], placeholder: "例如：镜头紧跟主角穿过拥挤的人群，推翻水果摊...",
  },
  soundDesign: {
    label: "声音设计", icon: "🔔", category: "节奏",
    presets: ["环境雨声","风声","市井嘈杂","管弦配乐","电子配乐","古风配乐","静默（悬疑）","心跳声（紧张）","教堂混响","隧道混响","自然白噪音"],
  },
  editRhythm: {
    label: "剪辑节奏", icon: "⚡", category: "节奏",
    presets: ["快剪（急促动作戏）","慢剪（舒缓文戏）","长镜头（一镜到底）","交叉剪辑（平行叙事）","跳切（时间跳跃）","匹配剪辑（视觉衔接）"],
  },
}

// ─── 参数分组 ───
const PARAM_GROUPS = [
  { key: "visual", label: "👁️ 视觉", desc: "画面呈现方式", color: "from-violet-500 to-purple-500" },
  { key: "camera", label: "📷 镜头", desc: "焦段/景别/角度/运镜", color: "from-blue-500 to-cyan-500" },
  { key: "light", label: "💡 光影", desc: "光线/色彩/时间", color: "from-amber-500 to-yellow-500" },
  { key: "atmosphere", label: "🎭 氛围", desc: "情绪/动作/环境", color: "from-pink-500 to-rose-500" },
  { key: "rhythm", label: "⚡ 节奏", desc: "声音/剪辑", color: "from-teal-500 to-emerald-500" },
]

const CATEGORY_MAP: Record<string, string> = {
  visualStyle: "visual",
  lensFocal: "camera", shotScale: "camera", cameraAngle: "camera", cameraMove: "camera",
  lighting: "light", colorTone: "light", timeOfDay: "light",
  mood: "atmosphere", actionDesc: "atmosphere", environment: "atmosphere",
  soundDesign: "rhythm", editRhythm: "rhythm",
}

interface FilmParametersProps {
  genre: string
  onChange: (params: FilmParams) => void
}

export default function FilmParameters({ genre, onChange }: FilmParametersProps) {
  const [params, setParams] = useState<FilmParams>({
    visualStyle: genre === "comic" ? "日系动漫" : "电影级浅景深",
    lensFocal: "", shotScale: "", cameraAngle: "", cameraMove: "",
    lighting: "", colorTone: "", environment: "", timeOfDay: "",
    mood: "", actionDesc: "", soundDesign: "", editRhythm: "",
  })
  const [open, setOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState("visual")

  const update = useCallback((key: keyof FilmParams, value: string) => {
    const next = { ...params, [key]: value }
    setParams(next)
    onChange(next)
  }, [params, onChange])

  // 计算已配置的参数数量
  const configuredCount = Object.values(params).filter(v => v.trim()).length
  const totalParams = Object.keys(DIRECTOR_PARAMS).length

  // 按分组归类参数
  const getGroupParams = (groupKey: string) => {
    return Object.entries(DIRECTOR_PARAMS).filter(([k]) => CATEGORY_MAP[k] === groupKey)
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* ── 导演控制台标题 ── */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#F97316]/20 border border-[#F59E0B]/20 flex items-center justify-center text-lg">
            🎬
          </div>
          <div>
            <div className="text-sm font-bold text-white/80">导演控制台</div>
            <div className="text-[10px] text-white/30">
              {configuredCount > 0
                ? `已配置 ${configuredCount}/${totalParams} 项参数`
                : "13项电影制作级参数，让你像导演一样掌控每一帧"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {configuredCount > 0 && (
            <div className="flex gap-1">
              {Object.entries(params).filter(([k, v]) => v.trim()).slice(0, 4).map(([k, v]) => (
                <span key={k} className="px-2 py-0.5 text-[8px] rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B]/70">
                  {DIRECTOR_PARAMS[k]?.icon} {v.slice(0, 12)}
                </span>
              ))}
            </div>
          )}
          <span className="text-white/20 text-sm">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {/* ── 展开后的控制台 ── */}
      {open && (
        <div className="border-t border-white/[0.06]">
          {/* 分组导航 */}
          <div className="flex gap-1 px-5 pt-3 pb-2">
            {PARAM_GROUPS.map(g => {
              const groupParams = getGroupParams(g.key)
              const groupConfigured = groupParams.filter(([k]) => params[k as keyof FilmParams]?.trim()).length
              return (
                <button key={g.key} onClick={() => setActiveGroup(g.key)}
                  className={`flex-1 flex items-center justify-between px-2 py-2 rounded-xl text-[10px] transition-all ${
                    activeGroup === g.key
                      ? "bg-white/[0.06] text-white/80 border border-white/10"
                      : "text-white/30 hover:text-white/50 border border-transparent"
                  }`}>
                  <span>{g.label}</span>
                  {groupConfigured > 0 && (
                    <span className={`w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${
                      activeGroup === g.key ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-white/10 text-white/40"
                    }`}>{groupConfigured}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 参数面板 */}
          <div className="px-5 pb-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {getGroupParams(activeGroup).map(([key, config]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{config.icon}</span>
                  <span className="text-xs font-medium text-white/60">{config.label}</span>
                  {params[key as keyof FilmParams]?.trim() && (
                    <button onClick={() => update(key as keyof FilmParams, "")}
                      className="text-[8px] text-white/20 hover:text-white/40">✕ 清除</button>
                  )}
                </div>
                {config.presets.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {config.presets.map(p => (
                      <button key={p} onClick={() => update(key as keyof FilmParams, params[key as keyof FilmParams] === p ? "" : p)}
                        className={`px-3 py-1.5 text-[10px] rounded-lg border transition-all ${
                          params[key as keyof FilmParams] === p
                            ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]"
                            : "border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/15"
                        }`}>{p}</button>
                    ))}
                    <input value={params[key as keyof FilmParams] || ""} onChange={e => update(key as keyof FilmParams, e.target.value)}
                      placeholder="自定义..." className="w-20 px-2 py-1.5 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/50 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
                  </div>
                ) : key === "actionDesc" ? (
                  <textarea value={params.actionDesc} onChange={e => update("actionDesc", e.target.value)}
                    placeholder={config.placeholder || "描述动作细节..."}
                    rows={3} className="w-full text-[11px] bg-[#0C0C14] rounded-xl p-3 text-white/60 border border-white/10 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40 leading-relaxed" />
                ) : (
                  <input value={params[key as keyof FilmParams] || ""} onChange={e => update(key as keyof FilmParams, e.target.value)}
                    placeholder={config.placeholder || "自由输入..."}
                    className="w-full px-3 py-2 text-[11px] bg-[#0C0C14] rounded-xl border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
                )}
              </div>
            ))}
          </div>

          {/* ── 当前配置摘要 ── */}
          {configuredCount > 0 && (
            <div className="px-5 pb-4">
              <div className="rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15 p-3">
                <div className="text-[9px] text-[#F59E0B]/60 font-medium mb-1">📋 当前导演参数摘要</div>
                <div className="text-[10px] text-white/50 leading-relaxed">
                  {Object.entries(params).filter(([_, v]) => v.trim()).map(([k, v]) => (
                    <span key={k}>{DIRECTOR_PARAMS[k]?.icon}{v} · </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
