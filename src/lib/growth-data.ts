// 模拟5个学生的完整思维成长轨迹
export interface GrowthNode {
  id: string; label: string; content: string; shape: string; color: string
  mastery: number; isNew: boolean; isUpdated: boolean; anchors: string[]
  depth: number; parentIds: string[]
  metadata: { createdBy: "ai"; createdAt: string; version: number }
}
export interface GrowthSession {
  date: string; topic: string; summary: string; frameType: string
  milestone?: string; nodes: GrowthNode[]; edges: { source: string; target: string }[]
}
export interface StudentGrowth {
  studentId: string; studentName: string; subject: string
  sessions: GrowthSession[]; highlight: string
}

export const STUDENT_GROWTH_DATA: StudentGrowth[] = [
  {
    "studentId": "zsy",
    "studentName": "赵思远",
    "subject": "mathematics",
    "highlight": "3轮对话，从只知道记公式到理解真实应用",
    "sessions": [
      {
        "date": "2026-03-10",
        "topic": "三角函数入门",
        "summary": "赵思远第一次聊三角函数，AI问他是怎么理解正弦定理的。",
        "frameType": "tree",
        "nodes": [
          {
            "id": "g_1",
            "label": "正弦定理",
            "content": "a/sinA=b/sinB=c/sinC=2R",
            "shape": "box",
            "color": "#4C51BF",
            "mastery": 0.3,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_2",
            "label": "余弦定理",
            "content": "c²=a²+b²-2ab·cosC",
            "shape": "sphere",
            "color": "#3182CE",
            "mastery": 0.25,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_3",
            "label": "公式记忆",
            "content": "死记硬背，不理解几何意义",
            "shape": "cylinder",
            "color": "#00B5D8",
            "mastery": 0.5,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "正弦定理",
            "target": "公式记忆"
          },
          {
            "source": "余弦定理",
            "target": "公式记忆"
          }
        ]
      },
      {
        "date": "2026-04-02",
        "topic": "三角函数的应用",
        "summary": "赵思远追问正弦定理到底有什么用，AI展示了三个应用场景。",
        "frameType": "network",
        "milestone": "应用锚点突破",
        "nodes": [
          {
            "id": "g_4",
            "label": "正弦定理",
            "content": "a/sinA=2R，比值=外接圆直径",
            "shape": "box",
            "color": "#4C51BF",
            "mastery": 0.55,
            "isNew": false,
            "isUpdated": true,
            "anchors": [
              "卫星天线",
              "桥梁斜撑"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_5",
            "label": "卫星天线",
            "content": "f/D∈[0.3,0.5]用sin计算波束角",
            "shape": "sphere",
            "color": "#E53E3E",
            "mastery": 0.4,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_6",
            "label": "桥梁斜撑",
            "content": "斜撑35°→sin35°=0.574荷载分解",
            "shape": "box",
            "color": "#DD6B20",
            "mastery": 0.45,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_7",
            "label": "CT扫描",
            "content": "X射线多角度→正弦投影→重建断层图",
            "shape": "torus",
            "color": "#38A169",
            "mastery": 0.35,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "正弦定理",
            "target": "卫星天线"
          },
          {
            "source": "正弦定理",
            "target": "桥梁斜撑"
          },
          {
            "source": "正弦定理",
            "target": "CT扫描"
          }
        ]
      },
      {
        "date": "2026-05-15",
        "topic": "三角函数的综合运用",
        "summary": "赵思远把力的分解和三角函数联系起来。",
        "frameType": "network",
        "milestone": "概念重构",
        "nodes": [
          {
            "id": "g_8",
            "label": "正弦定理",
            "content": "a/sinA=2R，桥梁测距卫星定位都用它",
            "shape": "box",
            "color": "#4C51BF",
            "mastery": 0.82,
            "isNew": false,
            "isUpdated": true,
            "anchors": [
              "卫星天线",
              "桥梁斜撑",
              "CT扫描"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_9",
            "label": "力的分解",
            "content": "斜面上的重力分力=mg·sinθ",
            "shape": "sphere",
            "color": "#E53E3E",
            "mastery": 0.7,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_10",
            "label": "余弦定理",
            "content": "两边一夹角→第三节，GPS定位用",
            "shape": "sphere",
            "color": "#3182CE",
            "mastery": 0.65,
            "isNew": false,
            "isUpdated": true,
            "anchors": [
              "GPS卫星定位"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_11",
            "label": "应用思维",
            "content": "从公式到真实世界的桥梁",
            "shape": "cylinder",
            "color": "#38A169",
            "mastery": 0.75,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "正弦定理",
            "target": "力的分解"
          },
          {
            "source": "正弦定理",
            "target": "应用思维"
          }
        ]
      }
    ]
  },
  {
    "studentId": "lhr",
    "studentName": "刘浩然",
    "subject": "physics",
    "highlight": "从牛顿定律就是背公式到用F=ma分析汽车制动距离",
    "sessions": [
      {
        "date": "2026-03-12",
        "topic": "牛顿力学入门",
        "summary": "刘浩然说F=ma记住了但不知道怎么用。",
        "frameType": "tree",
        "nodes": [
          {
            "id": "g_12",
            "label": "牛顿第二定律",
            "content": "F=ma，力=质量×加速度",
            "shape": "sphere",
            "color": "#E53E3E",
            "mastery": 0.25,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_13",
            "label": "受力分析",
            "content": "先画受力图再列方程",
            "shape": "box",
            "color": "#3182CE",
            "mastery": 0.2,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "牛顿第二定律",
            "target": "受力分析"
          }
        ]
      },
      {
        "date": "2026-04-08",
        "topic": "动力学应用",
        "summary": "刘浩然问刹车距离怎么算，AI纠正了他质量影响距离的错误直觉。",
        "frameType": "pipeline",
        "milestone": "思维纠错",
        "nodes": [
          {
            "id": "g_14",
            "label": "牛顿第二定律",
            "content": "F=ma，制动过程=减速运动",
            "shape": "sphere",
            "color": "#E53E3E",
            "mastery": 0.5,
            "isNew": false,
            "isUpdated": true,
            "anchors": [
              "汽车制动"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_15",
            "label": "摩擦力",
            "content": "f=μN=μmg，刹车靠摩擦力",
            "shape": "box",
            "color": "#DD6B20",
            "mastery": 0.4,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_16",
            "label": "刹车距离",
            "content": "v²=2ax→x=v²/(2μg)",
            "shape": "cylinder",
            "color": "#38A169",
            "mastery": 0.45,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "牛顿第二定律",
            "target": "摩擦力"
          },
          {
            "source": "摩擦力",
            "target": "刹车距离"
          }
        ]
      },
      {
        "date": "2026-05-10",
        "topic": "能量与动量",
        "summary": "刘浩然发现动能定理就是从F=ma推出来的。",
        "frameType": "network",
        "milestone": "概念重构",
        "nodes": [
          {
            "id": "g_17",
            "label": "牛顿第二定律",
            "content": "F=ma，经典力学的基石",
            "shape": "sphere",
            "color": "#E53E3E",
            "mastery": 0.8,
            "isNew": false,
            "isUpdated": true,
            "anchors": [
              "汽车制动"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_18",
            "label": "动能定理",
            "content": "W=ΔEk",
            "shape": "box",
            "color": "#4C51BF",
            "mastery": 0.6,
            "isNew": true,
            "isUpdated": false,
            "anchors": [
              "碰撞测试"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_19",
            "label": "动量守恒",
            "content": "m1v1+m2v2守恒",
            "shape": "torus",
            "color": "#805AD5",
            "mastery": 0.55,
            "isNew": true,
            "isUpdated": false,
            "anchors": [
              "粒子加速器"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_20",
            "label": "物理统一性",
            "content": "力→功→能→动量，一条逻辑链",
            "shape": "cylinder",
            "color": "#38A169",
            "mastery": 0.7,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "牛顿第二定律",
            "target": "动能定理"
          },
          {
            "source": "动能定理",
            "target": "动量守恒"
          }
        ]
      }
    ]
  },
  {
    "studentId": "cyt",
    "studentName": "陈雨桐",
    "subject": "physics",
    "highlight": "从电磁学完全不懂到能解释MRI和发电机原理——4轮对话从零到一",
    "sessions": [
      {
        "date": "2026-02-20",
        "topic": "电磁学零基础",
        "summary": "陈雨桐说电磁学是物理里最玄学的部分。",
        "frameType": "tree",
        "nodes": [
          {
            "id": "g_21",
            "label": "电场",
            "content": "E=F/q",
            "shape": "sphere",
            "color": "#4C51BF",
            "mastery": 0.15,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_22",
            "label": "欧姆定律",
            "content": "I=U/R",
            "shape": "cylinder",
            "color": "#3182CE",
            "mastery": 0.2,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "电场",
            "target": "欧姆定律"
          }
        ]
      },
      {
        "date": "2026-03-15",
        "topic": "磁场与洛伦兹力",
        "summary": "陈雨桐追问左手定则到底怎么用，AI带她用左手模拟电子偏转。",
        "frameType": "orbital",
        "milestone": "首次掌握",
        "nodes": [
          {
            "id": "g_23",
            "label": "电场",
            "content": "E=F/q",
            "shape": "sphere",
            "color": "#4C51BF",
            "mastery": 0.4,
            "isNew": false,
            "isUpdated": true,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_24",
            "label": "磁场",
            "content": "磁感线从N到S",
            "shape": "torus",
            "color": "#553C9A",
            "mastery": 0.35,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_25",
            "label": "洛伦兹力",
            "content": "F=qvBsinθ",
            "shape": "box",
            "color": "#E53E3E",
            "mastery": 0.3,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "磁场",
            "target": "洛伦兹力"
          }
        ]
      },
      {
        "date": "2026-04-22",
        "topic": "电磁感应的原理",
        "summary": "AI从洛伦兹力推导到法拉第定律。",
        "frameType": "pipeline",
        "milestone": "概念重构",
        "nodes": [
          {
            "id": "g_26",
            "label": "电磁感应",
            "content": "E=BLv",
            "shape": "sphere",
            "color": "#00B5D8",
            "mastery": 0.5,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_27",
            "label": "法拉第定律",
            "content": "感应电动势=磁通量变化率",
            "shape": "box",
            "color": "#D69E2E",
            "mastery": 0.45,
            "isNew": true,
            "isUpdated": false,
            "anchors": [
              "发电机"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_28",
            "label": "洛伦兹力",
            "content": "F=qvB",
            "shape": "box",
            "color": "#E53E3E",
            "mastery": 0.5,
            "isNew": false,
            "isUpdated": true,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "洛伦兹力",
            "target": "电磁感应"
          },
          {
            "source": "电磁感应",
            "target": "法拉第定律"
          }
        ]
      },
      {
        "date": "2026-05-30",
        "topic": "电磁学的真实应用",
        "summary": "陈雨桐告诉AI——上次去医院做MRI，突然想到那个大磁铁就是洛伦兹力的应用。",
        "frameType": "network",
        "milestone": "应用锚点突破",
        "nodes": [
          {
            "id": "g_29",
            "label": "电磁感应",
            "content": "E=BLv，发电机变压器",
            "shape": "sphere",
            "color": "#00B5D8",
            "mastery": 0.75,
            "isNew": false,
            "isUpdated": true,
            "anchors": [
              "发电机",
              "无线充电"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_30",
            "label": "MRI",
            "content": "3T磁场+射频脉冲",
            "shape": "torus",
            "color": "#38A169",
            "mastery": 0.65,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_31",
            "label": "洛伦兹力",
            "content": "F=qvB,MRI/电动机",
            "shape": "box",
            "color": "#E53E3E",
            "mastery": 0.7,
            "isNew": false,
            "isUpdated": true,
            "anchors": [
              "MRI成像"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_32",
            "label": "电磁统一",
            "content": "电→磁→力，三位一体",
            "shape": "cylinder",
            "color": "#805AD5",
            "mastery": 0.8,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "电磁感应",
            "target": "电磁统一"
          },
          {
            "source": "洛伦兹力",
            "target": "MRI"
          }
        ]
      }
    ]
  },
  {
    "studentId": "lmc",
    "studentName": "李沐辰",
    "subject": "mathematics",
    "highlight": "从数列极限是最恐怖的部分到自信地用ε-N语言定义极限",
    "sessions": [
      {
        "date": "2026-04-05",
        "topic": "数列极限的恐惧",
        "summary": "李沐辰说一看到ε-N就头疼，AI解释ε是你定的目标。",
        "frameType": "spectrum",
        "nodes": [
          {
            "id": "g_33",
            "label": "数列极限",
            "content": "n→∞时an→L",
            "shape": "sphere",
            "color": "#805AD5",
            "mastery": 0.2,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_34",
            "label": "ε-N定义",
            "content": "∀ε>0,∃N,∀n>N",
            "shape": "box",
            "color": "#553C9A",
            "mastery": 0.15,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_35",
            "label": "收敛",
            "content": "数列趋近某个确定值",
            "shape": "cylinder",
            "color": "#3182CE",
            "mastery": 0.25,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "数列极限",
            "target": "ε-N定义"
          },
          {
            "source": "数列极限",
            "target": "收敛"
          }
        ]
      },
      {
        "date": "2026-05-18",
        "topic": "极限的理解突破",
        "summary": "李沐辰自己想通了——ε-N就像靶心，你会自己打比方了——这是学懂了的标志。",
        "frameType": "lens",
        "milestone": "思维纠错",
        "nodes": [
          {
            "id": "g_36",
            "label": "数列极限",
            "content": "ε-N定义：目标越准越往后越靠近",
            "shape": "sphere",
            "color": "#805AD5",
            "mastery": 0.7,
            "isNew": false,
            "isUpdated": true,
            "anchors": [
              "金融精算"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_37",
            "label": "数列求和",
            "content": "等差等比求和裂项法",
            "shape": "box",
            "color": "#D69E2E",
            "mastery": 0.55,
            "isNew": true,
            "isUpdated": false,
            "anchors": [
              "房贷月供"
            ],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          },
          {
            "id": "g_38",
            "label": "极限应用",
            "content": "微积分基础→物理→经济",
            "shape": "cylinder",
            "color": "#38A169",
            "mastery": 0.6,
            "isNew": true,
            "isUpdated": false,
            "anchors": [],
            "depth": 0,
            "parentIds": [],
            "metadata": {
              "createdBy": "ai",
              "createdAt": "2026-03-01",
              "version": 1
            }
          }
        ],
        "edges": [
          {
            "source": "数列极限",
            "target": "数列求和"
          },
          {
            "source": "数列极限",
            "target": "极限应用"
          }
        ]
      }
    ]
  }
];
