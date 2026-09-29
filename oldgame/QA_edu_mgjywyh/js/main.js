/* main.js — bootstrap, data loading, timer loop, save/resume, language. */
(function () {
  "use strict";

  var state = {
    questions: [],
    session: null,
    difficulty: 1,
    category: "全部",
    lang: "zh-cn",          // "zh-cn" (默认) | "zh-tw"
    timerId: null,
    profile: null,
    bootstrapped: false
  };

  /* ---------- helpers ---------- */
  function T(key, params) { return MGUI.T(key, params); }

  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function categories() {
    var set = {};
    state.questions.forEach(function (q) { set[q.category] = 1; });
    return Object.keys(set).sort();
  }

  function nextCategory() {
    // “全部”（全科随机大杂烩）也参与循环，确保随时能绕回全科
    var cats = ["全部"].concat(categories());
    var i = cats.indexOf(state.category);
    state.category = cats[(i + 1) % cats.length];
  }

  function persist() {
    // profile 常驻；session 只在进行中时保存
    var s = state.session;
    MGStorage.save({
      version: 1,
      session: (s && !s.finished && !MGGame.isFinished(s)) ? s : null,
      difficulty: state.difficulty,
      category: state.category,
      lang: state.lang,
      profile: state.profile
    });
  }

  function saveInfoText(session) {
    if (!session) return null;
    if (MGGame.isFinished(session)) return null;
    return MGUI.T("resumeDesc", { i: session.index + 1, n: session.questions.length, s: session.score });
  }

  function updateStorageStatus() {
    var elc = document.getElementById("storage-status");
    elc.textContent = MGStorage.isMemory() ? T("storageWarn") : "";
  }

  function updateSoundBtn() {
    document.getElementById("btn-sound").textContent = MGAudio.isEnabled() ? "🔊" : "🔇";
  }

  function updateLangBtn() {
    // 按钮显示"要切换到"的语言
    document.getElementById("btn-lang").textContent = state.lang === "zh-cn" ? "繁" : "简";
  }

  /* ---------- data loading ---------- */
  function bankFile(lang) {
    return "data/questions." + (lang === "zh-tw" ? "zh-tw" : "zh-cn") + ".json";
  }

  function embeddedBank(lang) {
    var d = window.__QUESTIONS_DATA__;
    if (!d) return null;
    if (d.questions) return d;                    // 旧版单语言内嵌（繁体）
    return d[lang] || d["zh-tw"] || null;
  }

  function loadQuestions(lang) {
    var embedded = embeddedBank(lang);
    if (embedded && Array.isArray(embedded.questions) && embedded.questions.length) {
      return Promise.resolve(embedded);
    }
    return fetch(bankFile(lang))
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
  }

  function validateQuestions(data) {
    if (!data || !Array.isArray(data.questions) || !data.questions.length) {
      throw new Error("questions[] missing");
    }
    var ok = [];
    var bad = 0;
    data.questions.forEach(function (q) {
      if (q && typeof q.q === "string" && Array.isArray(q.choices) &&
          q.choices.length === 4 &&
          q.choices.every(function (c) { return typeof c === "string" && c; }) &&
          typeof q.answer === "number" && q.answer >= 0 && q.answer <= 3) {
        ok.push(q);
      } else {
        bad++;
      }
    });
    if (!ok.length) throw new Error("no valid questions");
    if (bad) console.warn("[loader] skipped " + bad + " invalid questions");
    return ok;
  }

  /* ---------- screens ---------- */
  function showTitle() {
    stopTimer();
    MGUI.setLang(state.lang);

    if (!state.bootstrapped) {
      var saved = MGStorage.load();
      state.profile = (saved && saved.profile) || MGGame.defaultProfile();
      if (saved) {
        state.difficulty = saved.difficulty || state.difficulty;
        state.category = saved.category || state.category;
        state.lang = saved.lang || state.lang;
        // 科目名跟题库语言走：不存在于当前题库则重置为“全部”
        var catSet = {};
        state.questions.forEach(function (q) { catSet[q.category] = 1; });
        if (!catSet[state.category]) state.category = "全部";
        if (saved.session && !MGGame.isFinished(saved.session)) {
          state.session = saved.session;
        }
      }
      if (!state.profile.lang) state.profile.lang = state.lang;
      state.bootstrapped = true;
    }

    MGUI.setLang(state.lang);
    MGAudio.setEnabled(state.profile.sound !== false);
    updateSoundBtn();
    updateLangBtn();

    if (!(state.session && !MGGame.isFinished(state.session))) {
      state.session = null;
    }

    MGUI.showTitle({
      quizLen: MGGame.QUIZ_LEN,
      difficulty: state.difficulty,
      category: state.category,
      lang: state.lang,
      questionCount: state.questions.length,
      categoryCount: state.category === "全部" ? state.questions.length
        : state.questions.filter(function (q) {
            return q.category === state.category; }).length,
      saveInfo: saveInfoText(state.session),
      showClearSave: true,
      statsHtml: statsHtml(),
      onStart: startNew,
      onStartCareer: startCareer,
      onStartPk: startPk,
      onResume: resumeCareer,
      onDifficulty: function (d) { state.difficulty = d; persist(); showTitle(); },
      onCategory: function () {
        nextCategory();
        MGAudio.click();
        persist();
        showTitle();
      },
      onClearSave: function () {
        MGStorage.clear();
        state.session = null;
        state.profile = MGGame.defaultProfile();
        state.profile.lang = state.lang;
        state.bootstrapped = true;
        toast(T("toastCleared"));
        showTitle();
      }
    });
    updateStorageStatus();
  }

  function statsHtml() {
    var p = state.profile || MGGame.defaultProfile();
    var bestKey = "d" + state.difficulty;
    var best = (p.best && p.best[bestKey]) || 0;
    return MGUI.T("bestLine", {
      d: MGGame.diffName(state.difficulty, state.lang), s: best,
      g: p.totalGames || 0, c: p.totalCorrect || 0
    });
  }

  function startNew() {
    MGAudio.unlock();
    MGAudio.click();
    var s = MGGame.newSession(state.questions, state.difficulty, state.category);
    if (!s.questions.length) {
      MGUI.showError(T("loadFail"), T("emptySubject"), showTitle);
      return;
    }
    state.session = s;
    MGGame.startCurrent(s);
    persist();
    renderQuestion();
  }

  function resume() {
    MGAudio.unlock();
    if (!state.session) return showTitle();
    if (state.session.current == null) MGGame.startCurrent(state.session);
    renderQuestion();
  }

  /* ---------- 闯关模式 ---------- */
  function startCareer() {
    MGAudio.unlock();
    MGAudio.click();
    var s = MGGame.newCareerSession(state.questions);
    if (!s.questions.length) {
      MGUI.showError(T("loadFail"), T("emptySubject"), showTitle);
      return;
    }
    state.session = s;
    persist();
    showStageIntro();
  }

  function resumeCareer() {
    MGAudio.unlock();
    var s = state.session;
    if (!s) return showTitle();
    if (s.mode === "career" && MGGame.careerAtStageStart(s) && !s.answered) {
      // 停在关卡边界（介绍/晋级画面）→ 回到关卡介绍
      showStageIntro();
      return;
    }
    if (s.current == null) MGGame.startCurrent(s);
    renderQuestion();
  }

  function showStageIntro() {
    var s = state.session;
    persist();
    MGUI.showStageIntro(s, {
      lang: state.lang,
      onBegin: function () {
        MGAudio.click();
        MGGame.startCurrent(s);
        renderQuestion();
      }
    });
  }

  /* 过关判定：本关答对数 >= PASS_COUNT → 晋级/毕业；否则留级。
     先把 session.stage/索引调整到位再持久化，保证断点续玩落在正确画面。 */
  function settleStage() {
    var s = state.session;
    var si = s.stage;
    var correct = MGGame.careerStageCorrect(s, si);
    var lastStage = si >= MGGame.CAREER.length - 1;
    if (correct >= MGGame.PASS_COUNT) {
      if (lastStage) {
        finishCareer();
        return;
      }
      s.stage = si + 1;
      s.difficulty = MGGame.CAREER[s.stage].diff;
      persist();
      MGUI.showPromotion(s, {
        lang: state.lang,
        onContinue: function () {
          MGAudio.click();
          MGGame.startCurrent(s);
          renderQuestion();
        }
      });
    } else {
      MGGame.rebuildStage(s, state.questions, si);  // 换题 + 索引回到本关开头
      persist();
      MGUI.showCareerOver(s, {
        lang: state.lang,
        onRetry: function () {
          MGAudio.click();
          showStageIntro();
        },
        onRestart: startCareer,
        onHome: showTitle
      });
    }
  }

  function finishCareer() {
    var s = state.session;
    var p = state.profile || MGGame.defaultProfile();
    var prevBest = p.careerBest || 0;
    var isBest = s.score > prevBest;
    if (isBest) p.careerBest = s.score;
    s.finished = true;
    state.session = null;
    persist();
    MGAudio.fanfare();
    MGUI.showGraduation(s, isBest, {
      lang: state.lang,
      onAgain: startCareer,
      onHome: showTitle
    });
  }

  /* ---------- quiz flow ---------- */
  function renderQuestion() {
    var s = state.session;
    MGUI.renderQuestion(s, { onChoice: onChoice }, state.lang);
    if (s.answered) {
      // 恢复到“已作答待确认”的中间态
      MGUI.updateTimer(s.timeLeft / MGGame.timeFor(s));
      var last = s.review && s.review[s.review.length - 1];
      var pickedIdx = -1;
      if (last && last.picked != null) {
        pickedIdx = s.current.choices.indexOf(last.picked);
      }
      MGUI.lockChoices();
      MGUI.showFeedback(s, { ok: last ? last.ok : false, delta: last ? last.scoreDelta : 0 },
        pickedIdx, next);
      return;
    }
    MGUI.updateTimer(1);
    startTimer();
    persist();
  }

  function startTimer() {
    stopTimer();
    var last = Date.now();
    state.timerId = setInterval(function () {
      var now = Date.now();
      var dt = (now - last) / 1000;
      last = now;
      var s = state.session;
      if (!s || s.answered) return;
      s.timeLeft = Math.max(0, s.timeLeft - dt);
      MGUI.updateTimer(s.timeLeft / MGGame.timeFor(s));
      if (s.timeLeft <= 6 && s.timeLeft + dt > 6) toast(T("toastSix"));
      if (s.timeLeft <= 0) {
        if (s.mode === "pk") pkTimeout();
        else onChoice(-1);
      }
    }, 200);
  }

  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  function onChoice(idx) {
    var s = state.session;
    if (!s || s.answered) return;
    stopTimer();
    var result = MGGame.answerCurrent(s, idx, s.timeLeft);
    MGAudio[result.ok ? "correct" : "wrong"]();
    MGUI.lockChoices();
    MGUI.showFeedback(s, result, idx, next);
    persist();
  }

  function next() {
    MGAudio.click();
    var s = state.session;
    var prevStage = s.current ? s.current.stage : null;
    MGGame.advance(s);
    if (s.mode === "career") {
      var nextStage = s.questions[s.index] ? s.questions[s.index].stage : null;
      if (nextStage !== prevStage) {
        // 关卡边界：结算本关
        s.stage = prevStage;
        settleStage();
        return;
      }
      renderQuestion();
      return;
    }
    if (MGGame.isFinished(s)) {
      finish();
    } else {
      renderQuestion();
    }
  }

  function finish() {
    stopTimer();
    var s = state.session;
    var p = state.profile || MGGame.defaultProfile();
    p.totalGames = (p.totalGames || 0) + 1;
    p.totalCorrect = (p.totalCorrect || 0) + s.correctCount;
    var bestKey = "d" + s.difficulty;
    var prevBest = (p.best && p.best[bestKey]) || 0;
    var isBest = s.score > prevBest;
    if (isBest) {
      if (!p.best) p.best = {};
      p.best[bestKey] = s.score;
    }
    s.finished = true;
    state.session = null;
    persist();
    if (s.correctCount >= 8) MGAudio.fanfare(); else MGAudio.gameover();
    MGUI.showResult(s, isBest, {
      lang: state.lang,
      onAgain: startNew,
      onHome: showTitle
    });
  }

  /* ---------- 双人对战（PK） ---------- */
  function startPk() {
    MGAudio.unlock();
    MGAudio.click();
    var s = MGGame.newPkSession(state.questions, state.difficulty, state.category);
    if (!s.questions.length) {
      MGUI.showError(T("loadFail"), T("emptySubject"), showTitle);
      return;
    }
    state.session = s;
    MGGame.startCurrent(s);
    persist();
    renderPk();
  }

  function renderPk() {
    var s = state.session;
    MGUI.renderPkQuestion(s, { onChoice: onChoice }, state.lang);
    MGUI.bindPkPads(onPkChoice);
    if (s.answered) {
      // 恢复到已终局待确认的中间态
      MGUI.updateTimer(s.timeLeft / MGGame.timeFor(s));
      replayPkFeedback();
      return;
    }
    if (s.answeredPl && (s.answeredPl[0] || s.answeredPl[1])) {
      // 恢复到"一人已答错锁出"的中间态：计时继续
      MGUI.updateTimer(s.timeLeft / MGGame.timeFor(s));
      var last = s.review && s.review[s.review.length - 1];
      MGUI.showPkSteal(s, { player: last ? last.player : 0 });
      startTimer();
      return;
    }
    MGUI.updateTimer(1);
    startTimer();
    persist();
  }

  function replayPkFeedback() {
    var s = state.session;
    var last = s.review && s.review[s.review.length - 1];
    var ok = last ? last.ok : false;
    var delta = last ? last.scoreDelta : 0;
    MGUI.showPkFeedback(s, { ok: ok, delta: delta, player: last ? last.player : 0,
      resolved: true }, pkNext);
  }

  function onPkChoice(p, idx) {
    var s = state.session;
    if (!s || s.mode !== "pk" || s.answered || s.answeredPl[p]) return;
    var result = MGGame.answerPk(s, p, idx, s.timeLeft);
    if (!result) return;
    if (!result.resolved) {
      // 对方答错锁出提示：不揭示答案，计时继续
      MGAudio.wrong();
      MGUI.showPkSteal(s, result);
      persist();
      return;
    }
    if (result.ok) MGAudio.correct(); else MGAudio.wrong();
    MGUI.showPkFeedback(s, result, pkNext);
    persist();
  }

  /* 本题超时：未答者按超时处理，题目终局 */
  function pkTimeout() {
    var s = state.session;
    if (!s || s.mode !== "pk" || s.answered) return;
    var pending = [0, 1].filter(function (p) { return !s.answeredPl[p]; });
    var result = null;
    if (pending.length === 1) {
      result = MGGame.answerPk(s, pending[0], -1, 0);
    } else {
      s.answered = true;
      s.review.push({ q: s.current.q, category: s.current.category,
        player: -1, picked: null, correct: s.current.choices[s.current.answer],
        ok: false, scoreDelta: 0, timeout: true });
      result = { ok: false, delta: 0, resolved: true, player: -1,
                 isTimeout: true };
    }
    MGAudio.wrong();
    MGUI.showPkFeedback(s, result, pkNext);
    persist();
  }

  function pkNext() {
    MGAudio.click();
    var s = state.session;
    MGGame.advance(s);
    if (MGGame.isFinished(s)) {
      finishPk();
    } else {
      renderPk();
    }
  }

  function finishPk() {
    stopTimer();
    var s = state.session;
    s.finished = true;
    state.session = null;
    persist();
    var p0 = s.players[0].score, p1 = s.players[1].score;
    if (p0 !== p1) MGAudio.fanfare(); else MGAudio.click();
    MGUI.showPkResult(s, { lang: state.lang, onAgain: startPk, onHome: showTitle });
  }

  /* ---------- language switch ---------- */
  function switchLang() {
    stopTimer();
    state.lang = state.lang === "zh-cn" ? "zh-tw" : "zh-cn";
    if (state.profile) state.profile.lang = state.lang;
    MGUI.setLang(state.lang);
    persist();
    updateLangBtn();
    toast(state.lang === "zh-cn" ? T("toastLang") : T("toastLangTw"));
    // 换题库重新加载后回标题（进行中的对局保留，仍可继续，但以原语言显示）
    loadQuestions(state.lang)
      .then(function (data) {
        state.questions = validateQuestions(data);
        state.category = categories().indexOf(state.category) >= 0
          ? state.category : "全部";
        showTitle();
      })
      .catch(function (err) {
        MGUI.showError(T("loadFail"), esc(String(err && err.message || err)), function () {
          state.bootstrapped = false;
          showTitle();
        });
      });
  }

  /* ---------- global error management ---------- */
  window.addEventListener("error", function (e) {
    try { toast(T("toastErr") + (e.message || "")); } catch (_) {}
  });
  window.addEventListener("unhandledrejection", function (e) {
    try { toast(T("toastErr") + ((e.reason && e.reason.message) || "")); } catch (_) {}
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopTimer();
    else if (state.session && !state.session.answered &&
             !MGGame.isFinished(state.session) &&
             document.getElementById("timer-fill")) {
      startTimer();
    }
  });

  document.addEventListener("keydown", function (e) {
    var s = state.session;
    if (!s || s.answered) {
      if (e.key === "Enter") {
        var nb = document.querySelector(".next-btn");
        if (nb) nb.click();
      }
      return;
    }
    if (s.mode === "pk") {
      if (e.key >= "1" && e.key <= "4" && !s.answeredPl[0]) {
        onPkChoice(0, parseInt(e.key, 10) - 1);
      } else if ((e.key === "7" || e.key === "8" || e.key === "9" || e.key === "0")
                 && !s.answeredPl[1]) {
        onPkChoice(1, { "7": 0, "8": 1, "9": 2, "0": 3 }[e.key]);
      }
      return;
    }
    var k = parseInt(e.key, 10);
    if (k >= 1 && k <= 4) onChoice(k - 1);
  });

  document.getElementById("btn-sound").addEventListener("click", function () {
    var v = !MGAudio.isEnabled();
    MGAudio.setEnabled(v);
    if (state.profile) {
      state.profile.sound = v;
      persist();
    }
    updateSoundBtn();
    if (v) MGAudio.click();
  });

  document.getElementById("btn-lang").addEventListener("click", switchLang);

  /* 测试/开发检查用：只读入口 */
  window.MGDebug = {
    get session() { return state.session; },
    get lang() { return state.lang; }
  };

  /* ---------- boot ---------- */
  function boot() {
    // 恢复保存的语言偏好，再加载对应题库
    var saved = MGStorage.load();
    if (saved && saved.lang) state.lang = saved.lang;
    MGUI.setLang(state.lang);
    loadQuestions(state.lang)
      .then(function (data) {
        state.questions = validateQuestions(data);
        showTitle();
      })
      .catch(function (err) {
        MGUI.showError(T("loadFail"),
          T("loadFailDetail", { msg: String(err && err.message || err) }),
          boot);
      });
  }

  boot();
})();
