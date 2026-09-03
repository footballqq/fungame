import React, { useState } from 'react';
import MathText from './MathText';

const TermScanner = ({ target, onSolve }) => {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const item = target.items[index];
  const isFinished = index >= target.items.length;

  const classify = (count) => {
    if (result || isFinished) return;
    const isCorrect = count === item.count;
    setResult(isCorrect);
  };

  const next = () => {
    setResult(null);
    setIndex((current) => current + 1);
  };

  if (isFinished) {
    return (
      <div className="card" style={{ textAlign: 'center', border: '2px solid var(--color-success)' }}>
        <h3 style={{ color: 'var(--color-success)' }}>📡 扫描完成！</h3>
        <p>先数清项数，再选择合适的因式分解方法。</p>
        <button className="btn" onClick={onSolve}>继续前进</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--color-accent-400)' }}>
      <h3>📡 项数扫描仪</h3>
      <p>扫描表达式中由加号或减号隔开的项（括号内整体暂时不拆开）。</p>
      <div style={{ margin: '24px 0', textAlign: 'center', fontSize: '1.5rem' }}>
        <MathText content={item.expression} />
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map((count) => (
          <button key={count} className="btn" disabled={result !== null} onClick={() => classify(count)}>
            {count === 4 ? '4 项及以上' : `${count} 项`}
          </button>
        ))}
      </div>
      {result !== null && (
        <div style={{ marginTop: '18px', textAlign: 'center', color: result ? 'var(--color-success)' : 'var(--color-wrong)' }}>
          <p>{result ? '✅ 正确！' : `❌ 这是一道 ${item.count} 项式，再数一次。`}</p>
          <button className="btn" onClick={result ? next : () => setResult(null)}>
            {result ? '下一题 ▼' : '重新扫描'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TermScanner;
