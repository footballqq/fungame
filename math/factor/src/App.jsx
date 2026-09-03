// codex: 2026-09-03 add version watermark in layout footer
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useUserStore from './store/userStore';

import UsersPage from './pages/UsersPage';
import ChapterPage from './pages/ChapterPage';
import ExamPage from './pages/ExamPage';
import MistakesPage from './pages/MistakesPage';
import PracticePage from './pages/PracticePage';
import GeneratorPage from './pages/GeneratorPage';
import PolyGeneratorPage from './pages/PolyGeneratorPage';

const Home = () => {
  const { currentUser } = useUserStore();
  const mistakeCount = currentUser?.mistakes?.length || 0;

  return (
    <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
      <h1>代数星系 (Algebra Planet)</h1>
      <p>欢迎来到因式分解的试炼之地。</p>
      <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--color-success)', borderRadius: '8px' }}>
        <h3 style={{ color: 'var(--color-success)', marginBottom: '15px' }}>🔰 前置营地 (多项式运算基础)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <button className="btn" style={{ background: 'var(--color-success)', color: 'black' }} onClick={() => window.location.hash = '/chapter/base1'}>Base 1: 同类项与加减法</button>
          <button className="btn" style={{ background: 'var(--color-success)', color: 'black' }} onClick={() => window.location.hash = '/chapter/base2'}>Base 2: 单项式乘法</button>
          <button className="btn" style={{ background: 'var(--color-success)', color: 'black' }} onClick={() => window.location.hash = '/chapter/base3'}>Base 3: 多项式乘法</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
        <button className="btn" onClick={() => window.location.hash = '/chapter/0'}>第 0 关：项数雷达站</button>
        <button className="btn" onClick={() => window.location.hash = '/chapter/1'}>第 1 关：两项式的秘密</button>
        <button className="btn" onClick={() => window.location.hash = '/chapter/2'}>第 2 关：三项式与代数拼图</button>
        <button className="btn" onClick={() => window.location.hash = '/chapter/3'}>第 3 关：复杂三项式</button>
        <button className="btn" onClick={() => window.location.hash = '/chapter/4'}>第 4 关：高次降维打击</button>
        <button className="btn" onClick={() => window.location.hash = '/chapter/5'}>第 5 关：绝对领域</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
        <button className="btn" style={{ background: 'var(--color-primary-600)' }} onClick={() => window.location.hash = '/practice'}>
          ⚔️ 无限训练场
        </button>
        <button className="btn" style={{ background: 'var(--color-primary-600)', position: 'relative' }} onClick={() => window.location.hash = '/mistakes'}>
          📖 错题本
          {mistakeCount > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-wrong)', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem' }}>
              {mistakeCount}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
        <button className="btn" style={{ background: 'var(--color-success)' }} onClick={() => window.location.hash = '/generator'}>
          🖨️ 因式分解 (出卷器)
        </button>
        <button className="btn" style={{ background: 'var(--color-success)' }} onClick={() => window.location.hash = '/poly-generator'}>
          🖨️ 多项式计算 (出卷器)
        </button>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', border: '1px solid var(--color-star)', borderRadius: '8px' }}>
        <h2 style={{ color: 'var(--color-star)' }}>终极试炼</h2>
        <p>当你通关所有星球后，点击下方进入最终考核！</p>
        <button className="btn" style={{ background: 'var(--color-star)', color: 'black', marginTop: '10px' }} onClick={() => window.location.hash = '/exam'}>开始考核</button>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const { currentUser, xp } = useUserStore();
  return (
    <div>
      <nav style={{ padding: '1rem 2rem', background: 'var(--color-primary-900)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-primary-800)' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-accent-400)', cursor: 'pointer' }} onClick={() => window.location.hash = '/'}>代数星系</h2>
        <div>
          <span style={{ marginRight: '15px', cursor: 'pointer' }} onClick={() => window.location.hash = '/users'}>👤 {currentUser?.name || '未登录'}</span>
          <span style={{ color: 'var(--color-star)' }}>⭐ {xp}</span>
        </div>
      </nav>
      <main>
        {children}
      </main>
      <footer style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2rem' }}>
        🪐 代数星系 · 因式分解探险 | Ver: 2026.09.03-v2
      </footer>
    </div>
  )
}

function App() {
  const { initStore, currentUser } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initStore();
    setLoading(false);
  }, [initStore]);

  if (loading) return null;

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={currentUser ? <Home /> : <Navigate to="/users" />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/chapter/:id" element={<ChapterPage />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/mistakes" element={<MistakesPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/generator" element={<GeneratorPage />} />
          <Route path="/poly-generator" element={<PolyGeneratorPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
