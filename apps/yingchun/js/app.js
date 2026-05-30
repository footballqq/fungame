// codex: 2026-05-30 首页新增“每日一题”，用确定性随机挑选一题并支持开始练习/换一题
// 主应用：路由 + 页面渲染
console.log('app.js loading...');
import { loadIndex, loadProblems, loadAllProblems, filterProblems, getExamProblems, getImagePath, getPageImagePath, setDataRoot } from './problem.js';
import { getSettings, saveSettings, getProgress, getDone, getWrong, getHistory, recordAnswer, getExams, saveExams, exportData, importData, runMigrations } from './store.js';
import { formatTime, topicName, difficultyName, stageName, problemId, today, sample, gradeAnswer } from './utils.js';

let currentPage = 'home';
let practiceState = null;  // { problems, index, answers, startTime, timers }
let examState = null;
let _globalDelegates = { chips: false, exam_refresh: false, keydown: false };
let dailyState = { dateKey: '', offset: 0, problem: null, error: '' };

runMigrations();
// Optional: switch to yingchun2 dataset by adding ?db=y2 to URL.
try {
  const params = new URLSearchParams(location.search);
  if (params.get('db') === 'y2') setDataRoot('data_y2');
} catch {}

// Optional: route heavy images via external gateway (e.g. Cloudflare Worker + R2).
// Priority: URL ?imgRoot=... > window.IMG_ROOT > auto default (for y2 on circlecal).
let IMG_ROOT = '';
try {
  const params = new URLSearchParams(location.search);
  IMG_ROOT = (params.get('imgRoot') || '').trim();
} catch {}
if (!IMG_ROOT && typeof window !== 'undefined' && typeof window.IMG_ROOT === 'string') {
  IMG_ROOT = (window.IMG_ROOT || '').trim();
}
if (!IMG_ROOT) {
  try {
    const params = new URLSearchParams(location.search);
    const db = params.get('db');
    const isPages = (location.hostname || '').endsWith('.pages.dev');
    if (db === 'y2' && isPages) IMG_ROOT = 'https://r2-secure-gateway.qdigest.workers.dev';
  } catch {}
}
if (IMG_ROOT.endsWith('/')) IMG_ROOT = IMG_ROOT.slice(0, -1);

function resolveImgSrc(src) {
  if (!src) return src;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (!IMG_ROOT) return src;
  // Only rewrite yingchun2 image paths by default to avoid surprising other datasets.
  if (src.startsWith('images_y2/')) return `${IMG_ROOT}/${src}`;
  return src;
}

// ---- Loading Overlay (for first load / slow network) ----
function ensureLoadingOverlay() {
  let el = document.getElementById('loadingOverlay');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'loadingOverlay';
  el.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:9999;padding:16px;';
  el.innerHTML = `
    <div style="width:min(520px,92vw);background:var(--bg-card-solid);border:1px solid var(--glass-border);border-radius:12px;padding:16px;box-shadow:var(--shadow)">
      <div style="font-weight:600;margin-bottom:8px" id="loadingTitle">加载中…</div>
      <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:10px" id="loadingText">首次进入可能需要加载题库数据，请耐心等待。</div>
      <div style="height:10px;background:var(--bg-input);border-radius:999px;overflow:hidden;border:1px solid var(--glass-border)">
        <div id="loadingBar" style="height:100%;width:12%;background:var(--accent);transition:width .2s ease"></div>
      </div>
      <div style="margin-top:8px;color:var(--text-muted);font-size:0.8rem" id="loadingPct"> </div>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

function showLoading({ title = '加载中…', text = '首次进入可能需要加载题库数据，请耐心等待。', pct = null } = {}) {
  const el = ensureLoadingOverlay();
  el.style.display = 'flex';
  const t = document.getElementById('loadingTitle');
  const tx = document.getElementById('loadingText');
  const bar = document.getElementById('loadingBar');
  const pctEl = document.getElementById('loadingPct');
  if (t) t.textContent = title;
  if (tx) tx.textContent = text;
  if (bar) bar.style.width = pct === null ? '12%' : `${Math.max(3, Math.min(100, pct))}%`;
  if (pctEl) pctEl.textContent = pct === null ? '' : `${Math.round(pct)}%`;
}

function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}

async function nextFrame() {
  return new Promise(r => requestAnimationFrame(() => r()));
}

// ---- Daily Problem (home) ----
function getDbKey() {
  try {
    const params = new URLSearchParams(location.search);
    return (params.get('db') || 'default').trim() || 'default';
  } catch {
    return 'default';
  }
}

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hashSeed(str) {
  // FNV-1a
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailyOffset() {
  try {
    const key = `yc_daily_offset_${getDbKey()}`;
    const v = Number(localStorage.getItem(key) || '0');
    return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  } catch {
    return 0;
  }
}

function setDailyOffset(v) {
  try {
    const key = `yc_daily_offset_${getDbKey()}`;
    localStorage.setItem(key, String(Math.max(0, Math.floor(v))));
  } catch {}
}

function readDailyCache(dateKey) {
  try {
    const key = `yc_daily_cache_${getDbKey()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.dateKey === dateKey && obj.problem) return obj;
  } catch {}
  return null;
}

function writeDailyCache(dateKey, offset, problem) {
  try {
    const key = `yc_daily_cache_${getDbKey()}`;
    localStorage.setItem(key, JSON.stringify({ dateKey, offset, problem }));
  } catch {}
}

function dailyProblemExtraFilter(p) {
  const stem = (p.text || '').trim();
  if (!stem) return false;
  if (stem.length > 800) return false;
  // Skip if it likely contains multiple questions after the start.
  if (/\n\s*\d{1,2}[\.．]\s+/.test(stem.slice(10))) return false;
  // Skip obvious non-question blocks
  if (/填涂上你认为本试卷中一道最佳试题的题号/.test(stem)) return false;
  return true;
}

async function pickDailyProblem({ grades = [3, 4], pool = 'exam', offset = 0 } = {}) {
  const index = await loadIndex();
  const tasks = [];
  for (const g of grades) {
    const ys = index.grades?.[String(g)]?.years || [];
    for (const y of ys) tasks.push([g, y]);
  }
  if (!tasks.length) return null;

  const dateKey = localDateKey();
  const seed = hashSeed(`${getDbKey()}|${dateKey}|${offset}`);
  const rng = mulberry32(seed);

  // Deterministic shuffle to avoid always hitting the same year first.
  for (let i = tasks.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
  }

  for (const [g, y] of tasks) {
    const problems = await loadProblems(g, y);
    const filtered = filterProblems(problems, { pool, requireQuestionText: true }).filter(dailyProblemExtraFilter);
    if (!filtered.length) continue;
    const pick = filtered[Math.floor(rng() * filtered.length)];
    return pick;
  }
  return null;
}

function renderDailySummary(problem, dateKey) {
  if (!problem) {
    return `<div style="color:var(--text-muted);font-size:0.9rem">今日未找到可用题目（请稍后重试或先使用“开始练习/考试模式”）。</div>`;
  }
  const stage = problem.exam?.stage ? ` · ${problem.exam.stage}` : '';
  const src = problem.source_file || '未知来源';
  return `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
      <div style="min-width:220px">
        <div style="font-weight:600;margin-bottom:4px">📌 今日一题（${dateKey}）</div>
        <div style="color:var(--text-muted);font-size:0.85rem">
          ${problem.grade}年级${problem.year}年${stage} · 原题 #${problem.number || '-'} · ${topicName(problem.topic)}
        </div>
        <div style="color:var(--text-muted);font-size:0.8rem;margin-top:6px">来源：${src}${problem.page ? `（第${problem.page}页）` : ''}</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" id="startDaily">开始今日一题</button>
        <button class="btn btn-secondary" id="refreshDaily" title="仅影响本设备">换一题</button>
      </div>
    </div>
  `;
}

async function ensureDailyProblemLoaded({ force = false } = {}) {
  const dateKey = localDateKey();
  const offset = getDailyOffset();
  const container = document.getElementById('dailyBox');
  if (!container) return;

  if (!force) {
    const cached = readDailyCache(dateKey);
    if (cached && cached.problem && Number(cached.offset || 0) === offset) {
      dailyState = { dateKey, offset, problem: cached.problem, error: '' };
      container.innerHTML = renderDailySummary(dailyState.problem, dateKey);
      return;
    }
  }

  container.innerHTML = `<div style="color:var(--text-muted);font-size:0.9rem">正在为你抽取今日题目…</div>`;

  const slowTimer = setTimeout(() => showLoading({ title: '每日一题', text: '正在抽取今日题目（首次进入可能略慢）' }), 500);
  try {
    const problem = await pickDailyProblem({ grades: [3, 4], pool: 'exam', offset });
    dailyState = { dateKey, offset, problem, error: '' };
    writeDailyCache(dateKey, offset, problem);
    container.innerHTML = renderDailySummary(problem, dateKey);
  } catch (e) {
    dailyState = { dateKey, offset, problem: null, error: e?.message || String(e) };
    container.innerHTML = `<div style="color:var(--error)">每日一题加载失败：${dailyState.error}</div>`;
  } finally {
    clearTimeout(slowTimer);
    hideLoading();
  }
}

// ---- Image Preload (next question) ----
function scheduleIdle(fn, timeoutMs = 800) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => fn(), { timeout: timeoutMs });
  } else {
    setTimeout(fn, 0);
  }
}

function preloadImageUrl(url) {
  if (!url) return;
  window._ycPreloaded = window._ycPreloaded || new Set();
  if (window._ycPreloaded.has(url)) return;
  window._ycPreloaded.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

function maybePreloadNextProblemImages() {
  if (!practiceState || !practiceState.problems || practiceState.index === undefined) return;
  const i = practiceState.index;
  const probs = practiceState.problems;

  // Only preload cropped problem images; never preload large page images.
  const next = probs[i + 1];
  if (!next) return;
  const imgs = (next.images?.problem_images || []).slice(0, 2).map(resolveImgSrc);
  imgs.forEach(preloadImageUrl);
}

async function loadProblemsForGradesWithProgress(grades, onProgress) {
  const index = await loadIndex();
  const tasks = [];
  for (const g of grades) {
    const years = index.grades[String(g)]?.years || [];
    for (const y of years) tasks.push([g, y]);
  }
  const total = tasks.length;
  let done = 0;
  const concurrency = Math.max(1, Math.min(5, tasks.length));
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function run() {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= tasks.length) return;
      const [g, y] = tasks[currentIndex];
      results[currentIndex] = await loadProblems(g, y);
      done++;
      onProgress?.({ done, total, grade: g, year: y });
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => run()));
  return results.flat();
}

// ---- Router ----
function navigate(page, params = {}) {
  currentPage = page;
  render(params);
}

// ---- Main Render ----
async function render(params = {}) {
  const app = document.getElementById('app');
  try {
    switch (currentPage) {
      case 'home': app.innerHTML = await renderHome(); break;
      case 'practice-setup': app.innerHTML = renderPracticeSetup(); break;
      case 'practice': app.innerHTML = await renderPractice(params); break;
      case 'exam-setup': app.innerHTML = await renderExamSetup(); break;
      case 'exam': app.innerHTML = await renderExam(params); break;
      case 'exam-history': app.innerHTML = await renderExamHistory(); break;
      case 'browse': app.innerHTML = await renderBrowse(params); break;
      case 'analysis': app.innerHTML = await renderAnalysis(); break;
      case 'wrong': app.innerHTML = await renderWrongBook(params); break;
      case 'settings': app.innerHTML = renderSettings(); break;
      case 'help': app.innerHTML = renderHelp(); break;
      default: app.innerHTML = '<div class="card">页面未找到</div>';
    }
    bindEvents();
    if (currentPage === 'home') {
      scheduleIdle(() => ensureDailyProblemLoaded({ force: false }), 300);
    }
    if (window.renderMathInElement) {
      window.renderMathInElement(app, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
    }

    // Preload next question images in idle time (helps new devices / slow networks).
    if (practiceState && practiceState.index < (practiceState.problems?.length || 0)) {
      scheduleIdle(() => maybePreloadNextProblemImages());
    }
  } catch (e) {
    console.error('Render error:', e);
    app.innerHTML = `<div class="card"><h2>加载出错</h2><p>${e.message}</p><button class="btn btn-primary" onclick="location.reload()">刷新页面</button></div>`;
  }
}

// ---- Home ----
async function renderHome() {
  const prog = getProgress();
  const rate = prog.total_answered > 0 ? Math.round(prog.total_correct / prog.total_answered * 100) : 0;
  const history = getHistory().slice(-5).reverse();
  const exams = getExams().slice(-5).reverse();
  const dateKey = localDateKey();
  return `
    <div class="stats">
      <div class="stat-card"><div class="num">${prog.total_answered}</div><div class="label">总做题</div></div>
      <div class="stat-card"><div class="num">${rate}%</div><div class="label">正确率</div></div>
      <div class="stat-card"><div class="num">${Object.keys(getWrong()).filter(k => getWrong()[k].st !== 'mastered').length}</div><div class="label">错题</div></div>
    </div>
    <div class="card">
      <h2>每日一题</h2>
      <div id="dailyBox">${dailyState.problem && dailyState.dateKey === dateKey ? renderDailySummary(dailyState.problem, dateKey) : `<div style="color:var(--text-muted);font-size:0.9rem">正在准备今日题目…</div>`}</div>
      <div style="margin-top:10px;color:var(--text-muted);font-size:0.8rem">
        提示：首次加载可能略慢（需要拉取题库与图片缓存）。答案默认隐藏，做完再展开查看更有效。
      </div>
    </div>
    <div class="card">
      <h2>快速开始</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary" data-nav="practice-setup">开始练习</button>
        <button class="btn btn-secondary" data-nav="exam-setup">考试模式</button>
        <button class="btn btn-secondary" data-nav="exam-history">历史记录</button>
        <button class="btn btn-secondary" data-nav="browse">题目浏览</button>
        <button class="btn btn-secondary" data-nav="analysis">成绩分析</button>
        <button class="btn btn-secondary" data-nav="wrong">错题本</button>
      </div>
    </div>
    ${history.length ? `
    <div class="card">
      <h2>最近做题</h2>
      ${history.map(h => `
        <div class="tree-item" data-detail="${h.id || `${h.g}_${h.y}_${h.n}`}">
          <span>${h.g}年级${h.y}年 #${h.n} ${topicName(h.t)}</span>
          <span>${h.ok ? '✓' : '✗'} ${formatTime(h.ts)}</span>
        </div>
      `).join('')}
    </div>` : ''}
    ${exams.length ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 style="margin-bottom:0">最近考试</h2>
        <button class="btn btn-secondary btn-sm" data-nav="exam-history">查看全部</button>
      </div>
      <div style="margin-top:10px">
        ${exams.map(e => `
          <div class="tree-item" data-exam-detail="${e.id}">
            <span>
              ${e.tp === 'grade' ? '模拟考试' : '练习'} · ${formatUnix(e.sa)} · ${e.correct}/${e.total} (${e.sc}%)<br/>
              <span style="color:var(--text-muted);font-size:0.8rem">${scopeSummary(e.scope)}</span>
            </span>
            <span style="color:var(--text-muted)">${formatTime(e.total_time || 0)}</span>
          </div>
        `).join('')}
      </div>
    </div>` : ''}
  `;
}

// ---- Practice Setup ----
function renderPracticeSetup() {
  const settings = getSettings();
  const grades = [3, 4, 5, 6];
  const topics = ['arithmetic', 'algebra', 'geometry', 'number_theory', 'combinatorics', 'logic'];
  const diffs = [1, 2, 3];
  const stages = ['初赛', '决赛', '总决赛', '网赛'];
  return `
    <div class="card">
      <h2>选择练习范围</h2>
      <h3>年级</h3>
      <div class="chips" data-field="grade">
        ${grades.map(g => `<span class="chip ${g === settings.default_grade ? 'selected' : ''}" data-val="${g}">${g}年级</span>`).join('')}
      </div>
      <h3>题型</h3>
      <div class="chips" data-field="topic">
        ${topics.map(t => `<span class="chip selected" data-val="${t}">${topicName(t)}</span>`).join('')}
      </div>
      <h3>难度</h3>
      <div class="chips" data-field="difficulty">
        ${diffs.map(d => `<span class="chip selected" data-val="${d}">${difficultyName(d)}</span>`).join('')}
      </div>
      <h3>考试阶段</h3>
      <div class="chips" data-field="stage">
        ${stages.map(s => `<span class="chip selected" data-val="${s}">${s}</span>`).join('')}
      </div>
      <h3>模式</h3>
      <div class="chips" data-field="mode">
        <span class="chip selected" data-val="random">随机</span>
        <span class="chip" data-val="sequential">按顺序</span>
        <span class="chip" data-val="wrong">错题重做</span>
      </div>
      <div style="margin:12px 0">
        <div class="checkbox-row"><input type="checkbox" id="excludeDone" checked><label for="excludeDone">排除已做过的题</label></div>
      </div>
      <h3>题目数量</h3>
      <div class="chips" data-field="count">
        <span class="chip" data-val="5">5</span>
        <span class="chip selected" data-val="10">10</span>
        <span class="chip" data-val="20">20</span>
        <span class="chip" data-val="50">50</span>
      </div>
      <button class="btn btn-primary btn-block" id="startPractice" style="margin-top:16px">开始练习</button>
    </div>
  `;
}

// ---- Practice ----
async function renderPractice(params) {
  if (params && params._exam) {
    practiceState = examState;
  }
  if (params && params.start) {
    let problems;
    if (params._problems) {
      problems = params._problems;
    } else {
      const opts = getSelections();
      if (opts.mode === 'wrong') {
        showLoading({ title: '加载题库…', text: '正在加载错题数据（首次进入可能较慢）' });
        await nextFrame();
        const allProblems = await loadProblemsForGradesWithProgress(opts.grades, ({ done, total, grade, year }) => {
          showLoading({ title: '加载题库…', text: `正在加载：${grade}年级 ${year}年（${done}/${total}）`, pct: total ? (done / total * 100) : null });
        });
        problems = filterProblems(allProblems, { onlyWrong: true, requireQuestionText: true, pool: 'practice' });
      } else {
        showLoading({ title: '加载题库…', text: '正在加载题库数据（首次进入可能较慢）' });
        await nextFrame();
        const allProblems = await loadProblemsForGradesWithProgress(opts.grades, ({ done, total, grade, year }) => {
          showLoading({ title: '加载题库…', text: `正在加载：${grade}年级 ${year}年（${done}/${total}）`, pct: total ? (done / total * 100) : null });
        });
        problems = filterProblems(allProblems, {
          topic: opts.topics, difficulty: opts.difficulties, stage: opts.stages,
          excludeDone: opts.excludeDone && opts.mode !== 'wrong',
          requireQuestionText: true,
          pool: 'practice',
        });
      }
      hideLoading();
      if (opts.mode === 'random') problems = sample(problems, opts.count);
      else problems = problems.slice(0, opts.count);
    }
    if (!problems.length) return '<div class="card">没有找到符合条件的题目。<button class="btn btn-secondary" data-nav="practice-setup">返回</button></div>';
    // Save selection scope for exam history.
    const scope = params._problems ? { mode: 'custom' } : getSelections();
    practiceState = { problems, index: 0, answers: [], startTime: Date.now(), timers: problems.map(() => 0), questionStart: Date.now(), scope };
  }
  if (!practiceState) return '<div class="card">无练习数据<button class="btn btn-secondary" data-nav="practice-setup">返回</button></div>';
  const { problems, index, answers, timers } = practiceState;
  if (index >= problems.length) return renderPracticeResult();
  const p = problems[index];
  const imgPath = getImagePath(p, 'problem');
  const pageImgPath = (p.images?.page_image) || getPageImagePath(p);
  const problemImages = (p.images?.problem_images || []).slice(0, 6);
  const ans = answers[index];
  // Per-problem timer: accumulate time across switches
  const currentElapsed = (timers[index] || 0) + Math.floor((Date.now() - practiceState.questionStart) / 1000);
  const sessionElapsed = Math.floor((Date.now() - practiceState.startTime) / 1000);
  return `
    <div class="layout-3col">
      <!-- Left sidebar: problem list -->
      <div class="sidebar card" id="sidebar">
        <h3 style="font-size:0.85rem;margin-bottom:8px">题目列表</h3>
        ${problems.map((prob, i) => {
          const d = answers[i];
          const cls = i === index ? 'style="color:var(--accent);font-weight:600"' : '';
          const mark = d === undefined ? '' : d.correct ? '✓' : '✗';
          const markColor = d === undefined ? '' : d.correct ? 'var(--success)' : 'var(--error)';
          return `<div class="tree-item" data-practice-goto="${i}" style="font-size:0.8rem;${i===index?'background:var(--bg-input);border-radius:6px;padding:4px 6px':''}">
            <span ${cls}>${i + 1}. ${prob.number ? '#' + prob.number : ''} ${topicName(prob.topic)}</span>
            <span style="color:${markColor}">${mark}</span>
          </div>`;
        }).join('')}
      </div>

      <!-- Middle: problem content -->
      <div class="main-area">
        <div class="card">
          <div class="problem-header">
            <span>第 ${index + 1}/${problems.length} 题 | 原题 #${p.number} | ${p.grade}年级${p.year}年</span>
            <span class="timer" id="timer">${formatTime(currentElapsed)}</span>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px">
            试卷计时：开始 <span id="sessionStartAt">${formatDateTime(practiceState.startTime)}</span> · 当前 <span id="sessionNowAt">${formatDateTime(Date.now())}</span> · 已用时 <span id="sessionElapsed">${formatTime(sessionElapsed)}</span>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px">
            来源: ${p.source_file || '未知'}${p.page ? ` (第${p.page}页)` : ''}
          </div>
          <div class="problem-meta">
            <span class="tag tag-topic">${topicName(p.topic)}</span>
            <span class="tag tag-diff">${difficultyName(p.difficulty)}</span>
            ${p.exam?.stage ? `<span class="tag tag-stage">${p.exam.stage}${p.exam.variant ? ' ' + p.exam.variant : ''}</span>` : ''}
          </div>
          ${renderProblemTextHtml(problemImages.length ? stripMarkdownImages(p.text) : p.text)}
          ${problemImages.length ? `
            <div style="margin-top:8px;margin-bottom:12px">
              ${problemImages.map(src => `<img class="problem-image" src="${resolveImgSrc(src)}" loading="lazy" onerror="this.style.display='none'">`).join('')}
            </div>
          ` : ''}
          ${problemImages.length ? `
            <div style="margin-top:8px;margin-bottom:8px">
              <button class="btn btn-secondary btn-sm" data-open-page-image="${resolveImgSrc(pageImgPath)}">查看原卷页面（备份）</button>
            </div>
          ` : ''}
          <div class="answer-area">
            ${ans !== undefined ? renderAnswered(p, answers[index]) : renderAnswerInput(p)}
          </div>
          <div class="progress-bar">
            ${problems.map((_, i) => `<div class="progress-dot ${i === index ? 'current' : i < answers.length ? (answers[i]?.correct ? 'done' : 'wrong') : ''}"></div>`).join('')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            ${index > 0 ? '<button class="btn btn-secondary btn-sm" data-practice="prev">◀ 上一题</button>' : ''}
            ${ans !== undefined && index < problems.length - 1 ? '<button class="btn btn-primary btn-sm" data-practice="next">下一题 ▶</button>' : ''}
            ${ans !== undefined && index === problems.length - 1 ? '<button class="btn btn-success btn-sm" data-practice="finish">查看结果</button>' : ''}
            <button class="btn btn-secondary btn-sm" data-practice="quit">退出</button>
            <button class="btn btn-secondary btn-sm" id="toggleSidebar">☰ 列表</button>
            <button class="btn btn-secondary btn-sm" id="toggleScratch">🖊️ 草稿纸</button>
          </div>
        </div>
      </div>

      <!-- Right: page image reference -->
      <div class="page-ref card">
        <h3 style="font-size:0.85rem;margin-bottom:8px">原卷页面 (第${p.page || 1}页)</h3>
        ${problemImages.length ? `
          <div style="color:var(--text-muted);font-size:0.8rem">默认不加载（已显示题目裁剪图）。需要时点左侧“查看原卷页面”。</div>
        ` : `
          <img src="${resolveImgSrc(pageImgPath)}" onerror="tryPageFallback(this)" loading="lazy">
        `}
      </div>
    </div>
  `;
}

function renderAnswerInput(p) {
  if (p.type === 'choice' || (p.answer && /^[A-E]$/.test(p.answer.trim()))) {
    const choices = ['A', 'B', 'C', 'D', 'E'];
    return `<div class="choice-btns">${choices.map(c => `<button class="choice-btn" data-choice="${c}">${c}</button>`).join('')}</div>
      <button class="btn btn-primary" data-practice="submit-choice" style="margin-top:10px">提交答案</button>`;
  }
  return `
    <input type="text" class="answer-input" id="answerInput" placeholder="输入答案..." inputmode="decimal" autocomplete="off">
    <button class="btn btn-primary btn-block" data-practice="submit" style="margin-top:10px">提交答案 (Ctrl+Enter)</button>
  `;
}

function renderAnswered(p, result) {
  if (!result) return '';
  const r = gradeAnswer(result.ua, p.answer, p.type);
  const solPagePath = (p.images?.page_image) || getPageImagePath(p);
  return `
    <div class="result-bar ${r.correct === true ? 'result-correct' : r.correct === false ? 'result-wrong' : ''}">
      ${r.correct === true ? '✓ 回答正确！' : r.correct === false ? `✗ ${r.msg}` : r.msg} | 用时: ${formatTime(result.ts)}
    </div>
    ${(p.answer || p.solution) ? `
      <details class="solution-box">
        <summary>点击查看答案 / 解析</summary>
        ${p.answer ? `<div style="margin-bottom:8px"><strong>正确答案:</strong> ${escHtml(p.answer)}</div>` : ''}
        ${p.solution ? `<div style="margin-bottom:8px">${escHtml(p.solution)}</div>` : ''}
        ${p.solution ? `<img src="${resolveImgSrc(solPagePath)}" style="max-width:100%;border-radius:8px;cursor:zoom-in" onclick="document.querySelector('.page-ref img')?.click()" onerror="this.style.display='none'">` : ''}
      </details>
    ` : ''}
  `;
}

function renderPracticeResult() {
  const { problems, answers, startTime } = practiceState;
  const total = problems.length;
  const correct = answers.filter(a => a?.correct).length;
  const totalTime = answers.reduce((s, a) => s + (a?.ts || 0), 0);
  const wallTime = Math.floor((Date.now() - startTime) / 1000);
  const byTopic = {};
  problems.forEach((p, i) => {
    const t = p.topic || 'general';
    if (!byTopic[t]) byTopic[t] = { total: 0, correct: 0, time: 0 };
    byTopic[t].total++;
    byTopic[t].time += answers[i]?.ts || 0;
    if (answers[i]?.correct) byTopic[t].correct++;
  });

  // Save exam session
  const examSession = {
    id: 'exam_' + Date.now(),
    tp: practiceState.type || 'practice',
    scope: practiceState.scope || null,
    sa: Math.floor(startTime / 1000),
    fa: Math.floor(Date.now() / 1000),
    total_time: wallTime,
    solve_time: totalTime,
    p: problems.map((pr, i) => ({
      g: pr.grade, y: pr.year, n: pr.number, t: pr.topic, d: pr.difficulty,
      sf: pr.source_file || '',
      ok: answers[i]?.correct || false, ts: answers[i]?.ts || 0,
      ua: answers[i]?.ua || '', ca: pr.answer || '',
    })),
    sc: Math.round(correct / total * 100),
    total, correct,
  };
  const exams = JSON.parse(localStorage.getItem('yc_exams') || '[]');
  exams.push(examSession);
  if (exams.length > 100) exams.splice(0, exams.length - 100);
  localStorage.setItem('yc_exams', JSON.stringify(exams));

  return `
    <div class="card">
      <h2>练习完成</h2>
      <div class="stats">
        <div class="stat-card"><div class="num">${total}</div><div class="label">总题数</div></div>
        <div class="stat-card"><div class="num">${correct}</div><div class="label">正确</div></div>
        <div class="stat-card"><div class="num">${Math.round(correct/total*100)}%</div><div class="label">正确率</div></div>
        <div class="stat-card"><div class="num">${formatTime(totalTime)}</div><div class="label">答题用时</div></div>
        <div class="stat-card"><div class="num">${formatTime(wallTime)}</div><div class="label">总耗时</div></div>
      </div>
      <h3>按题型</h3>
      <div class="bar-chart">
        ${Object.entries(byTopic).map(([t, v]) => `
          <div class="bar-row">
            <span class="bar-label">${topicName(t)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${v.total?v.correct/v.total*100:0}%;background:${v.correct/v.total>=0.7?'var(--success)':'var(--error)'}"></div></div>
            <span class="bar-value">${v.correct}/${v.total} (${v.total?Math.round(v.correct/v.total*100):0}%) ${formatTime(v.time)}</span>
          </div>
        `).join('')}
      </div>
      <h3>逐题详情</h3>
      <div style="max-height:300px;overflow-y:auto">
        ${problems.map((pr, i) => {
          const a = answers[i];
          return `<div class="tree-item" style="font-size:0.8rem">
            <span>#${pr.number} ${topicName(pr.topic)} ${difficultyName(pr.difficulty)}</span>
            <span>${a?.correct ? '✓' : '✗'} ${formatTime(a?.ts || 0)}</span>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary" data-nav="practice-setup">再来一轮</button>
        <button class="btn btn-secondary" data-nav="home">返回首页</button>
        <button class="btn btn-secondary" data-share-result>分享成绩</button>
      </div>
    </div>
  `;
}

// ---- Exam Setup ----
async function renderExamSetup() {
  const index = await loadIndex();
  // Build exam availability map: grade → year → {stages, variants, sources}
  const examMap = {};
  for (const g of Object.keys(index.grades)) {
    examMap[g] = {};
    for (const y of index.grades[g].years) {
      const problems = await loadProblems(Number(g), y);
      const stages = new Set();
      const variants = new Set();
      const sources = new Set();
      const stageVariantMap = {}; // stage → Set(variants)
      for (const p of problems) {
        const s = p.exam?.stage || '其他';
        const v = p.exam?.variant || '';
        stages.add(s);
        if (v) variants.add(v);
        sources.add(p.source_file);
        if (!stageVariantMap[s]) stageVariantMap[s] = new Set();
        if (v) stageVariantMap[s].add(v);
      }
      examMap[g][y] = { stages: [...stages], variants: [...variants], sources: [...sources], stageVariantMap, count: problems.length };
    }
  }

  // Default selection
  const defaultGrade = Object.keys(index.grades)[0] || '5';
  const defaultYear = index.grades[defaultGrade]?.years?.[0] || 2021;
  const yearInfo = examMap[defaultGrade]?.[defaultYear] || {};

  return `
    <div class="card">
      <h2>模拟考试</h2>
      <div class="input-group"><label>年级</label>
        <div class="chips" data-field="exam-grade">
          ${Object.keys(index.grades).map(g => `<span class="chip ${g===defaultGrade?'selected':''}" data-val="${g}">${g}年级</span>`).join('')}
        </div>
      </div>
      <div class="input-group"><label>年份</label>
        <div class="chips" data-field="exam-year" id="examYearChips">
          ${(index.grades[defaultGrade]?.years || []).sort((a,b)=>b-a).map(y => {
            const info = examMap[defaultGrade]?.[y];
            const count = info?.count || 0;
            return `<span class="chip ${y===defaultYear?'selected':''}" data-val="${y}" data-count="${count}">${y}年${count?` (${count}题)`:''}</span>`;
          }).join('')}
        </div>
      </div>
      <div class="input-group"><label>考试阶段</label>
        <div class="chips" data-field="exam-stage" id="examStageChips">
          <span class="chip selected" data-val="">全部</span>
          ${(yearInfo.stages || []).filter(s=>s!=='其他').map(s => `<span class="chip" data-val="${s}">${s}</span>`).join('')}
        </div>
      </div>
      <div class="input-group"><label>卷别</label>
        <div class="chips" data-field="exam-variant" id="examVariantChips">
          <span class="chip selected" data-val="">全部</span>
          ${(yearInfo.variants || []).map(v => `<span class="chip" data-val="${v}">${v}</span>`).join('')}
        </div>
      </div>
      <div style="margin:12px 0;color:var(--text-muted);font-size:0.85rem" id="examInfo">
        当前选择: ${defaultGrade}年级 ${defaultYear}年, ${yearInfo.count || 0} 道题
      </div>
      <button class="btn btn-primary btn-block" id="startExam" style="margin-top:16px">开始考试</button>
    </div>
    <div class="card">
      <h2>专项训练</h2>
      <div class="input-group"><label>年级</label>
        <div class="chips" data-field="train-grade">
          ${Object.keys(index.grades).map(g => `<span class="chip ${g===defaultGrade?'selected':''}" data-val="${g}">${g}年级</span>`).join('')}
        </div>
      </div>
      <div class="input-group"><label>题型</label>
        <div class="chips" data-field="train-topic">
          ${['arithmetic','algebra','geometry','number_theory','combinatorics','logic'].map(t => `<span class="chip selected" data-val="${t}">${topicName(t)}</span>`).join('')}
        </div>
      </div>
      <div class="input-group"><label>难度</label>
        <div class="chips" data-field="train-diff">
          <span class="chip selected" data-val="1">初级</span>
          <span class="chip selected" data-val="2">中级</span>
          <span class="chip" data-val="3">高级</span>
        </div>
      </div>
      <div class="input-group"><label>题目数量</label>
        <div class="chips" data-field="train-count">
          <span class="chip selected" data-val="10">10</span>
          <span class="chip" data-val="20">20</span>
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="startTraining" style="margin-top:16px">开始训练</button>
    </div>
  `;
}

// ---- Exam ----
async function renderExam(params) {
  if (params.start) {
    const problems = params.problems;
    if (!problems.length) return '<div class="card">无题目<button class="btn btn-secondary" data-nav="exam-setup">返回</button></div>';
    examState = { problems, index: 0, answers: [], startTime: Date.now(), timers: problems.map(() => 0), questionStart: Date.now(), type: params.type, scope: params.scope || { type: params.type || 'grade' } };
  }
  if (!examState) return '<div class="card">无考试数据<button class="btn btn-secondary" data-nav="exam-setup">返回</button></div>';
  return renderPractice.call(null, { _exam: true }); // Reuse practice renderer
}

// ---- Browse ----
async function renderBrowse(params) {
  const index = await loadIndex();
  const done = getDone();
  const mode = params.browseMode || 'grade';
  const selectedGrade = params.grade;
  const selectedYear = params.year;
  const selectedExam = params.exam;
  const filterTopic = params.topic || '';

  // If a specific grade and topic are selected (clicked from topic view)
  if (selectedGrade && filterTopic && !selectedYear) {
    const problems = await loadAllProblems(selectedGrade);
    const filtered = problems.filter(p => p.topic === filterTopic);
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2>${selectedGrade}年级 ${topicName(filterTopic)}题 (${filtered.length}题)</h2>
          <button class="btn btn-secondary btn-sm" data-browse-params="browseMode=topic">返回</button>
        </div>
        ${filtered.map((p, i) => {
          const pid = problemId(p.grade, p.year, p.number, p.source_file || '');
          const d = done[pid];
          return `<div class="tree-item" data-detail="${pid}">
            <span>${i+1}. ${p.year}年 #${p.number} <span class="tag tag-diff">${difficultyName(p.difficulty)}</span></span>
            <span>${d === 1 ? '<span style="color:var(--success)">✓</span>' : d === 0 ? '<span style="color:var(--error)">✗</span>' : ''}</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  // If a specific exam is selected, show its problems
  if (selectedGrade && selectedYear && selectedExam !== undefined) {
    const problems = await loadProblems(selectedGrade, selectedYear);
    const examProblems = selectedExam ? problems.filter(p => p.source_file === selectedExam) : problems;
    const filtered = filterTopic ? examProblems.filter(p => p.topic === filterTopic) : examProblems;
    const examName = selectedExam ? selectedExam.replace('.pdf','').replace('.doc','').replace('.docx','') : `${selectedGrade}年级 ${selectedYear}年 全部`;
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 style="font-size:0.95rem">${examName} (${filtered.length}题)</h2>
          <button class="btn btn-secondary btn-sm" data-browse-year="${selectedGrade}_${selectedYear}">返回</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
          <button class="btn btn-primary btn-sm" data-browse-open-exam="${selectedGrade}_${selectedYear}_${selectedExam||''}_${filterTopic||''}">像考试一样浏览</button>
        </div>
        <div class="chips" data-field="browse-topic-filter" style="margin-bottom:12px">
          <span class="chip ${!filterTopic?'selected':''}" data-val="" data-browse-exam-filter="${selectedGrade}_${selectedYear}_${selectedExam||''}_">全部题型</span>
          ${['arithmetic','algebra','geometry','number_theory','combinatorics','logic'].map(t =>
            `<span class="chip ${filterTopic===t?'selected':''}" data-val="${t}" data-browse-exam-filter="${selectedGrade}_${selectedYear}_${selectedExam||''}_${t}">${topicName(t)}</span>`
          ).join('')}
        </div>
        ${filtered.map((p, i) => {
          const pid = problemId(p.grade, p.year, p.number, p.source_file || '');
          const d = done[pid];
          return `<div class="tree-item" data-detail="${pid}">
            <span>${i+1}. #${p.number} <span class="tag tag-topic">${topicName(p.topic)}</span> <span class="tag tag-diff">${difficultyName(p.difficulty)}</span></span>
            <span>${d === 1 ? '<span style="color:var(--success)">✓</span>' : d === 0 ? '<span style="color:var(--error)">✗</span>' : ''}</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  // If grade+year selected, show exam list
  if (selectedGrade && selectedYear) {
    const problems = await loadProblems(selectedGrade, selectedYear);
    const exams = {};
    for (const p of problems) {
      const src = p.source_file || '未知';
      if (!exams[src]) exams[src] = { source: src, count: 0, done: 0, stage: p.exam?.stage, variant: p.exam?.variant };
      exams[src].count++;
      if (done[problemId(p.grade, p.year, p.number, p.source_file || '')] !== undefined) exams[src].done++;
    }
    const totalDone = problems.filter(p => done[problemId(p.grade, p.year, p.number, p.source_file || '')] !== undefined).length;
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2>${selectedGrade}年级 ${selectedYear}年 (${problems.length}题, 已做${totalDone})</h2>
          <button class="btn btn-secondary btn-sm" data-browse-params="browseMode=${mode}">返回</button>
        </div>
        <div class="tree-item" data-browse-exam="${selectedGrade}_${selectedYear}_" style="font-weight:600">
          <span>全部题目 (${problems.length}题)</span>
          <span style="color:var(--text-muted)">${totalDone}/${problems.length}</span>
        </div>
        <h3 style="margin:12px 0 8px;font-size:0.85rem;color:var(--text-muted)">按考试</h3>
        ${Object.values(exams).sort((a,b) => a.source.localeCompare(b.source)).map(e => {
          const name = e.source.replace('.pdf','').replace('.doc','').replace('.docx','');
          return `<div class="tree-item" data-browse-exam="${selectedGrade}_${selectedYear}_${e.source}">
            <span>${name} <span class="tag tag-stage">${e.stage||''}</span></span>
            <span style="color:var(--text-muted)">${e.done}/${e.count}</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  // Main browse page
  let contentHtml = '';
  if (mode === 'topic') {
    contentHtml = ['arithmetic','algebra','geometry','number_theory','combinatorics','logic'].map(t => `
      <h3>${topicName(t)}</h3>
      <div class="tree-children" style="margin-bottom:12px">
        ${Object.entries(index.grades).sort((a,b)=>Number(a[0])-Number(b[0])).map(([g, info]) => `
          <div class="tree-item" data-browse-topic="${g}_${t}">
            <span>${g}年级</span><span style="color:var(--text-muted)">→</span>
          </div>
        `).join('')}
      </div>
    `).join('');
  } else if (mode === 'list') {
    const gradeFilter = params.gradeFilter || '';
    contentHtml = `
      <div class="chips" data-field="browse-grade-filter" style="margin-bottom:12px">
        <span class="chip ${!gradeFilter?'selected':''}" data-val="" data-browse-params="browseMode=list;gradeFilter=">全部年级</span>
        ${[3,4,5,6].map(g => `<span class="chip ${gradeFilter==String(g)?'selected':''}" data-val="${g}" data-browse-params="browseMode=list;gradeFilter=${g}">${g}年级</span>`).join('')}
      </div>
      <div class="tree-children">
        ${Object.entries(index.grades).sort((a,b)=>Number(a[0])-Number(b[0])).flatMap(([g, info]) => {
          if (gradeFilter && g !== gradeFilter) return [];
          return info.years.map(y => `
            <div class="tree-item" data-browse-year="${g}_${y}">
              <span>${g}年级 ${y}年</span><span style="color:var(--text-muted)">→</span>
            </div>
          `);
        }).join('')}
      </div>
    `;
  } else {
    // Default mode: grade
    const gradeFilter = params.gradeFilter || '';
    contentHtml = `
      <div class="chips" data-field="browse-grade-filter" style="margin-bottom:12px">
        <span class="chip ${!gradeFilter?'selected':''}" data-val="" data-browse-params="browseMode=grade;gradeFilter=">全部年级</span>
        ${[3,4,5,6].map(g => `<span class="chip ${gradeFilter==String(g)?'selected':''}" data-val="${g}" data-browse-params="browseMode=grade;gradeFilter=${g}">${g}年级</span>`).join('')}
      </div>
      ${Object.entries(index.grades).sort((a,b)=>Number(a[0])-Number(b[0])).map(([g, info]) => {
        if (gradeFilter && g !== gradeFilter) return '';
        return `
          <h3>${g}年级 (${info.total_problems}题)</h3>
          <div class="tree-children">
            ${info.years.sort((a,b)=>b-a).map(y => `
              <div class="tree-item" data-browse-year="${g}_${y}">
                <span>${y}年</span><span style="color:var(--text-muted)">→</span>
              </div>
            `).join('')}
          </div>
        `;
      }).join('')}
    `;
  }

  return `
    <div class="card">
      <h2>题目浏览</h2>
      <div class="chips" data-field="browse-mode" style="margin-bottom:16px">
        <span class="chip ${mode==='list'?'selected':''}" data-val="list" data-browse-params="browseMode=list">全部列表</span>
        <span class="chip ${mode==='grade'?'selected':''}" data-val="grade" data-browse-params="browseMode=grade">按年级</span>
        <span class="chip ${mode==='topic'?'selected':''}" data-val="topic" data-browse-params="browseMode=topic">按题型</span>
      </div>
      ${contentHtml}
    </div>
  `;
}

// ---- Analysis ----
async function renderAnalysis() {
  const prog = getProgress();
  const rate = prog.total_answered > 0 ? Math.round(prog.total_correct / prog.total_answered * 100) : 0;
  const avgTime = (() => {
    const h = getHistory();
    return h.length ? Math.round(h.reduce((s, x) => s + x.ts, 0) / h.length) : 0;
  })();

  function barRows(bucket, nameFn) {
    return Object.entries(bucket).sort((a, b) => b[1].a - a[1].a).map(([k, v]) => {
      const pct = v.a ? Math.round(v.c / v.a * 100) : 0;
      return `<div class="bar-row">
        <span class="bar-label">${nameFn(k)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${pct>=70?'var(--success)':pct>=50?'var(--warning)':'var(--error)'}"></div></div>
        <span class="bar-value">${v.c}/${v.a} (${pct}%)</span>
      </div>`;
    }).join('');
  }

  // Weakness detection
  const weakTopics = Object.entries(prog.by_topic || {}).filter(([, v]) => v.a >= 5 && v.c / v.a < 0.6).map(([k]) => topicName(k));
  const weakDiff = Object.entries(prog.by_difficulty || {}).filter(([, v]) => v.a >= 5 && v.c / v.a < 0.6).map(([k]) => difficultyName(Number(k)));

  return `
    <div class="card">
      <h2>成绩分析</h2>
      <div class="stats">
        <div class="stat-card"><div class="num">${prog.total_answered}</div><div class="label">总做题</div></div>
        <div class="stat-card"><div class="num">${rate}%</div><div class="label">正确率</div></div>
        <div class="stat-card"><div class="num">${formatTime(avgTime)}</div><div class="label">平均用时</div></div>
      </div>
    </div>
    <div class="card"><h2>按题型</h2><div class="bar-chart">${barRows(prog.by_topic || {}, topicName)}</div></div>
    <div class="card"><h2>按难度</h2><div class="bar-chart">${barRows(prog.by_difficulty || {}, k => difficultyName(Number(k)))}</div></div>
    <div class="card"><h2>按考试阶段</h2><div class="bar-chart">${barRows(prog.by_stage || {}, k => k)}</div></div>
    ${(weakTopics.length || weakDiff.length) ? `
    <div class="card">
      <h2>薄弱环节</h2>
      ${weakTopics.map(t => `<div style="color:var(--error);margin:4px 0">· ${t}题正确率偏低，建议加强练习</div>`).join('')}
      ${weakDiff.map(d => `<div style="color:var(--warning);margin:4px 0">· ${d}难度用时较长</div>`).join('')}
    </div>` : ''}
    <div class="card" style="display:flex;gap:8px">
      <button class="btn btn-secondary" data-share-result>分享成绩</button>
      <button class="btn btn-secondary" data-action="export">导出数据</button>
    </div>
  `;
}

// ---- Exam History ----
async function renderExamHistory() {
  const exams = getExams().slice().reverse();
  if (!exams.length) {
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2>历史记录</h2>
          <button class="btn btn-secondary btn-sm" data-nav="home">返回</button>
        </div>
        <div style="color:var(--text-muted)">暂无历史考试记录。完成一次练习/考试后会自动保存。</div>
      </div>
    `;
  }

  const totalSessions = exams.length;
  const totalAnswered = exams.reduce((s, e) => s + (e.total || 0), 0);
  const totalCorrect = exams.reduce((s, e) => s + (e.correct || 0), 0);
  const overallRate = totalAnswered ? Math.round(totalCorrect / totalAnswered * 100) : 0;

  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2>历史记录</h2>
        <button class="btn btn-secondary btn-sm" data-nav="home">返回</button>
      </div>
      <div class="stats" style="margin-bottom:0">
        <div class="stat-card"><div class="num">${totalSessions}</div><div class="label">场次</div></div>
        <div class="stat-card"><div class="num">${totalAnswered}</div><div class="label">总题数</div></div>
        <div class="stat-card"><div class="num">${overallRate}%</div><div class="label">总体正确率</div></div>
        <div class="stat-card"><div class="num">${formatTime(Math.round(exams.reduce((s, e) => s + (e.total_time || 0), 0) / totalSessions))}</div><div class="label">平均用时</div></div>
      </div>
    </div>
    <div class="card">
      <h2>场次列表</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn btn-secondary btn-sm" data-action="clear-exams">清空历史</button>
        <div style="color:var(--text-muted);font-size:0.8rem;align-self:center">提示：点击某一场可查看详情并复习</div>
      </div>
      ${exams.map(e => `
        <div class="tree-item" data-exam-detail="${e.id}">
          <span>
            ${e.tp === 'grade' ? '模拟考试' : '练习'} · ${formatUnix(e.sa)} · ${e.correct}/${e.total} (${e.sc}%)<br/>
            <span style="color:var(--text-muted);font-size:0.8rem">${scopeSummary(e.scope)}</span>
          </span>
          <span style="color:var(--text-muted)">${formatTime(e.total_time || 0)}</span>
        </div>
      `).join('')}
    </div>
    <div class="card hidden" id="examDetailCard"></div>
  `;
}

// ---- Wrong Book ----
async function renderWrongBook(params) {
  const wrong = getWrong();
  let entries = Object.entries(wrong).filter(([, v]) => v.st !== 'mastered').sort((a, b) => b[1].wc - a[1].wc);
  if (!entries.length) return '<div class="card"><h2>错题本</h2><p>暂无错题，继续保持！</p></div>';

  // Load problem details
  const allDetails = [];
  for (const [pid, info] of entries) {
    const parts = pid.split('_');
    const g = Number(parts[0]);
    const y = Number(parts[1]);
    const n = Number(parts[parts.length - 1]);
    const stem = parts.slice(2, -1).join('_');
    const problems = await loadProblems(g, y);
    const p = problems.find(x => {
      if (Number(x.number) !== n) return false;
      const xStem = (x.source_file || '').replace(/\.(doc|docx|pdf)$/i, '');
      return stem ? xStem === stem : true;
    });
    if (p) allDetails.push({ ...p, pid, wrongInfo: info });
  }

  // Filters
  const fGrade = params?.wrongGrade || '';
  const fTopic = params?.wrongTopic || '';
  const fDiff = params?.wrongDiff || '';
  let filtered = allDetails;
  if (fGrade) filtered = filtered.filter(d => String(d.grade) === fGrade);
  if (fTopic) filtered = filtered.filter(d => d.topic === fTopic);
  if (fDiff) filtered = filtered.filter(d => String(d.difficulty) === fDiff);

  window._filteredWrongProblems = filtered;

  return `
    <div class="card">
      <h2>错题本 (${entries.length}题, 筛选${filtered.length}题)</h2>
      <div class="chips" style="margin-bottom:8px">
        <span class="chip ${!fGrade?'selected':''}" data-wrong-filter="grade_">全部年级</span>
        ${[3,4,5,6].map(g => `<span class="chip ${fGrade==String(g)?'selected':''}" data-wrong-filter="grade_${g}">${g}年级</span>`).join('')}
      </div>
      <div class="chips" style="margin-bottom:8px">
        <span class="chip ${!fTopic?'selected':''}" data-wrong-filter="topic_">全部题型</span>
        ${['arithmetic','algebra','geometry','number_theory','combinatorics','logic'].map(t => `<span class="chip ${fTopic===t?'selected':''}" data-wrong-filter="topic_${t}">${topicName(t)}</span>`).join('')}
      </div>
      <div class="chips" style="margin-bottom:12px">
        <span class="chip ${!fDiff?'selected':''}" data-wrong-filter="diff_">全部难度</span>
        ${[1,2,3].map(d => `<span class="chip ${fDiff==String(d)?'selected':''}" data-wrong-filter="diff_${d}">${difficultyName(d)}</span>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn btn-primary btn-sm" id="practiceWrong">错题重做 (${filtered.length}题)</button>
      </div>
      ${filtered.slice(0, 100).map(d => `
        <div class="tree-item" data-detail="${d.pid}">
          <span>${d.grade}年级${d.year}年 #${d.number} <span class="tag tag-topic">${topicName(d.topic)}</span> <span class="tag tag-diff">${difficultyName(d.difficulty)}</span> <span style="color:var(--error)">✗${d.wrongInfo.wc}</span></span>
          <span style="color:var(--text-muted);font-size:0.8rem">${d.wrongInfo.st === 'cooling' ? '冷却至'+d.wrongInfo.nr : d.wrongInfo.lw}</span>
        </div>
      `).join('')}
      ${filtered.length > 100 ? `<div style="color:var(--text-muted);margin-top:8px">显示前100题</div>` : ''}
    </div>
  `;
}

// ---- Help ----
function renderHelp() {
  return `
    <div class="card">
      <h2>使用帮助</h2>

      <h3>界面布局</h3>
      <p>系统采用三栏布局：</p>
      <ul>
        <li><strong>左栏</strong>：题目列表，按顺序显示，点击跳转，✓/✗ 标记对错。点"☰ 列表"可隐藏。</li>
        <li><strong>中栏</strong>：题目内容、答题区、计时、进度条。</li>
        <li><strong>右栏</strong>：原卷 PDF 页面图片，点击可放大查看。</li>
      </ul>
      <p>手机端自动折叠为单栏。</p>

      <h3>练习模式</h3>
      <ol>
        <li>选择年级、题型、难度、考试阶段</li>
        <li>选择模式：随机 / 按顺序 / 错题重做</li>
        <li>勾选"排除已做过的题"避免重复</li>
        <li>选择题目数量，点击"开始练习"</li>
        <li>答题：填空题输入答案后按 <kbd>Ctrl+Enter</kbd> 或点"提交答案"</li>
        <li>选择题直接点击 A/B/C/D 按钮</li>
        <li>提交后先显示对错与用时；点击“查看答案/解析”再展示</li>
      </ol>

      <h3>原卷页面查看器</h3>
      <ul>
        <li>点击右栏图片 → 全屏放大</li>
        <li><strong>缩放</strong>：滚轮、<kbd>+</kbd> <kbd>-</kbd> 键、底部按钮</li>
        <li><strong>拖拽</strong>：按住鼠标/手指拖动</li>
        <li><strong>重置</strong>：<kbd>0</kbd> 键或底部按钮</li>
        <li><strong>关闭</strong>：<kbd>Esc</kbd> 键或点击背景、底部 ✕</li>
      </ul>

      <h3>考试模式</h3>
      <ul>
        <li><strong>模拟考试</strong>：选年级+年份+卷别，按真实考试组卷</li>
        <li><strong>专项训练</strong>：选年级+题型+难度+数量，针对薄弱环节</li>
        <li>考试结束后显示：正确率、答题用时、总耗时、逐题详情</li>
      </ul>

      <h3>题目浏览</h3>
      <ul>
        <li><strong>全部列表</strong>：所有年级+年份，显示题目数和已做进度</li>
        <li><strong>按年级</strong>：树形展开</li>
        <li><strong>按题型</strong>：算术/代数/几何/数论/组合/逻辑分类</li>
        <li>点击题目可直接进入答题</li>
      </ul>

      <h3>成绩分析</h3>
      <ul>
        <li>总做题数、正确率、平均用时</li>
        <li>按题型/难度/考试阶段的正确率柱状图</li>
        <li>薄弱环节自动检测（正确率 &lt; 60%）</li>
      </ul>

      <h3>错题本</h3>
      <ul>
        <li>答错自动记录，按错误次数排序</li>
        <li>间隔重复：答对 → 冷却 1天 → 3天 → 7天 → 掌握归档</li>
        <li>点"错题重做"进入练习模式</li>
      </ul>

      <h3>快捷键</h3>
      <table style="width:100%;border-collapse:collapse;margin:8px 0">
        <tr style="border-bottom:1px solid var(--glass-border)"><td style="padding:6px"><kbd>Ctrl+Enter</kbd></td><td style="padding:6px">提交答案</td></tr>
        <tr style="border-bottom:1px solid var(--glass-border)"><td style="padding:6px"><kbd>← →</kbd></td><td style="padding:6px">上/下一题</td></tr>
        <tr style="border-bottom:1px solid var(--glass-border)"><td style="padding:6px"><kbd>+ -</kbd></td><td style="padding:6px">图片缩放</td></tr>
        <tr style="border-bottom:1px solid var(--glass-border)"><td style="padding:6px"><kbd>0</kbd></td><td style="padding:6px">重置图片</td></tr>
        <tr><td style="padding:6px"><kbd>Esc</kbd></td><td style="padding:6px">关闭图片查看</td></tr>
      </table>

      <h3>数据管理</h3>
      <ul>
        <li>所有数据在浏览器 localStorage 中，无需登录</li>
        <li>设置 → 导出备份：下载 JSON 文件</li>
        <li>设置 → 导入备份：从 JSON 恢复（跨设备同步）</li>
        <li>建议定期备份，清除浏览器缓存会丢失数据</li>
      </ul>

      <h3>题目来源</h3>
      <p>迎春杯（数学花园探秘）数学竞赛真题，3-6 年级，2010-2024 年，共 715 道题。95% 有答案，73% 有解析。</p>
    </div>
  `;
}

// ---- Settings ----
function renderSettings() {
  const settings = getSettings();
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  return `
    <div class="card">
      <h2>设置</h2>
      <div class="input-group"><label>默认年级</label>
        <div class="chips" data-field="set-grade">
          ${[3,4,5,6].map(g => `<span class="chip ${g===settings.default_grade?'selected':''}" data-val="${g}">${g}年级</span>`).join('')}
        </div>
      </div>
      <div class="input-group"><label>主题</label>
        <div class="chips" data-field="set-theme">
          <span class="chip ${currentTheme==='dark'?'selected':''}" data-val="dark">深色</span>
          <span class="chip ${currentTheme==='light'?'selected':''}" data-val="light">浅色</span>
        </div>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-secondary" data-action="export" style="margin-right:8px">导出备份</button>
        <button class="btn btn-secondary" data-action="import">导入备份</button>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-error btn-sm" data-action="clear">清除所有数据</button>
      </div>
    </div>
  `;
}

// ---- Helpers ----
function escHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function stripMarkdownImages(text) {
  const t = text || '';
  const without = t.replace(/!\[[^\]]*]\([^)]+\)/g, '');
  return without.replace(/\n{3,}/g, '\n\n').trim();
}

function renderProblemTextHtml(text) {
  const raw = text || '';
  if (!raw.includes('<table')) {
    return `<div class="problem-text">${escHtml(raw)}</div>`;
  }

  // Safe subset: only render table structure; all cell contents are text.
  // Everything else is treated as plain text.
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return `<div class="problem-text">${escHtml(raw)}</div>`;

  const out = [];
  const pushText = (t) => { if (t) out.push(escHtml(t)); };
  const renderTable = (tableEl) => {
    const rows = [];
    tableEl.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th,td').forEach(cell => {
        const tag = cell.tagName.toLowerCase();
        cells.push(`<${tag}>${escHtml(cell.textContent || '')}</${tag}>`);
      });
      rows.push(`<tr>${cells.join('')}</tr>`);
    });
    out.push(`<table class="yc-table">${rows.join('')}</table>`);
  };

  const walk = (node) => {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) { pushText(node.textContent || ''); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'table') { renderTable(node); return; }
    const blocky = ['div', 'p', 'br', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (blocky.includes(tag)) out.push('\n');
    node.childNodes.forEach(walk);
    if (blocky.includes(tag)) out.push('\n');
  };

  root.childNodes.forEach(walk);
  const html = out.join('').replace(/\n{3,}/g, '\n\n');
  return `<div class="problem-text">${html}</div>`;
}

function formatDateTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatUnix(sec) {
  if (!sec) return '';
  return formatDateTime(Number(sec) * 1000);
}

function scopeSummary(scope) {
  if (!scope) return '';
  const s = scope || {};
  if (s.type === 'exam') {
    const parts = [`${s.grade}年级`, `${s.year}年`];
    if (s.stage) parts.push(s.stage);
    if (s.variant) parts.push(s.variant);
    return parts.join(' · ');
  }
  if (s.type === 'training') {
    const parts = [`专项`, `${s.grade}年级`];
    if (Array.isArray(s.topics) && s.topics.length) parts.push(`题型:${s.topics.map(topicName).join('/')}`);
    if (Array.isArray(s.diffs) && s.diffs.length) parts.push(`难度:${s.diffs.map(difficultyName).join('/')}`);
    if (s.count) parts.push(`数量:${s.count}`);
    return parts.join(' · ');
  }
  if (s.mode === 'custom') return '自定义题单';
  // practice setup selection
  const parts = [];
  if (Array.isArray(s.grades) && s.grades.length) parts.push(`年级:${s.grades.join('/')}`);
  if (Array.isArray(s.topics) && s.topics.length) parts.push(`题型:${s.topics.map(topicName).join('/')}`);
  if (Array.isArray(s.difficulties) && s.difficulties.length) parts.push(`难度:${s.difficulties.map(difficultyName).join('/')}`);
  if (Array.isArray(s.stages) && s.stages.length) parts.push(`阶段:${s.stages.join('/')}`);
  if (s.mode) parts.push(`模式:${s.mode}`);
  if (s.count) parts.push(`数量:${s.count}`);
  if (s.excludeDone !== undefined) parts.push(s.excludeDone ? '排除已做' : '包含已做');
  return parts.join(' · ');
}

function getSelections() {
  const getChips = (field) => [...document.querySelectorAll(`.chips[data-field="${field}"] .chip.selected`)].map(c => c.dataset.val);
  const grades = getChips('grade').map(Number);
  const topics = getChips('topic');
  const difficulties = getChips('difficulty').map(Number);
  const stages = getChips('stage');
  const mode = (getChips('mode')[0] || 'random');
  const count = Number(getChips('count')[0] || 10);
  const excludeDone = document.getElementById('excludeDone')?.checked ?? true;
  return { grades, topics, difficulties, stages, mode, count, excludeDone };
}

// ---- Event Binding ----
function bindEvents() {
  // Bind global delegated events only once. `bindEvents()` runs after every render,
  // so binding these repeatedly would cause duplicate handlers and make chips look
  // “unclickable” (toggled twice).
  if (!_globalDelegates.chips) {
    _globalDelegates.chips = true;
    // Chips toggle - event delegation (works for dynamic chips too)
    document.addEventListener('click', e => {
      const chip = e.target.closest('.chips .chip');
      if (!chip) return;
      const field = chip.parentElement?.dataset.field;
      if (!field) return;
      const singleSelect = ['grade', 'exam-grade', 'train-grade', 'set-grade', 'mode', 'count', 'browse-mode', 'exam-variant', 'exam-stage', 'exam-year', 'train-count'];
      if (singleSelect.includes(field)) {
        chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      } else {
        chip.classList.toggle('selected');
      }
    });
  }

  // Navigation
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.onclick = () => navigate(el.dataset.nav);
  });
  document.getElementById('startDaily')?.addEventListener('click', async () => {
    if (!dailyState.problem) await ensureDailyProblemLoaded({ force: true });
    if (!dailyState.problem) return;
    practiceState = { problems: [dailyState.problem], index: 0, answers: [], startTime: Date.now(), timers: [0], questionStart: Date.now(), scope: { mode: 'daily', dateKey: dailyState.dateKey, offset: dailyState.offset } };
    navigate('practice');
  });
  document.getElementById('refreshDaily')?.addEventListener('click', async () => {
    const next = getDailyOffset() + 1;
    setDailyOffset(next);
    dailyState.offset = next;
    await ensureDailyProblemLoaded({ force: true });
  });
  // Practice start
  document.getElementById('startPractice')?.addEventListener('click', () => navigate('practice', { start: true }));
  // Sidebar toggle
  document.getElementById('toggleSidebar')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('collapsed');
  });
  // Problem list navigation
  document.querySelectorAll('[data-practice-goto]').forEach(el => {
    el.onclick = () => {
      // Save accumulated time for current problem
      practiceState.timers[practiceState.index] = (practiceState.timers[practiceState.index] || 0) + Math.floor((Date.now() - practiceState.questionStart) / 1000);
      practiceState.index = Number(el.dataset.practiceGoto);
      practiceState.questionStart = Date.now();
      render();
    };
  });
  // Practice submit
  document.querySelectorAll('[data-practice]').forEach(el => {
    el.onclick = async () => {
      const action = el.dataset.practice;
      if (action === 'submit' || action === 'submit-choice') {
        await submitPracticeAnswer();
      } else if (action === 'next') {
        // Save accumulated time for current problem
        practiceState.timers[practiceState.index] = (practiceState.timers[practiceState.index] || 0) + Math.floor((Date.now() - practiceState.questionStart) / 1000);
        practiceState.index++;
        practiceState.questionStart = Date.now();
        render();
      } else if (action === 'prev') {
        practiceState.timers[practiceState.index] = (practiceState.timers[practiceState.index] || 0) + Math.floor((Date.now() - practiceState.questionStart) / 1000);
        practiceState.index = Math.max(0, practiceState.index - 1);
        practiceState.questionStart = Date.now();
        render();
      } else if (action === 'finish') {
        navigate('practice');
      } else if (action === 'quit') {
        practiceState = null;
        examState = null;
        navigate('home');
      }
    };
  });
  // Choice buttons
  document.querySelectorAll('[data-choice]').forEach(el => {
    el.onclick = () => {
      document.querySelectorAll('[data-choice]').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
    };
  });
  // Browse
  document.querySelectorAll('[data-browse]').forEach(el => {
    el.onclick = () => {
      const parts = el.dataset.browse.split('_');
      navigate('browse', { grade: Number(parts[0]), year: Number(parts[1]) });
    };
  });
  document.querySelectorAll('[data-browse-year]').forEach(el => {
    el.onclick = () => {
      const [g, y] = el.dataset.browseYear.split('_');
      navigate('browse', { grade: Number(g), year: Number(y) });
    };
  });
  document.querySelectorAll('[data-browse-topic]').forEach(el => {
    el.onclick = () => {
      const [g, t] = el.dataset.browseTopic.split('_');
      navigate('browse', { grade: Number(g), topic: t });
    };
  });
  document.querySelectorAll('[data-browse-exam]').forEach(el => {
    el.onclick = () => {
      const parts = el.dataset.browseExam.split('_');
      const exam = parts.slice(2).join('_');
      navigate('browse', { grade: Number(parts[0]), year: Number(parts[1]), exam });
    };
  });
  document.querySelectorAll('[data-browse-exam-filter]').forEach(el => {
    el.onclick = () => {
      const parts = el.dataset.browseExamFilter.split('_');
      navigate('browse', { grade: Number(parts[0]), year: Number(parts[1]), exam: parts[2], topic: parts[3] || '' });
    };
  });
  document.querySelectorAll('[data-browse-open-exam]').forEach(el => {
    el.onclick = async () => {
      const parts = el.dataset.browseOpenExam.split('_');
      const grade = Number(parts[0]);
      const year = Number(parts[1]);
      const exam = parts[2] || '';
      const topic = parts[3] || '';
      const problems = await loadProblems(grade, year);
      let examProblems = exam ? problems.filter(p => p.source_file === exam) : problems;
      if (topic) examProblems = examProblems.filter(p => p.topic === topic);
      if (!examProblems.length) return;
      practiceState = { problems: examProblems, index: 0, answers: [], startTime: Date.now(), timers: examProblems.map(() => 0), questionStart: Date.now(), type: 'browse', scope: { type: 'browse', grade, year, exam, topic } };
      navigate('practice');
    };
  });
  document.querySelectorAll('[data-browse-params]').forEach(el => {
    el.onclick = () => {
      const params = {};
      el.dataset.browseParams.split(';').forEach(p => {
        const [k, v] = p.split('=');
        params[k] = v;
      });
      navigate('browse', params);
    };
  });
  document.querySelectorAll('[data-detail]').forEach(el => {
    el.onclick = () => showProblemDetail(el.dataset.detail);
  });
  // Exam history detail
  document.querySelectorAll('[data-exam-detail]').forEach(el => {
    el.onclick = () => showExamDetail(el.dataset.examDetail);
  });
  // Exam cascading filters - use single event delegation
  document.getElementById('startExam')?.addEventListener('click', startExam);
  document.getElementById('startTraining')?.addEventListener('click', startTraining);

  // Exam setup UI refresh: avoid loading the whole dataset on first entry.
  // Only load the selected grade+year file when needed.
  refreshExamUI();

  async function refreshExamUI(clickedField) {
    const index = await loadIndex();

    // Read the values currently selected in the DOM (after the click toggled them)
    let grade = document.querySelector('[data-field="exam-grade"] .chip.selected')?.dataset.val;
    let year = document.querySelector('[data-field="exam-year"] .chip.selected')?.dataset.val;
    let stage = document.querySelector('[data-field="exam-stage"] .chip.selected')?.dataset.val;
    let variant = document.querySelector('[data-field="exam-variant"] .chip.selected')?.dataset.val;

    if (!grade) grade = Object.keys(index.grades)[0] || '5';

    const years = (index.grades[String(grade)]?.years || []).slice().map(Number).sort((a, b) => b - a);
    
    // Cascade reset logic based on what was clicked:
    if (clickedField === 'exam-grade') {
      year = years[0];
      stage = "";
      variant = "";
    } else if (clickedField === 'exam-year') {
      stage = "";
      variant = "";
    } else if (clickedField === 'exam-stage') {
      variant = "";
    }
    
    // Normalize year
    if (!year || !years.includes(Number(year))) {
      year = years[0];
    }
    
    // Load only this grade+year problems to compute stages/variants.
    showLoading({ title: '加载考试信息…', text: `正在读取：${grade}年级 ${year}年` });
    await nextFrame();
    const problemsForYear = await loadProblems(Number(grade), Number(year));
    hideLoading();

    const stages = new Set();
    const variants = new Set();
    const stageVariantMap = {};
    for (const p of problemsForYear) {
      const s = p.exam?.stage || '其他';
      const v = p.exam?.variant || '';
      stages.add(s);
      if (v) variants.add(v);
      if (!stageVariantMap[s]) stageVariantMap[s] = new Set();
      if (v) stageVariantMap[s].add(v);
    }
    const stagesList = [...stages].filter(s => s !== '其他');
    
    // Normalize stage
    if (stage && !stagesList.includes(stage)) {
      stage = "";
    }
    
    // Get valid variants for this stage
    let validVariants = [];
    if (stage) {
      validVariants = [...(stageVariantMap?.[stage] || [])];
    } else {
      validVariants = [...variants];
    }
    validVariants = validVariants.filter(v => v);
    
    // Normalize variant
    if (variant && !validVariants.includes(variant)) {
      variant = "";
    }

    // Render Year chips
    const yearEl = document.getElementById('examYearChips');
    if (yearEl) {
      yearEl.innerHTML = years.map(y => {
        return `<span class="chip ${Number(y)===Number(year)?'selected':''}" data-field="exam-year" data-val="${y}">${y}年</span>`;
      }).join('');
    }

    // Render Stage chips
    const stageEl = document.getElementById('examStageChips');
    if (stageEl) {
      stageEl.innerHTML = `<span class="chip ${!stage?'selected':''}" data-field="exam-stage" data-val="">全部</span>` +
        stagesList.map(s => `<span class="chip ${s===stage?'selected':''}" data-field="exam-stage" data-val="${s}">${s}</span>`).join('');
    }

    // Render Variant chips
    const varEl = document.getElementById('examVariantChips');
    if (varEl) {
      varEl.innerHTML = `<span class="chip ${!variant?'selected':''}" data-field="exam-variant" data-val="">全部</span>` +
        validVariants.map(v => `<span class="chip ${v===variant?'selected':''}" data-field="exam-variant" data-val="${v}">${v}</span>`).join('');
    }

    // Filter count to display details
    {
      let filtered = problemsForYear;
      if (stage) {
        filtered = filtered.filter(p => (p.exam?.stage || '其他') === stage);
      }
      if (variant) {
        filtered = filtered.filter(p => p.exam?.variant === variant);
      }
      
      // Strict exam pool: only scan_action=keep (and basic text sanity).
      const strict = filterProblems(filtered, { requireQuestionText: true, pool: 'exam' });

      const infoEl = document.getElementById('examInfo');
      if (infoEl) {
        const strictHint = strict.length === filtered.length
          ? `全部 <strong>${filtered.length}</strong> 题都可用于考试。`
          : `共有 <strong>${filtered.length}</strong> 题，其中 <strong>${strict.length}</strong> 题可用于考试（严格模式：无答案泄露）。其余建议在“练习/浏览”中使用或进一步修复。`;
        infoEl.innerHTML = `当前选择: <strong>${grade}年级 ${year}年</strong>${stage ? ` · <strong>${stage}</strong>` : ''}${variant ? ` · <strong>${variant}</strong>` : ''}。<br/>${strictHint}<br/><span style="color:var(--text-muted); font-size:0.8rem; display:block; margin-top:4px;">💡 提示：点击已选中的年级芯片，可以重置下方的年份、阶段和卷别筛选。</span>`;
      }
    }
  }

  // Make the latest refresh function available to the one-time listener
  window._refreshExamUI = refreshExamUI;

  // After any exam chip click, refresh the exam UI (bind once)
  if (!_globalDelegates.exam_refresh) {
    _globalDelegates.exam_refresh = true;
    document.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const field = chip.parentElement?.dataset.field || chip.dataset.field;
      if (field && field.startsWith('exam-')) {
        setTimeout(() => window._refreshExamUI?.(field), 0);
      }
    });
  }
  // Wrong book
  document.getElementById('practiceWrong')?.addEventListener('click', () => {
    if (window._filteredWrongProblems) {
      navigate('practice', { start: true, _problems: window._filteredWrongProblems });
    }
  });
  document.querySelectorAll('[data-wrong-filter]').forEach(el => {
    el.onclick = () => {
      const [type, val] = el.dataset.wrongFilter.split('_');
      const params = {};
      params[`wrong${type.charAt(0).toUpperCase()+type.slice(1)}`] = val;
      navigate('wrong', params);
    };
  });
  // Actions
  document.querySelectorAll('[data-action]').forEach(el => {
    el.onclick = () => {
      if (el.dataset.action === 'export') downloadExport();
      if (el.dataset.action === 'import') doImport();
      if (el.dataset.action === 'clear') { if (confirm('确定清除所有数据？')) { localStorage.clear(); location.reload(); } }
      if (el.dataset.action === 'clear-exams') {
        if (confirm('确定清空历史考试记录？（不影响做题进度/错题本）')) {
          localStorage.setItem('yc_exams', JSON.stringify([]));
          render();
        }
      }
    };
  });
  // Share
  document.querySelectorAll('[data-share-result]').forEach(el => {
    el.onclick = () => shareResult();
  });
  // Settings grade
  document.querySelectorAll('[data-field="set-grade"] .chip').forEach(el => {
    el.addEventListener('click', () => {
      const settings = getSettings();
      settings.default_grade = Number(el.dataset.val);
      saveSettings(settings);
    });
  });
  // Settings theme
  document.querySelectorAll('[data-field="set-theme"] .chip').forEach(el => {
    el.addEventListener('click', () => {
      const theme = el.dataset.val;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('yc_theme', theme);
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = theme === 'dark' ? '☀' : '🌙';
    });
  });
  // Keyboard shortcuts (bind once)
  if (!_globalDelegates.keydown) {
    _globalDelegates.keydown = true;
    document.addEventListener('keydown', handleKeydown);
  }
  // Timer update
  if (practiceState && practiceState.index < practiceState.problems.length) {
    clearInterval(window._timerInterval);
    window._timerInterval = setInterval(() => {
      const timerEl = document.getElementById('timer');
      if (timerEl) {
        const accumulated = practiceState.timers[practiceState.index] || 0;
        const current = Math.floor((Date.now() - practiceState.questionStart) / 1000);
        timerEl.textContent = formatTime(accumulated + current);
      }
      const nowEl = document.getElementById('sessionNowAt');
      if (nowEl) nowEl.textContent = formatDateTime(Date.now());
      const elapsedEl = document.getElementById('sessionElapsed');
      if (elapsedEl) elapsedEl.textContent = formatTime(Math.floor((Date.now() - practiceState.startTime) / 1000));
    }, 1000);
  }
  // Update exam years if on exam page
  updateExamYears();

  // Scratchpad Drawing Logic
  const scratchpad = document.getElementById('scratchpad');
  const canvas = document.getElementById('scratchCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      if (ctx) {
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
    
    // Toggle scratchpad open/close
    document.getElementById('toggleScratch')?.addEventListener('click', () => {
      scratchpad.classList.toggle('open');
      if (scratchpad.classList.contains('open')) {
        setTimeout(resizeCanvas, 50);
      }
    });

    document.getElementById('clearScratch')?.addEventListener('click', () => {
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById('closeScratch')?.addEventListener('click', () => {
      scratchpad.classList.remove('open');
    });

    let drawing = false;
    let lastX = 0, lastY = 0;

    const startDraw = (e) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
    };

    const draw = (e) => {
      if (!drawing || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x;
      lastY = y;
    };

    const stopDraw = () => {
      drawing = false;
    };

    // Use pointer events to support Apple Pencil and touch screen along with mouse
    canvas.addEventListener('pointerdown', startDraw);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDraw);
    canvas.addEventListener('pointerout', stopDraw);
  }
}

async function submitPracticeAnswer() {
  if (!practiceState) return;
  const { problems, index, answers, timers } = practiceState;
  if (answers[index] !== undefined) return; // Already answered
  const p = problems[index];
  const inputEl = document.getElementById('answerInput');
  const selectedChoice = document.querySelector('[data-choice].selected');
  const userAnswer = inputEl ? inputEl.value : selectedChoice ? selectedChoice.dataset.choice : '';
  if (!userAnswer.trim()) return;
  // Use accumulated time
  const timeSpent = (timers[index] || 0) + Math.floor((Date.now() - practiceState.questionStart) / 1000);
  const result = gradeAnswer(userAnswer, p.answer, p.type);
  const isCorrect = result.correct === true;
  answers[index] = { ua: userAnswer, correct: isCorrect, ts: timeSpent };
  recordAnswer(p, userAnswer, isCorrect, timeSpent);
  render();
}

async function startExam() {
  const grade = Number(document.querySelector('[data-field="exam-grade"] .chip.selected')?.dataset.val || 5);
  const year = Number(document.querySelector('[data-field="exam-year"] .chip.selected')?.dataset.val || 2018);
  const stage = document.querySelector('[data-field="exam-stage"] .chip.selected')?.dataset.val || '';
  const variant = document.querySelector('[data-field="exam-variant"] .chip.selected')?.dataset.val || '';
  let problems = await getExamProblems(grade, year, stage, variant);
  // Exam mode must not include broken/empty questions.
  problems = filterProblems(problems, { requireQuestionText: true, pool: 'exam' });
  if (!problems.length) {
    alert('该选择下没有题目，请调整筛选条件');
    return;
  }
  const scope = { type: 'exam', grade, year, stage, variant };
  navigate('exam', { start: true, problems, type: 'grade', scope });
}

async function startTraining() {
  const grade = Number(document.querySelector('[data-field="train-grade"] .chip.selected')?.dataset.val || 5);
  const topics = [...document.querySelectorAll('[data-field="train-topic"] .chip.selected')].map(c => c.dataset.val);
  const diffs = [...document.querySelectorAll('[data-field="train-diff"] .chip.selected')].map(c => Number(c.dataset.val));
  const count = Number(document.querySelector('[data-field="train-count"] .chip.selected')?.dataset.val || 10);
  const allProblems = await loadAllProblems(grade);
  let filtered = filterProblems(allProblems, { topic: topics, difficulty: diffs, requireQuestionText: true, pool: 'practice' });
  if (!filtered.length) {
    alert('该选择下没有题目，请调整筛选条件');
    return;
  }
  filtered = sample(filtered, count);
  // Pass scope through params so practiceState can persist it to history.
  navigate('practice', { start: true, _problems: filtered, scope: { type: 'training', grade, topics, diffs, count } });
}

async function updateExamYears() {
  const sel = document.getElementById('examYear');
  if (!sel) return;
  const grade = document.querySelector('[data-field="exam-grade"] .chip.selected')?.dataset.val || '5';
  const index = await loadIndex();
  const years = index.grades[grade]?.years || [];
  sel.innerHTML = years.sort((a, b) => b - a).map(y => `<option value="${y}">${y}年</option>`).join('');
}

function showProblemDetail(pid) {
  const parts = (pid || '').split('_');
  const g = Number(parts[0]);
  const y = Number(parts[1]);
  const n = Number(parts[parts.length - 1]);
  const stem = parts.slice(2, -1).join('_');

  // Navigate to a single-problem view (reuse practice with 1 problem)
  loadProblems(g, y).then(problems => {
    const p = problems.find(x => {
      if (Number(x.number) !== n) return false;
      const xStem = (x.source_file || '').replace(/\.(doc|docx|pdf)$/i, '');
      return stem ? xStem === stem : true;
    });
    if (p) {
      practiceState = { problems: [{ ...p, grade: g, year: y }], index: 0, answers: [], startTime: Date.now(), timers: [0], questionStart: Date.now() };
      navigate('practice');
    }
  });
}

async function showExamDetail(examId) {
  const exams = getExams();
  const e = exams.find(x => x.id === examId);
  const card = document.getElementById('examDetailCard');
  if (!card) return;
  if (!e) {
    card.classList.remove('hidden');
    card.innerHTML = `<h2>场次详情</h2><div style="color:var(--text-muted)">未找到该记录（可能已被清空）。</div>`;
    return;
  }

  // Build problem objects for review
  const problems = [];
  for (const pr of (e.p || [])) {
    try {
      const list = await loadProblems(pr.g, pr.y);
      const found = list.find(x => {
        if (Number(x.number) !== Number(pr.n)) return false;
        if (pr.sf) return (x.source_file || '') === pr.sf;
        return true;
      });
      if (found) problems.push({ ...found, grade: pr.g, year: pr.y });
    } catch {}
  }

  card.classList.remove('hidden');
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h2 style="margin-bottom:0">场次详情</h2>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" id="reviewExamBtn">复习本场</button>
      </div>
    </div>
    <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">
      类型: ${e.tp === 'grade' ? '模拟考试' : '练习'} · 开始: ${formatUnix(e.sa)} · 结束: ${formatUnix(e.fa)} · 总耗时: ${formatTime(e.total_time || 0)}
    </div>
    <div class="problem-meta" style="margin-bottom:12px">
      <span class="tag tag-diff">正确率 ${e.sc}%</span>
      <span class="tag tag-topic">正确 ${e.correct}/${e.total}</span>
    </div>
    <div style="max-height:320px;overflow:auto">
      ${(e.p || []).map((pr, i) => `
        <div class="tree-item" style="font-size:0.85rem">
          <span>${i + 1}. ${pr.g}年级${pr.y}年 #${pr.n} ${topicName(pr.t)} ${difficultyName(pr.d)}</span>
          <span style="color:${pr.ok ? 'var(--success)' : 'var(--error)'}">${pr.ok ? '✓' : '✗'} ${formatTime(pr.ts || 0)}</span>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('reviewExamBtn')?.addEventListener('click', () => {
    if (!problems.length) { alert('该场次题目未能完整加载，可能数据源已变更。'); return; }
    // Review mode: show the same problem set; do not prefill any answers.
    practiceState = { problems, index: 0, answers: [], startTime: Date.now(), timers: problems.map(() => 0), questionStart: Date.now(), type: 'review' };
    navigate('practice');
  });
}

function handleKeydown(e) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    document.querySelector('[data-practice="submit"]')?.click();
    document.querySelector('[data-practice="submit-choice"]')?.click();
  }
  if (e.key === 'ArrowRight' && !e.target.matches('input')) {
    document.querySelector('[data-practice="next"]')?.click();
  }
  if (e.key === 'ArrowLeft' && !e.target.matches('input')) {
    document.querySelector('[data-practice="prev"]')?.click();
  }
}

function downloadExport() {
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `yingchun_backup_${today()}.json`;
  a.click();
}

function doImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const text = await file.text();
    if (importData(text)) { alert('导入成功'); location.reload(); }
    else alert('导入失败：文件格式错误');
  };
  input.click();
}

function shareResult() {
  const prog = getProgress();
  const rate = prog.total_answered > 0 ? Math.round(prog.total_correct / prog.total_answered * 100) : 0;
  const text = `迎春杯练习成绩：做题${prog.total_answered}道，正确率${rate}%！`;
  if (navigator.share) {
    navigator.share({ title: '迎春杯成绩', text });
  } else {
    navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'));
  }
}

// ---- Init ----
export async function init() {
  try {
    // Apply saved theme
    const savedTheme = localStorage.getItem('yc_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Header nav
    const nav = document.querySelector('header nav');
    if (nav) {
      nav.innerHTML = `
        <button data-nav="home">首页</button>
        <button data-nav="practice-setup">练习</button>
        <button data-nav="exam-setup">考试</button>
        <button data-nav="browse">浏览</button>
        <button data-nav="analysis">分析</button>
        <button data-nav="wrong">错题</button>
        <button data-nav="settings">设置</button>
        <button data-nav="help">帮助</button>
        <button id="themeToggle" title="切换主题">${savedTheme === 'dark' ? '☀' : '🌙'}</button>
      `;
    }

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('yc_theme', next);
      document.getElementById('themeToggle').textContent = next === 'dark' ? '☀' : '🌙';
    });
    navigate('home');
  } catch (e) {
    console.error('Init error:', e);
    document.getElementById('app').innerHTML = `<div class="card"><h2>初始化出错</h2><p>${e.message}</p></div>`;
  }
}

init();

// Page image fallback: try zero-padded, then page-1
function tryPageFallback(img) {
  if (img._triedFallback) { img.style.display = 'none'; return; }
  img._triedFallback = true;
  const src = img.src;
  // If using yingchun2 dataset images (images_y2/...), there's no alternate naming scheme to try.
  if (src.includes('/images_y2/') || src.includes('images_y2/')) { img.style.display = 'none'; return; }
  // Try zero-padded: page-1.png → page-01.png
  const alt1 = src.replace(/page-(\d)\.png/, (m, d) => `page-${d.padStart(2,'0')}.png`);
  if (alt1 !== src) { img.src = alt1; return; }
  // Try page-1 as last resort (in case page number was wrong)
  const alt2 = src.replace(/page-\d+\.png/, 'page-1.png');
  if (alt2 !== src) { img.src = alt2; return; }
  img.style.display = 'none';
}

// ---- Image Viewer (zoom + drag) ----
(function() {
  const overlay = document.getElementById('imgViewer');
  const img = document.getElementById('imgViewerImg');
  const controls = document.getElementById('imgViewerControls');
  if (!overlay || !img) return;

  let scale = 1, panX = 0, panY = 0, dragging = false, startX, startY;

  function updateTransform() {
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  function openViewer(src) {
    img.src = src;
    scale = 1; panX = 0; panY = 0;
    updateTransform();
    overlay.classList.add('open');
    controls.style.display = 'flex';
  }

  function openViewerPreferJpg(src) {
    // For large page images, prefer a pre-compressed .jpg variant if available.
    // Fall back to original URL on error.
    if (typeof src === 'string' && src.includes('/images_y2/pages/') && src.endsWith('.png')) {
      const jpg = src.slice(0, -4) + '.jpg';
      img.onerror = () => {
        img.onerror = null;
        img.src = src;
      };
      openViewer(jpg);
      return;
    }
    img.onerror = null;
    openViewer(src);
  }

  function closeViewer() {
    overlay.classList.remove('open');
    controls.style.display = 'none';
  }

  // Click on page-ref image to open
  document.addEventListener('click', e => {
    if (e.target.matches('.page-ref img') && e.target.src) {
      e.preventDefault();
      openViewerPreferJpg(e.target.src);
    }
  });

  // Open page image from button (avoid preloading large page images)
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('[data-open-page-image]');
    if (!btn) return;
    const src = btn.dataset.openPageImage;
    if (!src) return;
    e.preventDefault();
    openViewerPreferJpg(src);
  });

  // Close on click outside image
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeViewer();
  });

  // Zoom with buttons
  document.getElementById('imgZoomIn')?.addEventListener('click', () => { scale = Math.min(scale * 1.3, 5); updateTransform(); });
  document.getElementById('imgZoomOut')?.addEventListener('click', () => { scale = Math.max(scale / 1.3, 0.3); updateTransform(); });
  document.getElementById('imgReset')?.addEventListener('click', () => { scale = 1; panX = 0; panY = 0; updateTransform(); });
  document.getElementById('imgClose')?.addEventListener('click', closeViewer);

  // Mouse wheel zoom
  overlay.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.max(0.3, Math.min(5, scale * delta));
    updateTransform();
  }, { passive: false });

  // Drag to pan
  overlay.addEventListener('pointerdown', e => {
    if (e.target === img || e.target === overlay) {
      dragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      overlay.classList.add('dragging');
      overlay.setPointerCapture(e.pointerId);
    }
  });
  overlay.addEventListener('pointermove', e => {
    if (!dragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
  });
  overlay.addEventListener('pointerup', () => {
    dragging = false;
    overlay.classList.remove('dragging');
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === '+' || e.key === '=') { scale = Math.min(scale * 1.3, 5); updateTransform(); }
    if (e.key === '-') { scale = Math.max(scale / 1.3, 0.3); updateTransform(); }
    if (e.key === '0') { scale = 1; panX = 0; panY = 0; updateTransform(); }
  });
})();
