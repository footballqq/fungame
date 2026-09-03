export const Chapter2Script = {
  sec_2_1: {
    title: "第一节：芝诺的乌龟与柯西条件",
    blocks: [
      {
        type: 'story',
        paragraphs: [
          '第二篇 柯西条件、聚点与唯一性。',
          '把“越来越近”、“越来越密”这些直觉，翻译成可以计算、可以反驳、也可以证明的话。'
        ]
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '姐姐，如果要把一堆越来越小的数全加起来，段数是无穷多，加起来的总和也会变成无穷大吗？' },
          { role: 'sister', text: '这让我想起了古希腊的芝诺。他说，只要乌龟先跑一段，兔子每次跑到乌龟上一个位置，乌龟又往前挪了一点。' },
          { role: 'younger', text: '啊！那兔子再跑到新位置，乌龟又挪了一点……这样的追赶有无穷多次！所以兔子永远追不上乌龟？' },
          { role: 'sister', text: '可是我们都知道兔子能追上。那到底是哪一句错了呢？' }
        ]
      },
      { 
        type: 'canvas', 
        animId: 'anim_zeno_turtle' 
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'sister', text: '我们来算算。第一段兔子跑 1 格，第二段 1/2 格，第三段 1/4 格……芝诺没说错的是，段数确实有无穷多。' },
          { role: 'younger', text: '可是这无穷多段接起来，总长不到 2 格！兔子跑到 2 格那里就把乌龟追上了！' },
          { role: 'sister', text: '没错！芝诺输在把“段数数不完”当成了“路跑不完”。记住：无穷多段，不等于无穷多长！' },
          { role: 'younger', text: '但是，要是每次加得不够小，会不会真的涨到无穷大呀？' },
          { role: 'sister', text: '所以，要判断一队数是不是走向极限，光靠感觉不行。数学家柯西发明了一个绝招，专门对付这种问题。' }
        ]
      },
      { 
        type: 'concept',
        color: 'blue',
        title: '柯西条件',
        content: [
          '不仅要“挨着的两项越来越近”，而且要“关口以后，随便挑哪两项都近”。',
          '挨着的两项贴紧，只说明每一步迈得小；只有任意两项都近，才真的把整队数锁死在一小块地方。'
        ]
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '我懂了！就像蜗牛爬树，虽然每步很小，但如果一直往前爬不回头，最后还是会爬得很远。' },
          { role: 'sister', text: '对，所以必须要求过了关口以后，所有的项互相之间都不能离得太远。' }
        ]
      },
      { 
        type: 'quiz', 
        tags: ['芝诺悖论'] 
      }
    ]
  },
  sec_2_2: {
    title: "第二节：二分法与区间套",
    blocks: [
      {
        type: 'story',
        paragraphs: [
          '直觉上，如果一队数越靠近某个地方就越“密集”，那里就应该是个聚点。',
          '但“密集”不是数学词汇，我们要证明被困在一段里的数列，至少会有一个聚点。'
        ]
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '姐姐，被困住的数列一定有聚点，这怎么证明啊？' },
          { role: 'sister', text: '大数学家魏尔斯特拉斯想出了一个简单得出奇的办法：就是不停地砍一半！' }
        ]
      },
      { 
        type: 'canvas', 
        animId: 'anim_bisection' 
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'sister', text: '假设这队数全被困在 0 和 1 之间。我们把这一段砍成两半。' },
          { role: 'younger', text: '因为这队数有无限多个，如果两半里都只有有限个，加起来还是有限个，矛盾了！' },
          { role: 'sister', text: '没错！所以两半里至少有一半，装着无限多个号码。我们就挑那一半！' },
          { role: 'younger', text: '接着对挑中的那一半再砍一半，再挑装无限多的。一直砍下去！' },
          { role: 'sister', text: '段子变得想多短有多短。最后这些段子一层套着一层，正好钉住一个点。这就是聚点！' },
          { role: 'younger', text: '太妙了！一边说无限，一边说有限，两边一撞，事情就定了。这就是大名鼎鼎的区间套定理吧？' },
          { role: 'sister', text: '是的！不过，最后那句“钉住一个点”其实是借来的。因为万一钉住的那个位置上是个空洞呢？' },
          { role: 'younger', text: '啊？数轴上会有洞吗？' }
        ]
      },
      { 
        type: 'quiz', 
        tags: ['聚点', '二分法'] 
      }
    ]
  }
};
