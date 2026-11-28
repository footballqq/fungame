(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SquaresTricks = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function pad2(num) {
    return num < 10 ? '0' + num : String(num);
  }

  /**
   * 针对任意 1~100 的整数 n，自动挑选最快心算绝技并生成分步拆解
   */
  function explainSquareTrick(n) {
    const num = Math.max(1, Math.min(100, parseInt(n, 10) || 1));
    const sq = num * num;

    if (num <= 10 || num % 10 === 0) {
      const head = Math.floor(num / 10);
      return {
        n: num,
        sq: sq,
        trickId: 'base10',
        trickName: num <= 10 ? '九九乘法口诀直出' : '整十数末尾补两个 0',
        steps:
          num <= 10
            ? [num + ' × ' + num + ' = ' + sq + '（口诀秒出）']
            : ['先算首位平方：' + head + '² = ' + head * head, '末尾直接补两个 0 → ' + sq],
      };
    }

    // 1. 尾数 5 秒杀法
    if (num % 10 === 5) {
      const a = Math.floor(num / 10);
      const head = a * (a + 1);
      return {
        n: num,
        sq: sq,
        trickId: 'ending5',
        trickName: '绝技 1 · 尾数 5 秒杀法',
        steps: [
          '十位是 ' + a + '，算“头 × (头 + 1)”：' + a + ' × ' + (a + 1) + ' = ' + head,
          '末尾直接拼接 25 → ' + head + '25 = ' + sq,
        ],
      };
    }

    // 2. 50 附近基准法（41~59）
    if (num >= 41 && num <= 59) {
      const d = num - 50;
      const absD = Math.abs(d);
      const front = 25 + d;
      const back = absD * absD;
      return {
        n: num,
        sq: sq,
        trickId: 'base50',
        trickName: '绝技 2 · 50 附近基准法',
        steps: [
          '看与 50 的差值：' + num + ' - 50 = ' + (d > 0 ? '+' + d : d),
          '前半部分用 25 加差值：25 ' + (d > 0 ? '+ ' + d : '- ' + absD) + ' = ' + front,
          '后半部分算差值平方（占两位）：' + absD + '² = ' + pad2(back) + ' → 拼起来得 ' + sq,
        ],
      };
    }

    // 3. 100 附近基准法（85~99）
    if (num >= 85 && num <= 99) {
      const d = 100 - num;
      const front = num - d;
      const back = d * d;
      return {
        n: num,
        sq: sq,
        trickId: 'base100',
        trickName: '绝技 3 · 100 附近基准法',
        steps: [
          '看离 100 差多少：100 - ' + num + ' = ' + d,
          '前半部分原数再减差：' + num + ' - ' + d + ' = ' + front + '（即 ' + front * 100 + '）',
          '加上差值平方 ' + d + '² = ' + back + ' → ' + front * 100 + ' + ' + back + ' = ' + sq,
        ],
      };
    }

    // 4. 尾数 1 或 9 相邻递推法
    if (num % 10 === 1) {
      const base = num - 1;
      const baseSq = base * base;
      return {
        n: num,
        sq: sq,
        trickId: 'near19',
        trickName: '绝技 5 · 尾数 1 递推秒杀法',
        steps: [
          '先算整十平方：' + base + '² = ' + baseSq,
          '加上两个相邻数之和（' + base + ' + ' + num + ' = ' + (base + num) + '）',
          baseSq + ' + ' + (base + num) + ' = ' + sq,
        ],
      };
    }
    if (num % 10 === 9) {
      const base = num + 1;
      const baseSq = base * base;
      return {
        n: num,
        sq: sq,
        trickId: 'near19',
        trickName: '绝技 5 · 尾数 9 倒推秒杀法',
        steps: [
          '先算整十平方：' + base + '² = ' + baseSq,
          '减去两个相邻数之和（' + base + ' + ' + num + ' = ' + (base + num) + '）',
          baseSq + ' - ' + (base + num) + ' = ' + sq,
        ],
      };
    }

    // 5. 平方差凑整法（通用神器：往最近整十数靠）
    const nearestTen = Math.round(num / 10) * 10;
    const diff = Math.abs(num - nearestTen);
    const other = num > nearestTen ? num + diff : num - diff;
    const prod = nearestTen * other;
    return {
      n: num,
      sq: sq,
      trickId: 'diffSquare',
      trickName: '绝技 4 · 平方差“凑整”神技',
      steps: [
        '往最近整十数 ' + nearestTen + ' 靠，差值 d = ' + diff,
        '一加一减变整十相乘：' + nearestTen + ' × ' + other + ' = ' + prod,
        '补回差值平方 ' + diff + '² = ' + diff * diff + ' → ' + prod + ' + ' + diff * diff + ' = ' + sq,
      ],
    };
  }

  /**
   * 3 秒闪电开平方（反算求根绝技）：给定底数 n (11~99)，演示如何从 n² 秒推出 n
   */
  function explainFastSqrt(n) {
    const num = Math.max(1, Math.min(100, parseInt(n, 10) || 1));
    const sq = num * num;
    if (num <= 10 || num === 100) {
      return {
        n: num,
        sq: sq,
        steps: ['√' + sq + ' = ' + num + '（基础必背数，一眼直出！）'],
      };
    }

    const leftGroup = Math.floor(sq / 100);
    const rightGroup = pad2(sq % 100);
    const tens = Math.floor(num / 10);
    const unit = num % 10;
    const lastDigit = sq % 10;

    if (lastDigit === 0 || lastDigit === 5) {
      return {
        n: num,
        sq: sq,
        steps: [
          '① 后两位划开：(' + leftGroup + ') | (' + rightGroup + ')',
          '② 比 ' + leftGroup + ' 小的最大平方是 ' + tens * tens + '（' + tens + '²），定十位 = ' + tens,
          '③ 末位是 ' + lastDigit + '，个位唯一确定为 ' + unit + ' → 秒出 ' + num + '！',
        ],
      };
    }

    const mirrorUnit = 10 - unit;
    const smallU = Math.min(unit, mirrorUnit);
    const bigU = Math.max(unit, mirrorUnit);
    const pivot = tens * (tens + 1);
    const pickBig = leftGroup >= pivot;

    return {
      n: num,
      sq: sq,
      steps: [
        '① 从右往左两位一分：(' + leftGroup + ') | (' + rightGroup + ')',
        '② 看左边 ' + leftGroup + '：不超过它的最大平方是 ' + tens * tens + '（' + tens + '²）→ 十位 = ' + tens,
        '③ 看末位 ' + lastDigit + '：个位只能是 ' + smallU + ' 或 ' + bigU + '（候选 ' + tens + smallU + ' 或 ' + tens + bigU + '）',
        '④ 算“十位 × (十位+1)”：' +
          tens +
          ' × ' +
          (tens + 1) +
          ' = ' +
          pivot +
          '。因为 ' +
          leftGroup +
          (pickBig ? ' ≥ ' : ' < ') +
          pivot +
          '，选' +
          (pickBig ? '大的 ' + bigU : '小的 ' + smallU) +
          ' → 秒杀 √' +
          sq +
          ' = ' +
          num +
          '！',
      ],
    };
  }

  const TRICK_CARDS = [
    {
      id: 'ending5',
      badge: '秒杀级 · 必学',
      title: '绝技 1 · 尾数 5 秒杀法',
      scope: '适用：15, 25, 35 … 95',
      mantra: '头 × (头 + 1) 写前面，后面直接接 25！',
      example: '35² → 3×4=12 接 25 = 1225；85² → 8×9=72 接 25 = 7225',
      principle: '(10a + 5)² = 100a(a+1) + 25',
      practice: { mode: 'forward', minN: 15, maxN: 95, filterType: 'ending5', label: '专练尾数 5' },
    },
    {
      id: 'base50',
      badge: '印度吠陀经典',
      title: '绝技 2 · 50 附近基准法',
      scope: '适用：40 ～ 60（21 个数通杀）',
      mantra: '前半算“25 ± 差”，后半写“差²”（占两位，不够补 0）！',
      example: '47²（差-3）→ 22 | 09 = 2209；54²（差+4）→ 29 | 16 = 2916',
      principle: '(50 ± d)² = 100(25 ± d) + d²',
      practice: { mode: 'forward', minN: 41, maxN: 59, filterType: 'all', label: '专练 41～59' },
    },
    {
      id: 'base100',
      badge: '高段位神器',
      title: '绝技 3 · 100 附近基准法',
      scope: '适用：85 ～ 99',
      mantra: '前半“原数 - 差”，后半接“差²”（超两位向左进位）！',
      example: '96²（差4）→ 92 | 16 = 9216；89²（差11）→ 7800 + 121 = 7921',
      principle: '(100 - d)² = 100(100 - 2d) + d²',
      practice: { mode: 'forward', minN: 85, maxN: 99, filterType: 'all', label: '专练 85～99' },
    },
    {
      id: 'diffSquare',
      badge: '全球通用王牌',
      title: '绝技 4 · 平方差“凑整”神技',
      scope: '适用：任意两位数（尤其 22, 32, 68, 73 等）',
      mantra: '一加一减凑整十，相乘再加上“差²”！',
      example: '32² → 30×34 + 2² = 1024；68² → 70×66 + 2² = 4624',
      principle: 'n² = (n - d)(n + d) + d²（由平方差 n² - d² = (n-d)(n+d) 移项得来）',
      practice: { mode: 'forward', minN: 21, maxN: 79, filterType: 'no-tens', label: '专练 21～79' },
    },
    {
      id: 'near19',
      badge: '邻数递推',
      title: '绝技 5 · 尾数 1 / 9 递推秒杀',
      scope: '适用：21, 31…91 与 19, 29…89',
      mantra: '比整十多 1 就加两数和；比整十少 1 就减两数和！',
      example: '61² = 3600 + (60+61) = 3721；79² = 6400 - (80+79) = 6241',
      principle: '(n ± 1)² = n² ± (n + (n ± 1))',
      practice: { mode: 'forward', minN: 19, maxN: 91, filterType: 'no-tens', label: '去单人实战' },
    },
    {
      id: 'duplex',
      badge: '万能三段式',
      title: '绝技 6 · 通用三段夹心法（a² | 2ab | b²）',
      scope: '适用：11 ～ 99 任意两位数',
      mantra: '头平方、尾平方，头尾乘积两倍放中间（满十左进位）！',
      example: '42² → 16 | 16 | 04 → 进位得 1764；23² → 4 | 12 | 9 = 529',
      principle: '(10a + b)² = 100a² + 20ab + b²',
      practice: { mode: 'forward', minN: 11, maxN: 99, filterType: 'prime', label: '专练质数平方' },
    },
    {
      id: 'mirror',
      badge: '背表减负 75%',
      title: '绝技 7 · 对称尾数规律（后两位完全一样！）',
      scope: '适用：n、50-n、50+n、100-n 四胞胎',
      mantra: '背熟 1～25 的平方后两位，就等于掌握了 1～100 全部后两位！',
      example: '13²=169、37²=1369、63²=3969、87²=7569 → 后两位全是 69！',
      principle: '(50 ± n)² 与 (100 - n)² 展开后只差 100 的整数倍',
      practice: { mode: 'choice-forward', minN: 11, maxN: 99, filterType: 'all', label: '挑战高迷惑选择题' },
    },
    {
      id: 'fastSqrt',
      badge: '反算求根外挂',
      title: '绝技 8 · 3 秒闪电开平方（反算必杀）',
      scope: '适用：所有 3～4 位完全平方数求平方根',
      mantra: '后两位划开 → 左边定十位 → 末位定二选一 → 用“十位×(十位+1)”比大小！',
      example: '√7744：77|44 → 十位8，个位2或8；8×9=72，77>72 选大的 → 88！',
      principle: '利用 (10a + 5)² = 100a(a+1) + 25 作为精准中界线一刀分大小！',
      practice: { mode: 'reverse', minN: 11, maxN: 99, filterType: 'all', label: '专练 3 秒开平方' },
    },
  ];

  function initTricksView(onPracticePreset) {
    const inputEl = document.getElementById('trickDemoInput');
    const randomBtn = document.getElementById('btnTrickRandom');
    const demoBox = document.getElementById('trickDemoResult');
    const cardsBox = document.getElementById('trickCardsGrid');
    if (!demoBox || !cardsBox) return;

    function renderDemo() {
      const val = parseInt(inputEl ? inputEl.value : '35', 10) || 35;
      const clamped = Math.max(1, Math.min(100, val));
      if (inputEl && String(clamped) !== inputEl.value) {
        inputEl.value = String(clamped);
      }

      const sqInfo = explainSquareTrick(clamped);
      const sqrtInfo = explainFastSqrt(clamped);

      demoBox.innerHTML =
        '<div class="trick-demo-grid">' +
        '<div class="trick-demo-pane">' +
        '<div class="trick-pane-tag">⚡ 正算推荐：' + sqInfo.trickName + '</div>' +
        '<div class="trick-pane-eq">' + sqInfo.n + '² = <span>' + sqInfo.sq + '</span></div>' +
        '<ol class="trick-step-list">' +
        sqInfo.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') +
        '</ol></div>' +
        '<div class="trick-demo-pane sqrt-pane">' +
        '<div class="trick-pane-tag">🔍 反算开方：3 秒闪电求根</div>' +
        '<div class="trick-pane-eq">' +
        (root.SquaresEngine && root.SquaresEngine.formatSqrtHtml
          ? root.SquaresEngine.formatSqrtHtml(sqrtInfo.sq)
          : '√' + sqrtInfo.sq) +
        ' = <span>' +
        sqrtInfo.n +
        '</span></div>' +
        '<ol class="trick-step-list">' +
        sqrtInfo.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') +
        '</ol></div></div>';
    }

    cardsBox.innerHTML = TRICK_CARDS.map(function (card) {
      return (
        '<div class="trick-card">' +
        '<div class="trick-card-top">' +
        '<h3>' + card.title + '</h3>' +
        '<span class="trick-badge">' + card.badge + '</span>' +
        '</div>' +
        '<div class="trick-scope">' + card.scope + '</div>' +
        '<div class="trick-mantra">💡 口诀：' + card.mantra + '</div>' +
        '<div class="trick-example"><strong>例子：</strong>' + card.example + '</div>' +
        '<div class="trick-principle">📐 原理：<code>' + card.principle + '</code></div>' +
        '<button type="button" class="btn btn-primary trick-go-btn" data-trick-id="' + card.id + '">🎯 ' + card.practice.label + ' →</button>' +
        '</div>'
      );
    }).join('');

    cardsBox.querySelectorAll('.trick-go-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-trick-id');
        const found = TRICK_CARDS.find(function (c) { return c.id === id; });
        if (found && onPracticePreset) {
          onPracticePreset(found.practice);
        }
      });
    });

    if (inputEl) inputEl.addEventListener('input', renderDemo);
    if (randomBtn) {
      randomBtn.addEventListener('click', function () {
        const randN = 11 + Math.floor(Math.random() * 89);
        if (inputEl) inputEl.value = String(randN);
        renderDemo();
      });
    }

    renderDemo();
  }

  return {
    TRICK_CARDS: TRICK_CARDS,
    explainSquareTrick: explainSquareTrick,
    explainFastSqrt: explainFastSqrt,
    init: initTricksView,
  };
});
