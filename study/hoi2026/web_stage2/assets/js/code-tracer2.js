/**
 * 海淀信息学第二赛段 · 带函数调用栈的 C++ 单步代码跟踪器
 * 适合演示递归函数调用压栈、出栈回溯过程与变量跟踪
 */

class CodeTracerStage2 {
  constructor(options) {
    this.container = document.getElementById(options.containerId);
    if (!this.container) return;

    this.codeLines = options.codeLines || [];
    this.traceSteps = options.traceSteps || [];
    this.varNames = options.varNames || [];
    this.currentStepIdx = -1;
    this.timer = null;

    this.render();
    this.bindEvents();
    this.reset();
  }

  render() {
    this.container.innerHTML = `
      <div class="tracer2-grid">
        <div class="tracer-code-wrap">
          <ul class="tracer-code" id="${this.container.id}-code-list">
            ${this.codeLines.map((line, idx) => `
              <li class="code-line" data-line="${idx + 1}">
                <span class="line-num">${idx + 1}</span>
                <span class="line-text">${this.escapeHtml(line)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        <div class="tracer-side-wrap">
          <div class="tracer-table-wrap">
            <div style="font-size:0.85rem; font-weight:700; margin-bottom:6px; color:var(--ink-secondary);">📊 变量实时跟踪表</div>
            <table class="tracer-table">
              <thead>
                <tr>
                  ${this.varNames.map(v => `<th>${v}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                <tr>
                  ${this.varNames.map(v => `<td id="${this.container.id}-var-${v}">-</td>`).join('')}
                </tr>
              </tbody>
            </table>
          </div>

          <div class="callstack-box">
            <div style="font-size:0.85rem; font-weight:700; margin-bottom:6px; color:#5B21B6; display:flex; justify-content:space-between;">
              <span>🥞 系统函数调用栈 (Call Stack)</span>
              <span style="font-size:0.75rem; color:var(--ink-muted);">栈顶在上(LIFO)</span>
            </div>
            <div class="callstack-list" id="${this.container.id}-callstack">
              <div style="font-size:0.8rem; color:#94A3B8; text-align:center; padding:6px;">(当前栈为空)</div>
            </div>
          </div>

          <div class="sandbox-controls" style="margin-top: 12px;">
            <button type="button" class="btn btn-primary" id="${this.container.id}-btn-step" style="padding: 6px 16px; font-size: 0.88rem;">下一步 ❯</button>
            <button type="button" class="btn btn-secondary" id="${this.container.id}-btn-auto" style="padding: 6px 14px; font-size: 0.88rem;">▶ 自动播</button>
            <button type="button" class="btn btn-secondary" id="${this.container.id}-btn-reset" style="padding: 6px 14px; font-size: 0.88rem;">重置</button>
          </div>
        </div>
      </div>
      <div class="sandbox-log" id="${this.container.id}-log">
        准备就绪：点击【下一步】观察递归函数如何一层层入栈与回溯！
      </div>
    `;

    this.codeListEl = document.getElementById(`${this.container.id}-code-list`);
    this.stackListEl = document.getElementById(`${this.container.id}-callstack`);
    this.logEl = document.getElementById(`${this.container.id}-log`);
    this.btnStep = document.getElementById(`${this.container.id}-btn-step`);
    this.btnAuto = document.getElementById(`${this.container.id}-btn-auto`);
    this.btnReset = document.getElementById(`${this.container.id}-btn-reset`);
  }

  bindEvents() {
    this.btnStep.addEventListener('click', () => {
      this.stopAuto();
      this.step();
    });

    this.btnAuto.addEventListener('click', () => {
      if (this.timer) {
        this.stopAuto();
      } else {
        this.startAuto();
      }
    });

    this.btnReset.addEventListener('click', () => {
      this.stopAuto();
      this.reset();
    });
  }

  step() {
    if (this.currentStepIdx + 1 >= this.traceSteps.length) {
      this.logEl.innerHTML = '🏁 <b>递归与程序执行完毕！</b> 函数全部出栈，返回最终答案。';
      this.stopAuto();
      return;
    }

    this.currentStepIdx++;
    const frame = this.traceSteps[this.currentStepIdx];

    // 高亮当前代码行
    const allLines = this.codeListEl.querySelectorAll('.code-line');
    allLines.forEach(l => l.classList.remove('active'));

    if (frame.line > 0) {
      const activeLine = this.codeListEl.querySelector(`.code-line[data-line="${frame.line}"]`);
      if (activeLine) activeLine.classList.add('active');
    }

    // 更新变量跟踪表
    for (const [vName, vVal] of Object.entries(frame.vars || {})) {
      const cell = document.getElementById(`${this.container.id}-var-${vName}`);
      if (cell) cell.textContent = vVal;
    }

    // 更新调用栈视窗
    if (frame.stack) {
      this.stackListEl.innerHTML = '';
      if (frame.stack.length === 0) {
        this.stackListEl.innerHTML = '<div style="font-size:0.8rem; color:#94A3B8; text-align:center; padding:6px;">(当前栈为空)</div>';
      } else {
        frame.stack.forEach((fName, idx) => {
          const isTop = (idx === frame.stack.length - 1);
          const fDiv = document.createElement('div');
          fDiv.className = 'stack-frame';
          fDiv.innerHTML = `<span>${fName}</span>${isTop ? ' <span style="font-size:0.7rem; color:#7C3AED;">[栈顶活跃]</span>' : ''}`;
          this.stackListEl.appendChild(fDiv);
        });
      }
    }

    // 输出当前步骤讲解
    this.logEl.innerHTML = `[第 ${this.currentStepIdx + 1}/${this.traceSteps.length} 步] ${frame.desc}`;
  }

  startAuto() {
    this.btnAuto.textContent = '⏸ 暂停';
    this.btnAuto.classList.add('btn-primary');
    this.timer = setInterval(() => {
      if (this.currentStepIdx + 1 >= this.traceSteps.length) {
        this.stopAuto();
      } else {
        this.step();
      }
    }, 1200);
  }

  stopAuto() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.btnAuto.textContent = '▶ 自动播';
    this.btnAuto.classList.remove('btn-primary');
  }

  reset() {
    this.currentStepIdx = -1;
    const allLines = this.codeListEl.querySelectorAll('.code-line');
    allLines.forEach(l => l.classList.remove('active'));

    this.varNames.forEach(v => {
      const cell = document.getElementById(`${this.container.id}-var-${v}`);
      if (cell) cell.textContent = '-';
    });

    this.stackListEl.innerHTML = '<div style="font-size:0.8rem; color:#94A3B8; text-align:center; padding:6px;">(当前栈为空)</div>';
    this.logEl.innerHTML = '准备就绪：点击【下一步】观察递归函数如何一层层入栈与回溯！';
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

window.CodeTracerStage2 = CodeTracerStage2;
