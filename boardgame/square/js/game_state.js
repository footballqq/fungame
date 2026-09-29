// codex: 2026-09-29 支持双参数 getPreset(N, maxTile) 与极限防穿透保护，修复自定义关卡理论最少显示错误
(function (global) {
  'use strict';

  let nextTileId = 1;

  class GameState {
    constructor() {
      this.N = 10;
      this.maxTile = 4;
      this.tiles = []; // { id, r, c, s, colorIndex }
      this.undoStack = [];
      this.redoStack = [];
      this.isDemoPlaying = false;
      this.demoTimer = null;
    }

    initLevel(n, maxTile = 4) {
      this.stopDemo();
      this.N = n;
      this.maxTile = maxTile;
      this.tiles = [];
      this.undoStack = [];
      this.redoStack = [];
      nextTileId = 1;
      this.notifyUpdate();
    }

    getGridMatrix() {
      const grid = Array.from({ length: this.N }, () => new Array(this.N).fill(null));
      for (const t of this.tiles) {
        for (let i = t.r; i < t.r + t.s; i++) {
          for (let j = t.c; j < t.c + t.s; j++) {
            grid[i][j] = t;
          }
        }
      }
      return grid;
    }

    canPlace(r, c, s, excludeId = null) {
      if (r < 0 || c < 0 || r + s > this.N || c + s > this.N) {
        return false;
      }
      for (const t of this.tiles) {
        if (excludeId && t.id === excludeId) continue;
        // 矩形重叠判定：两个正方形不相交的充要条件
        if (!(r + s <= t.r || r >= t.r + t.s || c + s <= t.c || c >= t.c + t.s)) {
          return false;
        }
      }
      return true;
    }

    saveSnapshot() {
      const snapshot = this.tiles.map(t => ({ ...t }));
      this.undoStack.push(snapshot);
      if (this.undoStack.length > 50) this.undoStack.shift();
      this.redoStack = [];
    }

    placeTile(r, c, s, colorIndex = null) {
      if (!this.canPlace(r, c, s)) return null;

      this.saveSnapshot();
      const tile = {
        id: nextTileId++,
        r,
        c,
        s,
        colorIndex: colorIndex !== null ? colorIndex : s
      };
      this.tiles.push(tile);
      this.notifyUpdate();
      return tile;
    }

    removeTile(id) {
      const idx = this.tiles.findIndex(t => t.id === id);
      if (idx !== -1) {
        this.saveSnapshot();
        const removed = this.tiles.splice(idx, 1)[0];
        this.notifyUpdate();
        return removed;
      }
      return null;
    }

    moveTile(id, newR, newC) {
      const tile = this.tiles.find(t => t.id === id);
      if (!tile) return false;
      if (!this.canPlace(newR, newC, tile.s, id)) return false;

      this.saveSnapshot();
      tile.r = newR;
      tile.c = newC;
      this.notifyUpdate();
      return true;
    }

    clearBoard() {
      if (this.tiles.length === 0) return;
      this.saveSnapshot();
      this.tiles = [];
      this.notifyUpdate();
    }

    undo() {
      if (this.undoStack.length === 0) return false;
      this.redoStack.push(this.tiles.map(t => ({ ...t })));
      this.tiles = this.undoStack.pop();
      this.notifyUpdate();
      return true;
    }

    redo() {
      if (this.redoStack.length === 0) return false;
      this.undoStack.push(this.tiles.map(t => ({ ...t })));
      this.tiles = this.redoStack.pop();
      this.notifyUpdate();
      return true;
    }

    canUndo() {
      return this.undoStack.length > 0;
    }

    canRedo() {
      return this.redoStack.length > 0;
    }

    getMetrics() {
      const totalArea = this.N * this.N;
      let coveredArea = 0;
      for (const t of this.tiles) {
        coveredArea += t.s * t.s;
      }

      const preset = global.SquareMathEngine.getPreset(this.N, this.maxTile);
      let minOptimal = preset ? preset.minCount : Math.ceil(totalArea / (this.maxTile * this.maxTile));
      const isComplete = coveredArea === totalArea;
      if (isComplete && this.tiles.length < minOptimal) {
        minOptimal = this.tiles.length;
      }
      const isOptimal = isComplete && this.tiles.length <= minOptimal;

      let starRating = 0;
      if (isComplete) {
        if (this.tiles.length <= minOptimal) starRating = 3;
        else if (this.tiles.length <= minOptimal + 2) starRating = 2;
        else starRating = 1;
      }

      return {
        N: this.N,
        maxTile: this.maxTile,
        tileCount: this.tiles.length,
        coveredArea,
        totalArea,
        coveragePercent: Math.round((coveredArea / totalArea) * 100),
        minOptimal,
        isComplete,
        isOptimal,
        starRating
      };
    }

    saveBestRecord(tileCount) {
      const key = `square_best_${this.N}_${this.maxTile}`;
      const currentBest = parseInt(localStorage.getItem(key), 10);
      if (isNaN(currentBest) || tileCount < currentBest) {
        localStorage.setItem(key, tileCount.toString());
        return true;
      }
      return false;
    }

    getBestRecord() {
      const key = `square_best_${this.N}_${this.maxTile}`;
      const currentBest = parseInt(localStorage.getItem(key), 10);
      return isNaN(currentBest) ? null : currentBest;
    }

    startDemo(solution, onStep, onFinish) {
      this.stopDemo();
      this.initLevel(this.N, this.maxTile);
      this.isDemoPlaying = true;
      let step = 0;

      const runNext = () => {
        if (!this.isDemoPlaying) return;
        if (step >= solution.length) {
          this.isDemoPlaying = false;
          if (onFinish) onFinish();
          return;
        }

        const t = solution[step];
        this.placeTile(t.r, t.c, t.s);
        if (global.SquareAudio) global.SquareAudio.playDrop();
        if (onStep) onStep(step, solution.length);

        step++;
        this.demoTimer = setTimeout(runNext, 450);
      };

      runNext();
    }

    stopDemo() {
      if (this.demoTimer) {
        clearTimeout(this.demoTimer);
        this.demoTimer = null;
      }
      this.isDemoPlaying = false;
    }

    notifyUpdate() {
      window.dispatchEvent(new CustomEvent('gameStateChanged', { detail: this.getMetrics() }));
    }
  }

  global.SquareGameState = new GameState();
})(window);
