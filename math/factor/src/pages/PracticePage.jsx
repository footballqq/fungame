import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizPool } from '../data/quizzes';
import useUserStore from '../store/userStore';
import { TextWithMath } from '../components/ContentBlock';

import { generateDynamicQuiz } from '../utils/DynamicGenerator';

const PracticePage = () => {
  const { addXP, recordMistake } = useUserStore();
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(null);
  const [answered, setAnswered] = useState(null);
  const [streak, setStreak] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const loadNewQuestion = () => {
    setAnswered(null);
    setInputValue('');
    // 80% dynamic infinite questions, 20% classic pdf static questions
    if (Math.random() > 0.2) {
      setCurrentQ(generateDynamicQuiz());
    } else {
      const q = quizPool[Math.floor(Math.random() * quizPool.length)];
      setCurrentQ(q);
    }
  };

  useEffect(() => {
    loadNewQuestion();
  }, []);

  const handleChoiceAnswer = (optIndex, isCorrect) => {
    if (answered) return;
    setAnswered({ optIndex, isCorrect });
    
    if (isCorrect) {
      setStreak(s => s + 1);
      addXP(5 + Math.min(streak, 5)); // Bonus XP for streak
    } else {
      setStreak(0);
      recordMistake(currentQ);
    }
  };

  const handleInputSubmit = () => {
    if (answered) return;
    if (!inputValue.trim()) return;

    // strip all spaces from input for matching
    const normalizedInput = inputValue.replace(/\s+/g, '');
    const isCorrect = currentQ.correctAnswers.includes(normalizedInput);

    setAnswered({ isCorrect });
    
    if (isCorrect) {
      setStreak(s => s + 1);
      addXP(5 + Math.min(streak, 5));
    } else {
      setStreak(0);
      recordMistake(currentQ);
    }
  };

  if (!currentQ) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: 'var(--color-primary-400)' }}>
        <span>
          <button className="btn" style={{ padding: '4px 8px', marginRight: '10px', fontSize: '0.9rem' }} onClick={() => navigate('/')}>← 返回主地图</button>
          无限训练场
        </span>
        <span style={{ color: streak > 0 ? 'var(--color-star)' : 'inherit' }}>
          连胜：{streak} 🔥
        </span>
      </div>

      <div className="card" style={{ borderTop: '4px solid var(--color-star)' }}>
        <h2 style={{ marginBottom: '20px' }}><TextWithMath text={currentQ.question} /></h2>
        
        {currentQ.type === 'input' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={answered !== null}
              placeholder="请输入分解结果，例如 (x+1)(x+2)"
              style={{
                padding: '15px',
                fontSize: '1.2rem',
                background: 'var(--color-primary-950)',
                color: 'white',
                border: '1px solid var(--color-primary-600)',
                borderRadius: '8px',
                fontFamily: 'monospace'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleInputSubmit();
              }}
            />
            {!answered && (
              <button className="btn" onClick={handleInputSubmit}>提交答案</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {currentQ.options.map((opt, i) => {
              let bg = 'var(--color-primary-800)';
              if (answered) {
                if (i === answered.optIndex && opt.isCorrect) bg = 'rgba(34,197,94,0.2)';
                else if (i === answered.optIndex && !opt.isCorrect) bg = 'rgba(239,68,68,0.2)';
                else if (opt.isCorrect) bg = 'rgba(34,197,94,0.1)';
              }

              return (
                <button 
                  key={i}
                  style={{
                    padding: '15px',
                    background: bg,
                    color: 'var(--text-primary)',
                    border: '1px solid var(--color-primary-600)',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: answered ? 'default' : 'pointer',
                    fontSize: '1.1rem'
                  }}
                  onClick={() => handleChoiceAnswer(i, opt.isCorrect)}
                >
                  <TextWithMath text={opt.text} />
                </button>
              )
            })}
          </div>
        )}

        {answered && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'var(--color-primary-900)', borderRadius: '8px' }}>
            {answered.isCorrect ? (
              <div style={{ color: 'var(--color-success)', marginBottom: '10px', fontWeight: 'bold' }}>✅ 回答正确！</div>
            ) : (
              <div style={{ color: 'var(--color-wrong)', marginBottom: '10px' }}>
                <strong>❌ 回答错误！</strong> 标准答案是：
                <span style={{ marginLeft: '10px', color: 'var(--text-primary)' }}>
                  <TextWithMath text={currentQ.type === 'input' ? currentQ.displayAnswer : currentQ.options.find(o => o.isCorrect).text} />
                </span>
              </div>
            )}
            
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              解析：<TextWithMath text={currentQ.type === 'input' ? currentQ.explanation : (currentQ.options[answered.optIndex]?.explanation || currentQ.explanation || "暂无详细解析")} />
            </p>
            <button className="btn" style={{ marginTop: '15px', width: '100%' }} onClick={loadNewQuestion}>
              下一题 ▼
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;
