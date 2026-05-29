// 工具函数
console.log('utils.js loading...');

export function normalizeAnswer(ans) {
  if (!ans) return "";
  return ans.toString().trim()
    .replace(/\s+/g, "")
    .replace(/，/g, ",").replace(/。/g, ".").replace(/；/g, ";").replace(/：/g, ":")
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 65248))
    .replace(/[＋－×÷＝]/g, s => ({'＋':'+','－':'-','×':'*','÷':'/','＝':'='}[s] || s))
    .toLowerCase();
}

export function gradeAnswer(userAns, correctAns, problemType) {
  if (!correctAns) return { correct: null, msg: "无标准答案" };
  if (problemType === "solution") return { correct: null, msg: "解答题请自行核对" };
  const ua = normalizeAnswer(userAns);
  const ca = normalizeAnswer(correctAns);
  if (!ua) return { correct: false, msg: "未作答" };
  // Multi-answer: split by , or 、
  if (ca.includes(",") || ca.includes("、")) {
    const uParts = ua.split(/[,、]/).map(s => s.trim());
    const cParts = ca.split(/[,、]/).map(s => s.trim());
    if (uParts.length !== cParts.length) return { correct: false, msg: `答案应有${cParts.length}个部分` };
    const allMatch = uParts.every((u, i) => u === cParts[i]);
    return { correct: allMatch, msg: allMatch ? "正确" : "错误" };
  }
  return { correct: ua === ca, msg: ua === ca ? "正确" : "错误" };
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

export function topicName(t) {
  const map = {
    arithmetic: "算术", algebra: "代数", geometry: "几何",
    number_theory: "数论", combinatorics: "组合", logic: "逻辑", general: "综合"
  };
  return map[t] || t;
}

export function difficultyName(d) {
  return { 1: "初级", 2: "中级", 3: "高级" }[d] || `D${d}`;
}

export function stageName(s) {
  return s || "";
}

export function problemId(g, y, n) { return `${g}_${y}_${n}`; }

export function today() { return new Date().toISOString().slice(0, 10); }

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// Fisher-Yates shuffle, return first n
export function sample(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
