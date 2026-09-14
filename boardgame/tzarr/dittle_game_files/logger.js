// codex: 2026-09-14 对局历史记录追踪器与一键复制功能（支持翻滚/跳跃/点数变化/调试日志导出）
class DittleLogger {
    constructor(ui) {
        this.ui = ui;
        this.logs = [];
        this.isOpen = true;
        this.initDOM();
    }

    initDOM() {
        this.sidebarEl = document.getElementById('gameLogSidebar');
        this.listEl = document.getElementById('gameLogList');
        this.countBadge = document.getElementById('logCountBadge');
        this.toggleBtn = document.getElementById('toggleLogBtn');
        this.openBtn = document.getElementById('openLogBtn');
        this.copyBtn = document.getElementById('copyLogBtn');
        this.clearBtn = document.getElementById('clearLogBtn');

        if (this.toggleBtn) this.toggleBtn.onclick = () => this.toggleCollapse();
        if (this.openBtn) this.openBtn.onclick = () => this.toggleCollapse();
        if (this.copyBtn) this.copyBtn.onclick = () => this.copyToClipboard();
        if (this.clearBtn) this.clearBtn.onclick = () => this.clear();

        // 默认窄屏（手机/平板）收起，宽屏（PC桌面）展开
        if (window.innerWidth < 900) {
            this.setOpen(false);
        } else {
            this.setOpen(true);
        }
    }

    clear() {
        this.logs = [];
        this.render();
    }

    logMove(move, beforeDie, resultingDie, clashResult) {
        const stepNum = this.logs.filter(l => !l.isGameOver).length + 1;
        const color = beforeDie.color;
        const colorName = color === 'white' ? '白方' : '黑方';

        // 动作类型判定
        let actionName = '移动';
        if (move.type === 'tilt') {
            const dirMap = {
                north: color === 'white' ? '向前翻滚 (向北)' : '向后翻滚 (向北)',
                south: color === 'black' ? '向前翻滚 (向南)' : '向后翻滚 (向南)',
                east: '向右翻滚 (向东)',
                west: '向左翻滚 (向西)'
            };
            actionName = dirMap[move.dir] || `向${move.dir}翻滚`;
        } else if (move.type === 'jump') {
            const jumpCount = move.path ? move.path.length - 1 : 1;
            actionName = jumpCount > 1 ? `连续跳跃 (${jumpCount}连跳)` : '直线跳跃 (1跳)';
        } else if (move.type === 'tilt_jump') {
            const dirMap = {
                north: '向前翻滚',
                south: '向前翻滚',
                east: '向右翻滚',
                west: '向左翻滚'
            };
            const rollDir = dirMap[move.dir] || '翻滚';
            const jumpCount = move.path ? move.path.length - 2 : 1;
            actionName = `${rollDir} + 跳跃 (${jumpCount}跳)`;
        }

        // 路径坐标字符串
        const fromStr = `(${move.from[0]}, ${move.from[1]})`;
        const toStr = `(${move.to[0]}, ${move.to[1]})`;
        const coordPath = (move.path && move.path.length > 2)
            ? move.path.map(p => `(${p[0]},${p[1]})`).join(' ➔ ')
            : `${fromStr} ➔ ${toStr}`;

        // 点数变化
        const pipChange = {
            top: { from: beforeDie.top, to: resultingDie.top },
            front: { from: beforeDie.front, to: resultingDie.front },
            right: { from: beforeDie.right, to: resultingDie.right }
        };

        const entry = {
            stepNum,
            color,
            colorName,
            type: move.type,
            dir: move.dir,
            actionName,
            coordPath,
            from: move.from,
            to: move.to,
            pipChange,
            clashResult: clashResult || null,
            timeStr: new Date().toLocaleTimeString('zh-CN', { hour12: false })
        };

        this.logs.push(entry);
        this.render();
    }

    logGameOver(winner, reason) {
        const winnerName = winner === 'draw' ? '平局' : (winner === 'white' ? '白方获胜' : '黑方获胜');
        this.logs.push({
            isGameOver: true,
            winner,
            winnerName,
            reason,
            timeStr: new Date().toLocaleTimeString('zh-CN', { hour12: false })
        });
        this.render();
    }

    render() {
        if (!this.listEl) return;
        const moveCount = this.logs.filter(l => !l.isGameOver).length;
        if (this.countBadge) {
            this.countBadge.textContent = `${moveCount} 步`;
        }

        if (this.logs.length === 0) {
            this.listEl.innerHTML = '<div class="log-empty">暂无走棋记录。<br>走棋后此处将实时记录翻滚方向、坐标与骰子点数变化。</div>';
            return;
        }

        this.listEl.innerHTML = '';
        for (const entry of this.logs) {
            const card = document.createElement('div');
            if (entry.isGameOver) {
                card.className = 'log-item log-game-over';
                card.innerHTML = `
                    <div class="log-item-header">
                        <span class="log-step-tag">🏆 终局</span>
                        <strong style="color: var(--accent-gold);">${entry.winnerName}</strong>
                        <span class="log-time">${entry.timeStr}</span>
                    </div>
                    <div class="log-details">${entry.reason}</div>
                `;
            } else {
                card.className = `log-item ${entry.color}`;
                const topChanged = entry.pipChange.top.from !== entry.pipChange.top.to;
                const pipHtml = topChanged
                    ? `<span class="pip-highlight">顶面: ${entry.pipChange.top.from} ➔ ${entry.pipChange.top.to}</span> <span class="pip-sub">(正面:${entry.pipChange.front.to}, 右面:${entry.pipChange.right.to})</span>`
                    : `<span class="pip-sub">顶面点数保持: ${entry.pipChange.top.to} (跳跃不改变顶面)</span>`;

                let clashHtml = '';
                if (entry.clashResult) {
                    const cr = entry.clashResult;
                    if (cr.outcome === 'win') {
                        clashHtml = `<div class="clash-badge win">⚔️ 碰撞胜出！击败对手(${cr.oppDiceSum}点)，消除对方骰子</div>`;
                    } else if (cr.outcome === 'loss') {
                        clashHtml = `<div class="clash-badge loss">⚔️ 碰撞阵亡！自身(${cr.movingDieVal}点)低于对手(${cr.oppDiceSum}点)被消灭</div>`;
                    } else {
                        clashHtml = `<div class="clash-badge draw">⚔️ 碰撞同归于尽！双方点数相等，全部消灭</div>`;
                    }
                }

                card.innerHTML = `
                    <div class="log-item-header">
                        <span class="log-step-tag">#${entry.stepNum} ${entry.colorName}</span>
                        <span class="log-action-badge type-${entry.type}">${entry.actionName}</span>
                        <span class="log-time">${entry.timeStr}</span>
                    </div>
                    <div class="log-path">坐标: ${entry.coordPath}</div>
                    <div class="log-pips">${pipHtml}</div>
                    ${clashHtml}
                `;
            }
            this.listEl.appendChild(card);
        }

        this.listEl.scrollTop = this.listEl.scrollHeight;
    }

    toggleCollapse() {
        this.setOpen(!this.isOpen);
    }

    setOpen(open) {
        this.isOpen = open;
        if (this.sidebarEl) {
            this.sidebarEl.classList.toggle('collapsed', !open);
        }
        if (this.openBtn) {
            this.openBtn.classList.toggle('active', open);
        }
    }

    getExportText() {
        if (this.logs.length === 0) return '=== Dittle 骰战棋 暂无走棋记录 ===';
        const lines = [
            '=== Dittle 骰战棋 对局记录 ===',
            `记录时间: ${new Date().toLocaleString('zh-CN')}`,
            `模式: ${this.ui.gameMode === 'battle' ? '标准骰战棋 (Battle)' : '冲突淘汰变体 (Clash)'}`,
            '----------------------------------------'
        ];

        for (const e of this.logs) {
            if (e.isGameOver) {
                lines.push(`\n🏆 【对局结束】${e.winnerName}`);
                lines.push(`   原因: ${e.reason}`);
            } else {
                const p = e.pipChange;
                const topDesc = p.top.from !== p.top.to
                    ? `顶面: ${p.top.from} -> ${p.top.to}`
                    : `顶面: ${p.top.to} (不变)`;
                lines.push(
                    `#${e.stepNum} ${e.colorName} | ${e.actionName}\n` +
                    `   坐标: ${e.coordPath}\n` +
                    `   点数: ${topDesc} | 正面: ${p.front.from}->${p.front.to} | 右面: ${p.right.from}->${p.right.to}`
                );
                if (e.clashResult) {
                    lines.push(`   碰撞: ${e.clashResult.outcome} (自身:${e.clashResult.movingDieVal} vs 对手:${e.clashResult.oppDiceSum})`);
                }
            }
        }
        lines.push('========================================');
        return lines.join('\n');
    }

    copyToClipboard() {
        const text = this.getExportText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.ui.showToast('📋 对局记录已复制到剪贴板！可直接粘贴发给我。', 'info');
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            this.ui.showToast('📋 对局记录已复制到剪贴板！可直接粘贴发给我。', 'info');
        } catch (e) {
            this.ui.showToast('复制失败，请手动选取记录', 'danger');
        }
        document.body.removeChild(ta);
    }
}

window.DittleLogger = DittleLogger;
