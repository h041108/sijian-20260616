const fs = require('fs')

const subjects = {
  math: {
    name: '数学',
    subject: 'mathematics',
    points: [
      '集合运算','函数单调性','三角函数','数列极限','概率统计',
      '立体几何','解析几何','导数应用','复数','不等式','向量','排列组合'
    ],
    content: [
      '交集并集补集子集与韦恩图','导数正增负减判单调区间','正弦定理余弦定理同角恒等变换','等差等比通项求和裂项错位','古典概型条件概率贝叶斯正态分布',
      '空间向量线面角二面角点到面距','椭圆双曲抛物线焦点准线离心率','极值最值切线凹凸洛必达','a+bi模辐角共轭棣莫弗','均值柯西排序含绝对值','点积叉积共线垂直坐标','P(n,k)C(n,k)二项式杨辉'
    ]
  },
  physics: {
    name: '物理',
    subject: 'physics',
    points: [
      '牛顿定律','动能定理','动量守恒','电场磁场',
      '电磁感应','简谐振动','万有引力','热力学','光学','原子物理','电路分析'
    ],
    content: [
      'F=ma惯性作用力反作用力受力分析','W=ΔEk功是能量转化的量度','弹性非弹性碰撞m1v1+m2v2守恒','E=F/q洛伦兹力安培力左手定则',
      '法拉第楞次定律自感互感变压器','单摆T=2π√L/g弹簧振子简谐波','开普勒三定律第一二三维宇宙速度','PV=nRT卡诺循环热力学定律','折射全反射干涉衍射杨氏双缝','玻尔模型光电效应hν=W+Ek能级','欧姆基尔霍夫串并联RC充放电'
    ]
  },
  chemistry: {
    name: '化学',
    subject: 'chemistry',
    points: [
      '化学平衡','氧化还原','有机化学','元素周期',
      '化学键','溶液化学','电化学','反应速率','晶体结构'
    ],
    content: [
      '勒夏特列Kc温浓压对平衡影响','氧化数氧化剂还原剂电化学配平','官能团取代加成消去酯化同分异构','原子离子半径电负性电离能s/p/d/f递变',
      '离子共价金属键VSEPR杂化分子构型','Ksp同离子效应胶体依数性pH','原电池电解池Nernst法拉第电极电势','速率方程活化能Arrhenius催化剂','NaCl型CsCl型ZnS型晶胞配位数'
    ]
  }
}

// 100 姓名
const surnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮下齐康伍余元卜'
const given = ['思远','浩然','雨桐','子涵','沐辰','一诺','宇轩','梓涵','奕辰','诗涵','明哲','欣怡','俊杰','梓萱','昊天','雨萱','皓轩','若溪','文博','雅静','博文','晓彤','家豪','梦琪','志远','雪莹','伟杰','诗琪','建辉','语嫣','俊熙','可欣','泽宇','思琪','鸿飞','紫萱','天佑','美琳','铭宇','丽华','振国','秀英','子豪','慧敏','伟强','晓燕','浩宇','雨彤','子轩','思涵']
const names = Array.from({length:100},(_,i)=>surnames[i%surnames.length]+given[i%given.length])

const allRooms = []
const baseDate = new Date('2026-03-01')
const colors = ['#E53E3E','#D53F8C','#805AD5','#553C9A','#4C51BF','#3182CE','#00B5D8','#319795','#38A169','#68D391','#9AE6B4','#D69E2E','#F6E05E','#ED8936','#DD6B20','#8B4513']
const shapes = ['sphere','box','cylinder','torus']

for (let si = 0; si < 100; si++) {
  // 每个学生的偏科系数
  const strength = {
    math: Math.random() * 0.6 + 0.2,
    physics: Math.random() * 0.6 + 0.2,
    chemistry: Math.random() * 0.6 + 0.2,
  }

  for (const [key, subj] of Object.entries(subjects)) {
    const roomDate = new Date(baseDate.getTime() + Math.floor(Math.random()*90)*86400000)
    const items = []

    for (let pi = 0; pi < subj.points.length; pi++) {
      // 掌握度：大幅加宽分布，模拟真实学情差异（差生10%，尖子生95%）
      const s = strength[key]
      const raw = (Math.random() * 0.7 + 0.1 + s * 0.15) // 范围 0.1-0.95
      const baseMastery = Math.min(0.95, Math.max(0.08, raw))
      const mastery = Math.round(baseMastery * 100) / 100
      const reviewCount = Math.min(3, Math.max(0, Math.floor(mastery * 4 + Math.random() - 0.5)))

      const intervals = [1, 3, 7, 30, 90]
      const schedules = intervals.map((days, ri) => {
        const sd = new Date(roomDate.getTime() + days * 86400000)
        const done = ri < reviewCount
        return {
          intervalDays: days,
          scheduledAt: sd.toISOString(),
          completedAt: done ? new Date(sd.getTime() + Math.random()*7200000).toISOString() : null,
          score: done ? Math.min(5, Math.max(1, Math.round(mastery * 5 + (Math.random()-0.5)*2))) : null
        }
      })

      const lastIdx = reviewCount - 1
      items.push({
        id: `i_${si}_${key}_${pi}`,
        label: subj.points[pi],
        content: subj.content[pi] || subj.points[pi],
        shape: shapes[pi % 4],
        color: colors[pi % 16],
        anchors: [], // 精简以减少体积
        position: { x: 40 + (pi % 4) * 80, y: 60 + Math.floor(pi / 4) * 80 },
        reviewSchedule: schedules,
        lastReviewedAt: lastIdx >= 0 ? schedules[lastIdx]?.completedAt : null,
        nextReviewAt: reviewCount < intervals.length ? schedules[reviewCount]?.scheduledAt : schedules[intervals.length-1]?.scheduledAt,
        reviewCount,
        mastery,
        sourceSpaceId: `sp_${key}_${si}`,
        sourceTeacherId: 'teacher_main',
        createdAt: roomDate.toISOString()
      })
    }

    allRooms.push({
      id: `room_${si}_${key}`,
      name: `${names[si]} · ${subj.name}`,
      subject: subj.subject,
      description: `${names[si]}的${subj.name}思维室 · 高三复习`,
      createdAt: roomDate.toISOString(),
      items
    })
  }
}

const totalItems = allRooms.reduce((s,r) => s + r.items.length, 0)
fs.writeFileSync('src/lib/seed-palace.ts',
  `// 100名学生×3学科 = ${allRooms.length}个房间, ${totalItems}个概念\nexport const SEED_ROOMS = ` + JSON.stringify(allRooms) + ';\n'
)
console.log('生成完成:', allRooms.length, '房间', totalItems, '概念 (约' + (fs.statSync('src/lib/seed-palace.ts').size/1024/1024).toFixed(1) + 'MB)')
