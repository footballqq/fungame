export const Chapter15Script = {
  sec_15_1: {
    title: "第十篇　以直代曲",
    blocks: [
      {
        type: 'dialogue',
        messages: [
          { role: 'sister', text: '导数除了告诉我们“走得多快”，还有个大用处：**造替身**。' },
          { role: 'younger', text: '替身？给曲线造替身吗？' },
          { role: 'sister', text: '对！曲线不好算，直线好算。如果我们把曲线放大、再放大，它看起来就会越来越直。' }
        ]
      },
      {
        type: 'story',
        paragraphs: [
          '把 f(a) = a^2 的画像在 a = 1 附近放大，放得越大，弯就越看不出来。',
          '当然，它永远是弯的，只是“看不出来”。而那条能最完美冒充曲线的直线，正是切线。'
        ]
      },
      {
        type: 'concept',
        color: 'blue',
        title: '切线机器',
        content: [
          '在 a 这一点的切线，是这样一台机器 T：',
          '\\[ T(t) = f(a) + f\'(a) \\times (t - a) \\]',
          '它从 f(a) 出发，每往右挪一格，按陡度 f\'(a) 涨一格。'
        ]
      },
      {
        type: 'dialogue',
        messages: [
          { role: 'younger', text: '凭什么是切线冒充得最像呢？我随便画一条过那点的直线不行吗？' },
          { role: 'sister', text: '不行哦。只有切线能把误差压到“比 h 小一档”。别的直线的误差都跟 h 一样大！' },
          { role: 'younger', text: '哦，所以切线保留了真变化里“成正比的那一部分”，把零头交给了极限，这就是微分！' }
        ]
      },
      {
        type: 'story',
        paragraphs: [
          "拿着替身，我们可以干活了。比如没有计算器怎么算 \\(\\sqrt{50}\\)？",
          "我们在 \\(a=49\\) 处搭切线：\\(f(49)=7\\)，导数是 \\(\\frac{1}{14}\\)。",
          "投 50 进去：\\(T(50) = 7 + \\frac{1}{14} \\approx 7.0714\\)。真值是 7.0710... 误差在第四位！"
        ]
      },
      {
        type: 'concept',
        color: 'green',
        title: '牛顿法：顺着切线滑下去',
        content: [
          '找曲线穿过横轴的点不好找，但直线穿横轴的点，一解方程就出来！',
          '第一步：站上曲线的一个点。',
          '第二步：画切线，滑到切线穿过横轴的地方。',
          '第三步：从这儿竖直回到曲线上，再画切线，继续滑...',
          '一步一滑，越滑越贴近真实的根！这就是第一册里的那个“又快又老的开方办法”！'
        ]
      },
      {
        type: 'canvas',
        animId: 'anim_newton_method'
      },
      {
        type: 'dialogue',
        messages: [
          { role: 'younger', text: '太好玩了！点一次切线就带我往前跳一次。是不是站在哪儿起步都行？' },
          { role: 'sister', text: '不是哦！如果你站在谷底或者山顶起步，切线是平的，一条水平线永远碰不到横轴，第一步就卡死了。' },
          { role: 'younger', text: '哈哈，原来切线也会把你带沟里。看来好工具也有说明书啊！' }
        ]
      },
      {
        type: 'quiz',
        tags: ['以直代曲', '牛顿迭代']
      }
    ]
  }
};
