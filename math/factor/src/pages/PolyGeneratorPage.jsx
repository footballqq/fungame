import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PolyGenerator } from '../utils/PolyMath';
import { TextWithMath } from '../components/ContentBlock';

const PolyGeneratorPage = () => {
  const navigate = useNavigate();
  const printRef = useRef();

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('poly_generator_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      title: '多项式计算专项训练',
      subtitle: '姓名：__________  日期：__________  得分：__________',
      columns: 2,
      showAnswers: false,
      counts: {
        like_terms: 5,
        distributive: 5,
        poly_poly: 5,
        divide_monomial: 5,
        divide_binomial: 5
      },
      varCount: 1, // 1, 2, 3
      nested: false
    };
  });

  useEffect(() => {
    localStorage.setItem('poly_generator_config', JSON.stringify(config));
  }, [config]);

  const [paper, setPaper] = useState(null);

  const handleGenerate = () => {
    let questions = [];
    
    const addUnique = (count, generatorFn, ...args) => {
      let added = 0;
      let attempts = 0;
      while (added < count && attempts < count * 20) {
        const q = generatorFn(...args);
        if (!questions.find(existing => existing.q === q.q)) {
          questions.push(q);
          added++;
        }
        attempts++;
      }
    };

    addUnique(config.counts.like_terms, PolyGenerator.generateLikeTerms, config.varCount, config.nested);
    addUnique(config.counts.distributive, PolyGenerator.generateDistributive, config.varCount);
    addUnique(config.counts.poly_poly, PolyGenerator.generatePolyPoly, config.varCount);
    addUnique(config.counts.divide_monomial, PolyGenerator.generateDivideMonomial, config.varCount);
    addUnique(config.counts.divide_binomial, PolyGenerator.generateDivideBinomial, config.varCount);

    setPaper(questions);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="generator-layout">
      
      {/* 打印专用的样式覆盖 */}
      <style>{`
        .generator-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }
        @media print {
          body, html, #root { 
            background: white !important; 
            color: black !important; 
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          nav, .config-sidebar { display: none !important; }
          .generator-layout { display: block !important; height: auto !important; overflow: visible !important; }
          .print-area { padding: 0 !important; background: white !important; overflow: visible !important; }
          .paper-container { 
            box-shadow: none !important; 
            width: 100% !important; 
            min-height: auto !important; 
            padding: 0 !important; 
            margin: 0 !important;
            color: black !important; 
          }
          @page { margin: 15mm; }
        }
        .config-sidebar {
          width: 350px;
          background: var(--color-primary-950);
          padding: 20px;
          overflow-y: auto;
          border-right: 1px solid var(--color-primary-800);
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }
        .config-input, .config-select {
          width: 100%;
          padding: 8px;
          background: var(--color-primary-900);
          border: 1px solid var(--color-primary-700);
          color: white;
          border-radius: 4px;
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
        .paper-header {
          text-align: center;
          border-bottom: 2px solid black;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .paper-title {
          font-size: 24pt;
          margin-bottom: 20px;
          color: black !important;
        }
        .paper-meta {
          display: flex;
          justify-content: space-around;
          font-size: 14pt;
          color: black !important;
        }
        .paper-questions {
          display: grid;
          gap: 40px 20px;
          align-content: start;
          color: black !important;
        }
        .paper-q-item {
          font-size: 14pt;
          display: flex;
          align-items: baseline;
          color: black !important;
        }
        .paper-q-item .katex {
          color: black !important;
        }
        .q-num {
          font-weight: bold;
          margin-right: 10px;
          min-width: 25px;
          color: black !important;
        }
        .paper-answers {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px dashed #666;
          color: black !important;
          transform: rotate(180deg);
        }
        /* 答案页的渲染修复，确保黑色 */
        .paper-answers .katex {
           color: black !important;
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
      `}</style>

      {/* 左侧配置栏 */}
      <div className="config-sidebar">
        <button className="btn" style={{ marginBottom: '20px', width: '100%' }} onClick={() => navigate('/')}>
          ← 返回主地图
        </button>
        
        <h2 style={{ marginBottom: '20px', color: 'var(--color-primary-400)' }}>多项式出题器</h2>

        <div className="form-group">
          <label>题型与技巧选择 (输入数量)</label>
          <div className="type-row">
            <span>合并同类项</span>
            <input type="number" min="0" max="20" value={config.counts.like_terms} onChange={e => setConfig({...config, counts: {...config.counts, like_terms: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>单项式 × 多项式</span>
            <input type="number" min="0" max="20" value={config.counts.distributive} onChange={e => setConfig({...config, counts: {...config.counts, distributive: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>多项式 × 多项式</span>
            <input type="number" min="0" max="20" value={config.counts.poly_poly} onChange={e => setConfig({...config, counts: {...config.counts, poly_poly: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>多项式 ÷ 单项式</span>
            <input type="number" min="0" max="20" value={config.counts.divide_monomial} onChange={e => setConfig({...config, counts: {...config.counts, divide_monomial: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
          <div className="type-row">
            <span>多项式 ÷ 多项式</span>
            <input type="number" min="0" max="20" value={config.counts.divide_binomial} onChange={e => setConfig({...config, counts: {...config.counts, divide_binomial: parseInt(e.target.value) || 0}})} className="config-input number-input" />
          </div>
        </div>

        <div className="form-group">
          <label>元数 (字母种类数)</label>
          <select 
            className="config-select" 
            value={config.varCount} 
            onChange={e => setConfig({...config, varCount: parseInt(e.target.value)})}
          >
            <option value={1}>1元 (例：x)</option>
            <option value={2}>2元 (例：x, y)</option>
            <option value={3}>3元 (例：x, y, z)</option>
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              checked={config.nested}
              onChange={e => setConfig({...config, nested: e.target.checked})}
            />
            合并同类项包含括号嵌套
          </label>
        </div>

        <hr style={{ borderColor: 'var(--color-primary-800)', margin: '20px 0' }} />

        <div className="form-group">
          <label>排版列数</label>
          <select 
            className="config-select" 
            value={config.columns} 
            onChange={e => setConfig({...config, columns: parseInt(e.target.value)})}
          >
            <option value={1}>1 列 (适合长题目)</option>
            <option value={2}>2 列 (标准)</option>
            <option value={3}>3 列 (紧凑)</option>
          </select>
        </div>

        <div className="form-group">
          <label>主标题</label>
          <input className="config-input" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} />
        </div>
        

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" checked={config.showAnswers} onChange={e => setConfig({...config, showAnswers: e.target.checked})} />
            在试卷末尾附带答案
          </label>
        </div>

        <button className="btn" style={{ width: '100%', padding: '15px', marginTop: '20px', background: 'var(--color-success)', color: 'black' }} onClick={handleGenerate}>
          生成试卷
        </button>
        
        <button className="btn" style={{ width: '100%', padding: '15px', marginTop: '10px' }} onClick={handlePrint} disabled={!paper}>
          🖨️ 打印试卷 (Ctrl+P)
        </button>
      </div>

      {/* 右侧预览区 */}
      <div className="print-area">
        {paper ? (
          <div className="paper-container" ref={printRef}>
            <div className="paper-header">
              <div className="paper-title">{config.title}</div>
              <div className="paper-meta">
                <span>{config.subtitle.split('  ')[0]}</span>
                <span>{config.subtitle.split('  ')[1]}</span>
                <span>{config.subtitle.split('  ')[2]}</span>
              </div>
            </div>

            <div className="paper-questions" style={{ gridTemplateColumns: `repeat(${config.columns}, 1fr)` }}>
              {paper.map((q, i) => (
                <div key={i} className="paper-q-item">
                  <span className="q-num">{i + 1}.</span>
                  <TextWithMath text={`$${q.q}$`} />
                </div>
              ))}
            </div>

            {config.showAnswers && (
              <div className="paper-answers">
                <h3 style={{ marginBottom: '15px', color: 'black' }}>参考答案</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {paper.map((q, i) => (
                    <div key={i} style={{ fontSize: '10pt', color: 'black' }}>
                      <b>{i + 1}.</b> <TextWithMath text={`$${q.ans}$`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#aaa', marginTop: '100px', fontSize: '1.2rem' }}>
            请在左侧配置并点击“生成试卷”
          </div>
        )}
      </div>
    </div>
  );
};

export default PolyGeneratorPage;
