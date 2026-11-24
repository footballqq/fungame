(function (root) {
  'use strict';

  const FILTER_LABELS = {
    all: '',
    prime: ' · 仅质数',
    ending5: ' · 仅尾数 5',
    'no-tens': ' · 已排除整十数',
  };

  function chooseLayoutByCount(count) {
    if (count <= 25) {
      return { colsClass: 'cols-2-print', fontClass: 'size-xl' };
    }
    if (count <= 52) {
      return { colsClass: 'cols-4-print', fontClass: 'size-lg' };
    }
    return { colsClass: 'cols-5-print', fontClass: 'size-md' };
  }

  function initChartView() {
    const presetSelect = document.getElementById('chartPresetSelect');
    const minInput = document.getElementById('chartMinInput');
    const maxInput = document.getElementById('chartMaxInput');
    const filterSelect = document.getElementById('chartFilterSelect');
    const showTipsCheck = document.getElementById('chartShowTips');
    const printBtn = document.getElementById('btnPrintChart');
    const gridEl = document.getElementById('squaresPrintGrid');
    const titleEl = document.getElementById('printSheetTitle');
    const subEl = document.getElementById('printSheetSub');
    const tipsBox = document.getElementById('printMemoryTips');

    if (!presetSelect || !gridEl) return;

    function syncInputsFromPreset() {
      const val = presetSelect.value;
      if (val && val !== 'custom') {
        const parts = val.split('-').map(Number);
        if (minInput) minInput.value = String(parts[0] || 11);
        if (maxInput) maxInput.value = String(parts[1] || 50);
      }
      render();
    }

    function onCustomInput() {
      presetSelect.value = 'custom';
      render();
    }

    function render() {
      const norm = root.SquaresEngine.normalizeRange(
        minInput ? minInput.value : 11,
        maxInput ? maxInput.value : 50
      );
      const filterType = filterSelect ? filterSelect.value : 'all';
      const items = root.SquaresEngine.getSquaresInRange(norm.minN, norm.maxN, filterType);
      const layout = chooseLayoutByCount(items.length);

      const filterSuffix = FILTER_LABELS[filterType] || '';
      titleEl.textContent = norm.minN + '² ～ ' + norm.maxN + '² 完全平方数速背表' + filterSuffix;
      subEl.textContent =
        '共 ' + items.length + ' 组完全平方数 · A4 黑白大字排版（可直接打印贴书桌）';

      gridEl.className = 'squares-grid ' + layout.colsClass + ' ' + layout.fontClass;

      if (items.length === 0) {
        gridEl.innerHTML =
          '<div style="grid-column:1/-1;text-align:center;padding:24px;color:#64748b;font-weight:700;">' +
          '当前范围 [' + norm.minN + '～' + norm.maxN + '] 下没有符合该筛选条件的数字，请放宽范围或切换筛选！' +
          '</div>';
      } else {
        gridEl.innerHTML = items
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
      }

      if (tipsBox && showTipsCheck) {
        tipsBox.style.display = showTipsCheck.checked ? 'block' : 'none';
      }
    }

    presetSelect.addEventListener('change', syncInputsFromPreset);
    if (minInput) minInput.addEventListener('change', onCustomInput);
    if (maxInput) maxInput.addEventListener('change', onCustomInput);
    if (filterSelect) filterSelect.addEventListener('change', render);
    if (showTipsCheck) showTipsCheck.addEventListener('change', render);
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    syncInputsFromPreset();
  }

  root.SquaresChartView = { init: initChartView };
})(typeof self !== 'undefined' ? self : this);
