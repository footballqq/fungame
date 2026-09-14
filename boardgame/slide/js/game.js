// codex: 2026-09-14 实现滑冰棋核心状态机、滑冰移动、底座连通性检验、悔棋与铁三角胜利判定
/**
 * 滑冰棋核心游戏状态机模块
 */

import {
  HexCoord,
  HEX_DIRECTIONS,
  getInitialTilesSet,
  getInitialPiecesMap,
  isTilesConnected
} from './hex.js';

export const PLAYER_RED = 1;   // 红方
export const PLAYER_BLUE = 2;  // 蓝方

export const STEP_SLIDE = 1;       // 第一步：移动棋子
export const STEP_REMOVE_TILE = 2; // 第二步前半：选择要拿掉的最外圈底座
export const STEP_PLACE_TILE = 3;  // 第二步后半：选择拼入棋盘的新位置

export class IceSkatingGame {
  constructor(options = {}) {
    this.strictTriangleOnly = options.strictTriangleOnly !== undefined ? options.strictTriangleOnly : false;
    this.reset();
  }

  reset() {
    this.tiles = getInitialTilesSet(); // Set of string keys "q,r,s"
    const piecesMap = getInitialPiecesMap();
    this.pieces = {
      [PLAYER_RED]: piecesMap[1].map(p => new HexCoord(p.q, p.r, p.s)),
      [PLAYER_BLUE]: piecesMap[2].map(p => new HexCoord(p.q, p.r, p.s))
    };
    this.currentPlayer = PLAYER_RED;
    this.step = STEP_SLIDE;
    this.selectedPiece = null;          // 当前选中的己方棋子 HexCoord
    this.selectedTileToRemove = null;   // 当前选中的要搬移的底座 HexCoord
    this.winner = null;
    this.turnNumber = 1;
    this.pendingSlide = null;           // 当前回合已执行的滑行信息
    this.history = [];                  // 历史快照，用于悔棋
    this.redoStack = [];                // 用于重做
  }

  /**
   * 创建当前状态快照深拷贝
   */
  createSnapshot() {
    return {
      tiles: new Set(this.tiles),
      pieces: {
        [PLAYER_RED]: this.pieces[PLAYER_RED].map(p => new HexCoord(p.q, p.r, p.s)),
        [PLAYER_BLUE]: this.pieces[PLAYER_BLUE].map(p => new HexCoord(p.q, p.r, p.s))
      },
      currentPlayer: this.currentPlayer,
      step: this.step,
      selectedPiece: this.selectedPiece ? new HexCoord(this.selectedPiece.q, this.selectedPiece.r, this.selectedPiece.s) : null,
      selectedTileToRemove: this.selectedTileToRemove ? new HexCoord(this.selectedTileToRemove.q, this.selectedTileToRemove.r, this.selectedTileToRemove.s) : null,
      winner: this.winner,
      turnNumber: this.turnNumber,
      pendingSlide: this.pendingSlide ? { ...this.pendingSlide } : null
    };
  }

  /**
   * 从快照恢复状态
   */
  restoreSnapshot(snap) {
    this.tiles = new Set(snap.tiles);
    this.pieces = {
      [PLAYER_RED]: snap.pieces[PLAYER_RED].map(p => new HexCoord(p.q, p.r, p.s)),
      [PLAYER_BLUE]: snap.pieces[PLAYER_BLUE].map(p => new HexCoord(p.q, p.r, p.s))
    };
    this.currentPlayer = snap.currentPlayer;
    this.step = snap.step;
    this.selectedPiece = snap.selectedPiece ? new HexCoord(snap.selectedPiece.q, snap.selectedPiece.r, snap.selectedPiece.s) : null;
    this.selectedTileToRemove = snap.selectedTileToRemove ? new HexCoord(snap.selectedTileToRemove.q, snap.selectedTileToRemove.r, snap.selectedTileToRemove.s) : null;
    this.winner = snap.winner;
    this.turnNumber = snap.turnNumber;
    this.pendingSlide = snap.pendingSlide ? { ...snap.pendingSlide } : null;
  }

  /**
   * 保存当前回合开始前的状态到历史记录
   */
  saveTurnHistory() {
    this.history.push(this.createSnapshot());
    this.redoStack = [];
  }

  undo() {
    if (this.history.length === 0) return false;
    const currentSnap = this.createSnapshot();
    this.redoStack.push(currentSnap);
    const prevSnap = this.history.pop();
    this.restoreSnapshot(prevSnap);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    const currentSnap = this.createSnapshot();
    this.history.push(currentSnap);
    const nextSnap = this.redoStack.pop();
    this.restoreSnapshot(nextSnap);
    return true;
  }

  /**
   * 获取所有棋子停留的坐标 Key 集合
   */
  getOccupiedKeys() {
    const set = new Set();
    for (const p of this.pieces[PLAYER_RED]) set.add(p.key());
    for (const p of this.pieces[PLAYER_BLUE]) set.add(p.key());
    return set;
  }

  /**
   * 检查某位置是否有棋子
   */
  getPieceAt(coord) {
    const k = coord.key();
    for (const p of this.pieces[PLAYER_RED]) {
      if (p.key() === k) return { player: PLAYER_RED, coord: p };
    }
    for (const p of this.pieces[PLAYER_BLUE]) {
      if (p.key() === k) return { player: PLAYER_BLUE, coord: p };
    }
    return null;
  }

  /**
   * 计算从 start 沿方向 dirIndex 滑行后的最终着陆点
   * 碰到冰面边界或被棋子阻挡时停下
   */
  calculateSlideDestination(start, dirIndex) {
    const dir = HEX_DIRECTIONS[dirIndex];
    const occupied = this.getOccupiedKeys();
    let curr = start;
    let steps = 0;

    while (true) {
      const nxt = curr.add(dir);
      const nxtKey = nxt.key();
      // 下一格必须有底座且不能有任何棋子阻挡
      if (!this.tiles.has(nxtKey) || occupied.has(nxtKey)) {
        break;
      }
      curr = nxt;
      steps++;
    }

    return steps > 0 ? curr : null;
  }

  /**
   * 获取某棋子的所有有效滑行动作
   */
  getValidSlidesForPiece(pieceCoord) {
    const valid = [];
    for (let d = 0; d < 6; d++) {
      const dest = this.calculateSlideDestination(pieceCoord, d);
      if (dest) {
        valid.push({
          from: pieceCoord,
          to: dest,
          directionIndex: d
        });
      }
    }
    return valid;
  }

  /**
   * 获取当前玩家所有棋子的全部合法滑行动作
   */
  getAllValidSlides(player = this.currentPlayer) {
    const slides = [];
    for (const piece of this.pieces[player]) {
      slides.push(...this.getValidSlidesForPiece(piece));
    }
    return slides;
  }

  /**
   * 执行滑行
   */
  executeSlide(fromCoord, toCoord, dirIndex = -1) {
    if (this.step !== STEP_SLIDE) {
      throw new Error("当前不是移动棋子阶段");
    }
    const myPieces = this.pieces[this.currentPlayer];
    const pieceIdx = myPieces.findIndex(p => p.equals(fromCoord));
    if (pieceIdx === -1) {
      throw new Error("未选中己方有效棋子");
    }

    // 保存悔棋历史快照
    this.saveTurnHistory();

    myPieces[pieceIdx] = toCoord;
    this.pendingSlide = { from: fromCoord, to: toCoord, dirIndex };
    this.selectedPiece = null;
    this.step = STEP_REMOVE_TILE;
  }

  /**
   * 获取所有可以拿掉的最外圈空底座
   */
  getRemovableTiles() {
    const occupied = this.getOccupiedKeys();
    const removable = [];

    for (const tileKey of this.tiles) {
      // 1. 底座上不能有棋子
      if (occupied.has(tileKey)) continue;

      const coord = HexCoord.fromKey(tileKey);
      let neighborCount = 0;
      for (const n of coord.neighbors()) {
        if (this.tiles.has(n.key())) neighborCount++;
      }

      // 2. 必须位于最外圈（邻居数 < 6）
      if (neighborCount === 6) continue;

      // 3. 移除后剩余 18 个底座必须全连通
      const remainingTiles = new Set(this.tiles);
      remainingTiles.delete(tileKey);
      if (isTilesConnected(remainingTiles)) {
        removable.push(coord);
      }
    }

    return removable;
  }

  /**
   * 选择要拿掉的底座
   */
  selectTileToRemove(coord) {
    if (this.step !== STEP_REMOVE_TILE) {
      throw new Error("当前不是选择移除底座阶段");
    }
    const removables = this.getRemovableTiles();
    const isRemovable = removables.some(c => c.equals(coord));
    if (!isRemovable) {
      throw new Error("该底座不可移除");
    }
    this.selectedTileToRemove = coord;
    this.step = STEP_PLACE_TILE;
  }

  /**
   * 取消选中的待移除底座，退回 STEP_REMOVE_TILE
   */
  unselectTileToRemove() {
    if (this.step === STEP_PLACE_TILE) {
      this.selectedTileToRemove = null;
      this.step = STEP_REMOVE_TILE;
    }
  }

  /**
   * 当移走 removedCoord 底座后，获取可以拼入的新坐标列表
   */
  getValidPlacements(removedCoord = this.selectedTileToRemove) {
    if (!removedCoord) return [];
    const remaining = new Set(this.tiles);
    remaining.delete(removedCoord.key());

    const candidateKeys = new Set();
    for (const tKey of remaining) {
      const coord = HexCoord.fromKey(tKey);
      for (const n of coord.neighbors()) {
        const nKey = n.key();
        if (!remaining.has(nKey) && nKey !== removedCoord.key()) {
          candidateKeys.add(nKey);
        }
      }
    }

    const validPlacements = [];
    for (const cKey of candidateKeys) {
      const cand = HexCoord.fromKey(cKey);
      let adjCount = 0;
      for (const n of cand.neighbors()) {
        if (remaining.has(n.key())) adjCount++;
      }
      // 新位置至少与现有的 2 个底座边相邻
      if (adjCount >= 2) {
        validPlacements.push(cand);
      }
    }

    return validPlacements;
  }

  /**
   * 执行拼入新底座，完成回合并判定胜负
   */
  executeTilePlacement(newCoord) {
    if (this.step !== STEP_PLACE_TILE || !this.selectedTileToRemove) {
      throw new Error("当前不是放置新底座阶段");
    }

    const validPlacements = this.getValidPlacements(this.selectedTileToRemove);
    const isValid = validPlacements.some(c => c.equals(newCoord));
    if (!isValid) {
      throw new Error("目标放置位置不合法");
    }

    // 移除旧底座，添加新底座
    this.tiles.delete(this.selectedTileToRemove.key());
    this.tiles.add(newCoord.key());

    const tileMoveRecord = {
      from: this.selectedTileToRemove,
      to: newCoord
    };

    // 检查胜利条件
    this.checkWinCondition();

    // 完成回合清理
    this.selectedTileToRemove = null;
    this.pendingSlide = null;
    this.step = STEP_SLIDE;
    this.selectedPiece = null;

    if (!this.winner) {
      this.currentPlayer = this.currentPlayer === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED;
      if (this.currentPlayer === PLAYER_RED) {
        this.turnNumber++;
      }
    }

    return tileMoveRecord;
  }

  /**
   * 检查指定玩家是否完成铁三角
   */
  checkPlayerTriangle(player) {
    const pieces = this.pieces[player];
    if (pieces.length !== 3) return false;

    const [p0, p1, p2] = pieces;
    const d01 = p0.distanceTo(p1) === 1;
    const d12 = p1.distanceTo(p2) === 1;
    const d20 = p2.distanceTo(p0) === 1;

    if (this.strictTriangleOnly) {
      // 严格铁三角：三子两两互邻（正三角形）
      return d01 && d12 && d20;
    } else {
      // 连通块：三子相连
      const adjCount = (d01 ? 1 : 0) + (d12 ? 1 : 0) + (d20 ? 1 : 0);
      return adjCount >= 2;
    }
  }

  /**
   * 检查胜负判定
   */
  checkWinCondition() {
    const active = this.currentPlayer;
    const opp = active === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED;

    if (this.checkPlayerTriangle(active)) {
      this.winner = active;
      return this.winner;
    }
    if (this.checkPlayerTriangle(opp)) {
      this.winner = opp;
      return this.winner;
    }
    return null;
  }
}
