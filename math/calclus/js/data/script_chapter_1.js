export const Chapter1Script = {
  sec_1_1: {
    title: "第一节：不能做完无穷，怎么谈论无穷",
    blocks: [
      {
        type: 'story',
        paragraphs: [
          '第一篇 极限：不能做完无穷，怎么谈论无穷。',
          '极限不是“算完无限”的本事，而是“先提出候选答案，再用误差标准去证明”的一种说法。',
          '我们来看一队越排越长的数。每一个都比前一个多加一点点，加的那一点点一次比一次小：',
          '1，　1+1/2，　1+1/2+1/4，　1+1/2+1/4+1/8，　……'
        ]
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '我发现了规律！每次新加的那一块，都是上一块的一半。' },
          { role: 'sister', text: '对。所以加到第 \\(n\\) 块的时候，总和正好是 \\( 2 - 1/2^n \\)。不管 \\(n\\) 是几，这个等式都成立。' },
          { role: 'younger', text: '那 \\(n\\) 越大，2 和总和之间那一点点差就越小。要是就这么一直加下去、加到“无穷次”，是不是就正好到 2 了？' },
          { role: 'sister', text: '问题恰恰从这儿开始：无限次的加法，真的能“做完”吗？' }
        ]
      },
      { 
        type: 'concept',
        color: 'blue',
        title: '必须记住',
        content: [
          '我们永远不能完成无穷次计算。',
          '极限没有替我们做完它，只是让我们不必做完它。'
        ]
      },
      {
        type: 'story',
        paragraphs: [
          '我们常有一个朴素的想象：一步、两步、三步……一直走，等“第无穷步”走完，答案就在那儿等着。',
          '可这句话本身就是自相矛盾的。无穷不是一个特别大的整数。不管你走到第几步，都还能再走一步。',
          '所以数学的办法不是把这个困难藏起来，而是干脆换一个问题来问。'
        ]
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '换成什么问题呢？' },
          { role: 'sister', text: '我们不再问“无穷次计算做完结果是什么”，而是问：如果猜一个目标值，不管别人把误差要求定得多苛刻，能不能只用有限步，就把结果稳稳送进那个误差范围里？' }
        ]
      },
      { 
        type: 'canvas', 
        animId: 'anim_limit_sequence' 
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '好呀！那我们就玩个接招游戏。我来提要求！我只允许这么小的误差 —— \\( \\epsilon \\)（艾普西龙）。' },
          { role: 'sister', text: '好。我给你一个关口 \\( N \\)。从第 \\( N \\) 个数往后，每一个数离目标的距离，都不到 \\( \\epsilon \\)。' },
          { role: 'younger', text: '哇！灰点是关口以前的，可以随便跑；关口以后的蓝点，一个都不许出我画的误差带！' },
          { role: 'sister', text: '对！这就是用一个“有限”的关口，兑现你“无限”苛刻的要求。没有任何一步需要做无穷次操作。' }
        ]
      },
      { 
        type: 'concept',
        color: 'green',
        title: '顺序不能反',
        content: [
          '一定是妹妹先给 \\( \\epsilon \\)，姐姐再找 \\( N \\)。',
          '不是证明“看起来差不多”，而是证明“不管要求多苛刻，总有一个有限的办法满足它”。'
        ]
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '可是极限值怎么算出来的呀？' },
          { role: 'sister', text: '极限值不是在“第无穷步”算出来的。它是先被你猜出来，再用刚才的误差保证去确认的。这就是“先猜，后证”。' },
          { role: 'younger', text: '其实我们早就用过极限了对吧？比如 0.333…' },
          { role: 'sister', text: '没错。0.333… 代表一队有限小数的极限，它指向 1/3。每次多写一个 3，和 1/3 的差距就变成原来的 1/10。' },
          { role: 'younger', text: '那我们算 0.333… × 3，没有先写完无穷个 3 呀！' },
          { role: 'sister', text: '是的，我们是把 0.333… 当作 1/3 这个数的名字。我们乘的是 1/3，而不是那无穷个 3！' }
        ]
      },
      { 
        type: 'quiz', 
        tags: ['无穷'] 
      }
    ]
  },
  sec_1_2: {
    title: "第二节：聚点（Cluster Point）",
    blocks: [
      {
        type: 'story',
        paragraphs: [
          '有时候，一队数并不老老实实地走向一个极限。',
          '它们可能进进出出，虽然没有全体搬过去，但总有人回来看看。'
        ]
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '如果它们不乖，一会儿跑出去，一会儿又跑回来怎么办？' },
          { role: 'sister', text: '只要不管你把圈画得多小，不管已经走到第几步，后面总还能找到一项落进这个圈里，那这个位置就叫“聚点”。' },
          { role: 'younger', text: '也就是“不管我走到哪儿，前面总还有人在这个圈里”！' }
        ]
      },
      { 
        type: 'canvas', 
        animId: 'anim_cluster_point' 
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'sister', text: '你看探测器，即使你不断缩小圈，只要套对地方，里面永远有数！' },
          { role: 'younger', text: '极限和聚点有什么区别呢？' },
          { role: 'sister', text: '聚点只保证“经常回来看看”，极限要求关口以后“全体搬过去住”。所以如果一队数真有极限，它就不可能有两个不同的聚点。' }
        ]
      },
      { 
        type: 'canvas', 
        animId: 'anim_epsilon_n' 
      },
      { 
        type: 'dialogue', 
        messages: [
          { role: 'younger', text: '用 ε-N 语言真的好神奇！把模糊的感觉变成了铁证。' },
          { role: 'sister', text: '没错。极限不是完成无穷的神话，而是把“做完无穷次会怎样”换成了“有限精度的要求能不能在有限步里满足”。' }
        ]
      },
      { 
        type: 'quiz', 
        tags: ['ε-N'] 
      }
    ]
  }
};
