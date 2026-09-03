/**
 * 第 11 讲：中国剩余定理（孙子定理与物不知数） (Chapter 11 Script)
 */
export const Chapter11Script = {
  sec_11_1: {
    title: "第 11 讲：中国剩余定理（孙子定理）",
    subtitle: "物不知数与多周期公倍构造",
    blocks: [
      {
        type: 'story',
        paragraphs: [
          '公元 4 世纪，中国古代数学名著《孙子算经》中记载了一道流传千古的谜题：“今有物不知其数，三三数之剩二，五五数之剩三，七七数之剩二，问物几何？”',
          '明代数学家程大位将其编成了一首妇孺皆知的朗朗歌诀：',
          '**“三人同行七十稀，五树梅花廿一枝，七子团圆正半月，除百零五便得知。”**',
          '这套闪耀着东方智慧的算法，在西方被正式命名为**中国剩余定理（Chinese Remainder Theorem, CRT）**！'
        ]
      },
      {
        type: 'dialogue',
        messages: [
          { role: 'sister', text: '妹妹，你知道歌诀里的 70, 21, 15 这三个神奇数字是怎么找出来的吗？' },
          { role: 'younger', text: '对呀！为什么对 3 取余要乘 70，对 5 取余要乘 21，对 7 取余要乘 15 呢？' },
          { role: 'sister', text: '我们来看 70：它必须能被 5 和 7 整除（\\( 5 \\times 7 = 35 \\) 的倍数），同时除以 3 余 1！' },
          { role: 'younger', text: '哇！35 除以 3 余 2，35 乘 2 等于 70，\\( 70 \\div 3 = 23 \\dots 1 \\)！' },
          { role: 'sister', text: '既然 70 除以 3 余 1，那 \\( 70 \\times 2 \\) 就除以 3 余 2，而且对 5 和 7 毫无影响（余 0）！这叫“独立通道构造法”！' }
        ]
      },
      {
        type: 'concept',
        color: 'green',
        title: '中国剩余定理（CRT）通解公式',
        content: [
          '设正整数 \\( m_1, m_2, \\dots, m_k \\) **两两互质**，记总模数 \\( M = m_1 \\cdot m_2 \\dots m_k \\)。',
          '对任意给定的同余方程组：',
          '\\[ \\begin{cases} x \\equiv r_1 \\pmod{m_1} \\\\ x \\equiv r_2 \\pmod{m_2} \\\\ \\dots \\\\ x \\equiv r_k \\pmod{m_k} \\end{cases} \\]',
          '令 \\( M_i = \\frac{M}{m_i} \\)，并求出逆元 \\( t_i \\) 满足 \\( M_i t_i \\equiv 1 \\pmod{m_i} \\)。',
          '则方程组在模 \\( M \\) 下有**唯一解**，构造通解公式为：',
          '\\[ x \\equiv \\sum_{i=1}^k r_i M_i t_i \\pmod M \\]'
        ]
      },
      {
        type: 'canvas',
        animId: 'anim_crt_gears'
      },
      {
        type: 'concept',
        color: 'orange',
        title: '孙子歌诀的神数解构',
        content: [
          '对于模组 \\( (3, 5, 7) \\)，总模数 \\( M = 3 \\times 5 \\times 7 = 105 \\)：',
          '1. **70 的来源**：\\( M_1 = 35 \\)，求 \\( 35t_1 \\equiv 1 \\pmod 3 \\implies 2t_1 \\equiv 1 \\implies t_1 = 2 \\)，故 \\( M_1 t_1 = 35 \\times 2 = 70 \\)；',
          '2. **21 的来源**：\\( M_2 = 21 \\)，求 \\( 21t_2 \\equiv 1 \\pmod 5 \\implies 1t_2 \\equiv 1 \\implies t_2 = 1 \\)，故 \\( M_2 t_2 = 21 \\times 1 = 21 \\)；',
          '3. **15 的来源**：\\( M_3 = 15 \\)，求 \\( 15t_3 \\equiv 1 \\pmod 7 \\implies 1t_3 \\equiv 1 \\implies t_3 = 1 \\)，故 \\( M_3 t_3 = 15 \\times 1 = 15 \\)；',
          '4. **除百零五**：最后对 \\( M = 105 \\) 取模得到最小正整数解！'
        ]
      },
      {
        type: 'concept',
        color: 'blue',
        title: '模数不互质时的拆分转化',
        content: [
          '当模数 \\( m_i, m_j \\) 不互质时（如模 4 与模 6），不能直接套用 CRT 公式！',
          '必须使用**素因子拆分法**（如将 \\( x \\equiv 5 \\pmod 6 \\) 拆为 \\( x \\equiv 5 \\equiv 1 \\pmod 2 \\) 与 \\( x \\equiv 5 \\equiv 2 \\pmod 3 \\)），',
          '检验高次幂相容性后重新合并！'
        ]
      },
      {
        type: 'example',
        id: 'eg_11_1',
        title: '【母题精析 1】经典“物不知数”孙子定理求解',
        difficulty: '★★',
        question: '一个整数除以 3 余 2，除以 5 余 3，除以 7 余 2，求满足条件的最小正整数。',
        guide: [
          { role: 'younger', text: '直接代入歌诀公式！\\( 2 \\times 70 + 3 \\times 21 + 2 \\times 15 \\)！' },
          { role: 'sister', text: '算一下这个总和：\\( 140 + 63 + 30 = 233 \\)！' },
          { role: 'younger', text: '然后除以 105 取余数：\\( 233 = 105 \\times 2 + 23 \\)！最小正整数是 23！' }
        ],
        solution: [
          '解题步骤：',
          '1. 列出同余方程组：',
          '   \\[ \\begin{cases} x \\equiv 2 \\pmod 3 \\\\ x \\equiv 3 \\pmod 5 \\\\ x \\equiv 2 \\pmod 7 \\end{cases} \\]',
          '2. 模数 3, 5, 7 两两互质，总模数 \\( M = 3 \\times 5 \\times 7 = 105 \\)。',
          '3. 构造各基数：',
          '   - \\( 70 \\equiv 1 \\pmod 3 \\)，且 \\( 70 \\equiv 0 \\pmod{5, 7} \\)',
          '   - \\( 21 \\equiv 1 \\pmod 5 \\)，且 \\( 21 \\equiv 0 \\pmod{3, 7} \\)',
          '   - \\( 15 \\equiv 1 \\pmod 7 \\)，且 \\( 15 \\equiv 0 \\pmod{3, 5} \\)',
          '4. 线性组合求特解：',
          '   \\[ x_0 = 2 \\times 70 + 3 \\times 21 + 2 \\times 15 = 140 + 63 + 30 = 233 \\]',
          '5. 对总模数 105 取模：',
          '   \\[ x \\equiv 233 \\pmod{105} \\implies x = 105k + 23 \\]',
          '6. 最小正整数解（当 \\( k = 0 \\) 时）为 \\( x = 23 \\)。',
          '答：满足条件的最小正整数是 23。'
        ],
        summary: '中国剩余定理的本质是“线性代数中的正交基底分解”在初等数论中的精巧实现。'
      },
      {
        type: 'example',
        id: 'eg_11_2',
        title: '【母题精析 2】韩信点兵与同余差额调整',
        difficulty: '★★☆',
        question: '韩信点兵：士兵 3 人一行余 2 人，5 人一行余 4 人，7 人一行余 6 人。已知这队士兵总人数在 300 到 400 之间，求这队士兵确切共有多少人？',
        guide: [
          { role: 'younger', text: '除以 3 余 2，除以 5 余 4，除以 7 余 6……咦！余数都比除数少 1！' },
          { role: 'sister', text: '太敏锐了！用负同余表示：\\( x \\equiv -1 \\pmod 3 \\), \\( x \\equiv -1 \\pmod 5 \\), \\( x \\equiv -1 \\pmod 7 \\)！' },
          { role: 'younger', text: '哇！所以 \\( x + 1 \\) 必须同时是 3、5、7 的公倍数！' }
        ],
        solution: [
          '解题步骤：',
          '1. 将题意转化为同余方程组：',
          '   \\[ \\begin{cases} x \\equiv 2 \\equiv -1 \\pmod 3 \\\\ x \\equiv 4 \\equiv -1 \\pmod 5 \\\\ x \\equiv 6 \\equiv -1 \\pmod 7 \\end{cases} \\]',
          '2. 转化思维（缺一模型）：每个方程都满足“缺 1 人即可整除”，即：',
          '   \\[ x + 1 \\equiv 0 \\pmod 3, \\quad x + 1 \\equiv 0 \\pmod 5, \\quad x + 1 \\equiv 0 \\pmod 7 \\]',
          '3. 故 \\( x + 1 \\) 必为 3, 5, 7 的公倍数：',
          '   \\[ x + 1 = k \\times [3, 5, 7] = 105k \\quad (k \\in \\mathbb{Z}^+) \\]',
          '4. 通解表达式为：\\( x = 105k - 1 \\)。',
          '5. 根据士兵人数范围 \\( 300 \\le x \\le 400 \\)：',
          '   - 当 \\( k = 3 \\) 时，\\( x = 105 \\times 3 - 1 = 315 - 1 = 314 \\)；',
          '   - 当 \\( k = 4 \\) 时，\\( x = 105 \\times 4 - 1 = 420 - 1 = 419 > 400 \\)（超出）。',
          '6. 验证：\\( 314 \\div 3 = 104 \\dots 2 \\)，\\( 314 \\div 5 = 62 \\dots 4 \\)，\\( 314 \\div 7 = 44 \\dots 6 \\)，完全符合。',
          '答：这队士兵共有 314 人。'
        ],
        summary: '遇到“余同加余，差同减差”，先用负同余或差额法直接求公倍数，速度远快于盲目套公式！'
      },
      {
        type: 'example',
        id: 'eg_11_3',
        title: '【母题精析 3】非两两互质同余方程组求解',
        difficulty: '★★★',
        question: '求解同余方程组：\\[ \\begin{cases} x \\equiv 3 \\pmod 4 \\\\ x \\equiv 5 \\pmod 6 \\\\ x \\equiv 2 \\pmod 9 \\end{cases} \\]',
        guide: [
          { role: 'younger', text: '模数是 4, 6, 9，它们两两不互质！不能直接用 CRT 公式！' },
          { role: 'sister', text: '我们把每个合数模拆成质数幂模：4 是 \\( 2^2 \\)，6 是 \\( 2 \\times 3 \\)，9 是 \\( 3^2 \\)！' },
          { role: 'younger', text: '\\( x \\equiv 3 \\pmod 4 \\implies x \\equiv 1 \\pmod 2 \\)；\\( x \\equiv 5 \\pmod 6 \\implies x \\equiv 1 \\pmod 2 \\) 且 \\( x \\equiv 2 \\pmod 3 \\)；\\( x \\equiv 2 \\pmod 9 \\implies x \\equiv 2 \\pmod 3 \\)！' },
          { role: 'sister', text: '完全相容！最后只要保留最高次质数幂：模 4 和模 9！' }
        ],
        solution: [
          '解题步骤：',
          '1. 【质数幂拆分与相容性检验】：',
          '   - (1) \\( x \\equiv 3 \\pmod 4 \\implies x \\equiv 3 \\pmod{2^2} \\)（推出 \\( x \\equiv 1 \\pmod 2 \\)）',
          '   - (2) \\( x \\equiv 5 \\pmod 6 \\iff \\begin{cases} x \\equiv 5 \\equiv 1 \\pmod 2 \\\\ x \\equiv 5 \\equiv 2 \\pmod 3 \\end{cases} \\)',
          '   - (3) \\( x \\equiv 2 \\pmod 9 \\implies x \\equiv 2 \\pmod{3^2} \\)（推出 \\( x \\equiv 2 \\pmod 3 \\)）',
          '2. 检查 2 的幂与 3 的幂各自的相容性：',
          '   - 关于模 2 及其幂：(1) 要求 \\( x \\equiv 3 \\pmod 4 \\)，(2) 要求 \\( x \\equiv 1 \\pmod 2 \\)。因为 \\( 3 \\equiv 1 \\pmod 2 \\)，两条件完全相容，保留最高幂：\\( x \\equiv 3 \\pmod 4 \\)。',
          '   - 关于模 3 及其幂：(2) 要求 \\( x \\equiv 2 \\pmod 3 \\)，(3) 要求 \\( x \\equiv 2 \\pmod 9 \\)。因为 \\( 2 \\equiv 2 \\pmod 3 \\)，两条件完全相容，保留最高幂：\\( x \\equiv 2 \\pmod 9 \\)。',
          '3. 简化为互质的标准两方程同余组：',
          '   \\[ \\begin{cases} x \\equiv 3 \\pmod 4 \\\\ x \\equiv 2 \\pmod 9 \\end{cases} \\]',
          '4. 因为 \\( \\gcd(4, 9) = 1 \\)，总模数 \\( M = 36 \\)：',
          '   - 由 \\( x = 9k + 2 \\equiv 3 \\pmod 4 \\implies 1k + 2 \\equiv 3 \\pmod 4 \\implies k \\equiv 1 \\pmod 4 \\)；',
          '   - 代入 \\( k = 1 \\) 得特解 \\( x = 9(1) + 2 = 11 \\)。',
          '5. 通解为 \\( x \\equiv 11 \\pmod{36} \\)。',
          '答：方程组的通解为 \\( x \\equiv 11 \\pmod{36} \\)。'
        ],
        summary: '非互质模方程组破题口诀：“化合为质（拆分为质数幂），验相容性（排查冲突），保最高幂（CRT互质求解）”。'
      },
      {
        type: 'quiz',
        quizIds: ['q_11_1', 'q_11_2']
      }
    ]
  }
};
