(function (root) {
  'use strict';

  const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const ACTIVE_PK_KEY = 'squares_active_pk_v1';

  function loadSavedPkRaw() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(ACTIVE_PK_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.match || !Array.isArray(parsed.match.questions)) return null;
      if (parsed.match.roundIndex >= parsed.match.totalRounds) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function clearSavedPkRaw() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ACTIVE_PK_KEY);
      }
    } catch {}
  }

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
    const recordsSvc = root.SquaresRecords.createRecordsService();
    const nameAInput = document.getElementById('pkNameAInput');
    const nameBInput = document.getElementById('pkNameBInput');
    const randomNamesBtn = document.getElementById('btnPkRandomNames');
    const saveRecordCheck = document.getElementById('pkSaveRecordCheck');
    const leaderboardArea = document.getElementById('pkLeaderboardArea');

    const modeSelect = document.getElementById('pkModeSelect');
    const rangeSelect = document.getElementById('pkRangeSelect');
    const minInput = document.getElementById('pkMinInput');
    const maxInput = document.getElementById('pkMaxInput');
    const filterSelect = document.getElementById('pkFilterSelect');
    const roundsSelect = document.getElementById('pkRoundsSelect');
    const ruleSelect = document.getElementById('pkRuleSelect');
    const timeLimitSelect = document.getElementById('pkTimeLimitSelect');
    const startBtn = document.getElementById('btnPkStart');

    const overlayEl = document.getElementById('pkArenaOverlay');
    const halfBEl = document.getElementById('pkHalfB');
    const halfAEl = document.getElementById('pkHalfA');
    const dividerTitleEl = document.getElementById('pkDividerTitle');
    const timerTextEl = document.getElementById('pkTimerText');
    const timerFillEl = document.getElementById('pkTimerFill');
    const exitBtn = document.getElementById('btnPkExit');
    const resultArea = document.getElementById('pkResultArea');

    if (!startBtn || !overlayEl) return;

    const saved = recordsSvc.load();
    if (nameAInput && saved.lastPkNames && saved.lastPkNames.A) nameAInput.value = saved.lastPkNames.A;
    if (nameBInput && saved.lastPkNames && saved.lastPkNames.B) nameBInput.value = saved.lastPkNames.B;

    if (randomNamesBtn) {
      randomNamesBtn.addEventListener('click', function () {
        const pair = root.SquaresRecords.pickRandomPairWithAvatars
          ? root.SquaresRecords.pickRandomPairWithAvatars()
          : root.SquaresRecords.pickRandomPair();
        if (nameAInput) nameAInput.value = pair[0];
        if (nameBInput) nameBInput.value = pair[1];
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

    let match = null;
    let inputs = null;
    let chosenOpts = null;
    let roundStartTime = 0;
    let roundTimer = null;
    let countdownInterval = null;
    let externalFinishCallback = null;
    let shouldSaveToLeaderboard = true;
    let matchHeaderPrefix = '';
    let currentTournamentMatchId = null;

    function persistActiveMatch() {
      if (!match || match.roundIndex >= match.totalRounds) return;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(
            ACTIVE_PK_KEY,
            JSON.stringify({
              version: 1,
              savedAt: new Date().toISOString(),
              match: match,
              shouldSaveToLeaderboard: shouldSaveToLeaderboard,
              matchHeaderPrefix: matchHeaderPrefix,
              tournamentMatchId: currentTournamentMatchId,
            })
          );
        }
      } catch {}
    }

    function clearTimers() {
      if (roundTimer) {
        window.clearTimeout(roundTimer);
        roundTimer = null;
      }
      if (countdownInterval) {
        window.clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }

    function updateCountdownBar() {
      if (!match || !timerFillEl || !timerTextEl) return;
      const limitMs = (match.timeLimitSec || 30) * 1000;
      const elapsed = Date.now() - roundStartTime;
      const remaining = Math.max(0, limitMs - elapsed);
      const ratio = remaining / limitMs;

      timerFillEl.style.width = (ratio * 100).toFixed(1) + '%';
      timerFillEl.classList.remove('warn', 'danger');
      if (ratio <= 0.2) timerFillEl.classList.add('danger');
      else if (ratio <= 0.5) timerFillEl.classList.add('warn');

      timerTextEl.textContent = '⏱️ ' + (remaining / 1000).toFixed(1) + 's';

      if (remaining <= 0 && !root.SquaresEngine.isPkRoundFinished(match)) {
        window.clearInterval(countdownInterval);
        countdownInterval = null;
        root.SquaresEngine.timeoutPkRound(match);
        root.SquaresSound.wrong();
        renderArena();
        scheduleNextRound();
      }
    }

    function renderLeaderboard() {
      if (!leaderboardArea) return;
      const board = recordsSvc.getPkLeaderboardSorted();
      const history = recordsSvc.load().pkHistory || [];

      if (board.length === 0) {
        leaderboardArea.innerHTML =
          '<div style="font-weight:800;font-size:14px;color:#334155;">🏆 历史战绩英雄榜</div>' +
          '<p style="margin:6px 0 0;font-size:12px;color:#64748b;">暂无对战记录。开始一局 PK（如“牛顿 vs 莱布尼茨”），打完自动上榜！</p>';
        return;
      }

      const medals = ['🥇', '🥈', '🥉'];
      const rowsHtml = board
        .map(function (row, idx) {
          const rankIcon = medals[idx] || '#' + (idx + 1);
          return (
            '<tr>' +
            '<td style="font-weight:800;">' + rankIcon + ' ' + row.name + '</td>' +
            '<td style="color:#059669;font-weight:800;">' + row.wins + ' 胜</td>' +
            '<td>' + row.draws + ' 平 / ' + row.losses + ' 负</td>' +
            '<td>' + row.winRate + '%</td>' +
            '<td style="font-family:var(--font-mono);font-weight:700;">' + row.totalCorrect + ' 题</td>' +
            '</tr>'
          );
        })
        .join('');

      const recentHtml = history
        .slice(0, 6)
        .map(function (h) {
          const winTag =
            h.winner === 'A'
              ? '🏆 ' + h.nameA + ' 胜'
              : h.winner === 'B'
              ? '🏆 ' + h.nameB + ' 胜'
              : '🤝 平局';
          return (
            '<div class="history-item">' +
            '<span><strong>' + h.nameA + '</strong> (' + h.correctA + ') vs <strong>' + h.nameB + '</strong> (' + h.correctB + ')</span>' +
            '<span style="color:#4f46e5;font-weight:700;">' + winTag + ' · ' + h.rangeLabel + '</span>' +
            '</div>'
          );
        })
        .join('');

      leaderboardArea.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
        '<span style="font-weight:900;font-size:15px;">🏆 PK 历史战绩英雄榜</span>' +
        '<button type="button" id="btnClearPkRecords" class="icon-btn" style="font-size:11px;padding:4px 8px;">清空历史战绩</button>' +
        '</div>' +
        '<table class="leaderboard-table">' +
        '<thead><tr><th>选手</th><th>胜场</th><th>平/负</th><th>胜率</th><th>累计答对</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table>' +
        '<div style="margin-top:12px;font-weight:800;font-size:12px;color:#475569;">📜 最近对战记录</div>' +
        recentHtml;

      const clearBtn = document.getElementById('btnClearPkRecords');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          if (window.confirm('确定清空本地保存的所有 PK 历史战绩吗？')) {
            recordsSvc.clearPkRecords();
            renderLeaderboard();
          }
        });
      }
    }

    renderLeaderboard();

    function launchMatch(opts, onComplete) {
      clearTimers();
      externalFinishCallback = onComplete || null;
      shouldSaveToLeaderboard = opts.saveToLeaderboard !== false;
      matchHeaderPrefix = opts.headerPrefix || '';
      currentTournamentMatchId = opts.tournamentMatchId || null;

      match = root.SquaresEngine.createPkMatch({
        totalRounds: opts.totalRounds || 10,
        minN: opts.minN || 11,
        maxN: opts.maxN || 30,
        filterType: opts.filterType || 'all',
        mode: opts.mode || 'mixed',
        inputType: opts.inputType || 'keypad',
        ruleType: opts.ruleType || 'race',
        timeLimitSec: opts.timeLimitSec || 30,
      });

      const randomPair = root.SquaresRecords.pickRandomPair();
      match.players.A.name = (opts.nameA || '').trim() || randomPair[0];
      match.players.B.name =
        (opts.nameB || '').trim() ||
        (randomPair[1] !== match.players.A.name
          ? randomPair[1]
          : root.SquaresRecords.pickRandomMathematician(match.players.A.name));
      match.rangeLabel =
        opts.rangeLabel ||
        match.questions[0].n + '';

      if (!externalFinishCallback && resultArea) {
        resultArea.style.display = 'none';
      }
      overlayEl.classList.add('active');
      setupRound();
    }

    function startMatchFromUi() {
      const range = root.SquaresEngine.normalizeRange(
        minInput ? minInput.value : 11,
        maxInput ? maxInput.value : 30
      );
      if (minInput) minInput.value = String(range.minN);
      if (maxInput) maxInput.value = String(range.maxN);

      const filterType = filterSelect ? filterSelect.value : 'all';
      const parsed = parseMode(modeSelect.value);
      const totalRounds = Number(roundsSelect.value) || 10;
      const ruleType = ruleSelect.value || 'race';
      const timeLimitSec = Number(timeLimitSelect ? timeLimitSelect.value : 30) || 30;
      const rangeLabel =
        range.minN + '～' + range.maxN + (filterType === 'prime' ? '(质数)' : filterType === 'ending5' ? '(尾5)' : '');

      launchMatch({
        nameA: nameAInput ? nameAInput.value : '',
        nameB: nameBInput ? nameBInput.value : '',
        totalRounds: totalRounds,
        minN: range.minN,
        maxN: range.maxN,
        filterType: filterType,
        mode: parsed.mode,
        inputType: parsed.inputType,
        ruleType: ruleType,
        timeLimitSec: timeLimitSec,
        rangeLabel: rangeLabel,
        saveToLeaderboard: !saveRecordCheck || saveRecordCheck.checked,
      });
    }

    function setupRound() {
      clearTimers();
      persistActiveMatch();
      const q = match.questions[match.roundIndex];
      inputs = {
        A: root.SquaresEngine.createInputState(q.expectedDigits),
        B: root.SquaresEngine.createInputState(q.expectedDigits),
      };
      chosenOpts = { A: null, B: null };
      roundStartTime = Date.now();
      renderArena();
      updateCountdownBar();
      countdownInterval = window.setInterval(updateCountdownBar, 100);
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

      let statusText =
        match.ruleType === 'race'
          ? '⚡ 抢答比快！填满即锁死，不能反悔！'
          : '填满即锁死，不能反悔！';
      let statusCls = 'pk-status-line';
      if (sub) {
        if (sub.timedOut) {
          statusText = '⏰ 倒计时结束超时！正确答案：' + q.answer;
          statusCls += ' err';
        } else if (sub.correct) {
          statusText = '✅ 抢答正确！(' + (sub.timeMs / 1000).toFixed(1) + 's)';
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
              '<button type="button" class="key-btn' +
              (d === '0' ? ' key-zero' : '') +
              '" data-p="' +
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
        (playerKey === 'A' ? '🔵 ' + p.name : '🟠 ' + p.name) +
        '</span>' +
        '<span>对 ' +
        p.correct +
        ' · 错 ' +
        p.wrong +
        '</span>' +
        '</div>' +
        '<div class="pk-play-core">' +
        '<div class="pk-q-row">' +
        '<div class="pk-q-text">' +
        (q.promptHtml || q.promptMain) +
        '</div>' +
        slotsHtml +
        '</div>' +
        '<div class="' +
        statusCls +
        '">' +
        statusText +
        '</div>' +
        controlsHtml +
        '</div>';

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
      const prefix = matchHeaderPrefix ? matchHeaderPrefix + ' · ' : '⚔️ ';
      dividerTitleEl.textContent =
        prefix +
        '第 ' +
        (match.roundIndex + 1) +
        ' / ' +
        match.totalRounds +
        ' 局 · ' +
        (match.ruleType === 'race' ? '⚡比谁快' : '⚖️双计制');
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

    function scheduleNextRound() {
      if (countdownInterval) {
        window.clearInterval(countdownInterval);
        countdownInterval = null;
      }
      roundTimer = window.setTimeout(function () {
        const done = root.SquaresEngine.advancePkRound(match);
        if (done) {
          finishMatch();
        } else {
          setupRound();
        }
      }, 950);
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
        scheduleNextRound();
      }
    }

    function finishMatch() {
      clearTimers();
      clearSavedPkRaw();
      currentTournamentMatchId = null;
      overlayEl.classList.remove('active');
      if (root.SquaresApp && root.SquaresApp.refreshResumeBanner) {
        root.SquaresApp.refreshResumeBanner();
      }
      root.SquaresSound.win();

      const A = match.players.A;
      const B = match.players.B;
      let winnerKey = 'draw';
      let verdict = '🤝 势均力敌，平局！';
      if (A.correct > B.correct) {
        winnerKey = 'A';
        verdict = '🏆 🔵 ' + A.name + ' 获胜！';
      } else if (B.correct > A.correct) {
        winnerKey = 'B';
        verdict = '🏆 🟠 ' + B.name + ' 获胜！';
      } else if (A.correct > 0 && A.totalTimeMs !== B.totalTimeMs) {
        if (A.totalTimeMs < B.totalTimeMs) {
          winnerKey = 'A';
          verdict = '⚡ 同分速度险胜：🔵 ' + A.name + ' 获胜！';
        } else {
          winnerKey = 'B';
          verdict = '⚡ 同分速度险胜：🟠 ' + B.name + ' 获胜！';
        }
      }

      if (shouldSaveToLeaderboard) {
        recordsSvc.recordPkMatchResult({
          nameA: A.name,
          nameB: B.name,
          correctA: A.correct,
          wrongA: A.wrong,
          correctB: B.correct,
          wrongB: B.wrong,
          winner: winnerKey,
          rangeLabel: match.rangeLabel,
          totalRounds: match.totalRounds,
        });
        renderLeaderboard();
      }

      // 若由争霸联赛调用，直接交回联赛推进晋级图
      if (externalFinishCallback) {
        const cb = externalFinishCallback;
        externalFinishCallback = null;
        cb({
          scoreA: A.correct,
          scoreB: B.correct,
          winnerKey: winnerKey,
          A: A,
          B: B,
          verdict: verdict,
        });
        return;
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
        '<div style="font-weight:900;color:#2563eb;">🔵 ' + A.name + '</div>' +
        '<div style="font-size:22px;font-weight:900;margin:4px 0;">对 ' +
        A.correct +
        ' / 错 ' +
        A.wrong +
        '</div>' +
        '<div style="font-size:12px;color:#475569;">平均正确用时：' +
        avgA +
        '</div></div>' +
        '<div style="background:#fff7ed;border:2px solid #fdba74;border-radius:16px;padding:12px;">' +
        '<div style="font-weight:900;color:#ea580c;">🟠 ' + B.name + '</div>' +
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

      document.getElementById('btnPkRematch').addEventListener('click', startMatchFromUi);
    }

    function resumeSavedMatch(onComplete) {
      const savedPk = loadSavedPkRaw();
      if (!savedPk) return false;
      clearTimers();
      match = savedPk.match;
      // 恢复到被中断那一道题的起始状态，已完成的局数与得分 100% 保留
      match.roundSubmissions = {};
      match.roundWinner = null;
      match.roundTimedOut = false;
      shouldSaveToLeaderboard = savedPk.shouldSaveToLeaderboard !== false;
      matchHeaderPrefix = savedPk.matchHeaderPrefix || '';
      currentTournamentMatchId = savedPk.tournamentMatchId || null;
      externalFinishCallback = onComplete || null;
      if (!externalFinishCallback && resultArea) {
        resultArea.style.display = 'none';
      }
      overlayEl.classList.add('active');
      setupRound();
      return true;
    }

    startBtn.addEventListener('click', startMatchFromUi);
    exitBtn.addEventListener('click', function () {
      if (match && match.roundIndex < match.totalRounds) {
        if (!window.confirm('比赛正在进行中，确定退出当前对局吗？\n（提示：如果是误刷或想待会儿接着打，点“取消”即可留在本场）')) {
          return;
        }
      }
      clearTimers();
      clearSavedPkRaw();
      currentTournamentMatchId = null;
      externalFinishCallback = null;
      match = null;
      overlayEl.classList.remove('active');
      if (root.SquaresApp && root.SquaresApp.refreshResumeBanner) {
        root.SquaresApp.refreshResumeBanner();
      }
    });

    window.addEventListener('beforeunload', function (e) {
      if (overlayEl.classList.contains('active') && match && match.roundIndex < match.totalRounds) {
        persistActiveMatch();
        e.preventDefault();
        e.returnValue = '';
      }
    });

    root.SquaresPkGame.launchMatch = launchMatch;
    root.SquaresPkGame.getSavedMatch = loadSavedPkRaw;
    root.SquaresPkGame.resumeSavedMatch = resumeSavedMatch;
    root.SquaresPkGame.clearSavedMatch = function () {
      clearSavedPkRaw();
      if (root.SquaresApp && root.SquaresApp.refreshResumeBanner) {
        root.SquaresApp.refreshResumeBanner();
      }
    };
  }

  root.SquaresPkGame = {
    init: initPkGame,
    launchMatch: function () {},
    getSavedMatch: loadSavedPkRaw,
    resumeSavedMatch: function () { return false; },
    clearSavedMatch: clearSavedPkRaw,
  };
})(typeof self !== 'undefined' ? self : this);
