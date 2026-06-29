// ─── 官方场景模板库 ─────────────────────────────
// 30个预设场景模板，用户可在素材库中选用
// 选中后自动填入影片工厂的环境/光线/色调等参数

export interface SceneTemplate {
  id: string
  name: string
  icon: string
  category: string
  description: string
  params: {
    environment: string
    lighting: string
    colorTone: string
    timeOfDay: string
    mood: string
    visualStyle: string
    soundDesign: string
  }
}

export const SCENE_TEMPLATES: SceneTemplate[] = [
  // ─── 城市/现代 ───
  { id:"st_01",name:"赛博朋克夜城",icon:"🌃",category:"城市",
    description:"霓虹灯雨夜街道，冷色调，反射积水",
    params:{environment:"霓虹灯雨夜街道，高楼林立，积水反射灯光",lighting:"霓虹灯光",colorTone:"赛博朋克紫蓝",timeOfDay:"夜晚",mood:"悬疑神秘",visualStyle:"赛博朋克霓虹",soundDesign:"电子配乐"} },
  { id:"st_02",name:"日系咖啡馆",icon:"☕",category:"城市",
    description:"复古木质咖啡馆，暖色灯光，午后阳光",
    params:{environment:"复古木质咖啡馆，暖色灯光，窗外午后阳光",lighting:"柔光（散射柔和）",colorTone:"暖色调（橙黄温馨）",timeOfDay:"黄昏（黄金光线）",mood:"温馨浪漫",visualStyle:"电影级浅景深",soundDesign:"爵士乐"} },
  { id:"st_03",name:"东京涉谷十字路口",icon:"🗼",category:"城市",
    description:"繁忙的十字路口，人流穿梭，巨大霓虹广告牌",
    params:{environment:"东京涉谷十字路口，密集人流，巨型霓虹广告牌",lighting:"混合色温（电影感）",colorTone:"高饱和（鲜艳活力）",timeOfDay:"蓝色时刻（日落后）",mood:"急促紧迫",visualStyle:"广角畸变夸张",soundDesign:"市井嘈杂"} },
  { id:"st_04",name:"香港旧巷",icon:"🏮",category:"城市",
    description:"狭窄的香港旧巷，霓虹招牌，潮湿地面",
    params:{environment:"狭窄香港旧巷，霓虹招牌林立，潮湿地面反射灯光",lighting:"霓虹灯光",colorTone:"互补色对比（橙青电影感）",timeOfDay:"夜晚",mood:"悬疑神秘",visualStyle:"手持晃动写实",soundDesign:"环境雨声"} },
  { id:"st_05",name:"纽约 loft 公寓",icon:"🏙️",category:"城市",
    description:"宽敞的工业风 loft，落地窗，城市天际线",
    params:{environment:"工业风 loft 公寓，落地窗，窗外纽约天际线",lighting:"自然光（日光）",colorTone:"低饱和（忧郁写实）",timeOfDay:"清晨（柔光清新）",mood:"宁静平和",visualStyle:"轨道平滑运镜",soundDesign:"自然白噪音"} },

  // ─── 自然/户外 ───
  { id:"st_06",name:"热带雨林",icon:"🌴",category:"自然",
    description:"茂密的热带雨林，阳光穿过树冠，雾气缭绕",
    params:{environment:"茂密热带雨林，阳光穿过树冠，雾气缭绕，藤蔓垂落",lighting:"自然光（日光）",colorTone:"高饱和（鲜艳活力）",timeOfDay:"清晨（柔光清新）",mood:"宁静平和",visualStyle:"FPV第一人称视角",soundDesign:"自然白噪音"} },
  { id:"st_07",name:"北欧冰雪小镇",icon:"❄️",category:"自然",
    description:"冰雪覆盖的北欧小镇，极光在天空舞动",
    params:{environment:"冰雪覆盖的北欧小镇，木屋积雪，极光在天空舞动",lighting:"蓝色时刻（日落后）",colorTone:"冷色调（蓝青冷静）",timeOfDay:"夜晚",mood:"宁静平和",visualStyle:"轨道平滑运镜",soundDesign:"风声"} },
  { id:"st_08",name:"废弃工业厂房",icon:"🏭",category:"自然",
    description:"废弃工业厂房，铁锈，顶光，灰尘粒子",
    params:{environment:"废弃工业厂房，铁锈斑驳，顶光穿透破窗，灰尘粒子飘浮",lighting:"顶光（戏剧压抑）",colorTone:"低饱和（忧郁写实）",timeOfDay:"正午（顶光高反差）",mood:"孤独压抑",visualStyle:"手持晃动写实",soundDesign:"静默（悬疑）"} },
  { id:"st_09",name:"摩洛哥集市",icon:"🏺",category:"自然",
    description:"拥挤的摩洛哥集市，阳光强烈，色彩斑斓的布料",
    params:{environment:"拥挤的摩洛哥集市，阳光透过彩色布幔，香料和地毯摊位",lighting:"硬光（直射高反差）",colorTone:"高饱和（鲜艳活力）",timeOfDay:"正午（顶光高反差）",mood:"急促紧迫",visualStyle:"广角畸变夸张",soundDesign:"市井嘈杂"} },
  { id:"st_10",name:"未来主义实验室",icon:"🔬",category:"科幻",
    description:"白色极简实验室，冷白灯光，全息投影，金属质感",
    params:{environment:"白色极简实验室，冷白灯光，全息投影界面，金属质感表面",lighting:"顶光（戏剧压抑）",colorTone:"冷色调（蓝青冷静）",timeOfDay:"黎明（蓝调雾气）",mood:"悬疑神秘",visualStyle:"轨道平滑运镜",soundDesign:"电子配乐"} },

  // ─── 古风/历史 ───
  { id:"st_11",name:"古风竹林",icon:"🎋",category:"古风",
    description:"竹林深处，雾气缭绕，清晨柔光，小径蜿蜒",
    params:{environment:"竹林深处，雾气缭绕，青石小径蜿蜒，晨露晶莹",lighting:"黄金时刻（日落前1h）",colorTone:"森系绿色",timeOfDay:"清晨（柔光清新）",mood:"宁静平和",visualStyle:"电影级浅景深",soundDesign:"古风配乐"} },
  { id:"st_12",name:"赛博禅寺",icon:"🏯",category:"古风",
    description:"传统寺庙与全息投影融合，樱花飘落，霓虹灯点缀",
    params:{environment:"传统日式寺庙，全息投影经幡，樱花飘落，霓虹灯点缀石阶",lighting:"混合色温（电影感）",colorTone:"赛博朋克紫蓝",timeOfDay:"蓝色时刻（日落后）",mood:"梦幻超现实",visualStyle:"赛博朋克霓虹",soundDesign:"电子配乐"} },
  { id:"st_13",name:"星际飞船舱内",icon:"🚀",category:"科幻",
    description:"飞船内部，冷白灯光，全息控制面板，宇宙窗口可见星空",
    params:{environment:"星际飞船内部，冷白灯光，全息控制面板，圆形窗口可见星空",lighting:"顶光（戏剧压抑）",colorTone:"冷色调（蓝青冷静）",timeOfDay:"深夜（冷清暗部细节）",mood:"悬疑神秘",visualStyle:"轨道平滑运镜",soundDesign:"电子配乐"} },
  { id:"st_14",name:"海底古城废墟",icon:"🌊",category:"自然",
    description:"沉没古城废墟，光线从水面穿透，鱼群游弋，苔藓覆盖石柱",
    params:{environment:"沉没古城废墟，阳光从水面穿透形成光束，鱼群游弋，苔藓覆盖石柱",lighting:"柔光（散射柔和）",colorTone:"冷色调（蓝青冷静）",timeOfDay:"黎明（蓝调雾气）",mood:"悬疑神秘",visualStyle:"FPV第一人称视角",soundDesign:"静默（悬疑）"} },
  { id:"st_15",name:"昏暗审讯室",icon:"💡",category:"室内",
    description:"黑暗房间，一盏台灯照亮桌面，烟雾缭绕，阴影浓重",
    params:{environment:"黑暗房间，一盏台灯直射桌面，烟雾缭绕，四周阴影浓重",lighting:"硬光（直射高反差）",colorTone:"低饱和（忧郁写实）",timeOfDay:"深夜（冷清暗部细节）",mood:"紧张不安",visualStyle:"手持晃动写实",soundDesign:"心跳声（紧张）"} },

  // ─── 浪漫/情感 ───
  { id:"st_16",name:"天台黄昏",icon:"🌅",category:"浪漫",
    description:"城市天台，黄昏金色光线，微风吹动晾晒的床单",
    params:{environment:"城市天台，黄昏金色光线，微风拂动晾晒的白色床单",lighting:"黄金时刻（日落前1h）",colorTone:"暖色调（橙黄温馨）",timeOfDay:"黄昏（黄金光线）",mood:"温馨浪漫",visualStyle:"电影级浅景深",soundDesign:"管弦配乐"} },
  { id:"st_17",name:"地下搏击场",icon:"🥊",category:"动作",
    description:"地下搏击场，烟雾弥漫，聚光灯照亮擂台，观众呐喊",
    params:{environment:"地下搏击场，烟雾弥漫，单束聚光灯照亮擂台，密集观众呐喊",lighting:"硬光（直射高反差）",colorTone:"高饱和（鲜艳活力）",timeOfDay:"深夜（冷清暗部细节）",mood:"紧张不安",visualStyle:"手持晃动写实",soundDesign:"心跳声（紧张）"} },
  { id:"st_18",name:"雪山峰顶",icon:"🏔️",category:"自然",
    description:"雪山峰顶，寒风凛冽，云海翻涌，夕阳染红雪面",
    params:{environment:"雪山峰顶，寒风凛冽，云海翻涌，夕阳将雪面染成金色",lighting:"黄金时刻（日落前1h）",colorTone:"暖色调（橙黄温馨）",timeOfDay:"黄昏（黄金光线）",mood:"宏大史诗",visualStyle:"无人机航拍视角",soundDesign:"风声"} },
  { id:"st_19",name:"教堂内部",icon:"⛪",category:"室内",
    description:"哥特式教堂，彩色玻璃窗，光束穿过，尘埃浮动",
    params:{environment:"哥特式教堂，彩色玻璃窗夕照，光束穿透，尘埃浮动，庄严寂静",lighting:"柔光（散射柔和）",colorTone:"暖色调（橙黄温馨）",timeOfDay:"黄昏（黄金光线）",mood:"宁静平和",visualStyle:"轨道平滑运镜",soundDesign:"教堂混响"} },
  { id:"st_20",name:"地下停车场",icon:"🚗",category:"城市",
    description:"空旷的地下停车场，日光灯管闪烁，潮湿地面，回声",
    params:{environment:"空旷地下停车场，日光灯管间歇闪烁，潮湿水泥地面，回声回荡",lighting:"顶光（戏剧压抑）",colorTone:"冷色调（蓝青冷静）",timeOfDay:"深夜（冷清暗部细节）",mood:"紧张不安",visualStyle:"荷兰角（倾斜不安）",soundDesign:"心跳声（紧张）"} },

  // ─── 特殊风格 ───
  { id:"st_21",name:"90年代香港茶餐厅",icon:"🍜",category:"怀旧",
    description:"老式茶餐厅，霓虹灯牌，卡座，地砖马赛克",
    params:{environment:"老式香港茶餐厅，霓虹灯牌，卡座，绿色马赛克地砖，吊扇转动",lighting:"混合色温（电影感）",colorTone:"褪色旧胶片",timeOfDay:"黄昏（黄金光线）",mood:"温馨浪漫",visualStyle:"胶片颗粒质感",soundDesign:"市井嘈杂"} },
  { id:"st_22",name:"太空站绿洲",icon:"🌱",category:"科幻",
    description:"太空站内的温室花园，植物环绕，柔和顶光，水滴漂浮",
    params:{environment:"太空站温室花园，绿色植物环绕，柔和顶光，水滴在微重力中漂浮",lighting:"柔光（散射柔和）",colorTone:"高饱和（鲜艳活力）",timeOfDay:"黎明（蓝调雾气）",mood:"宁静平和",visualStyle:"轨道平滑运镜",soundDesign:"管弦配乐"} },
  { id:"st_23",name:"蒸汽朋克工坊",icon:"⚙️",category:"科幻",
    description:"蒸汽朋克风格工坊，齿轮，蒸汽管道，铜色金属，暖黄灯光",
    params:{environment:"蒸汽朋克工坊，巨大齿轮转动，铜质蒸汽管道，暖黄灯光，工具散落",lighting:"烛光（温暖亲密）",colorTone:"暖色调（橙黄温馨）",timeOfDay:"黄昏（黄金光线）",mood:"温馨浪漫",visualStyle:"广角畸变夸张",soundDesign:"管弦配乐"} },
  { id:"st_24",name:"梦境虚空",icon:"🌀",category:"抽象",
    description:"纯白虚空空间，几何体漂浮，无限反射，光影变幻",
    params:{environment:"纯白虚空空间，几何体漂浮，镜面无限反射，光影缓慢变化",lighting:"柔光（散射柔和）",colorTone:"单色调（艺术感）",timeOfDay:"蓝色时刻（日落后）",mood:"梦幻超现实",visualStyle:"轨道平滑运镜",soundDesign:"电子配乐"} },
  { id:"st_25",name:"雨中霓虹街",icon:"🌧️",category:"城市",
    description:"雨夜街道，霓虹灯倒影在湿漉漉的柏油路上，行人打伞匆匆",
    params:{environment:"雨夜街道，霓虹灯倒影在湿漉漉柏油路，行人打伞匆匆，车灯拉长",lighting:"霓虹灯光",colorTone:"互补色对比（橙青电影感）",timeOfDay:"夜晚",mood:"孤独压抑",visualStyle:"慢动作诗意",soundDesign:"环境雨声"} },

  { id:"st_26",name:"空荡画廊",icon:"🖼️",category:"室内",
    description:"纯白画廊空间，间断的射灯照亮画作，地面反射，空旷寂静",
    params:{environment:"纯白画廊空间，间断射灯照亮画作，抛光地面反射，空旷寂静",lighting:"顶光（戏剧压抑）",colorTone:"单色调（艺术感）",timeOfDay:"正午（顶光高反差）",mood:"宁静平和",visualStyle:"轨道平滑运镜",soundDesign:"静默（悬疑）"} },
  { id:"st_27",name:"沙漠孤城废墟",icon:"🏜️",category:"自然",
    description:"沙漠中的古城废墟，风化墙壁，烈日当空，热浪扭曲",
    params:{environment:"沙漠古城废墟，风化土墙，烈日当空，热浪扭曲远景，荒凉开阔",lighting:"硬光（直射高反差）",colorTone:"褪色旧胶片",timeOfDay:"正午（顶光高反差）",mood:"孤独压抑",visualStyle:"无人机航拍视角",soundDesign:"风声"} },
  { id:"st_28",name:"蒸汽浴室迷雾",icon:"💨",category:"室内",
    description:"充满蒸汽的浴室，模糊的灯光，水滴凝结，朦胧氛围",
    params:{environment:"充满蒸汽的浴室，模糊的壁灯，水滴凝结在瓷砖，人影朦胧",lighting:"柔光（散射柔和）",colorTone:"暖色调（橙黄温馨）",timeOfDay:"蓝色时刻（日落后）",mood:"悬疑神秘",visualStyle:"电影级浅景深",soundDesign:"环境雨声"} },
  { id:"st_29",name:"森林深处木屋",icon:"🪵",category:"自然",
    description:"密林深处的木屋，壁炉火光透过窗户，周围漆黑，雪地反光",
    params:{environment:"密林深处的木屋，壁炉火光透过窗户，周围漆黑，雪地微光",lighting:"烛光（温暖亲密）",colorTone:"暖色调（橙黄温馨）",timeOfDay:"夜晚",mood:"温馨浪漫",visualStyle:"电影级浅景深",soundDesign:"风声"} },
  { id:"st_30",name:"赛博朋克地铁",icon:"🚇",category:"城市",
    description:"未来地铁车厢，全息广告，冷白灯光，乘客冷漠，窗外漆黑隧道",
    params:{environment:"未来地铁车厢，全息广告闪烁，冷白灯光，乘客冷漠面孔，窗外隧道漆黑",lighting:"混合色温（电影感）",colorTone:"赛博朋克紫蓝",timeOfDay:"深夜（冷清暗部细节）",mood:"孤独压抑",visualStyle:"广角畸变夸张",soundDesign:"电子配乐"} },
]

export function getTemplatesByCategory(category: string): SceneTemplate[] {
  if (!category || category === "全部") return SCENE_TEMPLATES
  return SCENE_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: string): SceneTemplate | undefined {
  return SCENE_TEMPLATES.find(t => t.id === id)
}

export const TEMPLATE_CATEGORIES = ["全部", "城市", "自然", "科幻", "古风", "怀旧", "室内", "浪漫", "动作", "抽象"]
