// localStorage 数据管理
console.log('store.js loading...');
import { uuid, today, problemId } from './utils.js';

const KEYS = {
  USER_ID: 'yc_user_id',
  SETTINGS: 'yc_settings',
  PROGRESS: 'yc_progress',
  HISTORY: 'yc_history',
  DONE: 'yc_done',
  WRONG: 'yc_wrong',
  EXAMS: 'yc_exams',
};

function get(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

export function getUserId() {
  let id = localStorage.getItem(KEYS.USER_ID);
  if (!id) { id = uuid(); localStorage.setItem(KEYS.USER_ID, id); }
  return id;
}

export function getSettings() {
  return get(KEYS.SETTINGS, { default_grade: 5, theme: 'dark', show_answer_mode: 'click' });
}
export function saveSettings(s) { set(KEYS.SETTINGS, s); }

export function getProgress() {
  return get(KEYS.PROGRESS, { total_answered: 0, total_correct: 0, by_grade: {}, by_topic: {}, by_difficulty: {}, by_stage: {} });
}
export function saveProgress(p) { set(KEYS.PROGRESS, p); }

export function getHistory() { return get(KEYS.HISTORY, []); }
export function saveHistory(h) { set(KEYS.HISTORY, h); }

export function getDone() { return get(KEYS.DONE, {}); }
export function saveDone(d) { set(KEYS.DONE, d); }

export function getWrong() { return get(KEYS.WRONG, {}); }
export function saveWrong(w) { set(KEYS.WRONG, w); }

export function getExams() { return get(KEYS.EXAMS, []); }
export function saveExams(e) { set(KEYS.EXAMS, e); }

// Record a single answer
export function recordAnswer(problem, userAnswer, isCorrect, timeSpent) {
  const pid = problemId(problem.grade, problem.year, problem.number);
  const ts = Math.floor(Date.now() / 1000);

  // History (append, keep last 2000)
  const history = getHistory();
  history.push({ id: pid, g: problem.grade, y: problem.year, n: problem.number, t: problem.topic, d: problem.difficulty, ua: userAnswer, ca: problem.answer, ok: isCorrect, ts: timeSpent, at: ts });
  if (history.length > 2000) history.splice(0, history.length - 2000);
  saveHistory(history);

  // Done set
  const done = getDone();
  done[pid] = isCorrect ? 1 : 0;
  saveDone(done);

  // Progress
  const prog = getProgress();
  prog.total_answered++;
  if (isCorrect) prog.total_correct++;
  const gKey = String(problem.grade);
  const tKey = problem.topic || 'general';
  const dKey = String(problem.difficulty || 1);
  const sKey = problem.exam?.stage || '未知';
  for (const [bucket, key] of [['by_grade', gKey], ['by_topic', tKey], ['by_difficulty', dKey], ['by_stage', sKey]]) {
    if (!prog[bucket][key]) prog[bucket][key] = { a: 0, c: 0 };
    prog[bucket][key].a++;
    if (isCorrect) prog[bucket][key].c++;
  }
  saveProgress(prog);

  // Wrong book
  if (!isCorrect) {
    const wrong = getWrong();
    if (!wrong[pid]) {
      wrong[pid] = { wc: 0, lw: today(), st: 'learning', lv: 0, nr: today() };
    }
    wrong[pid].wc++;
    wrong[pid].lw = today();
    wrong[pid].st = 'learning';
    wrong[pid].lv = 0;
    wrong[pid].nr = today();
    saveWrong(wrong);
  } else {
    // Check if this was a wrong-book review → advance level
    const wrong = getWrong();
    if (wrong[pid] && wrong[pid].st !== 'mastered') {
      wrong[pid].lv++;
      const intervals = [0, 1, 3, 7];
      if (wrong[pid].lv >= 4) {
        wrong[pid].st = 'mastered';
      } else {
        wrong[pid].st = 'cooling';
        const d = new Date();
        d.setDate(d.getDate() + intervals[wrong[pid].lv]);
        wrong[pid].nr = d.toISOString().slice(0, 10);
      }
      saveWrong(wrong);
    }
  }
}

// Export all data
export function exportData() {
  const data = {};
  for (const k of Object.values(KEYS)) {
    data[k] = localStorage.getItem(k);
  }
  return JSON.stringify(data, null, 2);
}

// Import data
export function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    for (const [k, v] of Object.entries(data)) {
      if (Object.values(KEYS).includes(k) && v) localStorage.setItem(k, v);
    }
    return true;
  } catch { return false; }
}

// Forward-compatible storage migrations.
// Keep it safe: any localStorage access must be guarded.
export function runMigrations() {
  try {
    // Reserved for future schema changes.
  } catch (e) {
    console.warn('runMigrations skipped:', e);
  }
}
