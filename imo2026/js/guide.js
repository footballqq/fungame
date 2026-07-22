// codex: 2026-07-22 Provide a correct six-step IMO 2026 P4 interactive proof walkthrough.
/**
 * Interactive teaching guide that connects each proof step to a playable triangle.
 */
class GameGuide {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                id: 'cut-map',
                title: '① 一刀之后：切线两端的角如何变化？',
                content: `
                    <p>在边 <span class="math-sym">BC</span> 上选择切割点 <span class="math-sym">P</span> 并连接 <span class="math-sym">AP</span>。</p>
                    <ul>
                        <li>边界点 P：<code>∠P₁ + ∠P₂ = 180°</code>。</li>
                        <li>对顶点 A：<code>∠A₁ + ∠A₂ = ∠A</code>。</li>
                    </ul>
                    <p class="tip-box">加载示例后把鼠标移到边上。画布会同时标出 P 点与对顶点的两组分割角；这就是后续策略的局部几何基础。</p>
                `,
                presetTheta: 45,
                presetTriangle: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 2, y: 5 }]
            },
            {
                id: 'concept',
                title: '② 目标：什么是危险角？',
                content: `
                    <p>目标角是 <span class="math-sym">θ</span>。若某角等于 <code>kθ</code>（k 为正整数），称它为<strong class="highlight-unsafe">危险角</strong>；否则称为<strong class="highlight-safe">安全角</strong>。</p>
                    <p>危险角不一定立刻获胜：例如 <code>2θ</code> 还不是目标角。但它给木兰留下了可以继续递减的结构。</p>
                    <p class="tip-box">要获胜，木兰的关键不是“某一边出现 θ”，而是让单于无论保留哪一边，都无法逃离危险角链。</p>
                `,
                presetTheta: 60,
                presetTriangle: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 2, y: 5 }]
            },
            {
                id: 'altitude',
                title: '③ 必胜引理：kθ 可以递减到 θ',
                content: `
                    <p>若当前三角形已有 <code>kθ</code>（k &gt; 1），木兰从该顶点切出 <code>θ</code> 与 <code>(k−1)θ</code>。</p>
                    <ul>
                        <li>单于保留含 θ 的一边：木兰立即获胜。</li>
                        <li>单于避开它：剩余三角形仍含 <code>(k−1)θ</code>，下一轮继续。</li>
                    </ul>
                    <p class="success-box">因此 <code>kθ → (k−1)θ → … → 2θ → θ</code> 一定在有限步结束。</p>
                `,
                presetTheta: 45,
                presetTriangle: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 1, y: 3 }]
            },
            {
                id: 'reduction',
                title: '④ 起手构造：怎样让两种选择都进入必胜链？',
                content: `
                    <p>设 <code>θ = 180°/n</code>。先作高线得到直角三角形，令较小锐角为 <code>B ≤ 45°</code>。</p>
                    <ul>
                        <li><code>n=2</code>：θ=90°，高线立即创造目标角。</li>
                        <li><code>n≥3</code>：选择整数 k，使 <code>45° &lt; kθ ≤ 90°</code>。</li>
                        <li>在斜边 BC 上选 P，连 AP，使 <code>∠BAP = kθ−B</code>。</li>
                    </ul>
                    <p>此时两个候选分别有 <code>∠APC = kθ</code> 与 <code>∠APB = (n−k)θ</code>，所以两种选择都进入第 ③ 步的递减链。</p>
                    <p class="tip-box">本步加载的图形约定 <code>∠A = 90°</code>，因此 <code>BC</code> 才是斜边，且 <code>∠B ≤ 45°</code>；请先核对画布中的 A、B、C 标签。</p>
                    <p class="warn-box">注意：n 为奇数时 90° 不一定是 θ 的整数倍。例如 θ=36° 时应取 k=2，构造 72° 与 108°，不能直接平分 90°。</p>
                `,
                presetTheta: 36,
                presetTriangle: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 5 }]
            },
            {
                id: 'counterexample',
                title: '⑤ 反方向：何时单于可以永远防守？',
                content: `
                    <p>若 <code>θ ≠ 180°/n</code>，则 180° 不是 θ 的整数倍。单于可以一开始选择三个角全是安全角的三角形。</p>
                    <p>每次剪切后，两块不可能同时带有危险角；单于总能保留全安全角的一块。于是目标 θ 永远不会出现。</p>
                    <p class="warn-box">加载 θ=50° 示例并观察：虽然木兰可以不断尝试，但不存在对所有单于选择都有效的必胜切法。</p>
                `,
                presetTheta: 50,
                presetTriangle: [{ x: 0, y: 0 }, { x: 7, y: 0 }, { x: 3, y: 5 }]
            },
            {
                id: 'practice',
                title: '⑥ 动手验证：用 θ=36° 或 θ=60° 操作',
                content: `
                    <ol style="padding-left: 20px; display: flex; flex-direction: column; gap: 6px;">
                        <li>加载本步图形；可改用 θ=36° 或 θ=60°。</li>
                        <li>点击“快速做顶点高线剪切”，在单于选择中保留任一块。</li>
                        <li>点击“木兰最佳算法建议”，观察两种候选都被标出 θ 的整数倍角。</li>
                    </ol>
                    <p class="success-box">记住证明结构：先让两种选择都含整数倍角，再把倍数逐轮减到 1。</p>
                `,
                presetTheta: 60,
                presetTriangle: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 2, y: 5 }]
            }
        ];
    }

    renderCurrentStep(containerEl, onSelectPreset) {
        const step = this.steps[this.currentStep];
        containerEl.innerHTML = `
            <div class="guide-card glass-panel">
                <div class="guide-header">
                    <span class="guide-badge">步骤 ${this.currentStep + 1} / ${this.steps.length}</span>
                    <h3>${step.title}</h3>
                </div>
                <div class="guide-body">${step.content}</div>
                <div class="guide-footer">
                    <button class="btn btn-secondary" id="guide-prev-btn" ${this.currentStep === 0 ? 'disabled' : ''}>← 上一步</button>
                    <button class="btn btn-primary" id="guide-apply-btn">🎯 加载本步图形</button>
                    <button class="btn btn-secondary" id="guide-next-btn" ${this.currentStep === this.steps.length - 1 ? 'disabled' : ''}>下一步 →</button>
                </div>
            </div>
        `;

        document.getElementById('guide-prev-btn')?.addEventListener('click', () => {
            if (this.currentStep > 0) {
                this.currentStep--;
                this.renderCurrentStep(containerEl, onSelectPreset);
            }
        });
        document.getElementById('guide-next-btn')?.addEventListener('click', () => {
            if (this.currentStep < this.steps.length - 1) {
                this.currentStep++;
                this.renderCurrentStep(containerEl, onSelectPreset);
            }
        });
        document.getElementById('guide-apply-btn')?.addEventListener('click', () => {
            if (onSelectPreset) onSelectPreset(step.presetTheta, step.presetTriangle);
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameGuide };
}
