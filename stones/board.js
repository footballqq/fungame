// codex: 2026-09-09 奇偶棋子谜题前端交互控制器与木质棋盘渲染引擎
(function () {
  'use strict';

  const { SoundFX, Confetti } = window.GameFX || {
    SoundFX: { playWoodClick() {}, playVictory() {}, enabled: true },
    Confetti: { init() {}, fire() {} },
  };

  // 游戏主状态控制器
  class ParityGame {
    constructor() {
      this.size = 6;
      this.zoomLevel = 'large'; // 默认电脑屏幕使用“加大”模式，高分辨率清晰可辨
      this.board = [];
      this.history = [];
      this.redoStack = [];
      this.isSolved = false;
      this.resizeTimer = null;

      this.initElements();
      this.bindEvents();
      this.setBoardSize(6);
    }

    initElements() {
      this.elBoardWrapper = document.querySelector('.board-wrapper');
      this.elColIndicators = document.getElementById('colIndicators');
      this.elRowLabels = document.getElementById('rowLabels');
      this.elBoardGrid = document.getElementById('boardGrid');
      this.elRowIndicators = document.getElementById('rowIndicators');

      this.elCurrentPieces = document.getElementById('currentPieces');
      this.elMinPiecesTarget = document.getElementById('minPiecesTarget');
      this.elValidRowsCount = document.getElementById('validRowsCount');
      this.elValidColsCount = document.getElementById('validColsCount');
      this.elStatusBanner = document.getElementById('statusBanner');
      this.elHintBox = document.getElementById('hintBox');

      this.btnUndo = document.getElementById('btnUndo');
      this.btnRedo = document.getElementById('btnRedo');
      this.btnClear = document.getElementById('btnClear');
      this.btnHint = document.getElementById('btnHint');
      this.btnShowSolution = document.getElementById('btnShowSolution');
      this.btnProof = document.getElementById('btnProof');
      this.btnSoundToggle = document.getElementById('btnSoundToggle');

      this.proofModal = document.getElementById('proofModal');
      this.proofCloseBtn = document.getElementById('proofCloseBtn');
      this.proofStepsContainer = document.getElementById('proofStepsContainer');

      const canvas = document.getElementById('celebrationCanvas');
      if (canvas) Confetti.init(canvas);
    }

    bindEvents() {
      // 规格选择 (4x4, 6x6, 8x8)
      document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          const newSize = parseInt(e.target.dataset.size, 10);
          document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.setBoardSize(newSize);
        });
      });

      // 缩放尺寸选择 (标准, 加大, 特大)
      document.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          this.zoomLevel = e.target.dataset.zoom;
          document.querySelectorAll('.zoom-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.renderBoardStructure();
          this.refreshBoardCells();
          this.updateState();
        });
      });

      this.btnUndo.addEventListener('click', () => this.undo());
      this.btnRedo.addEventListener('click', () => this.redo());
      this.btnClear.addEventListener('click', () => this.clearBoard());
      this.btnHint.addEventListener('click', () => this.showHint());
      this.btnShowSolution.addEventListener('click', () => this.demonstrateSolution());

      this.btnProof.addEventListener('click', () => this.openProofModal());
      this.proofCloseBtn.addEventListener('click', () => this.closeProofModal());
      this.proofModal.addEventListener('click', e => {
        if (e.target === this.proofModal) this.closeProofModal();
      });

      this.btnSoundToggle.addEventListener('click', () => {
        SoundFX.enabled = !SoundFX.enabled;
        this.btnSoundToggle.textContent = SoundFX.enabled ? '🔊 音效: 开' : '🔈 音效: 关';
      });

      // 视口改变自动适配重绘
      window.addEventListener('resize', () => {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
          this.renderBoardStructure();
          this.refreshBoardCells();
        }, 120);
      });
    }

    // 计算当前设备与缩放比例下的单格像素尺寸
    computeCellSize(size, zoomLevel) {
      const screenWidth = window.innerWidth;
      if (screenWidth <= 600) {
        // 手机屏幕：根据屏幕宽度动态自适应计算
        const availableWidth = screenWidth - (size === 8 ? 84 : 96);
        return Math.max(34, Math.min(52, Math.floor(availableWidth / size)));
      }
      if (screenWidth <= 1024) {
        // 平板屏幕 (iPad)：适度舒展方便手指点击
        const padMap = {
          normal: { 4: 72, 6: 58, 8: 46 },
          large:  { 4: 86, 6: 68, 8: 52 },
          xlarge: { 4: 98, 6: 76, 8: 60 },
        };
        return padMap[zoomLevel]?.[size] || 60;
      }
      // PC 电脑屏幕：针对 1080p, 2K/4K 高分屏提供充分的视觉放大
      const pcMap = {
        normal: { 4: 78, 6: 64, 8: 50 },
        large:  { 4: 98, 6: 82, 8: 64 },   // 加大（PC高分屏推荐）
        xlarge: { 4: 120, 6: 100, 8: 78 }, // 特大（2K/4K大屏清晰震撼）
      };
      return pcMap[zoomLevel]?.[size] || 82;
    }

    setBoardSize(size) {
      this.size = size;
      this.board = Array.from({ length: size }, () => new Array(size).fill(0));
      this.history = [];
      this.redoStack = [];
      this.isSolved = false;
      this.elHintBox.style.display = 'none';

      const minTarget = ParitySolver.computeTheoreticalMinPieces(size);
      this.elMinPiecesTarget.textContent = minTarget;
      if (this.btnShowSolution) {
        this.btnShowSolution.textContent = `✨ 演示官方最优解 (${minTarget}枚)`;
      }

      this.renderBoardStructure();
      this.updateState();
    }

    renderBoardStructure() {
      const size = this.size;
      const cellSize = this.computeCellSize(size, this.zoomLevel);

      // 设置 CSS 自定义变量，驱动棋盘、指示框与字体整体缩放
      if (this.elBoardWrapper) {
        this.elBoardWrapper.style.setProperty('--cell-size', `${cellSize}px`);
      }

      // 1. 顶部列指示器
      this.elColIndicators.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
      this.elColIndicators.innerHTML = '';
      for (let c = 0; c < size; c++) {
        const colLetter = String.fromCharCode(65 + c);
        const colDiv = document.createElement('div');
        colDiv.className = 'indicator-col';
        colDiv.id = `colInd-${c}`;
        colDiv.innerHTML = `
          <span class="indicator-label">${colLetter}</span>
          <span class="indicator-target">奇</span>
          <span class="indicator-count" id="colCount-${c}">0</span>
          <span class="indicator-badge badge-invalid" id="colBadge-${c}">×</span>
        `;
        this.elColIndicators.appendChild(colDiv);
      }

      // 2. 行标号
      this.elRowLabels.innerHTML = '';
      for (let r = 0; r < size; r++) {
        const label = document.createElement('div');
        label.style.height = `${cellSize}px`;
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.justifyContent = 'center';
        label.textContent = r + 1;
        this.elRowLabels.appendChild(label);
      }

      // 3. 棋盘网格
      this.elBoardGrid.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
      this.elBoardGrid.innerHTML = '';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const cell = document.createElement('div');
          const isLight = (r + c) % 2 === 0;
          cell.className = `cell ${isLight ? 'light' : 'dark'}`;
          cell.dataset.row = r;
          cell.dataset.col = c;
          cell.id = `cell-${r}-${c}`;

          cell.addEventListener('click', () => this.togglePiece(r, c));
          this.elBoardGrid.appendChild(cell);
        }
      }

      // 4. 右侧行指示器
      this.elRowIndicators.innerHTML = '';
      for (let r = 0; r < size; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'indicator-row';
        rowDiv.id = `rowInd-${r}`;
        rowDiv.innerHTML = `
          <span class="indicator-target">偶</span>
          <span class="indicator-count" id="rowCount-${r}">0</span>
          <span class="indicator-badge badge-invalid" id="rowBadge-${r}">×</span>
        `;
        this.elRowIndicators.appendChild(rowDiv);
      }
    }

    togglePiece(r, c) {
      SoundFX.playWoodClick();
      this.clearHintHighlight();

      this.history.push(this.board.map(row => [...row]));
      this.redoStack = [];

      this.board[r][c] = this.board[r][c] === 1 ? 0 : 1;
      this.renderPieceOnCell(r, c);
      this.updateState();
    }

    renderPieceOnCell(r, c) {
      const cell = document.getElementById(`cell-${r}-${c}`);
      if (!cell) return;
      if (this.board[r][c] === 1) {
        if (!cell.querySelector('.piece')) {
          const piece = document.createElement('div');
          piece.className = 'piece';
          cell.appendChild(piece);
        }
      } else {
        const piece = cell.querySelector('.piece');
        if (piece) piece.remove();
      }
    }

    updateState() {
      const res = ParitySolver.validateBoard(this.board);

      this.elCurrentPieces.textContent = res.totalPieces;

      let validRows = 0;
      for (let r = 0; r < this.size; r++) {
        const count = res.rowCounts[r];
        const isValid = res.rowValid[r];
        if (isValid) validRows++;

        const countEl = document.getElementById(`rowCount-${r}`);
        const badgeEl = document.getElementById(`rowBadge-${r}`);
        if (countEl) countEl.textContent = count;
        if (badgeEl) {
          badgeEl.className = `indicator-badge ${isValid ? 'badge-valid' : 'badge-invalid'}`;
          badgeEl.textContent = isValid ? '✓' : '×';
        }
      }
      this.elValidRowsCount.textContent = `${validRows}/${this.size}`;

      let validCols = 0;
      for (let c = 0; c < this.size; c++) {
        const count = res.colCounts[c];
        const isValid = res.colValid[c];
        if (isValid) validCols++;

        const countEl = document.getElementById(`colCount-${c}`);
        const badgeEl = document.getElementById(`colBadge-${c}`);
        if (countEl) countEl.textContent = count;
        if (badgeEl) {
          badgeEl.className = `indicator-badge ${isValid ? 'badge-valid' : 'badge-invalid'}`;
          badgeEl.textContent = isValid ? '✓' : '×';
        }
      }
      this.elValidColsCount.textContent = `${validCols}/${this.size}`;

      this.btnUndo.disabled = this.history.length === 0;
      this.btnRedo.disabled = this.redoStack.length === 0;

      if (res.isOptimal) {
        this.elStatusBanner.className = 'status-banner optimal';
        this.elStatusBanner.innerHTML = `🎉 恭喜！达成理论极限最优解（恰好 ${res.totalPieces} 枚棋子）！`;
        if (!this.isSolved) {
          this.isSolved = true;
          SoundFX.playVictory();
          Confetti.fire();
        }
      } else if (res.isValid) {
        this.elStatusBanner.className = 'status-banner valid';
        this.elStatusBanner.innerHTML = `✨ 恭喜满足全盘奇偶条件（当前共 ${res.totalPieces} 枚）！尝试精简到最少 ${res.minPieces} 枚吧！`;
        if (!this.isSolved) {
          SoundFX.playVictory();
        }
      } else {
        this.isSolved = false;
        this.elStatusBanner.className = 'status-banner';
        this.elStatusBanner.innerHTML = `继续调整：每行必须是偶数（>0），每列必须是奇数（1, 3, 5...）`;
      }
    }

    undo() {
      if (this.history.length === 0) return;
      this.redoStack.push(this.board.map(row => [...row]));
      this.board = this.history.pop();
      SoundFX.playWoodClick();
      this.refreshBoardCells();
      this.updateState();
    }

    redo() {
      if (this.redoStack.length === 0) return;
      this.history.push(this.board.map(row => [...row]));
      this.board = this.redoStack.pop();
      SoundFX.playWoodClick();
      this.refreshBoardCells();
      this.updateState();
    }

    clearBoard() {
      this.history.push(this.board.map(row => [...row]));
      this.redoStack = [];
      this.board = Array.from({ length: this.size }, () => new Array(this.size).fill(0));
      SoundFX.playWoodClick();
      this.clearHintHighlight();
      this.elHintBox.style.display = 'none';
      this.refreshBoardCells();
      this.updateState();
    }

    refreshBoardCells() {
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          this.renderPieceOnCell(r, c);
        }
      }
    }

    showHint() {
      const hint = ParitySolver.findHint(this.board);
      if (!hint) return;

      this.clearHintHighlight();
      this.elHintBox.style.display = 'block';

      if (hint.action === 'complete') {
        this.elHintBox.textContent = hint.message;
      } else {
        this.elHintBox.textContent = `💡 ${hint.reason}`;
        const targetCell = document.getElementById(`cell-${hint.row}-${hint.col}`);
        if (targetCell) targetCell.classList.add('highlight-hint');
      }
    }

    clearHintHighlight() {
      document.querySelectorAll('.cell.highlight-hint').forEach(el => {
        el.classList.remove('highlight-hint');
      });
    }

    demonstrateSolution() {
      this.clearBoard();
      const optimal = ParitySolver.constructOptimalSolution(this.size);
      const piecesToPlace = [];
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (optimal[r][c] === 1) {
            piecesToPlace.push({ r, c });
          }
        }
      }

      let idx = 0;
      const interval = setInterval(() => {
        if (idx >= piecesToPlace.length) {
          clearInterval(interval);
          return;
        }
        const { r, c } = piecesToPlace[idx];
        this.board[r][c] = 1;
        this.renderPieceOnCell(r, c);
        SoundFX.playWoodClick();
        this.updateState();
        idx++;
      }, 90);
    }

    openProofModal() {
      const exp = ParitySolver.getMathExplanation(this.size);
      this.proofStepsContainer.innerHTML = '';

      // 1. 核心问答横幅
      if (exp.highlightQuestion) {
        const qBox = document.createElement('div');
        qBox.className = 'proof-question-box';
        qBox.innerHTML = `
          <div class="proof-question-title">${exp.highlightQuestion}</div>
          <div class="proof-question-desc">${exp.coreConclusion}</div>
        `;
        this.proofStepsContainer.appendChild(qBox);
      }

      // 2. 分步数学证明
      exp.steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'proof-step';
        div.innerHTML = `
          <div class="proof-step-title">步骤 ${step.step}：${step.title}</div>
          <div class="proof-step-content">${step.content}</div>
        `;
        this.proofStepsContainer.appendChild(div);
      });

      // 3. 任意阶 n 总结对比表
      if (exp.table && exp.table.length > 0) {
        const tableWrap = document.createElement('div');
        tableWrap.className = 'proof-table-wrap';
        let tableHtml = `
          <table class="proof-table">
            <thead>
              <tr>
                <th>棋盘规模</th>
                <th>是否有解</th>
                <th>理论最少棋子数</th>
                <th>依据与理由</th>
              </tr>
            </thead>
            <tbody>
        `;
        exp.table.forEach(row => {
          tableHtml += `
            <tr>
              <td><strong>${row.n}</strong></td>
              <td>${row.valid}</td>
              <td>${row.min}</td>
              <td>${row.reason}</td>
            </tr>
          `;
        });
        tableHtml += '</tbody></table>';
        tableWrap.innerHTML = tableHtml;
        this.proofStepsContainer.appendChild(tableWrap);
      }

      this.proofModal.style.display = 'flex';
    }

    closeProofModal() {
      this.proofModal.style.display = 'none';
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new ParityGame();
  });
})();
