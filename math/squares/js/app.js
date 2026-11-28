(function (root) {
  'use strict';

  function isFullscreenActive() {
    return Boolean(
      document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
    );
  }

  function toggleFullscreen() {
    const doc = document;
    const el = doc.documentElement;
    if (isFullscreenActive()) {
      const exitFn = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
      if (exitFn) {
        Promise.resolve(exitFn.call(doc)).catch(function () {});
      }
      return;
    }
    const reqFn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (reqFn) {
      Promise.resolve(reqFn.call(el)).catch(function () {
        window.alert('当前浏览器限制自动全屏，可点击浏览器菜单 →「添加到主屏幕」以全屏无地址栏模式运行！');
      });
    } else {
      window.alert('当前浏览器（如部分 iOS Safari）不支持网页直接全屏，请点击分享按钮 →「添加到主屏幕」，即可全屏无地址栏防误触运行！');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.view-panel');
    const muteBtn = document.getElementById('btnToggleMute');
    const navFsBtn = document.getElementById('btnToggleFullscreen');
    const pkFsBtn = document.getElementById('btnPkFullscreen');
    const resumeBanner = document.getElementById('globalResumeBanner');

    function syncFullscreenButtons() {
      const active = isFullscreenActive();
      if (navFsBtn) {
        navFsBtn.textContent = active ? '✕ 退出全屏' : '⛶ 全屏';
        navFsBtn.classList.toggle('is-active', active);
      }
      if (pkFsBtn) {
        pkFsBtn.textContent = active ? '✕ 退全屏' : '⛶ 全屏';
        pkFsBtn.classList.toggle('is-active', active);
      }
    }

    if (navFsBtn) navFsBtn.addEventListener('click', toggleFullscreen);
    if (pkFsBtn) pkFsBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', syncFullscreenButtons);
    document.addEventListener('webkitfullscreenchange', syncFullscreenButtons);
    syncFullscreenButtons();

    function switchTab(target) {
      tabButtons.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-tab') === target);
      });
      panels.forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + target);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function refreshResumeBanner() {
      if (!resumeBanner) return;
      const tourSummary =
        root.SquaresTournamentView && root.SquaresTournamentView.getActiveSummary
          ? root.SquaresTournamentView.getActiveSummary()
          : null;
      const savedPk =
        root.SquaresPkGame && root.SquaresPkGame.getSavedMatch
          ? root.SquaresPkGame.getSavedMatch()
          : null;

      // 优先展示未完成的争霸赛（包含其中断在半路的小场 PK）
      if (tourSummary && !tourSummary.isCurrentlyOpen) {
        const hasMidMatch = Boolean(savedPk && savedPk.tournamentMatchId);
        const pkHint = hasMidMatch
          ? '（刚才正在打 ' +
            (savedPk.matchHeaderPrefix || '当前场') +
            ' 第 ' +
            (savedPk.match.roundIndex + 1) +
            '/' +
            savedPk.match.totalRounds +
            ' 局：' +
            savedPk.match.players.A.name +
            ' ' +
            savedPk.match.players.A.correct +
            ':' +
            savedPk.match.players.B.correct +
            ' ' +
            savedPk.match.players.B.name +
            '）'
          : '（下一场：' + tourSummary.nextMatchTitle + '）';

        resumeBanner.style.display = 'flex';
        resumeBanner.innerHTML =
          '<div class="resume-banner-info">' +
            '💾 发现未完成的争霸赛存档：<strong>' +
            tourSummary.playerCount +
            '人' +
            (tourSummary.format === 'elimination' ? '淘汰赛' : '循环赛') +
            '</strong> · 已完赛 ' +
            tourSummary.doneCount +
            '/' +
            tourSummary.totalCount +
            ' 场 ' +
            pkHint +
          '</div>' +
          '<div class="resume-banner-actions">' +
            (hasMidMatch
              ? '<button type="button" id="btnResumeTourMidPk" class="btn btn-primary" style="padding:8px 14px;font-size:13px;">⚡ 续打刚才那局</button>'
              : '') +
            '<button type="button" id="btnResumeTourStage" class="btn btn-amber" style="padding:8px 14px;font-size:13px;">🗺️ 恢复晋级图</button>' +
            '<button type="button" id="btnDiscardTourSave" class="icon-btn" style="font-size:12px;">🗑️ 放弃旧档</button>' +
          '</div>';

        const midBtn = document.getElementById('btnResumeTourMidPk');
        if (midBtn) {
          midBtn.addEventListener('click', function () {
            switchTab('tournament');
            root.SquaresTournamentView.resumeActiveTournament(true);
          });
        }
        const stageBtn = document.getElementById('btnResumeTourStage');
        if (stageBtn) {
          stageBtn.addEventListener('click', function () {
            switchTab('tournament');
            root.SquaresTournamentView.resumeActiveTournament(false);
          });
        }
        const discardBtn = document.getElementById('btnDiscardTourSave');
        if (discardBtn) {
          discardBtn.addEventListener('click', function () {
            if (window.confirm('确定放弃上次未打完的争霸赛存档吗？放弃后无法找回。')) {
              root.SquaresPkGame.clearSavedMatch();
              root.SquaresTournamentView.clearActiveTournament();
            }
          });
        }
        return;
      }

      // 其次展示普通的未完成双人 PK 对局
      if (savedPk && !savedPk.tournamentMatchId) {
        const m = savedPk.match;
        resumeBanner.style.display = 'flex';
        resumeBanner.innerHTML =
          '<div class="resume-banner-info">' +
            '💾 发现未打完的双人 PK 存档：<strong>' +
            m.players.A.name +
            ' ' +
            m.players.A.correct +
            ' : ' +
            m.players.B.correct +
            ' ' +
            m.players.B.name +
            '</strong>（停在第 ' +
            (m.roundIndex + 1) +
            ' / ' +
            m.totalRounds +
            ' 局）' +
          '</div>' +
          '<div class="resume-banner-actions">' +
            '<button type="button" id="btnResumeSoloPk" class="btn btn-primary" style="padding:8px 14px;font-size:13px;">▶ 立即读档续打</button>' +
            '<button type="button" id="btnDiscardPkSave" class="icon-btn" style="font-size:12px;">🗑️ 放弃旧档</button>' +
          '</div>';

        document.getElementById('btnResumeSoloPk').addEventListener('click', function () {
          switchTab('pk');
          root.SquaresPkGame.resumeSavedMatch(null);
          refreshResumeBanner();
        });
        document.getElementById('btnDiscardPkSave').addEventListener('click', function () {
          if (window.confirm('确定放弃上次未打完的双人 PK 存档吗？')) {
            root.SquaresPkGame.clearSavedMatch();
          }
        });
        return;
      }

      resumeBanner.style.display = 'none';
      resumeBanner.innerHTML = '';
    }

    root.SquaresApp = {
      switchTab: switchTab,
      refreshResumeBanner: refreshResumeBanner,
      toggleFullscreen: toggleFullscreen,
    };

    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        const muted = root.SquaresSound.toggleMute();
        muteBtn.textContent = muted ? '🔇 音效关' : '🔊 音效开';
      });
    }

    root.SquaresChartView.init();
    root.SquaresSoloGame.init();
    root.SquaresPkGame.init();
    root.SquaresTournamentView.init();
    root.SquaresTricks.init(function (preset) {
      switchTab('solo');
      root.SquaresSoloGame.applyPresetAndStart(preset);
    });

    refreshResumeBanner();
  });
})(typeof self !== 'undefined' ? self : this);
