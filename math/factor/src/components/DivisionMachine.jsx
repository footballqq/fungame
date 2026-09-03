import React, { useState } from 'react';
import MathText from './MathText';
import { TextWithMath } from './ContentBlock';

const DivisionMachine = ({ target, onSolve }) => {
  // target e.g. { coeffs: [1, -4, 1, 6], root: 2, equation: "x^3 - 4x^2 + x + 6" }
  const [guess, setGuess] = useState("");
  const [processSteps, setProcessSteps] = useState(null);
  const [solved, setSolved] = useState(false);

  const handleTest = () => {
    const root = parseInt(guess);
    if (isNaN(root)) {
      alert('请输入数字作为测试根');
      return;
    }

    // Run synthetic division
    const c = target.coeffs;
    let current = c[0];
    const steps = [
      { drop: c[0], mult: null, add: c[0] }
    ];

    for (let i = 1; i < c.length; i++) {
      const mult = current * root;
      current = c[i] + mult;
      steps.push({ drop: c[i], mult, add: current });
    }

    setProcessSteps({ root, steps });
    if (current === 0) {
      setSolved(true);
    } else {
      setSolved(false);
    }
  };

  return (
    <div className="card" style={{ border: solved ? '2px solid var(--color-success)' : '1px solid var(--color-primary-600)', marginBottom: '20px' }}>
      <h3>⚙️ 多项式降维除法机 (综合除法)</h3>
      <p><TextWithMath text="面对高次多项式，我们需要“猜”一个根 $x=k$（让多项式等于0的数），然后丢进机器里进行降维。" /></p>
      
      <div style={{ margin: '15px 0', fontSize: '1.2rem', textAlign: 'center' }}>
        猎物：<MathText content={target.equation} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
        <input 
          type="number" 
          value={guess} 
          onChange={e => setGuess(e.target.value)} 
          placeholder="输入猜测的根 k (如 1, -1, 2, 3)"
          style={{ padding: '8px 12px', background: 'var(--color-primary-950)', color: 'white', border: '1px solid var(--color-primary-600)', borderRadius: '4px' }}
        />
        <button className="btn" onClick={handleTest}>⚙️ 启动机器进行除法</button>
      </div>

      {processSteps && (
        <div style={{ marginTop: '30px', background: 'var(--color-primary-950)', padding: '20px', borderRadius: '8px', overflowX: 'auto' }}>
          <h4 style={{ textAlign: 'center', color: 'var(--color-primary-400)', marginBottom: '20px' }}>综合除法流水线 (测试根: {processSteps.root})</h4>
          
          <table style={{ margin: '0 auto', borderCollapse: 'collapse', textAlign: 'center' }}>
            <tbody>
              <tr>
                <td style={{ padding: '10px', borderRight: '2px solid var(--color-primary-600)' }}></td>
                {target.coeffs.map((c, i) => (
                  <td key={i} style={{ padding: '10px 20px', fontSize: '1.2rem' }}>{c}</td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderRight: '2px solid var(--color-primary-600)', borderBottom: '2px solid var(--text-primary)' }}>
                  <span style={{ color: 'var(--color-accent-400)', fontWeight: 'bold' }}>× {processSteps.root}</span>
                </td>
                {processSteps.steps.map((step, i) => (
                  <td key={i} style={{ padding: '10px 20px', color: 'var(--color-primary-400)', borderBottom: '2px solid var(--text-primary)' }}>
                    {step.mult !== null ? step.mult : ''}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderRight: '2px solid var(--color-primary-600)' }}></td>
                {processSteps.steps.map((step, i) => {
                  const isRemainder = i === processSteps.steps.length - 1;
                  const color = isRemainder ? (step.add === 0 ? 'var(--color-success)' : 'var(--color-wrong)') : 'var(--text-primary)';
                  return (
                    <td key={i} style={{ padding: '10px 20px', fontSize: '1.2rem', fontWeight: 'bold', color }}>
                      {step.add}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
          
          <div style={{ textAlign: 'center', marginTop: '15px', color: 'var(--color-primary-400)' }}>
            ↓ 最终余数 ↓
          </div>
          <div style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: solved ? 'var(--color-success)' : 'var(--color-wrong)' }}>
            {processSteps.steps[processSteps.steps.length - 1].add}
          </div>

          {!solved && (
            <p style={{ textAlign: 'center', color: 'var(--color-wrong)', marginTop: '15px' }}>
              <TextWithMath text={`余数不为 0！说明 $(x - ${processSteps.root})$ 不是它的因式。请重新猜根！`} />
            </p>
          )}

          {solved && (
            <div style={{ textAlign: 'center', marginTop: '20px', animation: 'popIn 0.5s ease-out' }}>
              <h3 style={{ color: 'var(--color-success)' }}>🎉 降维成功！</h3>
              <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                <TextWithMath text={`原式被成功分解出 $(x - ${processSteps.root})$。`} />
              </p>
              <p>剩下的降次多项式（商）系数为：{processSteps.steps.slice(0, -1).map(s => s.add).join(', ')}</p>
              <button className="btn" style={{ marginTop: '15px' }} onClick={onSolve}>继续前进</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DivisionMachine;

