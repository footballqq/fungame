/**
 * 海淀信息学第二赛段 · 带函数调用栈的 C++ 单步代码跟踪器
 * 视觉风格：温暖米纸学术风（柔和米色背景 + 深黑清晰文字 + 焦糖高亮）
 * 适合演示递归函数调用压栈、出栈回溯过程与变量实时跟踪
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
          <div class="tracer-code-header">
            <span>💻 C++ 递归函数源码跟踪</span>
            <span class="tracer-header-tip">单步高亮追踪</span>
          </div>
          <ul class="tracer-code" id="${this.container.id}-code-list">
            ${this.codeLines.map((line, idx) => `
              <li class="code-line" data-line="${idx + 1}">
                <span class="line-num">${idx + 1}</span>
                <span class="line-text">${this.formatSyntax(line)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        <div class="tracer-side-wrap">
          <div class="tracer-table-wrap">
            <div class="tracer-panel-title">📊 变量实时跟踪表</div>
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
            <div class="callstack-header">
              <span>🥞 系统函数调用栈 (Call Stack)</span>
              <span class="callstack-tip">栈顶在上 (LIFO)</span>
            </div>
            <div class="callstack-list" id="${this.container.id}-callstack">
              <div class="callstack-empty">(当前栈为空)</div>
            </div>
          </div>

          <div class="tracer-controls">
            <button type="button" class="btn btn-primary" id="${this.container.id}-btn-step">下一步 ❯</button>
            <button type="button" class="btn btn-secondary" id="${this.container.id}-btn-auto">▶ 自动播</button>
            <button type="button" class="btn btn-secondary" id="${this.container.id}-btn-reset">重置</button>
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

    // 高亮当前代码行 (frame.line 为 1-based 行号)
    const allLines = this.codeListEl.querySelectorAll('.code-line');
    allLines.forEach(l => l.classList.remove('active'));

    const targetLineNum = frame.line;
    if (targetLineNum > 0) {
      const activeLine = this.codeListEl.querySelector(`.code-line[data-line="${targetLineNum}"]`);
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
        this.stackListEl.innerHTML = '<div class="callstack-empty">(当前栈为空)</div>';
      } else {
        frame.stack.forEach((fItem, idx) => {
          const isTop = (idx === frame.stack.length - 1);
          const fName = typeof fItem === 'object' ? (fItem.func || fItem.name || JSON.stringify(fItem)) : fItem;
          const fDiv = document.createElement('div');
          fDiv.className = `stack-frame ${isTop ? 'top-frame' : ''}`;
          fDiv.innerHTML = `<span>${fName}</span>${isTop ? ' <span class="badge-top">[栈顶活跃]</span>' : ''}`;
          this.stackListEl.appendChild(fDiv);
        });
      }
    }

    // 输出当前步骤讲解 (兼容 frame.note 与 frame.desc)
    const descText = frame.note || frame.desc || '';
    this.logEl.innerHTML = `[第 ${this.currentStepIdx + 1}/${this.traceSteps.length} 步] ${descText}`;
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

    this.stackListEl.innerHTML = '<div class="callstack-empty">(当前栈为空)</div>';
    this.logEl.innerHTML = '准备就绪：点击【下一步】观察递归函数如何一层层入栈与回溯！';
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  formatSyntax(line) {
    let s = this.escapeHtml(line);
    // 高亮关键字（深焦糖色）
    s = s.replace(/\b(int|return|if|else|while|for|void|bool|true|false)\b/g, '<span class="token-keyword">$1</span>');
    // 高亮数字（暖琥珀色）
    s = s.replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
    // 高亮函数名
    s = s.replace(/\b(fact|bsearch|calc|gcd)\b/g, '<span class="token-func">$1</span>');
    return s;
  }
}

window.CodeTracerStage2 = CodeTracerStage2;
