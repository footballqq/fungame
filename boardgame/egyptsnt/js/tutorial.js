/**
 * 古埃及双面棋盒 · 交互式手把手教学模块
 * 为塞尼特棋 (Senet) 与阿塞布棋 (Aseb) 分别设计 5 步情景教学关卡，
 * 每步给出预设残局与固定点数，引导玩家在真实棋盘上一步步操作并立刻看懂规则。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./senet-engine.js'),
      require('./aseb-engine.js')
    );
  } else {
    root.EgyptTutorial = factory(root.SenetEngine, root.AsebEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (Senet, Aseb) {
  'use strict';

  function makeSenetStepState(piecesP1, piecesP2, borneOff1, borneOff2, rollSteps, flatCount) {
    const st = Senet.createInitialState();
    st.board.fill(0);
    piecesP1.forEach((sq) => { st.board[sq] = 1; });
    piecesP2.forEach((sq) => { st.board[sq] = 2; });
    st.borneOff = { 1: borneOff1, 2: borneOff2 };
    st.currentPlayer = 1;
    st.phase = 'roll';
    const fc = typeof flatCount === 'number' ? flatCount : (rollSteps === 5 ? 0 : rollSteps);
    const sticks = [0, 0, 0, 0].map((_, idx) => (idx < fc ? 1 : 0));
    const extraTurn = rollSteps === 1 || rollSteps === 4 || rollSteps === 5;
    const presetRoll = { sticks, flatCount: fc, steps: rollSteps, extraTurn };
    const rolled = Senet.applyRoll(st, presetRoll);
    return { state: rolled.state, legalMoves: rolled.legalMoves };
  }

  function makeAsebStepState(p1Arr, p2Arr, rollSteps) {
    const st = Aseb.createInitialState();
    st.pieces = { 1: p1Arr.slice(), 2: p2Arr.slice() };
    st.currentPlayer = 1;
    st.phase = 'roll';
    const dice = [0, 0, 0, 0].map((_, idx) => (idx < rollSteps ? 1 : 0));
    const presetRoll = { dice, steps: rollSteps };
    const rolled = Aseb.applyRoll(st, presetRoll);
    return { state: rolled.state, legalMoves: rolled.legalMoves };
  }

  const SENET_STEPS = [
    {
      id: 'senet-1',
      title: '第 1 步：蛇形赛道与“换位突袭”',
      instruction:
        '塞尼特棋走 3×10 的“反 S 形”单行道（1→10 后折返 11→20，再折返 21→30）。你已掷出 2 点！请点击第 9 格的圆锥棋子，跨过拐角落到第 11 格，与对手孤立的轮盘棋子互换位置！',
      expectedFrom: 9,
      successText: '漂亮！对手第 11 格的孤子被你打回了第 9 格！记住：只要落到对手单独 1 枚棋子上，就能互换位置。',
      build: () => makeSenetStepState([3, 5, 9, 16, 18], [4, 7, 11, 20, 22], 0, 0, 2)
    },
    {
      id: 'senet-2',
      title: '第 2 步：双子保护与三子“叹息之墙”',
      instruction:
        '看第 12、13、14 格：对手 3 枚轮盘紧挨着，组成了无法跨越的“叹息之墙”！你掷出了 4 点，第 11 格棋子被墙完全挡住动不了。请点击第 16 格的圆锥棋子前进到第 20 格！',
      expectedFrom: 16,
      successText: '懂啦！对手 2 子相邻就不能被换位（带🛡盾牌），3 子相邻更是连跨都跨不过去——你也应该多让己方棋子结伴而行！',
      build: () => makeSenetStepState([5, 11, 16, 21, 23], [6, 12, 13, 14, 22], 0, 0, 4)
    },
    {
      id: 'senet-3',
      title: '第 3 步：必停“美丽之屋”（第 26 格）',
      instruction:
        '所有棋子冲刺终点前，都必须在第 26 格「美丽之屋」准确停下（不能直接跨过）。你掷出 2 点，请点击第 24 格棋子稳稳停在 26 格安全屋！',
      expectedFrom: 24,
      successText: '完美停靠！第 26 格不仅是必经站，还是安全格，对手绝对无法把你换走。',
      build: () => makeSenetStepState([10, 15, 24], [12, 18, 22], 2, 2, 2)
    },
    {
      id: 'senet-4',
      title: '第 4 步：飞跃“水之屋”陷阱直接出盘！',
      instruction:
        '第 27 格是「水之屋」陷阱，踩中会被冲回第 15 格！好消息是你掷出了 5 点（0 根平面朝上，还送额外投掷！）。请点击第 26 格棋子，一步飞跃水之屋直接安全出盘！',
      expectedFrom: 26,
      successText: '太爽了！从第 26 格掷 5 点可直接出盘；如果只掷 1 点踩进 27 格，就会落水回到第 15 格「重生之屋」。',
      build: () => makeSenetStepState([15, 26], [19, 22], 3, 3, 5, 0)
    },
    {
      id: 'senet-5',
      title: '第 5 步：终点三屋精确出盘获胜',
      instruction:
        '最后三格有精准要求：28 格需掷 3 点出盘，29 格需掷 2 点出盘，30 格任意点数出盘。你掷出 3 点，请点击第 28 格的最后一枚棋子移出棋盘赢得教学胜利！',
      expectedFrom: 28,
      successText: '🎉 恭喜通关塞尼特棋教学！你已经掌握全部精髓，现在可以和法老 AI 正式开战了！',
      build: () => makeSenetStepState([28], [25, 29], 4, 3, 3)
    }
  ];

  const ASEB_STEPS = [
    {
      id: 'aseb-1',
      title: '第 1 步：私人安全区起步 + 踩中 ✦ 再掷',
      instruction:
        '阿塞布棋从上方“待入场区”出发，先走自己 4 格绝对安全的私人区（私1→私4）。你掷出 4 点！请点击上方高亮的「圆锥方待入场区」，一步踩中 私4 的 ✦ 神圣标记格！',
      expectedFrom: 0,
      successText: '好开局！踩中 ✦ 神圣标记格立刻获得一次额外投掷机会，这是阿塞布棋连击抢节奏的关键！',
      build: () => makeAsebStepState([0, 0, 0, 0, 0], [0, 0, 0, 0, 0], 4)
    },
    {
      id: 'aseb-2',
      title: '第 2 步：拐入公共赛道，狭路击杀对手！',
      instruction:
        '走完 私4 就会拐入中间 12 格公共交战区！对手一枚轮盘棋子正停在 公3。你掷出 3 点，请点击 私4 的圆锥棋子冲出去，把它直接击杀踢回场外！',
      expectedFrom: 4,
      successText: '⚔️ 击杀成功！不同于塞尼特的“换位”，阿塞布棋会把对手直接踢回场外重新排队！',
      build: () => makeAsebStepState([4, 0, 0, 0, 0], [7, 2, 0, 0, 0], 3)
    },
    {
      id: 'aseb-3',
      title: '第 3 步：抢占公共区无敌 ✦ 格',
      instruction:
        '在公共交战区很容易被身后对手追杀，但停在 ✦ 格上就处于无敌状态！你掷出 1 点，请把 公3 的棋子前移一格到 公4（✦ 无敌格），顺便再拿一次额外投掷！',
      expectedFrom: 7,
      successText: '稳如泰山！公共区的 3 个 ✦ 格（公4、公8、公12）既无敌免疫击杀，踩中又送再掷一次，是兵家必争之地！',
      build: () => makeAsebStepState([7, 0, 0, 0, 0], [5, 0, 0, 0, 0], 1)
    },
    {
      id: 'aseb-4',
      title: '第 4 步：识别对手的无敌庇护',
      instruction:
        '看 公8（✦ 无敌格）上停着对手的轮盘棋子——它受神圣庇护，你不能吃它！你掷出 2 点，因此 公6 的棋子不能进 公8，请点击 公3 的棋子前进到 公5！',
      expectedFrom: 7,
      successText: '观察敏锐！当对手占着公共 ✦ 格时，既不能吃也不能落脚，需要灵活调度其他棋子或派新子入场。',
      build: () => makeAsebStepState([7, 10, 0, 0, 0], [12, 3, 0, 0, 0], 2)
    },
    {
      id: 'aseb-5',
      title: '第 5 步：精准第 17 步冲出终点！',
      instruction:
        '走出公共区最后 1 格（公12）需要恰好到达第 17 步（超出公12一格）。你掷出 1 点，请点击 公12 的最后一枚棋子冲出赛道，完成教学通关！',
      expectedFrom: 16,
      successText: '🎉 恭喜通关阿塞布棋教学！记住：2 点出现概率最高（37.5%），尽量别停在对手前方 2 格哦！',
      build: () => makeAsebStepState([16, 17, 17, 17, 17], [14, 15, 17, 17, 17], 1)
    }
  ];

  function getSteps(gameType) {
    return gameType === 'aseb' ? ASEB_STEPS : SENET_STEPS;
  }

  function createSession(gameType) {
    const steps = getSteps(gameType);
    const built = steps[0].build();
    return {
      game: gameType,
      stepIndex: 0,
      totalSteps: steps.length,
      step: steps[0],
      state: built.state,
      legalMoves: built.legalMoves,
      completedStep: false,
      finished: false
    };
  }

  /**
   * 尝试在当前教学步骤执行走法
   */
  function applyTutorialMove(session, move) {
    if (session.completedStep || session.finished) {
      return { ok: false, message: '本步已完成，请点击“下一步”。', session };
    }
    if (move.from !== session.step.expectedFrom) {
      return {
        ok: false,
        message: '这一步我们先按教学提示操作：请点击闪烁指引的目标棋子哦！',
        session
      };
    }
    const engine = session.game === 'aseb' ? Aseb : Senet;
    const nextState = engine.applyMove(session.state, move);
    const isLast = session.stepIndex >= session.totalSteps - 1;
    return {
      ok: true,
      message: session.step.successText,
      session: {
        ...session,
        state: nextState,
        legalMoves: [],
        completedStep: true,
        finished: isLast
      }
    };
  }

  function nextTutorialStep(session) {
    const steps = getSteps(session.game);
    const nextIdx = session.stepIndex + 1;
    if (nextIdx >= steps.length) {
      return { ...session, finished: true };
    }
    const built = steps[nextIdx].build();
    return {
      game: session.game,
      stepIndex: nextIdx,
      totalSteps: steps.length,
      step: steps[nextIdx],
      state: built.state,
      legalMoves: built.legalMoves,
      completedStep: false,
      finished: false
    };
  }

  return {
    getSteps,
    createSession,
    applyTutorialMove,
    nextTutorialStep
  };
});
