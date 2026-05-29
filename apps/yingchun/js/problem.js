// 题目数据加载与管理
console.log('problem.js loading...');
import { problemId } from './utils.js';

let indexCache = null;
const problemCache = {};  // "grade_year" → problems array
let dataRoot = 'data';

async function mapWithConcurrency(items, limit, worker) {
  if (!items.length) return [];
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  async function run() {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => run()));
  return results;
}

export function setDataRoot(root) {
  dataRoot = root || 'data';
  indexCache = null;
  for (const k of Object.keys(problemCache)) delete problemCache[k];
}

export async function loadIndex() {
  if (indexCache) return indexCache;
  const resp = await fetch(`${dataRoot}/index.json`);
  indexCache = await resp.json();
  return indexCache;
}

export async function loadProblems(grade, year) {
  const key = `${grade}_${year}`;
  if (problemCache[key]) return problemCache[key];
  try {
    const resp = await fetch(`${dataRoot}/grade${grade}/${year}.json`);
    const data = await resp.json();
    // Add grade/year to each problem
    const problems = (data.problems || []).map(p => ({ ...p, grade, year }));
    problemCache[key] = problems;
    return problems;
  } catch {
    return [];
  }
}

export async function loadAllProblems(grade) {
  const index = await loadIndex();
  const gradeInfo = index.grades[String(grade)];
  if (!gradeInfo) return [];
  const yearProblems = await mapWithConcurrency(gradeInfo.years, 5, async year => loadProblems(grade, year));
  return yearProblems.flat();
}

export async function getProblemImage(problem) {
  // Return the cropped problem image path
  if (problem.problem_image) return problem.problem_image;
  // Fallback: construct path
  return `images/problems/grade${problem.grade}/${problem.year}/problem_${String(problem.number).padStart(2, '0')}.png`;
}

export function filterProblems(problems, opts = {}) {
  let filtered = problems;
  if (opts.pool) {
    filtered = filtered.filter(p => {
      const q = p.quality || {};
      const scanAction = q.scan_action || 'keep';
      const reviewAction = q.review_action;
      const reviewRepairable = q.review_repairable === true;

      if (opts.pool === 'exam') {
        // Exam must be strict: only blocks classified as clean question stems.
        return scanAction === 'keep';
      }

      if (opts.pool === 'practice' || opts.pool === 'browse') {
        // Practice/browse can include:
        // - scan keep/practice_only
        // - rescued drop_exam/drop_all when second-pass review says keep/practice_only AND repairable
        if (scanAction === 'keep' || scanAction === 'practice_only') return true;
        if ((scanAction === 'drop_exam' || scanAction === 'drop_all') && reviewRepairable && (reviewAction === 'keep' || reviewAction === 'practice_only')) {
          return true;
        }
        return false;
      }

      return true;
    });
  }
  if (opts.requireQuestionText) {
    filtered = filtered.filter(p => {
      const q = (p.text || '').trim();
      if (!q) return false;
      const compact = q.replace(/\s+/g, '');
      // Exclude pure numbering like "25." / "25．"
      if (/^\d{1,3}[\.．、]?$/.test(compact)) return false;
      // Exclude obvious section headers that are not standalone questions
      if (/^\s*##\s*/m.test(q) && /解答题/.test(q)) return false;
      return compact.length >= 10;
    });
  }
  if (opts.topic && opts.topic.length) {
    filtered = filtered.filter(p => opts.topic.includes(p.topic));
  }
  if (opts.difficulty && opts.difficulty.length) {
    filtered = filtered.filter(p => opts.difficulty.includes(p.difficulty));
  }
  if (opts.stage && opts.stage.length) {
    filtered = filtered.filter(p => opts.stage.includes(p.exam?.stage));
  }
  if (opts.minNumber) {
    filtered = filtered.filter(p => p.number >= opts.minNumber);
  }
  if (opts.maxNumber) {
    filtered = filtered.filter(p => p.number <= opts.maxNumber);
  }
  if (opts.excludeDone) {
    const done = JSON.parse(localStorage.getItem('yc_done') || '{}');
    filtered = filtered.filter(p => !done[problemId(p.grade, p.year, p.number, p.source_file || '')]);
  }
  if (opts.onlyWrong) {
    const wrong = JSON.parse(localStorage.getItem('yc_wrong') || '{}');
    filtered = filtered.filter(p => {
      const pid = problemId(p.grade, p.year, p.number, p.source_file || '');
      return wrong[pid] && wrong[pid].st !== 'mastered';
    });
  }
  return filtered;
}

export async function getExamProblems(grade, year, stage, variant) {
  const problems = await loadProblems(grade, year);
  let filtered = problems;
  if (stage) {
    filtered = filtered.filter(p => (p.exam?.stage || '其他') === stage);
  }
  if (variant) {
    filtered = filtered.filter(p => p.exam?.variant === variant);
  }
  return filtered;
}

export function getImagePath(problem, type = 'problem') {
  const base = type === 'page' ? 'images/pages' : 'images/problems';
  if (type === 'problem') {
    const stem = (problem.source_file || '').replace(/\.(doc|docx|pdf)$/i, '');
    return `${base}/grade${problem.grade}/${problem.year}/${stem}/problem_${String(problem.number).padStart(2, '0')}.png`;
  }
  return `${base}/grade${problem.grade}/${problem.year}/`;
}

export function getPageImagePath(problem) {
  const stem = (problem.source_file || '').replace(/\.(doc|docx|pdf)$/i, '');
  const page = problem.page || 1;
  // Default to non-padded (majority format: page-1.png)
  return `images/pages/grade${problem.grade}/${problem.year}/${stem}/page-${page}.png`;
}
