// codex: 2026-09-14 实现前端 AI 决策引擎，支持简单、中等、困难三档难度及 Minimax 启发式搜索
/**
 * 滑冰棋 AI 决策引擎模块
 */

import { HexCoord } from './hex.js';
import { PLAYER_RED, PLAYER_BLUE } from './game.js';

export class IceSkatingAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty; // 'easy' | 'medium' | 'hard'
  }

  /**
   * 局面启发式评估函数
   */
  evaluate(game, player) {
    const opp = player === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED;

    // 终局胜负
    if (game.checkPlayerTriangle(player)) return 100000;
    if (game.checkPlayerTriangle(opp)) return -100000;

    const myPieces = game.pieces[player];
    const oppPieces = game.pieces[opp];

    // 己方距离与邻接
    const d01 = myPieces[0].distanceTo(myPieces[1]);
    const d12 = myPieces[1].distanceTo(myPieces[2]);
    const d20 = myPieces[2].distanceTo(myPieces[0]);
    const myDistSum = d01 + d12 + d20;
    const myAdj = (d01 === 1 ? 1 : 0) + (d12 === 1 ? 1 : 0) + (d20 === 1 ? 1 : 0);

    // 对手距离与邻接
    const od01 = oppPieces[0].distanceTo(oppPieces[1]);
    const od12 = oppPieces[1].distanceTo(oppPieces[2]);
    const od20 = oppPieces[2].distanceTo(oppPieces[0]);
    const oppDistSum = od01 + od12 + od20;
    const oppAdj = (od01 === 1 ? 1 : 0) + (od12 === 1 ? 1 : 0) + (od20 === 1 ? 1 : 0);

    let score = 0;
    // 距离分数（总距离越小越好）
    score += (18 - myDistSum) * 40;
    score -= (18 - oppDistSum) * 45;

    // 相邻对加分
    score += myAdj * 160;
    score -= oppAdj * 220; // 重点防守对手

    if (myAdj === 2) score += 600;
    if (oppAdj === 2) score -= 800;

    return score;
  }

  /**
   * 异步规划最佳行动（避免阻塞浏览器渲染）
   */
  async getBestTurnAsync(game) {
    return new Promise(resolve => {
      setTimeout(() => {
        const turn = this.findBestTurn(game);
        resolve(turn);
      }, 400); // 增加 400ms 自然思考停顿感
    });
  }

  findBestTurn(game) {
    const player = game.currentPlayer;
    const validSlides = game.getAllValidSlides(player);
    if (validSlides.length === 0) return null;

    if (this.difficulty === 'easy') {
      return this.findEasyTurn(game, validSlides);
    } else if (this.difficulty === 'medium') {
      return this.findMediumTurn(game, validSlides);
    } else {
      return this.findHardTurn(game, validSlides);
    }
  }

  findEasyTurn(game, validSlides) {
    // 简单：随机选择滑行，优先靠近其他棋子
    const shuffledSlides = [...validSlides].sort(() => Math.random() - 0.5);
    const chosenSlide = shuffledSlides[0];

    // 模拟滑行
    const snap = game.createSnapshot();
    const myPieces = game.pieces[game.currentPlayer];
    const pIdx = myPieces.findIndex(p => p.equals(chosenSlide.from));
    myPieces[pIdx] = chosenSlide.to;

    const removables = game.getRemovableTiles();
    if (removables.length === 0) {
      game.restoreSnapshot(snap);
      return null;
    }
    const chosenRemovable = removables[Math.floor(Math.random() * removables.length)];
    const placements = game.getValidPlacements(chosenRemovable);
    game.restoreSnapshot(snap);

    if (placements.length === 0) return null;
    const chosenPlacement = placements[Math.floor(Math.random() * placements.length)];

    return {
      slide: chosenSlide,
      tileRemove: chosenRemovable,
      tilePlace: chosenPlacement
    };
  }

  findMediumTurn(game, validSlides) {
    const player = game.currentPlayer;
    let bestAction = null;
    let bestScore = -Infinity;

    for (const slide of validSlides) {
      const snap = game.createSnapshot();
      const myPieces = game.pieces[player];
      const pIdx = myPieces.findIndex(p => p.equals(slide.from));
      myPieces[pIdx] = slide.to;

      const removables = game.getRemovableTiles();
      for (const remTile of removables) {
        const placements = game.getValidPlacements(remTile);
        for (const placeTile of placements) {
          game.tiles.delete(remTile.key());
          game.tiles.add(placeTile.key());

          if (game.checkPlayerTriangle(player)) {
            game.restoreSnapshot(snap);
            return { slide, tileRemove: remTile, tilePlace: placeTile };
          }

          const score = this.evaluate(game, player) + (Math.random() * 2);
          if (score > bestScore) {
            bestScore = score;
            bestAction = { slide, tileRemove: remTile, tilePlace: placeTile };
          }

          game.tiles.delete(placeTile.key());
          game.tiles.add(remTile.key());
        }
      }
      game.restoreSnapshot(snap);
    }

    return bestAction || this.findEasyTurn(game, validSlides);
  }

  findHardTurn(game, validSlides) {
    const player = game.currentPlayer;
    const opp = player === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED;
    let bestAction = null;
    let bestScore = -Infinity;

    // 1. 完整收集所有合法的完整回合动作
    const candidateActions = [];
    for (const slide of validSlides) {
      const snap = game.createSnapshot();
      const myPieces = game.pieces[player];
      const pIdx = myPieces.findIndex(p => p.equals(slide.from));
      myPieces[pIdx] = slide.to;

      if (game.checkPlayerTriangle(player)) {
        // 如果移动一步就能赢，直接返回（随意移除放置一块即可）
        const remTile = game.getRemovableTiles()[0];
        const placeTile = game.getValidPlacements(remTile)[0];
        game.restoreSnapshot(snap);
        return { slide, tileRemove: remTile, tilePlace: placeTile };
      }

      const removables = game.getRemovableTiles();
      for (const remTile of removables) {
        const placements = game.getValidPlacements(remTile);
        for (const placeTile of placements) {
          game.tiles.delete(remTile.key());
          game.tiles.add(placeTile.key());

          const baseScore = this.evaluate(game, player);
          candidateActions.push({ slide, tileRemove: remTile, tilePlace: placeTile, baseScore });

          game.tiles.delete(placeTile.key());
          game.tiles.add(remTile.key());
        }
      }
      game.restoreSnapshot(snap);
    }

    if (candidateActions.length === 0) return this.findMediumTurn(game, validSlides);

    // 2. 根据 baseScore 排序，选出前 15 种最有可能的好棋，进行深度搜索 (Minimax - 1 层对手应对)
    candidateActions.sort((a, b) => b.baseScore - a.baseScore);
    const topCandidates = candidateActions.slice(0, 15);

    for (const cand of topCandidates) {
      const snap = game.createSnapshot();
      // 模拟我方动作
      const myPieces = game.pieces[player];
      const pIdx = myPieces.findIndex(p => p.equals(cand.slide.from));
      myPieces[pIdx] = cand.slide.to;
      game.tiles.delete(cand.tileRemove.key());
      game.tiles.add(cand.tilePlace.key());

      // 模拟对手最强反击（仅考察滑行+部分最优移除/放置）
      const oppSlides = game.getAllValidSlides(opp);
      let oppBestScore = -Infinity;

      for (const oSlide of oppSlides) {
        const oppSnap = game.createSnapshot();
        const oPieces = game.pieces[opp];
        const oIdx = oPieces.findIndex(p => p.equals(oSlide.from));
        oPieces[oIdx] = oSlide.to;

        if (game.checkPlayerTriangle(opp)) {
          oppBestScore = 100000;
          game.restoreSnapshot(oppSnap);
          break;
        }

        // 简化对手的底座策略，只取距离己方最近的移除和放置
        const oRemovables = game.getRemovableTiles();
        if (oRemovables.length > 0) {
          const oRemTile = oRemovables[0];
          const oPlacements = game.getValidPlacements(oRemTile);
          if (oPlacements.length > 0) {
            game.tiles.delete(oRemTile.key());
            game.tiles.add(oPlacements[0].key());
          }
        }
        
        const oScore = this.evaluate(game, opp);
        if (oScore > oppBestScore) {
          oppBestScore = oScore;
        }
        
        game.restoreSnapshot(oppSnap);
      }

      // 净得分 = 己方走完的分数 - 对方能打出的最强反击分数
      const netScore = cand.baseScore - oppBestScore;
      
      if (netScore > bestScore) {
        bestScore = netScore;
        bestAction = { slide: cand.slide, tileRemove: cand.tileRemove, tilePlace: cand.tilePlace };
      }
      
      game.restoreSnapshot(snap);
    }

    return bestAction || topCandidates[0];
  }
}
