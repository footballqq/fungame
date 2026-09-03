import React, { useState } from 'react';
import { TextWithMath } from './ContentBlock';

const LongDivisionDemo = ({ onSolve }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      desc: "初始状态：我们要计算 $(2x^2 + 5x - 3) \\div (2x - 1)$。将被除式写在除号里面，除式写在外面。",
      quotient: "\\phantom{x + 3}", // use phantom for spacing if we used Katex, but let's just use empty or spaces
      qText: " ",
      work: []
    },
    {
      desc: "第一步：看最高次项。用被除式的 $2x^2$ 除以除式的 $2x$，得到 $x$。将 $x$ 写在商的位置（对齐 $x$ 的那列）。",
      qText: "$\\phantom{2x^2 + {}} x$",
      work: []
    },
    {
      desc: "第二步：相乘。用商的 $x$ 乘以整个除式 $(2x - 1)$，得到 $2x^2 - x$，写在被除式对应项的下方。",
      qText: "$\\phantom{2x^2 + {}} x$",
      work: [
        { text: "$2x^2 - x$", line: false }
      ]
    },
    {
      desc: "第三步：相减与下移。上面减下面：$(2x^2 + 5x) - (2x^2 - x) = 6x$。然后把后面的 $-3$ 移下来。",
      qText: "$\\phantom{2x^2 + {}} x$",
      work: [
        { text: "$-(2x^2 - x)$", line: true },
        { text: "$\\phantom{2x^2 + {}} 6x - 3$", line: false }
      ]
    },
    {
      desc: "第四步：重复。用现在的最高项 $6x$ 除以除式的 $2x$，得到 $+3$。写到商里。",
      qText: "$\\phantom{2x^2 + {}} x + 3$",
      work: [
        { text: "$-(2x^2 - x)$", line: true },
        { text: "$\\phantom{2x^2 + {}} 6x - 3$", line: false }
      ]
    },
    {
      desc: "第五步：再次相乘。用 $3$ 乘以 $(2x - 1)$，得到 $6x - 3$。",
      qText: "$\\phantom{2x^2 + {}} x + 3$",
      work: [
        { text: "$-(2x^2 - x)$", line: true },
        { text: "$\\phantom{2x^2 + {}} 6x - 3$", line: false },
        { text: "$\\phantom{2x^2 + {}} 6x - 3$", line: false }
      ]
    },
    {
      desc: "第六步：相减。$(6x - 3) - (6x - 3) = 0$。余数为 0，整除完成！",
      qText: "$\\phantom{2x^2 + {}} x + 3$",
      work: [
        { text: "$-(2x^2 - x)$", line: true },
        { text: "$\\phantom{2x^2 + {}} 6x - 3$", line: false },
        { text: "$- (6x - 3)$", line: true },
        { text: "$\\phantom{2x^2 + 6x - {}} 0$", line: false }
      ]
    }
  ];

  const current = steps[step];

  return (
    <div className="card" style={{ border: step === steps.length - 1 ? '2px solid var(--color-success)' : '1px solid var(--color-primary-600)', marginBottom: '20px' }}>
      <h3>📝 多项式长除法演示</h3>
      
      <div style={{ minHeight: '60px', marginBottom: '20px', padding: '15px', background: 'var(--color-primary-950)', borderRadius: '8px' }}>
        <TextWithMath text={current.desc} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0', fontSize: '1.4rem' }}>
        <div style={{ display: 'inline-block', textAlign: 'left' }}>
          {/* 商 */}
          <div style={{ paddingLeft: '85px', color: 'var(--color-accent-400)', fontWeight: 'bold', minHeight: '30px' }}>
            <TextWithMath text={current.qText} />
          </div>
          {/* 除号及被除式 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ paddingRight: '10px' }}>
              <TextWithMath text={`$2x - 1$`} />
            </div>
            <div style={{ 
              borderLeft: '2px solid var(--text-primary)', 
              borderTop: '2px solid var(--text-primary)', 
              paddingLeft: '15px', 
              paddingTop: '5px',
              paddingBottom: '5px',
              minWidth: '150px'
            }}>
              <TextWithMath text={`$2x^2 + 5x - 3$`} />
            </div>
          </div>
          
          {/* 计算过程 */}
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '85px', width: '150px' }}>
            {current.work.map((w, i) => (
              <div key={i} style={{ 
                borderBottom: w.line ? '2px solid var(--text-primary)' : 'none',
                paddingBottom: w.line ? '5px' : '0',
                marginTop: '5px',
                color: w.line ? 'var(--color-wrong)' : 'var(--text-primary)'
              }}>
                <TextWithMath text={w.text} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button 
          className="btn" 
          disabled={step === 0} 
          onClick={() => setStep(s => s - 1)}
          style={{ background: step === 0 ? 'var(--color-primary-800)' : 'var(--color-primary-600)', opacity: step === 0 ? 0.5 : 1 }}
        >
          上一步
        </button>
        {step < steps.length - 1 ? (
          <button className="btn" onClick={() => setStep(s => s + 1)}>
            下一步
          </button>
        ) : (
          <button className="btn" style={{ background: 'var(--color-success)' }} onClick={onSolve}>
            完成演示 ▼
          </button>
        )}
      </div>
    </div>
  );
};

export default LongDivisionDemo;
