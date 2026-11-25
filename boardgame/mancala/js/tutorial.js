/**
 * 非洲播棋 (Mancala / Kalah) 4 步交互式手把手教学模块
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.MancalaTutorial = factory(root.MancalaEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  function makeState(pits) {
    const st = Engine.createInitialState(4);
    st.pits = pits.slice();
    st.currentPlayer = 1;
    return st;
  }

  const STEPS = [
    {
      id: 'mc-1',
      title: '第 1 步：逆时针播种与“免费连击”！',
      instruction:
        '播棋的精髓就是算步数！看下方第 3 号坑（从左数第 3 个），里面有 4 颗宝石，距离右侧你的大宝库正好差 4 步。请点击第 3 号坑逆时针播种，让最后一颗精准落进大宝库！',
      expectedPit: 2,
      successText: '✨ 完美！最后一颗宝石正好落入己方大宝库时，你会立刻获得“再来一次”的额外回合！这也是开局必学的第一招！',
      build: () => makeState([4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0])
    },
    {
      id: 'mc-2',
      title: '第 2 步：精准落入空坑，“对坑截胡”大丰收！',
      instruction:
        '看你的第 5 号坑是空的，而正对面北岸（上方）的坑里竟然堆着 7 颗宝石！你的第 2 号坑正好有 3 颗宝石（2+3=5）。请点击第 2 号坑，让最后一颗精准落入第 5 号空坑！',
      expectedPit: 1,
      successText: '💎 哇塞！一口气卷走对面 7 颗 + 自己 1 颗 = 8 颗宝石全进大宝库！这就是播棋最爽的“对坑截胡”！',
      build: () => makeState([2, 3, 1, 2, 0, 1, 10, 2, 7, 3, 2, 2, 2, 11])
    },
    {
      id: 'mc-3',
      title: '第 3 步：跨岸播种（自动跳过对手大宝库）',
      instruction:
        '当一个坑里宝石很多时，播种会绕过你的大宝库继续播到北岸（对手那边），但永远会跳过左侧对手的大宝库！请点击第 6 号坑（有 4 颗宝石），观察宝石如何进宝库并跨过对岸！',
      expectedPit: 5,
      successText: '👍 清晰明了！给对手送太多宝石可能会帮对手攒大招，但有时为了清光己方小坑或破坏对手空坑，跨岸播种也是好棋！',
      build: () => makeState([1, 2, 0, 1, 2, 4, 14, 3, 2, 1, 3, 2, 1, 12])
    },
    {
      id: 'mc-4',
      title: '第 4 步：清空己方小坑，终局收官获胜！',
      instruction:
        '只要任意一方 6 个小坑全部清空，对局立即结束，对方会把剩下的宝石收入自己宝库！现在你宝库已有 25 颗，请点击第 6 号坑最后 1 颗宝石送进大宝库，立刻结束比赛锁定胜局！',
      expectedPit: 5,
      successText: '🎉 恭喜通关非洲播棋教学！记住：先算连击，再盯空坑截胡，去挑战酋长大师 AI 吧！',
      build: () => makeState([0, 0, 0, 0, 0, 1, 25, 1, 2, 1, 0, 1, 1, 16])
    }
  ];

  function createSession() {
    return {
      stepIndex: 0,
      totalSteps: STEPS.length,
      step: STEPS[0],
      state: STEPS[0].build(),
      completedStep: false,
      finished: false
    };
  }

  function applyTutorialMove(session, pitIndex) {
    if (session.completedStep || session.finished) {
      return { ok: false, message: '本步已完成，请点击“下一步”。', session };
    }
    if (pitIndex !== session.step.expectedPit) {
      return {
        ok: false,
        message: '请按教学提示，点击金色闪烁指引的那一个浅坑哦！',
        session
      };
    }
    const res = Engine.applyMove(session.state, pitIndex);
    const isLast = session.stepIndex >= session.totalSteps - 1;
    return {
      ok: true,
      message: session.step.successText,
      result: res,
      session: {
        ...session,
        state: res.state,
        completedStep: true,
        finished: isLast
      }
    };
  }

  function nextTutorialStep(session) {
    const nextIdx = session.stepIndex + 1;
    if (nextIdx >= STEPS.length) {
      return { ...session, finished: true };
    }
    return {
      stepIndex: nextIdx,
      totalSteps: STEPS.length,
      step: STEPS[nextIdx],
      state: STEPS[nextIdx].build(),
      completedStep: false,
      finished: false
    };
  }

  return {
    STEPS,
    createSession,
    applyTutorialMove,
    nextTutorialStep
  };
});
