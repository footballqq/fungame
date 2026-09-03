import React, { useState } from 'react';
import MathText from './MathText';
import { CheckCircle, XCircle } from 'lucide-react';
import useUserStore from '../store/userStore';
import AlgebraTiles from './AlgebraTiles';
import CrossLock from './CrossLock';
import DivisionMachine from './DivisionMachine';
import TermScanner from './TermScanner';
import LongDivisionDemo from './LongDivisionDemo';

// Helper component to render text containing $inline math$
export const TextWithMath = ({ text }) => {
  if (typeof text !== 'string') return text;
  
  // Also handle basic bold formatting **text**
  const renderBold = (str, keyPrefix) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const parts = text.split(/(\$.*?\$)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const mathContent = part.slice(1, -1);
          return <MathText key={index} content={mathContent} />;
        }
        return <React.Fragment key={index}>{renderBold(part, index)}</React.Fragment>;
      })}
    </>
  );
};

const ConceptCard = ({ block, onComplete }) => {
  const colorMap = {
    blue: { bg: 'rgba(56,189,248,0.1)', border: '#38bdf8' },
    orange: { bg: 'rgba(251,146,60,0.1)', border: '#fb923c' },
    green: { bg: 'rgba(34,197,94,0.1)', border: '#22c55e' }
  };
  const theme = colorMap[block.color] || colorMap.blue;

  return (
    <div className="card" style={{ background: theme.bg, borderColor: theme.border, marginBottom: '20px', animation: 'fadeIn 0.5s ease-out' }}>
      <h3 style={{ color: theme.border }}><TextWithMath text={block.title} /></h3>
      <div style={{ marginTop: '10px' }}>
        {block.content.map((p, i) => (
          <p key={i} style={{ marginBottom: '8px' }}>
            <TextWithMath text={p} />
          </p>
        ))}
      </div>
      <button className="btn" style={{ marginTop: '15px' }} onClick={onComplete}>我明白了 ▼</button>
    </div>
  );
};

const QuizCard = ({ block, onComplete }) => {
  const { currentUser, recordMistake, recordQuizSuccess } = useUserStore();
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const isAlreadyCompleted = currentUser?.completedQuizzes?.includes(block.question);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (block.options[selected].isCorrect) {
      recordQuizSuccess(block.question);
    } else {
      recordMistake(block); // block is the quiz object {question, options}
    }
  };

  const isCorrect = submitted && block.options[selected].isCorrect;

  return (
    <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--color-star)' }}>
      <h3>💡 知识测验</h3>
      <p style={{ fontSize: '1.1rem', margin: '10px 0' }}><TextWithMath text={block.question} /></p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
        {block.options.map((opt, i) => {
          let bg = 'var(--color-primary-800)';
          if (submitted) {
            if (i === selected && opt.isCorrect) bg = 'rgba(34,197,94,0.2)';
            else if (i === selected && !opt.isCorrect) bg = 'rgba(239,68,68,0.2)';
            else if (opt.isCorrect) bg = 'rgba(34,197,94,0.1)';
          } else if (selected === i) {
            bg = 'var(--color-primary-600)';
          }

          return (
            <div 
              key={i} 
              onClick={() => !submitted && setSelected(i)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: bg,
                border: selected === i && !submitted ? '1px solid var(--color-accent-400)' : '1px solid transparent',
                cursor: submitted ? 'default' : 'pointer'
              }}
            >
              <TextWithMath text={opt.text} />
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button className="btn" style={{ marginTop: '15px' }} onClick={handleSubmit}>提交答案</button>
      )}

      {submitted && (
        <div style={{ marginTop: '15px', padding: '10px', background: 'var(--color-primary-950)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isCorrect ? 'var(--color-success)' : 'var(--color-wrong)', fontWeight: 'bold' }}>
            {isCorrect ? <CheckCircle /> : <XCircle />}
            {isCorrect ? (isAlreadyCompleted ? '回答正确！' : '回答正确！+10 XP') : '回答错误'}
          </div>
          <p style={{ marginTop: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            解析：<TextWithMath text={block.options[selected].explanation} />
          </p>
          <button className="btn" style={{ marginTop: '15px' }} onClick={onComplete}>继续 ▼</button>
        </div>
      )}
    </div>
  );
};

const ContentBlock = ({ block, onComplete }) => {
  if (block.type === 'concept') {
    return <ConceptCard block={block} onComplete={onComplete} />;
  }
  
  if (block.type === 'quiz') {
    return <QuizCard block={block} onComplete={onComplete} />;
  }
  
  if (block.type === 'canvas' && block.animId === 'algebra_tiles') {
    return <AlgebraTiles target={block.target} onSolve={onComplete} />;
  }

  if (block.type === 'canvas' && block.animId === 'cross_lock') {
    return <CrossLock target={block.target} onSolve={onComplete} />;
  }

  if (block.type === 'canvas' && block.animId === 'division_machine') {
    return <DivisionMachine target={block.target} onSolve={onComplete} />;
  }

  if (block.type === 'canvas' && block.animId === 'term_scanner') {
    return <TermScanner target={block.target} onSolve={onComplete} />;
  }

  if (block.type === 'canvas' && block.animId === 'long_division') {
    return <LongDivisionDemo target={block.target} onSolve={onComplete} />;
  }

  // Fallback for story/dialogue
  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <p><TextWithMath text={block.text} /></p>
      <button className="btn" style={{ marginTop: '15px' }} onClick={onComplete}>继续 ▼</button>
    </div>
  )
};

export default ContentBlock;
