// controller for generator.html
class FactorGenerator {
  static randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randNonZeroInt(min, max) {
    let v = 0;
    while (v === 0) {
      v = this.randInt(min, max);
    }
    return v;
  }

  static randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static getDiffParams(diff) {
    if (diff === 'basic') return { min: 1, max: 5, allowNeg: false };
    if (diff === 'advanced') return { min: -9, max: 9, allowNeg: true };
    return { min: -15, max: 15, allowNeg: true };
  }

  static genRandomVal(params) {
    if (!params.allowNeg) return this.randInt(params.min, params.max);
    return this.randNonZeroInt(params.min, params.max);
  }

  static formatTerm(c, vars) {
    if (c === 0) return '';
    if (c === 1 && vars !== '') return vars;
    if (c === -1 && vars !== '') return '-' + vars;
    return `${c}${vars}`;
  }

  static formatPoly(terms) {
    let res = '';
    for (let i = 0; i < terms.length; i++) {
      let t = terms[i];
      if (t.c === 0) continue;
      if (res === '') {
        res += this.formatTerm(t.c, t.vars);
      } else {
        if (t.c > 0) {
          res += ' + ' + this.formatTerm(t.c, t.vars);
        } else {
          res += ' - ' + this.formatTerm(Math.abs(t.c), t.vars);
        }
      }
    }
    return res === '' ? '0' : res;
  }

  static generateGCF(diff) {
    const p = this.getDiffParams(diff);
    const gcf = Math.abs(this.genRandomVal(p));
    const a = this.genRandomVal(p);
    const b = this.genRandomVal(p);
    const varName = this.randChoice(['x', 'y', 'a', 'b']);
    const t1 = { c: gcf * a, vars: `${varName}^2` };
    const t2 = { c: gcf * b, vars: varName };
    const q = this.formatPoly([t1, t2]);
    const ans = `${this.formatTerm(gcf, varName)}(${this.formatPoly([{c: a, vars: varName}, {c: b, vars: ''}])})`;
    return { q, ans };
  }

  static generateDiffSquares(diff) {
    const p = this.getDiffParams(diff);
    let a = Math.abs(this.genRandomVal(p));
    let b = Math.abs(this.genRandomVal(p));
    if (a === 1 && b === 1) b = 2;
    const v1 = this.randChoice(['x', 'm', 'p']);
    const v2 = this.randChoice(['', 'y', 'n']);
    const q = `${a*a}${v1}^2 - ${b*b}${v2 !== '' ? v2+'^2' : ''}`;
    const ans = `(${this.formatTerm(a, v1)} + ${this.formatTerm(b, v2)})(${this.formatTerm(a, v1)} - ${this.formatTerm(b, v2)})`;
    return { q, ans };
  }

  static generatePerfectSquare(diff) {
    const p = this.getDiffParams(diff);
    const a = Math.abs(this.genRandomVal(p));
    const b = this.genRandomVal(p);
    const sign = b > 0 ? '+' : '-';
    const absB = Math.abs(b);
    const q = this.formatPoly([
      {c: a*a, vars: 'x^2'},
      {c: 2*a*b, vars: 'x'},
      {c: b*b, vars: ''}
    ]);
    const ans = `(${this.formatTerm(a, 'x')} ${sign} ${absB})^2`;
    return { q, ans };
  }

  static generateTrinomialBasic(diff) {
    const p = this.getDiffParams(diff);
    const r1 = this.genRandomVal(p);
    const r2 = this.genRandomVal(p);
    const b = r1 + r2;
    const c = r1 * r2;
    const q = this.formatPoly([
      {c: 1, vars: 'x^2'},
      {c: b, vars: 'x'},
      {c: c, vars: ''}
    ]);
    const s1 = r1 > 0 ? '+' : '-';
    const s2 = r2 > 0 ? '+' : '-';
    const ans = `(x ${s1} ${Math.abs(r1)})(x ${s2} ${Math.abs(r2)})`;
    return { q, ans };
  }

  static generateTrinomialComplex(diff) {
    const p = this.getDiffParams(diff);
    let a = Math.abs(this.genRandomVal(p));
    if (a === 1) a = 2;
    const b = this.genRandomVal(p);
    const c = Math.abs(this.genRandomVal(p));
    const d = this.genRandomVal(p);
    const B = a*d + b*c;
    const C = b*d;
    const A = a*c;
    const q = this.formatPoly([
      {c: A, vars: 'x^2'},
      {c: B, vars: 'x'},
      {c: C, vars: ''}
    ]);
    const sB = b > 0 ? '+' : '-';
    const sD = d > 0 ? '+' : '-';
    const ans = `(${this.formatTerm(a, 'x')} ${sB} ${Math.abs(b)})(${this.formatTerm(c, 'x')} ${sD} ${Math.abs(d)})`;
    return { q, ans };
  }

  static generateGrouping(diff) {
    const p = this.getDiffParams(diff);
    const a = this.genRandomVal(p);
    const b = this.genRandomVal(p);
    const c = this.genRandomVal(p);
    const d = this.genRandomVal(p);
    const q = this.formatPoly([
      {c: a*c, vars: 'xy'},
      {c: a*d, vars: 'x'},
      {c: b*c, vars: 'y'},
      {c: b*d, vars: ''}
    ]);
    const sB = b > 0 ? '+' : '-';
    const sD = d > 0 ? '+' : '-';
    const ans = `(${this.formatTerm(a, 'x')} ${sB} ${Math.abs(b)})(${this.formatTerm(c, 'y')} ${sD} ${Math.abs(d)})`;
    return { q, ans };
  }

  static generateCubes(diff) {
    const p = this.getDiffParams(diff);
    const a = Math.abs(this.genRandomVal(p));
    const b = Math.abs(this.genRandomVal(p));
    const isSum = Math.random() > 0.5;
    const v1 = 'x';
    const a3 = a * a * a;
    const b3 = b * b * b;
    if (isSum) {
      const q = `${this.formatTerm(a3, v1+'^3')} + ${b3}`;
      const ans = `(${this.formatTerm(a, v1)} + ${b})(${this.formatTerm(a*a, v1+'^2')} - ${this.formatTerm(a*b, v1)} + ${b*b})`;
      return { q, ans };
    } else {
      const q = `${this.formatTerm(a3, v1+'^3')} - ${b3}`;
      const ans = `(${this.formatTerm(a, v1)} - ${b})(${this.formatTerm(a*a, v1+'^2')} + ${this.formatTerm(a*b, v1)} + ${b*b})`;
      return { q, ans };
    }
  }

  static generateSubstitution(diff) {
    const p = this.getDiffParams(diff);
    const r1 = this.genRandomVal(p);
    const r2 = this.genRandomVal(p);
    const b = r1 + r2;
    const c = r1 * r2;
    const q = this.formatPoly([
      {c: 1, vars: 'x^4'},
      {c: b, vars: 'x^2'},
      {c: c, vars: ''}
    ]);
    let ans1 = `x^2 ${r1 > 0 ? '+' : '-'} ${Math.abs(r1)}`;
    if (r1 < 0) {
      const sq = Math.round(Math.sqrt(Math.abs(r1)));
      if (sq * sq === Math.abs(r1)) {
        ans1 = `(x + ${sq})(x - ${sq})`;
      } else {
        ans1 = `(${ans1})`;
      }
    } else {
      ans1 = `(${ans1})`;
    }
    let ans2 = `x^2 ${r2 > 0 ? '+' : '-'} ${Math.abs(r2)}`;
    if (r2 < 0) {
      const sq = Math.round(Math.sqrt(Math.abs(r2)));
      if (sq * sq === Math.abs(r2)) {
        ans2 = `(x + ${sq})(x - ${sq})`;
      } else {
        ans2 = `(${ans2})`;
      }
    } else {
      ans2 = `(${ans2})`;
    }
    const ans = `${ans1}${ans2}`;
    return { q, ans };
  }

  static generateAdvDiffSquares(diff) {
    const p = this.getDiffParams(diff);
    const mode = this.randInt(1, 3);
    const a = this.genRandomVal(p);
    const b = this.genRandomVal(p);
    if (mode === 1) {
      const b2 = b * b;
      const q = `(x ${a > 0 ? '-' : '+'} ${Math.abs(a)})^2 - ${b2}`;
      const f1 = -a + b;
      const f2 = -a - b;
      const ans = `(x ${f1 >= 0 ? '+' : '-'} ${Math.abs(f1)})(x ${f2 >= 0 ? '+' : '-'} ${Math.abs(f2)})`;
      return { q, ans };
    } else if (mode === 2) {
      const sa = a >= 0 ? '+' : '-';
      const sb = b >= 0 ? '+' : '-';
      const q = `(x ${sa} ${Math.abs(a)})^2 - (y ${sb} ${Math.abs(b)})^2`;
      const ans = `(x + y ${a+b >= 0 ? '+' : '-'} ${Math.abs(a+b)})(x - y ${a-b >= 0 ? '+' : '-'} ${Math.abs(a-b)})`;
      return { q, ans };
    } else {
      const a2 = a * a;
      const sc = b >= 0 ? '+' : '-';
      const q = `${a2} - (x ${sc} ${Math.abs(b)})^2`;
      const ans = `(${a} + x ${sc} ${Math.abs(b)})(${a} - x ${b >= 0 ? '-' : '+'} ${Math.abs(b)})`;
      return { q, ans };
    }
  }

  static generatePDFSample() {
    const pdfBank = [
      { q: "2x^2 - 18", ans: "2(x - 3)(x + 3)" },
      { q: "3y^2 - 48", ans: "3(y - 4)(y + 4)" },
      { q: "a^4 - 16", ans: "(a - 2)(a + 2)(a^2 + 4)" },
      { q: "5a^2 - 30a + 45", ans: "5(a - 3)^2" },
      { q: "4a^2 + 16a + 16", ans: "4(a + 2)^2" },
      { q: "-x^2 + 50x - 625", ans: "-(x - 25)^2" },
      { q: "ax - bx + ay - by", ans: "(x + y)(a - b)" },
      { q: "2ax + 3 + x + 6a", ans: "(x + 3)(2a + 1)" },
      { q: "m^3 + n^3", ans: "(m + n)(m^2 - mn + n^2)" },
      { q: "r^3 - s^3", ans: "(r - s)(r^2 + rs + s^2)" },
      { q: "64x^3 - 1", ans: "(4x - 1)(16x^2 + 4x + 1)" },
      { q: "8x^3 + 1", ans: "(2x + 1)(4x^2 - 2x + 1)" },
      { q: "27y^3 - 1", ans: "(3y - 1)(9y^2 + 3y + 1)" },
      { q: "125y^3 - 1", ans: "(5y - 1)(25y^2 + 5y + 1)" },
      { q: "3a^2 - 2ax - 3a + 2x", ans: "(a - 1)(3a - 2x)" },
      { q: "a^2 - 2a + ab - 2b", ans: "(a - 2)(a + b)" },
      { q: "125 - y^3", ans: "(5 - y)(25 + 5y + y^2)" },
      { q: "x^6 - 27", ans: "(x^2 - 3)(x^4 + 3x^2 + 9)" },
      { q: "x^6 + 125", ans: "(x^2 + 5)(x^4 - 5x^2 + 25)" },
      { q: "a^3 - a^2b - a + b", ans: "(a - 1)(a + 1)(a - b)" },
      { q: "x^2 + 6x + 5", ans: "(x + 5)(x + 1)" },
      { q: "x^2 - 4x + 3", ans: "(x - 3)(x - 1)" },
      { q: "n^2 + 5n + 6", ans: "(n + 2)(n + 3)" },
      { q: "n^2 - 10n + 25", ans: "(n - 5)^2" },
      { q: "m^2 + 3ms - 4s^2", ans: "(m - s)(m + 4s)" },
      { q: "y^2 + 4y - 12", ans: "(y + 6)(y - 2)" },
      { q: "36s^2 + 12s + 1", ans: "(6s + 1)^2" },
      { q: "6x^2 + 30x - 900", ans: "6(x + 15)(x - 10)" },
      { q: "2a^4 - 10a^3 - 72a^2", ans: "2a^2(a - 9)(a + 4)" },
      { q: "2x^3 - 3x^2 - 2x + 3", ans: "(x - 1)(x + 1)(2x - 3)" },
      { q: "(x - 1)^2 - 4", ans: "(x + 1)(x - 3)" },
      { q: "(x + 2)^2 - (y - 3)^2", ans: "(x - y + 5)(x + y - 1)" },
      { q: "16 - (2x - 1)^2", ans: "-(2x - 5)(2x + 3)" },
      { q: "4a^2 - 4ab - 36 + b^2", ans: "(2a - b + 6)(2a - b - 6)" },
      { q: "2a^3 - 16a^2 + 32a", ans: "2a(a - 4)^2" }
    ];
    return this.randChoice(pdfBank);
  }

  static generateComposite(diff) {
    const p = this.getDiffParams(diff);
    const k = Math.abs(this.genRandomVal(p)) + 1;
    let a = Math.abs(this.genRandomVal(p));
    let b = Math.abs(this.genRandomVal(p));
    const q = `${k * a * a}x^2 - ${k * b * b}y^2`;
    const ans = `${k}(${this.formatTerm(a, 'x')} + ${this.formatTerm(b, 'y')})(${this.formatTerm(a, 'x')} - ${this.formatTerm(b, 'y')})`;
    return { q, ans };
  }
}

export function init() {
  const container = document.getElementById('paper-container');
  if (!container) return;

  function renderKaTeX(text) {
    if (window.katex) {
      try {
        return window.katex.renderToString(text, { throwOnError: false });
      } catch (e) {
        return text;
      }
    }
    return text;
  }

  function generateAndRender() {
    const title = document.getElementById('gen-paper-title').value.trim() || '因式分解与微积分专项训练';
    const diff = document.getElementById('gen-paper-diff').value;

    const getVal = (id) => parseInt(document.getElementById(id)?.value || '0', 10);

    const counts = {
      gcf: getVal('cnt-gcf'),
      diffSquares: getVal('cnt-diffSq'),
      perfSquare: getVal('cnt-perfSq'),
      triBasic: getVal('cnt-triBasic'),
      triComplex: getVal('cnt-triComplex'),
      grouping: getVal('cnt-grouping'),
      cubes: getVal('cnt-cubes'),
      substitution: getVal('cnt-subst'),
      advDiffSquares: getVal('cnt-advDiff'),
      pdfSample: getVal('cnt-pdf'),
      composite: getVal('cnt-composite')
    };

    let questions = [];
    for (let i = 0; i < counts.gcf; i++) questions.push(FactorGenerator.generateGCF(diff));
    for (let i = 0; i < counts.diffSquares; i++) questions.push(FactorGenerator.generateDiffSquares(diff));
    for (let i = 0; i < counts.perfSquare; i++) questions.push(FactorGenerator.generatePerfectSquare(diff));
    for (let i = 0; i < counts.triBasic; i++) questions.push(FactorGenerator.generateTrinomialBasic(diff));
    for (let i = 0; i < counts.triComplex; i++) questions.push(FactorGenerator.generateTrinomialComplex(diff));
    for (let i = 0; i < counts.grouping; i++) questions.push(FactorGenerator.generateGrouping(diff));
    for (let i = 0; i < counts.cubes; i++) questions.push(FactorGenerator.generateCubes(diff));
    for (let i = 0; i < counts.substitution; i++) questions.push(FactorGenerator.generateSubstitution(diff));
    for (let i = 0; i < counts.advDiffSquares; i++) questions.push(FactorGenerator.generateAdvDiffSquares(diff));
    for (let i = 0; i < counts.pdfSample; i++) questions.push(FactorGenerator.generatePDFSample());
    for (let i = 0; i < counts.composite; i++) questions.push(FactorGenerator.generateComposite(diff));

    let qItemsHTML = '';
    let ansItemsHTML = '';

    questions.forEach((item, idx) => {
      const qNum = idx + 1;
      const qKatex = renderKaTeX(item.q);
      const ansKatex = renderKaTeX(item.ans);

      qItemsHTML += `
        <div class="paper-q-item">
          <span class="q-num">${qNum}.</span>
          <span>${qKatex} = ____________</span>
        </div>
      `;

      ansItemsHTML += `
        <div class="ans-item">
          <b>${qNum}.</b> ${ansKatex}
        </div>
      `;
    });

    const html = `
      <div class="paper-header">
        <h1 class="paper-title">${title}</h1>
        <div class="paper-meta">
          <span>姓名：___________</span>
          <span>日期：___________</span>
          <span>得分：___________</span>
        </div>
      </div>

      <div class="paper-questions">
        ${qItemsHTML}
      </div>

      <div class="paper-answers">
        <h3 style="text-align: center; margin-bottom: 10px; font-size: 11pt;">【 参考答案（倒置印刷） 】</h3>
        <div class="answers-grid">
          ${ansItemsHTML}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // Bind buttons
  const btnRefresh = document.getElementById('btn-gen-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', (e) => {
      e.preventDefault();
      generateAndRender();
    });
  }

  const btnPrint = document.getElementById('btn-gen-print');
  if (btnPrint) {
    btnPrint.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    });
  }

  // Auto generate on page load
  generateAndRender();
}
