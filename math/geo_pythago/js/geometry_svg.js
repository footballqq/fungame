/**
 * 声明式 SVG 几何画板渲染引擎
 * 支持按步骤 (step) 动态叠加辅助线、阴影、标注、直角记号与预设几何模型
 */
(function (global) {
  'use strict';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pts(arr) {
    return arr.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
  }

  /**
   * 渲染单个声明式图元
   */
  function renderItem(item, step) {
    var minS = item.minStep != null ? item.minStep : 0;
    var maxS = item.maxStep != null ? item.maxStep : 99;
    if (step < minS || step > maxS) return '';

    var cls = item.aux ? 'aux-line' : (item.pulse ? 'aux-highlight' : '');
    var clsAttr = cls ? ' class="' + cls + '"' : '';

    switch (item.type) {
      case 'polygon':
        return '<polygon points="' + pts(item.points) + '"' +
          ' fill="' + (item.fill || 'none') + '"' +
          ' fill-opacity="' + (item.fillOpacity != null ? item.fillOpacity : 1) + '"' +
          ' stroke="' + (item.stroke || '#1e293b') + '"' +
          ' stroke-width="' + (item.strokeWidth || 2.2) + '"' +
          (item.dash ? ' stroke-dasharray="' + item.dash + '"' : '') +
          clsAttr + ' />';

      case 'rect':
        return '<rect x="' + item.x + '" y="' + item.y + '"' +
          ' width="' + item.w + '" height="' + item.h + '"' +
          (item.rx ? ' rx="' + item.rx + '"' : '') +
          ' fill="' + (item.fill || 'none') + '"' +
          ' fill-opacity="' + (item.fillOpacity != null ? item.fillOpacity : 1) + '"' +
          ' stroke="' + (item.stroke || '#1e293b') + '"' +
          ' stroke-width="' + (item.strokeWidth || 2.2) + '"' +
          (item.dash ? ' stroke-dasharray="' + item.dash + '"' : '') +
          clsAttr + ' />';

      case 'line':
        return '<line x1="' + item.x1 + '" y1="' + item.y1 + '"' +
          ' x2="' + item.x2 + '" y2="' + item.y2 + '"' +
          ' stroke="' + (item.stroke || '#dc2626') + '"' +
          ' stroke-width="' + (item.strokeWidth || 2.4) + '"' +
          (item.dash ? ' stroke-dasharray="' + item.dash + '"' : '') +
          ' stroke-linecap="round"' + clsAttr + ' />';

      case 'rightAngle': {
        var s = item.size || 10;
        var dx1 = item.dx1 || s, dy1 = item.dy1 || 0;
        var dx2 = item.dx2 || 0, dy2 = item.dy2 || -s;
        var p1 = [item.x + dx1, item.y + dy1];
        var p2 = [item.x + dx1 + dx2, item.y + dy1 + dy2];
        var p3 = [item.x + dx2, item.y + dy2];
        return '<polyline points="' + pts([p1, p2, p3]) + '"' +
          ' fill="none" stroke="' + (item.stroke || '#475569') + '"' +
          ' stroke-width="1.6"' + clsAttr + ' />';
      }

      case 'circle':
        return '<circle cx="' + item.cx + '" cy="' + item.cy + '" r="' + (item.r || 4) + '"' +
          ' fill="' + (item.fill || '#dc2626') + '"' +
          ' stroke="' + (item.stroke || 'none') + '" stroke-width="' + (item.strokeWidth || 1.5) + '" />';

      case 'label': {
        var fontSize = item.size || 14;
        var bg = item.bg
          ? '<rect x="' + (item.x - (item.bgW || 24)) + '" y="' + (item.y - fontSize * 0.78) + '"' +
            ' width="' + ((item.bgW || 24) * 2) + '" height="' + (fontSize * 1.15) + '"' +
            ' rx="5" fill="' + item.bg + '" opacity="0.92" />'
          : '';
        return bg + '<text x="' + item.x + '" y="' + item.y + '"' +
          ' text-anchor="' + (item.anchor || 'middle') + '"' +
          ' dominant-baseline="middle"' +
          ' font-size="' + fontSize + '"' +
          ' font-weight="' + (item.weight || '700') + '"' +
          ' fill="' + (item.color || '#1e293b') + '"' +
          ' font-family="PingFang SC, Microsoft YaHei, sans-serif">' +
          esc(item.text) + '</text>';
      }

      default:
        return '';
    }
  }

  /**
   * 预设模板生成器：标准赵爽内弦图（边长 c，直角边 a < b）
   */
  function buildInnerXuantuItems(opts) {
    var a = opts.a || 5;
    var b = opts.b || 12;
    var c = Math.sqrt(a * a + b * b);
    var scale = 190 / c;
    var ox = 75, oy = 45;
    var S = c * scale;
    // 四个顶点 A(top-left), B(top-right), C(bottom-right), D(bottom-left)
    var A = [ox, oy], B = [ox + S, oy], C = [ox + S, oy + S], D = [ox, oy + S];
    // 利用旋转角计算内部 4 个直角顶点
    var cosT = b / c, sinT = a / c;
    var lenA = a * scale, lenB = b * scale;
    // 从 A 沿 AB 顺时针偏转 angle，直角点 P1
    var P1 = [A[0] + lenB * cosT, A[1] + lenB * sinT];
    var P2 = [B[0] - lenB * sinT, B[1] + lenB * cosT];
    var P3 = [C[0] - lenB * cosT, C[1] - lenB * sinT];
    var P4 = [D[0] + lenB * sinT, D[1] - lenB * cosT];

    var items = [
      { type: 'polygon', points: [A, B, P1], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2 },
      { type: 'polygon', points: [B, C, P2], fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 2 },
      { type: 'polygon', points: [C, D, P3], fill: '#dbeafe', stroke: '#1e3a8a', strokeWidth: 2 },
      { type: 'polygon', points: [D, A, P4], fill: '#e0f2fe', stroke: '#1e3a8a', strokeWidth: 2 },
      { type: 'polygon', points: [P1, P2, P3, P4], fill: '#fde68a', stroke: '#b45309', strokeWidth: 2.2 }
    ];

    if (opts.showLabels !== false) {
      items.push({
        type: 'label',
        x: (A[0] + P1[0]) / 2,
        y: (A[1] + P1[1]) / 2 + 12,
        text: opts.labelB || String(b),
        color: '#1d4ed8'
      });
      items.push({
        type: 'label',
        x: (B[0] + P1[0]) / 2 + 10,
        y: (B[1] + P1[1]) / 2 + 8,
        text: opts.labelA || String(a),
        color: '#0f766e'
      });
      items.push({
        type: 'label',
        x: ox + S / 2,
        y: oy - 14,
        text: opts.labelC || ('斜边 = ' + (Number.isInteger(c) ? c : c.toFixed(1))),
        color: '#dc2626',
        minStep: opts.cStep != null ? opts.cStep : 1
      });
      items.push({
        type: 'label',
        x: ox + S / 2,
        y: oy + S / 2,
        text: opts.labelInner || ('小边 = ' + (b - a)),
        color: '#92400e',
        size: 13,
        minStep: opts.innerStep != null ? opts.innerStep : 1
      });
    }
    return items;
  }

  /**
   * 预设模板生成器：标准外弦图（大边长 a+b，斜放小正方形边长 c）
   */
  function buildOuterXuantuItems(opts) {
    var a = opts.a || 3;
    var b = opts.b || 4;
    var S = 200;
    var ox = 70, oy = 40;
    var sa = S * a / (a + b);
    var sb = S * b / (a + b);

    var A = [ox, oy], B = [ox + S, oy], C = [ox + S, oy + S], D = [ox, oy + S];
    var P1 = [ox + sa, oy];
    var P2 = [ox + S, oy + sa];
    var P3 = [ox + sb, oy + S];
    var P4 = [ox, oy + sb];

    var items = [
      { type: 'rect', x: ox, y: oy, w: S, h: S, fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2.2 },
      { type: 'polygon', points: [A, P1, P4], fill: '#cbd5e1', stroke: '#334155', strokeWidth: 1.8 },
      { type: 'polygon', points: [P1, B, P2], fill: '#cbd5e1', stroke: '#334155', strokeWidth: 1.8 },
      { type: 'polygon', points: [P2, C, P3], fill: '#cbd5e1', stroke: '#334155', strokeWidth: 1.8 },
      { type: 'polygon', points: [P3, D, P4], fill: '#cbd5e1', stroke: '#334155', strokeWidth: 1.8 },
      { type: 'polygon', points: [P1, P2, P3, P4], fill: '#ffffff', stroke: '#1d4ed8', strokeWidth: 2.5 },
      { type: 'label', x: ox + S / 2, y: oy + S / 2, text: opts.centerText || ('面积=' + (a * a + b * b)), color: '#1d4ed8', size: 15 },
      { type: 'label', x: ox + sa / 2, y: oy + S + 16, text: opts.labelA || String(a), color: '#dc2626' },
      { type: 'label', x: ox - 16, y: oy + sb + sa / 2, text: opts.labelB || String(b), color: '#0f766e', minStep: opts.bStep != null ? opts.bStep : 1 }
    ];
    return items;
  }

  /**
   * 渲染完整 SVG 字符串
   * @param {Object} spec - { viewBox, template, templateOpts, items }
   * @param {number} step - 当前步骤（用于逐步点亮辅助线）
   */
  function renderSVG(spec, step) {
    var curStep = step != null ? step : 0;
    var viewBox = (spec && spec.viewBox) || '0 0 340 280';
    var items = [];

    if (spec && spec.template === 'innerXuantu') {
      items = buildInnerXuantuItems(spec.templateOpts || {});
    } else if (spec && spec.template === 'outerXuantu') {
      items = buildOuterXuantuItems(spec.templateOpts || {});
    }
    if (spec && Array.isArray(spec.items)) {
      items = items.concat(spec.items);
    }

    var body = items.map(function (it) { return renderItem(it, curStep); }).join('');
    return '<svg viewBox="' + viewBox + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="几何示意图">' + body + '</svg>';
  }

  /**
   * 渲染八大招式掌握度 SVG 雷达图
   */
  function renderRadarSVG(stats) {
    var cx = 160, cy = 148, R = 98;
    var n = stats.length;
    var rings = [0.25, 0.5, 0.75, 1];
    var svg = '';

    rings.forEach(function (ratio) {
      var ringPts = [];
      for (var i = 0; i < n; i++) {
        var ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
        ringPts.push([cx + R * ratio * Math.cos(ang), cy + R * ratio * Math.sin(ang)]);
      }
      svg += '<polygon points="' + pts(ringPts) + '" fill="none" stroke="#cbd5e1" stroke-width="1" />';
    });

    var dataPts = [];
    for (var i = 0; i < n; i++) {
      var ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
      var x2 = cx + R * Math.cos(ang);
      var y2 = cy + R * Math.sin(ang);
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#e2e8f0" stroke-width="1" />';

      var val = Math.max(0.12, Math.min(1, stats[i].rate));
      dataPts.push([cx + R * val * Math.cos(ang), cy + R * val * Math.sin(ang)]);

      var lx = cx + (R + 24) * Math.cos(ang);
      var ly = cy + (R + 20) * Math.sin(ang);
      svg += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="middle" font-size="11.5" font-weight="700" fill="#334155">' + esc(stats[i].shortName) + '</text>';
    }

    svg += '<polygon points="' + pts(dataPts) + '" fill="#1d4ed8" fill-opacity="0.26" stroke="#1d4ed8" stroke-width="2.4" />';
    dataPts.forEach(function (p) {
      svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#1d4ed8" />';
    });

    return '<svg viewBox="0 0 320 296" style="max-width:340px;width:100%;" xmlns="http://www.w3.org/2000/svg">' + svg + '</svg>';
  }

  var GeoSVG = {
    renderSVG: renderSVG,
    renderRadarSVG: renderRadarSVG
  };

  global.GeoSVG = GeoSVG;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoSVG;
  }
})(typeof window !== 'undefined' ? window : globalThis);
