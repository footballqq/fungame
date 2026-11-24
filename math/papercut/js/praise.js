// codex: 2026-11-24 升级伴学激励与探索记录管理器，支持按边长 N 独立保存玩家挑战纪录与防剧透反馈

/**
 * PraiseManager：按棋盘边长 N 独立管理探索纪录、吉祥物鼓励语、Toast 与彩屑礼花。
 */
class PraiseManager {
    constructor(storageKey = 'papercut_records_by_size_v2') {
        this.storageKey = storageKey;
        this.recordsBySize = this._loadAll();
        this.toastTimer = null;
    }

    _loadAll() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') return parsed;
            }
            // 兼容旧版 v1（默认归入 11x11）
            const legacy = localStorage.getItem('papercut_11_records_v1');
            if (legacy) {
                const arr = JSON.parse(legacy);
                if (Array.isArray(arr)) return { '11': arr };
            }
        } catch (e) {
            // 忽略本地存储异常
        }
        return {};
    }

    _saveAll() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.recordsBySize));
        } catch (e) {
            // 忽略本地存储异常
        }
    }

    getRecordsForSize(boardSize) {
        const key = String(boardSize);
        return Array.isArray(this.recordsBySize[key]) ? this.recordsBySize[key] : [];
    }

    getBestCount(boardSize) {
        const list = this.getRecordsForSize(boardSize);
        if (list.length === 0) return null;
        return Math.min(...list.map(r => r.count));
    }

    hasFoundOptimal(boardSize, optimalCount) {
        const best = this.getBestCount(boardSize);
        return best !== null && best <= optimalCount;
    }

    recordCompletion(boardSize, pieceCount, piecesSnapshot, optimalCount) {
        const key = String(boardSize);
        const list = this.getRecordsForSize(boardSize).slice();
        const prevBest = this.getBestCount(boardSize);
        const isNewBest = prevBest === null || pieceCount < prevBest;
        const isOptimal = pieceCount <= optimalCount;

        const existingIdx = list.findIndex(r => r.count === pieceCount);
        const entry = {
            count: pieceCount,
            pieces: piecesSnapshot.map(p => ({
                row: p.row,
                col: p.col,
                size: p.size
            })),
            timestamp: Date.now()
        };

        if (existingIdx >= 0) {
            list[existingIdx] = entry;
        } else {
            list.push(entry);
        }
        list.sort((a, b) => a.count - b.count);
        this.recordsBySize[key] = list;
        this._saveAll();

        return { isNewBest, isOptimal, prevBest };
    }

    clearRecordsForSize(boardSize) {
        delete this.recordsBySize[String(boardSize)];
        this._saveAll();
    }

    setMascotText(text) {
        const el = document.getElementById('mascotText');
        if (el) el.innerHTML = text;
    }

    showToast(message, duration = 2600) {
        const toast = document.getElementById('praiseToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    launchConfetti(count = 48) {
        const container = document.getElementById('confettiContainer');
        if (!container) return;
        const colors = [
            '#ef5350',
            '#ffca28',
            '#66bb6a',
            '#42a5f5',
            '#ab47bc',
            '#ff7043',
            '#26c6da'
        ];
        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.backgroundColor =
                colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
            piece.style.animationDelay = `${Math.random() * 0.4}s`;
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            container.appendChild(piece);
            setTimeout(() => piece.remove(), 3800);
        }
    }

    getRandomEncourage(boardSize = 11) {
        const lines = [
            '小窍门：尽量别留下宽 1 厘米的超长窄缝，不然会被迫剪出好多 1×1 小碎块哦！',
            `当前是 ${boardSize}×${boardSize} 纸片：如果是偶数可以直接四等分，如果是质数就要动脑筋一大一小搭配啦！`,
            '不仅可以在下面选尺寸点击，还可以直接在画板上按住手指/鼠标拖拉画框剪出来哦！',
            '觉得某一步剪得不理想？直接点一下那块正方形就能把它拿掉重来！',
            '在顶部可以随时切换不同的边长大小（2×2 到 25×25），每一种都有专属最优解和教学哦！'
        ];
        return lines[Math.floor(Math.random() * lines.length)];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PraiseManager };
} else {
    window.PraiseManager = PraiseManager;
}
