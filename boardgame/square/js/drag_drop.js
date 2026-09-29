// codex: 2026-09-29 drag_drop.js 修复坐标对齐、消除偏移动画与高精度网格吸附
(function (global) {
  'use strict';

  class DragDropEngine {
    constructor() {
      this.boardEl = null;
      this.ghostEl = null;
      this.trashEl = null;
      this.floatingDragEl = null;
      this.activeSourceEl = null;

      // 拖拽与点选状态
      this.selectedTraySize = null;
      this.isDragging = false;
      this.dragSource = null; // 'tray' | 'board'
      this.dragTileData = null; // { s, id?, colorIndex, originR?, originC? }
      this.grabOffsetX = 0;
      this.grabOffsetY = 0;
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

    getCellSize() {
      if (!this.boardEl) return 42;
      const rect = this.boardEl.getBoundingClientRect();
      const N = global.SquareGameState.N;
      return rect.width / N;
    }

    bindTrayEvents() {
      const container = document.getElementById('trayContainer');
      if (!container || container.dataset.bound) return;
      container.dataset.bound = 'true';
      container.addEventListener('pointerdown', (e) => {
        const item = e.target.closest('.tray-item');
        if (item) this.onTrayPointerDown(e, item);
      });
      container.addEventListener('click', (e) => {
        if (this.isDragging) return;
        const item = e.target.closest('.tray-item');
        if (!item) return;
        const s = parseInt(item.getAttribute('data-size'), 10);
        this.toggleSelectTrayItem(s, item);
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
      const cellSize = this.getCellSize();
      const tilePixelSize = size * cellSize;

      // 托盘抓取默认将光标置于中心
      this.grabOffsetX = tilePixelSize / 2;
      this.grabOffsetY = tilePixelSize / 2;

      this.startDrag(e, {
        source: 'tray',
        s: size,
        colorIndex: size
      }, item);
    }

    onBoardTilePointerDown(e, tileData, tileEl) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.stopPropagation();

      const rect = this.boardEl.getBoundingClientRect();
      const cellSize = this.getCellSize();
      const tileLeft = rect.left + tileData.c * cellSize;
      const tileTop = rect.top + tileData.r * cellSize;

      // 精确记录点击点相对于纸片左上角的像素偏移，彻底消除跳动与视差
      this.grabOffsetX = Math.max(0, Math.min(tileData.s * cellSize, e.clientX - tileLeft));
      this.grabOffsetY = Math.max(0, Math.min(tileData.s * cellSize, e.clientY - tileTop));

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
      this.activeSourceEl = sourceElement;

      if (global.SquareAudio) global.SquareAudio.playPick();

      // 创建完全同比例悬浮克隆节点（无放大缩放、无偏移动画，100%对齐）
      this.createFloatingDragElement(tileInfo.s, tileInfo.colorIndex, e.clientX, e.clientY);

      // 若拖动盘内纸片，隐藏原纸片避免重影混淆
      if (tileInfo.source === 'board' && sourceElement) {
        sourceElement.style.visibility = 'hidden';
      }

      if (this.trashEl) {
        this.trashEl.classList.add('trash-active');
      }

      // 立即触发一次悬停判定
      this.updateGhostOnBoard(e.clientX, e.clientY);
    }

    createFloatingDragElement(s, colorIndex, x, y) {
      if (this.floatingDragEl) this.floatingDragEl.remove();

      const cellSize = this.getCellSize();
      const pixelWidth = s * cellSize;

      const el = document.createElement('div');
      el.className = `floating-drag-tile tile-size-${s} tile-color-${colorIndex}`;
      el.style.width = `${pixelWidth}px`;
      el.style.height = `${pixelWidth}px`;
      el.style.position = 'fixed';
      el.style.left = `${x - this.grabOffsetX}px`;
      el.style.top = `${y - this.grabOffsetY}px`;
      el.style.zIndex = '9999';
      el.style.pointerEvents = 'none';
      el.style.transform = 'none';
      el.style.opacity = '0.92';
      el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.45)';

      el.innerHTML = `<span class="tile-badge">${s}×${s}</span>`;
      document.body.appendChild(this.floatingDragEl = el);
    }

    bindGlobalPointerEvents() {
      window.addEventListener('pointermove', (e) => {
        if (!this.isDragging || !this.floatingDragEl) return;

        // 跟随光标移动，保持左上角与抓取点一致
        this.floatingDragEl.style.left = `${e.clientX - this.grabOffsetX}px`;
        this.floatingDragEl.style.top = `${e.clientY - this.grabOffsetY}px`;

        this.updateGhostOnBoard(e.clientX, e.clientY);

        // 垃圾桶判定
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

    updateGhostOnBoard(clientX, clientY) {
      if (!this.boardEl || !this.dragTileData) {
        this.hideGhost();
        this.currentGridPos = null;
        this.isValidPlacement = false;
        return;
      }

      const rect = this.boardEl.getBoundingClientRect();
      const N = global.SquareGameState.N;
      const cellSize = rect.width / N;
      const s = this.dragTileData.s;

      // 基于悬浮纸片左上角坐标计算目标网格位置
      const floatingLeft = clientX - this.grabOffsetX;
      const floatingTop = clientY - this.grabOffsetY;

      // 如果悬浮纸片完全远离棋盘则不显示幽灵
      if (
        floatingLeft + s * cellSize < rect.left - cellSize ||
        floatingLeft > rect.right + cellSize ||
        floatingTop + s * cellSize < rect.top - cellSize ||
        floatingTop > rect.bottom + cellSize
      ) {
        this.hideGhost();
        this.currentGridPos = null;
        this.isValidPlacement = false;
        return;
      }

      // 最近网格吸附
      const c = Math.round((floatingLeft - rect.left) / cellSize);
      const r = Math.round((floatingTop - rect.top) / cellSize);

      // 判定是否在网格边界内
      const isWithinBounds = (r >= 0 && c >= 0 && r + s <= N && c + s <= N);
      const excludeId = this.dragSource === 'board' ? this.dragTileData.id : null;
      const canPlace = isWithinBounds && global.SquareGameState.canPlace(r, c, s, excludeId);

      this.currentGridPos = { r, c };
      this.isValidPlacement = canPlace;

      // 只要在棋盘合法范围内就展示对齐幽灵
      if (r >= 0 && c >= 0 && r + s <= N && c + s <= N) {
        this.showGhost(r, c, s, canPlace);
      } else {
        this.hideGhost();
      }
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

      let droppedOnTrash = false;
      if (this.trashEl) {
        const trashRect = this.trashEl.getBoundingClientRect();
        droppedOnTrash = (
          e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
          e.clientY >= trashRect.top && e.clientY <= trashRect.bottom
        );
      }

      if (source === 'board') {
        if (droppedOnTrash || !gridPos || gridPos.r < 0 || gridPos.c < 0) {
          // 移出棋盘或扔进垃圾桶直接删除
          global.SquareGameState.removeTile(tileData.id);
          if (global.SquareAudio) global.SquareAudio.playRemove();
        } else if (isValid) {
          // 精确移动到新网格
          const moved = global.SquareGameState.moveTile(tileData.id, gridPos.r, gridPos.c);
          if (moved && global.SquareAudio) global.SquareAudio.playDrop();
        } else {
          // 位置不合法恢复原位置
          if (this.activeSourceEl) this.activeSourceEl.style.visibility = 'visible';
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
      if (this.activeSourceEl) {
        this.activeSourceEl.style.visibility = 'visible';
        this.activeSourceEl = null;
      }
      if (this.trashEl) {
        this.trashEl.classList.remove('trash-active', 'trash-hover');
      }
    }

    bindBoardEvents() {
      this.boardEl.addEventListener('click', (e) => {
        if (this.isDragging) return;
        if (!this.selectedTraySize) return;

        const rect = this.boardEl.getBoundingClientRect();
        const N = global.SquareGameState.N;
        const cellSize = rect.width / N;
        const c = Math.floor((e.clientX - rect.left) / cellSize);
        const r = Math.floor((e.clientY - rect.top) / cellSize);

        const s = this.selectedTraySize;
        if (r >= 0 && c >= 0 && r + s <= N && c + s <= N) {
          if (global.SquareGameState.canPlace(r, c, s)) {
            global.SquareGameState.placeTile(r, c, s, s);
            if (global.SquareAudio) global.SquareAudio.playDrop();
          } else {
            if (global.SquareAudio) global.SquareAudio.playCollide();
          }
        }
      });
    }
  }

  global.SquareDragDrop = new DragDropEngine();
})(window);
