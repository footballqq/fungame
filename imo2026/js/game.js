// codex: 2026-07-22 Start reset games without an immediately splittable kθ opening angle.
/**
 * Game Manager handling modes, history, cuts, choices, and win conditions.
 */
class PaperTriangleGame {
    constructor() {
        this.theta = 45;
        this.mode = 'mulan'; // 'mulan' | 'shanyu' | 'sandbox'
        this.currentTriangle = getChallengingInitialTriangle(45);
        this.history = [];
        this.pendingSplit = null; // { T1, T2, cut }
        this.gameOver = false;
        this.winner = null;
        this.stepCount = 0;

        this.onStateChange = null;
    }

    init(theta = 45, initialVertices = null, mode = 'mulan') {
        this.theta = theta;
        this.mode = mode;
        this.currentTriangle = initialVertices
            ? initialVertices.map(v => ({...v}))
            : getChallengingInitialTriangle(this.theta);
        this.history = [];
        this.pendingSplit = null;
        this.gameOver = false;
        this.winner = null;
        this.stepCount = 0;

        // Check if initial triangle already has theta
        this.checkWinCondition(this.currentTriangle);

        if (this.onStateChange) this.onStateChange();
    }

    setTheta(newTheta) {
        this.init(newTheta, null, this.mode);
    }

    setMode(newMode) {
        this.mode = newMode;
        this.init(this.theta, null, this.mode);
    }

    checkWinCondition(vertices) {
        if (hasExactThetaAngle(vertices, this.theta)) {
            this.gameOver = true;
            this.winner = 'mulan';
            return true;
        }
        return false;
    }

    /**
     * Perform cut from point P (ratio t on edgeIndex) to opposite vertex
     */
    executeCut(edgeIndex, t) {
        if (this.gameOver || this.pendingSplit) return false;

        const v0 = this.currentTriangle[edgeIndex];
        const v1 = this.currentTriangle[(edgeIndex + 1) % 3];
        const P = { ...interpolatePoint(v0, v1, t), isCutPoint: true };

        const [T1, T2] = splitTriangle(this.currentTriangle, edgeIndex, P);

        this.pendingSplit = {
            edgeIndex,
            t,
            P,
            T1,
            T2,
            angles1: calculateTriangleAngles(T1),
            angles2: calculateTriangleAngles(T2)
        };

        // If both possible choices contain θ, Shan-Yu has no legal defense left.
        if (hasExactThetaAngle(T1, this.theta) && hasExactThetaAngle(T2, this.theta)) {
            this.history.push({
                step: ++this.stepCount,
                prevTriangle: [...this.currentTriangle],
                cut: { edgeIndex, t, P },
                keptIndex: null,
                keptTriangle: [...T1],
                discardedTriangle: [...T2],
                forcedWin: true,
                result: 'mulan-forced-win'
            });
            this.currentTriangle = T1;
            this.pendingSplit = null;
            this.gameOver = true;
            this.winner = 'mulan';
            if (this.onStateChange) this.onStateChange();
            return true;
        }

        if (this.onStateChange) this.onStateChange();

        // If mode is Mulan, Shan-Yu AI automatically makes choice
        if (this.mode === 'mulan') {
            setTimeout(() => this.processShanYuAiChoice(), 400);
        }

        return true;
    }

    /**
     * Shan-Yu selects which triangle to KEEP (0 for T1, 1 for T2)
     */
    selectTriangle(keepIndex) {
        if (!this.pendingSplit || this.gameOver) return;

        const keptTriangle = keepIndex === 0 ? this.pendingSplit.T1 : this.pendingSplit.T2;
        const discardedTriangle = keepIndex === 0 ? this.pendingSplit.T2 : this.pendingSplit.T1;

        // Record history
        const historyItem = {
            step: ++this.stepCount,
            prevTriangle: [...this.currentTriangle],
            cut: { ...this.pendingSplit.cut, edgeIndex: this.pendingSplit.edgeIndex, t: this.pendingSplit.t, P: this.pendingSplit.P },
            keptIndex: keepIndex,
            keptTriangle: [...keptTriangle],
            discardedTriangle: [...discardedTriangle],
            result: null
        };
        this.history.push(historyItem);

        this.currentTriangle = keptTriangle;
        this.pendingSplit = null;

        // Check if Mulan won!
        if (this.checkWinCondition(this.currentTriangle)) {
            historyItem.result = 'mulan-win';
            if (this.onStateChange) this.onStateChange();
            return;
        }

        if (this.onStateChange) this.onStateChange();

        // If mode is Shan-Yu, Mulan AI automatically makes next cut
        if (this.mode === 'shanyu' && !this.gameOver) {
            setTimeout(() => this.processMulanAiCut(), 500);
        }
    }

    processShanYuAiChoice() {
        if (!this.pendingSplit) return;
        const choice = getShanYuChoice(this.pendingSplit.T1, this.pendingSplit.T2, this.theta);
        this.selectTriangle(choice.keepIndex);
    }

    processMulanAiCut() {
        if (this.gameOver || this.pendingSplit) return;
        const bestCut = getMulanOptimalCut(this.currentTriangle, this.theta);
        if (bestCut) {
            this.executeCut(bestCut.edgeIndex, bestCut.t);
        }
    }

    undo() {
        if (this.history.length === 0) return;
        const last = this.history.pop();
        this.currentTriangle = last.prevTriangle;
        this.pendingSplit = null;
        this.gameOver = false;
        this.winner = null;
        this.stepCount--;

        if (this.onStateChange) this.onStateChange();
    }
}

/**
 * Returns a neutral opening triangle whose angles avoid θ and its integer multiples.
 * Explicit teaching presets intentionally bypass this helper.
 */
function getChallengingInitialTriangle(theta) {
    const challengingTriangle = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 4.54, y: 6.99 }
    ];
    const hasImmediateMultiple = calculateTriangleAngles(challengingTriangle)
        .some(angle => checkAngleSafety(angle.angle, theta).isUnsafe);

    if (!hasImmediateMultiple) return challengingTriangle;

    // Fallback for an unusual user-entered θ that collides with the main layout.
    return [{ x: 0, y: 0 }, { x: 9, y: 0 }, { x: 2.71, y: 7.83 }];
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaperTriangleGame, getChallengingInitialTriangle };
}
