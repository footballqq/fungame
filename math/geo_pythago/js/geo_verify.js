/**
 * 解析几何精确构造与数学验算库 (geo_verify.js)
 * 原则：所有复杂几何图形均由真实数学尺寸 + 向量/旋转/平移公式生成，绝不手拍像素坐标；
 * 并提供鞋带公式面积验算、边长/垂直度/拼合面积守恒自动化校验，接入 pytest 门禁。
 */
(function (global) {
  'use strict';

  function dist(p, q) {
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  }

  function dot(u, v) {
    return u[0] * v[0] + u[1] * v[1];
  }

  /**
   * 鞋带公式 (Shoelace Formula) 计算简单多边形的精确面积
   */
  function polygonArea(pts) {
    var sum = 0;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i];
      var b = pts[(i + 1) % pts.length];
      sum += a[0] * b[1] - b[0] * a[1];
    }
    return Math.abs(sum) / 2;
  }

  /**
   * 绕中心点 (cx, cy) 旋转 angleDeg 度（数学坐标系逆时针为正）
   */
  function rotatePt(pt, cx, cy, angleDeg) {
    var rad = (angleDeg * Math.PI) / 180;
    var cos = Math.cos(rad);
    var sin = Math.sin(rad);
    var dx = pt[0] - cx;
    var dy = pt[1] - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  }

  /**
   * 数学坐标 (x, y) 映射到 SVG 坐标 (y 轴翻转)
   */
  function toSvg(pt, ox, oy, scale) {
    return [
      Number((ox + pt[0] * scale).toFixed(2)),
      Number((oy - pt[1] * scale).toFixed(2))
    ];
  }

  function mapPoly(pts, ox, oy, scale) {
    return pts.map(function (p) { return toSvg(p, ox, oy, scale); });
  }

  // =========================================================================
  // 构造器 1：第 13 讲附加题 4（9×5 缺 4×1，面积 41 = 4² + 5² 勾股斜切）
  // 严格数学坐标：左下角在 (0,0)，底边 9，右侧高 5，左侧高 4，缺口 (0,4)-(4,5)
  // =========================================================================
  function buildCut41Data() {
    // 数学坐标 (y 向上)
    var A = [0, 4];
    var B = [0, 0];
    var M = [5, 0];
    var C = [9, 0];
    var D = [9, 5];
    var K1 = [4, 5];
    var K2 = [4, 4];
    // 顶部第四顶点 T = A + (D - M) = (0,4) + (4,5) = (4,9)
    var T = [4, 9];

    var piece1 = [A, B, M];                 // 左下 4-5 直角三角形 ①
    var piece2 = [M, C, D];                 // 右下 4-5 直角三角形 ②
    var piece3 = [A, K2, K1, D, M];         // 中间固定块 ③
    // 平移后：① 向量 (+4, +5) 移到右上 ①'；② 向量 (-5, +4) 移到左上 ②'
    var piece1Moved = piece1.map(function (p) { return [p[0] + 4, p[1] + 5]; }); // [4,9],[4,5],[9,5]
    var piece2Moved = piece2.map(function (p) { return [p[0] - 5, p[1] + 4]; }); // [0,4],[4,4],[4,9]
    var bigSquare = [A, M, D, T];

    return {
      math: { A: A, B: B, M: M, C: C, D: D, K1: K1, K2: K2, T: T, piece1: piece1, piece2: piece2, piece3: piece3, piece1Moved: piece1Moved, piece2Moved: piece2Moved, bigSquare: bigSquare },
      svgSpec: (function () {
        var scale = 23, ox = 66, oy = 234;
        var s = function (p) { return toSvg(p, ox, oy, scale); };
        var mp = function (arr) { return mapPoly(arr, ox, oy, scale); };
        var pT = s(T), pK1 = s(K1), pK2 = s(K2), pA = s(A), pM = s(M), pD = s(D);
        return {
          viewBox: '0 0 340 270',
          items: [
            // 原图三块（底色）
            { type: 'polygon', points: mp(piece3), fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2.2 },
            { type: 'polygon', points: mp(piece1), fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 2.2 },
            { type: 'polygon', points: mp(piece2), fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 2.2 },
            // 缺掉的 4×1 虚线框
            { type: 'polygon', points: mp([[0,4],[4,4],[4,5],[0,5]]), fill: '#f8fafc', stroke: '#94a3b8', dash: '5 4', strokeWidth: 1.5 },
            // 标注原图尺寸
            { type: 'label', x: ox - 16, y: (s(A)[1] + s(B)[1]) / 2, text: '4', color: '#1e293b' },
            { type: 'label', x: s(D)[0] + 16, y: (s(D)[1] + s(C)[1]) / 2, text: '5', color: '#1e293b' },
            { type: 'label', x: (s(B)[0] + s(C)[0]) / 2, y: oy + 19, text: '底边 = 9（左 5 + 右 4）', color: '#475569', size: 12.5 },
            // 步骤 1：画出两条 4-5 斜切红线 + 编号 ① ② ③
            { type: 'line', x1: pA[0], y1: pA[1], x2: pM[0], y2: pM[1], stroke: '#dc2626', strokeWidth: 2.8, aux: true, minStep: 1 },
            { type: 'line', x1: pM[0], y1: pM[1], x2: pD[0], y2: pD[1], stroke: '#dc2626', strokeWidth: 2.8, aux: true, minStep: 1 },
            { type: 'label', x: ox + 36, y: oy - 24, text: '①', color: '#dc2626', size: 16, minStep: 1 },
            { type: 'label', x: ox + 178, y: oy - 30, text: '②', color: '#0f766e', size: 16, minStep: 1 },
            { type: 'label', x: ox + 115, y: oy - 68, text: '③', color: '#1e3a8a', size: 16, minStep: 1 },
            // 步骤 2：平移后的 ②'（左上）和 ①'（右上），带清晰纵轴分界线 T→K2！
            { type: 'polygon', points: mp(piece2Moved), fill: '#a7f3d0', fillOpacity: 0.65, stroke: '#0f766e', strokeWidth: 2.2, dash: '6 4', minStep: 2 },
            { type: 'polygon', points: mp(piece1Moved), fill: '#fde68a', fillOpacity: 0.72, stroke: '#d97706', strokeWidth: 2.2, dash: '6 4', minStep: 2 },
            // 纵轴清晰分界线（用户特别建议的竖直切线！）
            { type: 'line', x1: pT[0], y1: pT[1], x2: pK2[0], y2: pK2[1], stroke: '#b45309', strokeWidth: 2.4, dash: '5 3', minStep: 2 },
            // 完整斜正方形外框高亮
            { type: 'polygon', points: mp(bigSquare), fill: 'none', stroke: '#d97706', strokeWidth: 2.6, dash: '7 4', minStep: 2 },
            { type: 'label', x: ox + 66, y: oy - 128, text: '②\' (←5 ↑4)', color: '#065f46', size: 12, minStep: 2 },
            { type: 'label', x: ox + 130, y: oy - 140, text: '①\' (→4 ↑5)', color: '#92400e', size: 12, minStep: 2 },
            { type: 'label', x: ox + 102, y: 14, text: '①\'+②\'+③ 严丝合缝拼成面积 41 的真正方形！', color: '#b45309', size: 12, bg: '#fffbeb', bgW: 132, minStep: 2 }
          ]
        };
      })()
    };
  }

  // =========================================================================
  // 构造器 2：第 14 讲附加题 4（多边形 ABCFDE 旋 4 份严丝合缝补成 20×20 大外弦图）
  // 严格数学推导：
  // 大正方形中心在 (0,0)，范围 [-10, 10] × [-10, 10]（边长 8 + 12 = 20）
  // 取 AE = CF = t = 2：A=(-10,-2), B=(-10,-10), C=(2,-10), E=(-8,-2), F=(2,-8)
  // |EF|² = 10² + 6² = 136，ED + DF = 14 ⇒ p + q = 14, p² + q² = 136 ⇒ pq = 30
  // 解得 p = 7 - √19, q = 7 + √19，由 F - E = q·u - p·v（v 为 u 逆时针转 90°）精确解出 D！
  // =========================================================================
  function buildRotate4PolygonData() {
    var t = 2;
    var A = [-10, -2];
    var B = [-10, -10];
    var C = [2, -10];
    var E = [-10 + t, -2]; // (-8, -2)
    var F = [2, -10 + t];  // (2, -8)

    // F - E = (dx, dy) = (10, -6)
    var dx = F[0] - E[0];
    var dy = F[1] - E[1];
    var ef2 = dx * dx + dy * dy; // 136
    var pq = (14 * 14 - ef2) / 2; // 30
    var diff = Math.sqrt(14 * 14 - 4 * pq); // 2√19
    var p = (14 - diff) / 2; // ED
    var q = (14 + diff) / 2; // DF

    // 设向量 u = (ux, uy) 为 D->F 单位方向，v = (-uy, ux) 为 D->E 单位方向（∠EDF = 90°）
    // 则 F - E = q*u - p*v = (q*ux + p*uy, q*uy - p*ux) = (dx, dy)
    // 解线性方程组：ux = (q*dx - p*dy) / (p²+q²), uy = (p*dx + q*dy) / (p²+q²)
    var ux = (q * dx - p * dy) / ef2;
    var uy = (p * dx + q * dy) / ef2;
    var D = [F[0] - q * ux, F[1] - q * uy];

    var basePoly = [A, B, C, F, D, E];
    var polys = [
      basePoly,
      basePoly.map(function (pt) { return rotatePt(pt, 0, 0, 90); }),
      basePoly.map(function (pt) { return rotatePt(pt, 0, 0, 180); }),
      basePoly.map(function (pt) { return rotatePt(pt, 0, 0, 270); })
    ];
    var innerSquare = [
      D,
      rotatePt(D, 0, 0, 90),
      rotatePt(D, 0, 0, 180),
      rotatePt(D, 0, 0, 270)
    ];
    var outerSquare = [[-10, -10], [10, -10], [10, 10], [-10, 10]];

    return {
      math: { A: A, B: B, C: C, D: D, E: E, F: F, p: p, q: q, polys: polys, innerSquare: innerSquare, outerSquare: outerSquare },
      svgSpec: (function () {
        var scale = 9.5, ox = 170, oy = 142;
        var mp = function (arr) { return mapPoly(arr, ox, oy, scale); };
        var s = function (pt) { return toSvg(pt, ox, oy, scale); };
        var fills = ['#bfdbfe', '#bbf7d0', '#e9d5ff', '#fed7aa'];
        var strokes = ['#1e3a8a', '#15803d', '#6d28d9', '#c2410c'];

        var items = [
          // 原始第 ① 块（始终可见）
          { type: 'polygon', points: mp(polys[0]), fill: fills[0], stroke: strokes[0], strokeWidth: 2.3 },
          { type: 'label', x: s([-11.6, -6])[0], y: s([-11.6, -6])[1], text: '8', color: '#1e3a8a' },
          { type: 'label', x: s([-4, -11.6])[0], y: s([-4, -11.6])[1], text: '12', color: '#1e3a8a' },
          { type: 'label', x: s([-4, -6])[0], y: s([-4, -6])[1], text: '①', color: '#1e3a8a', size: 15 },
          // 步骤 1：严丝合缝旋转拼出另外 3 块全等多边形 ② ③ ④，把中间 14×14 正方形完全包住！
          { type: 'polygon', points: mp(polys[1]), fill: fills[1], fillOpacity: 0.78, stroke: strokes[1], strokeWidth: 2, minStep: 1 },
          { type: 'polygon', points: mp(polys[2]), fill: fills[2], fillOpacity: 0.78, stroke: strokes[2], strokeWidth: 2, minStep: 1 },
          { type: 'polygon', points: mp(polys[3]), fill: fills[3], fillOpacity: 0.78, stroke: strokes[3], strokeWidth: 2, minStep: 1 },
          { type: 'label', x: s([6, -4])[0], y: s([6, -4])[1], text: '②', color: '#15803d', size: 15, minStep: 1 },
          { type: 'label', x: s([4, 6])[0], y: s([4, 6])[1], text: '③', color: '#6d28d9', size: 15, minStep: 1 },
          { type: 'label', x: s([-6, 4])[0], y: s([-6, 4])[1], text: '④', color: '#c2410c', size: 15, minStep: 1 },
          // 中间自然围出的 14×14 正方形
          { type: 'polygon', points: mp(innerSquare), fill: '#fef3c7', fillOpacity: 0.88, stroke: '#b45309', strokeWidth: 2.3, dash: '6 3', minStep: 1 },
          { type: 'polygon', points: mp(outerSquare), fill: 'none', stroke: '#dc2626', strokeWidth: 2.4, dash: '7 4', minStep: 1 },
          { type: 'label', x: ox, y: oy, text: '中洞 14×14', color: '#92400e', size: 13.5, minStep: 1 },
          { type: 'label', x: ox, y: 24, text: '4 块严丝合缝拼成 20×20 大外弦图！', color: '#dc2626', size: 13, minStep: 1 },
          { type: 'label', x: ox, y: 264, text: '面积 = (20² - 14²) ÷ 4 = 51', color: '#15803d', size: 14, minStep: 2 }
        ];
        return { viewBox: '0 0 340 278', items: items };
      })()
    };
  }

  // =========================================================================
  // 构造器 3：第 14 讲例题 12（长方形 22×20 内严丝合缝斜嵌 6 个相同正方形）
  // 严格数学推导：a = 2, b = 6，每个正方形边向量 u = (b, -a) = (6, -2), v = (a, b) = (2, 6)
  // 6 块按 (col, row) 排列在网格上，左下边界严格贴在 x=0, y=0，右上边界严格贴在 x=20, y=22！
  // 验证：取网格格子列表 [(0,2),(1,2),(0,1),(1,1),(2,1),(1,0)]：
  // 各顶点 x 范围 [0, 20]，y 范围 [0, 22]，完全严丝合缝内切于 20×22 长方形！
  // =========================================================================
  function buildEmbedded6SquaresData() {
    var a = 2, b = 6;
    // 基向量（数学坐标 y 向上）：向右偏下 u=(6,-2)，向上偏右 v=(2,6)
    // 选定 6 个正方形格子的 (col, row) 坐标
    var cells = [[0, 2], [1, 2], [0, 1], [1, 1], [2, 1], [1, 0]];
    var rawSquares = cells.map(function (c) {
      var col = c[0], row = c[1];
      var p0 = [col * b + row * a, -col * a + row * b];
      var p1 = [p0[0] + b, p0[1] - a];
      var p2 = [p1[0] + a, p1[1] + b];
      var p3 = [p0[0] + a, p0[1] + b];
      return [p0, p1, p2, p3];
    });

    // 平移使整体最小 x = 0，最小 y = 0
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    rawSquares.forEach(function (sq) {
      sq.forEach(function (p) {
        if (p[0] < minX) minX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] > maxY) maxY = p[1];
      });
    });

    var squares = rawSquares.map(function (sq) {
      return sq.map(function (p) { return [p[0] - minX, p[1] - minY]; });
    });
    var rectW = maxX - minX; // 20
    var rectH = maxY - minY; // 22

    return {
      math: { a: a, b: b, rectW: rectW, rectH: rectH, squares: squares },
      svgSpec: (function () {
        var scale = 9.2, ox = 78, oy = 232;
        var mp = function (arr) { return mapPoly(arr, ox, oy, scale); };
        var s = function (p) { return toSvg(p, ox, oy, scale); };

        var items = [
          { type: 'rect', x: ox, y: oy - rectH * scale, w: rectW * scale, h: rectH * scale, fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2.3 },
          { type: 'label', x: ox - 18, y: oy - (rectH * scale) / 2, text: '22', color: '#1e3a8a', size: 15 },
          { type: 'label', x: ox + (rectW * scale) / 2, y: oy + 18, text: 'BC = 20', color: '#1e3a8a', size: 14 }
        ];

        squares.forEach(function (sq, idx) {
          items.push({
            type: 'polygon',
            points: mp(sq),
            fill: idx % 2 === 0 ? '#dbeafe' : '#bae6fd',
            stroke: '#1d4ed8',
            strokeWidth: 2
          });
        });

        // 步骤 1：在左上第一块正方形外围画“穿直外衣”红色辅助线，直观标出 a 和 b！
        var topSq = squares[0]; // 四个顶点
        var pTop = s(topSq[3]); // 最上顶点
        var pLeft = s(topSq[0]);
        var pRight = s(topSq[2]);
        items.push({ type: 'line', x1: pLeft[0], y1: pTop[1], x2: pRight[0], y2: pTop[1], stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 });
        items.push({ type: 'line', x1: pLeft[0], y1: pTop[1], x2: pLeft[0], y2: pLeft[1], stroke: '#dc2626', strokeWidth: 2.2, aux: true, minStep: 1 });
        items.push({ type: 'label', x: (pLeft[0] + pTop[0]) / 2, y: pTop[1] - 10, text: 'a', color: '#0f766e', size: 13, minStep: 1 });
        items.push({ type: 'label', x: pLeft[0] - 10, y: (pTop[1] + pLeft[1]) / 2, text: 'b', color: '#dc2626', size: 13, minStep: 1 });

        // 步骤 2：列出方程与答案
        items.push({ type: 'label', x: 295, y: 78, text: '2a+3b=22', color: '#dc2626', size: 12, bg: '#fef2f2', bgW: 38, minStep: 2 });
        items.push({ type: 'label', x: 295, y: 106, text: 'a+3b=20', color: '#0f766e', size: 12, bg: '#f0fdfa', bgW: 38, minStep: 2 });
        items.push({ type: 'label', x: 295, y: 134, text: 'a=2, b=6', color: '#1e3a8a', size: 12, bg: '#eff6ff', bgW: 38, minStep: 2 });
        items.push({ type: 'label', x: 295, y: 162, text: 'S=2²+6²=40', color: '#15803d', size: 12, bg: '#ecfdf5', bgW: 40, minStep: 2 });

        return { viewBox: '0 0 340 262', items: items };
      })()
    };
  }

  // =========================================================================
  // 构造器 4：第 14 讲附加题 2（四边形 ABCD 旋 4 份补成大外弦图）
  // 条件：AB = AD, AB ⊥ AD, BC ⊥ CD, AC = 6, BD = 8
  // 解析解：将 A 放在原点 (0,0)，B、D 在边长为 8 的内正方形相邻两顶点上：
  // D = (4, -4), B = (-4, -4) -> 不对，旋转中心是 A(0,0)！
  // 4 个 A 共点不对，是 4 个 △ABD 的斜边 BD=8 围成中间 8×8 正方形！
  // 设中心 O = (0,0)，中间正方形顶点 B=(-4,-4), D=(4,-4)（边长 8）；
  // 因为 AB=AD 且 AB⊥AD，所以 A=(0, 0) 就是中心！
  // 此时 AC = 6，且 ∠BCD = 90°，C 在以 BD 为直径的圆上（半径 4，圆心 (0,-4)）：
  // 设 C = (cx, cy)，则 cx² + (cy+4)² = 16 且 cx² + cy² = 36 ⇒ 8cy + 16 = -20 ⇒ cy = -4.5（超出圆？等等！）
  // 注意：△ABD 是等腰直角三角形，斜边 BD = 8，所以腰长 AB = AD = 4√2，高 = 4！
  // 把 4 个四边形绕 A(0,0) 旋转，A 在中心，4 个 C 构成大正方形的四个顶点（对角线 2×AC = 12，所以大正方形边长 6√2）！
  // 而 4 条 BD（每条长 8）首尾相接围成什么？
  // 检验面积公式：4 × S(ABCD) = S大正方形 - ... 不对，老师笔记：(12²÷2 - 8²) ÷ 4 = (72 - 64) ÷ 4 = 2！
  // 为什么大正方形对角线=12，小正方形边长=8？因为 A 是中心，C 在外正方形顶点（距中心 6，外正方形面积 = (2×6)²÷2 = 72）；
  // 4 个等腰直角 △ABD 面积和 = 4 × (4√2 × 4√2 ÷ 2) = 64 = 8²（刚好拼成一个边长 8 的正方形）！
  // 所以 4 个 △BCD 面积和 = 72 - 64 = 8 ⇒ S(△BCD) = 2！
  // 精确坐标：A=(0,0)，C 距 A 为 6 且在 45° 方向下方：设 C=(-6/√2, -6/√2) = (-3√2, -3√2) 不一定，
  // 只需让 4 个 C 构成大正方形 (边长 6√2)，即 C=(0,-6), C2=(6,0), C3=(0,6), C4=(-6,0)！
  // 同时 ∠BCD = 90° 且 B, D 是旋转 90° 的点：令 B=(-4, -4)? 则 BC=(4,-2), DC=(-4,-2), 点积=-16+4≠0。
  // 精确解：设 B=(x, y)，D=(-y, x)（绕 A(0,0) 逆时针转 90°），则 |BD|² = 2(x²+y²) = 64 ⇒ x²+y² = 32。
  // 设 C=(0, -6)，则 (B-C)·(D-C) = 0 ⇒ x(-y) + (y+6)(x+6) = 0 ⇒ 6(x+y) + 36 = 0 ⇒ x+y = -6！
  // 联立 x+y = -6 与 x²+y² = 32 ⇒ xy = (36-32)/2 = 2 ⇒ x, y = -3 ± √7！
  // 100% 精确闭合！验证：|BC|×|CD|/2 = 2.000000！
  // =========================================================================
  function buildRotate4QuadData() {
    var r7 = Math.sqrt(7);
    var x = -3 - r7; // ≈ -5.64575
    var y = -3 + r7; // ≈ -0.35425
    var A = [0, 0];
    var B = [x, y];
    var D = [-y, x]; // 绕原点逆时针转 90°
    var C = [0, -6];

    var baseQuad = [A, B, C, D];
    var quads = [
      baseQuad,
      baseQuad.map(function (p) { return rotatePt(p, 0, 0, 90); }),
      baseQuad.map(function (p) { return rotatePt(p, 0, 0, 180); }),
      baseQuad.map(function (p) { return rotatePt(p, 0, 0, 270); })
    ];
    var outerSquare = [C, [6, 0], [0, 6], [-6, 0]];
    var innerSquare = [B, D, rotatePt(B, 0, 0, 180), rotatePt(D, 0, 0, 180)];

    return {
      math: { A: A, B: B, C: C, D: D, quads: quads, outerSquare: outerSquare, innerSquare: innerSquare },
      svgSpec: (function () {
        var scale = 16.5, ox = 170, oy = 120;
        var mp = function (arr) { return mapPoly(arr, ox, oy, scale); };
        var s = function (p) { return toSvg(p, ox, oy, scale); };
        var fills = ['#dbeafe', '#bbf7d0', '#e9d5ff', '#fed7aa'];
        return {
          viewBox: '0 0 340 245',
          items: [
            // 原始 1 块四边形 ABCD
            { type: 'polygon', points: mp([A, B, D]), fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 2 },
            { type: 'polygon', points: mp([B, C, D]), fill: '#fde68a', stroke: '#b45309', strokeWidth: 2.2 },
            { type: 'line', x1: s(A)[0], y1: s(A)[1], x2: s(C)[0], y2: s(C)[1], stroke: '#dc2626', strokeWidth: 2, dash: '4 3' },
            { type: 'label', x: s(A)[0] + 10, y: s(A)[1] - 8, text: 'A', color: '#1e3a8a', size: 13 },
            { type: 'label', x: s(B)[0] - 12, y: s(B)[1], text: 'B', size: 13 },
            { type: 'label', x: s(C)[0], y: s(C)[1] + 14, text: 'C', size: 13 },
            { type: 'label', x: s(D)[0] + 12, y: s(D)[1] + 6, text: 'D', size: 13 },
            // 步骤 1：绕 A 旋转 4 份拼成大外弦图！
            { type: 'polygon', points: mp(quads[1]), fill: fills[1], fillOpacity: 0.55, stroke: '#15803d', strokeWidth: 1.8, minStep: 1 },
            { type: 'polygon', points: mp(quads[2]), fill: fills[2], fillOpacity: 0.55, stroke: '#6d28d9', strokeWidth: 1.8, minStep: 1 },
            { type: 'polygon', points: mp(quads[3]), fill: fills[3], fillOpacity: 0.55, stroke: '#c2410c', strokeWidth: 1.8, minStep: 1 },
            { type: 'polygon', points: mp(outerSquare), fill: 'none', stroke: '#dc2626', strokeWidth: 2.3, dash: '6 4', minStep: 1 },
            { type: 'polygon', points: mp(innerSquare), fill: '#dbeafe', fillOpacity: 0.45, stroke: '#1e3a8a', strokeWidth: 2, minStep: 1 },
            { type: 'label', x: ox, y: 234, text: '大正方形(对角线12→面积72) - 中正方形(8²=64) = 4×△BCD', color: '#15803d', size: 11.5, minStep: 2 }
          ]
        };
      })()
    };
  }

  // =========================================================================
  // 构造器 5：第 14 讲附加题 5（边长 23, 13, 20, 20, 16 双直角五边形）
  // 严格数学坐标：P0(0,0), P1(16,0), P2(28,16), P3(12,28), P4(0,23)
  // 验证：|P0P1|=16, |P1P2|=20, |P2P3|=20, |P3P4|=13, |P4P0|=23
  // ∠P4P0P1 = 90°, ∠P1P2P3 = 90°，面积 = 562！
  // =========================================================================
  function buildPentagon562Data() {
    var P0 = [0, 0];
    var P1 = [16, 0];
    var P2 = [28, 16];
    var P3 = [12, 28];
    var P4 = [0, 23];
    var Q = [0, 12]; // 20×20 斜正方形第四顶点：P1 + (P3 - P2) = (16,0) + (-16, 12) = (0, 12)！
    var pentagon = [P0, P1, P2, P3, P4];
    var innerSq = [Q, P1, P2, P3];
    var outerBox = [[0, 0], [28, 0], [28, 28], [0, 28]];

    return {
      math: { P0: P0, P1: P1, P2: P2, P3: P3, P4: P4, Q: Q, pentagon: pentagon, innerSq: innerSq, outerBox: outerBox },
      svgSpec: (function () {
        var scale = 6.8, ox = 75, oy = 222;
        var mp = function (arr) { return mapPoly(arr, ox, oy, scale); };
        var s = function (p) { return toSvg(p, ox, oy, scale); };
        return {
          viewBox: '0 0 340 250',
          items: [
            { type: 'polygon', points: mp(pentagon), fill: '#eff6ff', stroke: '#1e3a8a', strokeWidth: 2.3 },
            { type: 'rightAngle', x: s(P0)[0], y: s(P0)[1], dx1: 10, dy1: 0, dx2: 0, dy2: -10 },
            { type: 'label', x: ox - 16, y: (s(P0)[1] + s(P4)[1]) / 2, text: '23' },
            { type: 'label', x: (s(P4)[0] + s(P3)[0]) / 2 - 8, y: (s(P4)[1] + s(P3)[1]) / 2 - 12, text: '13' },
            { type: 'label', x: (s(P3)[0] + s(P2)[0]) / 2 + 12, y: (s(P3)[1] + s(P2)[1]) / 2 - 10, text: '20' },
            { type: 'label', x: (s(P2)[0] + s(P1)[0]) / 2 + 14, y: (s(P2)[1] + s(P1)[1]) / 2 + 8, text: '20' },
            { type: 'label', x: (s(P0)[0] + s(P1)[0]) / 2, y: oy + 16, text: '16' },
            // 步骤 1：内部补全 20×20 斜正方形
            { type: 'polygon', points: mp(innerSq), fill: '#fef3c7', fillOpacity: 0.65, stroke: '#d97706', strokeWidth: 2.2, aux: true, minStep: 1 },
            { type: 'label', x: s([14, 14])[0], y: s([14, 14])[1], text: '20×20=400', color: '#b45309', size: 13, minStep: 1 },
            // 步骤 2：穿直外衣（28×28 大外弦图），左侧分成 12 + 11 + 5！
            { type: 'polygon', points: mp(outerBox), fill: 'none', stroke: '#dc2626', strokeWidth: 2, dash: '6 4', minStep: 2 },
            { type: 'label', x: ox + 28, y: oy - 35, text: '12-16-20', color: '#dc2626', size: 11.5, minStep: 2 },
            { type: 'label', x: ox + 26, y: s([0, 26])[1], text: '5-12-13', color: '#0f766e', size: 11.5, minStep: 2 }
          ]
        };
      })()
    };
  }

  // =========================================================================
  // 自动化数学验算套件：验证所有解析构造的边长、垂直度与鞋带公式面积 100% 严谨！
  // =========================================================================
  function assertClose(actual, expected, msg) {
    if (Math.abs(actual - expected) > 1e-5) {
      throw new Error(msg + ' (期望 ' + expected + '，实际 ' + actual + ')');
    }
  }

  function verifyAllConstructions() {
    var report = [];

    // 1. 验算 Cut41（9×5 缺 4×1 拼斜正方形）
    var c41 = buildCut41Data().math;
    var side1 = dist(c41.A, c41.M);
    var side2 = dist(c41.M, c41.D);
    var side3 = dist(c41.D, c41.T);
    var side4 = dist(c41.T, c41.A);
    assertClose(side1, Math.sqrt(41), 'Cut41 边1长度错误');
    assertClose(side2, Math.sqrt(41), 'Cut41 边2长度错误');
    assertClose(side3, Math.sqrt(41), 'Cut41 边3长度错误');
    assertClose(side4, Math.sqrt(41), 'Cut41 边4长度错误');
    assertClose(
      dot([c41.M[0] - c41.A[0], c41.M[1] - c41.A[1]], [c41.D[0] - c41.M[0], c41.D[1] - c41.M[1]]),
      0,
      'Cut41 斜正方形邻边不垂直'
    );
    var areaOrig = polygonArea(c41.piece1) + polygonArea(c41.piece2) + polygonArea(c41.piece3);
    var areaMoved = polygonArea(c41.piece1Moved) + polygonArea(c41.piece2Moved) + polygonArea(c41.piece3);
    assertClose(areaOrig, 41, 'Cut41 原图总面积不为 41');
    assertClose(areaMoved, 41, 'Cut41 平移后总面积不为 41');
    assertClose(polygonArea(c41.bigSquare), 41, 'Cut41 目标斜正方形面积不为 41');
    report.push('Cut41: 4边=√41, 邻边垂直, 拼合前后面积均=41 ✓');

    // 2. 验算附加题 4（多边形 ABCFDE 旋 4 份）
    var r4p = buildRotate4PolygonData().math;
    var singleArea = polygonArea(r4p.polys[0]);
    var innerArea = polygonArea(r4p.innerSquare);
    var outerArea = polygonArea(r4p.outerSquare);
    assertClose(singleArea, 51, '附加题4 单块多边形面积不为 51');
    assertClose(innerArea, 196, '附加题4 中间洞面积不为 14²=196');
    assertClose(outerArea, 400, '附加题4 外大正方形面积不为 20²=400');
    assertClose(4 * singleArea + innerArea, outerArea, '附加题4 拼合面积不守恒');
    assertClose(dist(r4p.E, r4p.D) + dist(r4p.D, r4p.F), 14, '附加题4 ED+DF 不为 14');
    report.push('Rotate4Polygon: 4×51 + 14² = 20² = 400, ED+DF=14 ✓');

    // 3. 验算例题 12（6 个斜正方形内切 20×22 长方形）
    var emb6 = buildEmbedded6SquaresData().math;
    assertClose(emb6.rectW, 20, '例12 外接长方形宽不为 20');
    assertClose(emb6.rectH, 22, '例12 外接长方形高不为 22');
    emb6.squares.forEach(function (sq, idx) {
      assertClose(polygonArea(sq), 40, '例12 第 ' + idx + ' 块正方形面积不为 40');
    });
    report.push('Embedded6Squares: 6块全内切于 20×22，每块面积=40 ✓');

    // 4. 验算附加题 2（四边形 ABCD 旋 4 份）
    var r4q = buildRotate4QuadData().math;
    assertClose(dist(r4q.A, r4q.C), 6, '附加题2 AC 不为 6');
    assertClose(dist(r4q.B, r4q.D), 8, '附加题2 BD 不为 8');
    assertClose(polygonArea([r4q.B, r4q.C, r4q.D]), 2, '附加题2 △BCD 面积不为 2');
    assertClose(polygonArea(r4q.outerSquare), 72, '附加题2 外正方形面积不为 72');
    assertClose(polygonArea(r4q.innerSquare), 64, '附加题2 内正方形面积不为 64');
    report.push('Rotate4Quad: AC=6, BD=8, S(△BCD)=2, 4×2+64=72 ✓');

    // 5. 验算附加题 5（双直角五边形 562）
    var p5 = buildPentagon562Data().math;
    assertClose(dist(p5.P0, p5.P1), 16, '附加题5 边16错误');
    assertClose(dist(p5.P1, p5.P2), 20, '附加题5 边20错误');
    assertClose(dist(p5.P2, p5.P3), 20, '附加题5 边20错误');
    assertClose(dist(p5.P3, p5.P4), 13, '附加题5 边13错误');
    assertClose(dist(p5.P4, p5.P0), 23, '附加题5 边23错误');
    assertClose(polygonArea(p5.pentagon), 562, '附加题5 五边形面积不为 562');
    assertClose(polygonArea(p5.innerSq), 400, '附加题5 内斜正方形面积不为 400');
    report.push('Pentagon562: 五边=16/20/20/13/23, 面积=562 ✓');

    return report;
  }

  var GeoVerify = {
    dist: dist,
    dot: dot,
    polygonArea: polygonArea,
    rotatePt: rotatePt,
    buildCut41Data: buildCut41Data,
    buildRotate4PolygonData: buildRotate4PolygonData,
    buildEmbedded6SquaresData: buildEmbedded6SquaresData,
    buildRotate4QuadData: buildRotate4QuadData,
    buildPentagon562Data: buildPentagon562Data,
    verifyAllConstructions: verifyAllConstructions
  };

  global.GeoVerify = GeoVerify;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoVerify;
  }
})(typeof window !== 'undefined' ? window : globalThis);
