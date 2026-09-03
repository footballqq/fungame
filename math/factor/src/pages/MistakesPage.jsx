import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { TextWithMath } from '../components/ContentBlock';
import { CheckCircle, XCircle } from 'lucide-react';

const MistakeItem = ({ m, onFix }) => {
  const { addXP } = useUserStore();
  const [answered, setAnswered] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const handleChoiceAnswer = (optionIndex, isCorrect) => {
    if (answered) return;
    setAnswered({ optionIndex, isCorrect });
    
    if (isCorrect) {
      addXP(5);
      setTimeout(() => onFix(m.question), 2000);
    }
  };

  const handleInputSubmit = () => {
    if (answered) return;
    if (!inputValue.trim()) return;

    const normalizedInput = inputValue.replace(/\s+/g, '');
    const isCorrect = m.correctAnswers.includes(normalizedInput);

    setAnswered({ isCorrect });
    
    if (isCorrect) {
      addXP(5);
      setTimeout(() => onFix(m.question), 2000);
    }
  };

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--color-wrong)' }}>
      <h3 style={{ marginBottom: '15px' }}><TextWithMath text={m.question} /></h3>
      
      {m.type === 'input' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={answered !== null}
            placeholder="请输入分解结果..."
            style={{ padding: '12px', fontSize: '1.1rem', background: 'var(--color-primary-950)', color: 'white', border: '1px solid var(--color-primary-600)', borderRadius: '8px', fontFamily: 'monospace' }}
            onKeyDown={e => { if (e.key === 'Enter') handleInputSubmit(); }}
          />
          {!answered && <button className="btn" onClick={handleInputSubmit}>提交答案</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {m.options.map((opt, oIndex) => {
            let bg = 'var(--color-primary-800)';
            if (answered) {
              if (oIndex === answered.optionIndex && opt.isCorrect) bg = 'rgba(34,197,94,0.2)';
              else if (oIndex === answered.optionIndex && !opt.isCorrect) bg = 'rgba(239,68,68,0.2)';
              else if (opt.isCorrect) bg = 'rgba(34,197,94,0.1)';
            }
            
            return (
              <button
                key={oIndex}
                style={{
                  padding: '12px', background: bg, color: 'var(--text-primary)', border: '1px solid var(--color-primary-600)',
                  borderRadius: '8px', textAlign: 'left', cursor: answered ? 'default' : 'pointer'
                }}
                onClick={() => handleChoiceAnswer(oIndex, opt.isCorrect)}
              >
                <TextWithMath text={opt.text} />
              </button>
            );
          })}
        </div>
      )}

      {answered && (
        <div style={{ marginTop: '15px', padding: '10px', background: 'var(--color-primary-950)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: answered.isCorrect ? 'var(--color-success)' : 'var(--color-wrong)' }}>
            {answered.isCorrect ? <CheckCircle /> : <XCircle />}
            {answered.isCorrect ? '回答正确！这道题将被移除。' : '又错了哦，再仔细看看解析！'}
          </div>
          {!answered.isCorrect && (
            <div style={{ marginTop: '5px' }}>
              <strong>标准答案：</strong>
              <TextWithMath text={m.type === 'input' ? m.displayAnswer : m.options.find(o => o.isCorrect).text} />
            </div>
          )}
          <p style={{ marginTop: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            解析：<TextWithMath text={m.type === 'input' ? m.explanation : (m.options[answered.optionIndex]?.explanation || m.explanation || "暂无详细解析")} />
          </p>
        </div>
      )}
    </div>
  );
};

const MistakesPage = () => {
  const { currentUser, removeMistake } = useUserStore();
  const navigate = useNavigate();

  if (!currentUser) return null;
  const mistakes = currentUser.mistakes || [];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn" style={{ padding: '4px 12px', marginRight: '15px' }} onClick={() => navigate('/')}>← 返回主地图</button>
        <h1 style={{ margin: 0, color: 'var(--color-accent-400)' }}>错题本</h1>
      </div>

      {mistakes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-primary-400)' }}>
          <h2>🎉 太棒了，你现在没有错题！</h2>
          <p>继续保持哦~</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p>你有 {mistakes.length} 道错题待消灭。答对即可将它们从错题本中移除！</p>
          {mistakes.map((m, index) => (
            <MistakeItem key={`${m.question}-${index}`} m={m} onFix={removeMistake} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MistakesPage;
