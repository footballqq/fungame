(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SquaresEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getSquaresInRange(minN, maxN) {
    const list = [];
    const start = Math.max(1, Number(minN) || 1);
    const end = Math.min(100, Number(maxN) || 100);
    for (let n = start; n <= end; n++) {
      list.push({ n: n, sq: n * n });
    }
    return list;
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /**
   * 为正算题 n² 生成 3 个高迷惑性干扰项：
   * 1. 同尾数近邻偏移（±10, ±20, ±100, ±200）—— 无法光背个位蒙对
   * 2. 同平方尾数的邻近底数平方（如 27²=729 配 23²=529 或 17²=289）
   * 3. 紧邻底数平方（(n±1)²）
   */
  function generateForwardDistractors(n) {
    const sq = n * n;
    const ansStr = String(sq);
    const minSameDigits = Math.pow(10, ansStr.length - 1);
    const maxSameDigits = Math.pow(10, ansStr.length) - 1;
    const picked = new Set([ansStr]);

    const sameLastCandidates = [];
    const offsets = [-100, 100, -20, 20, -10, 10, -200, 200, -30, 30, -40, 40];
    for (const off of offsets) {
      const cand = sq + off;
      if (cand >= minSameDigits && cand <= maxSameDigits && cand !== sq) {
        sameLastCandidates.push(String(cand));
      }
    }

    // 加入同平方尾数的其他底数平方（如 n=27 对应 23, 33, 17, 37）
    const unit = n % 10;
    const mirrorUnit = (10 - unit) % 10;
    for (let delta = -15; delta <= 15; delta++) {
      const m = n + delta;
      if (m >= 2 && m <= 100 && m !== n) {
        const mu = m % 10;
        if (mu === unit || mu === mirrorUnit) {
          const mSq = m * m;
          if (mSq >= minSameDigits && mSq <= maxSameDigits) {
            sameLastCandidates.push(String(mSq));
          }
        }
      }
    }

    // 优先挑选至少 2 个同尾数强迷惑项
    for (const c of shuffle(sameLastCandidates)) {
      if (picked.size >= 3) break;
      picked.add(c);
    }

    // 第 3 个干扰项优先放邻近底数平方或另一个同尾数偏移，保持极高迷惑性
    const extraCandidates = [];
    if (n - 1 >= 1) extraCandidates.push(String((n - 1) * (n - 1)));
    if (n + 1 <= 100) extraCandidates.push(String((n + 1) * (n + 1)));
    for (const c of shuffle(sameLastCandidates)) {
      extraCandidates.push(c);
    }

    for (const c of shuffle(extraCandidates)) {
      if (picked.size >= 4) break;
      if (c.length === ansStr.length) {
        picked.add(c);
      }
    }

    // 兜底补齐（防止极小数字如 1~3 位数过少）
    let step = 10;
    while (picked.size < 4) {
      picked.add(String(sq + step));
      step += 10;
    }

    return shuffle(Array.from(picked));
  }

  /**
   * 为反算题 √(n²) = n 生成 3 个高迷惑性干扰项：
   * 重点利用“平方尾数配对规律”：如 3 与 7 平方尾数都是 9，4 与 6 尾数都是 6，2 与 8 尾数都是 4！
   */
  function generateReverseDistractors(n, minN, maxN) {
    const ansStr = String(n);
    const picked = new Set([ansStr]);
    const unit = n % 10;
    const mirrorUnit = (10 - unit) % 10;
    const tens = Math.floor(n / 10);

    const strongConfusers = [];
    // 同十位互补尾数（如 47 -> 43）
    if (mirrorUnit !== unit) {
      const sameTenMirror = tens * 10 + mirrorUnit;
      if (sameTenMirror >= 1 && sameTenMirror <= 100 && sameTenMirror !== n) {
        strongConfusers.push(String(sameTenMirror));
      }
    }
    // 相邻十位同尾数（如 47 -> 37, 57）
    if (n - 10 >= 1) strongConfusers.push(String(n - 10));
    if (n + 10 <= 100) strongConfusers.push(String(n + 10));
    // 相邻十位互补尾数（如 47 -> 53, 33）
    if (mirrorUnit !== unit) {
      const upMirror = (tens + 1) * 10 + mirrorUnit;
      const downMirror = (tens - 1) * 10 + mirrorUnit;
      if (upMirror >= 1 && upMirror <= 100 && upMirror !== n) {
        strongConfusers.push(String(upMirror));
      }
      if (downMirror >= 1 && downMirror <= 100 && downMirror !== n) {
        strongConfusers.push(String(downMirror));
      }
    }

    for (const c of shuffle(strongConfusers)) {
      if (picked.size >= 3) break;
      picked.add(c);
    }

    // 补充近邻数字 ±1, ±2
    const nearCandidates = [n - 1, n + 1, n - 2, n + 2]
      .filter((x) => x >= Math.max(1, minN - 5) && x <= Math.min(100, maxN + 5) && x !== n)
      .map(String);

    for (const c of shuffle(nearCandidates.concat(strongConfusers))) {
      if (picked.size >= 4) break;
      picked.add(c);
    }

    let fallback = 1;
    while (picked.size < 4) {
      const cand = n + fallback;
      if (cand <= 100) picked.add(String(cand));
      fallback = fallback > 0 ? -fallback : -fallback + 1;
    }

    return shuffle(Array.from(picked));
  }

  function pickRandomN(minN, maxN, excludeSet, focusPool) {
    if (focusPool && focusPool.length > 0) {
      const validFocus = focusPool.filter((n) => n >= minN && n <= maxN && (!excludeSet || !excludeSet.has(n)));
      if (validFocus.length > 0 && Math.random() < 0.7) {
        return validFocus[Math.floor(Math.random() * validFocus.length)];
      }
    }
    const candidates = [];
    for (let n = minN; n <= maxN; n++) {
      if (!excludeSet || !excludeSet.has(n)) {
        candidates.push(n);
      }
    }
    if (candidates.length === 0) {
      return minN + Math.floor(Math.random() * (maxN - minN + 1));
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * 生成单道题目
   * @param {Object} opts - { minN, maxN, mode: 'forward'|'reverse'|'mixed', inputType: 'keypad'|'choice', excludeSet?, focusPool? }
   */
  function generateQuestion(opts) {
    const minN = Math.max(1, Number(opts.minN) || 11);
    const maxN = Math.min(100, Number(opts.maxN) || 30);
    const mode = opts.mode || 'forward';
    const inputType = opts.inputType || 'keypad';

    const n = pickRandomN(minN, maxN, opts.excludeSet, opts.focusPool);
    const sq = n * n;
    const direction =
      mode === 'mixed' ? (Math.random() < 0.5 ? 'forward' : 'reverse') : mode;

    const answer = direction === 'forward' ? String(sq) : String(n);
    const options =
      inputType === 'choice'
        ? direction === 'forward'
          ? generateForwardDistractors(n)
          : generateReverseDistractors(n, minN, maxN)
        : [];

    return {
      n: n,
      sq: sq,
      direction: direction,
      inputType: inputType,
      promptMain: direction === 'forward' ? `${n}²` : `√${sq}`,
      promptSub: direction === 'forward' ? `求 ${n} 的完全平方数` : `求 ${sq} 的平方根`,
      answer: answer,
      expectedDigits: answer.length,
      options: options,
    };
  }

  function generateQuestionBatch(count, opts) {
    const questions = [];
    const recent = new Set();
    const maxSpan = opts.maxN - opts.minN + 1;
    for (let i = 0; i < count; i++) {
      if (recent.size >= maxSpan) recent.clear();
      const q = generateQuestion({
        minN: opts.minN,
        maxN: opts.maxN,
        mode: opts.mode,
        inputType: opts.inputType,
        excludeSet: recent,
        focusPool: opts.focusPool,
      });
      recent.add(q.n);
      questions.push(q);
    }
    return questions;
  }

  /** 零反悔输入状态机 */
  function createInputState(expectedDigits) {
    return {
      expectedDigits: expectedDigits,
      value: '',
      locked: false,
      correct: null,
    };
  }

  /** 点击一个数字，填满位数瞬间自动锁定并判分，锁定后不可修改/反悔 */
  function appendDigitNoUndo(state, digit, answer) {
    if (state.locked) return state;
    const nextValue = state.value + String(digit);
    if (nextValue.length >= state.expectedDigits) {
      return {
        expectedDigits: state.expectedDigits,
        value: nextValue,
        locked: true,
        correct: nextValue === String(answer),
      };
    }
    return {
      expectedDigits: state.expectedDigits,
      value: nextValue,
      locked: false,
      correct: null,
    };
  }

  /** 创建双人 PK 赛局 */
  function createPkMatch(opts) {
    const totalRounds = Number(opts.totalRounds) || 10;
    const questions = generateQuestionBatch(totalRounds, opts);
    return {
      totalRounds: totalRounds,
      ruleType: opts.ruleType || 'both', // 'both': 同题双计制 | 'race': 抢答竞速制
      roundIndex: 0,
      questions: questions,
      roundSubmissions: {}, // { A?: { value, correct, timeMs }, B?: { ... } }
      roundWinner: null,
      history: [],
      players: {
        A: { name: '下方玩家', correct: 0, wrong: 0, score: 0, totalTimeMs: 0 },
        B: { name: '上方玩家', correct: 0, wrong: 0, score: 0, totalTimeMs: 0 },
      },
    };
  }

  function submitPkPlayerAnswer(match, playerKey, value, timeMs) {
    if (match.roundIndex >= match.totalRounds) return null;
    if (match.roundSubmissions[playerKey]) return null; // 零反悔：已锁定不可再提交

    const q = match.questions[match.roundIndex];
    const correct = String(value) === q.answer;
    const sub = { value: String(value), correct: correct, timeMs: timeMs || 0 };
    match.roundSubmissions[playerKey] = sub;

    const player = match.players[playerKey];
    if (correct) {
      player.correct += 1;
      player.score += 1;
      player.totalTimeMs += sub.timeMs;
      if (match.ruleType === 'race' && !match.roundWinner) {
        match.roundWinner = playerKey;
      }
    } else {
      player.wrong += 1;
    }

    return sub;
  }

  function isPkRoundFinished(match) {
    if (match.ruleType === 'race' && match.roundWinner) {
      return true;
    }
    return Boolean(match.roundSubmissions.A && match.roundSubmissions.B);
  }

  function advancePkRound(match) {
    const q = match.questions[match.roundIndex];
    match.history.push({
      round: match.roundIndex + 1,
      question: q,
      A: match.roundSubmissions.A || null,
      B: match.roundSubmissions.B || null,
      winner: match.roundWinner,
    });
    match.roundIndex += 1;
    match.roundSubmissions = {};
    match.roundWinner = null;
    return match.roundIndex >= match.totalRounds;
  }

  return {
    getSquaresInRange: getSquaresInRange,
    generateQuestion: generateQuestion,
    generateQuestionBatch: generateQuestionBatch,
    createInputState: createInputState,
    appendDigitNoUndo: appendDigitNoUndo,
    createPkMatch: createPkMatch,
    submitPkPlayerAnswer: submitPkPlayerAnswer,
    isPkRoundFinished: isPkRoundFinished,
    advancePkRound: advancePkRound,
  };
});
