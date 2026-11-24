/**
 * 主界面交互控制器：
 * 管理 6 大页面视图（路线图 / 几何学院 / 动手实验室 / 演练场 / 模拟考场 / 错题本）
 * 以及速查卡浮层、家长陪学模式、自定义确认弹窗与 Toast 提示
 */
(function (global) {
  'use strict';

  var LESSONS = global.GeoLessonsData.LESSONS;
  var CHEAT_SHEET = global.GeoLessonsData.CHEAT_SHEET;
  var THINKING = global.GeoThinkingData || { FIRST_PRINCIPLES: [], LESSON_THINKING: {}, PUZZLE_THINKING: {} };
  var PUZZLES = global.GeoPuzzlesData.PUZZLES;
  var EXAMS = global.GeoExamsData.EXAMS;
  var Engine = global.GeoEngine;
  var SVG = global.GeoSVG;
  var Lab = global.GeoLab;
  var AudioFX = global.GeoAudio;

  var store = Engine.createProgressStore();

  var AppState = {
    page: 'home', // home | lessons | lab | practice | exam | review
    parentMode: false,
    // 微课状态
    selectedLessonId: LESSONS[0].id,
    lessonStep: 0,
    // 演练场状态
    filterRoutine: 'ALL',
    filterTier: 'ALL',
    activePuzzleId: null,
    hintLevel: 0, // 0=无提示, 1=L1, 2=L2, 3=L3
    lastFeedback: null,
    // 考场状态
    activeExamId: null,
    examIndex: 0,
    examAnswers: {},
    examRemainSec: 0,
    examTimer: null,
    examResult: null
  };

  function getLessonById(id) {
    return LESSONS.find(function (l) { return l.id === id; }) || LESSONS[0];
  }

  function getPuzzleById(id) {
    return PUZZLES.find(function (p) { return p.id === id; }) || null;
  }

  function showToast(msg, type) {
    var box = document.getElementById('toastContainer');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast-msg ' + (type ? 'toast-' + type : '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2400);
  }

  function showConfirm(title, msg, onOk) {
    var modal = document.getElementById('confirmModal');
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = msg;
    modal.classList.remove('hidden');

    var okBtn = document.getElementById('btnConfirmOk');
    var cancelBtn = document.getElementById('btnConfirmCancel');
    var closeBtn = document.getElementById('btnCloseConfirm');

    function cleanup() {
      modal.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      closeBtn.onclick = null;
    }

    okBtn.onclick = function () { cleanup(); if (onOk) onOk(); };
    cancelBtn.onclick = cleanup;
    closeBtn.onclick = cleanup;
  }

  function catTagClass(cat) {
    if (cat === 'cut') return 'tag-cut';
    if (cat === 'pythago') return 'tag-pythago';
    return 'tag-xuantu';
  }

  function renderNavBadges() {
    var prog = store.getState();
    var badge = document.getElementById('navWrongCount');
    if (badge) badge.textContent = String(prog.wrongIds.length);

    document.querySelectorAll('.nav-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-page') === AppState.page);
    });

    var pBtn = document.getElementById('btnParentMode');
    var pLbl = document.getElementById('parentModeLabel');
    if (pBtn && pLbl) {
      pBtn.classList.toggle('active', AppState.parentMode);
      pLbl.textContent = AppState.parentMode ? '开' : '关';
    }
  }

  // ==================== 1. 首页：通关路线图 ====================
  function renderHome() {
    var prog = store.getState();
    var solvedCount = Object.keys(prog.solved).length;
    var totalStars = Object.keys(prog.solved).reduce(function (acc, k) { return acc + (prog.solved[k].stars || 0); }, 0);
    var bestExam = prog.examHistory.length > 0 ? Math.max.apply(null, prog.examHistory.map(function (e) { return e.score; })) : '—';

    var lessonsDone = Array.isArray(prog.lessonsDone) ? prog.lessonsDone : [];
    var lessonsVisited = Array.isArray(prog.lessonsVisited) ? prog.lessonsVisited : [];
    var cards = LESSONS.map(function (ls) {
      var done = lessonsDone.indexOf(ls.id) !== -1;
      var visited = lessonsVisited.indexOf(ls.id) !== -1;
      var maxStep = prog.lessonSteps && prog.lessonSteps[ls.id] != null ? prog.lessonSteps[ls.id] : -1;
      var statusLabel = done
        ? '✅ 已学完'
        : (visited ? '📖 学到第 ' + (maxStep + 1) + '/' + ls.steps.length + ' 步' : '未学习');
      var subPuzzles = PUZZLES.filter(function (p) { return p.routineId === ls.id; });
      var subSolved = subPuzzles.filter(function (p) { return !!prog.solved[p.id]; }).length;
      return '<div class="routine-card" data-jump-lesson="' + ls.id + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span class="tag ' + catTagClass(ls.category) + '">' + ls.categoryName + '</span>' +
          '<span style="font-size:12px;color:#64748b;">' + statusLabel + ' · 刷题 ' + subSolved + '/' + subPuzzles.length + '</span>' +
        '</div>' +
        '<h3>' + ls.title + '</h3>' +
        '<p>' + ls.summary + '</p>' +
      '</div>';
    }).join('');

    return '<section class="hero-banner">' +
      '<div>' +
        '<h2>几何剪拼 · 勾股定理 · 弦图全攻略</h2>' +
        '<p>把第 13～14 讲老师笔记浓缩成“八大几何招式”：先看分步辅助线微课，再去动手实验室亲手切拼拖弦图，最后刷 32 道原题冲刺 95+！</p>' +
        '<div class="hero-cta-row">' +
          '<button class="btn btn-white" data-go-page="lessons">🎓 开始学八大招式</button>' +
          '<button class="btn btn-ghost-white" data-go-page="lab">✂️ 进动手实验室</button>' +
          '<button class="btn btn-ghost-white" data-go-page="practice">🧩 直接闯关刷题</button>' +
        '</div>' +
      '</div>' +
      '<div class="hero-stats">' +
        '<div class="stat-tile"><div class="stat-num">' + prog.lessonsDone.length + ' / ' + LESSONS.length + '</div><div class="stat-label">已掌握招式微课</div></div>' +
        '<div class="stat-tile"><div class="stat-num">' + solvedCount + ' / ' + PUZZLES.length + '</div><div class="stat-label">已通关真题数</div></div>' +
        '<div class="stat-tile"><div class="stat-num">⭐ ' + totalStars + '</div><div class="stat-label">累计侦探星级</div></div>' +
        '<div class="stat-tile"><div class="stat-num">' + bestExam + '</div><div class="stat-label">模拟考最高分</div></div>' +
      '</div>' +
    '</section>' +
    '<div class="section-heading">' +
      '<h2>🗺️ 八大核心几何招式（点击进入互动微课）</h2>' +
      '<span class="tag tag-xuantu">重点：招式 5～8 为弦图四大辅助线应用法</span>' +
    '</div>' +
    '<div class="grid-2">' + cards + '</div>';
  }

  // ==================== 2. 几何学院：八大招式微课 ====================
  function renderLessons() {
    var ls = getLessonById(AppState.selectedLessonId);
    var lsIdx = LESSONS.findIndex(function (item) { return item.id === ls.id; });
    var prevLs = lsIdx > 0 ? LESSONS[lsIdx - 1] : null;
    var nextLs = lsIdx < LESSONS.length - 1 ? LESSONS[lsIdx + 1] : null;
    var curStep = Math.min(AppState.lessonStep, ls.steps.length - 1);
    var stepObj = ls.steps[curStep];
    var isLastStep = curStep === ls.steps.length - 1;

    var prog = store.getState();
    var lDone = Array.isArray(prog.lessonsDone) ? prog.lessonsDone : [];
    var lVisited = Array.isArray(prog.lessonsVisited) ? prog.lessonsVisited : [];
    var chips = LESSONS.map(function (item) {
      var isDone = lDone.indexOf(item.id) !== -1;
      var isVisited = lVisited.indexOf(item.id) !== -1;
      var mark = isDone ? '✅ ' : (isVisited ? '📖 ' : '');
      return '<button class="filter-chip ' + (item.id === ls.id ? 'active' : '') + '" data-select-lesson="' + item.id + '">' +
        mark + item.id + ' · ' + item.shortName + '</button>';
    }).join('');

    var dots = ls.steps.map(function (_, idx) {
      return '<button class="step-dot ' + (idx === curStep ? 'active' : '') + '" data-lesson-step="' + idx + '" aria-label="第 ' + (idx + 1) + ' 步"></button>';
    }).join('');

    var parentHtml = AppState.parentMode
      ? '<div class="parent-coach-box"><strong>👨‍👩‍👧 家长 10 秒陪讲话术：</strong>' + ls.parentScript + '</div>'
      : '';

    var lessonWhy = THINKING.LESSON_THINKING[ls.id] || '';
    var thinkingHtml = lessonWhy
      ? '<div class="thinking-box"><strong>🧠 为什么想到这一招？（高阶思维溯源）</strong>' + lessonWhy + '</div>'
      : '';

    var nextStepBtnText = !isLastStep
      ? '✨ 点亮下一步辅助线 →'
      : (nextLs ? '➡️ 下一招：' + nextLs.id + ' ' + nextLs.shortName : '✂️ 学完啦！去动手实验室');

    return '<div class="filter-bar">' + chips + '</div>' +
      '<div class="workspace-grid">' +
        '<div class="svg-stage-card">' +
          '<div class="svg-stage-header">' +
            '<strong>' + ls.motherTitle + '</strong>' +
            '<span class="tag ' + catTagClass(ls.category) + '">步骤 ' + (curStep + 1) + ' / ' + ls.steps.length + '</span>' +
          '</div>' +
          '<div class="svg-canvas-wrap">' + SVG.renderSVG(ls.svg, curStep) + '</div>' +
          '<div class="step-controls">' +
            '<button class="btn btn-secondary btn-sm" id="btnLessonPrev" ' + (curStep === 0 ? 'disabled' : '') + '>← 上一步</button>' +
            '<div class="step-dots">' + dots + '</div>' +
            '<button class="btn btn-primary btn-sm" id="btnLessonNext">' + nextStepBtnText + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
            '<span class="tag ' + catTagClass(ls.category) + '">' + ls.categoryName + ' (' + (lsIdx + 1) + '/' + LESSONS.length + ')</span>' +
            '<div style="display:flex;gap:6px;">' +
              '<button class="btn btn-secondary btn-sm" id="btnPrevLesson" ' + (!prevLs ? 'disabled' : '') + '>‹ 上一招</button>' +
              '<button class="btn btn-secondary btn-sm" id="btnNextLesson" ' + (!nextLs ? 'disabled' : '') + '>下一招 ›</button>' +
            '</div>' +
          '</div>' +
          '<h2 class="card-title">' + ls.title + '</h2>' +
          '<div class="mantra-box">💡 口诀：' + ls.mantra + '</div>' +
          '<div class="step-narration">' +
            '<h4>' + stepObj.title + '</h4>' +
            '<p>' + stepObj.text + '</p>' +
          '</div>' +
          thinkingHtml +
          parentHtml +
          '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button class="btn btn-teal btn-sm" data-practice-routine="' + ls.id + '">🧩 趁热刷本招真题</button>' +
            (nextLs ? '<button class="btn btn-primary btn-sm" data-select-lesson="' + nextLs.id + '">➡️ 连学下一招 (' + nextLs.shortName + ')</button>' : '') +
            '<button class="btn btn-secondary btn-sm" data-go-page="lab">✂️ 去动手实验室</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ==================== 3. 演练场：专项刷题 ====================
  function renderPractice() {
    var prog = store.getState();

    // 若已选中某道题，渲染单题工作区
    if (AppState.activePuzzleId) {
      var p = getPuzzleById(AppState.activePuzzleId);
      if (p) {
        var ls = getLessonById(p.routineId);
        var svgStep = AppState.hintLevel; // L1 显示 step 1 辅助线，L2/L3 显示 step 2 完整标注
        var hintsHtml = '';
        if (AppState.hintLevel >= 1) {
          hintsHtml += '<div class="hint-card hint-l1">🔦 <strong>L1 突破口雷达：</strong>' + p.hints[0] + '</div>';
        }
        if (AppState.hintLevel >= 2) {
          hintsHtml += '<div class="hint-card hint-l2">📐 <strong>L2 辅助线与招式（' + ls.shortName + '）：</strong>' + p.hints[1] + '</div>';
        }
        if (AppState.hintLevel >= 3) {
          hintsHtml += '<div class="hint-card hint-l3">✅ <strong>L3 完整解析：</strong>' + p.hints[2] + '</div>';
        }

        var feedbackHtml = '';
        if (AppState.lastFeedback) {
          var fb = AppState.lastFeedback;
          feedbackHtml = '<div class="hint-card ' + (fb.ok ? 'hint-l3' : 'hint-l1') + '" style="margin-top:12px;">' + fb.msg + '</div>';
        }

        var parentHtml = AppState.parentMode
          ? '<div class="parent-coach-box"><strong>👨‍👩‍👧 家长陪讲话术：</strong>' + p.parentCoach + '</div>'
          : '';

        // 思维溯源卡片：答对后、点开 L2/L3 提示后或开启家长模式时展示（平时防剧透）
        var puzzleWhy = THINKING.PUZZLE_THINKING[p.id] || '';
        var showWhy = puzzleWhy && (AppState.hintLevel >= 2 || AppState.parentMode || (AppState.lastFeedback && AppState.lastFeedback.ok));
        var whyHtml = showWhy
          ? '<div class="thinking-box"><strong>🧠 高阶思维溯源（为什么会想到这么做？）</strong>' + puzzleWhy + '</div>'
          : '';

        return '<div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
          '<button class="btn btn-secondary btn-sm" id="btnBackToList">← 返回题库列表</button>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<span class="tag ' + (p.tier === 'core' ? 'tag-core' : 'tag-sprint') + '">' + (p.tier === 'core' ? '🟢 80分必拿' : '🟣 95+冲刺') + '</span>' +
            '<span class="tag ' + catTagClass(ls.category) + '">' + p.source + ' · ' + ls.shortName + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="workspace-grid">' +
          '<div class="svg-stage-card">' +
            '<div class="svg-stage-header">' +
              '<strong>' + p.id + ' · ' + p.title + '</strong>' +
              '<span style="font-size:12px;color:#64748b;">' + (svgStep > 0 ? '已点亮辅助线提示' : '先自己观察图形再点提示哦') + '</span>' +
            '</div>' +
            '<div class="svg-canvas-wrap">' + SVG.renderSVG(p.svg, svgStep) + '</div>' +
          '</div>' +
          '<div class="card">' +
            '<h3 class="card-title">题目</h3>' +
            '<p style="font-size:15.5px;margin:0 0 12px;">' + p.question + '</p>' +
            '<div class="answer-box">' +
              '<input type="text" class="answer-input" id="puzzleAnswerInput" placeholder="输入数字答案..." autocomplete="off" />' +
              (p.unit ? '<span class="unit-label">' + p.unit + '</span>' : '') +
              '<button class="btn btn-primary" id="btnSubmitPuzzle">提交答案</button>' +
              '<button class="btn btn-secondary btn-sm" id="btnNextPuzzle">下一题 →</button>' +
            '</div>' +
            feedbackHtml +
            '<div class="hint-panel">' +
              '<div class="hint-btn-row">' +
                '<button class="btn btn-secondary btn-sm" data-unlock-hint="1">🔦 L1 突破口</button>' +
                '<button class="btn btn-secondary btn-sm" data-unlock-hint="2" ' + (AppState.hintLevel < 1 ? 'disabled' : '') + '>📐 L2 辅助线</button>' +
                '<button class="btn btn-secondary btn-sm" data-unlock-hint="3" ' + (AppState.hintLevel < 2 ? 'disabled' : '') + '>📖 L3 完整解析</button>' +
              '</div>' +
              hintsHtml +
            '</div>' +
            whyHtml +
            parentHtml +
          '</div>' +
        '</div>';
      }
    }

    // 题库筛选列表
    var routineChips = '<button class="filter-chip ' + (AppState.filterRoutine === 'ALL' ? 'active' : '') + '" data-filter-r="ALL">全部招式 (' + PUZZLES.length + ')</button>' +
      LESSONS.map(function (ls) {
        return '<button class="filter-chip ' + (AppState.filterRoutine === ls.id ? 'active' : '') + '" data-filter-r="' + ls.id + '">' + ls.id + ' ' + ls.shortName + '</button>';
      }).join('');

    var filtered = PUZZLES.filter(function (p) {
      if (AppState.filterRoutine !== 'ALL' && p.routineId !== AppState.filterRoutine) return false;
      if (AppState.filterTier !== 'ALL' && p.tier !== AppState.filterTier) return false;
      return true;
    });

    var listHtml = filtered.map(function (p) {
      var sv = prog.solved[p.id];
      var ls = getLessonById(p.routineId);
      var stars = sv ? '⭐'.repeat(sv.stars) : '未做';
      return '<div class="puzzle-item ' + (sv ? 'solved' : '') + '" data-open-puzzle="' + p.id + '">' +
        '<div class="puzzle-item-top">' +
          '<strong>' + p.id + ' · ' + p.title + '</strong>' +
          '<span style="font-size:12px;">' + stars + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<span class="tag ' + (p.tier === 'core' ? 'tag-core' : 'tag-sprint') + '">' + (p.tier === 'core' ? '80分必拿' : '95+冲刺') + '</span>' +
          '<span class="tag ' + catTagClass(ls.category) + '">' + ls.shortName + '</span>' +
          '<span style="font-size:12px;color:#64748b;">' + p.source + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="filter-bar">' + routineChips + '</div>' +
      '<div class="filter-bar">' +
        '<button class="filter-chip ' + (AppState.filterTier === 'ALL' ? 'active' : '') + '" data-filter-t="ALL">全部难度</button>' +
        '<button class="filter-chip ' + (AppState.filterTier === 'core' ? 'active' : '') + '" data-filter-t="core">🟢 80 分必拿区</button>' +
        '<button class="filter-chip ' + (AppState.filterTier === 'sprint' ? 'active' : '') + '" data-filter-t="sprint">🟣 95+ 冲刺区</button>' +
      '</div>' +
      '<div class="puzzle-list">' + listHtml + '</div>';
  }

  // ==================== 4. 模拟考场与雷达诊断 ====================
  function renderExam() {
    if (AppState.examResult) {
      var res = AppState.examResult;
      var rows = res.details.map(function (d, i) {
        return '<tr>' +
          '<td>第 ' + (i + 1) + ' 题</td>' +
          '<td>' + d.title + '</td>' +
          '<td>' + (d.userAnswer || '未填') + '</td>' +
          '<td><strong>' + d.expected + '</strong></td>' +
          '<td>' + (d.correct ? '<span class="tag tag-core">✓ 正确</span>' : '<span class="tag tag-cut">✗ 需巩固</span>') + '</td>' +
        '</tr>';
      }).join('');

      var weakHtml = res.weakRoutines.length === 0
        ? '<div class="hint-card hint-l3">🎉 全部考察招式 100% 过关，太强了！</div>'
        : '<div class="hint-card hint-l1"><strong>🎯 建议重点回炉以下招式：</strong>' +
          res.weakRoutines.map(function (w) {
            return '<button class="btn btn-secondary btn-sm" style="margin:4px;" data-jump-lesson="' + w.id + '">' + w.id + ' ' + w.shortName + '</button>';
          }).join('') + '</div>';

      return '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
          '<div>' +
            '<h2 class="card-title">🏆 ' + res.examTitle + ' · 诊断报告</h2>' +
            '<p class="card-desc">答对 ' + res.correctCount + ' / ' + res.totalCount + ' 题 · ' + (res.passed ? '🎉 恭喜突破 80 分达标线！' : '💪 距离 80 分只差一步，看看雷达图补齐短板！') + '</p>' +
          '</div>' +
          '<div style="font-size:36px;font-weight:900;color:' + (res.passed ? '#15803d' : '#d97706') + ';">' + res.score + ' 分</div>' +
        '</div>' +
        '<div class="workspace-grid" style="margin-top:16px;">' +
          '<div class="radar-wrap">' + SVG.renderRadarSVG(res.radar) + '</div>' +
          '<div>' + weakHtml +
            '<table class="cheat-table" style="margin-top:12px;"><thead><tr><th>题号</th><th>题目</th><th>你的答案</th><th>标准答案</th><th>结果</th></tr></thead><tbody>' + rows + '</tbody></table>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:16px;display:flex;gap:10px;">' +
          '<button class="btn btn-primary" id="btnExamBack">返回考场大厅</button>' +
          '<button class="btn btn-secondary" data-go-page="review">去错题本复盘</button>' +
        '</div>' +
      '</div>';
    }

    if (AppState.activeExamId) {
      var exam = EXAMS.find(function (e) { return e.id === AppState.activeExamId; });
      var pid = exam.puzzleIds[AppState.examIndex];
      var p = getPuzzleById(pid);
      var mins = Math.floor(AppState.examRemainSec / 60);
      var secs = AppState.examRemainSec % 60;
      var timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

      var qNav = exam.puzzleIds.map(function (id, idx) {
        var answered = (AppState.examAnswers[id] || '').trim() !== '';
        return '<button class="q-dot ' + (idx === AppState.examIndex ? 'current ' : '') + (answered ? 'answered' : '') + '" data-exam-idx="' + idx + '">' + (idx + 1) + '</button>';
      }).join('');

      return '<div class="exam-header-bar">' +
        '<strong>' + exam.title + '</strong>' +
        '<div class="exam-q-nav">' + qNav + '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<span class="timer-pill" id="examTimerText">⏱️ ' + timeStr + '</span>' +
          '<button class="btn btn-gold btn-sm" id="btnSubmitExam">交卷评分</button>' +
        '</div>' +
      '</div>' +
      '<div class="workspace-grid">' +
        '<div class="svg-stage-card"><div class="svg-canvas-wrap">' + SVG.renderSVG(p.svg, 0) + '</div></div>' +
        '<div class="card">' +
          '<span class="tag tag-pythago" style="margin-bottom:8px;">第 ' + (AppState.examIndex + 1) + ' / ' + exam.puzzleIds.length + ' 题</span>' +
          '<h3 class="card-title">' + p.title + '</h3>' +
          '<p style="font-size:15.5px;">' + p.question + '</p>' +
          '<div class="answer-box">' +
            '<input type="text" class="answer-input" id="examAnswerInput" value="' + (AppState.examAnswers[pid] || '') + '" placeholder="输入数字答案..." />' +
            (p.unit ? '<span class="unit-label">' + p.unit + '</span>' : '') +
          '</div>' +
          '<div style="margin-top:16px;display:flex;justify-content:space-between;">' +
            '<button class="btn btn-secondary btn-sm" id="btnExamPrev" ' + (AppState.examIndex === 0 ? 'disabled' : '') + '>← 上一题</button>' +
            '<button class="btn btn-primary btn-sm" id="btnExamNext" ' + (AppState.examIndex === exam.puzzleIds.length - 1 ? 'disabled' : '') + '>下一题 →</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    var examCards = EXAMS.map(function (ex) {
      return '<div class="card">' +
        '<h3 class="card-title">🏆 ' + ex.title + '</h3>' +
        '<p class="card-desc">' + ex.desc + '</p>' +
        '<div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;">' +
          '<span class="tag tag-pythago">' + ex.puzzleIds.length + ' 题 · ' + ex.durationMin + ' 分钟</span>' +
          '<button class="btn btn-primary" data-start-exam="' + ex.id + '">开始模拟考试</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="grid-2">' + examCards + '</div>';
  }

  // ==================== 5. 错题本与进度管理 ====================
  function renderReview() {
    var prog = store.getState();
    var wrongList = prog.wrongIds.map(getPuzzleById).filter(Boolean);

    var body = wrongList.length === 0
      ? '<div class="card" style="text-align:center;padding:36px;"><h3>🎉 错题本空空如也！</h3><p class="card-desc">在演练场或模拟考场答错的题会自动收录到这里，重做答对后自动移出。</p></div>'
      : '<div class="puzzle-list">' + wrongList.map(function (p) {
          var ls = getLessonById(p.routineId);
          return '<div class="puzzle-item" data-open-puzzle="' + p.id + '">' +
            '<div class="puzzle-item-top"><strong>' + p.id + ' · ' + p.title + '</strong><span class="tag tag-cut">待攻克</span></div>' +
            '<p style="margin:0;font-size:13px;color:#475569;">所属招式：' + ls.shortName + '（' + p.source + '）</p>' +
          '</div>';
        }).join('') + '</div>';

    return '<div class="section-heading" style="margin-top:0;">' +
      '<h2>📓 错题本（共 ' + wrongList.length + ' 题）</h2>' +
      '<button class="btn btn-secondary btn-sm" id="btnResetProgress">🗑️ 清空本地学习记录</button>' +
    '</div>' + body;
  }

  // ==================== 速查卡弹窗内容 ====================
  function renderCheatSheetHTML() {
    var triples = CHEAT_SHEET.pythagoreanTriples.map(function (t) {
      return '<tr><td><strong>' + t.base + '</strong></td><td>' + t.multiples + '</td><td>' + t.note + '</td></tr>';
    }).join('');

    var methods = CHEAT_SHEET.xuantuFiveMethods.map(function (m) {
      return '<tr><td><strong>' + m.method + '</strong></td><td>' + m.trigger + '</td><td>' + m.action + '</td></tr>';
    }).join('');

    var tree = CHEAT_SHEET.decisionTree.map(function (line, i) {
      return '<li style="margin-bottom:6px;"><strong>第 ' + (i + 1) + ' 步：</strong>' + line + '</li>';
    }).join('');

    var principles = (THINKING.FIRST_PRINCIPLES || []).map(function (fp) {
      return '<tr><td><strong>' + fp.name + '</strong></td><td>' + fp.essence + '</td></tr>';
    }).join('');

    return '<div class="cheat-section">' +
      '<h3>🧠 画辅助线的 4 条底层第一性原理（小学 → 初联 → AMC 通用）</h3>' +
      '<table class="cheat-table"><thead><tr><th style="width:170px;">高阶思维</th><th>为什么这样想（底层动机）</th></tr></thead><tbody>' + principles + '</tbody></table>' +
    '</div>' +
    '<div class="cheat-section">' +
      '<h3>⚡ 3 秒看图决策树</h3>' +
      '<ol style="margin:0;padding-left:20px;font-size:14px;">' + tree + '</ol>' +
    '</div>' +
    '<div class="cheat-section">' +
      '<h3>🔷 弦图五大辅助线核心心法（老师笔记精华抽象）</h3>' +
      '<table class="cheat-table"><thead><tr><th>辅助线招式</th><th>什么图立刻用？</th><th>怎么画 & 怎么算</th></tr></thead><tbody>' + methods + '</tbody></table>' +
    '</div>' +
    '<div class="cheat-section">' +
      '<h3>📐 必背黄金勾股数速查表</h3>' +
      '<table class="cheat-table"><thead><tr><th>基础勾股数</th><th>常见倍数</th><th>出现频率</th></tr></thead><tbody>' + triples + '</tbody></table>' +
    '</div>';
  }

  // ==================== 渲染与事件总控 ====================
  function renderApp() {
    renderNavBadges();
    var main = document.getElementById('mainContent');
    if (!main) return;

    if (AppState.page === 'home') main.innerHTML = renderHome();
    else if (AppState.page === 'lessons') main.innerHTML = renderLessons();
    else if (AppState.page === 'lab') main.innerHTML = Lab.render(store.getState().labDone);
    else if (AppState.page === 'practice') main.innerHTML = renderPractice();
    else if (AppState.page === 'exam') main.innerHTML = renderExam();
    else if (AppState.page === 'review') main.innerHTML = renderReview();

    bindPageEvents(main);
  }

  function handleResetProgress() {
    showConfirm('清空全部学习进度？', '将清空本地 localStorage 中保存的已学微课、闯关星级、实验室通关记录、错题本和考试历史，确定清空吗？', function () {
      store.reset();
      AppState.selectedLessonId = LESSONS[0].id;
      AppState.lessonStep = 0;
      AppState.activePuzzleId = null;
      AppState.hintLevel = 0;
      AppState.lastFeedback = null;
      AppState.examResult = null;
      showToast('已清空全部本地学习进度', 'success');
      renderApp();
    });
  }

  function stopExamTimer() {
    if (AppState.examTimer) {
      clearInterval(AppState.examTimer);
      AppState.examTimer = null;
    }
  }

  function finishExam() {
    stopExamTimer();
    var exam = EXAMS.find(function (e) { return e.id === AppState.activeExamId; });
    if (!exam) return;
    var res = Engine.gradeExam(exam, AppState.examAnswers, PUZZLES, LESSONS);
    store.recordExam(res);
    AppState.examResult = res;
    AppState.activeExamId = null;
    AudioFX && (res.passed ? AudioFX.success() : AudioFX.click());
    renderApp();
  }

  function bindPageEvents(main) {
    if (AppState.page === 'lab') {
      Lab.bind(main, renderApp, function (targetKey) {
        store.markLabDone(targetKey);
        showToast('🎉 实验室目标已记录到本地进度！', 'success');
      });
    }

    main.querySelectorAll('[data-go-page]').forEach(function (el) {
      el.addEventListener('click', function () {
        AppState.page = el.getAttribute('data-go-page');
        AudioFX && AudioFX.click();
        renderApp();
      });
    });

    main.querySelectorAll('[data-jump-lesson]').forEach(function (el) {
      el.addEventListener('click', function () {
        var lid = el.getAttribute('data-jump-lesson');
        AppState.selectedLessonId = lid;
        AppState.lessonStep = 0;
        AppState.page = 'lessons';
        store.recordLessonProgress(lid, 0, false);
        AudioFX && AudioFX.click();
        renderApp();
      });
    });

    main.querySelectorAll('[data-select-lesson]').forEach(function (el) {
      el.addEventListener('click', function () {
        var lid = el.getAttribute('data-select-lesson');
        AppState.selectedLessonId = lid;
        AppState.lessonStep = 0;
        store.recordLessonProgress(lid, 0, false);
        AudioFX && AudioFX.click();
        renderApp();
      });
    });

    main.querySelectorAll('[data-lesson-step]').forEach(function (el) {
      el.addEventListener('click', function () {
        var st = Number(el.getAttribute('data-lesson-step'));
        var ls = getLessonById(AppState.selectedLessonId);
        AppState.lessonStep = st;
        store.recordLessonProgress(ls.id, st, st === ls.steps.length - 1);
        AudioFX && AudioFX.auxLine();
        renderApp();
      });
    });

    var btnPrev = main.querySelector('#btnLessonPrev');
    if (btnPrev) {
      btnPrev.addEventListener('click', function () {
        if (AppState.lessonStep > 0) {
          AppState.lessonStep--;
          store.recordLessonProgress(AppState.selectedLessonId, AppState.lessonStep, false);
          AudioFX && AudioFX.click();
          renderApp();
        }
      });
    }

    var btnNext = main.querySelector('#btnLessonNext');
    if (btnNext) {
      btnNext.addEventListener('click', function () {
        var ls = getLessonById(AppState.selectedLessonId);
        var lsIdx = LESSONS.findIndex(function (item) { return item.id === ls.id; });
        if (AppState.lessonStep < ls.steps.length - 1) {
          AppState.lessonStep++;
          AudioFX && AudioFX.auxLine();
          store.recordLessonProgress(ls.id, AppState.lessonStep, AppState.lessonStep === ls.steps.length - 1);
          renderApp();
        } else {
          store.recordLessonProgress(ls.id, ls.steps.length - 1, true);
          if (lsIdx < LESSONS.length - 1) {
            AppState.selectedLessonId = LESSONS[lsIdx + 1].id;
            AppState.lessonStep = 0;
            store.recordLessonProgress(AppState.selectedLessonId, 0, false);
            AudioFX && AudioFX.success();
            showToast('已进入下一招：' + LESSONS[lsIdx + 1].shortName, 'success');
          } else {
            AppState.page = 'lab';
            AudioFX && AudioFX.success();
            showToast('全部 8 大招式学完啦！来动手实验室玩一玩吧！', 'success');
          }
          renderApp();
        }
      });
    }

    var btnPrevLesson = main.querySelector('#btnPrevLesson');
    if (btnPrevLesson) {
      btnPrevLesson.addEventListener('click', function () {
        var idx = LESSONS.findIndex(function (item) { return item.id === AppState.selectedLessonId; });
        if (idx > 0) {
          AppState.selectedLessonId = LESSONS[idx - 1].id;
          AppState.lessonStep = 0;
          store.recordLessonProgress(AppState.selectedLessonId, 0, false);
          AudioFX && AudioFX.click();
          renderApp();
        }
      });
    }

    var btnNextLesson = main.querySelector('#btnNextLesson');
    if (btnNextLesson) {
      btnNextLesson.addEventListener('click', function () {
        var idx = LESSONS.findIndex(function (item) { return item.id === AppState.selectedLessonId; });
        if (idx < LESSONS.length - 1) {
          AppState.selectedLessonId = LESSONS[idx + 1].id;
          AppState.lessonStep = 0;
          store.recordLessonProgress(AppState.selectedLessonId, 0, false);
          AudioFX && AudioFX.click();
          renderApp();
        }
      });
    }

    main.querySelectorAll('[data-practice-routine]').forEach(function (el) {
      el.addEventListener('click', function () {
        AppState.filterRoutine = el.getAttribute('data-practice-routine');
        AppState.activePuzzleId = null;
        AppState.page = 'practice';
        AudioFX && AudioFX.click();
        renderApp();
      });
    });

    main.querySelectorAll('[data-filter-r]').forEach(function (el) {
      el.addEventListener('click', function () {
        AppState.filterRoutine = el.getAttribute('data-filter-r');
        renderApp();
      });
    });

    main.querySelectorAll('[data-filter-t]').forEach(function (el) {
      el.addEventListener('click', function () {
        AppState.filterTier = el.getAttribute('data-filter-t');
        renderApp();
      });
    });

    main.querySelectorAll('[data-open-puzzle]').forEach(function (el) {
      el.addEventListener('click', function () {
        AppState.activePuzzleId = el.getAttribute('data-open-puzzle');
        AppState.hintLevel = 0;
        AppState.lastFeedback = null;
        AppState.page = 'practice';
        AudioFX && AudioFX.click();
        renderApp();
      });
    });

    var btnBack = main.querySelector('#btnBackToList');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        AppState.activePuzzleId = null;
        AppState.lastFeedback = null;
        renderApp();
      });
    }

    main.querySelectorAll('[data-unlock-hint]').forEach(function (el) {
      el.addEventListener('click', function () {
        var lvl = Number(el.getAttribute('data-unlock-hint'));
        AppState.hintLevel = Math.max(AppState.hintLevel, lvl);
        AudioFX && AudioFX.auxLine();
        renderApp();
      });
    });

    var btnSubmitPuzzle = main.querySelector('#btnSubmitPuzzle');
    var ansInput = main.querySelector('#puzzleAnswerInput');
    if (btnSubmitPuzzle && ansInput) {
      var submitHandler = function () {
        var p = getPuzzleById(AppState.activePuzzleId);
        if (!p) return;
        var val = ansInput.value.trim();
        if (!val) {
          showToast('请先输入你的答案哦！', 'warn');
          return;
        }
        if (Engine.checkAnswer(val, p.answer)) {
          var stars = Engine.calcStars(AppState.hintLevel);
          store.recordSolve(p.id, stars);
          AppState.hintLevel = 3;
          AppState.lastFeedback = { ok: true, msg: '🎉 回答正确！答案就是 ' + p.answer + (p.unit || '') + '，获得 ' + '⭐'.repeat(stars) + '！' };
          AudioFX && AudioFX.success();
          showToast('答对了！真棒！', 'success');
        } else {
          store.recordWrong(p.id);
          AppState.lastFeedback = { ok: false, msg: '🤔 还差一点点哦！已自动加入错题本，点一下“L1 突破口”看看辅助线吧！' };
          AudioFX && AudioFX.wrong();
          showToast('再想想，可以点开 L1 提示', 'warn');
        }
        renderApp();
      };
      btnSubmitPuzzle.addEventListener('click', submitHandler);
      ansInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitHandler();
      });
    }

    var btnNextPuzzle = main.querySelector('#btnNextPuzzle');
    if (btnNextPuzzle) {
      btnNextPuzzle.addEventListener('click', function () {
        var idx = PUZZLES.findIndex(function (p) { return p.id === AppState.activePuzzleId; });
        var next = PUZZLES[(idx + 1) % PUZZLES.length];
        AppState.activePuzzleId = next.id;
        AppState.hintLevel = 0;
        AppState.lastFeedback = null;
        AudioFX && AudioFX.click();
        renderApp();
      });
    }

    // 考场事件
    main.querySelectorAll('[data-start-exam]').forEach(function (el) {
      el.addEventListener('click', function () {
        var exId = el.getAttribute('data-start-exam');
        var ex = EXAMS.find(function (e) { return e.id === exId; });
        if (!ex) return;
        stopExamTimer();
        AppState.activeExamId = ex.id;
        AppState.examIndex = 0;
        AppState.examAnswers = {};
        AppState.examResult = null;
        AppState.examRemainSec = ex.durationMin * 60;
        AppState.examTimer = setInterval(function () {
          AppState.examRemainSec--;
          var tEl = document.getElementById('examTimerText');
          if (tEl) {
            var m = Math.floor(Math.max(0, AppState.examRemainSec) / 60);
            var s = Math.max(0, AppState.examRemainSec) % 60;
            tEl.textContent = '⏱️ ' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
          }
          if (AppState.examRemainSec <= 0) finishExam();
        }, 1000);
        AudioFX && AudioFX.click();
        renderApp();
      });
    });

    var examInput = main.querySelector('#examAnswerInput');
    if (examInput && AppState.activeExamId) {
      var exCur = EXAMS.find(function (e) { return e.id === AppState.activeExamId; });
      var curPid = exCur.puzzleIds[AppState.examIndex];
      examInput.addEventListener('input', function () {
        AppState.examAnswers[curPid] = examInput.value;
      });
    }

    main.querySelectorAll('[data-exam-idx]').forEach(function (el) {
      el.addEventListener('click', function () {
        AppState.examIndex = Number(el.getAttribute('data-exam-idx'));
        renderApp();
      });
    });

    var btnExamPrev = main.querySelector('#btnExamPrev');
    if (btnExamPrev) btnExamPrev.addEventListener('click', function () { AppState.examIndex--; renderApp(); });
    var btnExamNext = main.querySelector('#btnExamNext');
    if (btnExamNext) btnExamNext.addEventListener('click', function () { AppState.examIndex++; renderApp(); });

    var btnSubmitExam = main.querySelector('#btnSubmitExam');
    if (btnSubmitExam) {
      btnSubmitExam.addEventListener('click', function () {
        showConfirm('确认交卷？', '交卷后将立即生成八大招式能力雷达图与错题诊断报告。', finishExam);
      });
    }

    var btnExamBack = main.querySelector('#btnExamBack');
    if (btnExamBack) {
      btnExamBack.addEventListener('click', function () {
        AppState.examResult = null;
        renderApp();
      });
    }

    var btnReset = main.querySelector('#btnResetProgress');
    if (btnReset) {
      btnReset.addEventListener('click', handleResetProgress);
    }
  }

  // ==================== 全局初始化 ====================
  function init() {
    // 从 localStorage 恢复上次学习断点与偏好设置
    var saved = store.getState();
    if (saved && saved.lastContext) {
      if (saved.lastContext.selectedLessonId) {
        AppState.selectedLessonId = saved.lastContext.selectedLessonId;
      }
      if (typeof saved.lastContext.lessonStep === 'number') {
        AppState.lessonStep = saved.lastContext.lessonStep;
      }
      AppState.parentMode = !!saved.lastContext.parentMode;
      if (AudioFX && typeof saved.lastContext.soundEnabled === 'boolean') {
        AudioFX.enabled = saved.lastContext.soundEnabled;
      }
    }

    document.querySelectorAll('.nav-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        AppState.page = tab.getAttribute('data-page');
        if (AppState.page === 'lessons') {
          store.recordLessonProgress(AppState.selectedLessonId, AppState.lessonStep, false);
        }
        AudioFX && AudioFX.click();
        renderApp();
      });
    });

    var brand = document.getElementById('btnBrandHome');
    if (brand) {
      brand.addEventListener('click', function () {
        AppState.page = 'home';
        renderApp();
      });
    }

    var btnCheat = document.getElementById('btnCheatSheet');
    var cheatModal = document.getElementById('cheatModal');
    var cheatBody = document.getElementById('cheatModalBody');
    if (btnCheat && cheatModal && cheatBody) {
      cheatBody.innerHTML = renderCheatSheetHTML();
      btnCheat.addEventListener('click', function () {
        cheatModal.classList.remove('hidden');
        AudioFX && AudioFX.click();
      });
      document.getElementById('btnCloseCheat').addEventListener('click', function () {
        cheatModal.classList.add('hidden');
      });
      document.getElementById('btnPrintCheat').addEventListener('click', function () {
        window.print();
      });
    }

    var btnParent = document.getElementById('btnParentMode');
    if (btnParent) {
      btnParent.addEventListener('click', function () {
        AppState.parentMode = !AppState.parentMode;
        store.saveContext({ parentMode: AppState.parentMode });
        AudioFX && AudioFX.click();
        showToast(AppState.parentMode ? '已开启家长陪学模式（每题显示 10 秒陪讲话术）' : '已关闭家长陪学模式');
        renderApp();
      });
    }

    var btnTopReset = document.getElementById('btnTopReset');
    if (btnTopReset) {
      btnTopReset.addEventListener('click', handleResetProgress);
    }

    var btnSound = document.getElementById('btnSoundToggle');
    if (btnSound && AudioFX) {
      btnSound.textContent = AudioFX.enabled ? '🔊' : '🔇';
      btnSound.addEventListener('click', function () {
        var on = AudioFX.toggle();
        store.saveContext({ soundEnabled: on });
        btnSound.textContent = on ? '🔊' : '🔇';
      });
    }

    renderApp();
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
  }
})(typeof window !== 'undefined' ? window : globalThis);
