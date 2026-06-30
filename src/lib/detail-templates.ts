// ─── 产品详情页模板定义 ──────────────────────────
// 5个预设模板，定义每个元素的位置和样式
// 渲染引擎根据模板布局画出完整详情页

export interface DetailSection {
  type: "productImage" | "subImage" | "title" | "sellingPoint" | "specs" | "price" | "description" | "sceneImage" | "cta"
  x: number; y: number; w?: number; h?: number
  fontSize?: number; color?: string; bgColor?: string
  align?: "left" | "center" | "right"
}

export interface DetailTemplate {
  id: string
  name: string
  icon: string
  description: string
  width: number
  height: number
  bgColor: string
  sections: DetailSection[]
}

export const DETAIL_TEMPLATES: DetailTemplate[] = [
  {
    id: "clean_ecommerce",
    name: "简洁电商风",
    icon: "🛍️",
    description: "产品白底主图 + 卖点列表 + 规格表，适合淘宝/京东",
    width: 1080, height: 1920, bgColor: "#FFFFFF",
    sections: [
      { type: "productImage", x: 0, y: 0, w: 1080, h: 1080 },
      { type: "title", x: 60, y: 1140, fontSize: 42, color: "#1a1a1a" },
      { type: "price", x: 60, y: 1210, fontSize: 36, color: "#E53935" },
      { type: "sellingPoint", x: 60, y: 1300, fontSize: 24, color: "#333" },
      { type: "specs", x: 60, y: 1550, fontSize: 20, color: "#666" },
      { type: "cta", x: 60, y: 1800, w: 960, h: 80, bgColor: "#E53935", color: "#FFFFFF", fontSize: 28 },
    ]
  },
  {
    id: "xiaohongshu_grass",
    name: "小红书种草风",
    icon: "📕",
    description: "暖色调，场景图+文案+标签，适合小红书",
    width: 1080, height: 1920, bgColor: "#FFF8F0",
    sections: [
      { type: "productImage", x: 40, y: 40, w: 1000, h: 1000 },
      { type: "subImage", x: 40, y: 1060, w: 310, h: 310 },
      { type: "subImage", x: 385, y: 1060, w: 310, h: 310 },
      { type: "subImage", x: 730, y: 1060, w: 310, h: 310 },
      { type: "title", x: 60, y: 1420, fontSize: 36, color: "#333", align: "left" },
      { type: "sellingPoint", x: 60, y: 1520, fontSize: 22, color: "#666" },
      { type: "description", x: 60, y: 1650, fontSize: 20, color: "#999" },
      { type: "cta", x: 60, y: 1820, w: 960, h: 70, bgColor: "#FF6B35", color: "#FFFFFF", fontSize: 26 },
    ]
  },
  {
    id: "taobao_detail",
    name: "淘宝详情风",
    icon: "📦",
    description: "卖点大图 + 实拍场景 + 规格对比，适合电商详情",
    width: 1080, height: 2400, bgColor: "#F5F5F5",
    sections: [
      { type: "productImage", x: 0, y: 0, w: 1080, h: 1080 },
      { type: "title", x: 60, y: 1140, fontSize: 40, color: "#222" },
      { type: "price", x: 60, y: 1210, fontSize: 32, color: "#E53935" },
      { type: "sellingPoint", x: 60, y: 1290, fontSize: 24, color: "#444" },
      { type: "sceneImage", x: 0, y: 1500, w: 1080, h: 540 },
      { type: "specs", x: 60, y: 2100, fontSize: 20, color: "#666" },
    ]
  },
  {
    id: "live_streaming",
    name: "直播带货风",
    icon: "🎥",
    description: "大标题+产品图+限时优惠，适合直播间",
    width: 1080, height: 1920, bgColor: "#1a1a2e",
    sections: [
      { type: "title", x: 60, y: 60, fontSize: 52, color: "#F59E0B", align: "center" },
      { type: "productImage", x: 90, y: 180, w: 900, h: 900 },
      { type: "price", x: 60, y: 1140, fontSize: 48, color: "#E53935", align: "center" },
      { type: "sellingPoint", x: 60, y: 1240, fontSize: 24, color: "#E8E8F0" },
      { type: "cta", x: 60, y: 1500, w: 960, h: 80, bgColor: "#E53935", color: "#FFFFFF", fontSize: 32 },
    ]
  },
  {
    id: "minimalist",
    name: "极简白",
    icon: "⬜",
    description: "大量留白，产品细节突出，适合高端品牌",
    width: 1080, height: 1920, bgColor: "#FFFFFF",
    sections: [
      { type: "productImage", x: 90, y: 80, w: 900, h: 900 },
      { type: "title", x: 80, y: 1100, fontSize: 36, color: "#111", align: "center" },
      { type: "price", x: 80, y: 1170, fontSize: 28, color: "#999", align: "center" },
      { type: "description", x: 80, y: 1280, fontSize: 22, color: "#888" },
      { type: "sellingPoint", x: 80, y: 1450, fontSize: 20, color: "#555" },
      { type: "specs", x: 80, y: 1650, fontSize: 18, color: "#aaa" },
    ]
  },
]

export function getDetailTemplate(id: string): DetailTemplate | undefined {
  return DETAIL_TEMPLATES.find(t => t.id === id)
}
