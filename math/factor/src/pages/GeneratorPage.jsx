import React, { useState, useEffect, useRef } from 'react';
import MathText from '../components/MathText';
import { TextWithMath } from '../components/ContentBlock';
import { pdfQuestions } from '../data/pdfQuestions';
import { verifiedPdfQuestions } from '../data/pdfExtractedQuestions';

// Utility for generating math content
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
    return { min: -15, max: 15, allowNeg: true }; // challenge
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
    // terms is array of {c, vars}
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
    // gcf * (ax + b)
    const gcf = Math.abs(this.genRandomVal(p)); // 1 to max
    const a = this.genRandomVal(p);
    const b = this.genRandomVal(p);
    const varName = this.randChoice(['x', 'y', 'a', 'b']);
    
    // expression: (gcf*a)x^2 + (gcf*b)x
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
    
    // (ax + b)^2 = a^2 x^2 + 2ab x + b^2
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
    // (ax + b)(cx + d)
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
    // (ax + b)(cy + d)
    const a = this.genRandomVal(p);
    const b = this.genRandomVal(p);
    const c = this.genRandomVal(p);
    const d = this.genRandomVal(p);
    
    // ac xy + ad x + bc y + bd
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
    // (x^2 + r1)(x^2 + r2) = x^4 + (r1+r2)x^2 + r1*r2
    const r1 = this.genRandomVal(p);
    const r2 = this.genRandomVal(p);
    const b = r1 + r2;
    const c = r1 * r2;
    
    const q = this.formatPoly([
      {c: 1, vars: 'x^4'},
      {c: b, vars: 'x^2'},
      {c: c, vars: ''}
    ]);
    
    // Check if sub-terms can be factored further using difference of squares
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
      // (x - a)^2 - b^2
      const b2 = b * b;
      const q = `(x ${a > 0 ? '-' : '+'} ${Math.abs(a)})^2 - ${b2}`;
      const f1 = -a + b;
      const f2 = -a - b;
      const ans = `(x ${f1 >= 0 ? '+' : '-'} ${Math.abs(f1)})(x ${f2 >= 0 ? '+' : '-'} ${Math.abs(f2)})`;
      return { q, ans };
    } else if (mode === 2) {
      // (x + a)^2 - (y + b)^2
      const sa = a >= 0 ? '+' : '-';
      const sb = b >= 0 ? '+' : '-';
      const q = `(x ${sa} ${Math.abs(a)})^2 - (y ${sb} ${Math.abs(b)})^2`;
      const ans = `(x + y ${a+b >= 0 ? '+' : '-'} ${Math.abs(a+b)})(x - y ${a-b >= 0 ? '+' : '-'} ${Math.abs(a-b)})`;
      return { q, ans };
    } else {
      // a^2 - (bx + c)^2
      const a2 = a * a;
      const sc = b >= 0 ? '+' : '-';
      const q = `${a2} - (x ${sc} ${Math.abs(b)})^2`;
      const ans = `(${a} + x ${sc} ${Math.abs(b)})(${a} - x ${b >= 0 ? '-' : '+'} ${Math.abs(b)})`;
      return { q, ans };
    }
  }

  static generatePDFSample() {
    return this.randChoice([...pdfQuestions, ...verifiedPdfQuestions]);
  }

  static generateAddSubtract() {
    return this.randChoice([
      { q: 'x^4 + 4', ans: '(x^2 - 2x + 2)(x^2 + 2x + 2)' },
      { q: 'x^4 + 4y^4', ans: '(x^2 - 2xy + 2y^2)(x^2 + 2xy + 2y^2)' }
    ]);
  }

  static generateLongDivision() {
    return this.randChoice([
      { q: 'x^3 - 4x^2 + x + 6', ans: '(x - 2)(x - 3)(x + 1)' },
      { q: 'x^3 - 7x + 6', ans: '(x - 1)(x - 2)(x + 3)' }
    ]);
  }

  static generateSyntheticDivision() {
    return this.randChoice([
      { q: 'x^3 - 3x^2 - 4x + 12', ans: '(x - 3)(x - 2)(x + 2)' },
      { q: 'x^3 + x^2 - 4x - 4', ans: '(x + 1)(x - 2)(x + 2)' }
    ]);
  }

  static generateDualCross() {
    return this.randChoice([
      { q: 'x^2 + 3xy + 2y^2 + 4x + 5y + 3', ans: '(x + y + 1)(x + 2y + 3)' },
      { q: 'x^2 + 4xy + 3y^2 + 3x + 5y + 2', ans: '(x + y + 1)(x + 3y + 2)' }
    ]);
  }

  static generateUndeterminedCoefficients() {
    return this.randChoice([
      { q: 'x^4 - x^3 + 4x^2 + 3x + 5', ans: '(x^2 + x + 1)(x^2 - 2x + 5)' },
      { q: 'x^4 + 3x^3 + x^2 - 4x - 6', ans: '(x^2 + 2x + 2)(x^2 + x - 3)' }
    ]);
  }

  static generateSymmetricPolynomial() {
    return this.randChoice([
      { q: 'a^2(b-c) + b^2(c-a) + c^2(a-b)', ans: '-(a-b)(b-c)(c-a)' },
      { q: 'x^3 + y^3 + z^3 - 3xyz', ans: '(x+y+z)(x^2+y^2+z^2-xy-yz-zx)' }
    ]);
  }

  static generateEisenstein() {
    return this.randChoice([
      { q: '3x^4 + 15x^3 + 10x^2 + 5x + 5', ans: '\\text{在 }\\mathbb{Q}\\text{ 上不可约（取 }p=5\\text{）}' },
      { q: '4x^3 + 14x^2 + 7x + 21', ans: '\\text{在 }\\mathbb{Q}\\text{ 上不可约（取 }p=7\\text{）}' }
    ]);
  }

  static generateDomainRestriction() {
    return this.randChoice([
      { q: 'x^2 - 2', ans: '\\mathbb{Q}:\\text{不可约； }\\mathbb{R}:(x-\\sqrt{2})(x+\\sqrt{2})' },
      { q: 'x^2 + 1', ans: '\\mathbb{R}:\\text{不可约； }\\mathbb{C}:(x-i)(x+i)' }
    ]);
  }

  static generateComposite(diff) {
    const p = this.getDiffParams(diff);
    const gcf = Math.abs(this.genRandomVal(p));
    const a = Math.abs(this.genRandomVal(p));
    const b = Math.abs(this.genRandomVal(p));

    // Combine extracting a common factor with a difference of squares.
    // gcf(x² - a²) = gcf(x - a)(x + a)
    const q = this.formatPoly([
      { c: gcf, vars: 'x^2' },
      { c: -gcf * a * a, vars: '' }
    ]);
    const ans = `${gcf}(x - ${a})(x + ${a})`;

    // Occasionally generate a common-factor trinomial for variety.
    if (b % 2 === 0) {
      const r1 = this.genRandomVal(p);
      const r2 = this.genRandomVal(p);
      const trinomial = this.formatPoly([
        { c: gcf, vars: 'x^2' },
        { c: gcf * (r1 + r2), vars: 'x' },
        { c: gcf * r1 * r2, vars: '' }
      ]);
      const sign1 = r1 >= 0 ? '+' : '-';
      const sign2 = r2 >= 0 ? '+' : '-';
      return {
        q: trinomial,
        ans: `${gcf}(x ${sign1} ${Math.abs(r1)})(x ${sign2} ${Math.abs(r2)})`
      };
    }

    return { q, ans };
  }
}

const createPaper = (config) => {
  const questions = [];
  const diff = config.difficulty;

  const addUnique = (count, generatorFn, ...args) => {
    let added = 0;
    let attempts = 0;
    while (added < count && attempts < count * 20) {
      const q = generatorFn.apply(FactorGenerator, args);
      if (!questions.find(existing => existing.q === q.q)) {
        questions.push(q);
        added++;
      }
      attempts++;
    }
  };

  addUnique(config.counts.gcf, FactorGenerator.generateGCF, diff);
  addUnique(config.counts.diffSquares, FactorGenerator.generateDiffSquares, diff);
  addUnique(config.counts.perfSquare, FactorGenerator.generatePerfectSquare, diff);
  addUnique(config.counts.triBasic, FactorGenerator.generateTrinomialBasic, diff);
  addUnique(config.counts.triComplex, FactorGenerator.generateTrinomialComplex, diff);
  addUnique(config.counts.grouping, FactorGenerator.generateGrouping, diff);
  addUnique(config.counts.cubes, FactorGenerator.generateCubes, diff);
  addUnique(config.counts.substitution, FactorGenerator.generateSubstitution, diff);
  addUnique(config.counts.addSubtract, FactorGenerator.generateAddSubtract);
  addUnique(config.counts.longDivision, FactorGenerator.generateLongDivision);
  addUnique(config.counts.syntheticDivision, FactorGenerator.generateSyntheticDivision);
  addUnique(config.counts.multiVariable, FactorGenerator.generateAdvDiffSquares, diff);
  addUnique(config.counts.dualCross, FactorGenerator.generateDualCross);
  addUnique(config.counts.undetermined, FactorGenerator.generateUndeterminedCoefficients);
  addUnique(config.counts.symmetric, FactorGenerator.generateSymmetricPolynomial);
  addUnique(config.counts.eisenstein, FactorGenerator.generateEisenstein);
  addUnique(config.counts.domain, FactorGenerator.generateDomainRestriction);
  addUnique(config.counts.composite, FactorGenerator.generateComposite, diff);
  
  addUnique(config.sources.pdfSamples, FactorGenerator.generatePDFSample);

  return questions;
};

const GeneratorPage = () => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('factor_generator_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      title: '因式分解专项训练',
      difficulty: 'advanced',
      counts: {
        gcf: 2,
        diffSquares: 2,
        perfSquare: 2,
        triBasic: 3,
        triComplex: 2,
        grouping: 4,
        cubes: 2,
        substitution: 2,
        addSubtract: 1,
        longDivision: 1,
        syntheticDivision: 1,
        multiVariable: 1,
        dualCross: 1,
        undetermined: 1,
        symmetric: 1,
        eisenstein: 1,
        domain: 1,
        composite: 2
      },
      sources: { pdfSamples: 2 }
    };
  });

  const [paper, setPaper] = useState([]);
  const initialConfig = useRef(config);

  const handleGenerate = (e) => {
    if (e) e.preventDefault();
    setPaper(createPaper(config));
  };

  useEffect(() => {
    setPaper(createPaper(initialConfig.current));
  }, []);

  useEffect(() => {
    localStorage.setItem('factor_generator_config', JSON.stringify(config));
  }, [config]);

  const handlePrint = (e) => {
    if (e) e.preventDefault();
    window.print();
  };

  return (
    <div className="generator-layout">
      {/* Sidebar Configuration */}
      <div className="sidebar no-print">
        <div style={{ marginBottom: '20px' }}>
          <button type="button" className="btn" onClick={(e) => { e.preventDefault(); window.location.hash = '/'; }}>← 返回主地图</button>
        </div>
        <h2 style={{ marginBottom: '15px', color: 'var(--color-primary-400)' }}>🖨️ 试卷出题器</h2>
        
        <div className="form-group">
          <label>试卷标题</label>
          <input 
            type="text" 
            value={config.title}
            onChange={e => setConfig({...config, title: e.target.value})}
            className="config-input"
          />
        </div>

        <div className="form-group">
          <label>全局难度</label>
          <select 
            value={config.difficulty} 
            onChange={e => setConfig({...config, difficulty: e.target.value})}
            className="config-input"
          >
            <option value="basic">基础 (系数较小，全正数为主)</option>
            <option value="advanced">进阶 (含负数，适合平时练习)</option>
            <option value="challenge">挑战 (大数字，全考点覆盖)</option>
          </select>
        </div>

        <div className="form-group">
          <label>题型与技巧选择 (输入数量)</label>
          <div className="type-row">
            <span>提取公因式 (GCF)</span>
            <input type="number" min="0" max="10" value={config.counts.gcf} onChange={e => setConfig({...config, counts: {...config.counts, gcf: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <TextWithMath text="平方差公式 ($a^2-b^2$)" />
            <input type="number" min="0" max="10" value={config.counts.diffSquares} onChange={e => setConfig({...config, counts: {...config.counts, diffSquares: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>完全平方公式</span>
            <input type="number" min="0" max="10" value={config.counts.perfSquare} onChange={e => setConfig({...config, counts: {...config.counts, perfSquare: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>十字相乘 (a=1)</span>
            <input type="number" min="0" max="10" value={config.counts.triBasic} onChange={e => setConfig({...config, counts: {...config.counts, triBasic: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>十字相乘 (a≠1)</span>
            <input type="number" min="0" max="10" value={config.counts.triComplex} onChange={e => setConfig({...config, counts: {...config.counts, triComplex: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
              <span>双变量分组分解（含 xy）</span>
            <input type="number" min="0" max="10" value={config.counts.grouping} onChange={e => setConfig({...config, counts: {...config.counts, grouping: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>立方和 / 立方差公式</span>
            <input type="number" min="0" max="10" value={config.counts.cubes} onChange={e => setConfig({...config, counts: {...config.counts, cubes: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>换元法 / 双二次项</span>
            <input type="number" min="0" max="10" value={config.counts.substitution} onChange={e => setConfig({...config, counts: {...config.counts, substitution: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>添项与拆项法</span>
            <input type="number" min="0" max="10" value={config.counts.addSubtract} onChange={e => setConfig({...config, counts: {...config.counts, addSubtract: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>长除法 / 因式定理</span>
            <input type="number" min="0" max="10" value={config.counts.longDivision} onChange={e => setConfig({...config, counts: {...config.counts, longDivision: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>综合除法</span>
            <input type="number" min="0" max="10" value={config.counts.syntheticDivision} onChange={e => setConfig({...config, counts: {...config.counts, syntheticDivision: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>多变量复合结构</span>
            <input type="number" min="0" max="10" value={config.counts.multiVariable} onChange={e => setConfig({...config, counts: {...config.counts, multiVariable: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>双十字相乘法</span>
            <input type="number" min="0" max="10" value={config.counts.dualCross} onChange={e => setConfig({...config, counts: {...config.counts, dualCross: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>待定系数法</span>
            <input type="number" min="0" max="10" value={config.counts.undetermined} onChange={e => setConfig({...config, counts: {...config.counts, undetermined: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>轮换 / 对称多项式</span>
            <input type="number" min="0" max="10" value={config.counts.symmetric} onChange={e => setConfig({...config, counts: {...config.counts, symmetric: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>艾森斯坦不可约判定</span>
            <input type="number" min="0" max="10" value={config.counts.eisenstein} onChange={e => setConfig({...config, counts: {...config.counts, eisenstein: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>数域与不可约</span>
            <input type="number" min="0" max="10" value={config.counts.domain} onChange={e => setConfig({...config, counts: {...config.counts, domain: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>复合综合技巧</span>
            <input type="number" min="0" max="10" value={config.counts.composite} onChange={e => setConfig({...config, counts: {...config.counts, composite: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
        </div>

        <div className="form-group">
          <label>题目来源混入（不属于解题方法）</label>
          <div className="type-row">
            <span>PDF 题库（来源待核验）</span>
            <input type="number" min="0" max="10" value={config.sources.pdfSamples} onChange={e => setConfig({...config, sources: {...config.sources, pdfSamples: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
        </div>

        <button type="button" className="btn" style={{ width: '100%', marginBottom: '10px' }} onClick={handleGenerate}>🔄 换一批</button>
        <button type="button" className="btn" style={{ width: '100%', background: 'var(--color-success)' }} onClick={handlePrint}>🖨️ 打印试卷</button>
      </div>

      {/* Main Print Area */}
      <div className="print-area">
        <div className="paper-container">
          <div className="paper-header">
            <h1 className="paper-title">{config.title}</h1>
            <div className="paper-meta">
              <span>姓名：___________</span>
              <span>日期：___________</span>
              <span>得分：___________</span>
            </div>
          </div>

          <div className="paper-questions">
            {paper.map((item, idx) => (
              <div key={idx} className="paper-q-item">
                <span className="q-num">{idx + 1}.</span>
                <span className="q-content"><MathText content={item.q} /> = ____________</span>
              </div>
            ))}
          </div>

          <div className="paper-answers">
            <h3 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '12pt' }}>【 参考答案（倒置印刷） 】</h3>
            <div className="answers-grid">
              {paper.map((item, idx) => (
                <div key={idx} className="ans-item">
                  <b>{idx + 1}.</b> <MathText content={item.ans} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .generator-layout {
          display: flex;
          min-height: calc(100vh - 64px);
        }
        .sidebar {
          width: 300px;
          background: var(--color-primary-950);
          padding: 20px;
          border-right: 1px solid var(--color-primary-800);
          overflow-y: auto;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }
        .config-input {
          width: 100%;
          padding: 8px;
          background: var(--color-primary-900);
          border: 1px solid var(--color-primary-700);
          color: white;
          border-radius: 4px;
        }
        .type-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
        .number-input {
          width: 60px;
          text-align: center;
        }
        .print-area {
          flex: 1;
          background: #555;
          padding: 40px;
          overflow-y: auto;
          text-align: center;
        }
        .paper-container {
          background: white !important;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          text-align: left;
          padding: 20mm;
          color: black !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: block;
        }
        .paper-container *, 
        .paper-container h1, 
        .paper-container h2, 
        .paper-container h3, 
        .paper-container p, 
        .paper-container span, 
        .paper-container div {
          color: #000000 !important;
        }
        .paper-container .katex, 
        .paper-container .katex * {
          color: #000000 !important;
        }
        .paper-header {
          text-align: center;
          border-bottom: 2px solid black;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .paper-title {
          font-size: 24pt;
          margin-bottom: 20px;
          color: #000000 !important;
        }
        .paper-meta {
          display: flex;
          justify-content: space-around;
          font-size: 14pt;
          color: #000000 !important;
        }
        .paper-questions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px 20px;
          align-content: start;
          color: #000000 !important;
        }
        .paper-q-item {
          font-size: 14pt;
          display: flex;
          align-items: baseline;
          color: #000000 !important;
        }
        .q-num {
          font-weight: bold;
          margin-right: 10px;
          min-width: 25px;
          color: #000000 !important;
        }
        .paper-answers {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px dashed #666;
          transform: rotate(180deg);
          color: #000000 !important;
        }
        .answers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          font-size: 10pt;
          color: #000000 !important;
        }
        
        @media print {
          body, html, #root { 
            background: white !important; 
            color: black !important; 
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, .no-print { display: none !important; }
          .generator-layout { display: block !important; min-height: auto !important; }
          .print-area { padding: 0 !important; background: white !important; overflow: visible !important; }
          .paper-container { 
            box-shadow: none !important; 
            width: 100% !important; 
            min-height: auto !important; 
            padding: 0 !important; 
            color: black !important; 
          }
          .paper-container *, .paper-container h1, .paper-container h2, .paper-container h3, .paper-container p, .paper-container span, .paper-container div {
            color: black !important;
          }
          .katex, .katex * {
            color: black !important;
          }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  );
};

export default GeneratorPage;
