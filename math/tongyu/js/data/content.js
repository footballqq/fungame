/**
 * 同余探索（Modulo Explorer）课程知识结构与章节元数据
 */
export const ContentData = {
  volumes: [
    {
      id: 'vol_1',
      title: '篇章一：基础篇 · 余数的时钟与同余的诞生',
      desc: '从钟表周期认识带余除法，掌握同余三大性质与弃九法',
      chapters: ['chapter_1', 'chapter_2', 'chapter_3']
    },
    {
      id: 'vol_2',
      title: '篇章二：进阶篇 · 剩余系、幂模周期与同余方程',
      desc: '建立完全剩余系与简化剩余系，探秘欧拉函数与周期循环',
      chapters: ['chapter_4', 'chapter_5', 'chapter_6']
    },
    {
      id: 'vol_3',
      title: '篇章三：定理篇 · 数论三大经典定理',
      desc: '探索费马小定理、欧拉定理与威尔逊定理的精妙证明与应用',
      chapters: ['chapter_7', 'chapter_8', 'chapter_9']
    },
    {
      id: 'vol_4',
      title: '篇章四：应用篇 · 中国剩余定理与不定方程',
      desc: '攻克一次同余方程、孙子定理物不知数与奥赛不定方程模分析',
      chapters: ['chapter_10', 'chapter_11', 'chapter_12']
    }
  ],

  chapters: {
    chapter_1: {
      id: 'chapter_1',
      volId: 'vol_1',
      volTitle: '篇章一 · 基础篇',
      num: 1,
      title: '第 1 讲：带余除法与时钟算术',
      subtitle: '余数的诞生与钟表上的循环算术',
      desc: '理解带余除法定理、商与余数唯一性，掌握高斯同余符号定义。',
      animId: 'anim_modulo_clock',
      quizIds: ['q_1_1', 'q_1_2']
    },
    chapter_2: {
      id: 'chapter_2',
      volId: 'vol_1',
      volTitle: '篇章一 · 基础篇',
      num: 2,
      title: '第 2 讲：同余的三大运算法则',
      subtitle: '加减乘幂与先算后模的奥秘',
      desc: '学习同余在加法、减法、乘法与乘方中的可加性与可乘性，避开同余除法陷阱。',
      animId: 'anim_congruence_calc',
      quizIds: ['q_2_1', 'q_2_2']
    },
    chapter_3: {
      id: 'chapter_3',
      volId: 'vol_1',
      volTitle: '篇章一 · 基础篇',
      num: 3,
      title: '第 3 讲：整除特征与弃九法',
      subtitle: '十进制展开与数论探针',
      desc: '深入十进制位值同余展开，掌握 2/5/4/8/9/11 整除特征与弃九法速算检验。',
      animId: 'anim_congruence_calc',
      quizIds: ['q_3_1', 'q_3_2']
    },
    chapter_4: {
      id: 'chapter_4',
      volId: 'vol_2',
      volTitle: '篇章二 · 进阶篇',
      num: 4,
      title: '第 4 讲：剩余类与完全剩余系',
      subtitle: '整数的分类抽屉与鸽巢原理',
      desc: '理解模 m 的等价类划分、完全剩余系（CRS）判定与抽屉原理同余证明。',
      animId: 'anim_residue_drawers',
      quizIds: ['q_4_1', 'q_4_2']
    },
    chapter_5: {
      id: 'chapter_5',
      volId: 'vol_2',
      volTitle: '篇章二 · 进阶篇',
      num: 5,
      title: '第 5 讲：简化剩余系与欧拉函数',
      subtitle: '互质元素的代数之美',
      desc: '探索简化剩余系（RRS）的乘法封闭性，推导欧拉函数 φ(n) 计算公式。',
      animId: 'anim_residue_drawers',
      quizIds: ['q_5_1', 'q_5_2']
    },
    chapter_6: {
      id: 'chapter_6',
      volId: 'vol_2',
      volTitle: '篇章二 · 进阶篇',
      num: 6,
      title: '第 6 讲：幂模周期与阶',
      subtitle: '大数末位跳跃与轨道循环',
      desc: '研究幂模序列的循环周期规律，掌握数模 m 的阶（Order）及其整除性质。',
      animId: 'anim_power_orbit',
      quizIds: ['q_6_1', 'q_6_2']
    },
    chapter_7: {
      id: 'chapter_7',
      volId: 'vol_3',
      volTitle: '篇章三 · 定理篇',
      num: 7,
      title: '第 7 讲：费马小定理与巧妙证明',
      subtitle: '素数幂模的惊人恒等式',
      desc: '掌握费马小定理 a^(p-1) ≡ 1 (mod p)，精读简化剩余系置换证明，巧解大指数化简。',
      animId: 'anim_power_orbit',
      quizIds: ['q_7_1', 'q_7_2']
    },
    chapter_8: {
      id: 'chapter_8',
      volId: 'vol_3',
      volTitle: '篇章三 · 定理篇',
      num: 8,
      title: '第 8 讲：欧拉定理与欧拉降幂公式',
      subtitle: '合数模的普适法则与指数塔',
      desc: '掌握欧拉定理 a^φ(m) ≡ 1 (mod m)，理解扩展欧拉降幂公式，攻克超级指数塔。',
      animId: 'anim_power_orbit',
      quizIds: ['q_8_1', 'q_8_2']
    },
    chapter_9: {
      id: 'chapter_9',
      volId: 'vol_3',
      volTitle: '篇章三 · 定理篇',
      num: 9,
      title: '第 9 讲：威尔逊定理与阶乘同余',
      subtitle: '模逆元两两配对的魔法',
      desc: '理解素数充要条件 (p-1)! ≡ -1 (mod p)，领悟模反元素互为逆元的配对精髓。',
      animId: 'anim_congruence_calc',
      quizIds: ['q_9_1', 'q_9_2']
    },
    chapter_10: {
      id: 'chapter_10',
      volId: 'vol_4',
      volTitle: '篇章四 · 应用篇',
      num: 10,
      title: '第 10 讲：一次同余方程与模逆元',
      subtitle: '方程的解数与扩展欧几里得',
      desc: '掌握 ax ≡ b (mod m) 的可解性判别、解数定理与扩展欧几里得法求逆元。',
      animId: 'anim_modulo_clock',
      quizIds: ['q_10_1', 'q_10_2']
    },
    chapter_11: {
      id: 'chapter_11',
      volId: 'vol_4',
      volTitle: '篇章四 · 应用篇',
      num: 11,
      title: '第 11 讲：中国剩余定理（孙子定理）',
      subtitle: '物不知数与多周期公倍构造',
      desc: '探究“三人同行七十稀”，掌握 CRT 通解公式构造与同余方程组求解技术。',
      animId: 'anim_crt_gears',
      quizIds: ['q_11_1', 'q_11_2']
    },
    chapter_12: {
      id: 'chapter_12',
      volId: 'vol_4',
      volTitle: '篇章四 · 应用篇',
      num: 12,
      title: '第 12 讲：同余在不定方程与竞赛中的妙用',
      subtitle: '模筛选法与奥赛压轴破题',
      desc: '熟练运用完全平方数模 3/4/8 性质，掌握无解判定、勾股数同余证明与奥赛实战。',
      animId: 'anim_congruence_calc',
      quizIds: ['q_12_1', 'q_12_2']
    }
  }
};
