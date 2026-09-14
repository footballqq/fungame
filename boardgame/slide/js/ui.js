// codex: 2026-09-14 优化 UI 管理器，增加目标底座直击滑行、背景取消选中与查看终局功能，保持单文件精炼
import { HexCoord } from './hex.js';
import { PLAYER_RED, PLAYER_BLUE, STEP_SLIDE, STEP_REMOVE_TILE, STEP_PLACE_TILE } from './game.js';

export class UIManager {
  constructor(game, ai, audio) {
    this.game = game;
    this.ai = ai;
    this.audio = audio;
    this.hexSize = 44;
    this.gameMode = 'pve_p1'; // 'pvp' | 'pve_p1' | 'pve_p2' | 'eve'
    this.isAiThinking = false;
    this.showCoords = false;
    this.zoomScale = 1.0;
    this.panOffsetX = 0;
    this.panOffsetY = 0;

    // DOM 元素
    this.svg = document.getElementById('board-svg');
    this.tilesLayer = document.getElementById('layer-tiles');
    this.indicatorsLayer = document.getElementById('layer-indicators');
    this.piecesLayer = document.getElementById('layer-pieces');
    this.fxLayer = document.getElementById('layer-fx');
    this.turnBanner = document.getElementById('turn-banner');
    this.turnStepDesc = document.getElementById('turn-step-desc');
    this.modalRules = document.getElementById('modal-rules');
    this.modalWin = document.getElementById('modal-win');
    this.winTitle = document.getElementById('win-title');
    this.winDesc = document.getElementById('win-desc');

    this.initEventListeners();
    this.render();
  }

  initEventListeners() {
    document.getElementById('btn-new-game')?.addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-undo')?.addEventListener('click', () => this.handleUndo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.handleRedo());
    document.getElementById('btn-rules')?.addEventListener('click', () => this.showRules(true));
    document.getElementById('btn-close-rules')?.addEventListener('click', () => this.showRules(false));
    document.getElementById('btn-win-restart')?.addEventListener('click', () => {
      this.showWinModal(false);
      this.startNewGame();
    });
    document.getElementById('btn-win-close')?.addEventListener('click', () => this.showWinModal(false));
    document.getElementById('btn-toggle-sound')?.addEventListener('click', (e) => {
      const enabled = this.audio.toggleSound();
      e.currentTarget.textContent = enabled ? '🔊 音效: 开' : '🔇 音效: 关';
    });
    document.getElementById('select-mode')?.addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      this.startNewGame();
    });
    document.getElementById('select-diff')?.addEventListener('change', (e) => {
      this.ai.difficulty = e.target.value;
    });
    document.getElementById('select-win-rule')?.addEventListener('change', (e) => {
      this.game.strictTriangleOnly = e.target.value === 'triangle';
      this.render();
    });
    document.getElementById('check-coords')?.addEventListener('change', (e) => {
      this.showCoords = e.target.checked;
      this.render();
    });
    document.getElementById('range-zoom')?.addEventListener('input', (e) => {
      this.zoomScale = parseFloat(e.target.value);
      this.updateViewBox();
    });
    document.getElementById('select-style')?.addEventListener('change', (e) => {
      if (e.target.value === '2d') {
        document.body.classList.add('theme-2d');
      } else {
        document.body.classList.remove('theme-2d');
      }
    });

    const logPanel = document.getElementById('log-panel');
    document.getElementById('btn-toggle-log')?.addEventListener('click', () => {
      if (logPanel) logPanel.style.display = logPanel.style.display === 'none' ? 'flex' : 'none';
    });
    document.getElementById('btn-hide-log')?.addEventListener('click', () => {
      if (logPanel) logPanel.style.display = 'none';
    });
    document.getElementById('btn-copy-log')?.addEventListener('click', () => {
      if (!this.logContainer) return;
      const text = Array.from(this.logContainer.children).map(el => el.textContent).join('\n');
      navigator.clipboard.writeText(text).then(() => alert('对局记录已复制到剪贴板！')).catch(e => alert('复制失败: ' + e));
    });

    // SVG 拖拽平移逻辑
    let isDragging = false;
    let startX = 0, startY = 0;
    this.svg?.addEventListener('mousedown', (e) => {
      if (e.target === this.svg || e.target.tagName === 'polygon' && e.target.classList.contains('hex-tile-inner')) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        this.svg.style.cursor = 'grabbing';
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const rect = this.svg.getBoundingClientRect();
      const viewBoxStr = this.svg.getAttribute('viewBox');
      if (!viewBoxStr) return;
      const w = parseFloat(viewBoxStr.split(' ')[2]);
      const scale = w / rect.width;

      this.panOffsetX -= (e.clientX - startX) * scale;
      this.panOffsetY -= (e.clientY - startY) * scale;
      startX = e.clientX;
      startY = e.clientY;
      this.updateViewBox();
    });
    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        if (this.svg) this.svg.style.cursor = 'default';
      }
    });

    this.svg?.addEventListener('click', (e) => {
      if (e.target === this.svg && this.game.step === STEP_SLIDE && this.game.selectedPiece) {
        this.game.selectedPiece = null;
        this.render();
      }
    });
  }

  startNewGame() {
    this.game.reset();
    this.showWinModal(false);
    
    // 重置缩放和平移
    this.panOffsetX = 0;
    this.panOffsetY = 0;
    this.zoomScale = 1.0;
    const zoomSlider = document.getElementById('range-zoom');
    if (zoomSlider) zoomSlider.value = 1.0;

    if (!this.logContainer) {
      this.logContainer = document.getElementById('log-content');
    }
    if (this.logContainer) {
      this.logContainer.innerHTML = '';
    }
    
    this.log('--- 新对局开始 ---');
    this.render();
    this.audio.playSelect();
    this.checkAndTriggerAI();
  }

  handleUndo() {
    if (this.isAiThinking) return;
    if (this.gameMode === 'pve_p1' || this.gameMode === 'pve_p2') {
      this.game.undo();
      this.game.undo();
    } else {
      this.game.undo();
    }
    this.audio.playSelect();
    this.render();
  }

  handleRedo() {
    if (this.isAiThinking) return;
    if (this.gameMode === 'pve_p1' || this.gameMode === 'pve_p2') {
      this.game.redo();
      this.game.redo();
    } else {
      this.game.redo();
    }
    this.audio.playSelect();
    this.render();
  }

  showRules(show) {
    if (this.modalRules) this.modalRules.style.display = show ? 'flex' : 'none';
  }

  showWinModal(show, winner) {
    if (!this.modalWin) return;
    if (show) {
      const winnerName = winner === PLAYER_RED ? '红方（炽红）' : '蓝方（冰蓝）';
      this.winTitle.textContent = `🎉 恭喜 ${winnerName} 获胜！`;
      this.winDesc.textContent = `率先让己方 3 枚棋子组成彼此相邻的铁三角！`;
      this.modalWin.style.display = 'flex';
      this.audio.playVictory();
    } else {
      this.modalWin.style.display = 'none';
    }
  }

  updateViewBox() {
    // 【终极锁定】绝对写死基础画布大小，彻底关闭所有自适应边界计算！
    // 永远不会在回合切换、AI移动、底板放置时自动放大、缩小或平移！
    const baseW = 500;
    const baseH = 500;
    
    // 应用用户手动拖动的缩放系数
    const w = baseW / (this.zoomScale || 1.0);
    const h = baseH / (this.zoomScale || 1.0);

    // 永远将棋盘初始中心 (0,0) 绑定到 500x500 画布的绝对正中央
    this.originX = baseW / 2;
    this.originY = baseH / 2;

    // 计算为了保持原点居中，视口应当偏移的补偿量，再加上鼠标拖拽的偏移
    const vx = (baseW - w) / 2 + this.panOffsetX;
    const vy = (baseH - h) / 2 + this.panOffsetY;
    
    this.svg.setAttribute('viewBox', `${vx} ${vy} ${w} ${h}`);
  }

  render() {
    this.updateViewBox();
    this.renderTiles();
    this.renderIndicators();
    this.renderPieces();
    this.renderVictoryLines();
    this.updateStatusBanner();
    this.updateButtons();
  }

  renderTiles() {
    this.tilesLayer.innerHTML = '';
    const removables = this.game.step === STEP_REMOVE_TILE ? this.game.getRemovableTiles() : [];
    const remKeys = new Set(removables.map(r => r.key()));

    for (const tKey of this.game.tiles) {
      const coord = HexCoord.fromKey(tKey);
      const isSelectedLift = this.game.selectedTileToRemove && this.game.selectedTileToRemove.equals(coord);
      const isRemovable = remKeys.has(tKey);

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `hex-tile ${isRemovable ? 'tile-removable' : ''} ${isSelectedLift ? 'tile-selected-lift' : ''}`);

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', coord.getPolygonPoints(this.hexSize, this.originX, this.originY));
      g.appendChild(polygon);

      const innerPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      innerPoly.setAttribute('points', coord.getPolygonPoints(this.hexSize * 0.82, this.originX, this.originY));
      innerPoly.setAttribute('class', 'hex-tile-inner');
      g.appendChild(innerPoly);

      if (this.showCoords) {
        const center = coord.toPixel(this.hexSize, this.originX, this.originY);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', center.x);
        text.setAttribute('y', center.y + 4);
        text.setAttribute('class', 'hex-coord-label');
        text.textContent = `${coord.q},${coord.r}`;
        g.appendChild(text);
      }

      g.addEventListener('click', () => this.onTileClick(coord));
      this.tilesLayer.appendChild(g);
    }
  }

  renderIndicators() {
    this.indicatorsLayer.innerHTML = '';

    if (this.game.step === STEP_SLIDE && this.game.selectedPiece) {
      const validSlides = this.game.getValidSlidesForPiece(this.game.selectedPiece);
      const startPt = this.game.selectedPiece.toPixel(this.hexSize, this.originX, this.originY);

      for (const slide of validSlides) {
        const destPt = slide.to.toPixel(this.hexSize, this.originX, this.originY);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startPt.x);
        line.setAttribute('y1', startPt.y);
        line.setAttribute('x2', destPt.x);
        line.setAttribute('y2', destPt.y);
        line.setAttribute('class', 'slide-trail-line');
        this.indicatorsLayer.appendChild(line);

        const targetG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        targetG.setAttribute('class', 'slide-target-marker');
        targetG.setAttribute('transform', `translate(${destPt.x}, ${destPt.y})`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', this.hexSize * 0.44);
        targetG.appendChild(circle);

        targetG.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onSlideTargetClick(slide.to, slide.directionIndex);
        });
        this.indicatorsLayer.appendChild(targetG);
      }
    }

    if (this.game.step === STEP_PLACE_TILE && this.game.selectedTileToRemove) {
      const placements = this.game.getValidPlacements(this.game.selectedTileToRemove);
      for (const cand of placements) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'placement-target-marker');

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', cand.getPolygonPoints(this.hexSize * 0.94, this.originX, this.originY));
        g.appendChild(polygon);

        const center = cand.toPixel(this.hexSize, this.originX, this.originY);
        const plusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        plusText.setAttribute('x', center.x);
        plusText.setAttribute('y', center.y + 6);
        plusText.setAttribute('class', 'placement-plus');
        plusText.textContent = '＋';
        g.appendChild(plusText);

        g.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onPlacementClick(cand);
        });
        this.indicatorsLayer.appendChild(g);
      }
    }
  }

  renderPieces() {
    const isHuman = this.isCurrentPlayerHuman();

    for (const player of [PLAYER_RED, PLAYER_BLUE]) {
      const isCurrent = this.game.currentPlayer === player;
      let index = 0;
      for (const pieceCoord of this.game.pieces[player]) {
        const pt = pieceCoord.toPixel(this.hexSize, this.originX, this.originY);
        const isSelected = this.game.selectedPiece && this.game.selectedPiece.equals(pieceCoord);
        const id = `dom-piece-${player}-${index}`;
        
        let g = document.getElementById(id);
        if (!g) {
          g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('id', id);
          
          const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
          shadow.setAttribute('cx', 0);
          shadow.setAttribute('cy', 5);
          shadow.setAttribute('rx', this.hexSize * 0.42);
          shadow.setAttribute('ry', this.hexSize * 0.28);
          shadow.setAttribute('class', 'piece-shadow');
          g.appendChild(shadow);

          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', 0);
          circle.setAttribute('cy', 0);
          circle.setAttribute('r', this.hexSize * 0.38);
          circle.setAttribute('class', 'piece-body');
          g.appendChild(circle);

          const glint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          glint.setAttribute('cx', -this.hexSize * 0.12);
          glint.setAttribute('cy', -this.hexSize * 0.12);
          glint.setAttribute('r', this.hexSize * 0.12);
          glint.setAttribute('class', 'piece-glint');
          g.appendChild(glint);

          this.piecesLayer.appendChild(g);
        }

        g.setAttribute('class', `chess-piece piece-p${player} ${isSelected ? 'piece-selected' : ''} ${isCurrent && this.game.step === STEP_SLIDE && isHuman ? 'piece-movable' : ''}`);
        g.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);

        // Update click listener, we overwrite it by using a simple property to avoid duplicate listeners
        g.onclick = (e) => {
          e.stopPropagation();
          this.onPieceClick(pieceCoord, player);
        };
        index++;
      }
    }
  }

  renderVictoryLines() {
    this.fxLayer.innerHTML = '';
    if (this.game.winner) {
      const pieces = this.game.pieces[this.game.winner];
      const pts = pieces.map(p => p.toPixel(this.hexSize, this.originX, this.originY));
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', pts.map(pt => `${pt.x},${pt.y}`).join(' '));
      poly.setAttribute('class', 'victory-triangle-fx');
      this.fxLayer.appendChild(poly);
    }
  }

  updateStatusBanner() {
    const isHuman = this.isCurrentPlayerHuman();
    const pName = this.game.currentPlayer === PLAYER_RED ? '红方（炽红）' : '蓝方（冰蓝）';
    const pClass = this.game.currentPlayer === PLAYER_RED ? 'text-red' : 'text-blue';

    if (this.game.winner) {
      const wName = this.game.winner === PLAYER_RED ? '红方' : '蓝方';
      this.turnBanner.innerHTML = `🏆 <span class="${this.game.winner === PLAYER_RED ? 'text-red' : 'text-blue'}">${wName} 胜利！</span> 达成铁三角！`;
      this.turnStepDesc.textContent = '对局结束，点击“新游戏”可重新开始。';
      return;
    }
    if (this.isAiThinking) {
      this.turnBanner.innerHTML = `🤖 <span class="${pClass}">${pName} (AI)</span> 思考中...`;
      this.turnStepDesc.textContent = 'AI 正在计算最佳滑行路径与底座重组...';
      return;
    }
    if (this.game.step === STEP_SLIDE) {
      this.turnBanner.innerHTML = `🏒 <span class="${pClass}">${pName}</span> 回合`;
      this.turnStepDesc.textContent = isHuman ? '【第 1 步】请点击己方一枚棋子，然后点击滑行目的地。' : '正在等待 AI 滑行...';
    } else if (this.game.step === STEP_REMOVE_TILE) {
      this.turnBanner.innerHTML = `🧊 <span class="${pClass}">${pName}</span> 搬移底座`;
      this.turnStepDesc.textContent = isHuman ? '【第 2 步】滑行完成！请点击金色高亮的最外圈空底座将其取下。' : '正在搬移底座...';
    } else if (this.game.step === STEP_PLACE_TILE) {
      this.turnBanner.innerHTML = `🧩 <span class="${pClass}">${pName}</span> 重构棋盘`;
      this.turnStepDesc.textContent = isHuman ? '【第 2 步】底座已取下！请点击“＋”候选位置将其拼入棋盘。' : '正在重新拼入底座...';
    }
  }

  updateButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.disabled = this.game.history.length === 0 || this.isAiThinking;
    if (btnRedo) btnRedo.disabled = this.game.redoStack.length === 0 || this.isAiThinking;
  }

  isCurrentPlayerHuman() {
    if (this.gameMode === 'pvp') return true;
    if (this.gameMode === 'pve_p1') return this.game.currentPlayer === PLAYER_RED;
    if (this.gameMode === 'pve_p2') return this.game.currentPlayer === PLAYER_BLUE;
    return false;
  }

  onPieceClick(coord, piecePlayer) {
    if (this.isAiThinking || this.game.winner || !this.isCurrentPlayerHuman()) return;
    if (this.game.step === STEP_SLIDE && piecePlayer === this.game.currentPlayer) {
      if (this.game.selectedPiece && this.game.selectedPiece.equals(coord)) {
        this.game.selectedPiece = null;
      } else {
        this.game.selectedPiece = coord;
        this.audio.playSelect();
      }
      this.render();
    }
  }

  log(msg) {
    if (!this.logContainer) {
      this.logContainer = document.getElementById('log-content');
    }
    if (this.logContainer) {
      const p = document.createElement('div');
      p.className = 'log-item';
      p.textContent = msg;
      this.logContainer.appendChild(p);
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
  }

  onSlideTargetClick(destCoord, dirIndex) {
    if (this.isAiThinking || this.game.winner || !this.isCurrentPlayerHuman() || this.game.step !== STEP_SLIDE) return;
    if (!this.game.selectedPiece) return;
    const from = this.game.selectedPiece;
    const pName = this.game.currentPlayer === PLAYER_RED ? '红方' : '蓝方';
    this.log(`${pName}(滑行): 棋子从 (${from.q},${from.r}) 滑向 (${destCoord.q},${destCoord.r})`);
    
    this.game.executeSlide(this.game.selectedPiece, destCoord, dirIndex);
    this.audio.playSlide();
    this.render();
  }

  onTileClick(coord) {
    if (this.isAiThinking || this.game.winner || !this.isCurrentPlayerHuman()) return;
    if (this.game.step === STEP_SLIDE) {
      if (this.game.selectedPiece) {
        const slides = this.game.getValidSlidesForPiece(this.game.selectedPiece);
        const match = slides.find(s => s.to.equals(coord));
        if (match) {
          this.onSlideTargetClick(match.to, match.directionIndex);
          return;
        }
        this.game.selectedPiece = null;
        this.render();
      }
    } else if (this.game.step === STEP_REMOVE_TILE) {
      const removables = this.game.getRemovableTiles();
      if (removables.some(c => c.equals(coord))) {
        const pName = this.game.currentPlayer === PLAYER_RED ? '红方' : '蓝方';
        this.log(`${pName}(移除): 移除底板 (${coord.q},${coord.r})`);
        
        this.game.selectTileToRemove(coord);
        this.audio.playTileLift();
        this.render();
      }
    } else if (this.game.step === STEP_PLACE_TILE) {
      if (this.game.selectedTileToRemove && this.game.selectedTileToRemove.equals(coord)) {
        this.game.unselectTileToRemove();
        this.render();
      }
    }
  }

  onPlacementClick(coord) {
    if (this.isAiThinking || this.game.winner || !this.isCurrentPlayerHuman() || this.game.step !== STEP_PLACE_TILE) return;
    const pName = this.game.currentPlayer === PLAYER_RED ? '红方' : '蓝方';
    this.log(`${pName}(放置): 放置底板 (${coord.q},${coord.r})`);
    
    this.game.executeTilePlacement(coord);
    this.audio.playTileDrop();
    this.render();

    if (this.game.winner) {
      this.showWinModal(true, this.game.winner);
    } else {
      this.checkAndTriggerAI();
    }
  }

  async checkAndTriggerAI() {
    if (this.game.winner || this.isCurrentPlayerHuman()) return;
    this.isAiThinking = true;
    this.render();

    try {
      const action = await this.ai.getBestTurnAsync(this.game);
      if (action && !this.game.winner) {
        const pName = this.game.currentPlayer === PLAYER_RED ? '电脑(红方)' : '电脑(蓝方)';
        this.log(`${pName}(滑行): 棋子从 (${action.slide.from.q},${action.slide.from.r}) 滑向 (${action.slide.to.q},${action.slide.to.r})`);
        this.game.executeSlide(action.slide.from, action.slide.to, action.slide.directionIndex);
        this.audio.playSlide();
        this.render();

        await new Promise(r => setTimeout(r, 800));
        this.log(`${pName}(移除): 移除底板 (${action.tileRemove.q},${action.tileRemove.r})`);
        this.game.selectTileToRemove(action.tileRemove);
        this.audio.playTileLift();
        this.render();

        await new Promise(r => setTimeout(r, 800));
        this.log(`${pName}(放置): 放置底板 (${action.tilePlace.q},${action.tilePlace.r})`);
        this.game.executeTilePlacement(action.tilePlace);
        this.audio.playTileDrop();
        this.render();

        if (this.game.winner) {
          this.showWinModal(true, this.game.winner);
        } else if (!this.isCurrentPlayerHuman()) {
          setTimeout(() => this.checkAndTriggerAI(), 300);
        }
      }
    } finally {
      this.isAiThinking = false;
      this.render();
    }
  }
}
