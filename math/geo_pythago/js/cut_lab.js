/**
 * 动手几何实验室：
 * 1) 赵爽内弦图 / 外弦图实时面积守恒实验
 * 2) 阶梯剪拼 & 勾股斜切滑块拼合动画
 * 3) 正方形“一分为四 (+3 魔法)”交互切分挑战（对应小测 T3 & 第 13 讲附加题 3）
 */
(function (global) {
  'use strict';

  var LabState = {
    activeTab: 'xuantu', // 'xuantu' | 'cut' | 'quad'
    // 实验 1：弦图参数
    xuantuMode: 'inner', // 'inner' | 'outer'
    a: 5,
    b: 12,
    // 实验 2：剪拼参数
    cutPreset: 'rect9x4', // 'rect9x4' | 'lshape41' | 'step25'
    cutProgress: 0, // 0 ~ 100
    // 实验 3：一分为四树节点 [{id, x, y, size, depth}]
    quadTarget: '19',
    quadNodes: [{ id: 1, x: 0, y: 0, size: 360, depth: 0 }],
    quadHistory: [],
    nextQuadId: 2
  };

  var QUAD_TARGETS = {
    '12-2': { label: '12 个（2 种面积）', count: 12, kinds: 2, tip: '提示：先切成 3×3=9 块？或者试试 16→？不对，+3 魔法从 1 开始只能得 1,4,7,10,13… 想得 12 必须先用 3×3 网格（9块），再把其中 1 块田字切成 4 块！' },
    '12-3': { label: '12 个（3 种面积）', count: 12, kinds: 3, tip: '提示：先用 3×3 底盘（留一个 2×2 大块 + 5 个 1×1 小块 = 6 块），再把其中 2 个 1×1 小块各一分为四（6 + 3 + 3 = 12），刚好 3 种大小！' },
    '12-4': { label: '12 个（4 种面积）', count: 12, kinds: 4, tip: '提示：在 3×3 底盘（6 块：1 大 + 5 中）基础上，切 1 个中块得 4 个小块（共 9 块），再切 1 个小块得 4 个小小块（共 12 块），刚好 4 种大小！' },
    '18': { label: '18 个小正方形', count: 18, kinds: null, tip: '提示：3×3 底盘有 9 块，每次“一分为四”总数 +3：9 → 12 → 15 → 18（只需切 3 次！）' },
    '19': { label: '19 个小正方形', count: 19, kinds: null, tip: '提示：从 1 块出发每次 +3：1 → 4 → 7 → 10 → 13 → 16 → 19（切 6 次即可！）' },
    '20': { label: '20 个小正方形', count: 20, kinds: null, tip: '提示：用 2×2（4块）再把其中 2 块各分成 3×3？或直接用 3×3 底盘中选 2 块变 3×3，这里我们提供了“4×4 底盘”和“一分为四”双按钮！' }
  };

  function initQuadBase(baseType) {
    LabState.quadHistory = [];
    LabState.nextQuadId = 1;
    LabState.quadNodes = [];
    if (baseType === '1x1') {
      LabState.quadNodes.push({ id: LabState.nextQuadId++, x: 0, y: 0, size: 360, depth: 0 });
    } else if (baseType === '3x3') {
      var s3 = 120;
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          LabState.quadNodes.push({ id: LabState.nextQuadId++, x: c * s3, y: r * s3, size: s3, depth: 1 });
        }
      }
    } else if (baseType === '3x3_big') {
      // 1个 2×2 大块 + 5个 1×1 中块 = 6 块
      LabState.quadNodes.push({ id: LabState.nextQuadId++, x: 0, y: 120, size: 240, depth: 0 });
      var coords = [[0, 0], [120, 0], [240, 0], [240, 120], [240, 240]];
      coords.forEach(function (pt) {
        LabState.quadNodes.push({ id: LabState.nextQuadId++, x: pt[0], y: pt[1], size: 120, depth: 1 });
      });
    } else if (baseType === '2x2_and_3x3') {
      // 2×2 四象限中，左上与右下切 3×3（各9块），左下右上保持整块：9+9+1+1=20！
      var h = 180, s6 = 60;
      LabState.quadNodes.push({ id: LabState.nextQuadId++, x: 180, y: 0, size: h, depth: 0 });
      LabState.quadNodes.push({ id: LabState.nextQuadId++, x: 0, y: 180, size: h, depth: 0 });
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          LabState.quadNodes.push({ id: LabState.nextQuadId++, x: j * s6, y: i * s6, size: s6, depth: 2 });
        }
      }
      // 右下先保持一个 180，让孩子点一下或切 3×3
      LabState.quadNodes.push({ id: LabState.nextQuadId++, x: 180, y: 180, size: h, depth: 0 });
    }
  }

  function splitQuadNode(id, parts) {
    var idx = LabState.quadNodes.findIndex(function (n) { return n.id === id; });
    if (idx === -1) return false;
    var node = LabState.quadNodes[idx];
    if (node.size < 24) return false;
    LabState.quadHistory.push(JSON.parse(JSON.stringify(LabState.quadNodes)));
    var n = parts || 2;
    var sub = node.size / n;
    var added = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        added.push({
          id: LabState.nextQuadId++,
          x: node.x + c * sub,
          y: node.y + r * sub,
          size: sub,
          depth: node.depth + 1
        });
      }
    }
    LabState.quadNodes.splice(idx, 1);
    LabState.quadNodes = LabState.quadNodes.concat(added);
    return true;
  }

  function getQuadStats() {
    var sizes = {};
    LabState.quadNodes.forEach(function (n) {
      sizes[Math.round(n.size * 10)] = true;
    });
    return {
      count: LabState.quadNodes.length,
      kinds: Object.keys(sizes).length
    };
  }

  function renderXuantuLab() {
    var a = Math.min(LabState.a, LabState.b);
    var b = Math.max(LabState.a, LabState.b);
    var c2 = a * a + b * b;
    var c = Math.sqrt(c2);
    var cStr = Number.isInteger(c) ? String(c) : c.toFixed(2);
    var diff = b - a;
    var triArea = (a * b) / 2;

    var spec = LabState.xuantuMode === 'inner'
      ? {
          viewBox: '0 0 340 280',
          template: 'innerXuantu',
          templateOpts: {
            a: a, b: b,
            labelA: 'a=' + a,
            labelB: 'b=' + b,
            labelC: '斜边 c = ' + cStr,
            labelInner: diff === 0 ? '点' : '小边 ' + diff,
            cStep: 0, innerStep: 0
          }
        }
      : {
          viewBox: '0 0 340 280',
          template: 'outerXuantu',
          templateOpts: {
            a: a, b: b,
            labelA: 'a=' + a,
            labelB: 'b=' + b,
            centerText: 'c² = ' + c2,
            bStep: 0
          }
        };

    var svgHtml = global.GeoSVG.renderSVG(spec, 2);

    var formulaHtml = LabState.xuantuMode === 'inner'
      ? '<div><strong>赵爽内弦图面积守恒：</strong></div>' +
        '<div>大正方形面积 = <span class="hl-gold">c² = ' + c2 + '</span></div>' +
        '<div>4 个直角三角形 = 4 × (' + a + ' × ' + b + ' ÷ 2) = <span class="hl-teal">' + (4 * triArea) + '</span></div>' +
        '<div>中间小正方形 = (' + b + ' - ' + a + ')² = <span class="hl-coral">' + (diff * diff) + '</span></div>' +
        '<div>合起来：<span class="hl-teal">' + (4 * triArea) + '</span> + <span class="hl-coral">' + (diff * diff) + '</span> = <span class="hl-gold">' + c2 + '</span> = ' + a + '² + ' + b + '² ✓</div>'
      : '<div><strong>外弦图面积守恒：</strong></div>' +
        '<div>大正方形面积 = (' + a + ' + ' + b + ')² = <span class="hl-gold">' + ((a + b) * (a + b)) + '</span></div>' +
        '<div>4 个角落三角形 = 4 × (' + a + ' × ' + b + ' ÷ 2) = <span class="hl-teal">' + (4 * triArea) + '</span></div>' +
        '<div>中间斜正方形 = <span class="hl-gold">' + ((a + b) * (a + b)) + '</span> - <span class="hl-teal">' + (4 * triArea) + '</span> = <span class="hl-coral">' + c2 + '</span> = ' + a + '² + ' + b + '² ✓</div>';

    return '<div class="workspace-grid">' +
      '<div class="svg-stage-card">' +
        '<div class="svg-stage-header">' +
          '<strong>互动弦图画板</strong>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="btn btn-sm ' + (LabState.xuantuMode === 'inner' ? 'btn-primary' : 'btn-secondary') + '" data-lab-xmode="inner">赵爽内弦图</button>' +
            '<button class="btn btn-sm ' + (LabState.xuantuMode === 'outer' ? 'btn-primary' : 'btn-secondary') + '" data-lab-xmode="outer">外接外弦图</button>' +
          '</div>' +
        '</div>' +
        '<div class="svg-canvas-wrap">' + svgHtml + '</div>' +
      '</div>' +
      '<div class="card">' +
        '<h3 class="card-title">🔬 拖动滑块，亲眼见证勾股定理！</h3>' +
        '<p class="card-desc">试着调出经典勾股数：<strong>(3, 4)</strong>、<strong>(5, 12)</strong>、<strong>(6, 8)</strong>、<strong>(8, 15)</strong>，观察中间小正方形和斜边的变化！</p>' +
        '<div class="slider-group">' +
          '<div class="slider-row"><label>短直角边 a = <strong>' + LabState.a + '</strong></label><input type="range" min="2" max="12" value="' + LabState.a + '" id="sliderA"></div>' +
          '<div class="slider-row"><label>长直角边 b = <strong>' + LabState.b + '</strong></label><input type="range" min="2" max="15" value="' + LabState.b + '" id="sliderB"></div>' +
        '</div>' +
        '<div class="formula-board">' + formulaHtml + '</div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="btn btn-secondary btn-sm" data-pyth-preset="3,4">3-4-5 黄金三角</button>' +
          '<button class="btn btn-secondary btn-sm" data-pyth-preset="5,12">5-12-13 (例题10)</button>' +
          '<button class="btn btn-secondary btn-sm" data-pyth-preset="6,8">6-8-10 (练习11)</button>' +
          '<button class="btn btn-secondary btn-sm" data-pyth-preset="8,15">8-15-17</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderCutLab() {
    var t = LabState.cutProgress / 100;
    var svg = '';
    var title = '';
    var desc = '';

    if (LabState.cutPreset === 'rect9x4') {
      title = '小测 T2：9×4 长方形 → 两刀阶梯剪拼 6×6 正方形';
      desc = '面积 = 9×4 = 36 = 6×6。把长从 9 缩成 6（步长 3），宽从 4 增到 6（步长 2），画一个 3×2 阶梯线，右上方块向左滑 3、向上滑 2，严丝合缝！';
      var u = 30, ox = 35, oy = 110;
      var dx = -3 * u * t;
      var dy = -2 * u * t;
      // 块 1（左下阶梯）固定
      var p1 = [[ox, oy], [ox + 3 * u, oy], [ox + 3 * u, oy + 2 * u], [ox + 6 * u, oy + 2 * u], [ox + 6 * u, oy + 4 * u], [ox, oy + 4 * u]];
      // 块 2（右上阶梯）移动
      var p2 = [[ox + 3 * u + dx, oy + dy], [ox + 9 * u + dx, oy + dy], [ox + 9 * u + dx, oy + 4 * u + dy], [ox + 6 * u + dx, oy + 4 * u + dy], [ox + 6 * u + dx, oy + 2 * u + dy], [ox + 3 * u + dx, oy + 2 * u + dy]];
      var fmt = function (arr) { return arr.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
      svg = '<svg viewBox="0 0 340 260" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="' + ox + '" y="' + (oy - 2 * u) + '" width="' + (6 * u) + '" height="' + (6 * u) + '" fill="none" stroke="#94a3b8" stroke-dasharray="6 4" stroke-width="1.6" />' +
        '<polygon points="' + fmt(p1) + '" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="2.2" />' +
        '<polygon points="' + fmt(p2) + '" fill="#fde68a" stroke="#b45309" stroke-width="2.2" />' +
        '<text x="' + (ox + 45) + '" y="' + (oy + 90) + '" font-size="16" font-weight="800" fill="#1e3a8a">①</text>' +
        '<text x="' + (ox + 200 + dx) + '" y="' + (oy + 38 + dy) + '" font-size="16" font-weight="800" fill="#92400e">②</text>' +
        '<text x="170" y="246" text-anchor="middle" font-size="13" font-weight="700" fill="#475569">' + (t > 0.95 ? '拼成完美 6×6 正方形！' : '拖动滑块看块②沿阶梯平移') + '</text>' +
      '</svg>';
    } else {
      title = '第 13 讲附加题 4：9×5 缺 4×1 → 勾股斜切拼斜正方形（面积 41）';
      desc = '余下面积 = 9×5 - 4×1 = 41 = 4² + 5²！说明目标正方形的边长就是“直角边为 4 和 5 的直角三角形的斜边”！切出左右两块 4-5 直角三角形 ① 和 ②，拖动滑块看它们精准飞进顶部虚线槽位！';
      var u2 = 22, ox2 = 71, oy2 = 116;
      // 目标斜正方形四个精确顶点：A(0,4), M(5,0), D(9,5), T(4,9)（SVG y 向下：top=oy2-4u2, bottom=oy2+5u2）
      var targetSq = [
        [ox2, oy2 + u2],
        [ox2 + 5 * u2, oy2 + 5 * u2],
        [ox2 + 9 * u2, oy2],
        [ox2 + 4 * u2, oy2 - 4 * u2]
      ];
      // 块 3（中间固定）
      var c3 = [[ox2, oy2 + u2], [ox2 + 4 * u2, oy2 + u2], [ox2 + 4 * u2, oy2], [ox2 + 9 * u2, oy2], [ox2 + 5 * u2, oy2 + 5 * u2]];
      // 块 1（左下 4×5 直角三角形，移到右上：dx = +4u, dy = -5u）
      var d1x = 4 * u2 * t, d1y = -5 * u2 * t;
      var c1 = [[ox2 + d1x, oy2 + u2 + d1y], [ox2 + 5 * u2 + d1x, oy2 + 5 * u2 + d1y], [ox2 + d1x, oy2 + 5 * u2 + d1y]];
      // 块 2（右下 4×5 直角三角形，移到左上：dx = -5u, dy = -4u）
      var d2x = -5 * u2 * t, d2y = -4 * u2 * t;
      var c2 = [[ox2 + 9 * u2 + d2x, oy2 + d2y], [ox2 + 9 * u2 + d2x, oy2 + 5 * u2 + d2y], [ox2 + 5 * u2 + d2x, oy2 + 5 * u2 + d2y]];
      var fmt2 = function (arr) { return arr.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
      svg = '<svg viewBox="0 0 340 272" xmlns="http://www.w3.org/2000/svg">' +
        // 原始缺角 4×1 浅灰参考框
        '<rect x="' + ox2 + '" y="' + oy2 + '" width="' + (4 * u2) + '" height="' + u2 + '" fill="#f8fafc" stroke="#cbd5e1" stroke-dasharray="4 3" stroke-width="1.4" />' +
        // 目标斜正方形虚线槽位 + 顶部纵轴竖直分界线
        '<polygon points="' + fmt2(targetSq) + '" fill="#fefce8" fill-opacity="0.65" stroke="#d97706" stroke-dasharray="6 4" stroke-width="1.8" />' +
        '<line x1="' + (ox2 + 4 * u2) + '" y1="' + (oy2 - 4 * u2) + '" x2="' + (ox2 + 4 * u2) + '" y2="' + (oy2 + u2) + '" stroke="#d97706" stroke-dasharray="5 3" stroke-width="1.8" />' +
        // 目标槽位淡淡水印（未完全拼合时提示落点）
        (t < 0.85 ? '<text x="' + (ox2 + 2.6 * u2) + '" y="' + (oy2 - 0.8 * u2) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#b45309" opacity="0.55">②\'</text>' : '') +
        (t < 0.85 ? '<text x="' + (ox2 + 5.7 * u2) + '" y="' + (oy2 - 1.2 * u2) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#065f46" opacity="0.55">①\'</text>' : '') +
        // 三块实体多边形
        '<polygon points="' + fmt2(c3) + '" fill="#c7d2fe" stroke="#312e81" stroke-width="2.2" />' +
        '<polygon points="' + fmt2(c1) + '" fill="#a7f3d0" fill-opacity="0.92" stroke="#065f46" stroke-width="2.2" />' +
        '<polygon points="' + fmt2(c2) + '" fill="#fed7aa" fill-opacity="0.92" stroke="#9a3412" stroke-width="2.2" />' +
        // 随块移动的编号 ① ② 与固定编号 ③
        '<text x="' + (ox2 + 1.5 * u2 + d1x).toFixed(1) + '" y="' + (oy2 + 3.8 * u2 + d1y).toFixed(1) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#065f46">①</text>' +
        '<text x="' + (ox2 + 7.6 * u2 + d2x).toFixed(1) + '" y="' + (oy2 + 3.5 * u2 + d2y).toFixed(1) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#9a3412">②</text>' +
        '<text x="' + (ox2 + 4.9 * u2).toFixed(1) + '" y="' + (oy2 + 2.4 * u2).toFixed(1) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#312e81">③</text>' +
        // 原图尺寸标注
        '<text x="' + (ox2 - 14) + '" y="' + (oy2 + 3 * u2) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#475569">4</text>' +
        '<text x="' + (ox2 + 9 * u2 + 14) + '" y="' + (oy2 + 2.5 * u2) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#475569">5</text>' +
        '<text x="' + (ox2 + 4.5 * u2) + '" y="' + (oy2 + 5 * u2 + 18) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="#475569">底边 = 9（左 5 + 右 4）</text>' +
        '<text x="170" y="264" text-anchor="middle" font-size="13" font-weight="700" fill="' + (t > 0.95 ? '#15803d' : '#475569') + '">' + (t > 0.95 ? '✓ 完美拼出面积 41 = 4² + 5² 的斜正方形！' : '拖动滑块看 ①(→4 ↑5) 和 ②(←5 ↑4) 飞进顶部槽位') + '</text>' +
      '</svg>';
    }

    return '<div class="workspace-grid">' +
      '<div class="svg-stage-card">' +
        '<div class="svg-stage-header">' +
          '<strong>动态剪拼演示台</strong>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="btn btn-sm ' + (LabState.cutPreset === 'rect9x4' ? 'btn-primary' : 'btn-secondary') + '" data-cut-preset="rect9x4">9×4 阶梯剪拼</button>' +
            '<button class="btn btn-sm ' + (LabState.cutPreset === 'lshape41' ? 'btn-primary' : 'btn-secondary') + '" data-cut-preset="lshape41">41=4²+5² 勾股斜切</button>' +
          '</div>' +
        '</div>' +
        '<div class="svg-canvas-wrap">' + svg + '</div>' +
      '</div>' +
      '<div class="card">' +
        '<h3 class="card-title">✂️ ' + title + '</h3>' +
        '<p class="card-desc">' + desc + '</p>' +
        '<div class="slider-group">' +
          '<div class="slider-row"><label>拼合进度：<strong>' + LabState.cutProgress + '%</strong></label><input type="range" min="0" max="100" value="' + LabState.cutProgress + '" id="sliderCut"></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="btn btn-primary btn-sm" id="btnCutPlay">▶️ 一键演示拼合</button>' +
          '<button class="btn btn-secondary btn-sm" id="btnCutReset">↺ 恢复原状</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderQuadLab(labDoneList) {
    var doneList = Array.isArray(labDoneList) ? labDoneList : [];
    var target = QUAD_TARGETS[LabState.quadTarget] || QUAD_TARGETS['19'];
    var stats = getQuadStats();
    var matched = stats.count === target.count && (target.kinds == null || stats.kinds === target.kinds);
    var palette = ['#dbeafe', '#fef3c7', '#dcfce7', '#fce7f3', '#ede9fe'];

    var rects = LabState.quadNodes.map(function (n) {
      var fill = palette[n.depth % palette.length];
      return '<rect class="quad-cell" data-quad-id="' + n.id + '"' +
        ' x="' + n.x + '" y="' + n.y + '" width="' + n.size + '" height="' + n.size + '"' +
        ' fill="' + fill + '" stroke="#1e3a8a" stroke-width="2" />';
    }).join('');

    var targetBtns = Object.keys(QUAD_TARGETS).map(function (k) {
      var isDone = doneList.indexOf(k) !== -1;
      return '<button class="filter-chip ' + (LabState.quadTarget === k ? 'active' : '') + '" data-quad-target="' + k + '">' +
        (isDone ? '✅ ' : '') + QUAD_TARGETS[k].label + '</button>';
    }).join('');

    return '<div class="workspace-grid">' +
      '<div class="svg-stage-card">' +
        '<div class="svg-stage-header">' +
          '<strong>点击任意正方形“一分为四”（总数 +3）</strong>' +
          '<span class="tag ' + (matched ? 'tag-core' : 'tag-pythago') + '">当前：' + stats.count + ' 个 · ' + stats.kinds + ' 种面积</span>' +
        '</div>' +
        '<div class="quad-grid-wrap">' +
          '<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">' + rects + '</svg>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<h3 class="card-title">🪄 正方形“一分为四 (+3 魔法)”挑战</h3>' +
        '<p class="card-desc">每次点击一个小正方形，它会变成 4 个更小的正方形，总数正好 <strong>+3</strong>！试试完成小测 T3 和附加题 3 的全部目标！</p>' +
        '<div class="filter-bar" style="margin-top:12px;">' + targetBtns + '</div>' +
        (matched
          ? '<div class="hint-card hint-l3" style="margin-bottom:12px;">🎉 <strong>挑战成功！</strong>你成功切出了 ' + stats.count + ' 个小正方形（共 ' + stats.kinds + ' 种不同面积）！</div>'
          : '<div class="hint-card hint-l1" style="margin-bottom:12px;">' + target.tip + '</div>') +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
          '<button class="btn btn-secondary btn-sm" data-quad-base="1x1">底盘：1 整块</button>' +
          '<button class="btn btn-secondary btn-sm" data-quad-base="3x3">底盘：3×3 (9块)</button>' +
          '<button class="btn btn-secondary btn-sm" data-quad-base="3x3_big">底盘：1大+5中 (6块)</button>' +
          '<button class="btn btn-secondary btn-sm" data-quad-base="2x2_and_3x3">底盘：拼20块专用</button>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="btn btn-secondary btn-sm" id="btnQuadUndo">↩️ 撤销一步</button>' +
          '<button class="btn btn-primary btn-sm" id="btnQuadSplit9">✨ 把最后一块切 3×3 (+8)</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderLabPage(labDoneList) {
    var content = LabState.activeTab === 'xuantu'
      ? renderXuantuLab()
      : (LabState.activeTab === 'cut' ? renderCutLab() : renderQuadLab(labDoneList));

    return '<div>' +
      '<div class="lab-tabs">' +
        '<button class="btn ' + (LabState.activeTab === 'xuantu' ? 'btn-primary' : 'btn-secondary') + '" data-lab-tab="xuantu">🔷 实验 1：赵爽弦图与勾股面积</button>' +
        '<button class="btn ' + (LabState.activeTab === 'cut' ? 'btn-primary' : 'btn-secondary') + '" data-lab-tab="cut">✂️ 实验 2：阶梯剪拼与勾股斜切</button>' +
        '<button class="btn ' + (LabState.activeTab === 'quad' ? 'btn-primary' : 'btn-secondary') + '" data-lab-tab="quad">🪄 实验 3：正方形 +3 魔法切分</button>' +
      '</div>' +
      content +
    '</div>';
  }

  function bindLabEvents(container, rerender, onTargetComplete) {
    container.querySelectorAll('[data-lab-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        LabState.activeTab = btn.getAttribute('data-lab-tab');
        global.GeoAudio && global.GeoAudio.click();
        rerender();
      });
    });

    container.querySelectorAll('[data-lab-xmode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        LabState.xuantuMode = btn.getAttribute('data-lab-xmode');
        global.GeoAudio && global.GeoAudio.click();
        rerender();
      });
    });

    var sliderA = container.querySelector('#sliderA');
    if (sliderA) {
      sliderA.addEventListener('input', function () {
        LabState.a = Number(sliderA.value);
        rerender();
      });
    }
    var sliderB = container.querySelector('#sliderB');
    if (sliderB) {
      sliderB.addEventListener('input', function () {
        LabState.b = Number(sliderB.value);
        rerender();
      });
    }

    container.querySelectorAll('[data-pyth-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-pyth-preset').split(',');
        LabState.a = Number(parts[0]);
        LabState.b = Number(parts[1]);
        global.GeoAudio && global.GeoAudio.auxLine();
        rerender();
      });
    });

    container.querySelectorAll('[data-cut-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        LabState.cutPreset = btn.getAttribute('data-cut-preset');
        LabState.cutProgress = 0;
        global.GeoAudio && global.GeoAudio.click();
        rerender();
      });
    });

    var sliderCut = container.querySelector('#sliderCut');
    if (sliderCut) {
      sliderCut.addEventListener('input', function () {
        LabState.cutProgress = Number(sliderCut.value);
        rerender();
      });
    }

    var btnCutPlay = container.querySelector('#btnCutPlay');
    if (btnCutPlay) {
      btnCutPlay.addEventListener('click', function () {
        LabState.cutProgress = 0;
        global.GeoAudio && global.GeoAudio.cut();
        var timer = setInterval(function () {
          LabState.cutProgress = Math.min(100, LabState.cutProgress + 5);
          rerender();
          if (LabState.cutProgress >= 100) {
            clearInterval(timer);
            global.GeoAudio && global.GeoAudio.success();
          }
        }, 35);
      });
    }

    var btnCutReset = container.querySelector('#btnCutReset');
    if (btnCutReset) {
      btnCutReset.addEventListener('click', function () {
        LabState.cutProgress = 0;
        rerender();
      });
    }

    container.querySelectorAll('[data-quad-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        LabState.quadTarget = btn.getAttribute('data-quad-target');
        global.GeoAudio && global.GeoAudio.click();
        rerender();
      });
    });

    container.querySelectorAll('[data-quad-base]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        initQuadBase(btn.getAttribute('data-quad-base'));
        global.GeoAudio && global.GeoAudio.click();
        rerender();
      });
    });

    container.querySelectorAll('[data-quad-id]').forEach(function (rect) {
      rect.addEventListener('click', function () {
        var id = Number(rect.getAttribute('data-quad-id'));
        if (splitQuadNode(id, 2)) {
          global.GeoAudio && global.GeoAudio.cut();
          var stats = getQuadStats();
          var target = QUAD_TARGETS[LabState.quadTarget];
          if (target && stats.count === target.count && (target.kinds == null || stats.kinds === target.kinds)) {
            global.GeoAudio && global.GeoAudio.success();
            if (typeof onTargetComplete === 'function') onTargetComplete(LabState.quadTarget);
          }
          rerender();
        }
      });
    });

    var btnQuadUndo = container.querySelector('#btnQuadUndo');
    if (btnQuadUndo) {
      btnQuadUndo.addEventListener('click', function () {
        if (LabState.quadHistory.length > 0) {
          LabState.quadNodes = LabState.quadHistory.pop();
          global.GeoAudio && global.GeoAudio.click();
          rerender();
        }
      });
    }

    var btnQuadSplit9 = container.querySelector('#btnQuadSplit9');
    if (btnQuadSplit9) {
      btnQuadSplit9.addEventListener('click', function () {
        var last = LabState.quadNodes[LabState.quadNodes.length - 1];
        if (last && splitQuadNode(last.id, 3)) {
          global.GeoAudio && global.GeoAudio.cut();
          rerender();
        }
      });
    }
  }

  var GeoLab = {
    render: renderLabPage,
    bind: bindLabEvents,
    state: LabState
  };

  global.GeoLab = GeoLab;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoLab;
  }
})(typeof window !== 'undefined' ? window : globalThis);
