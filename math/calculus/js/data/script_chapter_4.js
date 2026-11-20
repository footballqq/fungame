export const Chapter4Script = {
  sec_4_1: {
    title: "第一节：夹逼定理与 ε-N 的威力",
    blocks: [
      {
        type: 'story',
        paragraphs: [
          '第四篇 ε-N 这套语言，到底有多好用。',
          '我们已经证明了实数轴上没有洞。现在，该让 ε-N 语言大显身手了。'
        ]
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '姐姐，有了 ε-N 语言，它除了能玩接招游戏，还能帮我们做些什么呢？' },
          { role: 'sister', text: '它能把我们的直觉变成铁证！比如有些数列忽上忽下的，没法写出简单的公式，我们怎么求极限？' },
          { role: 'younger', text: '忽上忽下的？那不是很难算吗？' },
          { role: 'sister', text: '这时候我们就可以用“夹逼定理”！' }
        ]
      },
      { 
        type: 'canvas', 
        animId: 'anim_squeeze_theorem' 
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '我看到了！动画里，被上下两条线死死夹住的数列，好像无路可逃，只能跟着走向同一个地方！' },
          { role: 'sister', text: '对。只要上下两边的队伍都奔向同一个目标 \\(L\\)，中间那队也一定奔向 \\(L\\)。我们用 ε-N 来严格证明它吧！' },
          { role: 'younger', text: '好！我给一个误差 \\( \\epsilon \\)！' },
          { role: 'sister', text: '因为上面那队奔向 \\(L\\)，所以我能找到关口 \\(N_1\\)；下面那队也奔向 \\(L\\)，我能找到关口 \\(N_2\\)。' },
          { role: 'younger', text: '那中间那队的关口呢？' },
          { role: 'sister', text: '我只要取 \\(N_1\\) 和 \\(N_2\\) 中**更靠后的那一个**！' },
          { role: 'younger', text: '哇！过了靠后的关口，上下两队都走进了误差带，中间的被夹在里面，肯定也逃不出误差带！姐姐接招成功！' }
        ]
      },
      { 
        type: 'concept',
        color: 'green',
        title: '取靠后的关口',
        content: [
          '“取靠后的那个关口”，是 ε-N 语言里极其常用的一招。',
          '它能让两个以上的条件同时成立。这正是严格证明的魅力所在。'
        ]
      },
      {
        type: 'story',
        paragraphs: [
          '通过巧妙的“取靠后的关口”、“把 ε 掰成两半”，我们能证明两个极限的和，证明 1/n 趋向于 0。',
          '直观负责发现，ε-N 负责证明。把“我觉得”变成“我证明了”。'
        ]
      },
      { 
        type: 'quiz', 
        tags: ['夹逼'] 
      }
    ]
  }
};
