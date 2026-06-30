// ─── 官方场景模板库 ─────────────────────────────
// 30个预设场景模板 + picsum.photos 预览图

export interface SceneTemplate {
  id: string; name: string; icon: string; category: string
  description?: string; previewUrl?: string
  params: { environment: string; lighting: string; colorTone: string
    timeOfDay: string; mood: string; visualStyle: string; soundDesign: string }
}

const P = (id: string) => `https://picsum.photos/seed/${id}/400/225`

export const SCENE_TEMPLATES: SceneTemplate[] = [
  { id:"st_01",name:"赛博朋克夜城",icon:"🌃",category:"城市",description:"霓虹灯雨夜街道，冷色调反射积水",previewUrl:P("st_01"),
    params:{environment:"霓虹灯雨夜街道，积水反射灯光",lighting:"霓虹灯光",colorTone:"赛博朋克紫蓝",timeOfDay:"夜晚",mood:"悬疑神秘",visualStyle:"赛博朋克霓虹",soundDesign:"电子配乐"}},
  { id:"st_02",name:"日系咖啡馆",icon:"☕",category:"城市",previewUrl:P("st_02"),
    params:{environment:"复古木质咖啡馆，窗外午后阳光",lighting:"柔光",colorTone:"暖色调",timeOfDay:"黄昏",mood:"温馨浪漫",visualStyle:"电影级浅景深",soundDesign:"爵士乐"}},
  { id:"st_03",name:"东京涉谷",icon:"🗼",category:"城市",previewUrl:P("st_03"),
    params:{environment:"涉谷十字路口，密集人流",lighting:"混合色温",colorTone:"高饱和",timeOfDay:"蓝色时刻",mood:"急促",visualStyle:"广角畸变",soundDesign:"市井嘈杂"}},
  { id:"st_04",name:"香港旧巷",icon:"🏮",category:"城市",previewUrl:P("st_04"),
    params:{environment:"旧巷霓虹招牌林立",lighting:"霓虹灯光",colorTone:"橙青对比",timeOfDay:"夜晚",mood:"悬疑神秘",visualStyle:"手持晃动",soundDesign:"环境雨声"}},
  { id:"st_05",name:"纽约loft",icon:"🏙️",category:"城市",previewUrl:P("st_05"),
    params:{environment:"工业风loft落地窗",lighting:"自然光",colorTone:"低饱和",timeOfDay:"清晨",mood:"宁静",visualStyle:"轨道平滑",soundDesign:"白噪音"}},
  { id:"st_20",name:"地下停车场",icon:"🚗",category:"城市",previewUrl:P("st_20"),
    params:{environment:"空旷停车场日光灯闪烁",lighting:"顶光",colorTone:"冷色调",timeOfDay:"深夜",mood:"紧张",visualStyle:"荷兰角",soundDesign:"心跳声"}},
  { id:"st_25",name:"雨中霓虹街",icon:"🌧️",category:"城市",previewUrl:P("st_25"),
    params:{environment:"雨夜霓虹倒影柏油路",lighting:"霓虹灯光",colorTone:"互补色",timeOfDay:"夜晚",mood:"孤独",visualStyle:"慢动作",soundDesign:"雨声"}},
  { id:"st_30",name:"赛博地铁",icon:"🚇",category:"城市",previewUrl:P("st_30"),
    params:{environment:"未来地铁全息广告闪烁",lighting:"混合色温",colorTone:"赛博紫蓝",timeOfDay:"深夜",mood:"孤独",visualStyle:"广角畸变",soundDesign:"电子"}},
  { id:"st_06",name:"热带雨林",icon:"🌴",category:"自然",previewUrl:P("st_06"),
    params:{environment:"雨林阳光穿过树冠",lighting:"自然光",colorTone:"高饱和",timeOfDay:"清晨",mood:"宁静",visualStyle:"FPV视角",soundDesign:"白噪音"}},
  { id:"st_07",name:"冰雪小镇",icon:"❄️",category:"自然",previewUrl:P("st_07"),
    params:{environment:"冰雪木屋极光在天空舞动",lighting:"蓝色时刻",colorTone:"冷色调",timeOfDay:"夜晚",mood:"宁静",visualStyle:"轨道平滑",soundDesign:"风声"}},
  { id:"st_08",name:"废弃厂房",icon:"🏭",category:"自然",previewUrl:P("st_08"),
    params:{environment:"废弃厂房顶光穿透破窗",lighting:"顶光",colorTone:"低饱和",timeOfDay:"正午",mood:"压抑",visualStyle:"手持晃动",soundDesign:"静默"}},
  { id:"st_09",name:"摩洛哥集市",icon:"🏺",category:"自然",previewUrl:P("st_09"),
    params:{environment:"集市阳光透过彩色布幔",lighting:"硬光",colorTone:"高饱和",timeOfDay:"正午",mood:"急促",visualStyle:"广角畸变",soundDesign:"嘈杂"}},
  { id:"st_14",name:"海底古城",icon:"🌊",category:"自然",previewUrl:P("st_14"),
    params:{environment:"沉没古城阳光穿透水面",lighting:"柔光",colorTone:"冷色调",timeOfDay:"黎明",mood:"神秘",visualStyle:"FPV视角",soundDesign:"静默"}},
  { id:"st_18",name:"雪山峰顶",icon:"🏔️",category:"自然",previewUrl:P("st_18"),
    params:{environment:"雪山云海翻涌夕阳染红",lighting:"黄金时刻",colorTone:"暖色调",timeOfDay:"黄昏",mood:"宏大意境",visualStyle:"无人机航拍",soundDesign:"风声"}},
  { id:"st_27",name:"沙漠废墟",icon:"🏜️",category:"自然",previewUrl:P("st_27"),
    params:{environment:"沙漠古城废墟烈日当空",lighting:"硬光",colorTone:"褪色胶片",timeOfDay:"正午",mood:"荒凉",visualStyle:"无人机航拍",soundDesign:"风声"}},
  { id:"st_29",name:"森林木屋",icon:"🪵",category:"自然",previewUrl:P("st_29"),
    params:{environment:"密林木屋壁炉火光雪地",lighting:"烛光",colorTone:"暖色调",timeOfDay:"夜晚",mood:"温馨",visualStyle:"浅景深",soundDesign:"风声"}},
  { id:"st_10",name:"未来实验室",icon:"🔬",category:"科幻",previewUrl:P("st_10"),
    params:{environment:"白色实验室全息投影",lighting:"顶光",colorTone:"冷色调",timeOfDay:"黎明",mood:"神秘",visualStyle:"轨道平滑",soundDesign:"电子"}},
  { id:"st_13",name:"星际飞船舱",icon:"🚀",category:"科幻",previewUrl:P("st_13"),
    params:{environment:"飞船内部全息面板星空",lighting:"顶光",colorTone:"冷色调",timeOfDay:"深夜",mood:"神秘",visualStyle:"轨道平滑",soundDesign:"电子"}},
  { id:"st_22",name:"太空站绿洲",icon:"🌱",category:"科幻",previewUrl:P("st_22"),
    params:{environment:"太空温室植物环绕水滴",lighting:"柔光",colorTone:"高饱和",timeOfDay:"黎明",mood:"宁静",visualStyle:"轨道平滑",soundDesign:"管弦"}},
  { id:"st_23",name:"蒸汽工坊",icon:"⚙️",category:"科幻",previewUrl:P("st_23"),
    params:{environment:"蒸汽工坊齿轮铜质管道",lighting:"烛光",colorTone:"暖色调",timeOfDay:"黄昏",mood:"温馨",visualStyle:"广角畸变",soundDesign:"管弦"}},
  { id:"st_11",name:"古风竹林",icon:"🎋",category:"古风",previewUrl:P("st_11"),
    params:{environment:"竹林雾气缭绕青石小径",lighting:"黄金时刻",colorTone:"森系绿",timeOfDay:"清晨",mood:"宁静",visualStyle:"浅景深",soundDesign:"古风"}},
  { id:"st_12",name:"赛博禅寺",icon:"🏯",category:"古风",previewUrl:P("st_12"),
    params:{environment:"寺庙全息投影樱花飘落",lighting:"混合色温",colorTone:"赛博紫蓝",timeOfDay:"蓝色时刻",mood:"超现实",visualStyle:"赛博霓虹",soundDesign:"电子"}},
  { id:"st_15",name:"昏暗审讯室",icon:"💡",category:"室内",previewUrl:P("st_15"),
    params:{environment:"黑暗房间台灯直射桌面",lighting:"硬光",colorTone:"低饱和",timeOfDay:"深夜",mood:"紧张",visualStyle:"手持晃动",soundDesign:"心跳"}},
  { id:"st_19",name:"教堂内部",icon:"⛪",category:"室内",previewUrl:P("st_19"),
    params:{environment:"哥特教堂彩色玻璃光束",lighting:"柔光",colorTone:"暖色调",timeOfDay:"黄昏",mood:"宁静",visualStyle:"轨道平滑",soundDesign:"教堂混响"}},
  { id:"st_26",name:"空荡画廊",icon:"🖼️",category:"室内",previewUrl:P("st_26"),
    params:{environment:"纯白画廊射灯照亮画作",lighting:"顶光",colorTone:"单色调",timeOfDay:"正午",mood:"宁静",visualStyle:"轨道平滑",soundDesign:"静默"}},
  { id:"st_28",name:"浴室迷雾",icon:"💨",category:"室内",previewUrl:P("st_28"),
    params:{environment:"蒸汽浴室壁灯模糊水滴",lighting:"柔光",colorTone:"暖色调",timeOfDay:"蓝色时刻",mood:"神秘",visualStyle:"浅景深",soundDesign:"雨声"}},
  { id:"st_16",name:"天台黄昏",icon:"🌅",category:"浪漫",previewUrl:P("st_16"),
    params:{environment:"城市天台黄昏金色光线",lighting:"黄金时刻",colorTone:"暖色调",timeOfDay:"黄昏",mood:"浪漫",visualStyle:"浅景深",soundDesign:"管弦"}},
  { id:"st_17",name:"搏击场",icon:"🥊",category:"动作",previewUrl:P("st_17"),
    params:{environment:"地下搏击聚光灯擂台",lighting:"硬光",colorTone:"高饱和",timeOfDay:"深夜",mood:"紧张",visualStyle:"手持晃动",soundDesign:"心跳"}},
  { id:"st_21",name:"香港茶餐厅",icon:"🍜",category:"怀旧",previewUrl:P("st_21"),
    params:{environment:"老式茶餐厅霓虹灯牌",lighting:"混合色温",colorTone:"褪色胶片",timeOfDay:"黄昏",mood:"温馨",visualStyle:"胶片质感",soundDesign:"嘈杂"}},
  { id:"st_24",name:"梦境虚空",icon:"🌀",category:"抽象",previewUrl:P("st_24"),
    params:{environment:"纯白虚空几何体漂浮",lighting:"柔光",colorTone:"单色调",timeOfDay:"蓝色时刻",mood:"超现实",visualStyle:"轨道平滑",soundDesign:"电子"}},
]

export function getTemplatesByCategory(c: string): SceneTemplate[] {
  return !c || c === "全部" ? SCENE_TEMPLATES : SCENE_TEMPLATES.filter(t => t.category === c)
}

export const TEMPLATE_CATEGORIES = ["全部","城市","自然","科幻","古风","室内","浪漫","动作","怀旧","抽象"]
