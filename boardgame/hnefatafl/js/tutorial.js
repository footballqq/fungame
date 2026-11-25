/**
 * 维京王者之棋 (Hnefatafl) 4 步交互式手把手教学模块
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.HnefataflTutorial = factory(root.HnefataflEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  function makeBoard(pieces, currentPlayer) {
    const st = Engine.createInitialState(7);
    for (let r = 0; r < 7; r++) st.board[r].fill(Engine.EMPTY);
    pieces.forEach(([r, c, val]) => { st.board[r][c] = val; });
    st.currentPlayer = currentPlayer;
    return st;
  }

  const STEPS = [
    {
      id: 'ht-1',
      title: '第 1 步：夹击吃子（双面合围）',
      instruction:
        '维京棋里所有棋子都像“车”一样横竖走直线！你现在执黑方（进攻者）。请点击第 2 行第 2 列的黑棋，向右滑到 (2, 5)，把夹在中间的白方卫兵 (2, 4) 一举夹击吃掉！',
      expectedFrom: { r: 1, c: 1 },
      expectedTo: { r: 1, c: 4 },
      successText: '⚔️ 漂亮！把敌兵夹在两枚己方棋子中间就会立刻吃掉它！记住：主动走入敌方两子中间是安全的，不会被反杀。',
      build: () =>
        makeBoard(
          [
            [3, 3, Engine.KING],
            [1, 3, Engine.DEFENDER],
            [1, 2, Engine.ATTACKER],
            [1, 1, Engine.ATTACKER],
            [5, 3, Engine.DEFENDER]
          ],
          2
        )
    },
    {
      id: 'ht-2',
      title: '第 2 步：借用“角落堡垒”巧吃敌兵',
      instruction:
        '棋盘的四个角落堡垒（以及空王座）天然充当“中立墙”，能帮你配合夹击！你现在执白方。请点击 (0, 3) 的白兵，向左滑到 (0, 2)，借用左上角堡垒 (0, 0) 吃掉 (0, 1) 的黑兵！',
      expectedFrom: { r: 0, c: 3 },
      expectedTo: { r: 0, c: 2 },
      successText: '🛡️ 巧妙！只要把对手逼到角落堡垒或空王座旁边，只需 1 枚己方棋子就能完成夹击！',
      build: () =>
        makeBoard(
          [
            [3, 3, Engine.KING],
            [0, 1, Engine.ATTACKER],
            [0, 3, Engine.DEFENDER],
            [6, 3, Engine.ATTACKER]
          ],
          1
        )
    },
    {
      id: 'ht-3',
      title: '第 3 步：掩护国王，一步冲进角落突围！',
      instruction:
        '白方的终极目标是护送国王抵达任意一个角落逃生堡垒！现在通往右上角 (0, 6) 的道路已经敞开，请点击 (0, 3) 的白方国王，一路直冲右上角堡垒获胜！',
      expectedFrom: { r: 0, c: 3 },
      expectedTo: { r: 0, c: 6 },
      successText: '👑 国王成功突围！实战中白方最强的招数是制造“双线叫杀”，让黑方顾此失彼！',
      build: () =>
        makeBoard(
          [
            [0, 3, Engine.KING],
            [2, 3, Engine.DEFENDER],
            [1, 5, Engine.ATTACKER],
            [5, 2, Engine.ATTACKER]
          ],
          1
        )
    },
    {
      id: 'ht-4',
      title: '第 4 步：黑方终结技——夹击擒获国王！',
      instruction:
        '当国王离开王座和王座四邻格后，黑方只需双面夹击就能擒获国王（在王座或王座旁则需 4 面合围）！请点击 (4, 5) 的黑棋向上移到 (2, 5)，与 (2, 3) 的黑棋联手擒获 (2, 4) 的国王！',
      expectedFrom: { r: 4, c: 5 },
      expectedTo: { r: 2, c: 5 },
      successText: '🎉 恭喜通关维京王者之棋教学！现在可以自由选择扮演突围的白方或合围的黑方，挑战维京大酋长 AI！',
      build: () =>
        makeBoard(
          [
            [2, 4, Engine.KING],
            [2, 3, Engine.ATTACKER],
            [4, 5, Engine.ATTACKER],
            [5, 1, Engine.DEFENDER]
          ],
          2
        )
    }
  ];

  // 修正第 1 步坐标一致性：黑棋在 (1, 2) 与 (1, 4) 夹吃 (1, 3)
  STEPS[0].instruction =
    '维京棋里所有棋子都像“车”一样横竖走直线！你现在执黑方（进攻者）。请点击第 4 行第 5 列 (4, 5) 的黑棋，向上滑到第 2 行第 5 列 (2, 5)，与 (2, 3) 的同伴联手吃掉中间的白方卫兵！';
  STEPS[0].expectedFrom = { r: 3, c: 4 };
  STEPS[0].expectedTo = { r: 1, c: 4 };
  STEPS[0].build = () =>
    makeBoard(
      [
        [3, 3, Engine.KING],
        [1, 3, Engine.DEFENDER],
        [1, 2, Engine.ATTACKER],
        [3, 4, Engine.ATTACKER],
        [5, 3, Engine.DEFENDER]
      ],
      2
    );

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

  function applyTutorialMove(session, move) {
    if (session.completedStep || session.finished) {
      return { ok: false, message: '本步已完成，请点击“下一步”。', session };
    }
    const ef = session.step.expectedFrom;
    const et = session.step.expectedTo;
    if (move.fromR !== ef.r || move.fromC !== ef.c || move.toR !== et.r || move.toC !== et.c) {
      return {
        ok: false,
        message: '请按教学提示，将金色闪烁的棋子移动到绿色目标格哦！',
        session
      };
    }
    const res = Engine.applyMove(session.state, move);
    const isLast = session.stepIndex >= session.totalSteps - 1;
    return {
      ok: true,
      message: session.step.successText,
      captured: res.captured,
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
