/**
 * 八大几何招式微课剧本 + 必背速查表（源自第 13～14 讲笔记与作业）
 * 三大篇章：剪拼 (2 招) + 勾股定理 (2 招) + 弦图四大辅助线应用 (4 招)
 */
(function (global) {
  'use strict';

  var V = global.GeoVerify || (typeof require !== 'undefined' ? require('./geo_verify.js') : null);

  var LESSONS = [
    {
      id: 'R1',
      category: 'cut',
      categoryName: '剪拼篇',
      shortName: '面积定边剪拼',
      title: '招式 1：面积定边 · 阶梯剪拼与勾股斜切',
      mantra: '先算总面积定新边长：能开方就画阶梯平移，不能开方就找 a²+b² 勾股斜切！',
      summary: '所有“剪成几块拼正方形”的题，第一步永远是算总面积！看到 36=6² 用阶梯法，看到 41=4²+5² 直接切两个 4-5 直角三角形！',
      parentScript: '问孩子：“拼成的正方形面积一定等于原图形面积，45 减 4 等于 41，41 拆成哪两个数的平方和？”',
      motherTitle: '母题：9×5 缺 4×1 剪成 3 块拼正方形（第 13 讲附加题 4）',
      steps: [
        { title: '第 1 步：算总面积，锁定“勾股斜边”', text: '原图面积 = 9 × 5 - 4 × 1 = 41。41 不是完全平方数，但 41 = 4² + 5²！说明新正方形的边长，就是直角边为 4 和 5 的斜边！' },
        { title: '第 2 步：沿着底边画出两条 4-5 斜切线', text: '在底边 9 厘米处分成 5 和 4，分别向左上方和右上方画出直角边为 4 和 5 的两条红线，把图形分成 ①、②、③ 三块。' },
        { title: '第 3 步：平移两块直角三角形，秒拼斜正方形', text: '把左下块 ① 向右 4、向上 5 平移到右上变成 ①\'，把右下块 ② 向左 5、向上 4 平移到左上变成 ②\'，中间沿纵轴竖线拼合，严丝合缝组成面积 41 的真正方形！' }
      ],
      svg: V ? V.buildCut41Data().svgSpec : { viewBox: '0 0 340 270', items: [] }
    },
    {
      id: 'R2',
      category: 'cut',
      categoryName: '剪拼篇',
      shortName: '+3 魔法分割',
      title: '招式 2：一分为四 · 正方形“+3 魔法”分割',
      mantra: '1 块变 4 块，总数瞬间 +3！先选好底盘（4、6、9），再加若干次 +3 精准凑数！',
      summary: '要把大正方形分成 N 个小正方形（如 12、18、19、20），核心武器就是“把任意一个正方形画十字切成 4 块”，每切一次净增 3 块。',
      parentScript: '问孩子：“你切一刀田字格，原来的 1 块没了，多了 4 块，所以总数增加了几块？从 9 块到 18 块要增加几次 3？”',
      motherTitle: '母题：大正方形分成 12 个小正方形（3 种不同面积，附加题 3）',
      steps: [
        { title: '第 1 步：选“6 块底盘”（1 个 2×2 + 5 个 1×1）', text: '把大正方形按 3×3 想象，但左下角留成一个完整的 2×2 大块，周围留 5 个 1×1 中块。现在共 6 块，已有 2 种面积！' },
        { title: '第 2 步：对第 1 个中块施展“+3 魔法”', text: '把右上角的 1×1 中块田字切成 4 个小块：总数从 6 变成 6 + 3 = 9 块，出现第 3 种面积！' },
        { title: '第 3 步：再对第 2 个中块施展“+3 魔法”', text: '把右下角的 1×1 中块也田字切成 4 个小块：总数 9 + 3 = 12 块，刚好 3 种不同面积！若想变 4 种面积，改切刚才的小块即可！' }
      ],
      svg: {
        viewBox: '0 0 340 260',
        items: [
          { type: 'rect', x: 70, y: 30, w: 200, h: 200, fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2.5 },
          // 1大 + 5中
          { type: 'rect', x: 70, y: 97, w: 133, h: 133, fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'line', x1: 136.5, y1: 30, x2: 136.5, y2: 97, stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'line', x1: 203, y1: 30, x2: 203, y2: 230, stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'line', x1: 203, y1: 97, x2: 270, y2: 97, stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'line', x1: 203, y1: 163.5, x2: 270, y2: 163.5, stroke: '#1e3a8a', strokeWidth: 2 },
          { type: 'label', x: 136, y: 164, text: '大块 (2×2)', color: '#1e3a8a', size: 13 },
          // 第 1 步：右上田字切 +3
          { type: 'rect', x: 203, y: 30, w: 67, h: 67, fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, minStep: 1 },
          { type: 'line', x1: 236.5, y1: 30, x2: 236.5, y2: 97, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'line', x1: 203, y1: 63.5, x2: 270, y2: 63.5, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          // 第 2 步：右下田字切 +3
          { type: 'rect', x: 203, y: 163.5, w: 67, h: 66.5, fill: '#dcfce7', stroke: '#15803d', strokeWidth: 2, minStep: 2 },
          { type: 'line', x1: 236.5, y1: 163.5, x2: 236.5, y2: 230, stroke: '#15803d', strokeWidth: 2.2, aux: true, minStep: 2 },
          { type: 'line', x1: 203, y1: 196.7, x2: 270, y2: 196.7, stroke: '#15803d', strokeWidth: 2.2, aux: true, minStep: 2 },
          { type: 'label', x: 170, y: 248, text: '6 + 3 + 3 = 12 个（共 3 种大小）', color: '#15803d', size: 13, minStep: 2 }
        ]
      }
    },
    {
      id: 'R3',
      category: 'pythago',
      categoryName: '勾股篇',
      shortName: '垂线拉平造直角',
      title: '招式 3：直角构造 · 垂线切高与折线拉平',
      mantra: '求斜边先找直角三角形！梯形切垂线，折线全平移，必背勾股数 1 秒报答案！',
      summary: '碰到等腰梯形、直角梯形、60° 特殊角或阶梯折线时，通过“作高”或“平移拉直”立刻造出直角三角形，再套用 3-4-5、5-12-13、6-8-10 秒算。',
      parentScript: '问孩子：“AB 是一条斜线，旁边弯弯曲曲的小台阶能不能往右上角全部推平，合成一个大直角三角形？”',
      motherTitle: '母题：阶梯折线求斜边 AB（第 14 讲作业练习 4）',
      steps: [
        { title: '第 1 步：观察锯齿状的横竖折线', text: '图中从 A 到 B 走了许多横向和竖向的小直角折线，直接一段段算太麻烦了！' },
        { title: '第 2 步：辅助线大法——向右向上“拉平”！', text: '把所有水平线段（2、3、1）向上平移，拼出总宽 = 2 + 3 + 1 = 6；把所有竖直线段（2、4、2）向右平移，拼出总高 = 2 + 4 + 2 = 8！' },
        { title: '第 3 步：认出经典勾股数 6-8-10！', text: '现在 AB 就是一个直角边为 6 和 8 的大直角三角形的斜边！6² + 8² = 100 = 10²，所以 AB = 10！' }
      ],
      svg: {
        viewBox: '0 0 340 260',
        items: [
          // 锯齿折线
          { type: 'polygon', points: [[80,45],[125,45],[125,90],[192,90],[192,180],[215,180],[215,225]], fill: '#e0f2fe', stroke: '#1e293b', strokeWidth: 2.2 },
          { type: 'label', x: 66, y: 45, text: 'A', color: '#1e3a8a' },
          { type: 'label', x: 226, y: 230, text: 'B', color: '#1e3a8a' },
          { type: 'label', x: 102, y: 36, text: '2', size: 12 },
          { type: 'label', x: 135, y: 68, text: '2', size: 12 },
          { type: 'label', x: 158, y: 80, text: '3', size: 12 },
          { type: 'label', x: 202, y: 135, text: '4', size: 12 },
          { type: 'label', x: 204, y: 170, text: '1', size: 12 },
          { type: 'label', x: 225, y: 202, text: '2', size: 12 },
          // 辅助线拉平
          { type: 'line', x1: 125, y1: 45, x2: 215, y2: 45, stroke: '#dc2626', strokeWidth: 2.6, aux: true, minStep: 1 },
          { type: 'line', x1: 215, y1: 45, x2: 215, y2: 180, stroke: '#dc2626', strokeWidth: 2.6, aux: true, minStep: 1 },
          { type: 'rightAngle', x: 215, y: 45, dx1: -12, dy1: 0, dx2: 0, dy2: 12, stroke: '#dc2626', minStep: 1 },
          { type: 'label', x: 150, y: 25, text: '总水平 = 2+3+1 = 6', color: '#dc2626', size: 13, minStep: 1 },
          { type: 'label', x: 274, y: 132, text: '总竖直 = 8', color: '#dc2626', size: 13, minStep: 1 },
          // 第 2 步斜边高亮
          { type: 'line', x1: 80, y1: 45, x2: 215, y2: 225, stroke: '#0f766e', strokeWidth: 3.4, minStep: 2 },
          { type: 'label', x: 126, y: 156, text: 'AB = 10', color: '#0f766e', size: 15, bg: '#ecfdf5', bgW: 36, minStep: 2 }
        ]
      }
    },
    {
      id: 'R4',
      category: 'pythago',
      categoryName: '勾股篇',
      shortName: '整体平方与折叠',
      title: '招式 4：整体平方 · 设而不求与平方差折叠',
      mantra: '算不出 x 别慌！盯住 x² 整体代换；折纸找相等边，用平方差 (a+b)(a-b) 秒解！',
      summary: '小学三年级没学开根号，遇到求面积或折纸题，千万别硬求边长，直接把 x² 当成一个整体，或者利用折纸后线段相等写出 a² - b² = 宽²！',
      parentScript: '问孩子：“把长方形的 C 点折到 A 点，哪两条线段是一样长的？（AM = CM），那 AM + BM 等于多少？”',
      motherTitle: '母题：5×1 长方形折角求 △ABM 面积（小测 T6）',
      steps: [
        { title: '第 1 步：折纸第一定律——折过去边长不变', text: '把右下角 C 折到左上角 A，折痕经过 M，所以折过去的 AM 和原来的 MC 长度完全相等！于是 AM + BM = BC = 5。' },
        { title: '第 2 步：在直角 △ABM 里写勾股平方差', text: '因为 1² + BM² = AM²，移项得到 AM² - BM² = 1。用平方差公式拆开：(AM + BM)(AM - BM) = 1！' },
        { title: '第 3 步：和差问题秒出 BM 和面积', text: '已知 AM + BM = 5，所以 AM - BM = 1 ÷ 5 = 0.2！由和差公式：BM = (5 - 0.2) ÷ 2 = 2.4，面积 = 1 × 2.4 ÷ 2 = 1.2！' }
      ],
      svg: {
        viewBox: '0 0 340 220',
        items: [
          { type: 'rect', x: 40, y: 80, w: 250, h: 60, fill: '#f8fafc', stroke: '#94a3b8', dash: '6 4', strokeWidth: 1.8 },
          { type: 'polygon', points: [[40,80],[40,140],[160,140]], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2.3 },
          { type: 'line', x1: 40, y1: 80, x2: 160, y2: 140, stroke: '#dc2626', strokeWidth: 2.6, minStep: 0 },
          { type: 'rightAngle', x: 40, y: 140, dx1: 10, dy1: 0, dx2: 0, dy2: -10 },
          { type: 'label', x: 28, y: 78, text: 'A' },
          { type: 'label', x: 28, y: 145, text: 'B' },
          { type: 'label', x: 160, y: 156, text: 'M' },
          { type: 'label', x: 298, y: 145, text: 'C' },
          { type: 'label', x: 25, y: 110, text: '1', color: '#1e3a8a' },
          { type: 'label', x: 165, y: 178, text: '总长 BC = 5', color: '#475569', size: 13 },
          { type: 'line', x1: 160, y1: 140, x2: 290, y2: 140, stroke: '#dc2626', strokeWidth: 2.8, aux: true, minStep: 1 },
          { type: 'label', x: 106, y: 98, text: 'AM = MC', color: '#dc2626', size: 13, minStep: 1 },
          { type: 'label', x: 100, y: 156, text: 'BM = 2.4', color: '#0f766e', size: 13, minStep: 2 },
          { type: 'label', x: 170, y: 38, text: 'AM² - BM² = 1 → (AM+BM)(AM-BM) = 1', color: '#1e3a8a', size: 13, bg: '#eff6ff', bgW: 135, minStep: 2 }
        ]
      }
    },
    {
      id: 'R5',
      category: 'xuantu',
      categoryName: '弦图应用 ①',
      shortName: '标准内外弦图',
      title: '招式 5：弦图应用① · 标准内外弦图与风车延长',
      mantra: '内弦图：大边=c，小边=b-a；外弦图：大边=a+b，内边=c；风车往外延一倍，大直角现身！',
      summary: '这是弦图最直接的应用：一眼认出 4 个全等直角三角形（或 4 个相同长方形）围成的大小正方形，用“和差关系”和“面积关系”互推边长。',
      parentScript: '问孩子：“图里中间的小正方形边长，正好是长直角边减去短直角边！那大正方形边长是直角三角形的哪条边？”',
      motherTitle: '母题：赵爽弦图与“数学风车”（第 14 讲例题 10 & 练习 9）',
      steps: [
        { title: '第 1 步：认清赵爽内弦图的三要素', text: '四个全等直角三角形（直角边 a=5, b=12）首尾相接：大正方形边长 = 斜边 c = 13（面积 169），中间小正方形边长 = b - a = 7（面积 49）。' },
        { title: '第 2 步：变形——把 4 条直角边向外延长一倍！', text: '把每条边长为 6 的直角边向外延长 6，得到“数学风车”（练习 9）：每个风车叶片都是一个大直角三角形，直角边变成了 12 和 5！' },
        { title: '第 3 步：勾股定理算风车外围周长', text: '由 5-12-13 知每个叶片斜边是 13，外露的一段延长边是 6，所以风车周长 = (13 + 6) × 4 = 76！' }
      ],
      svg: {
        viewBox: '0 0 340 280',
        template: 'innerXuantu',
        templateOpts: { a: 5, b: 12, labelA: 'a=5', labelB: 'b=12', labelC: '大边长 c = 13', labelInner: '小边 12-5=7', cStep: 1, innerStep: 1 },
        items: [
          { type: 'label', x: 170, y: 262, text: 'S大 = 5²+12² = 169，S小 = (12-5)² = 49', color: '#1e3a8a', size: 13, minStep: 2 }
        ]
      }
    },
    {
      id: 'R6',
      category: 'xuantu',
      categoryName: '弦图应用 ②',
      shortName: '外框补全穿外衣',
      title: '招式 6：弦图应用② · 外框补全法（给斜正方形“穿直外衣”）',
      mantra: '看见斜正方形别发愁！横平竖直画外框，穿件直外衣，四周全等直角三角形立刻蹦出来！',
      summary: '老师笔记里最高频的弦图辅助线！不管是“长方形里斜嵌 6/8 个正方形”（例 12、练 13），还是“以梯形腰作正方形”（例 15），或是“直角五边形”（附加题 5），全靠“穿外衣”构造外弦图！',
      parentScript: '问孩子：“这个正方形歪着放，我们没法直接算。如果沿着格子横平竖直给它包一圈外框，四个角上的小直角三角形是不是一模一样？”',
      motherTitle: '母题：长方形内斜嵌 6 个相同正方形（第 14 讲例题 12）',
      steps: [
        { title: '第 1 步：斜着放的 6 个正方形，怎么和 22、20 挂钩？', text: '长方形高 AB = 22，宽 BC = 20。6 个全等斜正方形严丝合缝内切于四条边，直接量斜边量不出来！' },
        { title: '第 2 步：辅助线大法——给每个斜正方形“穿直外衣”！', text: '过斜正方形的顶点画水平和竖直线，每条斜边都变成一个相同直角三角形（短边 a、长边 b）的斜边！' },
        { title: '第 3 步：横竖数格子列方程，直接求 a² + b²！', text: '竖着数 AB：2a + 3b = 22；横着数 BC：a + 3b = 20！两式相减得 a = 2，代入得 b = 6。单个正方形面积 = c² = a² + b² = 2² + 6² = 40！' }
      ],
      svg: V ? V.buildEmbedded6SquaresData().svgSpec : { viewBox: '0 0 340 262', items: [] }
    },
    {
      id: 'R7',
      category: 'xuantu',
      categoryName: '弦图应用 ③',
      shortName: '内线十字伪弦图',
      title: '招式 7：弦图应用③ · 内线分割法（画十字变“伪弦图”）',
      mantra: '四角斜四边形别怕不对称！过四顶点画横竖十字线，四角平分，中间剩小长方形：(总+小)÷2！',
      summary: '当正方形或长方形里躺着一个“不对称的斜四边形”（例 13、例 14、练 14），在内部过四个顶点作水平和竖直线，立刻切出“4 个对角线平分长方形 + 1 个中心小长方形”，秒出阴影面积！',
      parentScript: '问孩子：“过 E、F、G、H 往里画横线和竖线，四周 4 个小长方形是不是都被斜线平分成一白一灰？多出来的只有中间那块！”',
      motherTitle: '母题：正方形边长 6，AE+CG=9, HD+BF=8 求阴影面积（例题 14）',
      steps: [
        { title: '第 1 步：审题——四个顶点不对称，不能用标准弦图', text: '只给了对面两段之和 AE+CG=9 和 HD+BF=8，具体每段多长都不知道！' },
        { title: '第 2 步：辅助线大法——内部画横竖“十字围栏”！', text: '过 E、G 画两条水平线，过 H、F 画两条竖直线！四个角落的空白三角形，都和它隔壁的阴影三角形一模一样大！' },
        { title: '第 3 步：重叠原理算中间小长方形，一招秒杀', text: '竖向重叠高 = 9 - 6 = 3，横向重叠宽 = 8 - 6 = 2，中间小长方形面积 = 2 × 3 = 6！阴影比空白多这 1 块，所以 S阴 = (6² + 6) ÷ 2 = 21！' }
      ],
      svg: {
        viewBox: '0 0 340 270',
        items: [
          { type: 'rect', x: 75, y: 35, w: 190, h: 190, fill: '#ffffff', stroke: '#1e293b', strokeWidth: 2.3 },
          // E(75,180), F(200,225), G(265,110), H(135,35)
          { type: 'polygon', points: [[75,180],[200,225],[265,110],[135,35]], fill: '#cbd5e1', fillOpacity: 0.75, stroke: '#1e3a8a', strokeWidth: 2.2 },
          { type: 'label', x: 64, y: 35, text: 'A' }, { type: 'label', x: 64, y: 225, text: 'B' },
          { type: 'label', x: 276, y: 225, text: 'C' }, { type: 'label', x: 276, y: 35, text: 'D' },
          { type: 'label', x: 62, y: 180, text: 'E', color: '#dc2626' },
          { type: 'label', x: 200, y: 240, text: 'F', color: '#dc2626' },
          { type: 'label', x: 278, y: 110, text: 'G', color: '#dc2626' },
          { type: 'label', x: 135, y: 22, text: 'H', color: '#dc2626' },
          // 第 1 步：画内部横竖线
          { type: 'line', x1: 75, y1: 180, x2: 200, y2: 180, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'line', x1: 135, y1: 110, x2: 265, y2: 110, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'line', x1: 135, y1: 35, x2: 135, y2: 180, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          { type: 'line', x1: 200, y1: 110, x2: 200, y2: 225, stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 },
          // 第 2 步：高亮中心小长方形
          { type: 'rect', x: 135, y: 110, w: 65, h: 70, fill: '#fde047', fillOpacity: 0.72, stroke: '#b45309', strokeWidth: 2.5, pulse: true, minStep: 2 },
          { type: 'label', x: 168, y: 145, text: '2×3=6', color: '#92400e', size: 14, minStep: 2 },
          { type: 'label', x: 170, y: 258, text: 'S阴 = (36 + 6) ÷ 2 = 21', color: '#15803d', size: 14, minStep: 2 }
        ]
      }
    },
    {
      id: 'R8',
      category: 'xuantu',
      categoryName: '弦图应用 ④',
      shortName: '旋转 4 倍补大弦图',
      title: '招式 8：弦图应用④ · 旋转复制法（4 倍拼成完整大弦图）',
      mantra: '只给“弦图四分之一”（等腰直角/直角凹角）？直接复制 4 份绕中心旋转，拼出大外弦图再除以 4！',
      summary: '终极压轴题大杀器！看到“AB=AD 且 AB⊥AD”（附加题 2）或“四个直角+相等边”（附加题 4）或“中点连线”（练习 15），补全 4 份旋转拼成完整弦图，一步算面积！',
      parentScript: '问孩子：“这个多边形拐角是 90°，还有两边相等，如果我们拿 4 个一模一样的它风车一样拼一圈，外面是不是一个大正方形？”',
      motherTitle: '母题：多边形 ABCFDE 面积（第 14 讲附加题 4）',
      steps: [
        { title: '第 1 步：观察关键特征——全是直角且 AE = CF', text: 'AB = 8，BC = 12，ED + DF = 14，且 AE = CF，∠A = ∠B = ∠C = ∠D = 90°。单看左下这一块 ① 很难直接算面积！' },
        { title: '第 2 步：辅助线大法——复制 4 份旋转拼成大外弦图！', text: '把 ① 绕中心每次转 90° 拼出 ②、③、④：4 块严丝合缝地围出一圈，外圈正好是边长 8 + 12 = 20 的大正方形，中间自然围出一个边长 14 的斜正方形空洞！' },
        { title: '第 3 步：大面积减小面积，再除以 4！', text: '4 块总面积 = 20² - 14² = 400 - 196 = 204，所以 1 块多边形的面积 = 204 ÷ 4 = 51！' }
      ],
      svg: V ? V.buildRotate4PolygonData().svgSpec : { viewBox: '0 0 340 278', items: [] }
    }
  ];

  var CHEAT_SHEET = {
    pythagoreanTriples: [
      { base: '3, 4, 5', multiples: '6-8-10、9-12-15、12-16-20、15-20-25', note: '最高频！占小学奥数 70% 题' },
      { base: '5, 12, 13', multiples: '10-24-26', note: '例题 10、练习 2、练习 3、练习 6 必考' },
      { base: '8, 15, 17', multiples: '16-30-34', note: '中档拔高常见' },
      { base: '7, 24, 25', multiples: '14-48-50', note: '容易和 5-12-13 混淆，牢记 7²=49=24+25' },
      { base: '12, 35, 37', multiples: '—', note: '附加题 1 海伦三角形出现！' }
    ],
    xuantuFiveMethods: [
      { method: '① 认模型（内外弦图）', trigger: '4 个全等直角三角形 / 4 个相同长方形围成正方形', action: '内弦图：大边=c，小边=b-a；外弦图：大边=a+b，内边=c' },
      { method: '② 穿外衣（外框补全）', trigger: '斜放的正方形、长方形里斜嵌多个正方形、梯形腰作正方形', action: '横平竖直画出外接大框，四周立刻出现全等直角三角形（边 a, b）' },
      { method: '③ 画十字（内部伪弦图）', trigger: '正方形/长方形内部斜躺一个不对称四角四边形', action: '过四顶点画横竖内部平行线，四角一分为二，S阴 = (S总 + S中间小长方形) ÷ 2' },
      { method: '④ 旋四份（4 倍补全）', trigger: '只给局部：等腰直角、两邻边垂直且相等、凹直角多边形', action: '复制 4 份绕顶点/中心旋转拼成完整大外弦图，(S大 - S小) ÷ 4' },
      { method: '⑤ 延一倍（风车/中点）', trigger: '直角边向外延长、正方形各边中点连线、四角剪 45°', action: '补全四条对称延长线，形成风车或 5 等分弦图网格' }
    ],
    decisionTree: [
      '看到“剪成几块拼正方形” → 先算总面积！完全平方数用阶梯法，a²+b² 用勾股斜切；分 N 个小正方形用“一分为四 (+3 魔法)”。',
      '看到“梯形 / 锯齿折线 / 60°角 / 折纸” → 作垂线或平移拉直造直角三角形；求面积不急开根号，盯住 x² 整体代换。',
      '看到“斜正方形 / 内部四角四边形 / 90°等腰” → 直接套用【弦图五大辅助线心法】：穿外衣、画十字、旋四份、延一倍！'
    ]
  };

  global.GeoLessonsData = {
    LESSONS: LESSONS,
    CHEAT_SHEET: CHEAT_SHEET
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.GeoLessonsData;
  }
})(typeof window !== 'undefined' ? window : globalThis);
