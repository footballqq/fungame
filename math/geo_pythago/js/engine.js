/**
 * 核心领域引擎（纯逻辑、零 DOM 依赖，可直接在 Node.js 下单测）
 * 包含：答案校验器、星级引擎、模拟考场评分与八大招式雷达聚合、进度与错题本持久化
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'geo_pythago_progress_v1';

  /**
   * 清洗并校验数值答案（支持整数、小数，允许输入带单位如 "12厘米" 或空格）
   */
  function parseNumericAnswer(raw) {
    if (raw == null) return NaN;
    var str = String(raw).trim().replace(/[，,]/g, '');
    var match = str.match(/-?\d+(\.\d+)?/);
    if (!match) return NaN;
    return Number(match[0]);
  }

  function checkAnswer(userInput, expected) {
    var num = parseNumericAnswer(userInput);
    if (Number.isNaN(num)) return false;
    return Math.abs(num - Number(expected)) < 1e-6;
  }

  /**
   * 根据使用的最高提示等级计算获得星级 (0=无提示3星, 1=L1得2星, >=2得1星)
   */
  function calcStars(hintLevelUsed) {
    if (!hintLevelUsed || hintLevelUsed <= 0) return 3;
    if (hintLevelUsed === 1) return 2;
    return 1;
  }

  /**
   * 模拟考场自动阅卷 + 八大招式掌握度雷达图聚合
   */
  function gradeExam(exam, answersMap, puzzles, lessons) {
    var puzzleById = {};
    puzzles.forEach(function (p) { puzzleById[p.id] = p; });

    var details = [];
    var correctCount = 0;
    var routineStats = {};

    exam.puzzleIds.forEach(function (pid) {
      var p = puzzleById[pid];
      if (!p) return;
      var userAns = answersMap[pid] || '';
      var ok = checkAnswer(userAns, p.answer);
      if (ok) correctCount++;
      details.push({
        puzzleId: pid,
        title: p.title,
        routineId: p.routineId,
        userAnswer: userAns,
        expected: p.answer,
        correct: ok
      });

      if (!routineStats[p.routineId]) {
        routineStats[p.routineId] = { total: 0, correct: 0 };
      }
      routineStats[p.routineId].total++;
      if (ok) routineStats[p.routineId].correct++;
    });

    var total = details.length || 1;
    var score = Math.round((correctCount / total) * 100);
    var passed = score >= (exam.passScore || 80);

    var radar = lessons.map(function (ls) {
      var st = routineStats[ls.id];
      return {
        routineId: ls.id,
        shortName: ls.shortName,
        rate: st ? (st.correct / st.total) : 0.65,
        tested: !!st
      };
    });

    var weakRoutines = lessons.filter(function (ls) {
      var st = routineStats[ls.id];
      return st && st.correct < st.total;
    });

    return {
      examId: exam.id,
      examTitle: exam.title,
      score: score,
      correctCount: correctCount,
      totalCount: details.length,
      passed: passed,
      details: details,
      radar: radar,
      weakRoutines: weakRoutines
    };
  }

  /**
   * 进度与错题本存储服务（支持注入内存 storage 以便自动化测试）
   */
  function createProgressStore(storageAdapter) {
    var adapter = storageAdapter || (typeof window !== 'undefined' && window.localStorage ? window.localStorage : null);

    function defaultData() {
      return {
        solved: {},          // { P01: { stars: 3, attempts: 1 } }
        wrongIds: [],        // ['P03', ...]
        lessonsDone: [],     // ['R1', ...] 已学完的微课
        lessonsVisited: [],  // ['R1', ...] 已浏览过的微课
        lessonSteps: {},     // { R1: 2 } 每招微课最高学到的步骤索引
        labDone: [],         // ['19', '12-3', ...] 实验室已通关目标
        examHistory: [],     // [{ examId, score, date }]
        lastContext: {       // 上次学习断点与偏好设置
          selectedLessonId: 'R1',
          lessonStep: 0,
          parentMode: false,
          soundEnabled: true
        }
      };
    }

    function load() {
      if (!adapter) return defaultData();
      try {
        var raw = adapter.getItem(STORAGE_KEY);
        if (!raw) return defaultData();
        var parsed = JSON.parse(raw);
        var base = defaultData();
        return Object.assign(base, parsed, {
          lastContext: Object.assign(base.lastContext, parsed.lastContext || {})
        });
      } catch (e) {
        return defaultData();
      }
    }

    function save(data) {
      if (!adapter) return;
      try {
        adapter.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        // 忽略无痕模式存储受限
      }
    }

    return {
      getState: function () {
        return load();
      },
      recordSolve: function (puzzleId, stars) {
        var d = load();
        var prev = d.solved[puzzleId];
        d.solved[puzzleId] = {
          stars: Math.max(prev ? prev.stars : 0, stars || 1),
          attempts: (prev ? prev.attempts : 0) + 1
        };
        d.wrongIds = d.wrongIds.filter(function (id) { return id !== puzzleId; });
        save(d);
        return d;
      },
      recordWrong: function (puzzleId) {
        var d = load();
        if (d.wrongIds.indexOf(puzzleId) === -1) {
          d.wrongIds.push(puzzleId);
        }
        save(d);
        return d;
      },
      markLessonDone: function (lessonId) {
        var d = load();
        if (d.lessonsDone.indexOf(lessonId) === -1) {
          d.lessonsDone.push(lessonId);
        }
        if (d.lessonsVisited.indexOf(lessonId) === -1) {
          d.lessonsVisited.push(lessonId);
        }
        save(d);
        return d;
      },
      recordLessonProgress: function (lessonId, step, isFinal) {
        var d = load();
        if (d.lessonsVisited.indexOf(lessonId) === -1) {
          d.lessonsVisited.push(lessonId);
        }
        var prev = d.lessonSteps[lessonId] != null ? d.lessonSteps[lessonId] : -1;
        if (step > prev) {
          d.lessonSteps[lessonId] = step;
        }
        if (isFinal && d.lessonsDone.indexOf(lessonId) === -1) {
          d.lessonsDone.push(lessonId);
        }
        d.lastContext.selectedLessonId = lessonId;
        d.lastContext.lessonStep = step;
        save(d);
        return d;
      },
      markLabDone: function (targetId) {
        var d = load();
        if (d.labDone.indexOf(targetId) === -1) {
          d.labDone.push(targetId);
        }
        save(d);
        return d;
      },
      saveContext: function (partial) {
        var d = load();
        d.lastContext = Object.assign(d.lastContext, partial || {});
        save(d);
        return d;
      },
      recordExam: function (result) {
        var d = load();
        d.examHistory.unshift({
          examId: result.examId,
          examTitle: result.examTitle,
          score: result.score,
          passed: result.passed,
          date: new Date().toISOString().slice(0, 10)
        });
        result.details.forEach(function (item) {
          if (!item.correct && d.wrongIds.indexOf(item.puzzleId) === -1) {
            d.wrongIds.push(item.puzzleId);
          }
        });
        save(d);
        return d;
      },
      reset: function () {
        if (adapter && typeof adapter.removeItem === 'function') {
          try {
            adapter.removeItem(STORAGE_KEY);
          } catch (e) {}
        }
        return defaultData();
      }
    };
  }

  var GeoEngine = {
    parseNumericAnswer: parseNumericAnswer,
    checkAnswer: checkAnswer,
    calcStars: calcStars,
    gradeExam: gradeExam,
    createProgressStore: createProgressStore
  };

  global.GeoEngine = GeoEngine;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoEngine;
  }
})(typeof window !== 'undefined' ? window : globalThis);
