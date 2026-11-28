(function (root) {
  'use strict';

  function parseMode(raw) {
    if (raw.startsWith('choice-')) {
      return { inputType: 'choice', mode: raw.replace('choice-', '') };
    }
    return { inputType: 'keypad', mode: raw };
  }

  function pickUniqueMathematicians(count) {
    const pool = root.SquaresRecords.MATHEMATICIANS.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(pool[i] || '选手' + (i + 1));
    }
    return list;
  }

  function initTournamentView() {
    const countInput = document.getElementById('tourPlayerCount');
    const formatSelect = document.getElementById('tourFormatSelect');
    const ruleSelect = document.getElementById('tourRuleSelect');
    const roundsSelect = document.getElementById('tourRoundsSelect');
    const modeSelect = document.getElementById('tourModeSelect');
    const rangeSelect = document.getElementById('tourRangeSelect');
    const minInput = document.getElementById('tourMinInput');
    const maxInput = document.getElementById('tourMaxInput');
    const filterSelect = document.getElementById('tourFilterSelect');
    const timeLimitSelect = document.getElementById('tourTimeLimitSelect');
    const randomFillBtn = document.getElementById('btnTourRandomNames');
    const rosterGrid = document.getElementById('tourRosterGrid');
    const createBtn = document.getElementById('btnTourCreate');

    const setupBox = document.getElementById('tourSetupBox');
    const stageBox = document.getElementById('tourStageBox');
    const archiveBox = document.getElementById('tourArchiveBox');

    if (!rosterGrid || !createBtn) return;

    if (rangeSelect) {
      rangeSelect.addEventListener('change', function () {
        if (rangeSelect.value !== 'custom') {
          const parts = rangeSelect.value.split('-').map(Number);
          if (minInput) minInput.value = String(parts[0] || 11);
          if (maxInput) maxInput.value = String(parts[1] || 30);
        }
      });
    }
    if (minInput && rangeSelect) {
      minInput.addEventListener('change', function () { rangeSelect.value = 'custom'; });
    }
    if (maxInput && rangeSelect) {
      maxInput.addEventListener('change', function () { rangeSelect.value = 'custom'; });
    }

    const store = root.SquaresTournamentEngine.createTournamentStore();
    let currentTour = null;
    let lastMatchNotice = '';

    function renderRosterInputs(preserveExisting) {
      const count = Math.max(3, Math.min(16, parseInt(countInput.value, 10) || 8));
      countInput.value = String(count);

      // 根据人数自动设置对称阵型列数（4人->2x2，5-6人->3x2，7+人->4列矩阵）
      const formationClass = count <= 4 ? 'formation-2' : count <= 6 ? 'formation-3' : 'formation-4';
      rosterGrid.className = 'player-roster-grid ' + formationClass;

      const oldValues = [];
      if (preserveExisting) {
        rosterGrid.querySelectorAll('input').forEach(function (inp) {
          oldValues.push(inp.value.trim());
        });
      }

      // 严格去重，彻底避免新增人数时出现重名数学家（如两个“费马”）
      const used = new Set();
      const shuffledPool = pickUniqueMathematicians(Math.max(count, 14));
      let poolCursor = 0;

      function nextUnusedName(fallbackIdx) {
        while (poolCursor < shuffledPool.length) {
          const cand = shuffledPool[poolCursor++];
          if (!used.has(cand)) return cand;
        }
        return '选手' + (fallbackIdx + 1);
      }

      const html = [];
      for (let i = 0; i < count; i++) {
        let val = '';
        if (preserveExisting && oldValues[i] && !used.has(oldValues[i])) {
          val = oldValues[i];
        } else {
          val = nextUnusedName(i);
        }
        used.add(val);
        html.push(
          '<div class="roster-item">' +
            '<span class="roster-idx">' + (i + 1) + '</span>' +
            '<input type="text" maxlength="10" value="' + val + '" placeholder="选手' + (i + 1) + '" />' +
          '</div>'
        );
      }
      rosterGrid.innerHTML = html.join('');
    }

    function startTournament() {
      const names = [];
      rosterGrid.querySelectorAll('input').forEach(function (inp, idx) {
        const v = inp.value.trim() || '选手' + (idx + 1);
        names.push(v);
      });

      const norm = root.SquaresEngine.normalizeRange(minInput.value, maxInput.value);
      minInput.value = String(norm.minN);
      maxInput.value = String(norm.maxN);

      const parsed = parseMode(modeSelect.value);
      const filterType = filterSelect.value || 'all';
      const config = {
        totalRounds: Number(roundsSelect.value) || 10,
        minN: norm.minN,
        maxN: norm.maxN,
        filterType: filterType,
        mode: parsed.mode,
        inputType: parsed.inputType,
        ruleType: ruleSelect ? ruleSelect.value : 'race',
        timeLimitSec: Number(timeLimitSelect.value) || 30,
        rangeLabel:
          norm.minN + '～' + norm.maxN + (filterType === 'prime' ? '(质数)' : filterType === 'ending5' ? '(尾5)' : ''),
      };

      const fmt = formatSelect.value || 'elimination';
      currentTour =
        fmt === 'round-robin'
          ? root.SquaresTournamentEngine.createRoundRobinTournament(names, config)
          : root.SquaresTournamentEngine.createEliminationTournament(names, config);

      lastMatchNotice = '';
      setupBox.style.display = 'none';
      stageBox.style.display = 'block';
      renderStage();
    }

    function playTournamentMatch(match) {
      if (!currentTour || !match || match.status !== 'ready') return;
      const cfg = currentTour.config;

      root.SquaresPkGame.launchMatch(
        {
          nameA: match.playerA,
          nameB: match.playerB,
          totalRounds: cfg.totalRounds,
          minN: cfg.minN,
          maxN: cfg.maxN,
          filterType: cfg.filterType,
          mode: cfg.mode,
          inputType: cfg.inputType,
          ruleType: cfg.ruleType,
          timeLimitSec: cfg.timeLimitSec,
          rangeLabel: cfg.rangeLabel,
          headerPrefix: match.roundTitle,
          saveToLeaderboard: true,
        },
        function (res) {
          // 淘汰赛若极端 0:0 或完全同毫秒平局，默认 A 晋级或提示；有得分差/时间差已由 winnerKey 裁决
          const side = res.winnerKey === 'draw' && currentTour.format === 'elimination' ? 'A' : res.winnerKey;
          root.SquaresTournamentEngine.recordTournamentMatchResult(
            currentTour,
            match.id,
            res.scoreA,
            res.scoreB,
            side
          );

          lastMatchNotice =
            '上一场（' +
            match.roundTitle +
            '）：' +
            match.playerA +
            ' ' +
            res.scoreA +
            ' : ' +
            res.scoreB +
            ' ' +
            match.playerB +
            ' → ' +
            (match.winner ? '🏆 ' + match.winner + ' 晋级！' : '🤝 握手言和！');

          if (currentTour.status === 'finished') {
            store.saveFinishedTournament(currentTour);
            renderArchive();
          }
          renderStage();
        }
      );
    }

    function renderBracketHtml() {
      const cols = currentTour.rounds.map(function (round) {
        const cards = round.matches
          .map(function (m) {
            let cls = 'bracket-match-card';
            if (m.isBye) cls += ' is-bye';
            else if (m.status === 'ready') cls += ' is-ready';
            else if (m.status === 'done') cls += ' is-done';

            const nameA = m.playerA || '待定';
            const nameB = m.isBye ? '（轮空自动晋级）' : m.playerB || '待定';
            const winA = m.winner && m.winner === m.playerA ? ' is-winner' : '';
            const winB = m.winner && m.winner === m.playerB ? ' is-winner' : '';
            const scoreA = m.status === 'done' && !m.isBye ? m.scoreA : '';
            const scoreB = m.status === 'done' && !m.isBye ? m.scoreB : '';
            const tag =
              m.status === 'ready'
                ? '<div style="text-align:center;font-size:11px;color:#d97706;font-weight:800;margin-top:4px;">⚡ 点击开打</div>'
                : '';

            return (
              '<div class="' + cls + '" data-match-id="' + m.id + '">' +
                '<div class="bracket-slot' + winA + '"><span>' + nameA + '</span><span>' + scoreA + '</span></div>' +
                '<div class="bracket-slot' + winB + '"><span>' + nameB + '</span><span>' + scoreB + '</span></div>' +
                tag +
              '</div>'
            );
          })
          .join('');

        return (
          '<div class="bracket-round">' +
            '<div class="bracket-round-title">' + round.title + '</div>' +
            cards +
          '</div>'
        );
      });

      return (
        '<div style="margin-top:14px;">' +
          '<div style="font-weight:900;font-size:15px;margin-bottom:10px;">🗺️ 晋级对阵图（点击高亮待打场次可直接开赛）</div>' +
          '<div class="bracket-scroll"><div class="bracket-columns">' + cols.join('') + '</div></div>' +
        '</div>'
      );
    }

    function renderRoundRobinHtml() {
      const standings = root.SquaresTournamentEngine.computeRoundRobinStandings(currentTour);
      const medals = ['🥇', '🥈', '🥉'];
      const rows = standings
        .map(function (s, idx) {
          return (
            '<tr>' +
            '<td style="font-weight:800;">' + (medals[idx] || '#' + (idx + 1)) + ' ' + s.name + '</td>' +
            '<td style="color:#4f46e5;font-weight:900;">' + s.points + ' 分</td>' +
            '<td>' + s.wins + '胜 ' + s.draws + '平 ' + s.losses + '负</td>' +
            '<td>' + s.scoreFor + ' 题</td>' +
            '</tr>'
          );
        })
        .join('');

      const schedule = currentTour.rounds[0].matches
        .map(function (m) {
          const badge =
            m.status === 'done'
              ? '<span style="color:#059669;font-weight:800;">' + m.scoreA + ' : ' + m.scoreB + '</span>'
              : '<button type="button" class="btn btn-amber" data-match-id="' + m.id + '" style="padding:4px 10px;font-size:12px;">开打</button>';
          return (
            '<div class="history-item">' +
            '<span><strong>' + m.roundTitle + '</strong>：🔵 ' + m.playerA + ' VS 🟠 ' + m.playerB + '</span>' +
            badge +
            '</div>'
          );
        })
        .join('');

      return (
        '<div style="margin-top:14px;">' +
          '<div style="font-weight:900;font-size:15px;margin-bottom:8px;">📊 循环赛实时积分榜</div>' +
          '<table class="leaderboard-table">' +
          '<thead><tr><th>选手</th><th>积分</th><th>胜/平/负</th><th>总答对</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table>' +
          '<div style="font-weight:900;font-size:14px;margin:14px 0 6px;">📅 全部赛程</div>' +
          schedule +
        '</div>'
      );
    }

    function renderStage() {
      if (!currentTour) return;
      const nextMatch = root.SquaresTournamentEngine.getNextReadyMatch(currentTour);

      let topCardHtml = '';
      if (currentTour.status === 'finished') {
        topCardHtml =
          '<div class="champion-banner">' +
            '<div style="font-size:13px;font-weight:800;color:#b45309;">🎉 本届争霸赛圆满收官！赛事记录已自动存档</div>' +
            '<h2 style="margin:8px 0;font-size:28px;color:#0f172a;">👑 总冠军：' + currentTour.champion + '</h2>' +
            '<div style="font-size:18px;font-weight:800;color:#475569;">🥈 亚军：' + currentTour.runnerUp + '</div>' +
            '<div style="margin-top:14px;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">' +
              '<button type="button" id="btnTourNewGame" class="btn btn-primary">🏆 举办下一届比赛</button>' +
            '</div>' +
          '</div>';
      } else if (nextMatch) {
        topCardHtml =
          '<div class="call-stage-card">' +
            '<div style="font-size:13px;font-weight:800;color:#4338ca;">📢 叫号上台 · ' + nextMatch.roundTitle + '</div>' +
            '<div class="call-vs-row">' +
              '<span class="call-player-pill a">🔵 ' + nextMatch.playerA + '（下方）</span>' +
              '<span style="font-size:20px;font-weight:900;color:#64748b;">VS</span>' +
              '<span class="call-player-pill b">🟠 ' + nextMatch.playerB + '（上方180°）</span>' +
            '</div>' +
            '<div style="font-size:12px;color:#475569;margin-bottom:12px;">请两位小朋友坐好位置，确认准备就绪后再点击开始！</div>' +
            '<button type="button" id="btnTourCallStart" class="btn btn-primary" style="padding:12px 26px;font-size:16px;">✅ 双方已到位，开始本场 PK！</button>' +
          '</div>';
      }

      const noticeHtml = lastMatchNotice
        ? '<div style="background:#f0fdf4;border:1px solid #86efac;color:#166534;padding:10px 14px;border-radius:12px;font-size:13px;font-weight:800;margin-bottom:14px;">' +
          lastMatchNotice +
          '</div>'
        : '';

      const bodyHtml =
        currentTour.format === 'elimination' ? renderBracketHtml() : renderRoundRobinHtml();

      stageBox.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px;">' +
          '<div style="font-weight:900;font-size:16px;">🏆 ' +
          (currentTour.format === 'elimination' ? '单败淘汰争霸赛' : '单循环积分赛') +
          '（' + currentTour.players.length + '人 · ' + currentTour.config.rangeLabel + ' · ' + currentTour.config.totalRounds + '局/场 · 限时' + currentTour.config.timeLimitSec + '秒）</div>' +
          '<button type="button" id="btnTourAbort" class="icon-btn">↩️ 重新报名抽签</button>' +
        '</div>' +
        noticeHtml +
        topCardHtml +
        bodyHtml;

      const callBtn = document.getElementById('btnTourCallStart');
      if (callBtn && nextMatch) {
        callBtn.addEventListener('click', function () {
          playTournamentMatch(nextMatch);
        });
      }

      const newBtn = document.getElementById('btnTourNewGame');
      if (newBtn) {
        newBtn.addEventListener('click', function () {
          currentTour = null;
          stageBox.style.display = 'none';
          setupBox.style.display = 'block';
        });
      }

      const abortBtn = document.getElementById('btnTourAbort');
      if (abortBtn) {
        abortBtn.addEventListener('click', function () {
          if (currentTour.status === 'finished' || window.confirm('确定放弃当前赛事并返回重新报名抽签吗？')) {
            currentTour = null;
            stageBox.style.display = 'none';
            setupBox.style.display = 'block';
          }
        });
      }

      // 支持直接点击晋级图或赛程表中任意 ready 场次开打
      stageBox.querySelectorAll('[data-match-id]').forEach(function (el) {
        el.addEventListener('click', function () {
          const id = el.getAttribute('data-match-id');
          for (const r of currentTour.rounds) {
            const found = r.matches.find(function (m) { return m.id === id; });
            if (found && found.status === 'ready') {
              playTournamentMatch(found);
              return;
            }
          }
        });
      });
    }

    function renderArchive() {
      if (!archiveBox) return;
      const archive = store.loadArchive();
      if (!archive.items || archive.items.length === 0) {
        archiveBox.innerHTML =
          '<div style="font-weight:900;font-size:15px;">📜 历届争霸赛档案</div>' +
          '<p style="margin:6px 0 0;font-size:12px;color:#64748b;">还没有已完赛的锦标赛记录。组织一场 4 人或 8 人争霸赛，决出冠军后自动永久存档！</p>';
        return;
      }

      const itemsHtml = archive.items
        .map(function (item) {
          const dateStr = new Date(item.finishedAt).toLocaleString('zh-CN');
          const matchesHtml = item.matches
            .map(function (m) {
              return (
                '<div style="font-size:12px;color:#475569;padding:2px 0;">' +
                '[' + m.roundTitle + '] ' + m.playerA + ' ' + m.scoreA + ' : ' + m.scoreB + ' ' + m.playerB +
                (m.winner ? '（胜：' + m.winner + '）' : '') +
                '</div>'
              );
            })
            .join('');

          return (
            '<details class="history-item" style="display:block;padding:10px 12px;">' +
              '<summary style="cursor:pointer;font-weight:800;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">' +
                '<span>🏅 第 ' + item.edition + ' 届（' + (item.format === 'elimination' ? '淘汰赛' : '循环赛') + ' · ' + item.playerCount + '人 · ' + item.rangeLabel + '）</span>' +
                '<span style="color:#d97706;">👑 冠军：' + item.champion + ' ｜ 🥈 亚军：' + item.runnerUp + '</span>' +
              '</summary>' +
              '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;">' +
                '<div style="font-size:11px;color:#64748b;margin-bottom:4px;">完赛时间：' + dateStr + '</div>' +
                matchesHtml +
              '</div>' +
            '</details>'
          );
        })
        .join('');

      archiveBox.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<span style="font-weight:900;font-size:15px;">📜 历届争霸赛荣誉档案（点击展开每场比分）</span>' +
          '<button type="button" id="btnClearTourArchive" class="icon-btn" style="font-size:11px;padding:4px 8px;">清空赛事档案</button>' +
        '</div>' +
        itemsHtml;

      const clearBtn = document.getElementById('btnClearTourArchive');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          if (window.confirm('确定清空本地保存的历届争霸赛档案吗？')) {
            store.clearArchive();
            renderArchive();
          }
        });
      }
    }

    countInput.addEventListener('change', function () {
      renderRosterInputs(true);
    });
    if (randomFillBtn) {
      randomFillBtn.addEventListener('click', function () {
        renderRosterInputs(false);
      });
    }
    document.querySelectorAll('[data-quick-count]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        countInput.value = btn.getAttribute('data-quick-count');
        renderRosterInputs(true);
      });
    });
    createBtn.addEventListener('click', startTournament);

    renderRosterInputs(false);
    renderArchive();
  }

  root.SquaresTournamentView = { init: initTournamentView };
})(typeof self !== 'undefined' ? self : this);
