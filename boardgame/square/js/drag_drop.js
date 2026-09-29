// codex: 2026-09-29 drag_drop.js 统一跨平台拖拽与点选触控交互引擎
(function (global) {
  'use strict';

  class DragDropEngine {
    constructor() {
      this.boardEl = null;
      this.ghostEl = null;
      this.trashEl = null;
      this.floatingDragEl = null;

      // 状态
      this.selectedTraySize = null;
      this.isDragging = false;
      this.dragSource = null; // 'tray' | 'board'
      this.dragTileData = null; // { s, id?, colorIndex }
      this.startPos = { x: 0, y: 0 };
      this.currentGridPos = null; // { r, c }
      this.isValidPlacement = false;
    }

    init(boardEl, ghostEl, trashEl) {
      this.boardEl = boardEl;
      this.ghostEl = ghostEl;
      this.trashEl = trashEl;

      this.bindTrayEvents();
      this.bindBoardEvents();
      this.bindGlobalPointerEvents();
    }

    bindTrayEvents() {
      const trayItems = document.querySelectorAll('.tray-item');
      trayItems.forEach(item => {
        // Pointer down 启动拖拽
        item.addEventListener('pointerdown', (e) => this.onTrayPointerDown(e, item));

        // 点击切换选中状态（手机端点选-放置模式）
        item.addEventListener('click', (e) => {
          if (this.isDragging) return;
          const s = parseInt(item.getAttribute('data-size'), 10);
          this.toggleSelectTrayItem(s, item);
        });
      });
    }

    toggleSelectTrayItem(size, itemEl) {
      if (this.selectedTraySize === size) {
        this.clearSelectedTrayItem();
      } else {
        this.clearSelectedTrayItem();
        this.selectedTraySize = size;
        itemEl.classList.add('selected');
        if (global.SquareAudio) global.SquareAudio.playPick();
      }
    }

    clearSelectedTrayItem() {
      this.selectedTraySize = null;
      document.querySelectorAll('.tray-item').forEach(el => el.classList.remove('selected'));
    }

    onTrayPointerDown(e, item) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      const size = parseInt(item.getAttribute('data-size'), 10);
      this.startDrag(e, {
        source: 'tray',
        s: size,
        colorIndex: size
      }, item);
    }

    onBoardTilePointerDown(e, tileData, tileEl) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.stopPropagation();

      this.startDrag(e, {
        source: 'board',
        id: tileData.id,
        s: tileData.s,
        colorIndex: tileData.colorIndex,
        originR: tileData.r,
        originC: tileData.c
      }, tileEl);
    }

    startDrag(e, tileInfo, sourceElement) {
      this.isDragging = true;
      this.dragSource = tileInfo.source;
      this.dragTileData = tileInfo;
      this.startPos = { x: e.clientX, y: e.clientY };

      if (global.SquareAudio) global.SquareAudio.playPick();

      // 创建跟随光标/手指的悬浮克隆节点
      this.createFloatingDragElement(tileInfo.s, tileInfo.colorIndex, e.clientX, e.clientY);

      // 如果来自棋盘，隐藏原棋子
      if (tileInfo.source === 'board' && sourceElement) {
        sourceElement.style.opacity = '0.35';
      }

      if (this.trashEl) {
        this.trashEl.classList.add('trash-active');
      }
    }

    createFloatingDragElement(s, colorIndex, x, y) {
      if (this.floatingDragEl) this.floatingDragEl.remove();

      const el = document.createElement('div');
      el.className = `floating-drag-tile tile-size-${s} tile-color-${colorIndex}`;
      el.style.width = `calc(var(--cell-size) * ${s})`;
      el.style.height = `calc(var(--cell-size) * ${s})`;
      el.style.position = 'fixed';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.transform = 'translate(-50%, -50%) scale(1.05)';
      el.style.zIndex = '9999';
      el.style.pointerEvents = 'none';
      el.style.boxShadow = '0 12px 28px rgba(0,0,0,0.35)';
      el.textContent = `${s}×${s}`;

      document.body.appendChild(this.floatingDragEl = el);
    }

    bindGlobalPointerEvents() {
      window.addEventListener('pointermove', (e) => {
        if (!this.isDragging || !this.floatingDragEl) return;

        // 更新跟随节点坐标
        this.floatingDragEl.style.left = `${e.clientX}px`;
        this.floatingDragEl.style.top = `${e.clientY}px`;

        // 判定是否悬停在棋盘上方
        this.updateGhostOnBoard(e.clientX, e.clientY);

        // 判定是否悬停在垃圾桶上方
        if (this.trashEl) {
          const trashRect = this.trashEl.getBoundingClientRect();
          const isOverTrash = (
            e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
            e.clientY >= trashRect.top && e.clientY <= trashRect.bottom
          );
          this.trashEl.classList.toggle('trash-hover', isOverTrash);
        }
      });

      const handlePointerUp = (e) => {
        if (!this.isDragging) return;
        this.finishDrag(e);
      };

      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }

    getGridCellFromCoords(clientX, clientY) {
      if (!this.boardEl) return null;
      const rect = this.boardEl.getBoundingClientRect();
      if (
        clientX < rect.left || clientX > rect.right ||
        clientY < rect.top || clientY > rect.bottom
      ) {
        return null;
      }

      const N = global.SquareGameState.N;
      const cellWidth = rect.width / N;
      const cellHeight = rect.height / N;

      const c = Math.floor((clientX - rect.left) / cellWidth);
      const r = Math.floor((clientY - rect.top) / cellHeight);

      if (r >= 0 && r < N && c >= 0 && c < N) {
        return { r, c };
      }
      return null;
    }

    updateGhostOnBoard(clientX, clientY) {
      const cell = this.getGridCellFromCoords(clientX, clientY);
      if (!cell || !this.dragTileData) {
        this.hideGhost();
        this.currentGridPos = null;
        this.isValidPlacement = false;
        return;
      }

      const s = this.dragTileData.s;
      const excludeId = this.dragSource === 'board' ? this.dragTileData.id : null;
      const canPlace = global.SquareGameState.canPlace(cell.r, cell.c, s, excludeId);

      this.currentGridPos = cell;
      this.isValidPlacement = canPlace;

      this.showGhost(cell.r, cell.c, s, canPlace);
    }

    showGhost(r, c, s, isValid) {
      if (!this.ghostEl) return;
      this.ghostEl.style.display = 'block';
      this.ghostEl.style.gridRowStart = (r + 1).toString();
      this.ghostEl.style.gridRowEnd = `span ${s}`;
      this.ghostEl.style.gridColumnStart = (c + 1).toString();
      this.ghostEl.style.gridColumnEnd = `span ${s}`;

      this.ghostEl.className = `placement-ghost ${isValid ? 'ghost-valid' : 'ghost-invalid'}`;
    }

    hideGhost() {
      if (this.ghostEl) {
        this.ghostEl.style.display = 'none';
      }
    }

    finishDrag(e) {
      const tileData = this.dragTileData;
      const source = this.dragSource;
      const gridPos = this.currentGridPos;
      const isValid = this.isValidPlacement;

      // 检查是否丢入垃圾桶或拖出棋盘
      let droppedOnTrash = false;
      if (this.trashEl) {
        const trashRect = this.trashEl.getBoundingClientRect();
        droppedOnTrash = (
          e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
          e.clientY >= trashRect.top && e.clientY <= trashRect.bottom
        );
      }

      if (source === 'board') {
        if (droppedOnTrash || !gridPos) {
          // 从棋盘移除该纸片
          global.SquareGameState.removeTile(tileData.id);
          if (global.SquareAudio) global.SquareAudio.playRemove();
        } else if (isValid) {
          // 移动到新网格位置
          const moved = global.SquareGameState.moveTile(tileData.id, gridPos.r, gridPos.c);
          if (moved && global.SquareAudio) global.SquareAudio.playDrop();
        } else {
          // 非法位置，还原原位
          if (global.SquareAudio) global.SquareAudio.playCollide();
          global.SquareGameState.notifyUpdate();
        }
      } else if (source === 'tray') {
        if (gridPos && isValid) {
          global.SquareGameState.placeTile(gridPos.r, gridPos.c, tileData.s, tileData.colorIndex);
          if (global.SquareAudio) global.SquareAudio.playDrop();
        } else if (gridPos && !isValid) {
          if (global.SquareAudio) global.SquareAudio.playCollide();
        }
      }

      // 清理状态
      this.cleanupDrag();
    }

    cleanupDrag() {
      this.isDragging = false;
      this.dragSource = null;
      this.dragTileData = null;
      this.currentGridPos = null;
      this.isValidPlacement = false;

      if (this.floatingDragEl) {
        this.floatingDragEl.remove();
        this.floatingDragEl = null;
      }
      this.hideGhost();
      if (this.trashEl) {
        this.trashEl.classList.remove('trash-active', 'trash-hover');
      }
    }

    bindBoardEvents() {
      // 棋盘点击事件（支持点选模式）
      this.boardEl.addEventListener('click', (e) => {
        if (this.isDragging) return;
        if (!this.selectedTraySize) return;

        const cell = this.getGridCellFromCoords(e.clientX, e.clientY);
        if (!cell) return;

        const s = this.selectedTraySize;
        if (global.SquareGameState.canPlace(cell.r, cell.c, s)) {
          global.SquareGameState.placeTile(cell.r, cell.c, s, s);
          if (global.SquareAudio) global.SquareAudio.playDrop();
        } else {
          if (global.SquareAudio) global.SquareAudio.playCollide();
        }
      });
    }
  }

  global.SquareDragDrop = new DragDropEngine();
})(window);
