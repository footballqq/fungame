import React, { useState } from 'react';
import MathText from './MathText';

const AlgebraTiles = ({ target, onSolve }) => {
  // target e.g. { x2: 1, x: 5, c: 6, equation: "x^2 + 5x + 6" }
  
  const [widthX, setWidthX] = useState(1);
  const [width1, setWidth1] = useState(1);
  const [heightX, setHeightX] = useState(1);
  const [height1, setHeight1] = useState(1);

  const currentX2 = widthX * heightX;
  const currentX = widthX * height1 + heightX * width1;
  const currentC = width1 * height1;

  const isSolved = currentX2 === target.x2 && currentX === target.x && currentC === target.c;

  return (
    <div className="card" style={{ border: isSolved ? '2px solid var(--color-success)' : '1px solid var(--color-primary-600)', marginBottom: '20px' }}>
      <h3>🧩 代数拼图：完美矩形</h3>
      <p>请调整矩形的边长，使其面积等于目标多项式：</p>
      <div style={{ margin: '15px 0', fontSize: '1.2rem', textAlign: 'center' }}>
        目标：<MathText content={target.equation} />
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
        
        {/* 控制面板 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <span style={{ display: 'inline-block', width: '80px' }}>宽 (横向)</span>
            <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setWidthX(Math.max(0, widthX - 1))}>-x</button>
            <span style={{ margin: '0 10px' }}>{widthX}x + {width1}</span>
            <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setWidthX(widthX + 1)}>+x</button>
            <button className="btn" style={{ padding: '4px 10px', marginLeft: '10px' }} onClick={() => setWidth1(Math.max(0, width1 - 1))}>-1</button>
            <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setWidth1(width1 + 1)}>+1</button>
          </div>
          <div>
            <span style={{ display: 'inline-block', width: '80px' }}>高 (纵向)</span>
            <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setHeightX(Math.max(0, heightX - 1))}>-x</button>
            <span style={{ margin: '0 10px' }}>{heightX}x + {height1}</span>
            <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setHeightX(heightX + 1)}>+x</button>
            <button className="btn" style={{ padding: '4px 10px', marginLeft: '10px' }} onClick={() => setHeight1(Math.max(0, height1 - 1))}>-1</button>
            <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setHeight1(height1 + 1)}>+1</button>
          </div>
        </div>

      </div>

      {/* 拼图展示区 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        background: 'var(--color-primary-950)', 
        padding: '20px',
        borderRadius: '8px',
        minHeight: '200px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: `${widthX * 60}px ${width1 * 30}px`, gridTemplateRows: `${heightX * 60}px ${height1 * 30}px`, gap: '2px' }}>
          {/* x^2 区域 */}
          <div style={{ background: 'var(--color-accent-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
             {currentX2 > 0 ? <MathText content={`${currentX2}x^2`} /> : ''}
          </div>
          {/* x 区域 (右上) */}
          <div style={{ background: 'var(--color-secondary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
             {width1 * heightX > 0 ? <MathText content={`${width1 * heightX}x`} /> : ''}
          </div>
          {/* x 区域 (左下) */}
          <div style={{ background: 'var(--color-secondary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
             {widthX * height1 > 0 ? <MathText content={`${widthX * height1}x`} /> : ''}
          </div>
          {/* 常数区域 (右下) */}
          <div style={{ background: 'var(--color-star)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
             {currentC > 0 ? currentC : ''}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0', fontSize: '1.2rem', color: isSolved ? 'var(--color-success)' : 'var(--text-primary)' }}>
        当前面积：<MathText content={`${currentX2}x^2 + ${currentX}x + ${currentC}`} />
      </div>

      {isSolved && (
        <div style={{ textAlign: 'center', animation: 'popIn 0.5s ease-out' }}>
          <h3 style={{ color: 'var(--color-success)' }}>🎉 破解成功！</h3>
          <p>因式分解结果：<MathText content={`(${widthX}x + ${width1})(${heightX}x + ${height1})`} /></p>
          <button className="btn" style={{ marginTop: '15px' }} onClick={onSolve}>继续前进</button>
        </div>
      )}

    </div>
  );
};

export default AlgebraTiles;
