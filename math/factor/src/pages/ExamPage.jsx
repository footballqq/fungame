import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizPool } from '../data/quizzes';
import useUserStore from '../store/userStore';
import { TextWithMath } from '../components/ContentBlock';

const ExamPage = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const { recordMistake, completeChapter } = useUserStore();
  const navigate = useNavigate();

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      recordMistake(quizPool[currentQ]);
    }
    
    if (currentQ < quizPool.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setFinished(true);
      if (score + (isCorrect ? 1 : 0) >= 4) { // pass score
        completeChapter('exam', 100);
      }
    }
  };

  if (finished) {
    const passed = score >= 4;
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: passed ? 'var(--color-success)' : 'var(--color-wrong)', fontSize: '3rem' }}>
          {passed ? '🏆 试炼通过！' : '💀 试炼失败'}
        </h1>
        <p style={{ fontSize: '1.5rem', margin: '20px 0' }}>你的得分：{score} / {quizPool.length}</p>
        {passed && <p>恭喜你获得了 100 XP 终极奖励！你已经精通了因式分解，为线性代数打下了坚实基础！</p>}
        {!passed && <p>没关系，多练习几遍再来挑战吧！</p>}
        <button className="btn" style={{ marginTop: '30px' }} onClick={() => navigate('/')}>
          返回星系地图
        </button>
      </div>
    );
  }

  const q = quizPool[currentQ];

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'var(--color-primary-400)' }}>
        <span>
          <button className="btn" style={{ padding: '4px 8px', marginRight: '10px', fontSize: '0.9rem' }} onClick={() => navigate('/')}>← 返回</button>
          终极考核
        </span>
        <span>进度：{currentQ + 1} / {quizPool.length}</span>
      </div>
      <div className="card" style={{ borderTop: '4px solid var(--color-accent-400)' }}>
        <h2 style={{ marginBottom: '20px' }}><TextWithMath text={q.question} /></h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {q.options.map((opt, i) => (
            <button 
              key={i}
              style={{
                padding: '15px',
                background: 'var(--color-primary-800)',
                color: 'var(--text-primary)',
                border: '1px solid var(--color-primary-600)',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '1.1rem'
              }}
              onClick={() => handleAnswer(opt.isCorrect)}
            >
              <TextWithMath text={opt.text} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
