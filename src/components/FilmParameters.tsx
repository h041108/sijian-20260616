"use client"

import { useState } from "react"

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

const PRESETS: Record<string, string[]> = {
  visualStyle: ["FPV第一人称视角","无人机航拍视角","电影级浅景深","纪实跟拍风格","赛博朋克霓虹","胶片颗粒质感","急速运动镜头","广角畸变夸张","慢动作诗意","手持晃动写实","轨道平滑运镜","微距特写"],
  lensFocal: ["超广角14mm（夸张透视）","广角24mm（环境叙事）","标准35mm（人文视角）","中焦50mm（人眼视角）","中长焦85mm（人像特写）","长焦200mm（压缩空间）","微距（细节放大）"],
  shotScale: ["远景（环境全貌）","全景（全身+环境）","中景（腰部以上）","近景（胸部以上）","特写（局部细节）","大特写（极近距离）"],
  cameraAngle: ["平视（客观视角）","俯视（上帝视角）","仰视（压迫感）","荷兰角（倾斜不安）","过肩镜头","主观视角POV","航拍顶视"],
  cameraMove: ["固定镜头（三脚架）","推（缓慢靠近）","拉（缓慢远离）","摇（水平旋转）","仰俯（垂直转动）","跟拍（平行跟随）","环绕（围绕主体）","斯坦尼康（平滑行走）","手持（纪实晃动）","航拍（无人机）","滑动变焦（希区柯克）","穿梭（穿越障碍物）"],
  lighting: ["自然光（日光）","黄金时刻（日落前1h）","蓝色时刻（日落后）","硬光（直射高反差）","柔光（散射柔和）","逆光（剪影轮廓）","侧光（立体感）","顶光（戏剧压抑）","底光（恐怖诡异）","霓虹灯光","烛光（温暖亲密）","混合色温（电影感）"],
  colorTone: ["暖色调（橙黄温馨）","冷色调（蓝青冷静）","高饱和（鲜艳活力）","低饱和（忧郁写实）","单色调（艺术感）","互补色对比（橙青电影感）","褪色旧胶片","赛博朋克紫蓝","森系绿色","黑白"],
  timeOfDay: ["黎明（蓝调雾气）","清晨（柔光清新）","正午（顶光高反差）","黄昏（黄金光线）","蓝调时刻（日落后）","夜晚（人造光源）","深夜（冷清暗部细节）"],
  mood: ["紧张不安","温馨浪漫","孤独压抑","悬疑神秘","宏大史诗","急促紧迫","宁静平和","荒诞幽默","恐惧惊悚","梦幻超现实"],
  soundDesign: ["环境雨声","风声","市井嘈杂","管弦配乐","电子配乐","古风配乐","静默（悬疑）","心跳声（紧张）","教堂混响","隧道混响","自然白噪音"],
  editRhythm: ["快剪（急促动作戏）","慢剪（舒缓文戏）","长镜头（一镜到底）","交叉剪辑（平行叙事）","跳切（时间跳跃）","匹配剪辑（视觉衔接）"],
}

interface FilmParametersProps {
  genre: string
  onChange: (params: FilmParams) => void
}

export default function FilmParameters({ genre, onChange }: FilmParametersProps) {
  const [open, setOpen] = useState(false)
  const [params, setParams] = useState<FilmParams>({
    visualStyle: genre === "comic" ? "日系动漫" : "电影级浅景深",
    lensFocal: "", shotScale: "", cameraAngle: "", cameraMove: "",
    lighting: "", colorTone: "", environment: "", timeOfDay: "",
    mood: "", actionDesc: "", soundDesign: "", editRhythm: "",
  })

  const update = (key: keyof FilmParams, value: string) => {
    const next = { ...params, [key]: value }
    setParams(next)
    onChange(next)
  }

  const paramLabels: Record<string, string> = {
    visualStyle: "视觉风格", lensFocal: "镜头焦段", shotScale: "景别/画幅",
    cameraAngle: "拍摄角度", cameraMove: "运镜方式", lighting: "光线设计",
    colorTone: "色彩基调", environment: "环境设定", timeOfDay: "时间背景",
    mood: "氛围情绪", actionDesc: "动作说明", soundDesign: "声音设计",
    editRhythm: "剪辑节奏",
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-xs text-white/50 font-medium hover:text-white/70 transition-colors w-full text-left">
        <span>🎬</span> 电影制作参数 {open ? "▾" : "▸"}
        <span className="text-[9px] text-white/20 ml-1">还原真实拍摄场景</span>
      </button>

      {open && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {(Object.keys(paramLabels) as (keyof FilmParams)[]).map(key => {
            const presets = PRESETS[key]
            return (
              <div key={key}>
                <label className="text-[9px] text-white/40 mb-1 block">{paramLabels[key]}</label>
                {presets ? (
                  <div className="flex flex-wrap gap-1">
                    {presets.map(p => (
                      <button key={p} onClick={() => update(key, params[key] === p ? "" : p)}
                        className={`px-2 py-0.5 text-[9px] rounded-full border transition-all ${
                          params[key] === p
                            ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]"
                            : "border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/15"
                        }`}>{p}</button>
                    ))}
                    <input value={params[key]} onChange={e => update(key, e.target.value)}
                      placeholder="或自填..." className="w-24 px-2 py-0.5 text-[9px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/50 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
                  </div>
                ) : key === "actionDesc" ? (
                  <textarea value={params.actionDesc} onChange={e => update("actionDesc", e.target.value)}
                    placeholder="自由输入动作描述，例如：镜头紧跟主角穿过拥挤的人群，推翻水果摊..."
                    rows={2} className="w-full text-[10px] bg-[#0C0C14] rounded-lg p-2 text-white/60 border border-white/10 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
                ) : (
                  <input value={params.environment} onChange={e => update("environment", e.target.value)}
                    placeholder="例如：拥挤的摩洛哥集市，阳光强烈" className="w-full px-2 py-1.5 text-[10px] bg-[#0C0C14] rounded-lg border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {!open && params.actionDesc && (
        <div className="text-[9px] text-white/30 line-clamp-1">动作：{params.actionDesc.slice(0, 60)}</div>
      )}
    </div>
  )
}
