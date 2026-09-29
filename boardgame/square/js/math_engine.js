// codex: 2026-09-29 支持自定义参数 (N, maxTile) 动态求解与极值缓存，解决非默认尺寸理论极限错误与演示缺失
(function (global) {
  'use strict';

  const PRESETS = {
    5: {
      N: 5,
      maxTile: 4,
      minCount: 8,
      key: 'level_5',
      solution: [
        { r: 0, c: 0, s: 3 }, { r: 0, c: 3, s: 2 },
        { r: 2, c: 3, s: 2 }, { r: 3, c: 0, s: 2 },
        { r: 3, c: 2, s: 1 }, { r: 4, c: 2, s: 1 },
        { r: 4, c: 3, s: 1 }, { r: 4, c: 4, s: 1 }
      ]
    },
    6: {
      N: 6,
      maxTile: 4,
      minCount: 4,
      key: 'level_6',
      solution: [
        { r: 0, c: 0, s: 3 }, { r: 0, c: 3, s: 3 },
        { r: 3, c: 0, s: 3 }, { r: 3, c: 3, s: 3 }
      ]
    },
    7: {
      N: 7,
      maxTile: 4,
      minCount: 9,
      key: 'level_7',
      solution: [
        { r: 0, c: 0, s: 4 }, { r: 0, c: 4, s: 3 },
        { r: 3, c: 4, s: 2 }, { r: 3, c: 6, s: 1 },
        { r: 4, c: 0, s: 3 }, { r: 4, c: 3, s: 1 },
        { r: 4, c: 6, s: 1 }, { r: 5, c: 3, s: 2 },
        { r: 5, c: 5, s: 2 }
      ]
    },
    8: {
      N: 8,
      maxTile: 4,
      minCount: 4,
      key: 'level_8',
      solution: [
        { r: 0, c: 0, s: 4 }, { r: 0, c: 4, s: 4 },
        { r: 4, c: 0, s: 4 }, { r: 4, c: 4, s: 4 }
      ]
    },
    9: {
      N: 9,
      maxTile: 4,
      minCount: 9,
      key: 'level_9',
      solution: [
        { r: 0, c: 0, s: 3 }, { r: 0, c: 3, s: 3 }, { r: 0, c: 6, s: 3 },
        { r: 3, c: 0, s: 3 }, { r: 3, c: 3, s: 3 }, { r: 3, c: 6, s: 3 },
        { r: 6, c: 0, s: 3 }, { r: 6, c: 3, s: 3 }, { r: 6, c: 6, s: 3 }
      ]
    },
    10: {
      N: 10,
      maxTile: 4,
      minCount: 11,
      key: 'level_10',
      isOriginalProblem: true,
      solution: [
        { r: 0, c: 0, s: 4 }, { r: 0, c: 4, s: 4 }, { r: 0, c: 8, s: 2 },
        { r: 2, c: 8, s: 2 }, { r: 4, c: 0, s: 4 }, { r: 4, c: 4, s: 3 },
        { r: 4, c: 7, s: 3 }, { r: 7, c: 4, s: 3 }, { r: 7, c: 7, s: 3 },
        { r: 8, c: 0, s: 2 }, { r: 8, c: 2, s: 2 }
      ]
    },
    11: {
      N: 11,
      maxTile: 4,
      minCount: 15,
      key: 'level_11',
      solution: [
        { r: 0, c: 0, s: 4 }, { r: 0, c: 4, s: 4 }, { r: 0, c: 8, s: 3 },
        { r: 3, c: 8, s: 3 }, { r: 4, c: 0, s: 4 }, { r: 4, c: 4, s: 4 },
        { r: 6, c: 8, s: 3 }, { r: 8, c: 0, s: 3 }, { r: 8, c: 3, s: 3 },
        { r: 8, c: 6, s: 2 }, { r: 9, c: 8, s: 2 }, { r: 9, c: 10, s: 1 },
        { r: 10, c: 6, s: 1 }, { r: 10, c: 7, s: 1 }, { r: 10, c: 10, s: 1 }
      ]
    },
    12: {
      N: 12,
      maxTile: 4,
      minCount: 9,
      key: 'level_12',
      solution: [
        { r: 0, c: 0, s: 4 }, { r: 0, c: 4, s: 4 }, { r: 0, c: 8, s: 4 },
        { r: 4, c: 0, s: 4 }, { r: 4, c: 4, s: 4 }, { r: 4, c: 8, s: 4 },
        { r: 8, c: 0, s: 4 }, { r: 8, c: 4, s: 4 }, { r: 8, c: 8, s: 4 }
      ]
    }
  };

  class MathEngine {
    constructor() {
      this.presets = PRESETS;
      this.solvedCache = {};
    }

    getPreset(n, maxTile = 4) {
      if (maxTile === 4 && this.presets[n]) {
        return this.presets[n];
      }
      return this.getOrSolve(n, maxTile);
    }

    getOrSolve(N, maxTile) {
      const key = `${N}_${maxTile}`;
      if (this.solvedCache[key]) {
        return this.solvedCache[key];
      }
      const sol = this.solveMinTiling(N, maxTile);
      const res = {
        N,
        maxTile,
        minCount: sol ? sol.length : Math.ceil((N * N) / (maxTile * maxTile)),
        key: `custom_${key}`,
        solution: sol || []
      };
      this.solvedCache[key] = res;
      return res;
    }

    solveMinTiling(N, maxTile) {
      if (maxTile >= N) return [{ r: 0, c: 0, s: N }];
      if (maxTile === 1) {
        const sol = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) sol.push({ r, c, s: 1 });
        return sol;
      }
      if (maxTile === 2) {
        const k = Math.floor(N / 2);
        const sol = [];
        for (let r = 0; r < 2 * k; r += 2) {
          for (let c = 0; c < 2 * k; c += 2) sol.push({ r, c, s: 2 });
        }
        if (N % 2 === 1) {
          for (let r = 0; r < N; r++) sol.push({ r, c: 2 * k, s: 1 });
          for (let c = 0; c < 2 * k; c++) sol.push({ r: 2 * k, c, s: 1 });
        }
        return sol;
      }

      const grid = Array.from({ length: N }, () => new Uint8Array(N));
      let bestSol = null;
      let bestCount = N * N + 1;

      // 整除快速上界
      for (let s = maxTile; s >= 1; s--) {
        if (N % s === 0) {
          const k = N / s;
          bestCount = k * k;
          bestSol = [];
          for (let r = 0; r < N; r += s) {
            for (let c = 0; c < N; c += s) bestSol.push({ r, c, s });
          }
          break;
        }
      }

      const maxS2 = maxTile * maxTile;
      let steps = 0;

      function search(sol, covered) {
        if (steps++ > 40000) return;
        const rem = N * N - covered;
        if (sol.length + Math.ceil(rem / maxS2) >= bestCount) return;

        let emptyR = -1, emptyC = -1;
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            if (grid[r][c] === 0) { emptyR = r; emptyC = c; break; }
          }
          if (emptyR !== -1) break;
        }

        if (emptyR === -1) {
          bestCount = sol.length;
          bestSol = sol.slice();
          return;
        }

        const maxS = Math.min(maxTile, N - emptyR, N - emptyC);
        for (let s = maxS; s >= 1; s--) {
          let canFit = true;
          for (let i = emptyR; i < emptyR + s; i++) {
            for (let j = emptyC; j < emptyC + s; j++) {
              if (grid[i][j] !== 0) { canFit = false; break; }
            }
            if (!canFit) break;
          }
          if (canFit) {
            for (let i = emptyR; i < emptyR + s; i++) {
              for (let j = emptyC; j < emptyC + s; j++) grid[i][j] = 1;
            }
            sol.push({ r: emptyR, c: emptyC, s });
            search(sol, covered + s * s);
            sol.pop();
            for (let i = emptyR; i < emptyR + s; i++) {
              for (let j = emptyC; j < emptyC + s; j++) grid[i][j] = 0;
            }
            if (bestCount === 4) return;
          }
        }
      }

      search([], 0);
      return bestSol;
    }

    getAllPresets() {
      return Object.values(this.presets);
    }

    /**
     * 校验给定一组正方形在 NxN 网格内的合法性
     */
    validateTiling(N, tiles) {
      const grid = Array.from({ length: N }, () => new Array(N).fill(0));
      let totalArea = 0;

      for (let idx = 0; idx < tiles.length; idx++) {
        const { r, c, s } = tiles[idx];
        if (s <= 0 || r < 0 || c < 0 || r + s > N || c + s > N) {
          return { valid: false, reason: 'out_of_bounds', tileIndex: idx };
        }
        for (let i = r; i < r + s; i++) {
          for (let j = c; j < c + s; j++) {
            if (grid[i][j] !== 0) {
              return { valid: false, reason: 'overlap', tileIndex: idx, overlapCell: { r: i, c: j } };
            }
            grid[i][j] = idx + 1;
          }
        }
        totalArea += s * s;
      }

      const isComplete = totalArea === N * N;
      return {
        valid: true,
        complete: isComplete,
        coveredArea: totalArea,
        totalArea: N * N,
        coverageRate: totalArea / (N * N)
      };
    }

    /**
     * 在当前棋盘基础上，使用回溯求解器寻找补充最优解（用于提示一步）
     */
    findHint(N, maxTile, currentTiles, targetMinCount) {
      // 如果当前为空，直接给出预设最优解的第一个放置
      const preset = this.getPreset(N, maxTile);
      if (currentTiles.length === 0) {
        if (preset && preset.solution && preset.solution.length > 0) {
          return { found: true, nextTile: preset.solution[0] };
        }
      }

      // 构建初始棋盘
      const grid = Array.from({ length: N }, () => new Array(N).fill(0));
      let initialArea = 0;
      for (const t of currentTiles) {
        for (let i = t.r; i < t.r + t.s; i++) {
          for (let j = t.c; j < t.c + t.s; j++) {
            grid[i][j] = 1;
          }
        }
        initialArea += t.s * t.s;
      }

      if (initialArea === N * N) {
        return { found: false, reason: 'already_filled' };
      }

      const maxLimit = targetMinCount || (preset ? preset.minCount : N * N);
      let bestRemaining = null;

      function getEmpty() {
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            if (grid[r][c] === 0) return { r, c };
          }
        }
        return null;
      }

      function canPlace(r, c, s) {
        if (r + s > N || c + s > N) return false;
        for (let i = r; i < r + s; i++) {
          for (let j = c; j < c + s; j++) {
            if (grid[i][j] !== 0) return false;
          }
        }
        return true;
      }

      function mark(r, c, s, v) {
        for (let i = r; i < r + s; i++) {
          for (let j = c; j < c + s; j++) {
            grid[i][j] = v;
          }
        }
      }

      const maxS2 = maxTile * maxTile;
      let stepsChecked = 0;

      function search(count, sol, covered) {
        if (stepsChecked > 4000) return; // 快速超时保护
        stepsChecked++;

        const remArea = N * N - covered;
        const minNeed = Math.ceil(remArea / maxS2);
        if (currentTiles.length + count + minNeed > maxLimit) return;

        const empty = getEmpty();
        if (!empty) {
          if (!bestRemaining || sol.length < bestRemaining.length) {
            bestRemaining = sol.slice();
          }
          return;
        }

        const { r, c } = empty;
        for (let s = Math.min(maxTile, N - r, N - c); s >= 1; s--) {
          if (canPlace(r, c, s)) {
            mark(r, c, s, 1);
            sol.push({ r, c, s });
            search(count + 1, sol, covered + s * s);
            sol.pop();
            mark(r, c, s, 0);
            if (bestRemaining && currentTiles.length + bestRemaining.length <= maxLimit) {
              return;
            }
          }
        }
      }

      search(0, [], initialArea);

      if (bestRemaining && bestRemaining.length > 0) {
        return { found: true, nextTile: bestRemaining[0] };
      }

      // 如果当前分支无法推至最优解，但匹配预设解
      if (preset && preset.solution) {
        // 尝试从预设解中找到一个当前完全未放置且不冲突的块
        for (const pt of preset.solution) {
          if (canPlace(pt.r, pt.c, pt.s)) {
            return { found: true, nextTile: pt, isPresetFallback: true };
          }
        }
      }

      return { found: false, reason: 'no_optimal_extension' };
    }
  }

  global.SquareMathEngine = new MathEngine();
})(window);
