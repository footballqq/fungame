import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContentBlock from '../components/ContentBlock';
import chapter0 from '../data/chapter0.json';
import chapter1 from '../data/chapter1.json';
import chapter2 from '../data/chapter2.json';
import chapter3 from '../data/chapter3.json';
import chapter4 from '../data/chapter4.json';
import chapter5 from '../data/chapter5.json';
import base1 from '../data/base1.json';
import base2 from '../data/base2.json';
import base3 from '../data/base3.json';
import useUserStore from '../store/userStore';
import { TextWithMath } from '../components/ContentBlock';

const chapters = {
  'base1': base1,
  'base2': base2,
  'base3': base3,
  '0': chapter0,
  '1': chapter1,
  '2': chapter2,
  '3': chapter3,
  '4': chapter4,
  '5': chapter5
};

const ChapterChallenge = ({ questions, onPassed }) => {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = questions[index % questions.length];
  const total = Math.min(3, questions.length);

  const submit = () => {
    if (selected === null || submitted) return;
    const correct = current.options[selected].isCorrect;
    const nextScore = score + (correct ? 1 : 0);
    setSubmitted(true);
    setScore(nextScore);
    if (index === total - 1) {
      if (nextScore < 2) setFailed(true);
    }
  };

  const next = () => {
    setSelected(null);
    setSubmitted(false);
    setIndex((value) => value + 1);
  };

  const retry = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setSubmitted(false);
    setFailed(false);
  };

  return (
    <div className="card" style={{ marginTop: '24px', border: '2px solid var(--color-star)', background: 'var(--color-primary-900)' }}>
      <h2 style={{ color: 'var(--color-star)', display: 'flex', alignItems: 'center', gap: '8px' }}>⚔️ 本章综合试炼</h2>
      <p>连续完成 {total} 题，至少答对 2 题才能通关。进度：{Math.min(index + 1, total)} / {total}</p>

      {!failed && (
        <>
          <p style={{ fontSize: '1.1rem', margin: '15px 0' }}><TextWithMath text={current.question} /></p>
          {current.options.map((option, optionIndex) => {
            const isSelected = selected === optionIndex;
            const isCorrect = submitted && option.isCorrect;
            const isWrong = submitted && isSelected && !option.isCorrect;
            return (
              <button 
                key={optionIndex} 
                className="btn" 
                disabled={submitted} 
                onClick={() => setSelected(optionIndex)} 
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  marginTop: '10px', 
                  textAlign: 'left', 
                  background: isCorrect ? 'var(--color-success)' : isWrong ? 'var(--color-wrong)' : isSelected ? 'var(--color-primary-600)' : undefined 
                }}
              >
                <TextWithMath text={option.text} />
              </button>
            );
          })}

          {!submitted && (
            <button className="btn" style={{ marginTop: '15px' }} onClick={submit}>确认答案</button>
          )}

          {submitted && (
            <div style={{ marginTop: '15px', padding: '12px', background: 'var(--color-primary-950)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>
                解析：<TextWithMath text={current.options[selected].explanation} />
              </p>
            </div>
          )}

          {submitted && index < total - 1 && (
            <button className="btn" style={{ marginTop: '15px' }} onClick={next}>下一题 ▼</button>
          )}

          {submitted && index === total - 1 && score >= 2 && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(34,197,94,0.15)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--color-success)' }}>
              <h3 style={{ color: 'var(--color-success)', marginBottom: '10px' }}>🎉 试炼通过！得分：{score} / {total}</h3>
              <p style={{ marginBottom: '15px' }}>干得漂亮！你已成功攻克本章综合测试。</p>
              <button className="btn" style={{ fontSize: '1.1rem', padding: '10px 25px' }} onClick={onPassed}>
                🏆 领取消化奖励并通关
              </button>
            </div>
          )}
        </>
      )}

      {failed && (
        <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(239,68,68,0.15)', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-wrong)', fontSize: '1.1rem', marginBottom: '15px' }}>
            本次答对 {score} / {total} 题；未达到通关要求。复盘上方知识点后重新挑战吧！
          </p>
          <button className="btn" onClick={retry}>重新挑战试炼</button>
        </div>
      )}
    </div>
  );
};

const ChapterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const chapterData = chapters[id];
  const { unlockChapter, completeChapter, currentUser } = useUserStore();
  const isAlreadyCompleted = currentUser?.completedChapters?.includes(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentIndex, completed, showChallenge]);

  if (!chapterData) {
    return <div style={{ padding: '2rem' }}>章节不存在</div>;
  }

  const handleNext = () => {
    if (currentIndex < chapterData.blocks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowChallenge(true);
    }
  };

  const handleChallengePassed = () => {
    setShowChallenge(false);
    setCompleted(true);
    completeChapter(id);
    let nextChapterId = "";
    if (id === 'base1') nextChapterId = 'base2';
    else if (id === 'base2') nextChapterId = 'base3';
    else if (id === 'base3') nextChapterId = '0';
    else nextChapterId = (parseInt(id) + 1).toString();
    unlockChapter(nextChapterId);
  };

  const chapterQuestions = chapterData.challengeQuizzes && chapterData.challengeQuizzes.length > 0
    ? chapterData.challengeQuizzes 
    : chapterData.blocks.filter((block) => block.type === 'quiz');

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn" style={{ padding: '4px 12px', marginRight: '15px' }} onClick={() => navigate('/')}>← 返回主地图</button>
        <h1 style={{ margin: 0, color: 'var(--color-accent-400)' }}><TextWithMath text={chapterData.title} /></h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {chapterData.blocks.map((block, index) => (
          <div 
            key={index} 
            style={{ 
              display: index <= currentIndex ? 'block' : 'none',
              animation: index === currentIndex ? 'fadeInUp 0.5s ease-out' : 'none'
            }}
          >
            <ContentBlock block={block} onComplete={handleNext} />
          </div>
        ))}
      </div>

      {!showChallenge && !completed && currentIndex >= chapterData.blocks.length - 1 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="btn" style={{ fontSize: '1.1rem', padding: '10px 25px' }} onClick={() => setShowChallenge(true)}>
            ⚔️ 开始本章综合试炼
          </button>
        </div>
      )}

      {showChallenge && <ChapterChallenge questions={chapterQuestions} onPassed={handleChallengePassed} />}

      {completed && (
        <div style={{ textAlign: 'center', padding: '30px', animation: 'popIn 0.5s ease-out', marginTop: '20px' }}>
          <h2 style={{ color: 'var(--color-star)', fontSize: '2rem', marginBottom: '15px' }}>🎉 本章通关成功！</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--color-success)' }}>干得漂亮！你已全面掌握本章技能。</p>
          <button className="btn" style={{ fontSize: '1.2rem', padding: '10px 30px' }} onClick={() => navigate('/')}>
            返回星球地图
          </button>
        </div>
      )}
      <div ref={bottomRef} style={{ height: '20px' }} />
    </div>
  );
};

export default ChapterPage;
