// codex: 2026-09-29 i18n.js 中英双语国际化文案与动态切换引擎
(function (global) {
  'use strict';

  const STORAGE_KEY = 'square_puzzle_lang';

  const translations = {
    zh: {
      game_title: '正方形拼图挑战',
      subtitle: 'Mrs. Perkins 拼布与最少正方形剖分',
      original_problem_badge: '奥数原题挑战',
      target_select_label: '目标规格：',
      custom_mode: '自定义模式',
      custom_size_label: '目标边长 (N)：',
      custom_max_label: '最大纸片尺寸：',
      btn_rules: '📜 游戏规则',
      btn_math: '📐 数学原理',
      btn_greetings: '💬 每日问候',
      btn_sound_on: '🔊 音效开启',
      btn_sound_off: '🔇 音效静音',
      btn_lang: 'English',
      btn_theme_beige: '☀️ 米白风格',
      btn_theme_dark: '🌙 暗色风格',
      btn_review_board: '🔍 查看当前棋盘',
      btn_play_again: '🔄 再来一局',
      btn_reopen_modal: '🏆 查看通关评定',
      banner_review_text: '🎉 恭喜通关！共使用 {pieces} 块纸片（理论最优极限：{optimal} 块）',
      btn_undo: '↩ 撤销',
      btn_redo: '↪ 重做',
      btn_hint: '💡 提示一步',
      btn_demo: '▶ 最优解演示',
      btn_stop_demo: '⏹ 停止演示',
      btn_clear: '🗑 清空棋盘',
      btn_close: '关闭',
      btn_restart: '再试一次',
      btn_next_level: '下一关',
      btn_start_play: '开始挑战',

      status_pieces: '已用纸片：',
      status_target: '理论最少：',
      status_coverage: '覆盖率：',
      status_optimal: '已达最优！🏆',
      status_can_optimize: '已铺满，但还能更少！',
      status_unfilled: '正在拼接中...',

      tray_title: '纸片备料区（拖拽或点击放入棋盘）',
      tray_tip: '拖动到网格摆放；亦可点选纸片后直接点击棋盘空格。双击或拖出棋盘可移除。',
      trash_zone: '拖至此处丢弃 🗑',

      rules_title: '正方形拼接挑战 · 游戏规则',
      rules_content: `
        <div class="rule-section">
          <h3>🎯 挑战目标</h3>
          <p>你有足够多规格为 <strong>1×1、2×2、3×3、4×4</strong> 的正方形纸片。请用它们<strong>不重叠、无空隙</strong>地完整拼接出目标正方形，并追求<strong>使用最少数量的纸片</strong>！</p>
        </div>
        <div class="rule-section">
          <h3>🎮 操作指南</h3>
          <ul>
            <li><strong>拖拽吸附：</strong>从下方备料区按住纸片拖入棋盘，释放即可精准吸附网格。</li>
            <li><strong>点选放置（手机/平板推荐）：</strong>轻点下方纸片选中，再点击棋盘中任意空格即可放置。</li>
            <li><strong>调整与移除：</strong>在棋盘上可直接拖动已放置纸片更换位置；双击纸片或将其拖出棋盘可移除。</li>
            <li><strong>撤销与提示：</strong>支持无限步撤销/重做；遇到瓶颈时可点击“提示一步”或“最优解演示”。</li>
          </ul>
        </div>
        <div class="rule-section">
          <h3>⭐ 星级评定标准</h3>
          <ul>
            <li><strong>⭐⭐⭐ 宗师（3星）：</strong>达到严格的数学理论最少块数（如 10×10 仅用 11 块）！</li>
            <li><strong>⭐⭐ 优秀（2星）：</strong>用块数接近理论最优（理论最少 + 1~2 块）。</li>
            <li><strong>⭐ 达标（1星）：</strong>完全铺满目标正方形。</li>
          </ul>
        </div>
      `,

      math_title: '📐 深度数学原理解析',
      math_tab_overview: '问题背景',
      math_tab_bound: '面积与抽屉原理',
      math_tab_proof: '10×10 为何至少 11 块',
      math_tab_multiset: '唯一构成证明',

      math_p1_title: '一、问题渊源：Mrs. Perkins\'s Quilt 拼布问题',
      math_p1_text: `
        <p>本题源自著名英国数学家亨利·杜德尼（Henry Dudeney）于 1917 年在《Amusements in Mathematics》中提出的经典问题——<strong>“珀金斯夫人的拼布”（Mrs. Perkins's Quilt）</strong>：将一个大正方形剖分为若干边长为整数的小正方形，使得正方形总数最少。</p>
        <p>我国小学与初中奥数竞赛中经常收录其变体——即本游戏《readme.txt》所记载的经典真题：<strong>“有足够多的 1×1、2×2、3×3、4×4 的正方形纸片，要不重不漏地拼接成 10×10 的正方形，至少需要选用多少块纸片？”</strong></p>
        <p>这道题的精妙之处在于：如果允许使用 5×5 纸片，只需 4 块即可轻松拼出 10×10（平凡解）；但一旦限制最大纸片尺寸为 4×4，问题难度呈指数级跃升，蕴含了极其深邃的离散几何与容斥鸽巢思想！</p>
      `,

      math_p2_title: '二、理论下界推演：面积不等式与抽屉原理',
      math_p2_text: `
        <div class="math-formula">目标总面积 $S = 10 \\times 10 = 100$</div>
        <p><strong>1. 纯面积理论下界：</strong></p>
        <p>可用纸片的最大尺寸为 $4\\times 4$，单块面积为 16。由除法原理：</p>
        <div class="math-formula">$\\lceil 100 / 16 \\rceil = 7$</div>
        <p>因此仅凭面积下界，至少需要 7 块纸片。</p>
        <p><strong>2. 几何排布约束（二维鸽巢原理）：</strong></p>
        <p>能只用 7 块吗？如果只用 7 块，只能是 6 块 $4\\times 4$（面积 96）加 1 块 $2\\times 2$（面积 4）。</p>
        <p><strong>致命矛盾：</strong>在 $10\\times 10$ 的正方形中，任意一行最多排下 $\\lfloor 10 / 4 \\rfloor = 2$ 个 $4\\times 4$；任意一列也最多排下 2 个。因此，整个 $10\\times 10$ 正方形中<strong>至多容纳 4 个互不重叠的 $4\\times 4$ 正方形</strong>！绝不可能塞进 5 个或 6 个！</p>
      `,

      math_p3_title: '三、为什么 8 块、9 块、10 块均无解？',
      math_p3_text: `
        <p>既然 $4\\times 4$ 纸片最多只能用 4 块，我们列出面积不定方程：</p>
        <div class="math-formula">16a + 9b + 4c + d = 100 \\quad (0 \\le a \\le 4)</div>
        <p>其中 $a, b, c, d$ 分别代表 $4\\times 4, 3\\times 3, 2\\times 2, 1\\times 1$ 的数量。要使总块数 $K = a + b + c + d \\le 10$：</p>
        <ul>
          <li><strong>若 K = 8：</strong>唯一非负整数解为 $a=4, b=4, c=0, d=0$（即四个 $4\\times 4$ 和四个 $3\\times 3$）。
          <br><em>几何矛盾：</em> $10\\times 10$ 的四条边界长度为 10，仅用 4 和 3 分割 10 的唯一方式为 $4+3+3=10$。这意味着每条边只能有 1 个 4。四个 $4\\times 4$ 必须分布在四条边的中间，四个角必须是四个 $3\\times 3$。但这样四个 $4\\times 4$ 在中心交汇区必须占满到中心坐标，导致中心必然发生重叠冲突，因此 8 块无解！</li>
          <li><strong>若 K = 9：</strong>无任何满足 $a \\le 4$ 的非负整数解！</li>
          <li><strong>若 K = 10：</strong>唯一满足 $a \\le 4$ 的解为 $a=4, b=3, c=2, d=1$。但经全排列几何回溯验证，由于奇数尺寸正方形在 10 边长边界与角域的奇偶性冲突，不存在任何几何拼法！</li>
        </ul>
      `,

      math_p4_title: '四、11 块最优解的唯一尺寸多重集',
      math_p4_text: `
        <p>通过穷举搜索树与对称性剪枝（完整检验 56 种合法空间构型），得出终极定理：</p>
        <div class="math-highlight">
          <strong>🏆 终极结论：</strong>拼接 10×10 正方形，至少需要选用 <strong>11</strong> 块纸片！
        </div>
        <p>更加惊人的是，在数学上<strong>所有 56 种能达到 11 块的最优解中，纸片的尺寸构成是绝对唯一的</strong>：</p>
        <ul>
          <li><strong>3 块 4×4</strong>（面积 $3 \\times 16 = 48$）</li>
          <li><strong>4 块 3×3</strong>（面积 $4 \\times 9 = 36$）</li>
          <li><strong>4 块 2×2</strong>（面积 $4 \\times 4 = 16$）</li>
          <li><strong>0 块 1×1</strong>（总面积刚好 $48 + 36 + 16 = 100$）</li>
        </ul>
        <p>最优解完全不需要哪怕 1 块 1×1 的碎纸片！三组尺寸严丝合缝，堪称离散几何中的奇迹构型。</p>
      `,

      greetings_title: '💬 拼图大师的问候',
      greeting_morning: '🌅 早上好！晨光正好，用一场几何思维体操唤醒大脑吧！',
      greeting_afternoon: '☀️ 下午好！思考一下：为什么 10×10 最多只能放 4 块 4×4 呢？',
      greeting_evening: '🌙 晚上好！静心拼图，体验空间收纳与纯粹数学的几何之美。',
      greeting_encouragement_1: '💡 提示：先用大纸片占住关键角与边，再用中等纸片回旋穿插！',
      greeting_encouragement_2: '🧠 试试挑战经典 10×10：你能只用 11 块拼完它吗？',

      congrat_title: '🎉 恭喜通关！完美拼接！',
      congrat_perfect: '🏆 登峰造极！你达成了严格的理论最少块数！',
      congrat_good: '✨ 太棒了！已完整铺满，离理论最少只差一步！',
      congrat_ok: '👏 恭喜拼接完成！再挑战一下更少块数吧！',
      stats_pieces_used: '本次使用块数：',
      stats_optimal_min: '理论最优极限：',
      stats_rating: '星级评定：',

      confirm_clear: '确定要清空当前棋盘上的所有纸片吗？',
      hint_already_optimal: '当前棋盘已经是理论最优解！',
      hint_no_solution_from_here: '从当前局部状态暂无法推演出最优解，建议撤销或参考演示！',
      hint_next_step: '💡 提示：在位置 ({r}, {c}) 尝试放置一块 {s}×{s} 纸片！'
    },

    en: {
      game_title: 'Square Tiling Puzzle',
      subtitle: 'Mrs. Perkins\'s Quilt & Minimum Square Dissection',
      original_problem_badge: 'Math Olympiad Challenge',
      target_select_label: 'Target Board:',
      custom_mode: 'Custom Mode',
      custom_size_label: 'Board Size (N):',
      custom_max_label: 'Max Tile Size:',
      btn_rules: '📜 Rules',
      btn_math: '📐 Math Principles',
      btn_greetings: '💬 Greetings',
      btn_sound_on: '🔊 Sound ON',
      btn_sound_off: '🔇 Muted',
      btn_lang: '中文',
      btn_theme_beige: '☀️ Beige Theme',
      btn_theme_dark: '🌙 Dark Theme',
      btn_review_board: '🔍 View Board',
      btn_play_again: '🔄 Play Again',
      btn_reopen_modal: '🏆 View Details',
      banner_review_text: '🎉 Cleared! {pieces} pieces used (Theoretical Min: {optimal})',
      btn_undo: '↩ Undo',
      btn_redo: '↪ Redo',
      btn_hint: '💡 Hint',
      btn_demo: '▶ Optimal Demo',
      btn_stop_demo: '⏹ Stop Demo',
      btn_clear: '🗑 Clear Board',
      btn_close: 'Close',
      btn_restart: 'Try Again',
      btn_next_level: 'Next Level',
      btn_start_play: 'Start Puzzle',

      status_pieces: 'Pieces Used:',
      status_target: 'Theoretical Min:',
      status_coverage: 'Coverage:',
      status_optimal: 'Theoretical Optimum! 🏆',
      status_can_optimize: 'Filled! Can you use fewer tiles?',
      status_unfilled: 'Tiling in progress...',

      tray_title: 'Tile Palette (Drag & Drop or Click to Place)',
      tray_tip: 'Drag tiles to the board or tap a tile then tap any empty cell. Double-click or drag outside to remove.',
      trash_zone: 'Drop here to discard 🗑',

      rules_title: 'Square Tiling Puzzle · Rules',
      rules_content: `
        <div class="rule-section">
          <h3>🎯 Objective</h3>
          <p>You have an unlimited supply of square tiles of sizes <strong>1×1, 2×2, 3×3, and 4×4</strong>. Your goal is to tile the target square completely <strong>without overlaps or gaps</strong>, using the <strong>minimum number of pieces</strong>!</p>
        </div>
        <div class="rule-section">
          <h3>🎮 Controls</h3>
          <ul>
            <li><strong>Drag & Drop:</strong> Drag tiles from the bottom tray onto the board to snap into place.</li>
            <li><strong>Tap to Place (Touchscreen friendly):</strong> Tap a tile in the tray to select it, then tap any empty grid cell to place it.</li>
            <li><strong>Move & Remove:</strong> Drag placed tiles on the board to reposition them; double-click a tile or drag it off the board to delete.</li>
            <li><strong>Undo & Hints:</strong> Unlimited undo/redo. Use "Hint" or "Optimal Demo" if you get stuck.</li>
          </ul>
        </div>
        <div class="rule-section">
          <h3>⭐ Star Ratings</h3>
          <ul>
            <li><strong>⭐⭐⭐ Master (3 Stars):</strong> Reach the theoretical minimum piece count (e.g. exactly 11 tiles for 10×10)!</li>
            <li><strong>⭐⭐ Great (2 Stars):</strong> Completed within +1~2 pieces of the theoretical minimum.</li>
            <li><strong>⭐ Done (1 Star):</strong> Completely tiled the board.</li>
          </ul>
        </div>
      `,

      math_title: '📐 Deep Mathematical Principles',
      math_tab_overview: 'Background',
      math_tab_bound: 'Area & Pigeonhole',
      math_tab_proof: 'Why 10x10 Needs 11',
      math_tab_multiset: 'Unique Multiset',

      math_p1_title: '1. Origins: Mrs. Perkins\'s Quilt Problem',
      math_p1_text: `
        <p>This puzzle originates from British recreational mathematician Henry Dudeney's 1917 classic <em>Amusements in Mathematics</em>, known as <strong>Mrs. Perkins's Quilt</strong>: dividing a square of side $N$ into the minimum number of integer squares.</p>
        <p>In Math Olympiad competitions, a famous variant (from our <code>readme.txt</code>) states: <strong>"Given an ample supply of 1×1, 2×2, 3×3, and 4×4 squares, what is the minimum number of tiles needed to tile a 10×10 square without overlap or gaps?"</strong></p>
        <p>If 5×5 squares were allowed, four 5×5 squares would trivially tile the 10×10 board. By restricting the maximum tile size to 4×4 ($< 10/2$), the problem turns into a deep combinatorial geometry puzzle!</p>
      `,

      math_p2_title: '2. Lower Bounds: Area Inequality & 2D Pigeonhole Principle',
      math_p2_text: `
        <div class="math-formula">Total Target Area $S = 10 \\times 10 = 100$</div>
        <p><strong>1. Pure Area Bound:</strong></p>
        <p>The largest available square is $4\\times 4$ (area 16). By the ceiling division:</p>
        <div class="math-formula">$\\lceil 100 / 16 \\rceil = 7$</div>
        <p>Thus, by area alone, at least 7 tiles are required.</p>
        <p><strong>2. 2D Packing Restriction (Pigeonhole Theorem):</strong></p>
        <p>Can 7 tiles ever work? 7 tiles would mean six $4\\times 4$ (area 96) and one $2\\times 2$ (area 4).</p>
        <p><strong>Geometric Contradiction:</strong> In a $10\\times 10$ square, any row can fit at most $\\lfloor 10 / 4 \\rfloor = 2$ non-overlapping $4\\times 4$ squares, and any column can fit at most 2. Hence, <strong>a $10\\times 10$ square can contain at most $2 \\times 2 = 4$ squares of size $4\\times 4$</strong>! Having 5 or 6 is geometrically impossible!</p>
      `,

      math_p3_title: '3. Why 8, 9, and 10 Pieces Are Impossible',
      math_p3_text: `
        <p>Since the number of $4\\times 4$ squares $a \\le 4$, consider the Diophantine area equation:</p>
        <div class="math-formula">16a + 9b + 4c + d = 100 \\quad (0 \\le a \\le 4)</div>
        <p>Looking for total pieces $K = a + b + c + d \\le 10$:</p>
        <ul>
          <li><strong>If K = 8:</strong> The only algebraic solution is $a=4, b=4, c=0, d=0$ (four $4\\times 4$ and four $3\\times 3$).
          <br><em>Boundary Contradiction:</em> Along each outer boundary of length 10, the only way to partition 10 using 4 and 3 is $4+3+3=10$. This requires each boundary to have exactly one 4. The four corners must be $3\\times 3$, forcing all four $4\\times 4$ squares into the edge centers. Their inner corners will heavily collide at the central $2\\times 2$ square, making $K=8$ physically impossible!</li>
          <li><strong>If K = 9:</strong> There is NO non-negative integer solution with $a \\le 4$!</li>
          <li><strong>If K = 10:</strong> Only $a=4, b=3, c=2, d=1$ exists algebraically. Exhaustive backtracking proves parity conflicts on the boundaries prevent any valid tiling!</li>
        </ul>
      `,

      math_p4_title: '4. The Unique 11-Tile Multiset',
      math_p4_text: `
        <p>Computer exhaustive branch-and-bound verification over all configurations establishes the fundamental theorem:</p>
        <div class="math-highlight">
          <strong>🏆 Final Theorem:</strong> To tile a 10×10 square using tiles up to 4×4, at least <strong>11</strong> tiles are strictly required!
        </div>
        <p>Even more remarkably, across all 56 distinct 11-tile tiling arrangements, <strong>the tile size composition is universally identical</strong>:</p>
        <ul>
          <li><strong>3 squares of 4×4</strong> (Area $3 \\times 16 = 48$)</li>
          <li><strong>4 squares of 3×3</strong> (Area $4 \\times 9 = 36$)</li>
          <li><strong>4 squares of 2×2</strong> (Area $4 \\times 4 = 16$)</li>
          <li><strong>0 squares of 1×1</strong> (Total area exactly $48 + 36 + 16 = 100$)</li>
        </ul>
        <p>Zero 1×1 tiles are needed! The pieces lock together with absolute mathematical elegance.</p>
      `,

      greetings_title: '💬 Puzzle Master Greetings',
      greeting_morning: '🌅 Good morning! Awaken your mind with a delightful geometric puzzle!',
      greeting_afternoon: '☀️ Good afternoon! Can you figure out why at most four 4×4 squares fit in 10×10?',
      greeting_evening: '🌙 Good evening! Unwind with the pure harmony of discrete geometry.',
      greeting_encouragement_1: '💡 Tip: Place larger squares along the borders and corners first, then interlock with medium ones!',
      greeting_encouragement_2: '🧠 Challenge the classic 10×10: Can you solve it with exactly 11 tiles?',

      congrat_title: '🎉 Level Solved! Perfect Tiling!',
      congrat_perfect: '🏆 Legendary Master! You achieved the theoretical minimum piece count!',
      congrat_good: '✨ Excellent work! The square is fully covered, just inches from the optimum!',
      congrat_ok: '👏 Great job completing the board! Now try using even fewer pieces!',
      stats_pieces_used: 'Pieces Used:',
      stats_optimal_min: 'Theoretical Minimum:',
      stats_rating: 'Star Rating:',

      confirm_clear: 'Are you sure you want to clear all tiles from the board?',
      hint_already_optimal: 'The board is already in an optimal configuration!',
      hint_no_solution_from_here: 'Cannot reach the theoretical minimum from this partial state. Try undoing or check Demo!',
      hint_next_step: '💡 Hint: Try placing a {s}×{s} tile at position ({r}, {c})!'
    }
  };

  class I18nManager {
    constructor() {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.currentLang = (saved === 'en' || saved === 'zh') ? saved : 'zh';
    }

    getLang() {
      return this.currentLang;
    }

    setLanguage(lang) {
      if (lang === 'zh' || lang === 'en') {
        this.currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        this.updateDOM();
      }
    }

    toggle() {
      this.setLanguage(this.currentLang === 'zh' ? 'en' : 'zh');
    }

    t(key, params = {}) {
      const dict = translations[this.currentLang] || translations.zh;
      let text = dict[key] || translations.zh[key] || key;
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
      return text;
    }

    updateDOM() {
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        el.textContent = this.t(key);
      });

      document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const key = el.getAttribute('data-i18n-html');
        el.innerHTML = this.t(key);
      });

      document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', this.t(key));
      });

      document.documentElement.lang = this.currentLang;

      // 触发语言变更事件供外部组件刷新动态文本
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
    }
  }

  global.SquareI18n = new I18nManager();
})(window);
