(function (root) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.view-panel');
    const muteBtn = document.getElementById('btnToggleMute');

    function switchTab(target) {
      tabButtons.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-tab') === target);
      });
      panels.forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + target);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
    root.SquaresTricks.init(function (preset) {
      switchTab('solo');
      root.SquaresSoloGame.applyPresetAndStart(preset);
    });
  });
})(typeof self !== 'undefined' ? self : this);
