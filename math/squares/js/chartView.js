(function (root) {
  'use strict';

  const PRESETS = {
    '11-30': {
      min: 11,
      max: 30,
      title: '11² ～ 30² 完全平方数速背表（高频大字版）',
      subtitle: '小学奥数 / 速算必背核心 20 组 · 适合 A4 一页大字张贴',
      colsClass: 'cols-2-print',
      fontClass: 'size-xl',
    },
    '11-50': {
      min: 11,
      max: 50,
      title: '11² ～ 50² 完全平方数速背表（进阶一页版）',
      subtitle: '共 40 组完全平方数 · A4 黑白单页精美排版',
      colsClass: 'cols-4-print',
      fontClass: 'size-lg',
    },
    '11-100': {
      min: 11,
      max: 100,
      title: '11² ～ 100² 完全平方数完整表（大师版）',
      subtitle: '已略去 1²～10² 简单项 · 共 90 组 · A4 黑白清晰排版',
      colsClass: 'cols-5-print',
      fontClass: 'size-md',
    },
    '1-100': {
      min: 1,
      max: 100,
      title: '1² ～ 100² 完全平方数全览表',
      subtitle: '1～100 全量 100 组完全平方数',
      colsClass: 'cols-5-print',
      fontClass: 'size-md',
    },
  };

  function initChartView() {
    const presetSelect = document.getElementById('chartPresetSelect');
    const showTipsCheck = document.getElementById('chartShowTips');
    const printBtn = document.getElementById('btnPrintChart');
    const gridEl = document.getElementById('squaresPrintGrid');
    const titleEl = document.getElementById('printSheetTitle');
    const subEl = document.getElementById('printSheetSub');
    const tipsBox = document.getElementById('printMemoryTips');

    if (!presetSelect || !gridEl) return;

    function render() {
      const key = presetSelect.value || '11-50';
      const preset = PRESETS[key] || PRESETS['11-50'];
      const items = root.SquaresEngine.getSquaresInRange(preset.min, preset.max);

      titleEl.textContent = preset.title;
      subEl.textContent = preset.subtitle;
      gridEl.className = 'squares-grid ' + preset.colsClass + ' ' + preset.fontClass;

      // 按列纵向排布（阅读和背诵更顺眼：11,12,13... 往下读！）
      const html = items
        .map(function (item) {
          const isEnding5 = item.n % 10 === 5;
          const isEnding0 = item.n % 10 === 0;
          const tagClass = isEnding5 ? ' is-five' : isEnding0 ? ' is-ten' : '';
          return (
            '<div class="sq-item' +
            tagClass +
            '">' +
            '<span class="sq-base">' +
            item.n +
            '<sup>2</sup></span>' +
            '<span class="sq-eq">=</span>' +
            '<span class="sq-val">' +
            item.sq +
            '</span>' +
            '</div>'
          );
        })
        .join('');

      gridEl.innerHTML = html;

      if (tipsBox && showTipsCheck) {
        tipsBox.style.display = showTipsCheck.checked ? 'block' : 'none';
      }
    }

    presetSelect.addEventListener('change', render);
    if (showTipsCheck) showTipsCheck.addEventListener('change', render);
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    render();
  }

  root.SquaresChartView = { init: initChartView };
})(typeof self !== 'undefined' ? self : this);
