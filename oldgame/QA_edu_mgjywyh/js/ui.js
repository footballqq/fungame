/* ui.js — DOM rendering helpers for each screen (简/繁双语). */
(function () {
  "use strict";

  var L10N = {
    "zh-cn": {
      resume: "继续上次游戏", resumeDesc: "第 {i} / {n} 题 · 当前 {s} 分",
      start: "开始新游戏", startDesc: "每回 10 题，答得越快、连击越多，分数越高",
      difficulty: "难度", subject: "科目：{c}", subjectDesc: "本科 {n} 题 · 全库 {t} 题 · 点击切换",
      allSubjectDesc: "全科随机大杂烩 · 共 {t} 题 · 点击切换",
      modePk: "👥 双人对战", modePkDesc: "本机 PK · 10 题定胜负 · 答错换对方抢答同一题",
      pkP1: "1P", pkP2: "2P", pkVs: "VS",
      pkQNum: "第 {i} / {n} 题", pkRace: "双方同时抢答",
      pkSteal: "{a} 答错已锁出！{b} 可继续作答（+20%）", pkCorrect: "{p} 答对！ +{d} 分",
      pkTimeout: "时间到！正解：<b>{a}</b>",
      pkBothWrong: "双方都没答对！正解：<b>{a}</b>",
      pkWin: "{p} 获胜！", pkDraw: "平局！",
      pkHint: "键盘：1P = 1 2 3 4 · 2P = 7 8 9 0 · Enter 下一题",
      pkPadHint: "答到各自一侧的答题垫",
      clearSave: "清除存档与纪录",
      bestLine: "最高分（{d}）：<b>{s}</b> · 累计场次 <b>{g}</b> · 累计答对 <b>{c}</b> 题",
      qnum: "第 {i} / {n} 题 · 连击 ×{streak}", score: "SCORE",
      correct: "答对了！", plus: " 分", streakTxt: "（{n} 连击！）",
      wrong: "答错了。", timeout: "时间到！", answerIs: "正解：",
      next: "下一题", seeResult: "看结果",
      resultDetail: "答对 {c} / {n} 题 · 最高连击 ×{m}",
      curRank: "当前称号：<b>{r}</b>", nextRankAt: "累计 {s} 分晋级下一阶",
      newBest: "🏆 新纪录！", again: "再玩一次", againDesc: "同科目同难度，换一批题目",
      home: "回到标题", review: "本局答题回顾",
      soundOn: "音效开关",
      toastCleared: "存档已清除", toastLang: "已切换为简体中文",
      toastLangTw: "已切換為繁體中文", toastErr: "发生错误：",
      toastSix: "⏰ 剩下 6 秒！",
      loadFail: "题库载入失败",
      emptySubject: "该科目与难度组合暂无题目，请换一个组合。",
      modeCareer: "🎓 闯关求学", modeCareerDesc: "从幼儿园读到博士，每关 5 题答对 4 题晋级（全科混合，不分科目）",
      stageIntro: "第 {n} 关 · {name}", stageIntroDesc: "本关共 5 题，答对 4 题即可晋级；答错过多将被留级",
      beginStage: "开始本关", totalScore: "当前总分",
      promote: "晋级！", promoteTo: "升入 {name}", continueNext: "继续下一关",
      graduate: "毕业典礼！", graduateDesc: "你完成了从幼儿园到博士的全部学业",
      careerOver: "留级！", careerOverDesc: "「{name}」关答对 {c} / 5 题（需答对 4 题）",
      retryStage: "重新挑战本关", restartCareer: "从头再来",
      stageProgress: "第 {n} 关 · {name} · {i}/5",
      maxRank: "已是最高称号，继续刷新最高分吧！",
      loadFailDetail: "无法读取游戏资料（<code>{msg}</code>）。请通过本地服务器开启" +
        "（例如 <code>python -m http.server</code>），或重新载入页面。",
      reload: "重新加载",
      storageWarn: "⚠️ 无法使用本机储存（隐私模式？）——进度仅保留至关闭页面",
      kbdHint: "键盘：1-4 选择 · Enter 继续",
      mascot: "吉祥物"
    },
    "zh-tw": {
      resume: "繼續上次遊戲", resumeDesc: "第 {i} / {n} 題 · 目前 {s} 分",
      start: "開始新遊戲", startDesc: "每回 10 題，答得越快、連擊越多，分數越高",
      difficulty: "難度", subject: "科目：{c}", subjectDesc: "本科 {n} 題 · 全庫 {t} 題 · 點擊切換",
      allSubjectDesc: "全科隨機大雜燴 · 共 {t} 題 · 點擊切換",
      modePk: "👥 雙人對戰", modePkDesc: "本機 PK · 10 題定勝負 · 答錯換對方搶答同一題",
      pkP1: "1P", pkP2: "2P", pkVs: "VS",
      pkQNum: "第 {i} / {n} 題", pkRace: "雙方同時搶答",
      pkSteal: "{a} 答錯已鎖出！{b} 可繼續作答（+20%）", pkCorrect: "{p} 答對！ +{d} 分",
      pkTimeout: "時間到！正解：<b>{a}</b>",
      pkBothWrong: "雙方都沒答對！正解：<b>{a}</b>",
      pkWin: "{p} 獲勝！", pkDraw: "平局！",
      clearSave: "清除存檔與紀錄",
      bestLine: "最高分（{d}）：<b>{s}</b> · 累計場次 <b>{g}</b> · 累計答對 <b>{c}</b> 題",
      qnum: "第 {i} / {n} 題 · 連擊 ×{streak}", score: "SCORE",
      correct: "答對了！", plus: " 分", streakTxt: "（{n} 連擊！）",
      wrong: "答錯了。", timeout: "時間到！", answerIs: "正解：",
      next: "下一題", seeResult: "看結果",
      resultDetail: "答對 {c} / {n} 題 · 最高連擊 ×{m}",
      curRank: "當前稱號：<b>{r}</b>", nextRankAt: "累計 {s} 分晉級下一階",
      newBest: "🏆 新紀錄！", again: "再玩一次", againDesc: "同科目同難度，換一批題目",
      home: "回到標題", review: "本局答題回顧",
      soundOn: "音效開關",
      toastCleared: "存檔已清除", toastLang: "已切换为简体中文",
      toastLangTw: "已切換為繁體中文", toastErr: "發生錯誤：",
      toastSix: "⏰ 剩下 6 秒！",
      loadFail: "題庫載入失敗",
      emptySubject: "該科目與難度組合暫無題目，請換一個組合。",
      modeCareer: "🎓 闖關求學", modeCareerDesc: "從幼兒園讀到博士，每關 5 題答對 4 題晉級（全科混合，不分科目）",
      stageIntro: "第 {n} 關 · {name}", stageIntroDesc: "本關共 5 題，答對 4 題即可晉級；答錯過多將被留級",
      beginStage: "開始本關", totalScore: "當前總分",
      promote: "晉級！", promoteTo: "升入 {name}", continueNext: "繼續下一關",
      graduate: "畢業典禮！", graduateDesc: "你完成了從幼兒園到博士的全部學業",
      careerOver: "留級！", careerOverDesc: "「{name}」關答對 {c} / 5 題（需答對 4 題）",
      retryStage: "重新挑戰本關", restartCareer: "從頭再來",
      stageProgress: "第 {n} 關 · {name} · {i}/5",
      maxRank: "已是最高稱號，繼續刷新最高分吧！",
      loadFailDetail: "無法讀取遊戲資料（<code>{msg}</code>）。" +
        "請確認透過本地伺服器開啟（例如 <code>python -m http.server</code>），或重新載入頁面。",
      reload: "重新載入",
      storageWarn: "⚠️ 無法使用本機儲存（隱私模式？）——進度僅保留至關閉頁面",
      kbdHint: "鍵盤：1-4 選擇 · Enter 繼續",
      mascot: "吉祥物"
    }
  };

  var currentLang = "zh-cn";

  var HIDE_ON_ERR = 'onerror="this.style.display=\'none\'"';

  function T(key, params) {
    var s = (L10N[currentLang] || L10N["zh-cn"])[key] || key;
    if (params) {
      Object.keys(params).forEach(function (k) {
        s = s.split("{" + k + "}").join(String(params[k]));
      });
    }
    return s;
  }

  function setLang(lang) {
    currentLang = (lang === "zh-tw") ? "zh-tw" : "zh-cn";
  }
  function getLang() { return currentLang; }

  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var screen = function () { return document.getElementById("screen"); };
  var clear = function () { screen().innerHTML = ""; };

  function stagePos(session) {
    var i = session.index;
    var st = session.questions[i] ? session.questions[i].stage : session.stage;
    var pos = 0;
    for (var k = i; k >= 0 && session.questions[k] &&
         session.questions[k].stage === st; k--) pos++;
    return pos;
  }

  function showError(title, detail, retry) {
    clear();
    var box = el("div", "error-box");
    box.appendChild(el("h2", null, esc(title)));
    var p = el("p");
    p.innerHTML = detail;
    box.appendChild(p);
    if (retry) {
      var btn = el("button", "next-btn", T("reload"));
      btn.style.marginLeft = "0";
      btn.addEventListener("click", retry);
      box.appendChild(btn);
    }
    screen().appendChild(box);
  }

  /* ---------- title / menu ---------- */
  function showTitle(opts) {
    clear();
    var s = screen();

    var hero = el("div", "hero");
    hero.innerHTML =
      '<img class="hero__skyline" src="assets/img/skyline.png" alt="" onerror="this.style.display=\'none\'">' +
      '<img class="hero__mascot" src="assets/img/mascot-idle.svg" alt="' + T("mascot") + '" onerror="this.style.display=\'none\'">' +
      '<div class="hero__modes">' +
      '<img src="assets/img/mode-timer.svg" alt="限定時間內回答問題" onerror="this.style.display=\'none\'">' +
      '<img src="assets/img/mode-who.svg" alt="這個人是誰" onerror="this.style.display=\'none\'">' +
      '<img src="assets/img/mode-lie.svg" alt="謊言四選一" onerror="this.style.display=\'none\'">' +
      "</div>";
    s.appendChild(hero);

    var menu = el("div", "menu");

    if (opts.saveInfo) {
      var resume = el("button", "card-btn card-btn--primary");
      resume.innerHTML = '<span class="card-btn__icon">▶️</span><span>' +
        '<span class="card-btn__title">' + T("resume") + "</span><br>" +
        '<span class="card-btn__desc">' + esc(opts.saveInfo) + "</span></span>";
      resume.addEventListener("click", opts.onResume);
      menu.appendChild(resume);
    }

    if (opts.onStartCareer) {
      var career = el("button", "card-btn card-btn--primary");
      career.innerHTML = '<span class="card-btn__icon">🎓</span><span>' +
        '<span class="card-btn__title">' + T("modeCareer") + "</span><br>" +
        '<span class="card-btn__desc">' + T("modeCareerDesc") + "</span></span>";
      career.addEventListener("click", opts.onStartCareer);
      menu.appendChild(career);
    }

    if (opts.onStartPk) {
      var pk = el("button", "card-btn");
      pk.innerHTML = '<span class="card-btn__icon">👥</span><span>' +
        '<span class="card-btn__title">' + T("modePk") + "</span><br>" +
        '<span class="card-btn__desc">' + T("modePkDesc") + "</span></span>";
      pk.addEventListener("click", opts.onStartPk);
      menu.appendChild(pk);
    }

    var start = el("button", "card-btn");
    start.innerHTML = '<span class="card-btn__icon">🎯</span><span>' +
      '<span class="card-btn__title">' + T("start") + "</span><br>" +
      '<span class="card-btn__desc">' + T("startDesc") + "</span></span>";
    start.addEventListener("click", opts.onStart);
    menu.appendChild(start);

    var diffRow = el("div", "menu__row");
    var diffBox = el("div", "card-btn");
    diffBox.style.display = "block";
    diffBox.innerHTML = '<span class="card-btn__title">' + T("difficulty") + "</span>";
    var picker = el("div", "diff-picker");
    [1, 2, 3].forEach(function (d) {
      var b = el("button", d === opts.difficulty ? "on" : null,
                 MGGame.diffName(d, opts.lang));
      b.type = "button";
      b.addEventListener("click", function () {
        MGAudio.click();
        opts.onDifficulty(d);
      });
      picker.appendChild(b);
    });
    diffBox.appendChild(picker);
    diffRow.appendChild(diffBox);

    var catBox = el("button", "card-btn");
    catBox.innerHTML = '<span class="card-btn__icon">📚</span><span>' +
      '<span class="card-btn__title">' + T("subject", { c: opts.category }) + "</span><br>" +
      '<span class="card-btn__desc">' + (opts.category === "全部"
        ? T("allSubjectDesc", { t: opts.questionCount })
        : T("subjectDesc", { n: opts.categoryCount != null ? opts.categoryCount : opts.questionCount, t: opts.questionCount })) + "</span></span>";
    catBox.addEventListener("click", opts.onCategory);
    diffRow.appendChild(catBox);
    menu.appendChild(diffRow);

    var stats = el("div", "stats-line");
    stats.innerHTML = opts.statsHtml;
    menu.appendChild(stats);

    if (opts.showClearSave) {
      var clr = el("button", "card-btn");
      clr.innerHTML = '<span class="card-btn__icon">🧹</span><span>' +
        '<span class="card-btn__title">' + T("clearSave") + "</span></span>";
      clr.addEventListener("click", opts.onClearSave);
      menu.appendChild(clr);
    }

    s.appendChild(menu);
    s.appendChild(el("p", "kbd-hint", T("kbdHint")));
  }

  /* ---------- quiz ---------- */
  function renderQuestion(session, ui, lang) {
    clear();
    var s = screen();
    var q = session.current;
    var d = MGGame.DIFFS[session.difficulty];

    var head = el("div", "quizhead");
    head.innerHTML =
      '<div class="quizhead__meta">' +
      '<div class="quizhead__cat">' + esc(q.category) + " · " + esc(MGGame.diffName(session.difficulty, lang)) + "</div>" +
      '<div class="quizhead__num">' + (session.mode === "career"
        ? T("stageProgress", { n: session.stage + 1,
             name: MGGame.careerStageName(session.stage, lang),
             i: stagePos(session) })
        : T("qnum", { i: session.index + 1, n: session.questions.length, streak: session.streak })) + "</div></div>" +
      '<div class="quizhead__score">' + session.score + "<small>" + T("score") + "</small></div>";
    s.appendChild(head);

    var timer = el("div", "timer");
    timer.innerHTML = '<div class="timer__fill" id="timer-fill"></div>';
    s.appendChild(timer);

    var qbox = el("div", "question");
    qbox.textContent = q.q;
    s.appendChild(qbox);

    var stage = el("div", "mascot-stage");
    stage.innerHTML = '<img id="mascot" src="assets/img/mascot-think.svg" alt="" onerror="this.style.display=\'none\'">';
    s.appendChild(stage);

    var choices = el("div", "choices");
    var KEYS = ["1", "2", "3", "4"];
    q.choices.forEach(function (c, i) {
      var b = el("button", "choice");
      b.type = "button";
      b.innerHTML = '<span class="choice__key">' + KEYS[i] + "</span><span>" + esc(c) + "</span>";
      b.addEventListener("click", function () { ui.onChoice(i); });
      choices.appendChild(b);
    });
    s.appendChild(choices);

    var fb = el("div", "feedback");
    fb.id = "feedback";
    s.appendChild(fb);
  }

  function updateTimer(fraction) {
    var f = document.getElementById("timer-fill");
    if (!f) return;
    f.style.width = Math.max(0, Math.min(1, fraction)) * 100 + "%";
    if (fraction < 0.3) f.classList.add("low");
  }

  function lockChoices() {
    var btns = document.querySelectorAll(".choice");
    for (var i = 0; i < btns.length; i++) btns[i].disabled = true;
  }

  function showFeedback(session, result, pickedIdx, onNext) {
    var q = session.current;
    var btns = document.querySelectorAll(".choice");
    for (var i = 0; i < btns.length; i++) {
      if (i === q.answer) btns[i].classList.add("correct");
      else if (i === pickedIdx) btns[i].classList.add("wrong");
      else btns[i].classList.add("dim");
    }
    var scoreEl = document.querySelector(".quizhead__score");
    if (scoreEl) {
      scoreEl.childNodes[0].nodeValue = session.score;
      var numEl = document.querySelector(".quizhead__num");
      if (numEl) {
        numEl.textContent = session.mode === "career"
          ? T("stageProgress", { n: session.stage + 1,
              name: MGGame.careerStageName(session.stage, getLang()),
              i: stagePos(session) })
          : T("qnum", { i: session.index + 1, n: session.questions.length, streak: session.streak });
      }
    }
    var fb = document.getElementById("feedback");
    if (!fb) return;
    var mascot = document.getElementById("mascot");
    if (mascot) {
      mascot.src = result.ok ? "assets/img/mascot-cheer.svg" : "assets/img/mascot-dizzy.svg";
    }
    var mark = result.ok
      ? '<img class="feedback__mark" src="assets/img/mark-o.png" alt="O" onerror="this.style.display=\'none\'">'
      : '<span style="font-size:44px;line-height:1;color:var(--red);font-weight:900;flex:none;width:54px;text-align:center">✕</span>';
    var text;
    if (result.ok) {
      text = "<b>" + T("correct") + "</b> +" + result.delta + T("plus") +
        (session.streak > 1 ? T("streakTxt", { n: session.streak }) : "");
    } else {
      var pre = pickedIdx < 0 ? '<span class="bad">' + T("timeout") + "</span> "
                             : '<span class="bad">' + T("wrong") + "</span> ";
      text = pre + T("answerIs") + "<b>" + esc(q.choices[q.answer]) + "</b>";
    }
    fb.innerHTML = mark + '<div class="feedback__text">' + text + "</div>";
    var btn = el("button", "next-btn",
      session.index + 1 >= session.questions.length ? T("seeResult") : T("next"));
    btn.addEventListener("click", onNext);
    fb.appendChild(btn);
  }

  /* ---------- result ---------- */
  function showResult(session, isBest, opts) {
    clear();
    var s = screen();
    var box = el("div", "result");
    var rank = MGGame.rankFor(session.score);
    var banner = session.correctCount >= 8 ? "assets/img/lucky.svg"
               : session.correctCount >= 5 ? "assets/img/clear.svg"
               : session.correctCount >= 3 ? "assets/img/ready.svg"
               : "assets/img/game-over.svg";
    box.innerHTML =
      '<img class="banner" src="' + banner + '" alt="" onerror="this.style.display=\'none\'">' +
      '<div class="result__score">' + session.score + "</div>" +
      '<div class="result__detail">' + T("resultDetail", { c: session.correctCount, n: session.questions.length, m: session.maxStreak }) + "</div>" +
      '<div class="result__rank">' +
      '<img src="' + rank.img + '" alt="" onerror="this.style.display=\'none\'">' +
      "<div>" + T("curRank", { r: MGGame.rankName(rank, opts.lang) }) + "</div>" +
      "<span>" + (rank.min >= MGGame.RANKS[MGGame.RANKS.length - 1].min
        ? T("maxRank") : T("nextRankAt", { s: rank.min })) + "</span></div>" +
      (isBest ? '<div class="result__best">' + T("newBest") + "</div>" : "");
    s.appendChild(box);

    if (session.review && session.review.length) {
      var rev = el("div", "review");
      var det = el("details");
      var items = session.review.map(function (r, i) {
        return '<div class="' + (r.ok ? "ok" : "ng") + '">' + (i + 1) + ". " +
          (r.ok ? "✔" : "✘") + " " + esc(r.q.replace(/\n/g, " ")) +
          " → <b>" + esc(r.correct) + "</b></div>";
      }).join("");
      det.innerHTML = "<summary>" + T("review") + "</summary>" + items;
      rev.appendChild(det);
      s.appendChild(rev);
    }

    var menu = el("div", "menu");
    var again = el("button", "card-btn card-btn--primary");
    again.innerHTML = '<span class="card-btn__icon">🔁</span><span>' +
      '<span class="card-btn__title">' + T("again") + "</span><br>" +
      '<span class="card-btn__desc">' + T("againDesc") + "</span></span>";
    again.addEventListener("click", opts.onAgain);
    menu.appendChild(again);

    var home = el("button", "card-btn");
    home.innerHTML = '<span class="card-btn__icon">🏠</span><span>' +
      '<span class="card-btn__title">' + T("home") + "</span></span>";
    home.addEventListener("click", opts.onHome);
    menu.appendChild(home);
    s.appendChild(menu);
  }

  /* ---------- career mode screens ---------- */

  function careerMenuBtns(defs) {
    var menu = el("div", "menu");
    defs.forEach(function (d) {
      var b = el("button", d.primary ? "card-btn card-btn--primary" : "card-btn");
      b.innerHTML = '<span class="card-btn__icon">' + d.icon + '</span><span>' +
        '<span class="card-btn__title">' + d.title + "</span>" +
        (d.desc ? '<br><span class="card-btn__desc">' + d.desc + "</span>" : "") +
        "</span>";
      b.addEventListener("click", d.onClick);
      menu.appendChild(b);
    });
    return menu;
  }

  function showStageIntro(session, opts) {
    clear();
    var s = screen();
    var box = el("div", "result");
    box.innerHTML =
      '<img class="banner" src="assets/img/ready.svg" alt="" onerror=\"this.style.display=\'none\'\">' +
      '<div style="font-size:26px;font-weight:900;margin:10px 0">' +
      esc(T("stageIntro", { n: session.stage + 1,
        name: MGGame.careerStageName(session.stage, opts.lang) })) + "</div>" +
      '<div class="result__detail">' + T("stageIntroDesc") + "</div>" +
      '<div class="stats-line">' + T("totalScore") + "：<b>" + session.score + "</b>" +
      " · " + MGGame.diffName(MGGame.DIFFS[session.difficulty] ? session.difficulty : 1, opts.lang) + "</div>";
    s.appendChild(box);
    s.appendChild(careerMenuBtns([
      { primary: true, icon: "▶️", title: T("beginStage"), onClick: opts.onBegin }
    ]));
  }

  function showPromotion(session, opts) {
    clear();
    var s = screen();
    var box = el("div", "result");
    box.innerHTML =
      '<img class="banner" src="assets/img/clear.svg" alt="" onerror=\"this.style.display=\'none\'\">' +
      '<div style="font-size:24px;font-weight:900;color:var(--green);margin:10px 0">' +
      esc(T("promote")) + "</div>" +
      '<div class="result__detail">' + T("promoteTo", {
        name: MGGame.careerStageName(session.stage, opts.lang) }) + "</div>" +
      '<div class="mascot-stage" style="margin-top:10px">' +
      '<img src="assets/img/mascot-cheer.svg" alt="" style="height:110px" onerror=\"this.style.display=\'none\'\"></div>' +
      '<div class="stats-line">' + T("totalScore") + "：<b>" + session.score + "</b></div>";
    s.appendChild(box);
    s.appendChild(careerMenuBtns([
      { primary: true, icon: "⏭️", title: T("continueNext"), onClick: opts.onContinue }
    ]));
  }

  function showGraduation(session, isBest, opts) {
    clear();
    var s = screen();
    var box = el("div", "result");
    box.innerHTML =
      '<img class="banner" src="assets/img/lucky.svg" alt="" onerror=\"this.style.display=\'none\'\">' +
      '<div style="font-size:24px;font-weight:900;color:var(--yellow);margin:10px 0">' +
      esc(T("graduate")) + "</div>" +
      '<div class="result__detail">' + T("graduateDesc") + "</div>" +
      '<div class="result__score">' + session.score + "</div>" +
      '<div class="result__detail">' + T("resultDetail", {
        c: session.correctCount, n: session.questions.length, m: session.maxStreak }) + "</div>" +
      '<div class="mascot-stage" style="margin-top:10px">' +
      '<img src="assets/img/mascot-cheer.svg" alt="" style="height:110px" onerror=\"this.style.display=\'none\'\"></div>' +
      (isBest ? '<div class="result__best">' + T("newBest") + "</div>" : "");
    s.appendChild(box);
    s.appendChild(careerMenuBtns([
      { primary: true, icon: "🔁", title: T("again"), desc: T("againDesc"), onClick: opts.onAgain },
      { icon: "🏠", title: T("home"), onClick: opts.onHome }
    ]));
  }

  function showCareerOver(session, opts) {
    clear();
    var s = screen();
    var si = session.stage;
    var correct = MGGame.careerStageCorrect(session, si);
    var box = el("div", "result");
    box.innerHTML =
      '<img class="banner" src="assets/img/game-over.svg" alt="" onerror=\"this.style.display=\'none\'\">' +
      '<div style="font-size:24px;font-weight:900;color:var(--red);margin:10px 0">' +
      esc(T("careerOver")) + "</div>" +
      '<div class="result__detail">' + T("careerOverDesc", {
        name: MGGame.careerStageName(si, opts.lang), c: correct }) + "</div>" +
      '<div class="mascot-stage" style="margin-top:10px">' +
      '<img src="assets/img/mascot-dizzy.svg" alt="" style="height:100px" onerror=\"this.style.display=\'none\'\"></div>' +
      '<div class="stats-line">' + T("totalScore") + "：<b>" + session.score + "</b></div>";
    s.appendChild(box);
    s.appendChild(careerMenuBtns([
      { primary: true, icon: "🔁", title: T("retryStage"), onClick: opts.onRetry },
      { icon: "🔄", title: T("restartCareer"), onClick: opts.onRestart },
      { icon: "🏠", title: T("home"), onClick: opts.onHome }
    ]));
  }

  /* ---------- 双人对战（PK） ---------- */

  function pkPadHtml(player, keys) {
    var btns = keys.map(function (k, i) {
      return '<button type="button" class="pk-key" data-player="' + player +
             '" data-choice="' + i + '">' + k + "</button>";
    }).join("");
    var label = player === 0 ? T("pkP1") : T("pkP2");
    var img = player === 0 ? "assets/img/shield-cyan.png" : "assets/img/shield-pink.png";
    return '<div class="pk-pad" id="pk-pad-' + player + '">' +
      '<div class="pk-pad__label"><img src="' + img + '" alt="" ' + + HIDE_ON_ERR +
      '><span>' + label + '</span></div><div class="pk-pad__keys">' + btns + "</div></div>";
  }

  function renderPkQuestion(session, ui, lang) {
    clear();
    var s = screen();
    var q = session.current;

    var head = el("div", "pk-head");
    head.innerHTML =
      '<div class="pk-side pk-side--p1' + (session.active === 0 ? " on" : "") + '">' +
      '<div class="pk-side__name">' + T("pkP1") + '</div>' +
      '<div class="pk-side__score" id="pk-score-0">' + session.players[0].score + "</div></div>" +
      '<div class="pk-center">' +
      '<div class="quizhead__cat">' + esc(q.category) + " · " + esc(MGGame.diffName(session.difficulty, lang)) + "</div>" +
      '<div class="quizhead__num">' + T("pkQNum", { i: session.index + 1, n: session.questions.length }) +
      " · " + T("pkRace") + "</div>" +
      '<div class="pk-vs">' + T("pkVs") + "</div></div>" +
      '<div class="pk-side pk-side--p2' + (session.active === 1 ? " on" : "") + '">' +
      '<div class="pk-side__name">' + T("pkP2") + '</div>' +
      '<div class="pk-side__score" id="pk-score-1">' + session.players[1].score + "</div></div>";
    s.appendChild(head);

    var timer = el("div", "timer");
    timer.innerHTML = '<div class="timer__fill" id="timer-fill"></div>';
    s.appendChild(timer);

    var qbox = el("div", "question");
    qbox.textContent = q.q;
    s.appendChild(qbox);

    var list = el("div", "pk-choices");
    var MARKS = ["①", "②", "③", "④"];
    q.choices.forEach(function (c, i) {
      list.appendChild(el("div", "pk-choice",
        '<span class="pk-choice__mark">' + MARKS[i] + '</span><span>' + esc(c) + "</span>"));
    });
    s.appendChild(list);

    var pads = el("div", "pk-pads");
    pads.innerHTML = pkPadHtml(0, ["1", "2", "3", "4"]) +
                     pkPadHtml(1, ["7", "8", "9", "0"]);
    s.appendChild(pads);

    var fb = el("div", "feedback");
    fb.id = "feedback";
    s.appendChild(fb);

    updatePkPads(session);
  }

  function updatePkPads(session) {
    var pad0 = document.getElementById("pk-pad-0");
    var pad1 = document.getElementById("pk-pad-1");
    if (!pad0 || !pad1) return;
    // 未答且本题未终局 → 激活；已答 → 锁出
    pad0.classList.toggle("on", !session.answered && !session.answeredPl[0]);
    pad1.classList.toggle("on", !session.answered && !session.answeredPl[1]);
    pad0.classList.toggle("lock", session.answeredPl[0]);
    pad1.classList.toggle("lock", session.answeredPl[1]);
  }

  function updatePkScores(session) {
    ["0", "1"].forEach(function (i) {
      var e = document.getElementById("pk-score-" + i);
      if (e) e.textContent = session.players[i].score;
    });
  }

  function bindPkPads(onPkChoice) {
    var pads = document.querySelectorAll(".pk-key");
    for (var i = 0; i < pads.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          onPkChoice(parseInt(btn.getAttribute("data-player"), 10),
                     parseInt(btn.getAttribute("data-choice"), 10));
        });
      })(pads[i]);
    }
  }

  /* 答错锁出提示（未揭示答案，计时继续） */
  function showPkSteal(session, result) {
    updatePkPads(session);
    updatePkScores(session);
    var fb = document.getElementById("feedback");
    if (!fb) return;
    var a = result.player === 0 ? T("pkP1") : T("pkP2");
    var b = result.player === 0 ? T("pkP2") : T("pkP1");
    // 标记答错者选中的选项
    var q = session.current;
    var rows = document.querySelectorAll(".pk-choice");
    var r = session.review[session.review.length - 1];
    if (r && r.picked != null) {
      var idx = q.choices.indexOf(r.picked);
      if (idx >= 0 && rows[idx]) rows[idx].classList.add("wrong");
    }
    fb.innerHTML = '<span style="font-size:30px;line-height:1;flex:none;width:54px;text-align:center">⚡</span>' +
      '<div class="feedback__text">' + T("pkSteal", { a: a, b: b }) + "</div>";
  }

  /* 本题终局（答对或双方均错） */
  function showPkFeedback(session, result, onNext) {
    var q = session.current;
    updatePkPads(session);
    updatePkScores(session);
    var fb = document.getElementById("feedback");
    if (!fb) return;
    var rows = document.querySelectorAll(".pk-choice");
    var attempts = session.review.slice(-2);
    attempts.forEach(function (r) {
      if (r.picked == null) return;
      var idx = q.choices.indexOf(r.picked);
      if (idx >= 0 && rows[idx]) rows[idx].classList.add(r.ok ? "correct" : "wrong");
    });
    if (rows[q.answer] && !result.ok) rows[q.answer].classList.add("correct");
    var p = result.player === 0 ? T("pkP1") : T("pkP2");
    var text;
    if (result.ok) {
      text = T("pkCorrect", { p: p, d: result.delta }) +
        (session.streak[result.player] > 1 ? T("streakTxt", { n: session.streak[result.player] }) : "");
      fb.innerHTML = '<img class="feedback__mark" src="assets/img/mark-o.png" alt="O" ' + + HIDE_ON_ERR + '>' +
        '<div class="feedback__text"><b>' + text + "</b></div>";
    } else if (result.isTimeout) {
      text = T("pkTimeout", { a: esc(q.choices[q.answer]) });
      fb.innerHTML = '<span style="font-size:40px;line-height:1;flex:none;width:54px;text-align:center">⏰</span>' +
        '<div class="feedback__text">' + text + "</div>";
    } else {
      text = T("pkBothWrong", { a: esc(q.choices[q.answer]) });
      fb.innerHTML = '<span style="font-size:44px;line-height:1;color:var(--red);font-weight:900;flex:none;width:54px;text-align:center">✕</span>' +
        '<div class="feedback__text">' + text + "</div>";
    }
    var btn = el("button", "next-btn",
      session.index + 1 >= session.questions.length ? T("seeResult") : T("next"));
    btn.addEventListener("click", onNext);
    fb.appendChild(btn);
  }

  function showPkResult(session, opts) {
    clear();
    var s = screen();
    var p0 = session.players[0].score;
    var p1 = session.players[1].score;
    var winner = p0 > p1 ? 0 : p1 > p0 ? 1 : -1;
    var banner = winner === 0 ? "assets/img/win-1p.svg"
               : winner === 1 ? "assets/img/lucky.svg"
               : "assets/img/ready.svg";
    var headline = winner < 0 ? T("pkDraw")
      : T("pkWin", { p: winner === 0 ? T("pkP1") : T("pkP2") });
    var box = el("div", "result");
    box.innerHTML =
      '<img class="banner" src="' + banner + '" alt="" ' + + HIDE_ON_ERR + '>' +
      '<div style="font-size:26px;font-weight:900;margin:10px 0;color:' +
      (winner === 1 ? "var(--pink)" : "var(--cyan)") + '">' + esc(headline) + "</div>" +
      '<div class="pk-final">' +
      '<div class="pk-final__col"><span class="pk-final__num" style="color:var(--cyan)">' + p0 + "</span>" +
      '<span class="pk-final__label">' + T("pkP1") + " · 正确 " + session.correctCount[0] + " 题</span></div>" +
      '<div class="pk-final__col"><span class="pk-final__num" style="color:var(--pink)">' + p1 + "</span>" +
      '<span class="pk-final__label">' + T("pkP2") + " · 正确 " + session.correctCount[1] + " 题</span></div></div>";
    s.appendChild(box);

    if (session.review && session.review.length) {
      var rev = el("div", "review");
      var det = el("details");
      var lastQ = null;
      var items = "";
      session.review.forEach(function (r) {
        // 同题多attempt只保留最后一条；超时条目不单独展示
        if (r.picked == null) return;
        if (r.q === lastQ) {
          items = items.replace(/<div class="(ok|ng)">[^]*?<\/div>$/, "");
        }
        items += '<div class="' + (r.ok ? "ok" : "ng") + '">' +
          '<span style="color:' + (r.player === 0 ? "var(--cyan)" : "var(--pink)") + ';font-weight:900">' +
          (r.player === 0 ? T("pkP1") : T("pkP2")) + "</span> " +
          (r.ok ? "✔ +" + r.scoreDelta : (r.picked == null ? "⏰" : "✘")) + " " +
          esc(r.q.replace(/\n/g, " ")) +
          (r.ok ? "" : " → <b>" + esc(r.correct) + "</b>") + "</div>";
        lastQ = r.q;
      });
      det.innerHTML = "<summary>" + T("review") + "</summary>" + items;
      rev.appendChild(det);
      s.appendChild(rev);
    }

    s.appendChild(careerMenuBtns([
      { primary: true, icon: "🔁", title: T("again"), desc: T("modePkDesc"), onClick: opts.onAgain },
      { icon: "🏠", title: T("home"), onClick: opts.onHome }
    ]));
  }

  window.MGUI = {
    setLang: setLang,
    getLang: getLang,
    T: T,
    showError: showError,
    showTitle: showTitle,
    renderQuestion: renderQuestion,
    updateTimer: updateTimer,
    lockChoices: lockChoices,
    showFeedback: showFeedback,
    showResult: showResult,
    showStageIntro: showStageIntro,
    showPromotion: showPromotion,
    showGraduation: showGraduation,
    showCareerOver: showCareerOver,
    renderPkQuestion: renderPkQuestion,
    updatePkPads: updatePkPads,
    updatePkScores: updatePkScores,
    bindPkPads: bindPkPads,
    showPkSteal: showPkSteal,
    showPkFeedback: showPkFeedback,
    showPkResult: showPkResult
  };
})();
