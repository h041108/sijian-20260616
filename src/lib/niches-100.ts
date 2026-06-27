// ─── 100个冷门赛道完整清单 ─────────────────────────

export interface NicheItem {
  id: string
  name: string
  desc: string
  data?: string
}

export interface NicheCategory {
  id: string
  name: string
  icon: string
  items: NicheItem[]
}

export const NICHE_CATEGORIES: NicheCategory[] = [
  {
    id: "life-skills", name: "超级利基生活技能类", icon: "🔧",
    items: [
      { id: "ns01", name: "极致煮蛋", desc: "精确到秒的水煮蛋技法、多流派之争", data: "\"蛋神\"8天涨粉356万" },
      { id: "ns02", name: "宠物训练细节", desc: "特定指令训练（如\"纸巾认领\"）", data: "合集播放8.6亿+" },
      { id: "ns03", name: "修马蹄/洗地毯", desc: "解压清洁过程，视觉满足感", data: "情绪治愈类内容持续走高" },
      { id: "ns04", name: "居家收纳艺术", desc: "极致空间利用、断舍离过程", data: "强视觉反差+实用价值" },
      { id: "ns05", name: "老物件修复", desc: "古董/旧物修复全过程", data: "稀缺技能+文化传承" },
      { id: "ns06", name: "家庭绿植养护", desc: "小众植物养护、扦插技巧", data: "慢生活趋势下的蓝海" },
      { id: "ns07", name: "阳台种菜", desc: "都市农业、微型种植", data: "体验经济+自给自足" },
      { id: "ns08", name: "洗衣/衣物护理", desc: "顽固污渍去除、面料护理", data: "生活刚需+冷知识" },
      { id: "ns09", name: "家庭维修DIY", desc: "水电/家具/家电简单维修", data: "省钱技能+动手乐趣" },
      { id: "ns10", name: "剩菜改造料理", desc: "用剩菜做出精致餐食", data: "反浪费+创意烹饪" },
    ],
  },
  {
    id: "extreme-sports", name: "极限运动与硬核挑战类", icon: "🏔️",
    items: [
      { id: "ns11", name: "攀岩/抱石解说", desc: "高难度线路征服、运动员极限操作", data: "单条解说视频破1000万" },
      { id: "ns12", name: "自行车速降", desc: "山地速降、极限控车", data: "速降博主入选B站百大UP主" },
      { id: "ns13", name: "跑酷/自由奔跑", desc: "城市障碍穿越、极限跳跃", data: "稀缺感官体验" },
      { id: "ns14", name: "翼装飞行", desc: "高空滑翔、定点降落", data: "\"红牛极限\"类内容持续有市场" },
      { id: "ns15", name: "高空跳伞", desc: "自由落体视角、伞控技术", data: "第一人称沉浸感极强" },
      { id: "ns16", name: "野外生存", desc: "荒野求生、原始技能", data: "鳌太线故事持续破圈" },
      { id: "ns17", name: "洞穴探险", desc: "未知洞穴探索、地下世界", data: "猎奇+恐惧好奇心" },
      { id: "ns18", name: "伐木大赛解说", desc: "竞技性伐木、光头强式比拼", data: "海外综艺切片广泛传播" },
    ],
  },
  {
    id: "craft-master", name: "技能专精与工艺大师类", icon: "⚒️",
    items: [
      { id: "ns19", name: "锻刀大赛解说", desc: "刀具锻造、残酷测试", data: "短视频平台广泛传播" },
      { id: "ns20", name: "专业烤肉/烧烤", desc: "美式烤肉、低温慢烤", data: "堪比《北美烧烤大赛》水准" },
      { id: "ns21", name: "乐高大师拼搭", desc: "大型乐高作品建造过程", data: "海外《乐高大师》综艺带火" },
      { id: "ns22", name: "玻璃吹制", desc: "高温玻璃艺术品创作", data: "《玻璃大师》同类内容" },
      { id: "ns23", name: "陶艺/陶瓷制作", desc: "拉坯、上釉、烧制全过程", data: "手工经济持续升温" },
      { id: "ns24", name: "木工/细木作", desc: "榫卯结构、木器制作", data: "传统工艺复兴" },
      { id: "ns25", name: "金工/金属艺术", desc: "金属锻造、焊接、雕刻", data: "工业美学+精湛技艺" },
      { id: "ns26", name: "皮具制作", desc: "手工皮包、皮带、钱夹", data: "个性化定制需求" },
      { id: "ns27", name: "制笔/文房", desc: "手工钢笔、毛笔制作", data: "文具圈小众但消费力强" },
      { id: "ns28", name: "制香/香道", desc: "手工合香、沉香品鉴", data: "东方美学回归" },
      { id: "ns29", name: "微缩模型", desc: "微缩场景、手办制作", data: "强细节+强迫症福音" },
      { id: "ns30", name: "机甲模型拼装", desc: "高达/机甲喷涂、改造", data: "二次元圈层精准受众" },
    ],
  },
  {
    id: "handmade-craft", name: "拼豆与手工文创类", icon: "🧵",
    items: [
      { id: "ns31", name: "拼豆原创设计", desc: "像素图创作、立体拼豆", data: "2025年电商销售额2.91亿，增长9倍" },
      { id: "ns32", name: "拼豆技法教学", desc: "无孔工艺、烫板纹理", data: "\"拼豆考研\"已成圈内文化" },
      { id: "ns33", name: "拼豆IP同人", desc: "二次元/乙游/爱豆周边制作", data: "18万颗豆子做等身立牌成现象级" },
      { id: "ns34", name: "流麻定制", desc: "流沙麻将、二次元周边", data: "售价35-50元，订单排期数月" },
      { id: "ns35", name: "流沙艺术", desc: "创意流沙画、动态摆件", data: "视觉治愈+收藏价值" },
      { id: "ns36", name: "豆荚娃娃DIY", desc: "榼藤豆荚制作小人偶", data: "2026年开春爆款" },
      { id: "ns37", name: "手工捏捏", desc: "解压玩具、硅胶捏捏", data: "\"捏圈\"已成独立社群" },
      { id: "ns38", name: "手账拼贴", desc: "手账排版、胶带拼贴", data: "小红书十大出圈小众兴趣" },
      { id: "ns39", name: "钩织/编织", desc: "毛线钩织、玩偶制作", data: "手工经济传统大类" },
      { id: "ns40", name: "串珠/手串", desc: "天然石手串DIY、能量石搭配", data: "轻手工+疗愈消费" },
    ],
  },
  {
    id: "food-reverse", name: "反向吃播与奇特饮食类", icon: "🍽️",
    items: [
      { id: "ns41", name: "猎奇食物测评", desc: "试吃稀奇古怪的食物、真实反应", data: "《学做吃播的第X天》系列爆火" },
      { id: "ns42", name: "健身\"禁欲\"餐", desc: "水煮鸡胸、生啃蔬菜", data: "评论区成防伪标识" },
      { id: "ns43", name: "各国\"黑暗料理\"", desc: "世界各地难吃食物图鉴", data: "安全猎奇+文化对比" },
      { id: "ns44", name: "过期/变质食品实验", desc: "科学观察食物变质过程", data: "硬核科普+猎奇心理" },
      { id: "ns45", name: "航空餐/火车盒饭测评", desc: "交通餐食真实评价", data: "生活场景共鸣" },
      { id: "ns46", name: "学校/工厂食堂", desc: "大锅饭菜品测评", data: "集体记忆+身份认同" },
    ],
  },
  {
    id: "hard-science", name: "硬核冷知识科普类", icon: "🔬",
    items: [
      { id: "ns47", name: "毒蛇鉴别", desc: "根据蛇纹/咬痕/地区鉴别蛇种毒性", data: "百大UP主@世界记忆大师龙雅" },
      { id: "ns48", name: "野外捕蛇", desc: "实地捕蛇、蛇类科普", data: "B站视频播放620万+" },
      { id: "ns49", name: "毒虫/蜘蛛鉴别", desc: "毒虫识别、咬伤急救", data: "猎奇+安全科普" },
      { id: "ns50", name: "户外事故解谜", desc: "徒步/穿越事故还原分析", data: "鳌太线话题单周涨粉15万" },
      { id: "ns51", name: "急救/野外生存技能", desc: "止血、包扎、求救信号", data: "硬核实用技能" },
      { id: "ns52", name: "司法鉴定科普", desc: "法医/痕迹检验等冷知识", data: "职业稀缺性+好奇心" },
      { id: "ns53", name: "考古/古生物", desc: "化石发现、遗址挖掘", data: "知识密度高+猎奇" },
      { id: "ns54", name: "不明生物/神秘动物", desc: "传闻生物追踪、UMA", data: "传说+探索" },
    ],
  },
  {
    id: "podcast-deep", name: "视频播客与深度对话类", icon: "🎙️",
    items: [
      { id: "ns55", name: "名人深度访谈", desc: "2小时+长访谈、无删减对话", data: "《陈鲁豫漫谈》等现象级" },
      { id: "ns56", name: "商业/创业播客", desc: "行业深度讨论、商业模式拆解", data: "播客完播率50-70%" },
      { id: "ns57", name: "科技/数码深度评测", desc: "10分钟+产品实测、拆机对比", data: "单条长视频ROI可超100" },
      { id: "ns58", name: "心理学/情感深度", desc: "心理分析、情感治愈对话", data: "用户对深度内容渴望回升" },
      { id: "ns59", name: "历史真相挖掘", desc: "历史事件深度还原、档案揭秘", data: "知识型内容抗周期" },
      { id: "ns60", name: "行业\"内幕\"揭露", desc: "各行业不为人知的运作逻辑", data: "稀缺信息+社交货币" },
    ],
  },
  {
    id: "health-wellness", name: "轻养生与健康管理类", icon: "🧘",
    items: [
      { id: "ns61", name: "中医生活化", desc: "艾灸、穴位按摩、食疗", data: "种草经济潜力第三(34.90%)" },
      { id: "ns62", name: "上班族碎片健身", desc: "办公室拉伸、5分钟燃脂", data: "低门槛+高需求" },
      { id: "ns63", name: "情绪疗愈/冥想", desc: "正念引导、睡眠改善", data: "解压消费持续升温" },
      { id: "ns64", name: "睡眠优化", desc: "睡眠环境、睡姿、失眠对策", data: "痛点刚需+好转化" },
      { id: "ns65", name: "肠道健康", desc: "益生菌、发酵食品科普", data: "科学化+生活化" },
      { id: "ns66", name: "功能性茶饮", desc: "花茶/药茶配方、功效科普", data: "东方养生美学" },
      { id: "ns67", name: "慢病管理", desc: "高血压/糖尿病生活方式干预", data: "银发经济+刚需" },
      { id: "ns68", name: "自然疗愈/森林浴", desc: "户外自然体验、五感疗愈", data: "体验经济新方向" },
    ],
  },
  {
    id: "travel-rural", name: "文旅休闲与乡村体验类", icon: "🏘️",
    items: [
      { id: "ns69", name: "小众冷门景点", desc: "未被开发的自然风光、秘境探索", data: "\"打卡效应\"最强赛道" },
      { id: "ns70", name: "乡村特色产品", desc: "土特产、手工艺、乡村生活", data: "种草潜力32.73%" },
      { id: "ns71", name: "特色民宿体验", desc: "树屋/窑洞/海景等差异化住宿", data: "场景化视觉内容" },
      { id: "ns72", name: "非遗文化探访", desc: "非遗传承人、传统技艺记录", data: "文化复兴+稀缺内容" },
      { id: "ns73", name: "城市Citywalk", desc: "城市漫步、老街探访", data: "低门槛+本地生活" },
      { id: "ns74", name: "寺庙/古建筑", desc: "古寺探访、建筑美学", data: "情绪疗愈+文化底蕴" },
      { id: "ns75", name: "房车/露营生活", desc: "房车改造、营地体验", data: "户外经济持续升温" },
      { id: "ns76", name: "赶集/市集文化", desc: "乡镇集市、特色摊位", data: "人间烟火+怀旧" },
    ],
  },
  {
    id: "acg-creative", name: "二次元IP同人创作类", icon: "🎨",
    items: [
      { id: "ns77", name: "流麻/二次元周边", desc: "热门IP流沙麻将、吧唧定制", data: "同人手工溢价高" },
      { id: "ns78", name: "痛包/痛车装饰", desc: "二次元展示包、痛车改造", data: "圈层文化+高客单价" },
      { id: "ns79", name: "cosplay道具制作", desc: "铠甲/武器/头饰手工制作", data: "硬核手工+IP粘性" },
      { id: "ns80", name: "谷子/吧唧改造", desc: "徽章再创作、痛包搭配", data: "二次元\"吃谷\"文化" },
      { id: "ns81", name: "动漫同人绘画", desc: "同人图创作、改画过程", data: "低门槛+粉丝经济" },
      { id: "ns82", name: "虚拟主播/VTuber", desc: "虚拟形象直播、中之人运营", data: "二次元+直播新形态" },
    ],
  },
  {
    id: "smart-home", name: "智能家居与数码深测类", icon: "🏠",
    items: [
      { id: "ns83", name: "智能家居实测", desc: "全屋智能联动、真实场景测试", data: "种草潜力32.37%" },
      { id: "ns84", name: "数码\"劝退\"测评", desc: "真实吐槽、产品缺点放大", data: "反向种草，信任感更强" },
      { id: "ns85", name: "家电拆机对比", desc: "内部做工、用料横向对比", data: "单条长视频ROI可超100" },
      { id: "ns86", name: "3C配件DIY", desc: "个性化手机壳/表带制作", data: "种草潜力26.11%" },
      { id: "ns87", name: "游戏装备评测", desc: "外设性能、舒适度实测", data: "游戏圈精准受众" },
      { id: "ns88", name: "办公效率工具", desc: "生产力工具、效率软件推荐", data: "职场人群刚需" },
      { id: "ns89", name: "AI工具实操教学", desc: "AI绘图/写作/视频工具教程", data: "技术红利期" },
    ],
  },
  {
    id: "entertainment", name: "抽象文化与人设娱乐类", icon: "🎭",
    items: [
      { id: "ns90", name: "抽象舞蹈挑战", desc: "魔性舞步、整活挑战", data: "张艺兴等明星入局" },
      { id: "ns91", name: "\"草根\"奇葩人设", desc: "独特口音、身份反差", data: "那艺娜巡演千人场售罄" },
      { id: "ns92", name: "老年网红/银发族", desc: "老年生活趣味记录", data: "银发经济+反差萌" },
      { id: "ns93", name: "\"废柴\"生活记录", desc: "摆烂式记录、反内卷叙事", data: "情绪共鸣+身份认同" },
      { id: "ns94", name: "AI整活/虚拟人", desc: "AI生成搞笑内容、虚拟人互动", data: "技术+娱乐" },
    ],
  },
  {
    id: "knowledge-monetize", name: "知识付费与技能变现类", icon: "💡",
    items: [
      { id: "ns95", name: "小众技能教学", desc: "手语/盲文/速记/暗号", data: "稀缺技能+知识社交货币" },
      { id: "ns96", name: "考试\"捷径\"解析", desc: "考证技巧、学习方法论", data: "学生+职场人群刚需" },
      { id: "ns97", name: "小语种/方言", desc: "方言教学、冷门语言", data: "地域文化+差异化" },
      { id: "ns98", name: "职场\"潜规则\"", desc: "升职加薪、人际交往技巧", data: "痛点刚需+信任变现" },
      { id: "ns99", name: "一人公司/轻创业", desc: "小成本副业、个人IP打造", data: "低信任成本商业模式" },
      { id: "ns100", name: "自由职业/数字游民", desc: "远程工作、旅居生活方式", data: "年轻人理想生活向往" },
    ],
  },
]

export const HOT_NICHES = ["极致煮蛋", "宠物训练细节", "拼豆原创设计", "居家收纳艺术", "锻刀大赛解说", "中医生活化", "小众冷门景点", "智能家居实测"]

export function getAllNiches(): NicheItem[] {
  const all: NicheItem[] = []
  for (const cat of NICHE_CATEGORIES) {
    for (const item of cat.items) {
      all.push(item)
    }
  }
  return all
}

export function searchNiches(keyword: string): { item: NicheItem; category: string }[] {
  if (!keyword.trim()) return []
  const kw = keyword.toLowerCase()
  const results: { item: NicheItem; category: string }[] = []
  for (const cat of NICHE_CATEGORIES) {
    for (const item of cat.items) {
      if (item.name.includes(kw) || item.desc.includes(kw) || item.name.toLowerCase().includes(kw)) {
        results.push({ item, category: cat.name })
      }
    }
  }
  return results
}
