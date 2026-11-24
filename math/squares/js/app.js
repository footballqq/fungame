(function (root) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.view-panel');
    const muteBtn = document.getElementById('btnToggleMute');

    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = btn.getAttribute('data-tab');
        tabButtons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        panels.forEach(function (p) {
          p.classList.toggle('active', p.id === 'panel-' + target);
        });
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
  });
})(typeof self !== 'undefined' ? self : this);
