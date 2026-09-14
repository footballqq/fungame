// codex: 2026-09-14 支持东/西/南/北多向真实 3D 翻滚动画与落子即时变点动效
class DittleAnimator {
    constructor(ui) {
        this.ui = ui;
        this.activeTimers = [];
        this.lastMove = null; // { from, to, path }
    }

    cancelPending() {
        for (const t of this.activeTimers) {
            clearTimeout(t);
        }
        this.activeTimers = [];
    }

    // Schedule a timer that can be cancelled cleanly
    schedule(fn, delayMs) {
        const timerId = setTimeout(() => {
            fn();
            this.activeTimers = this.activeTimers.filter(t => t !== timerId);
        }, delayMs);
        this.activeTimers.push(timerId);
        return timerId;
    }

    // Animate move step-by-step with clear pauses so player can follow
    animateMove(move, onFinish) {
        this.cancelPending();
        this.ui.isAnimating = true;

        const path = (move.path && move.path.length >= 2) ? move.path : [move.from, move.to];
        const [fr, fc] = move.from;
        const [tr, tc] = move.to;

        // 1. Pre-move focus: highlight the moving piece and starting cell
        this.clearLastMoveHighlights();
        const startCell = this.getCellElement(fr, fc);
        if (startCell) {
            startCell.classList.add('last-move-from');
            const movingDieEl = startCell.querySelector('.die-3d-wrap');
            if (movingDieEl) {
                movingDieEl.classList.add('active-mover');
            }
        }

        // Slight pre-move pause (320ms) so player's eyes locate the moving die
        this.schedule(() => {
            this.animatePathSteps(path, 0, move, () => {
                // All steps completed, perform final landing
                this.lastMove = { from: move.from, to: move.to, path };
                this.applyLastMoveHighlights();
                this.ui.isAnimating = false;
                if (onFinish) onFinish();
            });
        }, 320);
    }

    animatePathSteps(path, stepIdx, move, onAllStepsDone) {
        if (stepIdx >= path.length - 1) {
            onAllStepsDone();
            return;
        }

        const curr = path[stepIdx];
        const next = path[stepIdx + 1];

        const currCell = this.getCellElement(curr[0], curr[1]);
        const nextCell = this.getCellElement(next[0], next[1]);

        // Determine step type (tilt or hop/jump)
        const dr = Math.abs(next[0] - curr[0]);
        const dc = Math.abs(next[1] - curr[1]);
        const isJump = (dr > 1 || dc > 1 || (move.type === 'jump') || (move.type === 'tilt_jump' && stepIdx > 0));

        // Play appropriate tactile sound
        if (isJump) {
            window.soundManager.playJump();
        } else {
            window.soundManager.playTilt();
        }

        // Visually transfer the moving die element from currCell to nextCell
        if (currCell && nextCell) {
            const dieEl = currCell.querySelector('.die-3d-wrap');
            if (dieEl) {
                currCell.removeChild(dieEl);
                nextCell.appendChild(dieEl);

                const cube = dieEl.querySelector('.die-cube');
                if (cube) {
                    let animClass = 'anim-hop';
                    if (!isJump) {
                        const stepDr = next[0] - curr[0];
                        const stepDc = next[1] - curr[1];
                        if (stepDc > 0) animClass = 'anim-tilt-east';      // 向右翻滚
                        else if (stepDc < 0) animClass = 'anim-tilt-west'; // 向左翻滚
                        else if (stepDr < 0) animClass = 'anim-tilt-north';// 向北翻滚
                        else animClass = 'anim-tilt-south';                // 向南翻滚

                        // 翻滚着陆时立即呈现翻滚后的新面点数
                        if (move.resultingDie && this.ui.updateDieContent) {
                            this.ui.updateDieContent(dieEl, move.resultingDie);
                        }
                    }
                    cube.classList.add(animClass);
                    this.schedule(() => cube.classList.remove(animClass), 360);
                }
            }
            // Mark trail
            nextCell.classList.add('last-move-path');
        }

        // Pause on this step before taking next step (380ms for hop, 320ms for tilt)
        const stepDelay = isJump ? 380 : 320;
        this.schedule(() => {
            this.animatePathSteps(path, stepIdx + 1, move, onAllStepsDone);
        }, stepDelay);
    }

    getCellElement(r, c) {
        return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    }

    clearLastMoveHighlights() {
        document.querySelectorAll('.cell.last-move-from, .cell.last-move-to, .cell.last-move-path')
            .forEach(cell => {
                cell.classList.remove('last-move-from', 'last-move-to', 'last-move-path');
            });
        document.querySelectorAll('.die-3d-wrap.active-mover')
            .forEach(die => die.classList.remove('active-mover'));
    }

    applyLastMoveHighlights() {
        if (!this.lastMove) return;
        const [fr, fc] = this.lastMove.from;
        const [tr, tc] = this.lastMove.to;

        const fromCell = this.getCellElement(fr, fc);
        const toCell = this.getCellElement(tr, tc);

        if (fromCell) fromCell.classList.add('last-move-from');
        if (toCell) toCell.classList.add('last-move-to');

        if (this.lastMove.path && this.lastMove.path.length > 2) {
            for (let i = 1; i < this.lastMove.path.length - 1; i++) {
                const midCell = this.getCellElement(this.lastMove.path[i][0], this.lastMove.path[i][1]);
                if (midCell) midCell.classList.add('last-move-path');
            }
        }
    }
}

window.DittleAnimator = DittleAnimator;
