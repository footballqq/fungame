// codex: 2026-11-13 增加防剧透盲盒探索模式、明牌全图鉴模式切换与一键清空收集功能

const PRAISE_QUOTES = {
    1: [
        "平展如镜！16个小方格整整齐齐铺开在平面上。✨",
        "大道至简，初始厚度 1 是万物折纸的起点！📐"
    ],
    2: [
        "漂亮的第一折！对折翻卷，双层重叠！👌",
        "轻轻松松收获厚度 2，探索之路刚刚开始！🌱"
    ],
    3: [
        "太精妙了！连续两次折叠叠出了奇数层 3！🎯",
        "打破偶数定势！你成功折出了奇数厚度 3！🌟"
    ],
    4: [
        "四平八稳！双向对折交织出 2×2 = 4 层！🔥",
        "经典的田字四层叠合，结构相当扎实！👏"
    ],
    6: [
        "横 3 竖 2 完美相遇，厚度 6 顺利诞生！💎",
        "3×2 的笛卡尔积！数学的美感跃然纸上！🎉"
    ],
    8: [
        "厚重如石！层数飙升至 8 层，越来越紧凑了！🚀",
        "已经达到了整张纸面积的一半聚集！太厉害了！💪"
    ],
    9: [
        "九重九鼎！双向 3 层对冲，达成九层高塔！👑",
        "极难折叠！3×3 = 9 层，充分展现了空间想象力！🏆"
    ],
    12: [
        "十二重天！3×4 的极致压缩，厚度高达 12 层！⚡",
        "距离完全合拢仅一步之遥，数学大师级的折法！✨"
    ],
    16: [
        "不可思议！16 层终极小方块完全合体！🎉🎉🎉",
        "16个方格全部叠聚于一格！你触碰到了厚度的绝对巅峰！🌟"
    ]
};

const MASCOT_HINTS_BLIND = [
    "我是折纸仙鹤 🕊️！发挥你的想象力，看看能自己探索出几种不同的厚度！",
    "试着沿中间对折，或者只折一侧边沿，观察层数发生了什么奇妙变化！",
    "不仅能折出偶数层，通过连续多次翻折，还能折出奇数层哦！",
    "点击折叠后的方格，能在下方透视栏查看里面叠了哪几号方格！",
    "如果想了解理论极限答案与全部步骤演示，随时可以切换到右上角的『明牌全图鉴』模式！"
];

const MASCOT_HINTS_CODEX = [
    "我是折纸仙鹤 🕊️！在明牌模式下，你可以针对未点亮的厚度逐个攻破！",
    "你知道吗？4×4的纸片无论怎么沿虚线平折，厚度只有 9 种可能哦！",
    "横向能折出 1、2、3、4 层，纵向也能折出 1、2、3、4 层，乘起来就是所有厚度！",
    "点击成就栏任意未点亮的厚度徽章，可以直接观看它的专属折法教学演示！",
    "如果想重新从头体验无剧透盲探，随时点击『清空收集』即可开启全新探索！"
];

class PraiseManager {
    constructor() {
        this.mode = localStorage.getItem('fold_game_mode') || 'blind'; // 默认盲探防剧透
        this.unlocked = this.loadUnlocked();
        this.mascotIndex = 0;
    }

    setMode(newMode) {
        if (newMode === 'blind' || newMode === 'codex') {
            this.mode = newMode;
            localStorage.setItem('fold_game_mode', newMode);
            return this.mode;
        }
        return this.mode;
    }

    resetUnlocked() {
        this.unlocked = new Set([1]);
        this.saveUnlocked();
    }

    loadUnlocked() {
        try {
            const raw = localStorage.getItem('fold_unlocked_thicknesses');
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) return new Set(arr);
            }
        } catch (e) {
            console.warn("读取本地成就失败", e);
        }
        return new Set([1]); // 默认 1 已经解锁
    }

    saveUnlocked() {
        try {
            localStorage.setItem('fold_unlocked_thicknesses', JSON.stringify([...this.unlocked]));
        } catch (e) {
            console.warn("保存本地成就失败", e);
        }
    }

    /**
     * 检查当前厚度是否触发新解锁
     * @param {number} thickness 
     * @returns {boolean} 是否为全新解锁
     */
    checkThickness(thickness) {
        if (!this.unlocked.has(thickness)) {
            this.unlocked.add(thickness);
            this.saveUnlocked();
            return true;
        }
        return false;
    }

    isComplete() {
        return ALL_TARGETS.every(t => this.unlocked.has(t));
    }

    getUnlockedCount() {
        return this.unlocked.size;
    }

    getRandomQuote(thickness) {
        const quotes = PRAISE_QUOTES[thickness] || PRAISE_QUOTES[1];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    getNextMascotHint() {
        const list = this.mode === 'blind' ? MASCOT_HINTS_BLIND : MASCOT_HINTS_CODEX;
        const hint = list[this.mascotIndex % list.length];
        this.mascotIndex++;
        return hint;
    }

    showToast(message, duration = 2800) {
        const toast = document.getElementById('praiseToast');
        if (!toast) return;
        toast.innerHTML = message;
        toast.classList.add('show');
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // 庆祝彩屑特效
    fireConfetti() {
        const container = document.getElementById('confettiContainer');
        if (!container) return;
        container.innerHTML = '';

        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#4caf50', '#ffeb3b', '#ff9800'];
        const count = 70;

        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.animationDelay = `${Math.random() * 0.8}s`;
            piece.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
            piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            container.appendChild(piece);
        }

        setTimeout(() => {
            container.innerHTML = '';
        }, 3500);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PraiseManager, PRAISE_QUOTES };
} else {
    window.PraiseManager = PraiseManager;
    window.PRAISE_QUOTES = PRAISE_QUOTES;
}
