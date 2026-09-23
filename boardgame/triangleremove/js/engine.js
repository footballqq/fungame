// codex: 2026-09-23 三角形点阵核心算法引擎：拓扑生成、正三角形判定、打击集求解与剩余连线分析
(function(root) {
  'use strict';

  class TriangleEngine {
    constructor(nRows = 5) {
      this.nRows = nRows;
      this.points = [];
      this.triangles = [];
      this.removedPoints = new Set();
      this.optimalSolutions = [];
      this.minRemovalCount = 0;
      this.disjointTriangles = [];
      this.init(nRows);
    }

    /**
     * 初始化关卡几何与拓扑
     */
    init(nRows) {
      this.nRows = nRows;
      this.removedPoints.clear();
      this.points = this._generatePoints(nRows);
      this.triangles = this._findAllEquilateralTriangles(this.points);
      this._solveOptimality();
      this._findDisjointTriangles();
    }

    _generatePoints(n) {
      const pts = [];
      let id = 0;
      const h = Math.sqrt(3) / 2.0;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c <= r; c++) {
          pts.push({
            id: id++,
            row: r,
            col: c,
            x: +(c - r / 2.0).toFixed(6),
            y: +(r * h).toFixed(6)
          });
        }
      }
      return pts;
    }

    _findAllEquilateralTriangles(pts) {
      const tris = [];
      const EPS = 1e-4;
      const n = pts.length;
      let id = 0;

      for (let i = 0; i < n; i++) {
        const p1 = pts[i];
        for (let j = i + 1; j < n; j++) {
          const p2 = pts[j];
          const d12_sq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
          for (let k = j + 1; k < n; k++) {
            const p3 = pts[k];
            const d23_sq = (p2.x - p3.x) ** 2 + (p2.y - p3.y) ** 2;
            const d31_sq = (p3.x - p1.x) ** 2 + (p3.y - p1.y) ** 2;

            if (Math.abs(d12_sq - d23_sq) < EPS && Math.abs(d23_sq - d31_sq) < EPS) {
              const sideLen = Math.sqrt(d12_sq);
              const rs = [p1.row, p2.row, p3.row];

              let oriType = 'tilted';
              let oriLabel = '倾斜正三角形';
              if (rs.filter(r => r === Math.max(...rs)).length === 2) {
                oriType = 'upright';
                oriLabel = '正立正三角形';
              } else if (rs.filter(r => r === Math.min(...rs)).length === 2) {
                oriType = 'inverted';
                oriLabel = '倒立正三角形';
              }

              let sideName = `边长 ${sideLen.toFixed(2)}`;
              if (Math.abs(sideLen - 1.0) < EPS) sideName = '边长 1';
              else if (Math.abs(sideLen - Math.sqrt(3)) < EPS) sideName = '边长 √3 (约1.73)';
              else if (Math.abs(sideLen - 2.0) < EPS) sideName = '边长 2';
              else if (Math.abs(sideLen - Math.sqrt(7)) < EPS) sideName = '边长 √7 (约2.65)';
              else if (Math.abs(sideLen - 3.0) < EPS) sideName = '边长 3';
              else if (Math.abs(sideLen - 4.0) < EPS) sideName = '边长 4';

              const categoryKey = `${sideName}_${oriType}`;

              tris.push({
                id: id++,
                vertices: [i, j, k],
                sideSq: +d12_sq.toFixed(5),
                sideLength: +sideLen.toFixed(3),
                sideName: sideName,
                orientation: oriType,
                orientationLabel: oriLabel,
                categoryKey: categoryKey,
                coords: [
                  { row: p1.row, col: p1.col },
                  { row: p2.row, col: p2.col },
                  { row: p3.row, col: p3.col }
                ]
              });
            }
          }
        }
      }
      return tris;
    }

    _solveOptimality() {
      const triSets = this.triangles.map(t => new Set(t.vertices));
      const n = this.points.length;
      if (triSets.length === 0) {
        this.minRemovalCount = 0;
        this.optimalSolutions = [[]];
        return;
      }

      for (let k = 1; k <= n; k++) {
        const solutions = [];
        this._combinations(n, k, (combo) => {
          const cSet = new Set(combo);
          let hitsAll = true;
          for (let i = 0; i < triSets.length; i++) {
            let hit = false;
            for (const v of triSets[i]) {
              if (cSet.has(v)) {
                hit = true;
                break;
              }
            }
            if (!hit) {
              hitsAll = false;
              break;
            }
          }
          if (hitsAll) solutions.push([...combo]);
        });

        if (solutions.length > 0) {
          this.minRemovalCount = k;
          this.optimalSolutions = solutions;
          return;
        }
      }
      this.minRemovalCount = n;
      this.optimalSolutions = [Array.from({ length: n }, (_, i) => i)];
    }

    _findDisjointTriangles() {
      const triSets = this.triangles.map(t => new Set(t.vertices));
      const n = triSets.length;
      const maxK = Math.min(n, Math.floor(this.points.length / 3));

      for (let k = maxK; k >= 1; k--) {
        let found = null;
        this._combinations(n, k, (combo) => {
          if (found) return;
          const union = new Set();
          let disjoint = true;
          for (const idx of combo) {
            for (const v of triSets[idx]) {
              if (union.has(v)) {
                disjoint = false;
                break;
              }
            }
            if (!disjoint) break;
            for (const v of triSets[idx]) union.add(v);
          }
          if (disjoint) {
            found = combo.map(i => this.triangles[i]);
          }
        });
        if (found) {
          this.disjointTriangles = found;
          return;
        }
      }
      this.disjointTriangles = [];
    }

    _combinations(n, k, callback) {
      const combo = new Array(k);
      function backtrack(start, depth) {
        if (depth === k) {
          callback(combo);
          return;
        }
        for (let i = start; i <= n - (k - depth); i++) {
          combo[depth] = i;
          backtrack(i + 1, depth + 1);
        }
      }
      backtrack(0, 0);
    }

    togglePoint(id) {
      if (this.removedPoints.has(id)) {
        this.removedPoints.delete(id);
        return false; // 表示当前状态为保留
      } else {
        this.removedPoints.add(id);
        return true; // 表示当前状态为已移除
      }
    }

    removePoint(id) {
      this.removedPoints.add(id);
    }

    restorePoint(id) {
      this.removedPoints.delete(id);
    }

    clearRemoved() {
      this.removedPoints.clear();
    }

    setRemovedPoints(arr) {
      this.removedPoints = new Set(arr);
    }

    getRemovedPoints() {
      return Array.from(this.removedPoints).sort((a, b) => a - b);
    }

    getRemainingTriangles() {
      const rem = this.removedPoints;
      return this.triangles.filter(t => {
        return !rem.has(t.vertices[0]) && !rem.has(t.vertices[1]) && !rem.has(t.vertices[2]);
      });
    }

    getRemainingByCategory() {
      const remaining = this.getRemainingTriangles();
      const grouped = {};
      for (const t of remaining) {
        if (!grouped[t.categoryKey]) {
          grouped[t.categoryKey] = {
            categoryKey: t.categoryKey,
            sideName: t.sideName,
            orientation: t.orientation,
            orientationLabel: t.orientationLabel,
            triangles: []
          };
        }
        grouped[t.categoryKey].triangles.push(t);
      }
      return grouped;
    }

    getVertexDegrees(intactOnly = false) {
      const list = intactOnly ? this.getRemainingTriangles() : this.triangles;
      const degs = new Array(this.points.length).fill(0);
      for (const t of list) {
        for (const v of t.vertices) {
          degs[v]++;
        }
      }
      return degs;
    }

    isSolved() {
      return this.getRemainingTriangles().length === 0;
    }

    isOptimal() {
      return this.isSolved() && this.removedPoints.size === this.minRemovalCount;
    }
  }

  root.TriangleEngine = TriangleEngine;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TriangleEngine };
  }
})(typeof window !== 'undefined' ? window : globalThis);
