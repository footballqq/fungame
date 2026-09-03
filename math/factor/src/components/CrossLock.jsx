import React, { useState } from 'react';
import MathText from './MathText';

const CrossLock = ({ target, onSolve }) => {
  // target e.g. { a: 6, b: 7, c: 2, equation: "6x^2 + 7x + 2" }
  // Correct answer for 6x^2+7x+2: (2x+1)(3x+2). So a1=2, a2=3, c1=1, c2=2. 2*2 + 3*1 = 4+3 = 7.
  
  const [a1, setA1] = useState(1);
  const [a2, setA2] = useState(1);
  const [c1, setC1] = useState(1);
  const [c2, setC2] = useState(1);

  const currentA = a1 * a2;
  const currentC = c1 * c2;
  const currentB = (a1 * c2) + (a2 * c1);

  const isSolved = currentA === target.a && currentB === target.b && currentC === target.c;

  return (
    <div className="card" style={{ border: isSolved ? '2px solid var(--color-success)' : '1px solid var(--color-primary-600)', marginBottom: '20px' }}>
      <h3>🔒 十字相乘密码锁</h3>
      <p>拨动数字盘，使首尾相乘满足目标方程，且**十字交叉相乘之和**等于中间项！</p>
      <div style={{ margin: '15px 0', fontSize: '1.2rem', textAlign: 'center' }}>
        目标：<MathText content={target.equation} />
      </div>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center', margin: '30px 0' }}>
        
        {/* a1, a2 控制 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn" style={{ padding: '2px 8px' }} onClick={() => setA1(a1 - 1)}>▼</button>
            <span style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}>{a1}</span>
            <button className="btn" style={{ padding: '2px 8px' }} onClick={() => setA1(a1 + 1)}>▲</button>
            <span style={{ color: 'var(--color-primary-400)' }}>x</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn" style={{ padding: '2px 8px' }} onClick={() => setA2(a2 - 1)}>▼</button>
            <span style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}>{a2}</span>
            <button className="btn" style={{ padding: '2px 8px' }} onClick={() => setA2(a2 + 1)}>▲</button>
            <span style={{ color: 'var(--color-primary-400)' }}>x</span>
          </div>
        </div>

        {/* 交叉线与结果 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--color-accent-400)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>✖</div>
        </div>

        {/* c1, c2 控制 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn" style={{ padding: '2px 8px' }} onClick={() => setC1(c1 - 1)}>▼</button>
            <span style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}>{c1}</span>
            <button className="btn" style={{ padding: '2px 8px' }} onClick={() => setC1(c1 + 1)}>▲</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn" style={{ padding: '2px 8px' }} onClick={() => setC2(c2 - 1)}>▼</button>
            <span style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}>{c2}</span>
            <button className="btn" style={{ padding: '2px 8px' }} onClick={() => setC2(c2 + 1)}>▲</button>
          </div>
        </div>

      </div>

      <div style={{ background: 'var(--color-primary-950)', padding: '15px', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '10px' }}>
          <div>
            <div style={{ color: 'var(--color-primary-400)', fontSize: '0.9rem' }}>二次项 ({target.a}x²)</div>
            <div style={{ color: currentA === target.a ? 'var(--color-success)' : 'var(--color-wrong)' }}>{a1} × {a2} = {currentA}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-primary-400)', fontSize: '0.9rem' }}>一次项 ({target.b}x)</div>
            <div style={{ color: currentB === target.b ? 'var(--color-success)' : 'var(--color-wrong)' }}>({a1}×{c2}) + ({a2}×{c1}) = {currentB}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-primary-400)', fontSize: '0.9rem' }}>常数项 ({target.c})</div>
            <div style={{ color: currentC === target.c ? 'var(--color-success)' : 'var(--color-wrong)' }}>{c1} × {c2} = {currentC}</div>
          </div>
        </div>
      </div>

      {isSolved && (
        <div style={{ textAlign: 'center', marginTop: '20px', animation: 'popIn 0.5s ease-out' }}>
          <h3 style={{ color: 'var(--color-success)' }}>🔓 密码锁已开启！</h3>
          <p>分解结果：<MathText content={`(${a1}x + ${c1})(${a2}x + ${c2})`} /></p>
          <button className="btn" style={{ marginTop: '15px' }} onClick={onSolve}>继续前进</button>
        </div>
      )}

    </div>
  );
};

export default CrossLock;
