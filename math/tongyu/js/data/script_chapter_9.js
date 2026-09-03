/**
 * 第 9 讲：威尔逊定理与阶乘同余 (Chapter 9 Script)
 */
export const Chapter9Script = {
  sec_9_1: {
    title: "第 9 讲：威尔逊定理与阶乘同余",
    subtitle: "模逆元两两配对的魔法",
    blocks: [
      {
        type: 'story',
        paragraphs: [
          '如果说费马小定理研究的是同一个数的“乘方幂次”，那么**威尔逊定理（Wilson\'s Theorem）**研究的就是所有不同数的“阶乘大连乘”。',
          '英国学者约翰·威尔逊（John Wilson）观察到：将素数 \\( p \\) 前面的所有正整数乘在一起，其阶乘 \\( (p-1)! \\) 除以 \\( p \\) 的余数永远等于 \\( p-1 \\)（即同余 \\( -1 \\)）。',
          '数学大师拉格朗日（Lagrange）用一种极其优美的代数机制证明了它：**模反元素（模逆元）两两配对相消**！'
        ]
      },
      {
        type: 'dialogue',
        messages: [
          { role: 'sister', text: '妹妹，我们来看模 7 的世界。1 到 6 的连乘是 \\( 1 \\times 2 \\times 3 \\times 4 \\times 5 \\times 6 \\)。' },
          { role: 'younger', text: '算出来是 720，\\( 720 \\div 7 = 102 \\dots 6 \\)！余数是 6，也就是 -1！' },
          { role: 'sister', text: '我们不硬算 720，来看看中间这几个数相乘模 7：\\( 2 \\times 4 = 8 \\equiv 1 \\)，\\( 3 \\times 5 = 15 \\equiv 1 \\)！' },
          { role: 'younger', text: '哇！2 和 4 是一对好朋友，3 和 5 是一对好朋友，它们相乘全变成了 1！' },
          { role: 'sister', text: '没错！中间的数全配对消成 1 了，只剩下开头的 1 和结尾的 6（即 -1），所以乘积永远是 -1！' }
        ]
      },
      {
        type: 'concept',
        color: 'green',
        title: '威尔逊定理（Wilson\'s Theorem）',
        content: [
          '1. **定理内容**：整数 \\( p > 1 \\) 是**素数**的**充分必要条件**是：',
          '\\[ (p - 1)! \\equiv -1 \\pmod p \\]',
          '2. **等价形式**：\\( (p - 1)! + 1 \\equiv 0 \\pmod p \\)（即 \\( p \\mid ((p-1)! + 1) \\)）。',
          '（这是初等数论中为数不多的能将“素数的充要条件”写成纯代数恒等式的绝世定理！）'
        ]
      },
      {
        type: 'canvas',
        animId: 'anim_congruence_calc'
      },
      {
        type: 'concept',
        color: 'orange',
        title: '模逆元（Modular Inverse）配对思想',
        content: [
          '对素数模 \\( p \\)，若 \\( x \\cdot y \\equiv 1 \\pmod p \\)，则称 \\( y \\) 是 \\( x \\) 的模逆元。',
          '在 \\( 1, 2, \\dots, p-1 \\) 中：',
          '1. **自己是自己逆元**的数满足 \\( x^2 \\equiv 1 \\pmod p \\implies p \\mid (x-1)(x+1) \\)，只有 \\( x = 1 \\) 和 \\( x = p-1 \\)；',
          '2. 其余 \\( p-3 \\) 个数（\\( 2, 3, \\dots, p-2 \\)）两两配对，每对乘积模 \\( p \\) 都等于 1！'
        ]
      },
      {
        type: 'concept',
        color: 'blue',
        title: '合数阶乘的余数命运',
        content: [
          '若 \\( n > 4 \\) 是合数，则 \\( (n-1)! \\equiv 0 \\pmod n \\)！',
          '因为合数 \\( n = a \\cdot b \\)（\\( 1 < a, b < n \\)），\\( a \\) 和 \\( b \\) 都会作为因数出现在 \\( (n-1)! \\) 的连乘中，因此必然整除！',
          '（唯一例外是 \\( n = 4 \\)：\\( (4-1)! = 6 \\equiv 2 \\pmod 4 \\)）。'
        ]
      },
      {
        type: 'example',
        id: 'eg_9_1',
        title: '【母题精析 1】威尔逊定理严密配对证明',
        difficulty: '★★☆',
        question: '严密证明威尔逊定理的充分性：若 \\( p \\) 为素数，则 \\( (p-1)! \\equiv -1 \\pmod p \\)。',
        guide: [
          { role: 'younger', text: '当 \\( p=2 \\) 和 \\( p=3 \\) 时，公式成立吗？' },
          { role: 'sister', text: '\\( p=2 \\to 1! = 1 \\equiv -1 \\pmod 2 \\)；\\( p=3 \\to 2! = 2 \\equiv -1 \\pmod 3 \\)，显然成立。' },
          { role: 'younger', text: '当 \\( p > 3 \\) 时，我们对二次同余方程 \\( x^2 \\equiv 1 \\pmod p \\) 求解！' },
          { role: 'sister', text: '解出自身逆元只有 1 和 \\( p-1 \\)，剩下的数两两配对即可！' }
        ],
        solution: [
          '严密代数证明：',
          '1. 当 \\( p = 2 \\) 时，\\( (2-1)! = 1 \\equiv -1 \\pmod 2 \\) 显然成立。',
          '2. 当 \\( p > 2 \\) 为奇素数时，考察集合 \\( S = \\{1, 2, 3, \\dots, p-1\\} \\)。',
          '3. 对每个 \\( a \\in S \\)，由 \\( \\gcd(a, p) = 1 \\)，同余方程 \\( ax \\equiv 1 \\pmod p \\) 在 \\( S \\) 中存在**唯一解** \\( x \\in S \\)，记作 \\( a\' \\)。',
          '4. 寻找满足“自身为逆元”（即 \\( a\' = a \\)）的元素：',
          '   \\[ a^2 \\equiv 1 \\pmod p \\iff p \\mid (a^2 - 1) = (a - 1)(a + 1) \\]',
          '   由于 \\( p \\) 是素数，必有 \\( p \\mid (a-1) \\) 或 \\( p \\mid (a+1) \\)。',
          '   在 \\( S = \\{1, 2, \\dots, p-1\\} \\) 中，只有 \\( a = 1 \\) 和 \\( a = p - 1 \\) 满足条件。',
          '5. 因此，集合中剩下的 \\( p-3 \\) 个元素 \\( \\{2, 3, \\dots, p-2\\} \\) 可以两两配对为 \\( \\frac{p-3}{2} \\) 对 \\( (x_k, x_k\') \\)，且 \\( x_k \\ne x_k\' \\)，每对满足：',
          '   \\[ x_k \\cdot x_k\' \\equiv 1 \\pmod p \\]',
          '6. 将 \\( (p-1)! \\) 展开连乘：',
          '   \\[ (p-1)! = 1 \\cdot (p-1) \\cdot \\prod_{k=1}^{(p-3)/2} (x_k \\cdot x_k\') \\equiv 1 \\cdot (-1) \\cdot (1)^{(p-3)/2} \\equiv -1 \\pmod p \\]',
          '证毕。'
        ],
        summary: '“孤立自身逆元，其余两两成对”是群论与初等数论中最经典的对称构造。'
      },
      {
        type: 'example',
        id: 'eg_9_2',
        title: '【母题精析 2】大阶乘模素数余数反求',
        difficulty: '★★',
        question: '计算 \\( 99! \\pmod{101} \\) 与 \\( 98! \\pmod{101} \\) 的值（已知 101 是素数）。',
        guide: [
          { role: 'younger', text: '101 是素数！由威尔逊定理知道 \\( 100! \\equiv -1 \\pmod{101} \\)！' },
          { role: 'sister', text: '把 \\( 100! \\) 拆成 \\( 99! \\times 100 \\)，而 \\( 100 \\equiv -1 \\pmod{101} \\)！' },
          { role: 'younger', text: '\\( 99! \\times (-1) \\equiv -1 \\implies 99! \\equiv 1 \\pmod{101} \\)！秒杀！' }
        ],
        solution: [
          '解题步骤：',
          '1. 【求解 \\( 99! \\pmod{101} \\)】：',
          '   - 101 为素数，由威尔逊定理：\\( 100! \\equiv -1 \\pmod{101} \\)。',
          '   - 将 100! 拆项：\\( 99! \\times 100 \\equiv -1 \\pmod{101} \\)。',
          '   - 注意到 \\( 100 \\equiv -1 \\pmod{101} \\)，代入得：',
          '     \\[ 99! \\times (-1) \\equiv -1 \\pmod{101} \\]',
          '   - 两边同乘 -1：',
          '     \\[ 99! \\equiv 1 \\pmod{101} \\]',
          '2. 【求解 \\( 98! \\pmod{101} \\)】：',
          '   - 类似地，\\( 98! \\times 99 \\equiv 99! \\equiv 1 \\pmod{101} \\)。',
          '   - 因为 \\( 99 \\equiv -2 \\pmod{101} \\)，代入得：',
          '     \\[ 98! \\times (-2) \\equiv 1 \\equiv -100 \\pmod{101} \\]',
          '   - 两边约去 -2（\\( \\gcd(2, 101) = 1 \\)）：',
          '     \\[ 98! \\equiv 50 \\pmod{101} \\]',
          '答：\\( 99! \\equiv 1 \\pmod{101} \\)，\\( 98! \\equiv 50 \\pmod{101} \\)。'
        ],
        summary: '遇到接近素数的大阶乘（\\( (p-2)!, (p-3)! \\)），利用威尔逊定理从 \\( (p-1)! \\equiv -1 \\) 逆向推算最为高效。'
      },
      {
        type: 'example',
        id: 'eg_9_3',
        title: '【母题精析 3】半阶乘平方同余恒等式证明',
        difficulty: '★★★',
        question: '设 \\( p \\) 为奇素数，证明：\\[ \\left( \\frac{p-1}{2} \\right)!^2 \\equiv (-1)^{\\frac{p+1}{2}} \\pmod p \\]',
        guide: [
          { role: 'younger', text: '阶乘的前半段是 \\( 1 \\times 2 \\times \\dots \\times \\frac{p-1}{2} \\)！' },
          { role: 'sister', text: '那后半段 \\( \\frac{p+1}{2}, \\dots, p-1 \\) 对模 \\( p \\) 分别等于什么？' },
          { role: 'younger', text: '\\( p-1 \\equiv -1 \\), \\( p-2 \\equiv -2 \\dots \\) 后半段刚好等于前半段全部加上负号！' },
          { role: 'sister', text: '把后半段反向代换，再结合威尔逊定理！' }
        ],
        solution: [
          '严密证明：',
          '1. 记 \\( m = \\frac{p-1}{2} \\)，则前半段阶乘为 \\( m! = 1 \\cdot 2 \\dots m \\)。',
          '2. 考察后半段的各项对模 \\( p \\) 的负同余式：',
          '   - \\( p - 1 \\equiv -1 \\pmod p \\)',
          '   - \\( p - 2 \\equiv -2 \\pmod p \\)',
          '   - \\( \\dots \\)',
          '   - \\( p - m = \\frac{p+1}{2} \\equiv -m \\pmod p \\)',
          '3. 将整个 \\( (p-1)! \\) 展开：',
          '   \\[ (p-1)! = [1 \\cdot 2 \\dots m] \\cdot [(p-m) \\dots (p-1)] \\equiv m! \\cdot [(-m) \\dots (-1)] \\pmod p \\]',
          '4. 后半段共有 \\( m \\) 个负号，提取出来：',
          '   \\[ (p-1)! \\equiv m! \\cdot (-1)^m \\cdot m! = (-1)^m (m!)^2 \\pmod p \\]',
          '5. 根据威尔逊定理，\\( (p-1)! \\equiv -1 \\pmod p \\)，故：',
          '   \\[ (-1)^m (m!)^2 \\equiv -1 \\pmod p \\]',
          '6. 两边同乘 \\( (-1)^m \\)：',
          '   \\[ (m!)^2 \\equiv -(-1)^m = (-1)^{m+1} = (-1)^{\\frac{p+1}{2}} \\pmod p \\]',
          '证毕。'
        ],
        summary: '这一结论是判定 \\( -1 \\) 是否为模 \\( p \\) 二次剩余（即 \\( x^2 \\equiv -1 \\pmod p \\) 有解充要条件 \\( p \\equiv 1 \\pmod 4 \\)）的基石！'
      },
      {
        type: 'quiz',
        quizIds: ['q_9_1', 'q_9_2']
      }
    ]
  }
};
