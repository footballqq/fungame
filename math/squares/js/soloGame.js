(function (root) {
  'use strict';

  const WRONG_STORAGE_KEY = 'squares_wrong_pool_v1';
  const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  function loadWrongPool() {
    try {
      const raw = window.localStorage.getItem(WRONG_STORAGE_KEY);
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveWrongPool(pool) {
    try {
      window.localStorage.setItem(WRONG_STORAGE_KEY, JSON.stringify(pool.slice(-30)));
    } catch {}
  }

  function parseRange(val) {
    const parts = val.split('-').map(Number);
    return { minN: parts[0] || 11, maxN: parts[1] || 30 };
  }

  function initSoloGame() {
    const recordsSvc = root.SquaresRecords.createRecordsService();
    const nameInput = document.getElementById('soloNameInput');
    const starsEl = document.getElementById('soloTotalStars');
    const rankEl = document.getElementById('soloStarRankBadge');
    const clearStarsBtn = document.getElementById('btnClearSoloStars');

    const modeSelect = document.getElementById('soloModeSelect');
    const rangeSelect = document.getElementById('soloRangeSelect');
    const minInput = document.getElementById('soloMinInput');
    const maxInput = document.getElementById('soloMaxInput');
    const filterSelect = document.getElementById('soloFilterSelect');
    const countSelect = document.getElementById('soloCountSelect');
    const startBtn = document.getElementById('btnSoloStart');
    const stageEl = document.getElementById('soloPlayArea');
    const summaryEl = document.getElementById('soloSummaryArea');

    if (!startBtn || !stageEl) return;

    function getCurrentPlayerName() {
      return (nameInput && nameInput.value.trim()) || '数学小达人';
    }

    function refreshStarBanner() {
      const profile = recordsSvc.getSoloProfile(getCurrentPlayerName());
      if (starsEl) starsEl.textContent = String(profile.stars);
      if (rankEl) rankEl.textContent = profile.rank;
    }

    const savedState = recordsSvc.load();
    if (nameInput && savedState.lastSoloName) {
      nameInput.value = savedState.lastSoloName;
    }
    refreshStarBanner();

    if (nameInput) nameInput.addEventListener('input', refreshStarBanner);
    if (clearStarsBtn) {
      clearStarsBtn.addEventListener('click', function () {
        if (window.confirm('确定清空本地保存的所有单人星星记录吗？')) {
          recordsSvc.clearSoloStars();
          refreshStarBanner();
        }
      });
    }

    rangeSelect.addEventListener('change', function () {
      if (rangeSelect.value !== 'custom') {
        const r = parseRange(rangeSelect.value);
        if (minInput) minInput.value = String(r.minN);
        if (maxInput) maxInput.value = String(r.maxN);
      }
    });
    if (minInput) minInput.addEventListener('change', function () { rangeSelect.value = 'custom'; });
    if (maxInput) maxInput.addEventListener('change', function () { rangeSelect.value = 'custom'; });

    let session = null;
    let nextTimer = null;

    function clearTimer() {
      if (nextTimer) {
        window.clearTimeout(nextTimer);
        nextTimer = null;
      }
    }

    function parseMode(raw) {
      if (raw.startsWith('choice-')) {
        return { inputType: 'choice', mode: raw.replace('choice-', '') };
      }
      return { inputType: 'keypad', mode: raw };
    }

    function startSession(customFocusPool) {
      clearTimer();
      const range = root.SquaresEngine.normalizeRange(
        minInput ? minInput.value : 11,
        maxInput ? maxInput.value : 30
      );
      if (minInput) minInput.value = String(range.minN);
      if (maxInput) maxInput.value = String(range.maxN);

      const filterType = filterSelect ? filterSelect.value : 'all';
      const parsed = parseMode(modeSelect.value);
      const total = Number(countSelect.value) || 10;
      const focusPool = customFocusPool || loadWrongPool();

      const questions = root.SquaresEngine.generateQuestionBatch(total, {
        minN: range.minN,
        maxN: range.maxN,
        filterType: filterType,
        mode: parsed.mode,
        inputType: parsed.inputType,
        focusPool: focusPool,
      });

      session = {
        total: total,
        index: 0,
        questions: questions,
        correct: 0,
        wrong: 0,
        wrongItems: [],
        startTime: Date.now(),
        inputState: root.SquaresEngine.createInputState(questions[0].expectedDigits),
        chosenOption: null,
      };

      summaryEl.style.display = 'none';
      stageEl.style.display = 'block';
      renderQuestion();
    }

    function renderQuestion() {
      const q = session.questions[session.index];
      const st = session.inputState;
      const isChoice = q.inputType === 'choice';

      let slotsHtml = '';
      if (!isChoice) {
        const slots = [];
        for (let i = 0; i < q.expectedDigits; i++) {
          const ch = st.value[i] || '';
          let cls = 'digit-slot';
          if (ch) cls += ' filled';
          if (st.locked) cls += st.correct ? ' is-correct' : ' is-wrong';
          slots.push('<div class="' + cls + '">' + ch + '</div>');
        }
        slotsHtml = '<div class="digit-slots">' + slots.join('') + '</div>';
      }

      let feedbackHtml = '<div class="feedback-banner"></div>';
      if (st.locked) {
        if (st.correct) {
          feedbackHtml =
            '<div class="feedback-banner ok">✅ 回答正确！' +
            q.n +
            '² = ' +
            q.sq +
            '</div>';
        } else {
          feedbackHtml =
            '<div class="feedback-banner err">❌ 答错了（不可反悔）！正确答案是 ' +
            q.answer +
            '（' +
            q.n +
            '² = ' +
            q.sq +
            '）</div>';
        }
      }

      let inputHtml = '';
      if (isChoice) {
        inputHtml =
          '<div class="no-undo-tip">⚡ 强迷惑四选一 · 点下即锁定，不可反悔</div>' +
          '<div class="choice-grid">' +
          q.options
            .map(function (opt) {
              let cls = 'choice-btn';
              if (st.locked) {
                if (opt === q.answer) cls += ' is-correct';
                else if (opt === session.chosenOption) cls += ' is-wrong';
              }
              return (
                '<button type="button" class="' +
                cls +
                '" data-opt="' +
                opt +
                '"' +
                (st.locked ? ' disabled' : '') +
                '>' +
                opt +
                '</button>'
              );
            })
            .join('') +
          '</div>';
      } else {
        inputHtml =
          '<div class="no-undo-tip">⚡ 纯触控点选 · 填满 ' +
          q.expectedDigits +
          ' 位自动判对错，无退格反悔机会！</div>' +
          '<div class="touch-keypad">' +
          DIGITS.map(function (d) {
            return (
              '<button type="button" class="key-btn" data-digit="' +
              d +
              '"' +
              (st.locked ? ' disabled' : '') +
              '>' +
              d +
              '</button>'
            );
          }).join('') +
          '</div>';
      }

      stageEl.innerHTML =
        '<div class="solo-hud">' +
        '<span class="hud-pill">第 ' +
        (session.index + 1) +
        ' / ' +
        session.total +
        ' 题</span>' +
        '<span class="hud-pill ok">✓ 对 ' +
        session.correct +
        '</span>' +
        '<span class="hud-pill err">✕ 错 ' +
        session.wrong +
        '</span>' +
        '</div>' +
        '<div class="question-box">' +
        '<div class="question-sub">' +
        q.promptSub +
        '</div>' +
        '<div class="question-main">' +
        q.promptMain +
        '</div>' +
        slotsHtml +
        feedbackHtml +
        '</div>' +
        inputHtml;

      // 绑定 pointerdown / click 零延迟响应
      if (isChoice) {
        stageEl.querySelectorAll('.choice-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (session.inputState.locked) return;
            const opt = btn.getAttribute('data-opt');
            session.chosenOption = opt;
            session.inputState = {
              expectedDigits: q.expectedDigits,
              value: opt,
              locked: true,
              correct: opt === q.answer,
            };
            handleLockedResult(q);
          });
        });
      } else {
        stageEl.querySelectorAll('.key-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (session.inputState.locked) return;
            const d = btn.getAttribute('data-digit');
            root.SquaresSound.tap();
            session.inputState = root.SquaresEngine.appendDigitNoUndo(
              session.inputState,
              d,
              q.answer
            );
            if (session.inputState.locked) {
              handleLockedResult(q);
            } else {
              renderQuestion();
            }
          });
        });
      }
    }

    function handleLockedResult(q) {
      const pool = loadWrongPool();
      if (session.inputState.correct) {
        session.correct += 1;
        root.SquaresSound.correct();
        const filtered = pool.filter(function (x) {
          return x !== q.n;
        });
        saveWrongPool(filtered);
      } else {
        session.wrong += 1;
        session.wrongItems.push(q);
        root.SquaresSound.wrong();
        if (!pool.includes(q.n)) {
          pool.push(q.n);
          saveWrongPool(pool);
        }
      }

      renderQuestion();

      const delay = session.inputState.correct ? 650 : 1250;
      nextTimer = window.setTimeout(function () {
        if (session.index + 1 >= session.total) {
          renderSummary();
        } else {
          session.index += 1;
          session.inputState = root.SquaresEngine.createInputState(
            session.questions[session.index].expectedDigits
          );
          session.chosenOption = null;
          renderQuestion();
        }
      }, delay);
    }

    function renderSummary() {
      stageEl.style.display = 'none';
      summaryEl.style.display = 'block';
      const elapsedSec = ((Date.now() - session.startTime) / 1000).toFixed(1);
      const acc = Math.round((session.correct / session.total) * 100);
      const isPerfect = session.wrong === 0 && session.correct === session.total;
      const starRes = recordsSvc.recordSoloStars(getCurrentPlayerName(), session.correct, isPerfect);
      refreshStarBanner();

      if (acc >= 80) root.SquaresSound.win();

      const starMsg =
        '<div style="background:#fefce8;border:1.5px solid #fde047;border-radius:14px;padding:10px 14px;margin:10px 0;font-weight:800;color:#854d0e;">' +
        '⭐ ' +
        starRes.name +
        ' 本轮获得 <strong>+' +
        starRes.gained +
        ' 颗星</strong>' +
        (starRes.bonus > 0 ? '（含全对完美奖励 +' + starRes.bonus + '🌟）' : '') +
        ' · 当前累计 <strong>' +
        starRes.totalStars +
        ' ⭐</strong>（' +
        starRes.rank +
        '）</div>';

      const wrongHtml =
        session.wrongItems.length === 0
          ? '<p style="color:#059669;font-weight:800;">🎉 零失误全对通关，太强了！</p>'
          : '<div><strong>本局错题速记：</strong><div class="wrong-list">' +
            session.wrongItems
              .map(function (item) {
                return '<span class="wrong-chip">' + item.n + '² = ' + item.sq + '</span>';
              })
              .join('') +
            '</div></div>';

      summaryEl.innerHTML =
        '<div class="summary-box">' +
        '<h3 style="margin:0 0 8px;font-size:22px;">🏁 本轮挑战完成！</h3>' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:10px;">' +
        '正确率 <span style="color:#4f46e5;font-size:24px;">' +
        acc +
        '%</span>（对 ' +
        session.correct +
        ' / 错 ' +
        session.wrong +
        '） · 用时 ' +
        elapsedSec +
        ' 秒</div>' +
        starMsg +
        wrongHtml +
        '<div style="margin-top:18px;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">' +
        '<button type="button" class="btn btn-primary" id="btnSoloAgain">再来一局</button>' +
        (session.wrongItems.length > 0
          ? '<button type="button" class="btn btn-amber" id="btnSoloRetryWrong">专攻刚才的错题</button>'
          : '') +
        '</div></div>';

      document.getElementById('btnSoloAgain').addEventListener('click', function () {
        startSession();
      });
      const retryWrongBtn = document.getElementById('btnSoloRetryWrong');
      if (retryWrongBtn) {
        retryWrongBtn.addEventListener('click', function () {
          const wrongNs = session.wrongItems.map(function (i) {
            return i.n;
          });
          startSession(wrongNs);
        });
      }
    }

    startBtn.addEventListener('click', function () {
      startSession();
    });

    // 默认自动开一局，打开即玩
    startSession();
  }

  root.SquaresSoloGame = { init: initSoloGame };
})(typeof self !== 'undefined' ? self : this);
