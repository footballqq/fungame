// codex: 2026-09-22 实现夸奖与鼓励激励系统，支持跳跃赞赏、连击鼓励、受挫关怀与通关大彩蛋
/**
 * 夸奖与鼓励激励引擎 (praise.js)
 * 实时评估玩家走法，提供情感充沛的正向激励、策略点拨与温暖关怀
 */

class FrogPraiseSystem {
    constructor() {
        this.comboCount = 0;
        this.lastMoveType = null;
        this.mascotQuotes = [
            "呱！我是荷塘小智蛙，今天由我为你加油助威！",
            "秘诀：尽量让黑蛙与白蛙交替排列，千万别让同色青蛙挤在一堆哦！",
            "每一次跳跃都是智慧的闪光，放轻松，享受解谜的快乐~",
            "如果卡住了，别忘了可以点击【撤销】重新梳理思路！"
        ];
    }

    reset() {
        this.comboCount = 0;
        this.lastMoveType = null;
    }

    /**
     * 评估单次移动并生成激励语
     */
    evaluateMove(moveRecord, remainingSteps, isSolved, moveCount, limit = 20) {
        if (isSolved) {
            return this.getVictoryPraise(moveCount, limit);
        }

        const isJump = moveRecord.type === 'jump';
        if (isJump) {
            this.comboCount++;
        } else {
            this.comboCount = Math.max(0, this.comboCount - 1);
        }

        // 接近胜利
        if (remainingSteps <= 3 && remainingSteps > 0) {
            return {
                type: 'near_win',
                level: 'high',
                text: '🎯 胜利就在眼前！只差最后几步了，稳住！',
                avatar: '🔥'
            };
        }

        // 连续精彩跳跃
        if (this.comboCount >= 3) {
            return {
                type: 'combo',
                level: 'high',
                text: '🌟 连环飞跃！你的思维如行云流水般敏捷！',
                avatar: '⚡'
            };
        }

        // 单次跳跃成功
        if (isJump) {
            const praises = [
                '🐸💨 漂亮的一跃！成功完成交叉换位！',
                '✨ 凌波微步！空间一下子开阔了！',
                '👏 好步法！黑白交错，尽在掌握！',
                '🚀 飞跃成功！这一招太机智了！'
            ];
            const text = praises[Math.floor(Math.random() * praises.length)];
            return { type: 'jump', level: 'medium', text, avatar: '👍' };
        }

        // 平移走法
        const slideEncourages = [
            '👣 步步为营，这步调整很到位！',
            '🍃 沉着布局，为后方的队友让出跳板！',
            '🌿 巧妙腾挪，节奏掌控得恰到好处！'
        ];
        const text = slideEncourages[Math.floor(Math.random() * slideEncourages.length)];
        return { type: 'slide', level: 'low', text, avatar: '🌱' };
    }

    /**
     * 遇到困难时的温暖鼓励
     */
    getEncouragement(reason = 'stuck') {
        if (reason === 'deadlock') {
            return {
                type: 'comfort',
                text: '🍃 哎呀，暂时没有路可走了呢！不过没关系，点一下【撤销】退一步海阔天空~',
                avatar: '🤗'
            };
        }
        if (reason === 'over_limit') {
            return {
                type: 'comfort',
                text: '💪 虽稍稍超过了20步，但探索精神无价！完成即是胜利，下次肯定更神速！',
                avatar: '💖'
            };
        }
        // idle 提示
        const hints = [
            '💡 提示：试着让白蛙和黑蛙形成“斑马线”交错状态，能避免互相堵死哦！',
            '🤔 别着急慢慢想，所有的数学高手都是在试错中找到规律的！',
            '🌸 荷塘微风正好，走错也是风景，深呼吸再出发~'
        ];
        return {
            type: 'hint',
            text: hints[Math.floor(Math.random() * hints.length)],
            avatar: '💡'
        };
    }

    /**
     * 终局胜出盛大夸奖
     */
    getVictoryPraise(moveCount, limit = 20) {
        if (moveCount <= 17) {
            return {
                type: 'victory',
                stars: 3,
                badge: '荷塘神算子 · 极限大师 🏆',
                text: `天纵奇才！你以理论极限最少步数（${moveCount}步）通关，完美打破所有记录！`,
                avatar: '👑'
            };
        } else if (moveCount <= limit) {
            return {
                type: 'victory',
                stars: 2,
                badge: '二十步内破局先锋 🏅',
                text: `太酷了！仅用 ${moveCount} 步完成原题严苛挑战（≤20步要求），思维缜密！`,
                avatar: '🌟'
            };
        } else {
            return {
                type: 'victory',
                stars: 1,
                badge: '毅力过人 · 荷塘达人 🎖️',
                text: `恭喜通关！耗时 ${moveCount} 步坚持到底！坚韧是最好的老师，点击【重新开始】挑战更高星级吧！`,
                avatar: '🎉'
            };
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FrogPraiseSystem };
}
