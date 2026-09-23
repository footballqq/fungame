// codex: 2026-09-23 动态画布与正三角形连线渲染引擎：支持高分屏自适应、剩余正三角形霓虹连线、粒子消散与高亮聚焦
(function(root) {
  'use strict';

  class TriangleCanvas {
    constructor(canvasElement, engine, options = {}) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
      this.engine = engine;
      this.options = Object.assign({
        showAllRemainingLines: true,
        focusedTriangleId: null,
        highlightedTriangleIds: null, // Set of ids or null
        disjointMode: false,
        onPointClick: null
      }, options);

      this.hoveredPointId = null;
      this.particles = [];
      this.animTime = 0;
      this.pointScreenCoords = [];

      this._initEvents();
      this._startAnimationLoop();
      this.resize();
    }

    _initEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const handleMove = (e) => {
        const pos = getPos(e);
        const hitId = this._hitTest(pos.x, pos.y);
        if (hitId !== this.hoveredPointId) {
          this.hoveredPointId = hitId;
          this.canvas.style.cursor = hitId !== null ? 'pointer' : 'default';
        }
      };

      const handleClick = (e) => {
        const pos = getPos(e);
        const hitId = this._hitTest(pos.x, pos.y);
        if (hitId !== null) {
          // 触发粒子
          const pt = this.pointScreenCoords[hitId];
          if (pt) {
            this._spawnParticles(pt.x, pt.y, this.engine.removedPoints.has(hitId) ? '#38bdf8' : '#f43f5e');
          }
          if (typeof this.options.onPointClick === 'function') {
            this.options.onPointClick(hitId);
          }
        }
      };

      this.canvas.addEventListener('mousemove', handleMove);
      this.canvas.addEventListener('mouseleave', () => {
        this.hoveredPointId = null;
        this.canvas.style.cursor = 'default';
      });
      this.canvas.addEventListener('click', handleClick);

      // 移动端触摸适配
      this.canvas.addEventListener('touchstart', (e) => {
        handleMove(e);
      }, { passive: true });
      this.canvas.addEventListener('touchend', (e) => {
        handleClick(e);
        this.hoveredPointId = null;
      });

      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 480;
      const height = rect.height || 420;

      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.dpr = dpr;
      this.cssWidth = width;
      this.cssHeight = height;

      this._calculateLayout();
    }

    _calculateLayout() {
      const pts = this.engine.points;
      const n = this.engine.nRows;
      const paddingX = 40;
      const paddingTop = 45;
      const paddingBottom = 45;

      const availW = this.cssWidth - paddingX * 2;
      const availH = this.cssHeight - (paddingTop + paddingBottom);

      // 正三角形高宽比
      const maxColSpan = Math.max(1, n - 1);
      const maxRowSpan = Math.max(1, (n - 1) * (Math.sqrt(3) / 2.0));

      const scaleX = availW / maxColSpan;
      const scaleY = availH / maxRowSpan;
      const spacing = Math.min(scaleX, scaleY);

      const centerX = this.cssWidth / 2;
      const totalH = (n - 1) * (Math.sqrt(3) / 2.0) * spacing;
      const startY = paddingTop + (availH - totalH) / 2;

      this.pointScreenCoords = pts.map(p => {
        const sx = centerX + (p.col - p.row / 2.0) * spacing;
        const sy = startY + p.row * (Math.sqrt(3) / 2.0) * spacing;
        return { id: p.id, x: sx, y: sy, row: p.row, col: p.col };
      });

      this.spacing = spacing;
      this.hitRadius = Math.max(22, spacing * 0.32);
    }

    _hitTest(x, y) {
      for (const pt of this.pointScreenCoords) {
        const dx = pt.x - x;
        const dy = pt.y - y;
        if (dx * dx + dy * dy <= this.hitRadius * this.hitRadius) {
          return pt.id;
        }
      }
      return null;
    }

    _spawnParticles(x, y, color) {
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: 0.02 + Math.random() * 0.03,
          color: color,
          size: 2 + Math.random() * 3
        });
      }
    }

    _startAnimationLoop() {
      const render = () => {
        this.animTime += 0.025;
        this._updateParticles();
        this.draw();
        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);
    }

    _updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= p.decay;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    draw() {
      const ctx = this.ctx;
      const dpr = this.dpr || 1;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

      // 1. 绘制底层淡色格网连线
      this._drawBackgroundGrid(ctx);

      // 2. 绘制鸽巢互斥三角形模式 或 剩余正三角形连线
      if (this.options.disjointMode) {
        this._drawDisjointTriangles(ctx);
      } else {
        this._drawRemainingTriangles(ctx);
      }

      // 3. 绘制星石节点
      this._drawStarNodes(ctx);

      // 4. 绘制粒子
      this._drawParticles(ctx);

      ctx.restore();
    }

    _drawBackgroundGrid(ctx) {
      const pts = this.pointScreenCoords;
      if (pts.length < 3) return;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      // 连接水平线与斜线相邻点
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const p2 = pts[j];
          const isRowAdj = p1.row === p2.row && Math.abs(p1.col - p2.col) === 1;
          const isDiag1 = p2.row === p1.row + 1 && p2.col === p1.col;
          const isDiag2 = p2.row === p1.row + 1 && p2.col === p1.col + 1;
          if (isRowAdj || isDiag1 || isDiag2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    _drawRemainingTriangles(ctx) {
      const remaining = this.engine.getRemainingTriangles();
      const focusedId = this.options.focusedTriangleId;
      const styles = (window.GAME_CONFIG && window.GAME_CONFIG.CATEGORY_STYLES) || {};

      // 若开启连线显示
      if (this.options.showAllRemainingLines) {
        ctx.save();
        for (const tri of remaining) {
          const isFocused = focusedId === tri.id;
          if (isFocused) continue; // 稍后单独绘制高亮聚焦三角形

          const style = styles[tri.categoryKey] || { color: '#38bdf8' };
          const p1 = this.pointScreenCoords[tri.vertices[0]];
          const p2 = this.pointScreenCoords[tri.vertices[1]];
          const p3 = this.pointScreenCoords[tri.vertices[2]];
          if (!p1 || !p2 || !p3) continue;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();

          ctx.strokeStyle = style.color;
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 绘制单独聚焦高亮三角形（呼吸发光）
      if (focusedId !== null) {
        const tri = this.engine.triangles.find(t => t.id === focusedId);
        if (tri) {
          const p1 = this.pointScreenCoords[tri.vertices[0]];
          const p2 = this.pointScreenCoords[tri.vertices[1]];
          const p3 = this.pointScreenCoords[tri.vertices[2]];
          if (p1 && p2 && p3) {
            const pulse = 0.7 + Math.sin(this.animTime * 4) * 0.3;
            const style = styles[tri.categoryKey] || { color: '#fde047' };

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.closePath();

            // 半透明填充
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.22 * pulse;
            ctx.fill();

            // 霓虹发光外线
            ctx.strokeStyle = style.color;
            ctx.globalAlpha = 0.95;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = style.color;
            ctx.shadowBlur = 12 * pulse;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    _drawDisjointTriangles(ctx) {
      const disjoint = this.engine.disjointTriangles;
      const palette = ['#38bdf8', '#f43f5e', '#22c55e', '#eab308', '#a855f7'];

      ctx.save();
      disjoint.forEach((tri, idx) => {
        const color = palette[idx % palette.length];
        const p1 = this.pointScreenCoords[tri.vertices[0]];
        const p2 = this.pointScreenCoords[tri.vertices[1]];
        const p3 = this.pointScreenCoords[tri.vertices[2]];
        if (!p1 || !p2 || !p3) return;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.stroke();
      });
      ctx.restore();
    }

    _drawStarNodes(ctx) {
      const pts = this.pointScreenCoords;
      const focusedId = this.options.focusedTriangleId;
      const focusedTri = focusedId !== null ? this.engine.triangles.find(t => t.id === focusedId) : null;
      const focusedVertices = focusedTri ? new Set(focusedTri.vertices) : new Set();

      for (const pt of pts) {
        const isRemoved = this.engine.removedPoints.has(pt.id);
        const isHovered = this.hoveredPointId === pt.id;
        const isFocusedVertex = focusedVertices.has(pt.id);

        ctx.save();

        if (isRemoved) {
          // 已移除星石：虚线暗淡星核
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();

          // 叉叉符号
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(pt.x - 5, pt.y - 5);
          ctx.lineTo(pt.x + 5, pt.y + 5);
          ctx.moveTo(pt.x + 5, pt.y - 5);
          ctx.lineTo(pt.x - 5, pt.y + 5);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else {
          // 完好星石：晶莹高亮发光球体
          const radius = isHovered ? 13 : 10;
          const pulse = isFocusedVertex ? (1 + Math.sin(this.animTime * 6) * 0.18) : 1;

          // 外圈光晕
          const grad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, radius * 2.2 * pulse);
          if (isFocusedVertex) {
            grad.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
            grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.4)');
            grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          } else {
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
            grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.35)');
            grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius * 2.2 * pulse, 0, Math.PI * 2);
          ctx.fill();

          // 星体实体
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius * pulse, 0, Math.PI * 2);
          ctx.fillStyle = isFocusedVertex ? '#fef08a' : (isHovered ? '#bae6fd' : '#ffffff');
          ctx.shadowColor = isFocusedVertex ? '#eab308' : '#38bdf8';
          ctx.shadowBlur = isHovered ? 16 : 8;
          ctx.fill();

          // 核心亮点
          ctx.beginPath();
          ctx.arc(pt.x - 2, pt.y - 2, radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0;
          ctx.fill();
        }

        // 绘制坐标微标文字
        ctx.fillStyle = isRemoved ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.75)';
        ctx.font = '10px "Inter", "Microsoft Yahei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`(${pt.row},${pt.col})`, pt.x, pt.y + 15);

        ctx.restore();
      }
    }

    _drawParticles(ctx) {
      for (const p of this.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    setFocusedTriangle(triId) {
      this.options.focusedTriangleId = triId;
    }

    toggleLinesDisplay() {
      this.options.showAllRemainingLines = !this.options.showAllRemainingLines;
      return this.options.showAllRemainingLines;
    }

    setDisjointMode(active) {
      this.options.disjointMode = Boolean(active);
    }
  }

  root.TriangleCanvas = TriangleCanvas;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TriangleCanvas };
  }
})(typeof window !== 'undefined' ? window : globalThis);
