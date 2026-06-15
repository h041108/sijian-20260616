"use client"

import MindTransit from "@/components/MindTransit"
import type { FrameType } from "@/lib/types"

const DEMOS: { frame: FrameType; label: string; topic: string; nodes: any[]; edges: any[] }[] = [
  {
    frame: "tree", label: "层级树", topic: "进化论",
    nodes: [
      { id:"t1",label:"进化论",depth:0,content:"物种随时间改变的理论",shape:"box",color:"#4C51BF",position:{x:0,y:6,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"t2",label:"自然选择",depth:1,content:"适者生存，不适应者淘汰",shape:"box",color:"#3182CE",position:{x:-1.5,y:3,z:0},parentIds:["t1"],anchors:[{label:"抗生素耐药",profession:"医生",parameters:"细菌在抗生素压力下进化",nodeId:"t2",relevanceScore:0.9}],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"t3",label:"基因突变",depth:1,content:"DNA变化产生新性状",shape:"sphere",color:"#38A169",position:{x:1.5,y:3,z:0},parentIds:["t1"],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"t4",label:"适应辐射",depth:2,content:"一个祖先物种分化出多个物种",shape:"sphere",color:"#00B5D8",position:{x:-3,y:0,z:0},parentIds:["t2"],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"t5",label:"物种形成",depth:2,content:"地理隔离导致新物种产生",shape:"sphere",color:"#D69E2E",position:{x:0,y:0,z:0},parentIds:["t2"],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"t6",label:"遗传漂变",depth:2,content:"随机事件改变基因频率",shape:"sphere",color:"#ED8936",position:{x:3,y:0,z:0},parentIds:["t3"],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"t1",target:"t2"},{id:"e2",source:"t1",target:"t3"},{id:"e3",source:"t2",target:"t4"},{id:"e4",source:"t2",target:"t5"},{id:"e5",source:"t3",target:"t6"}]
  },
  {
    frame: "network", label: "关系网络", topic: "生态系统",
    nodes: [
      { id:"n1",label:"蜜蜂",depth:0,content:"主要传粉者",shape:"sphere",color:"#D69E2E",position:{x:0,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"n2",label:"开花植物",depth:0,content:"依赖蜜蜂传粉",shape:"box",color:"#38A169",position:{x:3,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"n3",label:"食草动物",depth:0,content:"以植物为食",shape:"cylinder",color:"#E53E3E",position:{x:2,y:-2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"n4",label:"肉食动物",depth:0,content:"捕食食草动物",shape:"torus",color:"#DD6B20",position:{x:-1,y:-3,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"n5",label:"人类农业",depth:0,content:"35%粮食靠传粉",shape:"box",color:"#4C51BF",position:{x:-3,y:-1,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"n1",target:"n2"},{id:"e2",source:"n2",target:"n3"},{id:"e3",source:"n3",target:"n4"},{id:"e4",source:"n1",target:"n5"},{id:"e5",source:"n2",target:"n5"}]
  },
  {
    frame: "helix", label: "双螺旋", topic: "DNA复制",
    nodes: [
      { id:"h1",label:"解旋",depth:0,content:"双链解开",shape:"sphere",color:"#4C51BF",position:{x:-1.5,y:3,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"h2",label:"碱基配对",depth:0,content:"A-T C-G",shape:"box",color:"#38A169",position:{x:1.5,y:3,z:1},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"h3",label:"聚合酶",depth:1,content:"催化新链合成",shape:"sphere",color:"#E53E3E",position:{x:-1.5,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"h4",label:"校对修复",depth:1,content:"纠正复制错误",shape:"box",color:"#D69E2E",position:{x:1.5,y:0,z:1},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"h5",label:"半保留",depth:2,content:"每条新DNA含一条旧链",shape:"torus",color:"#805AD5",position:{x:0,y:-2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"h1",target:"h2"},{id:"e2",source:"h1",target:"h3"},{id:"e3",source:"h2",target:"h4"},{id:"e4",source:"h3",target:"h5"},{id:"e5",source:"h4",target:"h5"}]
  },
  {
    frame: "strata", label: "分层剖面", topic: "地球地层",
    nodes: [
      { id:"s1",label:"地壳",depth:0,content:"厚5-70km",shape:"box",color:"#DD6B20",position:{x:0,y:3,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"s2",label:"上地幔",depth:1,content:"岩石圈+软流层",shape:"box",color:"#D69E2E",position:{x:1,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"s3",label:"下地幔",depth:2,content:"固态高温高压",shape:"cylinder",color:"#E53E3E",position:{x:-1,y:1,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"s4",label:"外核",depth:3,content:"液态铁镍",shape:"cylinder",color:"#4C51BF",position:{x:1,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"s5",label:"内核",depth:4,content:"固态铁镍 6000°C",shape:"sphere",color:"#553C9A",position:{x:0,y:-1,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"s1",target:"s2"},{id:"e2",source:"s2",target:"s3"},{id:"e3",source:"s3",target:"s4"},{id:"e4",source:"s4",target:"s5"}]
  },
  {
    frame: "orbital", label: "力场轨道", topic: "太阳系",
    nodes: [
      { id:"o1",label:"太阳",depth:0,content:"恒星 G型主序星",shape:"sphere",color:"#D69E2E",position:{x:0,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"o2",label:"水星",depth:1,content:"最近的行星",shape:"sphere",color:"#999",position:{x:2.5,y:0.5,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"o3",label:"金星",depth:1,content:"最热的行星",shape:"sphere",color:"#D53F8C",position:{x:0,y:3,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"o4",label:"地球",depth:1,content:"第三颗行星",shape:"sphere",color:"#3182CE",position:{x:-3.5,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"o5",label:"火星",depth:2,content:"红色行星",shape:"sphere",color:"#E53E3E",position:{x:1,y:-4,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"o6",label:"木星",depth:2,content:"最大的行星",shape:"sphere",color:"#DD6B20",position:{x:-2,y:-5,z:1},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"o1",target:"o2"},{id:"e2",source:"o1",target:"o3"},{id:"e3",source:"o1",target:"o4"},{id:"e4",source:"o1",target:"o5"},{id:"e5",source:"o1",target:"o6"}]
  },
  {
    frame: "pipeline", label: "流程管线", topic: "煎牛排",
    nodes: [
      { id:"p1",label:"选肉",depth:0,content:"选2cm厚肋眼或西冷",shape:"cylinder",color:"#E53E3E",position:{x:-4,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"p2",label:"回温",depth:0,content:"室温放置30分钟",shape:"box",color:"#D69E2E",position:{x:-2,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"p3",label:"调味",depth:0,content:"盐+黑胡椒腌制",shape:"box",color:"#38A169",position:{x:0,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"p4",label:"煎制",depth:0,content:"大火每面2-3分钟",shape:"box",color:"#4C51BF",position:{x:2,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"p5",label:"醒肉",depth:0,content:"静置5分钟锁汁",shape:"cylinder",color:"#805AD5",position:{x:4,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"p1",target:"p2"},{id:"e2",source:"p2",target:"p3"},{id:"e3",source:"p3",target:"p4"},{id:"e4",source:"p4",target:"p5"}]
  },
  {
    frame: "lens", label: "深度透镜", topic: "名画分析",
    nodes: [
      { id:"l1",label:"表面技法",depth:0,content:"色彩、笔触、构图",shape:"torus",color:"#4C51BF",position:{x:0,y:3,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"l2",label:"风格流派",depth:1,content:"印象派、光影捕捉",shape:"cylinder",color:"#3182CE",position:{x:2.5,y:1.5,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"l3",label:"时代背景",depth:2,content:"1870年代巴黎社会变革",shape:"sphere",color:"#38A169",position:{x:0,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"l4",label:"画家生平",depth:2,content:"莫奈的创作动机与经历",shape:"sphere",color:"#D69E2E",position:{x:-2.5,y:1.5,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"l1",target:"l2"},{id:"e2",source:"l2",target:"l3"},{id:"e3",source:"l1",target:"l4"}]
  },
  {
    frame: "cycle", label: "循环回路", topic: "水循环",
    nodes: [
      { id:"c1",label:"蒸发",depth:0,content:"水→水蒸气",shape:"sphere",color:"#3182CE",position:{x:3.5,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"c2",label:"凝结",depth:0,content:"水蒸气→云",shape:"sphere",color:"#00B5D8",position:{x:0,y:3.5,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"c3",label:"降水",depth:0,content:"雨/雪回到地面",shape:"sphere",color:"#38A169",position:{x:-3.5,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"c4",label:"径流",depth:0,content:"水流入河流海洋",shape:"sphere",color:"#D69E2E",position:{x:-3.5,y:-2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"c5",label:"渗入",depth:0,content:"水渗入地下水",shape:"sphere",color:"#DD6B20",position:{x:0,y:-3.5,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"c1",target:"c2"},{id:"e2",source:"c2",target:"c3"},{id:"e3",source:"c3",target:"c4"},{id:"e4",source:"c4",target:"c5"},{id:"e5",source:"c5",target:"c1"}]
  },
  {
    frame: "spectrum", label: "谱系连续", topic: "政治光谱",
    nodes: [
      { id:"sp1",label:"极左",depth:0,content:"激进平等 公有制",shape:"box",color:"#E53E3E",position:{x:-4,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"sp2",label:"左翼",depth:0,content:"社会福利 政府干预",shape:"box",color:"#ED8936",position:{x:-2,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"sp3",label:"中间",depth:0,content:"混合经济 渐进改革",shape:"cylinder",color:"#D69E2E",position:{x:0,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"sp4",label:"右翼",depth:0,content:"自由市场 传统价值",shape:"cylinder",color:"#38A169",position:{x:2,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"sp5",label:"极右",depth:0,content:"最小政府 民族主义",shape:"sphere",color:"#4C51BF",position:{x:4,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"sp1",target:"sp2"},{id:"e2",source:"sp2",target:"sp3"},{id:"e3",source:"sp3",target:"sp4"},{id:"e4",source:"sp4",target:"sp5"}]
  },
  {
    frame: "matrix", label: "矩阵映射", topic: "周期表逻辑",
    nodes: [
      { id:"m1",label:"周期1",depth:0,content:"H He 最轻",shape:"box",color:"#E53E3E",position:{x:-3,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"m2",label:"周期2",depth:0,content:"Li→Ne 8元素",shape:"box",color:"#D53F8C",position:{x:0,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"m3",label:"周期3",depth:0,content:"Na→Ar 8元素",shape:"box",color:"#805AD5",position:{x:3,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"m4",label:"碱金属",depth:0,content:"IA族 最活泼",shape:"cylinder",color:"#E53E3E",position:{x:-3,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"m5",label:"过渡金属",depth:0,content:"d区 多彩化合物",shape:"cylinder",color:"#D69E2E",position:{x:0,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"m6",label:"卤素",depth:0,content:"VIIA族 强氧化",shape:"cylinder",color:"#38A169",position:{x:3,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"m1",target:"m4"},{id:"e2",source:"m2",target:"m5"},{id:"e3",source:"m3",target:"m6"},{id:"e4",source:"m4",target:"m5"},{id:"e5",source:"m5",target:"m6"}]
  },
  {
    frame: "diffusion", label: "涟漪扩散", topic: "文字传播",
    nodes: [
      { id:"d1",label:"苏美尔",depth:0,content:"楔形文字起源",shape:"sphere",color:"#D69E2E",position:{x:0,y:0,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"d2",label:"埃及",depth:1,content:"象形文字3000BC",shape:"box",color:"#E53E3E",position:{x:-2,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"d3",label:"印度河",depth:1,content:"印章文字2600BC",shape:"cylinder",color:"#4C51BF",position:{x:2,y:2,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"d4",label:"希腊",depth:2,content:"字母文字800BC",shape:"torus",color:"#3182CE",position:{x:-3,y:-3,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
      { id:"d5",label:"罗马",depth:2,content:"拉丁字母传播全球",shape:"sphere",color:"#38A169",position:{x:3,y:-3,z:0},parentIds:[],anchors:[],metadata:{createdBy:"ai",createdAt:"",version:1}},
    ],
    edges: [{id:"e1",source:"d1",target:"d2"},{id:"e2",source:"d1",target:"d3"},{id:"e3",source:"d2",target:"d4"},{id:"e4",source:"d3",target:"d5"}]
  },
]

export default function DemoPage() {
  return (
    <div className="h-screen overflow-y-auto" style={{ background: "#faf8f5" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">思见 · 11种思维框架引擎</h1>
        <p className="text-sm text-gray-500 mb-8">每种框架由独立的布局算法计算站点坐标 → 统一渲染为地铁线路图</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {DEMOS.map(demo => (
            <div key={demo.frame} className="bg-white rounded-2xl border border-[#e8e5df] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e5df] bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">{demo.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">{demo.frame}</span>
                </div>
                <span className="text-xs text-gray-400">{demo.topic}</span>
              </div>
              <div style={{ height: "320px" }}>
                <MindTransit
                  nodes={demo.nodes}
                  edges={demo.edges}
                  domainType="general"
                  frameType={demo.frame}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-white rounded-2xl border border-[#e8e5df] shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-3">引擎结构</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
            {DEMOS.map(d => (
              <div key={d.frame} className="flex items-center gap-1.5 p-2 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.nodes[0]?.color || "#999" }} />
                {d.label}
                <span className="text-gray-300 ml-auto">{d.nodes.length}站</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
