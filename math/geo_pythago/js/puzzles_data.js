/**
 * 精选真题题库（100% 源自 4 份 PDF 讲义、笔记、小测验与作业答案）
 * 覆盖全部 8 大招式，分 core (80分必拿) 与 sprint (95+冲刺)
 */
(function (global) {
  'use strict';

  var V = global.GeoVerify || (typeof require !== 'undefined' ? require('./geo_verify.js') : null);

  var PUZZLES = [
    // ==================== R1：面积定边剪拼 ====================
    {
      id: 'P01',
      routineId: 'R1',
      tier: 'core',
      source: '小测验 T2',
      title: '9×4 长方形剪拼正方形',
      question: '一个长 9 厘米、宽 4 厘米的长方形，剪成两块拼成一个正方形，拼成的正方形边长是多少厘米？',
      answer: 6,
      unit: '厘米',
      hints: [
        '拼图前后，图形的总面积会不会发生变化？先算算长方形的面积吧！',
        '长方形面积 = 9 × 4 = 36 平方厘米，想想哪个数自己乘自己等于 36？',
        '因为 6 × 6 = 36，所以正方形边长是 6 厘米！（剪法：9→6 缩 3，4→6 增 2，画 3×2 阶梯线即可，可在“动手实验室”亲自拖动体验！）'
      ],
      parentCoach: '先让孩子算面积 9×4=36，再问他“哪两个相同的数相乘得 36？”答出 6 后，带他去“动手实验室”拉动阶梯滑块看怎么两刀拼出 6×6！',
      svg: {
        viewBox: '0 0 340 200',
        items: [
          { type: 'rect', x: 35, y: 50, w: 270, h: 120, fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2.3 },
          { type: 'label', x: 170, y: 34, text: '长 = 9 厘米', color: '#1e3a8a' },
          { type: 'label', x: 18, y: 110, text: '4', color: '#1e3a8a' },
          { type: 'line', x1: 125, y1: 50, x2: 125, y2: 110, stroke: '#dc2626', strokeWidth: 3, aux: true, minStep: 2 },
          { type: 'line', x1: 125, y1: 110, x2: 215, y2: 110, stroke: '#dc2626', strokeWidth: 3, aux: true, minStep: 2 },
          { type: 'line', x1: 215, y1: 110, x2: 215, y2: 170, stroke: '#dc2626', strokeWidth: 3, aux: true, minStep: 2 },
          { type: 'label', x: 85, y: 138, text: '①', color: '#1e3a8a', size: 16, minStep: 2 },
          { type: 'label', x: 255, y: 84, text: '② (←3 ↑2)', color: '#dc2626', size: 13, minStep: 2 }
        ]
      }
    },
    {
      id: 'P02',
      routineId: 'R1',
      tier: 'core',
      source: '小测验 T1',
      title: '阶梯多边形拼正方形',
      question: '如图是一个阶梯形多边形：左侧总高 7，底宽 4，右下高 4、向内凹进 1、上方高 3、顶宽 3。把它裁成 3 块拼成一个正方形，这个正方形的边长是多少？',
      answer: 5,
      unit: '',
      hints: [
        '先把它上下拆成两个长方形，算出这个多边形的总面积！',
        '下面长方形 4×4 = 16，上面长方形 3×3 = 9，总面积是多少？',
        '总面积 = 16 + 9 = 25 = 5 × 5，所以拼成的正方形边长是 5！（剪法：保留下方 5×4 缺角块，把上面 2×3 拆成 2×1 和 2×2 补到右边！）'
      ],
      parentCoach: '孩子容易直接盯着边长 7 发呆，提醒他“剪拼第一招：先算总面积！”16+9=25 一下就豁然开朗。',
      svg: {
        viewBox: '0 0 340 240',
        items: [
          { type: 'polygon', points: [[110,30],[185,30],[185,105],[210,105],[210,205],[110,205]], fill: '#fef3c7', stroke: '#92400e', strokeWidth: 2.3 },
          { type: 'label', x: 96, y: 118, text: '7', color: '#1e293b' },
          { type: 'label', x: 147, y: 18, text: '3', color: '#1e293b' },
          { type: 'label', x: 196, y: 68, text: '3', color: '#1e293b' },
          { type: 'label', x: 198, y: 120, text: '1', color: '#1e293b', size: 12 },
          { type: 'label', x: 224, y: 155, text: '4', color: '#1e293b' },
          { type: 'label', x: 160, y: 222, text: '4', color: '#1e293b' },
          { type: 'line', x1: 110, y1: 105, x2: 185, y2: 105, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'label', x: 147, y: 68, text: '3×3=9', color: '#dc2626', size: 13, minStep: 1 },
          { type: 'label', x: 160, y: 155, text: '4×4=16', color: '#1e3a8a', size: 13, minStep: 1 }
        ]
      }
    },
    {
      id: 'P03',
      routineId: 'R1',
      tier: 'sprint',
      source: '第 13 讲附加题 4',
      title: '9×5 缺角勾股斜切',
      question: '将一个 9×5 的大长方形从角上剪掉一个 4×1 的小长方形，余下图形分成 3 部分拼成一个正方形，这个正方形的面积是多少？',
      answer: 41,
      unit: '',
      hints: [
        '余下图形的面积，就是大长方形面积减去剪掉的小长方形面积。',
        '算完面积 41 后，想想 41 = 4² + 5² 说明了什么？',
        '面积 = 9×5 - 4×1 = 41 = 4² + 5²！所以斜正方形的边长就是直角边为 4 和 5 的斜边，切两块直角三角形即可平移拼成！'
      ],
      parentCoach: '算面积 41 很简单，真正的精华是追问孩子：“41 不是完全平方数，为什么还能拼成正方形？”引导他发现 41 = 4² + 5²！',
      svg: V ? V.buildCut41Data().svgSpec : { viewBox: '0 0 340 270', items: [] }
    },

    // ==================== R2：+3 魔法分割 ====================
    {
      id: 'P04',
      routineId: 'R2',
      tier: 'core',
      source: '小测验 T3',
      title: '大正方形分成 19 个小正方形',
      question: '从一个完整大正方形（1 块）出发，每次把其中 1 个正方形田字格“一分为四”（总数 +3），最少操作几次就能正好得到 19 个小正方形？',
      answer: 6,
      unit: '次',
      hints: [
        '原来有 1 个正方形，每“一分为四”一次，总数增加 3 个。',
        '从 1 个变成 19 个，总共增加了多少个？除以 3 就是次数！',
        '(19 - 1) ÷ 3 = 18 ÷ 3 = 6 次！（1 → 4 → 7 → 10 → 13 → 16 → 19，可在实验室亲手点 6 下验证！）'
      ],
      parentCoach: '让孩子列举前几步：1、4、7、10、13、16、19，再问他：“那 18 个能不能从 1 开始只靠 +3 得到？”顺势引出 3×3 底盘！',
      svg: {
        viewBox: '0 0 340 220',
        items: [
          { type: 'rect', x: 85, y: 25, w: 170, h: 170, fill: '#f8fafc', stroke: '#1e3a8a', strokeWidth: 2.4 },
          { type: 'line', x1: 170, y1: 25, x2: 170, y2: 195, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'line', x1: 85, y1: 110, x2: 255, y2: 110, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'label', x: 170, y: 210, text: '每次“田字一分为四”，总数 +3', color: '#1e3a8a', size: 13 }
        ]
      }
    },
    {
      id: 'P05',
      routineId: 'R2',
      tier: 'core',
      source: '小测验 T3 进阶',
      title: '从 3×3 网格切出 18 个小正方形',
      question: '如果先把大正方形平均分成 3×3 = 9 个小正方形，再每次把其中 1 块“一分为四”，需要操作几次就能正好得到 18 个小正方形？',
      answer: 3,
      unit: '次',
      hints: [
        '起始已经是 9 个小正方形了，目标是 18 个。',
        '需要净增加 18 - 9 = 9 个，每次“一分为四”增加 3 个。',
        '(18 - 9) ÷ 3 = 3 次！（9 → 12 → 15 → 18）'
      ],
      parentCoach: '这就是老师讲的“按除以 3 的余数选底盘”：余 1 用 1×1（1块），余 0 用 3×3（9块），余 2 用 2×2+3×3（6块或 11块）！',
      svg: {
        viewBox: '0 0 340 220',
        items: [
          { type: 'rect', x: 85, y: 25, w: 170, h: 170, fill: '#eff6ff', stroke: '#1e3a8a', strokeWidth: 2.4 },
          { type: 'line', x1: 141.6, y1: 25, x2: 141.6, y2: 195, stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'line', x1: 198.3, y1: 25, x2: 198.3, y2: 195, stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'line', x1: 85, y1: 81.6, x2: 255, y2: 81.6, stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'line', x1: 85, y1: 138.3, x2: 255, y2: 138.3, stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'rect', x: 85, y: 25, w: 56.6, h: 56.6, fill: '#fef08a', stroke: '#d97706', strokeWidth: 2, minStep: 2 },
          { type: 'label', x: 170, y: 210, text: '底盘 9 块 → 每次 +3 → 目标 18 块', color: '#0f766e', size: 13 }
        ]
      }
    },

    // ==================== R3：垂线拉平造直角 ====================
    {
      id: 'P06',
      routineId: 'R3',
      tier: 'core',
      source: '作业练习 1',
      title: '等腰梯形切高求周长',
      question: '一个等腰梯形，上底为 3，下底为 9，高为 4，则此梯形的周长是多少？',
      answer: 22,
      unit: '',
      hints: [
        '从上底的两个端点向下底作两条高，把梯形切成 1 个长方形和 2 个一样的直角三角形！',
        '下底 9 减去中间的 3 剩 6，平分给左右两边，每个直角三角形的底边是 3，高是 4。',
        '由 3-4-5 勾股数知两条腰都是 5！所以周长 = 3 + 9 + 5 + 5 = 22。'
      ],
      parentCoach: '提醒孩子：“求周长别忘了把上下底和两条腰全都加起来，很多小朋友算完腰=5就忘了加3和9！”',
      svg: {
        viewBox: '0 0 340 220',
        items: [
          { type: 'polygon', points: [[125,55],[215,55],[285,165],[55,165]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2.3 },
          { type: 'label', x: 170, y: 42, text: '3' },
          { type: 'label', x: 170, y: 184, text: '下底 = 9' },
          { type: 'line', x1: 125, y1: 55, x2: 125, y2: 165, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'line', x1: 215, y1: 55, x2: 215, y2: 165, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'rightAngle', x: 125, y: 165, dx1: 10, dy1: 0, dx2: 0, dy2: -10, minStep: 1 },
          { type: 'label', x: 138, y: 112, text: '4', color: '#dc2626', minStep: 1 },
          { type: 'label', x: 90, y: 154, text: '3', color: '#dc2626', minStep: 2 },
          { type: 'label', x: 76, y: 102, text: '腰=5', color: '#0f766e', minStep: 2 }
        ]
      }
    },
    {
      id: 'P07',
      routineId: 'R3',
      tier: 'core',
      source: '作业练习 2',
      title: '双直角三角形相减求面积',
      question: '四边形 ABCD 中，∠A = 90°，AB = 6，AD = 8，BC = 24，CD = 26（A 点向内凹进），求四边形 ABCD 的面积。',
      answer: 96,
      unit: '',
      hints: [
        '连接 B 和 D！看看新出现的 △ABD 是什么三角形？',
        '在直角 △ABD 中，6-8-10 得 BD = 10。再看 △BCD 的三边：10、24、26，是不是勾股数？',
        '10² + 24² = 676 = 26²，所以 ∠DBC = 90°！四边形面积 = 大直角面积 - 小直角面积 = 10×24÷2 - 6×8÷2 = 120 - 24 = 96。'
      ],
      parentCoach: '这道题藏着“勾股定理逆定理”：算完 BD=10 后，让孩子验算 10²+24² 和 26² 是不是相等！',
      svg: {
        viewBox: '0 0 340 220',
        items: [
          { type: 'polygon', points: [[75,45],[118,125],[75,165],[285,165]], fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 2.3 },
          { type: 'label', x: 64, y: 42, text: 'D' }, { type: 'label', x: 64, y: 170, text: 'B' },
          { type: 'label', x: 130, y: 126, text: 'A' }, { type: 'label', x: 296, y: 170, text: 'C' },
          { type: 'label', x: 106, y: 84, text: '8' }, { type: 'label', x: 104, y: 150, text: '6' },
          { type: 'label', x: 185, y: 180, text: '24' }, { type: 'label', x: 195, y: 95, text: '26' },
          { type: 'line', x1: 75, y1: 45, x2: 75, y2: 165, stroke: '#dc2626', strokeWidth: 2.6, aux: true, minStep: 1 },
          { type: 'label', x: 56, y: 108, text: '10', color: '#dc2626', minStep: 2 }
        ]
      }
    },
    {
      id: 'P08',
      routineId: 'R3',
      tier: 'core',
      source: '作业练习 3',
      title: '直角梯形阴影三角形周长',
      question: '直角梯形 ABCD 中，∠B = 90°，上底 AD = 4，高 AB = 12，下底 BC = 9，连接 AC，求 △ACD 的周长。',
      answer: 32,
      unit: '',
      hints: [
        '△ACD 有三条边：AD=4 已知，需要用勾股定理求出 AC 和 CD。',
        'AC 在直角 △ABC 里（直角边 9 和 12）；求 CD 时，过 D 向下底作高！',
        'AC = 15（9-12-15）；过 D 作高得直角边 12 和 9-4=5，所以 CD = 13（5-12-13）！周长 = 4 + 15 + 13 = 32。'
      ],
      parentCoach: '一题连考两组最经典勾股数：9-12-15 和 5-12-13，让孩子口算报出 15 和 13！',
      svg: {
        viewBox: '0 0 340 220',
        items: [
          { type: 'polygon', points: [[110,40],[162,40],[227,196],[110,196]], fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2.2 },
          { type: 'polygon', points: [[110,40],[162,40],[227,196]], fill: '#cbd5e1', stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'rightAngle', x: 110, y: 196, dx1: 10, dy1: 0, dx2: 0, dy2: -10 },
          { type: 'label', x: 96, y: 118, text: '12' },
          { type: 'label', x: 136, y: 26, text: '4' },
          { type: 'label', x: 168, y: 210, text: '9' },
          { type: 'line', x1: 162, y1: 40, x2: 162, y2: 196, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'label', x: 194, y: 208, text: '5', color: '#dc2626', minStep: 2 },
          { type: 'label', x: 206, y: 110, text: '13', color: '#0f766e', minStep: 2 },
          { type: 'label', x: 152, y: 125, text: '15', color: '#1d4ed8', minStep: 2 }
        ]
      }
    },
    {
      id: 'P09',
      routineId: 'R3',
      tier: 'core',
      source: '作业练习 4',
      title: '锯齿折线拉平求斜边',
      question: '从 A 到 B 的阶梯折线依次向右 2、向下 2、向右 3、向下 4、向右 1、向下 2，求线段 AB 的直线长度。',
      answer: 10,
      unit: '',
      hints: [
        '把所有“向右”的线段合在一起，所有“向下”的线段合在一起！',
        '总水平宽度 = 2 + 3 + 1 = 6，总竖直高度 = 2 + 4 + 2 = 8。',
        '6² + 8² = 100 = 10²，所以 AB = 10！'
      ],
      parentCoach: '这就是“平移拉直大法”，无论折线拐多少弯，只要全是横竖直角，起点到终点的水平距离和竖直距离一加就成大直角！',
      svg: {
        viewBox: '0 0 340 230',
        items: [
          { type: 'polygon', points: [[80,35],[125,35],[125,80],[192,80],[192,170],[215,170],[215,215]], fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'line', x1: 125, y1: 35, x2: 215, y2: 35, stroke: '#dc2626', strokeWidth: 2.4, aux: true, minStep: 1 },
          { type: 'line', x1: 215, y1: 35, x2: 215, y2: 170, stroke: '#dc2626', strokeWidth: 2.4, aux: true, minStep: 1 },
          { type: 'label', x: 68, y: 35, text: 'A' }, { type: 'label', x: 228, y: 215, text: 'B' },
          { type: 'label', x: 150, y: 20, text: '6', color: '#dc2626', minStep: 1 },
          { type: 'label', x: 232, y: 125, text: '8', color: '#dc2626', minStep: 1 }
        ]
      }
    },
    {
      id: 'P10',
      routineId: 'R3',
      tier: 'core',
      source: '作业练习 5',
      title: '连环直角三角形（只算平方）',
      question: '三个直角三角形首尾相连：第一个直角边为 3 和 5；以它的斜边为直角边、再加一条长 1 的直角边组成第二个；再加一条长 1 的直角边组成第三个。问最外侧斜边长是多少？',
      answer: 6,
      unit: '',
      hints: [
        '千万别急着算第一条斜边是多少！只把它的“平方”记下来就行！',
        '第一条斜边的平方 = 3² + 5² = 34；第二条斜边的平方 = 34 + 1² = 35。',
        '第三条斜边的平方 = 35 + 1² = 36 = 6²，所以最外侧斜边长是 6！'
      ],
      parentCoach: '教孩子一个超级爽的技巧：连环勾股题“一路算平方，到最后再开方”！',
      svg: {
        viewBox: '0 0 340 230',
        items: [
          { type: 'polygon', points: [[120,195],[195,195],[120,65]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'polygon', points: [[195,195],[120,65],[152,48]], fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'polygon', points: [[195,195],[152,48],[186,42]], fill: '#fef3c7', stroke: '#b45309', strokeWidth: 2 },
          { type: 'rightAngle', x: 120, y: 195, dx1: 10, dy1: 0, dx2: 0, dy2: -10 },
          { type: 'label', x: 158, y: 210, text: '3' },
          { type: 'label', x: 106, y: 130, text: '5' },
          { type: 'label', x: 134, y: 46, text: '1', size: 12 },
          { type: 'label', x: 170, y: 34, text: '1', size: 12 },
          { type: 'label', x: 205, y: 118, text: '?', color: '#dc2626', size: 17 }
        ]
      }
    },
    {
      id: 'P11',
      routineId: 'R3',
      tier: 'core',
      source: '小测验 T7',
      title: '蜗牛壳 8 个直角三角形',
      question: '由 8 个直角三角形拼成蜗牛壳：最里面直角边是 1 和 1，之后每个新直角三角形的外侧直角边都是 1。问第 8 个三角形最外侧的斜边长是多少？',
      answer: 3,
      unit: '',
      hints: [
        '和上一题一样，一路只记斜边的“平方”！第 1 个斜边平方 = 1² + 1² = 2。',
        '每多拼 1 个外侧边为 1 的直角三角形，斜边的平方就 +1！',
        '8 个三角形依次得到斜边平方：2, 3, 4, 5, 6, 7, 8, 9！最后 9 = 3²，所以边长是 3！'
      ],
      parentCoach: '这叫“毕达哥拉斯蜗牛壳”，让孩子跟着数 2、3、4、5、6、7、8、9，一眼看出 9 是 3 的平方！',
      svg: {
        viewBox: '0 0 340 230',
        items: [
          { type: 'polygon', points: [[170,130],[220,130],[220,90]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'polygon', points: [[170,130],[220,90],[190,55]], fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'polygon', points: [[170,130],[190,55],[145,45]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'polygon', points: [[170,130],[145,45],[105,65]], fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'polygon', points: [[170,130],[105,65],[82,102]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'polygon', points: [[170,130],[82,102],[80,148]], fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 1.8 },
          { type: 'polygon', points: [[170,130],[80,148],[100,190]], fill: '#fef3c7', stroke: '#b45309', strokeWidth: 2 },
          { type: 'label', x: 196, y: 145, text: '1', size: 12 },
          { type: 'label', x: 230, y: 112, text: '1', size: 12 },
          { type: 'label', x: 145, y: 174, text: '? (平方=9)', color: '#dc2626', size: 13, minStep: 2 },
          { type: 'label', x: 142, y: 174, text: '?', color: '#dc2626', size: 16, maxStep: 1 }
        ]
      }
    },
    {
      id: 'P12',
      routineId: 'R3',
      tier: 'core',
      source: '作业练习 6',
      title: '长方体体对角线',
      question: '一个长方体的三条棱长分别是 3、4、12，求穿过长方体内部的体对角线 AC 的长度。',
      answer: 13,
      unit: '',
      hints: [
        '立体图形用两次勾股定理！先在侧面（3 和 4）算出面对角线 AB！',
        '面对角线 AB：3² + 4² = 5²，所以 AB = 5。',
        '再把 AB = 5 和长棱 12 组成内部直角三角形：5² + 12² = 13²，所以 AC = 13！'
      ],
      parentCoach: '帮孩子在脑子里建立“两步跳”：先算底面/侧面斜边 5，再和 12 垂直搭出 5-12-13！',
      svg: {
        viewBox: '0 0 340 210',
        items: [
          { type: 'rect', x: 55, y: 85, w: 90, h: 75, fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2 },
          { type: 'polygon', points: [[55,85],[185,40],[275,40],[145,85]], fill: '#eff6ff', stroke: '#1e293b', strokeWidth: 2 },
          { type: 'polygon', points: [[145,85],[275,40],[275,115],[145,160]], fill: '#dbeafe', stroke: '#1e293b', strokeWidth: 2 },
          { type: 'line', x1: 55, y1: 85, x2: 145, y2: 160, stroke: '#1d4ed8', strokeWidth: 2.2, dash: '5 4', minStep: 1 },
          { type: 'line', x1: 55, y1: 85, x2: 275, y2: 115, stroke: '#dc2626', strokeWidth: 2.8, aux: true },
          { type: 'label', x: 42, y: 124, text: '3' },
          { type: 'label', x: 100, y: 175, text: '4' },
          { type: 'label', x: 222, y: 150, text: '12' },
          { type: 'label', x: 44, y: 82, text: 'A', color: '#dc2626' },
          { type: 'label', x: 288, y: 115, text: 'C', color: '#dc2626' }
        ]
      }
    },
    {
      id: 'P13',
      routineId: 'R3',
      tier: 'sprint',
      source: '小测验 T8',
      title: '60° 角作高求第三边',
      question: '在 △ABC 中，AB = 5，BC = 8，∠B = 60°，求 AC 的长度。（提示：直角三角形中 30° 角所对直角边是斜边的一半）',
      answer: 7,
      unit: '',
      hints: [
        '没有直角怎么办？从顶点 A 向 BC 边作高 AD，立刻切出两个直角三角形！',
        '左边 △ABD 中 ∠B = 60°，所以 ∠BAD = 30°，BD = 5 ÷ 2 = 2.5，DC = 8 - 2.5 = 5.5。',
        '高 AD² = 5² - 2.5² = 18.75；在右边直角 △ADC 中，AC² = 18.75 + 5.5² = 18.75 + 30.25 = 49 = 7²，所以 AC = 7！'
      ],
      parentCoach: '看到 60° 或 45° 就条件反射“作高造直角”！而且注意算到 AD² = 18.75 就停手，千万别去开根号！',
      svg: {
        viewBox: '0 0 340 220',
        items: [
          { type: 'polygon', points: [[135,55],[70,175],[270,175]], fill: '#eff6ff', stroke: '#1e3a8a', strokeWidth: 2.3 },
          { type: 'label', x: 135, y: 40, text: 'A' }, { type: 'label', x: 56, y: 182, text: 'B' }, { type: 'label', x: 282, y: 182, text: 'C' },
          { type: 'label', x: 88, y: 108, text: '5' }, { type: 'label', x: 170, y: 194, text: '8' },
          { type: 'label', x: 96, y: 162, text: '60°', color: '#1d4ed8', size: 12 },
          { type: 'label', x: 215, y: 108, text: '?', color: '#dc2626', size: 16 },
          { type: 'line', x1: 135, y1: 55, x2: 135, y2: 175, stroke: '#dc2626', strokeWidth: 2.4, aux: true, minStep: 1 },
          { type: 'rightAngle', x: 135, y: 175, dx1: 10, dy1: 0, dx2: 0, dy2: -10, minStep: 1 },
          { type: 'label', x: 102, y: 186, text: '2.5', color: '#dc2626', size: 12, minStep: 2 },
          { type: 'label', x: 202, y: 186, text: '5.5', color: '#0f766e', size: 12, minStep: 2 }
        ]
      }
    },

    // ==================== R4：整体平方与折叠 ====================
    {
      id: 'P14',
      routineId: 'R4',
      tier: 'core',
      source: '小测验 T4',
      title: '共用对角线的长方形与正方形',
      question: '一个长方形（长 17、宽 7）和一个正方形共用同一条对角线，求这个正方形的边长。',
      answer: 13,
      unit: '',
      hints: [
        '连接它们共用的那条对角线，设长度为 a，正方形边长为 b。',
        '从长方形看：a² = 7² + 17² = 49 + 289 = 338；从正方形看：a² = b² + b² = 2b²！',
        '所以 2b² = 338 → b² = 169 = 13²，正方形边长 b = 13！'
      ],
      parentCoach: '让孩子体会“设而不求”：对角线 a 根本不用开根号，直接用 a² 当桥梁连接两个直角三角形！',
      svg: {
        viewBox: '0 0 340 230',
        items: [
          { type: 'rect', x: 95, y: 40, w: 150, h: 150, fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2.2 },
          { type: 'polygon', points: [[95,190],[65,120],[215,40],[245,110]], fill: '#dbeafe', fillOpacity: 0.55, stroke: '#1d4ed8', strokeWidth: 2 },
          { type: 'line', x1: 95, y1: 190, x2: 245, y2: 40, stroke: '#dc2626', strokeWidth: 2.8, aux: true, minStep: 1 },
          { type: 'label', x: 256, y: 74, text: '7', color: '#1d4ed8' },
          { type: 'label', x: 186, y: 150, text: '17', color: '#1d4ed8' },
          { type: 'label', x: 170, y: 206, text: '边长 b = ?', color: '#dc2626' }
        ]
      }
    },
    {
      id: 'P15',
      routineId: 'R4',
      tier: 'core',
      source: '小测验 T5',
      title: '长是宽 3 倍求长方形面积',
      question: '一个长方形的长是宽的 3 倍，对角线长是 20，求这个长方形的面积。',
      answer: 120,
      unit: '',
      hints: [
        '设宽是 x，那么长就是 3x，长方形面积 = 3x × x = 3x²！',
        '用勾股定理写出 x² + (3x)² = 20²，算出 x² 是多少！',
        'x² + 9x² = 10x² = 400 → x² = 40！不用求 x，直接得面积 = 3x² = 3 × 40 = 120！'
      ],
      parentCoach: '强调重点：(3x)² = 9x²（不是 3x²！），算出 x²=40 直接乘 3 就完事，超痛快！',
      svg: {
        viewBox: '0 0 340 200',
        items: [
          { type: 'rect', x: 55, y: 55, w: 230, h: 90, fill: '#eff6ff', stroke: '#1e3a8a', strokeWidth: 2.3 },
          { type: 'line', x1: 55, y1: 145, x2: 285, y2: 55, stroke: '#dc2626', strokeWidth: 2.4 },
          { type: 'label', x: 170, y: 38, text: '长 = 3x', color: '#1e3a8a' },
          { type: 'label', x: 38, y: 100, text: 'x', color: '#1e3a8a' },
          { type: 'label', x: 170, y: 92, text: '20', color: '#dc2626', bg: '#fff', bgW: 16 }
        ]
      }
    },
    {
      id: 'P16',
      routineId: 'R4',
      tier: 'sprint',
      source: '小测验 T6',
      title: '长方形折角平方差求面积',
      question: '长方形 ABCD 长 5、宽 1，把右下角 C 折到左上角 A（折痕交 BC 于 M），求 △ABM 的面积。',
      answer: 1.2,
      unit: '',
      hints: [
        '折过去边长不变，所以 AM = MC，因此 AM + BM = BC = 5。',
        '在直角 △ABM 中，AM² - BM² = 1² = 1，用平方差公式得 (AM+BM)(AM-BM) = 1。',
        'AM - BM = 1 ÷ 5 = 0.2，和差公式得 BM = (5 - 0.2) ÷ 2 = 2.4，面积 = 1 × 2.4 ÷ 2 = 1.2！'
      ],
      parentCoach: '如果孩子忘了平方差公式，带他复习一下 (a+b)(a-b) = a² - b²，然后用和差公式求出 BM！',
      svg: {
        viewBox: '0 0 340 200',
        items: [
          { type: 'rect', x: 45, y: 65, w: 250, h: 60, fill: '#f8fafc', stroke: '#94a3b8', dash: '5 4', strokeWidth: 1.8 },
          { type: 'polygon', points: [[45,65],[45,125],[165,125]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2.3 },
          { type: 'label', x: 32, y: 95, text: '1' },
          { type: 'label', x: 170, y: 146, text: 'BC = 5' },
          { type: 'label', x: 105, y: 84, text: 'AM = MC', color: '#dc2626', size: 12, minStep: 1 }
        ]
      }
    },

    // ==================== R5：标准内外弦图与风车 ====================
    {
      id: 'P17',
      routineId: 'R5',
      tier: 'core',
      source: '第 14 讲例题 10',
      title: '赵爽弦图求小正方形面积',
      question: '在赵爽弦图中，四个全等直角三角形的两条直角边分别是 5 和 12，求中间小正方形的面积。',
      answer: 49,
      unit: '',
      hints: [
        '看看中间小正方形的边长，等于两条直角边的什么？',
        '小正方形边长 = 长直角边 - 短直角边 = 12 - 5 = 7！',
        '所以中间小正方形面积 = 7 × 7 = 49！（顺便记住大正方形面积 = 5² + 12² = 169）'
      ],
      parentCoach: '基础送分题！顺口再问孩子一句：“那大正方形面积是多少？”（169）',
      svg: {
        viewBox: '0 0 340 260',
        template: 'innerXuantu',
        templateOpts: { a: 5, b: 12, labelA: '5', labelB: '12', labelC: '13', labelInner: '?', cStep: 2, innerStep: 0 }
      }
    },
    {
      id: 'P18',
      routineId: 'R5',
      tier: 'core',
      source: '第 14 讲例题 11',
      title: '外弦图知内求外',
      question: '小正方形四个顶点都在大正方形边上，已知小正方形面积是 25，角落短边 AB = 3，求大正方形的面积。',
      answer: 49,
      unit: '',
      hints: [
        '小正方形面积 25，说明它的边长（也就是角落直角三角形的斜边）是 5！',
        '角落直角三角形斜边 5、短边 3，由 3-4-5 勾股数知另一条直角边 AC = 4！',
        '大正方形边长 = 3 + 4 = 7，所以大正方形面积 = 7 × 7 = 49！'
      ],
      parentCoach: '外弦图核心关系：大边长 = a + b，内边长 = 斜边 c！',
      svg: {
        viewBox: '0 0 340 260',
        template: 'outerXuantu',
        templateOpts: { a: 3, b: 4, labelA: 'AB=3', labelB: 'AC=4', centerText: '面积=25', bStep: 2 }
      }
    },
    {
      id: 'P19',
      routineId: 'R5',
      tier: 'core',
      source: '作业练习 10',
      title: '四个长方形围成大小正方形',
      question: '四个一样的长方形和一个小正方形拼成大正方形，大正方形面积 49 平方米，小正方形面积 4 平方米，求长方形短边长度（米）。',
      answer: 2.5,
      unit: '米',
      hints: [
        '先由面积算出两个正方形的边长：大边长 = 7，小边长 = 2！',
        '看大正方形的一条边：大边长 = 长 + 宽 = 7；中间小边长 = 长 - 宽 = 2！',
        '和差问题：短边（宽） = (7 - 2) ÷ 2 = 2.5 米！'
      ],
      parentCoach: '这就是“长方形版弦图”，其实把每个长方形沿对角线切开就是 8 个直角三角形，本质完全一样！',
      svg: {
        viewBox: '0 0 340 250',
        items: [
          { type: 'rect', x: 75, y: 30, w: 190, h: 190, fill: '#eff6ff', stroke: '#1e3a8a', strokeWidth: 2.4 },
          { type: 'rect', x: 143, y: 98, w: 54, h: 54, fill: '#94a3b8', stroke: '#1e293b', strokeWidth: 2 },
          { type: 'line', x1: 143, y1: 30, x2: 143, y2: 152, stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'line', x1: 197, y1: 98, x2: 197, y2: 220, stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'line', x1: 143, y1: 98, x2: 265, y2: 98, stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'line', x1: 75, y1: 152, x2: 197, y2: 152, stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'label', x: 170, y: 18, text: '大边长 = 7', color: '#dc2626', minStep: 1 },
          { type: 'label', x: 170, y: 125, text: '2', color: '#fff', minStep: 1 }
        ]
      }
    },
    {
      id: 'P20',
      routineId: 'R5',
      tier: 'core',
      source: '作业练习 9',
      title: '赵爽弦图向外延长变“数学风车”',
      question: '赵爽弦图中直角边 AC = 6，BC = 5，将四个直角三角形中边长为 6 的直角边分别向外延长一倍，得到“数学风车”，求风车的外围周长。',
      answer: 76,
      unit: '',
      hints: [
        '把边长为 6 的直角边向外延长一倍，延长出来的那一段也是 6，总直角边变成 6 + 6 = 12！',
        '现在每个风车叶片的直角边是 5 和 12，斜边是多少？',
        '由 5-12-13 知每个叶片斜边是 13，再加上外露的一段延长边 6，4 个叶片外围周长 = (13 + 6) × 4 = 76！'
      ],
      parentCoach: '易错点：风车外围周长包含 4 条斜边（13）和 4 条外露延长边（6），别漏掉那 4 条 6！',
      svg: {
        viewBox: '0 0 340 250',
        template: 'innerXuantu',
        templateOpts: { a: 5, b: 6, labelA: '5', labelB: '6', labelC: '延一倍→12', labelInner: '1', cStep: 1, innerStep: 1 }
      }
    },
    {
      id: 'P21',
      routineId: 'R5',
      tier: 'core',
      source: '作业练习 11',
      title: '赵爽弦图反求直角边',
      question: '在赵爽弦图中，大正方形面积是 100，小正方形边长是 2，且直角三角形边长都是整数，求较长直角边的长度。',
      answer: 8,
      unit: '',
      hints: [
        '大正方形面积 100 → 斜边 c = 10！',
        '小正方形边长 2 → 两条直角边之差 b - a = 2，且 a² + b² = 100！',
        '熟悉勾股数 6-8-10 立刻秒答：a = 6，b = 8（正好差 2），较长直角边是 8！'
      ],
      parentCoach: '还可以教孩子面积法：4 个三角形总面积 = 100 - 2² = 96，1 个三角形面积 = 24 → a×b = 48，差为 2 且积为 48 就是 6 和 8！',
      svg: {
        viewBox: '0 0 340 250',
        template: 'innerXuantu',
        templateOpts: { a: 6, b: 8, labelA: 'a', labelB: 'b', labelC: '斜边 = 10', labelInner: '2', cStep: 1, innerStep: 0 }
      }
    },

    // ==================== R6：外框补全法（穿直外衣） ====================
    {
      id: 'P22',
      routineId: 'R6',
      tier: 'core',
      source: '第 14 讲例题 12',
      title: '长方形斜嵌 6 个相同正方形',
      question: '长方形 ABCD（高 AB = 22，宽 BC = 20）内斜嵌 6 个相同正方形，竖向占 2a + 3b = 22，横向占 a + 3b = 20，求每个小正方形的面积。',
      answer: 40,
      unit: '平方厘米',
      hints: [
        '给每个斜正方形“穿直外衣”，每条边对应直角边 a 和 b 的直角三角形。',
        '竖向 2a + 3b = 22，横向 a + 3b = 20，两式相减直接得 a = 2！',
        '代入得 3b = 18 → b = 6！每个斜正方形面积 = a² + b² = 2² + 6² = 40 平方厘米！'
      ],
      parentCoach: '这道题是“穿直外衣”法的封神之作，记住口诀：斜正方形面积直接等于 a² + b²！',
      svg: V ? V.buildEmbedded6SquaresData().svgSpec : { viewBox: '0 0 340 262', items: [] }
    },
    {
      id: 'P23',
      routineId: 'R6',
      tier: 'core',
      source: '作业练习 13',
      title: '长方形斜嵌 8 个相同正方形',
      question: '长 20 厘米、宽 16 厘米的长方形内斜嵌 8 个相同正方形（横向 4b + 2a = 20，纵向 3b + 2a = 16），求每个正方形的面积。',
      answer: 20,
      unit: '平方厘米',
      hints: [
        '同样用“穿直外衣”法，列出横向和纵向关于 a、b 的两个算式！',
        '4b + 2a = 20 减去 3b + 2a = 16，直接得 b = 4！',
        '代入得 2a = 4 → a = 2，所以每个正方形面积 = a² + b² = 2² + 4² = 20 平方厘米！'
      ],
      parentCoach: '例 12 的亲兄弟题！孩子只要能独立列出 4b+2a=20 和 3b+2a=16，这招就彻底掌握了！',
      svg: {
        viewBox: '0 0 340 220',
        items: [
          { type: 'rect', x: 65, y: 30, w: 210, h: 160, fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2.2 },
          { type: 'label', x: 170, y: 18, text: '长 = 20（4b + 2a）', color: '#1e3a8a', size: 13 },
          { type: 'label', x: 36, y: 110, text: '宽=16', color: '#1e3a8a', size: 12 },
          { type: 'polygon', points: [[95,30],[145,55],[120,105],[70,80]], fill: '#dbeafe', stroke: '#1d4ed8', strokeWidth: 2 },
          { type: 'polygon', points: [[145,55],[195,80],[170,130],[120,105]], fill: '#e0f2fe', stroke: '#1d4ed8', strokeWidth: 2 },
          { type: 'polygon', points: [[195,80],[245,105],[220,155],[170,130]], fill: '#dbeafe', stroke: '#1d4ed8', strokeWidth: 2 },
          { type: 'label', x: 170, y: 174, text: 'b=4, a=2 → 面积 = 20', color: '#15803d', size: 13, minStep: 2 }
        ]
      }
    },
    {
      id: 'P24',
      routineId: 'R6',
      tier: 'sprint',
      source: '第 14 讲例题 15',
      title: '等腰梯形腰作正方形（穿外衣传高）',
      question: '等腰梯形 ABCD 上底 AD = 4，下底 BC = 8，以腰 CD 为边向外作正方形 CDEF，求 △ADE 的面积。',
      answer: 4,
      unit: '',
      hints: [
        '△ADE 的底 AD = 4 已知，只需要求出 E 点到直线 AD 的垂直高度！',
        '以斜正方形 CDEF 画外弦图垂线：梯形右下角切出的直角三角形，和 E 点往 AD 延长线作垂线形成的直角三角形全等！',
        '梯形底边多出的一截 = (8 - 4) ÷ 2 = 2，由外弦图全等知 △ADE 的高也是 2！所以面积 = 4 × 2 ÷ 2 = 4！'
      ],
      parentCoach: '这道题超级经典！告诉孩子：“正方形转 90° 的两条边，穿完外衣后，横边变竖边、竖边变横边！”',
      svg: {
        viewBox: '0 0 340 230',
        items: [
          { type: 'polygon', points: [[80,105],[160,105],[200,185],[40,185]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'polygon', points: [[160,105],[200,185],[280,145],[240,65]], fill: '#fef3c7', stroke: '#b45309', strokeWidth: 2.2 },
          { type: 'polygon', points: [[80,105],[160,105],[240,65]], fill: '#bbf7d0', fillOpacity: 0.75, stroke: '#15803d', strokeWidth: 2.2 },
          { type: 'label', x: 120, y: 118, text: '4' },
          { type: 'label', x: 120, y: 200, text: '8' },
          { type: 'line', x1: 160, y1: 105, x2: 240, y2: 105, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'line', x1: 240, y1: 65, x2: 240, y2: 105, stroke: '#dc2626', strokeWidth: 2.5, aux: true, minStep: 1 },
          { type: 'line', x1: 160, y1: 105, x2: 160, y2: 185, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'label', x: 262, y: 85, text: '高=2', color: '#dc2626', minStep: 2 },
          { type: 'label', x: 180, y: 196, text: '2', color: '#dc2626', minStep: 2 }
        ]
      }
    },
    {
      id: 'P25',
      routineId: 'R6',
      tier: 'sprint',
      source: '第 14 讲附加题 5',
      title: '双直角五边形补外弦图',
      question: '五边形顺时针五条边依次为 23、13、20、20、16，其中两条 20 的夹角为直角，23 和 16 的夹角也为直角。求这个五边形的面积。',
      answer: 562,
      unit: '平方厘米',
      hints: [
        '两条 20 的边互相垂直！直接以这两条 20 为边在内部补成一个 20×20 的斜正方形！',
        '给 20×20 斜正方形“穿直外衣”：底部直角边 16 和斜边 20 凑出 12-16-20 直角三角形！',
        '左侧边 23 减去下面的 12 剩 11！上方直角三角形斜边 13、宽 12 凑出 5-12-13！五边形面积 = 20² + 12×16÷2 + 11×12÷2 = 400 + 96 + 66 = 562！'
      ],
      parentCoach: '压轴好题！一步步点亮辅助线，让孩子惊叹 12-16-20 和 5-12-13 怎么严丝合缝卡在一起！',
      svg: V ? V.buildPentagon562Data().svgSpec : { viewBox: '0 0 340 250', items: [] }
    },

    // ==================== R7：内线十字分割法（伪弦图） ====================
    {
      id: 'P26',
      routineId: 'R7',
      tier: 'core',
      source: '第 14 讲例题 14',
      title: '正方形内部十字伪弦图（边长 6）',
      question: '正方形 ABCD 边长为 6，四边上各取一点 E、F、G、H，已知 AE + CG = 9，HD + BF = 8，求阴影四边形 EFGH 的面积。',
      answer: 21,
      unit: '',
      hints: [
        '过 E、G 画两条水平线，过 H、F 画两条竖直线，在里面围出一个小长方形！',
        '小长方形的高 = 9 - 6 = 3，宽 = 8 - 6 = 2，所以小长方形面积 = 2 × 3 = 6。',
        '四周四个角落都是空白与阴影对半分，阴影只多中间小长方形：S阴 = (6² + 6) ÷ 2 = 21！'
      ],
      parentCoach: '口诀记牢：“对边之和减大边，乘出中间小长方，大加小再除以 2！”',
      svg: {
        viewBox: '0 0 340 240',
        items: [
          { type: 'rect', x: 85, y: 25, w: 170, h: 170, fill: '#fff', stroke: '#1e293b', strokeWidth: 2.2 },
          { type: 'polygon', points: [[85,155],[195,195],[255,90],[140,25]], fill: '#cbd5e1', stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'line', x1: 85, y1: 155, x2: 195, y2: 155, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'line', x1: 140, y1: 90, x2: 255, y2: 90, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'line', x1: 140, y1: 25, x2: 140, y2: 155, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'line', x1: 195, y1: 90, x2: 195, y2: 195, stroke: '#dc2626', strokeWidth: 2, aux: true, minStep: 1 },
          { type: 'rect', x: 140, y: 90, w: 55, h: 65, fill: '#fde047', fillOpacity: 0.72, stroke: '#b45309', strokeWidth: 2, minStep: 2 },
          { type: 'label', x: 168, y: 122, text: '2×3=6', color: '#92400e', size: 13, minStep: 2 },
          { type: 'label', x: 170, y: 215, text: '边长 6，AE+CG=9，HD+BF=8', color: '#475569', size: 12.5 }
        ]
      }
    },
    {
      id: 'P27',
      routineId: 'R7',
      tier: 'core',
      source: '作业练习 14',
      title: '正方形内部十字伪弦图（边长 8）',
      question: '正方形 ABCD 边长为 8，已知 AE + CG = 12，HD + BF = 10，求阴影四边形 EFGH 的面积。',
      answer: 36,
      unit: '',
      hints: [
        '和例题 14 一模一样！先画内部十字线，算出中间小长方形的长和宽！',
        '小长方形高 = 12 - 8 = 4，宽 = 10 - 8 = 2，面积 = 4 × 2 = 8。',
        'S阴 = (8² + 8) ÷ 2 = (64 + 8) ÷ 2 = 36！'
      ],
      parentCoach: '检验孩子有没有真正学会内线十字法，这道题应该 20 秒内口算秒杀！',
      svg: {
        viewBox: '0 0 340 240',
        items: [
          { type: 'rect', x: 85, y: 25, w: 170, h: 170, fill: '#fff', stroke: '#1e293b', strokeWidth: 2.2 },
          { type: 'polygon', points: [[85,155],[195,195],[255,90],[140,25]], fill: '#bfdbfe', stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'rect', x: 140, y: 90, w: 55, h: 65, fill: '#fde047', fillOpacity: 0.75, stroke: '#b45309', strokeWidth: 2, minStep: 2 },
          { type: 'label', x: 168, y: 122, text: '4×2=8', color: '#92400e', size: 13, minStep: 2 },
          { type: 'label', x: 170, y: 215, text: '边长 8，AE+CG=12，HD+BF=10', color: '#475569', size: 12.5 }
        ]
      }
    },
    {
      id: 'P28',
      routineId: 'R7',
      tier: 'core',
      source: '第 14 讲例题 13',
      title: '长方形内四边形面积（伪弦图）',
      question: '长方形 ABCD 面积是 56 平方厘米，四边上点 M、N、P、Q 满足 DM = 2，CP = 5，CQ = 3，NB = 6，求四边形 MNPQ 的面积。',
      answer: 32.5,
      unit: '平方厘米',
      hints: [
        '过 M、P 画两条水平线，过 Q、N 画两条竖直线，围出中间的小长方形！',
        '小长方形的宽 = 6 - 3 = 3，高 = 5 - 2 = 3，所以中间小正方形面积 = 3 × 3 = 9！',
        'S(MNPQ) = (56 + 9) ÷ 2 = 32.5 平方厘米！'
      ],
      parentCoach: '提醒孩子：哪怕题目没给长方形的长和宽，只给总面积 56，照样用“(总面积 + 中间小块) ÷ 2”一步算出！',
      svg: {
        viewBox: '0 0 340 240',
        items: [
          { type: 'rect', x: 75, y: 30, w: 190, h: 165, fill: '#fff', stroke: '#1e293b', strokeWidth: 2.2 },
          { type: 'polygon', points: [[75,78],[125,195],[265,155],[195,30]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'rect', x: 125, y: 78, w: 70, h: 77, fill: '#fde047', fillOpacity: 0.72, stroke: '#b45309', strokeWidth: 2, minStep: 2 },
          { type: 'label', x: 160, y: 116, text: '3×3=9', color: '#92400e', size: 13, minStep: 2 },
          { type: 'label', x: 170, y: 215, text: '总面积 = 56，中间小块 = 9', color: '#475569', size: 13 }
        ]
      }
    },

    // ==================== R8：旋转 4 倍补大弦图 ====================
    {
      id: 'P29',
      routineId: 'R8',
      tier: 'sprint',
      source: '第 14 讲附加题 2',
      title: '等腰直角四边形旋 4 份',
      question: '四边形 ABCD 中，AB = AD，AB ⊥ AD，BC ⊥ CD，AC = 6 厘米，BD = 8 厘米，求 △BCD 的面积。',
      answer: 2,
      unit: '平方厘米',
      hints: [
        '看到 AB = AD 且 AB ⊥ AD，把 4 个相同的四边形绕点 A 旋转拼成一个大外弦图！',
        '拼成的大正方形对角线 = 2 × AC = 12（大正方形面积 = 12² ÷ 2 = 72）；中间小正方形边长 = BD = 8（面积 = 64）！',
        '4 个 △BCD 刚好就是大正方形减去中间小正方形的四个角：S(△BCD) = (72 - 64) ÷ 4 = 2 平方厘米！'
      ],
      parentCoach: '神仙题！先帮孩子回忆“正方形面积 = 对角线 × 对角线 ÷ 2”，再看 4 份旋转图立刻拍案叫绝！',
      svg: V ? V.buildRotate4QuadData().svgSpec : { viewBox: '0 0 340 245', items: [] }
    },
    {
      id: 'P30',
      routineId: 'R8',
      tier: 'sprint',
      source: '第 14 讲附加题 4',
      title: '多边形 ABCFDE 旋 4 份补大外弦图',
      question: '多边形 ABCFDE 中，∠A = ∠B = ∠C = ∠D = 90°，AB = 8，BC = 12，ED + DF = 14，AE = CF，求多边形 ABCFDE 的面积。',
      answer: 51,
      unit: '',
      hints: [
        '把 4 个一模一样的多边形旋转拼一圈，拼出一个完整的大外弦图！',
        '大外正方形的边长 = 8 + 12 = 20，中间空洞的正方形边长 = ED + DF = 14！',
        '面积 = (20² - 14²) ÷ 4 = (400 - 196) ÷ 4 = 51！'
      ],
      parentCoach: '做完附加题 2 再做这题，让孩子对比两道题的共同点：都是“把 4 份拼成大外弦图，再除以 4”！',
      svg: V ? V.buildRotate4PolygonData().svgSpec : { viewBox: '0 0 340 278', items: [] }
    },
    {
      id: 'P31',
      routineId: 'R8',
      tier: 'core',
      source: '作业练习 15',
      title: '中点连线 5 等分弦图风车',
      question: '正方形 ABCD 边长是 5 厘米，E、F 分别是 AB、BC 中点，EC 与 DF 交于 G，求四边形 BEGF 的面积。',
      answer: 5,
      unit: '平方厘米',
      hints: [
        '只画了两条中点连线看不出规律？把另外两条对称的中点连线也补全！',
        '补全 4 条线后，中间围出 1 个小正方形，四周 4 个小直角三角形和 4 个直角梯形可以两两拼成 4 个一样大的小正方形！',
        '整个大正方形被完美 5 等分！四边形 BEGF 刚好等于其中 1 份：5² ÷ 5 = 5 平方厘米！'
      ],
      parentCoach: '记住“正方形四中点弦图 = 5 等分模型”，奥数高频秒杀结论！',
      svg: {
        viewBox: '0 0 340 240',
        items: [
          { type: 'rect', x: 85, y: 25, w: 170, h: 170, fill: '#fff', stroke: '#1e293b', strokeWidth: 2.3 },
          { type: 'polygon', points: [[85,110],[85,195],[170,195],[187,161]], fill: '#cbd5e1', stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'line', x1: 85, y1: 110, x2: 255, y2: 195, stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'line', x1: 255, y1: 25, x2: 170, y2: 195, stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'line', x1: 85, y1: 25, x2: 255, y2: 110, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'line', x1: 170, y1: 25, x2: 85, y2: 195, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'label', x: 170, y: 215, text: '补全 4 条中点连线 → 完美 5 等分！', color: '#dc2626', size: 13, minStep: 2 }
        ]
      }
    },
    {
      id: 'P32',
      routineId: 'R8',
      tier: 'sprint',
      source: '作业练习 16',
      title: '四角 45° 剪出中间小正方形',
      question: '任意一张边长超过 10 厘米的正方形纸，从四角距顶点 5 厘米处沿 45° 角各剪一刀，中间形成一个小正方形，求这个小正方形的面积。',
      answer: 50,
      unit: '平方厘米',
      hints: [
        '题目说“任意边长超过 10 厘米”答案都一样，说明答案和原来大正方形有多大无关！',
        '沿着 45° 剪痕看相邻两条平行线之间的距离：恰好等于直角边为 5 和 5 的等腰直角三角形的斜边！',
        '所以中间小正方形边长 a 满足 a² = 5² + 5² = 50 平方厘米！'
      ],
      parentCoach: '可以用特殊值法验证：假设大正方形边长刚好是 10 厘米，四刀剪完中间的小正方形就是大正方形面积的一半 = 100÷2 = 50！',
      svg: {
        viewBox: '0 0 340 240',
        items: [
          { type: 'rect', x: 85, y: 25, w: 170, h: 170, fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2.2 },
          { type: 'line', x1: 145, y1: 25, x2: 255, y2: 135, stroke: '#dc2626', strokeWidth: 2.2 },
          { type: 'line', x1: 255, y1: 85, x2: 145, y2: 195, stroke: '#dc2626', strokeWidth: 2.2 },
          { type: 'line', x1: 195, y1: 195, x2: 85, y2: 85, stroke: '#dc2626', strokeWidth: 2.2 },
          { type: 'line', x1: 85, y1: 135, x2: 195, y2: 25, stroke: '#dc2626', strokeWidth: 2.2 },
          { type: 'polygon', points: [[170,50],[230,110],[170,170],[110,110]], fill: '#fde68a', fillOpacity: 0.72, stroke: '#b45309', strokeWidth: 2.2 },
          { type: 'label', x: 115, y: 15, text: '5cm', size: 12 },
          { type: 'label', x: 170, y: 110, text: 'a²=5²+5²=50', color: '#92400e', size: 12.5, minStep: 2 }
        ]
      }
    }
  ];

  global.GeoPuzzlesData = {
    PUZZLES: PUZZLES
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.GeoPuzzlesData;
  }
})(typeof window !== 'undefined' ? window : globalThis);
