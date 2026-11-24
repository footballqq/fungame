(function (root) {
  'use strict';

  const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  function parseRange(val) {
    const parts = val.split('-').map(Number);
    return { minN: parts[0] || 11, maxN: parts[1] || 30 };
  }

  function parseMode(raw) {
    if (raw.startsWith('choice-')) {
      return { inputType: 'choice', mode: raw.replace('choice-', '') };
    }
    return { inputType: 'keypad', mode: raw };
  }

  function initPkGame() {
    const modeSelect = document.getElementById('pkModeSelect');
    const rangeSelect = document.getElementById('pkRangeSelect');
    const minInput = document.getElementById('pkMinInput');
    const maxInput = document.getElementById('pkMaxInput');
    const filterSelect = document.getElementById('pkFilterSelect');
    const roundsSelect = document.getElementById('pkRoundsSelect');
    const ruleSelect = document.getElementById('pkRuleSelect');
    const startBtn = document.getElementById('btnPkStart');

    const overlayEl = document.getElementById('pkArenaOverlay');
    const halfBEl = document.getElementById('pkHalfB');
    const halfAEl = document.getElementById('pkHalfA');
    const dividerTitleEl = document.getElementById('pkDividerTitle');
    const exitBtn = document.getElementById('btnPkExit');
    const resultArea = document.getElementById('pkResultArea');

    if (!startBtn || !overlayEl) return;

    rangeSelect.addEventListener('change', function () {
      if (rangeSelect.value !== 'custom') {
        const r = parseRange(rangeSelect.value);
        if (minInput) minInput.value = String(r.minN);
        if (maxInput) maxInput.value = String(r.maxN);
      }
    });
    if (minInput) minInput.addEventListener('change', function () { rangeSelect.value = 'custom'; });
    if (maxInput) maxInput.addEventListener('change', function () { rangeSelect.value = 'custom'; });

    let match = null;
    let inputs = null;
    let chosenOpts = null;
    let roundStartTime = 0;
    let roundTimer = null;

    function clearRoundTimer() {
      if (roundTimer) {
        window.clearTimeout(roundTimer);
        roundTimer = null;
      }
    }

    function startMatch() {
      clearRoundTimer();
      const range = root.SquaresEngine.normalizeRange(
        minInput ? minInput.value : 11,
        maxInput ? maxInput.value : 30
      );
      if (minInput) minInput.value = String(range.minN);
      if (maxInput) maxInput.value = String(range.maxN);

      const filterType = filterSelect ? filterSelect.value : 'all';
      const parsed = parseMode(modeSelect.value);
      const totalRounds = Number(roundsSelect.value) || 10;
      const ruleType = ruleSelect.value || 'both';

      match = root.SquaresEngine.createPkMatch({
        totalRounds: totalRounds,
        minN: range.minN,
        maxN: range.maxN,
        filterType: filterType,
        mode: parsed.mode,
        inputType: parsed.inputType,
        ruleType: ruleType,
      });

      resultArea.style.display = 'none';
      overlayEl.classList.add('active');
      setupRound();
    }

    function setupRound() {
      const q = match.questions[match.roundIndex];
      inputs = {
        A: root.SquaresEngine.createInputState(q.expectedDigits),
        B: root.SquaresEngine.createInputState(q.expectedDigits),
      };
      chosenOpts = { A: null, B: null };
      roundStartTime = Date.now();
      renderArena();
    }

    function renderPlayerHalf(container, playerKey) {
      const q = match.questions[match.roundIndex];
      const p = match.players[playerKey];
      const st = inputs[playerKey];
      const sub = match.roundSubmissions[playerKey];
      const roundOver = root.SquaresEngine.isPkRoundFinished(match);
      const disabled = st.locked || roundOver;
      const isChoice = q.inputType === 'choice';

      let slotsHtml = '';
      if (!isChoice) {
        const arr = [];
        for (let i = 0; i < q.expectedDigits; i++) {
          const ch = st.value[i] || '';
          let cls = 'pk-slot';
          if (st.locked) cls += st.correct ? ' is-correct' : ' is-wrong';
          arr.push('<div class="' + cls + '">' + ch + '</div>');
        }
        slotsHtml = '<div class="pk-slots">' + arr.join('') + '</div>';
      }

      let statusText = '填满即锁死，不能反悔！';
      let statusCls = 'pk-status-line';
      if (sub) {
        if (sub.correct) {
          statusText = '✅ 正确！(' + (sub.timeMs / 1000).toFixed(1) + 's)';
          statusCls += ' ok';
        } else {
          statusText = '❌ 填错锁定！正确答案：' + q.answer;
          statusCls += ' err';
        }
      } else if (roundOver && match.roundWinner && match.roundWinner !== playerKey) {
        statusText = '⚡ 对手抢先答对！答案：' + q.answer;
        statusCls += ' err';
      }

      let controlsHtml = '';
      if (isChoice) {
        controlsHtml =
          '<div class="pk-choices">' +
          q.options
            .map(function (opt) {
              let cls = 'choice-btn';
              if (roundOver || st.locked) {
                if (opt === q.answer && (roundOver || st.correct)) cls += ' is-correct';
                else if (opt === chosenOpts[playerKey] && !st.correct) cls += ' is-wrong';
              }
              return (
                '<button type="button" class="' +
                cls +
                '" data-p="' +
                playerKey +
                '" data-opt="' +
                opt +
                '"' +
                (disabled ? ' disabled' : '') +
                '>' +
                opt +
                '</button>'
              );
            })
            .join('') +
          '</div>';
      } else {
        controlsHtml =
          '<div class="pk-keypad">' +
          DIGITS.map(function (d) {
            return (
              '<button type="button" class="key-btn" data-p="' +
              playerKey +
              '" data-digit="' +
              d +
              '"' +
              (disabled ? ' disabled' : '') +
              '>' +
              d +
              '</button>'
            );
          }).join('') +
          '</div>';
      }

      container.innerHTML =
        '<div class="pk-player-head">' +
        '<span class="pk-player-tag ' +
        playerKey.toLowerCase() +
        '">' +
        (playerKey === 'A' ? '🔵 下方玩家' : '🟠 上方玩家') +
        '</span>' +
        '<span>对 ' +
        p.correct +
        ' · 错 ' +
        p.wrong +
        '</span>' +
        '</div>' +
        '<div class="pk-q-row">' +
        '<div class="pk-q-text">' +
        q.promptMain +
        '</div>' +
        slotsHtml +
        '</div>' +
        '<div class="' +
        statusCls +
        '">' +
        statusText +
        '</div>' +
        controlsHtml;

      if (isChoice) {
        container.querySelectorAll('.choice-btn').forEach(function (btn) {
          btn.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            handleChoice(playerKey, btn.getAttribute('data-opt'));
          });
        });
      } else {
        container.querySelectorAll('.key-btn').forEach(function (btn) {
          btn.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            handleDigit(playerKey, btn.getAttribute('data-digit'));
          });
        });
      }
    }

    function renderArena() {
      dividerTitleEl.textContent =
        '⚔️ 第 ' +
        (match.roundIndex + 1) +
        ' / ' +
        match.totalRounds +
        ' 局 · ' +
        (match.ruleType === 'race' ? '抢答竞速制' : '同题双计制');
      renderPlayerHalf(halfBEl, 'B');
      renderPlayerHalf(halfAEl, 'A');
    }

    function handleDigit(playerKey, digit) {
      if (!match || inputs[playerKey].locked || root.SquaresEngine.isPkRoundFinished(match)) return;
      const q = match.questions[match.roundIndex];
      root.SquaresSound.tap();
      inputs[playerKey] = root.SquaresEngine.appendDigitNoUndo(
        inputs[playerKey],
        digit,
        q.answer
      );
      if (inputs[playerKey].locked) {
        finalizePlayer(playerKey, inputs[playerKey].value);
      } else {
        renderArena();
      }
    }

    function handleChoice(playerKey, opt) {
      if (!match || inputs[playerKey].locked || root.SquaresEngine.isPkRoundFinished(match)) return;
      const q = match.questions[match.roundIndex];
      chosenOpts[playerKey] = opt;
      inputs[playerKey] = {
        expectedDigits: q.expectedDigits,
        value: opt,
        locked: true,
        correct: opt === q.answer,
      };
      finalizePlayer(playerKey, opt);
    }

    function finalizePlayer(playerKey, value) {
      const elapsed = Date.now() - roundStartTime;
      const sub = root.SquaresEngine.submitPkPlayerAnswer(match, playerKey, value, elapsed);
      if (sub) {
        if (sub.correct) root.SquaresSound.correct();
        else root.SquaresSound.wrong();
      }

      renderArena();

      if (root.SquaresEngine.isPkRoundFinished(match)) {
        roundTimer = window.setTimeout(function () {
          const done = root.SquaresEngine.advancePkRound(match);
          if (done) {
            finishMatch();
          } else {
            setupRound();
          }
        }, 950);
      }
    }

    function finishMatch() {
      clearRoundTimer();
      overlayEl.classList.remove('active');
      root.SquaresSound.win();

      const A = match.players.A;
      const B = match.players.B;
      let verdict = '🤝 势均力敌，平局！';
      if (A.correct > B.correct) verdict = '🏆 🔵 下方玩家获胜！';
      else if (B.correct > A.correct) verdict = '🏆 🟠 上方玩家获胜！';
      else if (A.correct > 0 && A.totalTimeMs !== B.totalTimeMs) {
        verdict =
          A.totalTimeMs < B.totalTimeMs
            ? '⚡ 同分速度险胜：🔵 下方玩家获胜！'
            : '⚡ 同分速度险胜：🟠 上方玩家获胜！';
      }

      const avgA = A.correct > 0 ? (A.totalTimeMs / A.correct / 1000).toFixed(2) + 's' : '-';
      const avgB = B.correct > 0 ? (B.totalTimeMs / B.correct / 1000).toFixed(2) + 's' : '-';

      const missed = match.history.filter(function (h) {
        return (h.A && !h.A.correct) || (h.B && !h.B.correct);
      });

      const missedHtml =
        missed.length === 0
          ? '<p style="color:#059669;font-weight:800;">双方零失误，神仙打架！</p>'
          : '<div><strong>本场易错题复盘：</strong><div class="wrong-list">' +
            missed
              .map(function (h) {
                return (
                  '<span class="wrong-chip">' +
                  h.question.n +
                  '² = ' +
                  h.question.sq +
                  '</span>'
                );
              })
              .join('') +
            '</div></div>';

      resultArea.style.display = 'block';
      resultArea.innerHTML =
        '<div class="summary-box">' +
        '<h3 style="margin:0 0 12px;font-size:24px;">' +
        verdict +
        '</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">' +
        '<div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:16px;padding:12px;">' +
        '<div style="font-weight:900;color:#2563eb;">🔵 下方玩家</div>' +
        '<div style="font-size:22px;font-weight:900;margin:4px 0;">对 ' +
        A.correct +
        ' / 错 ' +
        A.wrong +
        '</div>' +
        '<div style="font-size:12px;color:#475569;">平均正确用时：' +
        avgA +
        '</div></div>' +
        '<div style="background:#fff7ed;border:2px solid #fdba74;border-radius:16px;padding:12px;">' +
        '<div style="font-weight:900;color:#ea580c;">🟠 上方玩家</div>' +
        '<div style="font-size:22px;font-weight:900;margin:4px 0;">对 ' +
        B.correct +
        ' / 错 ' +
        B.wrong +
        '</div>' +
        '<div style="font-size:12px;color:#475569;">平均正确用时：' +
        avgB +
        '</div></div>' +
        '</div>' +
        missedHtml +
        '<div style="margin-top:16px;">' +
        '<button type="button" class="btn btn-primary" id="btnPkRematch">⚔️ 再来一局 PK</button>' +
        '</div></div>';

      document.getElementById('btnPkRematch').addEventListener('click', startMatch);
    }

    startBtn.addEventListener('click', startMatch);
    exitBtn.addEventListener('click', function () {
      clearRoundTimer();
      overlayEl.classList.remove('active');
    });
  }

  root.SquaresPkGame = { init: initPkGame };
})(typeof self !== 'undefined' ? self : this);
