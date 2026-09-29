/* game.js — state machine & rules for 民國教育委員會 網頁版. */
(function () {
  "use strict";

  var QUIZ_LEN = 10;
  var BASE_TIME = 20;          // seconds per question
  var RANKS = [
    { min: 0,     img: "assets/img/mascot-avatar.svg",
      name: { "zh-cn": "见习生", "zh-tw": "見習生" } },
    { min: 3000,  img: "assets/img/rank-jhs.svg",
      name: { "zh-cn": "理科学校毕业", "zh-tw": "理科學校畢業" } },
    { min: 6000,  img: "assets/img/rank-college.svg",
      name: { "zh-cn": "短期大学毕业", "zh-tw": "短期大學畢業" } },
    { min: 9000,  img: "assets/img/rank-uni.svg",
      name: { "zh-cn": "大学毕业", "zh-tw": "大學畢業" } },
    { min: 12000, img: "assets/img/mascot-avatar.svg",
      name: { "zh-cn": "天才", "zh-tw": "天才" } }
  ];

  var DIFFS = {
    1: { key: "easy", mult: 1.0, time: 22,
         name: { "zh-cn": "初级", "zh-tw": "初級" } },
    2: { key: "normal", mult: 1.4, time: 18,
         name: { "zh-cn": "中级", "zh-tw": "中級" } },
    3: { key: "hard", mult: 2.0, time: 15,
         name: { "zh-cn": "高级", "zh-tw": "上級" } }
  };

  function diffName(d, lang) {
    var dd = DIFFS[d];
    return dd ? (dd.name[lang] || dd.name["zh-cn"]) : "";
  }
  function rankName(rank, lang) {
    return rank.name[lang] || rank.name["zh-cn"];
  }

  /* ---------- 闯关模式（幼稚园 → 博士） ---------- */
  var CAREER = [
    { key: "yzy", diff: 1, name: { "zh-cn": "幼儿园", "zh-tw": "幼兒園" } },
    { key: "xx",  diff: 1, name: { "zh-cn": "小学",   "zh-tw": "國小" } },
    { key: "cz",  diff: 2, name: { "zh-cn": "初中",   "zh-tw": "國中" } },
    { key: "gz",  diff: 2, name: { "zh-cn": "高中",   "zh-tw": "高中" } },
    { key: "dx",  diff: 3, name: { "zh-cn": "大学",   "zh-tw": "大學" } },
    { key: "bs",  diff: 3, name: { "zh-cn": "博士班", "zh-tw": "博士班" } }
  ];
  var STAGE_LEN = 5;      // 每关题数
  var PASS_COUNT = 4;     // 晋级所需答对数

  function careerStageName(si, lang) {
    var st = CAREER[si];
    return st ? (st.name[lang] || st.name["zh-cn"]) : "";
  }

  function makeQ(q, stage) {
    var order = shuffle([0, 1, 2, 3]);
    return {
      id: q.id,
      category: q.category,
      q: q.q,
      choices: order.map(function (i) { return q.choices[i]; }),
      answer: order.indexOf(0),
      stage: stage
    };
  }

  /* 闯关会话：6 关 × 5 题共 30 题，题目按关卡难度分层。 */
  function newCareerSession(questions) {
    var flat = [];
    CAREER.forEach(function (st, si) {
      shuffle(questions.filter(function (q) { return q.difficulty === st.diff; }))
        .slice(0, STAGE_LEN)
        .forEach(function (q) { flat.push(makeQ(q, si)); });
    });
    return {
      mode: "career",
      difficulty: CAREER[0].diff,
      questions: flat,
      index: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      correctCount: 0,
      current: null,
      timeLeft: 0,
      answered: false,
      review: [],
      stage: 0
    };
  }

  /* 第 si 关的起始题下标 */
  function careerStageStart(session, si) {
    for (var i = 0; i < session.questions.length; i++) {
      if (session.questions[i].stage === si) return i;
    }
    return session.questions.length;
  }

  /* 某关的答对数（从 review 统计） */
  function careerStageCorrect(session, si) {
    return session.review.filter(function (r) {
      return r.stage === si && r.ok;
    }).length;
  }

  /* 是否处于某关的第一题（用于断点续玩时回到关卡介绍） */
  function careerAtStageStart(session) {
    if (session.mode !== "career" || session.answered) return false;
    var i = session.index;
    return i === 0 ||
      session.questions[i].stage !== session.questions[i - 1].stage;
  }

  /* ---------- 双人对战（PK）：同屏抢答 ----------
     每题双方同时作答；谁答错谁锁出（不能再答本题），另一人可继续；
     有人答对立即结束本题；双方都答错或超时则无分。对方已答错后
     答对者有 +20% 抢答加成。 */
  var PK_LEN = 10;

  function newPkSession(questions, difficulty, category) {
    var pool = questions.filter(function (q) {
      return q.difficulty === difficulty &&
             (category === "全部" || q.category === category);
    });
    if (pool.length < PK_LEN) {
      pool = questions.filter(function (q) {
        return category === "全部" || q.category === category;
      });
    }
    if (pool.length < PK_LEN) pool = questions.slice();
    var picked = shuffle(pool).slice(0, PK_LEN)
      .map(function (q) { return makeQ(q, undefined); });
    return {
      mode: "pk",
      difficulty: difficulty,
      category: category,
      questions: picked,
      index: 0,
      score: 0,
      players: [{ score: 0 }, { score: 0 }],
      streak: [0, 0],
      maxStreak: [0, 0],
      correctCount: [0, 0],
      current: null,
      timeLeft: 0,
      answered: false,        // 本题是否已终局
      answeredPl: [false, false],  // 各玩家本题是否已作答（答错也占用）
      review: []
    };
  }

  /* PK 计分：同快速模式公式；对方已答错后答对 → +20% 抢答加成 */
  function pkScoreFor(session, timeLeft, isSteal, p) {
    var mult = DIFFS[session.difficulty].mult;
    var speed = Math.round(300 * (timeLeft / timeFor(session)));
    var streakBonus = Math.min(session.streak[p], 5) * 40;
    var base = Math.round((500 + speed + streakBonus) * mult);
    return isSteal ? Math.round(base * 1.2) : base;
  }

  /* choiceIdx=-1 表示超时。返回 { ok, delta, resolved, player, isTimeout }。
     resolved=false 表示本题还有一名玩家未作答。 */
  function answerPk(session, p, choiceIdx, timeLeft) {
    if (!session.current || session.answered || session.answeredPl[p]) return null;
    var q = session.current;
    var ok = choiceIdx === q.answer;
    session.answeredPl[p] = true;
    var isSteal = session.answeredPl[1 - p] && !ok;
    var delta = 0;
    if (ok) {
      session.streak[p] += 1;
      session.maxStreak[p] = Math.max(session.maxStreak[p], session.streak[p]);
      session.correctCount[p] += 1;
      delta = pkScoreFor(session, timeLeft, isSteal, p);
      session.players[p].score += delta;
      session.score += delta;
      session.answered = true;
    } else {
      session.streak[p] = 0;
      if (session.answeredPl[0] && session.answeredPl[1]) {
        session.answered = true;   // 双方均错
      }
    }
    session.review.push({
      q: q.q, category: q.category, player: p,
      picked: choiceIdx < 0 ? null : q.choices[choiceIdx],
      correct: q.choices[q.answer],
      ok: ok, scoreDelta: delta,
      timeout: choiceIdx < 0
    });
    return { ok: ok, delta: delta, resolved: session.answered, player: p,
             isTimeout: choiceIdx < 0 };
  }

  /* 重修某关：换一批新题，回到该关开头（保留总分与 review） */
  function rebuildStage(session, questions, si) {
    var st = CAREER[si];
    var start = careerStageStart(session, si);
    var pool = questions.filter(function (q) {
      return q.difficulty === st.diff;
    });
    var used = {};
    session.questions.forEach(function (q) { used[q.id] = 1; });
    var avail = pool.filter(function (q) { return !used[q.id]; });
    if (avail.length < STAGE_LEN) avail = pool;
    var picked = shuffle(avail).slice(0, STAGE_LEN)
      .map(function (q) { return makeQ(q, si); });
    var before = session.questions.slice(0, start);
    var after = session.questions.slice(start + STAGE_LEN);
    session.questions = before.concat(picked, after);
    session.stage = si;
    session.difficulty = st.diff;
    session.index = start;
    session.answered = false;
    return session;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pickQuestions(pool, n) {
    return shuffle(pool).slice(0, n);
  }

  /* A fresh session: `difficulty` 1..3, `category` string or "全部". */
  function newSession(questions, difficulty, category) {
    var pool = questions.filter(function (q) {
      return q.difficulty === difficulty &&
             (category === "全部" || q.category === category);
    });
    if (pool.length < QUIZ_LEN) {
      pool = questions.filter(function (q) {
        return (category === "全部" || q.category === category);
      });
    }
    var picked = pickQuestions(pool, QUIZ_LEN).map(function (q) {
      // choices stored with correct answer at index 0 in the arcade database;
      // shuffle per session and remember the correct choice's text.
      return makeQ(q, undefined);
    });
    return {
      difficulty: difficulty,
      category: category,
      questions: picked,
      index: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      correctCount: 0,
      // per-question runtime state
      current: null,
      timeLeft: 0,
      answered: false,
      // answers log: {q, picked, correct, ok, scoreDelta}
      review: []
    };
  }

  function timeFor(session) {
    return DIFFS[session.difficulty].time;
  }

  function scoreFor(session, timeLeft, totalTime) {
    var mult = DIFFS[session.difficulty].mult;
    var speed = Math.round(300 * (timeLeft / totalTime));   // 0..300
    var streakBonus = Math.min(session.streak, 5) * 40;
    return Math.round((500 + speed + streakBonus) * mult);
  }

  function rankFor(score) {
    var r = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) if (score >= RANKS[i].min) r = RANKS[i];
    return r;
  }

  function answerCurrent(session, choiceIdx, timeLeft) {
    if (!session.current || session.answered) return null;
    var q = session.current;
    var ok = choiceIdx === q.answer;
    var delta = 0;
    if (ok) {
      session.streak += 1;
      session.maxStreak = Math.max(session.maxStreak, session.streak);
      session.correctCount += 1;
      delta = scoreFor(session, timeLeft, timeFor(session));
      session.score += delta;
    } else {
      session.streak = 0;
    }
    session.answered = true;
    var log = {
      q: q.q, category: q.category,
      stage: q.stage,
      picked: choiceIdx < 0 ? null : q.choices[choiceIdx],
      correct: q.choices[q.answer],
      ok: ok,
      scoreDelta: delta
    };
    session.review.push(log);
    return { ok: ok, delta: delta };
  }

  function advance(session) {
    session.index += 1;
    session.answered = false;
    session.current = session.index < session.questions.length
      ? session.questions[session.index] : null;
    session.timeLeft = timeFor(session);
    if (session.mode === "pk") {
      session.answeredPl = [false, false];  // 新题双方重新可答
    }
    return session.current;
  }

  function startCurrent(session) {
    session.current = session.questions[session.index];
    session.timeLeft = timeFor(session);
    session.answered = false;
    return session.current;
  }

  function isFinished(session) {
    return session.index >= session.questions.length;
  }

  function diffName(d, lang) {
    var dd = DIFFS[d];
    return dd ? (dd.name[lang] || dd.name["zh-cn"]) : "";
  }

  function rankName(rank, lang) {
    return rank.name[lang] || rank.name["zh-cn"];
  }

  /* persisted profile: best scores + totals */
  function defaultProfile() {
    return { best: {}, totalGames: 0, totalCorrect: 0, totalQuestions: 0,
             sound: true, lang: "zh-cn" };
  }

  window.MGGame = {
    QUIZ_LEN: QUIZ_LEN,
    DIFFS: DIFFS,
    RANKS: RANKS,
    CAREER: CAREER,
    STAGE_LEN: STAGE_LEN,
    PASS_COUNT: PASS_COUNT,
    newSession: newSession,
    newCareerSession: newCareerSession,
    careerStageName: careerStageName,
    careerStageCorrect: careerStageCorrect,
    careerAtStageStart: careerAtStageStart,
    rebuildStage: rebuildStage,
    startCurrent: startCurrent,
    answerCurrent: answerCurrent,
    advance: advance,
    isFinished: isFinished,
    timeFor: timeFor,
    rankFor: rankFor,
    PK_LEN: PK_LEN,
    newPkSession: newPkSession,
    answerPk: answerPk,
    diffName: diffName,
    rankName: rankName,
    defaultProfile: defaultProfile
  };
})();
