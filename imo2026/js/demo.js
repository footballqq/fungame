// codex: 2026-07-22 Generate the rule demonstration from the current θ instead of fixing 45°.
/**
 * Interactive animated demo engine showing problem rules step-by-step with exact geometry.
 */
class ProblemDemoPlayer {
    constructor(renderer, theta = 45) {
        this.renderer = renderer;
        this.theta = theta;
        this.stepIndex = 0;
        this.isPlaying = false;
        this.timer = null;

        // Scripted Demo Steps with Exact Geometry Coordinates
        // Initial Triangle T: A(2, 5), B(0, 0), C(8, 0)
        // Angles: A = 72.0°, B = 68.2°, C = 39.8° (No 45° angle)
        this.demoSteps = [
            {
                title: "步骤 1：单于制作初始纸三角形 T",
                description: "初始时，单于任意制作一个指定尺寸的纸质三角形 T (内角 72.0°, 68.2°, 39.8°)。双方已知目标角度 θ = 45°。",
                triangle: [ {x: 2, y: 5}, {x: 0, y: 0}, {x: 8, y: 0} ], // A, B, C
                cut: null,
                discardIndex: null,
                status: "单于出题完成"
            },
            {
                title: "步骤 2：胜负检查条件",
                description: "检查三角形 T 的三个内角 (72.0°, 68.2°, 39.8°)。没有角度恰好等于 θ (45°)，因此游戏继续！",
                triangle: [ {x: 2, y: 5}, {x: 0, y: 0}, {x: 8, y: 0} ],
                cut: null,
                discardIndex: null,
                status: "无 45° 角，木兰准备剪切"
            },
            {
                title: "步骤 3：木兰起手式 ➔ 作顶点 A 降至底边 BC 的高线！",
                description: "木兰从顶点 A 向底边 BC 引垂线（高线 AP），在 P 点精准切出两个 90.0° 直角（即 2θ = 90° 危险倍数角）。",
                triangle: [ {x: 2, y: 5}, {x: 0, y: 0}, {x: 8, y: 0} ],
                // Edge BC is edgeIndex 1 (from B to C). P is (2, 0) which is at t = 2/8 = 0.25 on BC.
                cut: { edgeIndex: 1, t: 0.25 },
                discardIndex: null,
                status: "木兰沿着高线 AP 进行剪切，生成 90° 直角！"
            },
            {
                title: "步骤 4：单于抉择（弃一留一）",
                description: "单于弃置右侧三角形 △APC，保留左侧直角三角形 △APB (内角 90.0°, 68.2°, 21.8°)。剩下的 △APB 成为新的 T！",
                triangle: [ {x: 2, y: 5}, {x: 0, y: 0}, {x: 2, y: 0} ], // A, B, P
                cut: null,
                discardIndex: null,
                status: "单于保留包含 90° 直角的三角形 △APB"
            },
            {
                title: "步骤 5：木兰绝杀 ➔ 将 90° 直角 (2θ) 平分切出 45° 目标角！",
                description: "在新的直角三角形中，木兰从顶点 P(90°) 向对边 AB 剪切，将 90° 角一分为二切出 45.0° 目标角！单于无论怎么选，都将被逼出 45° 目标角，木兰获胜！",
                triangle: [ {x: 2, y: 5}, {x: 0, y: 0}, {x: 2, y: 0} ], // A, B, P
                // Cut from vertex P (index 2) to opposite edge AB (edgeIndex 0 from A to B)
                // Parameter t on AB to make angle at P 45°: t = 5 / 7.
                cut: { edgeIndex: 0, t: 5 / 7 },
                discardIndex: null,
                status: "木兰绝杀锁定 45° 目标角！"
            }
        ];
        this.setTheta(theta);
    }

    setTheta(theta) {
        this.pause();
        this.theta = theta;
        this.stepIndex = 0;
        this.demoSteps = this.createDemoSteps(theta);
    }

    createDemoSteps(theta) {
        const initialTriangle = [{ x: 2, y: 5 }, { x: 0, y: 0 }, { x: 8, y: 0 }];
        const retainedRightTriangle = [
            { x: 2, y: 5 }, { x: 0, y: 0 }, { x: 2, y: 0, isCutPoint: true }
        ];
        const thetaText = theta.toFixed(1);
        const ratioInfo = isIntegerRatioTheta(theta);
        const steps = [
            {
                title: '步骤 1：单于制作初始纸三角形 T',
                description: `初始三角形的内角为 72.0°、68.2°、39.8°。当前演示使用 θ = ${thetaText}°。`,
                triangle: initialTriangle,
                cut: null
            },
            {
                title: '步骤 2：检查是否已经出现目标角',
                description: `初始三角形没有 ${thetaText}° 角，因此木兰可以开始剪切。`,
                triangle: initialTriangle,
                cut: null
            },
            {
                title: '步骤 3：先作高线，得到直角三角形',
                description: '木兰从 A 向 BC 作高线 AP，P 点出现两个 90° 角。直角是后续构造的起点，但奇数 n 时它不一定是 θ 的整数倍。',
                triangle: initialTriangle,
                cut: { edgeIndex: 1, t: 0.25 }
            }
        ];

        if (!ratioInfo.isValid) {
            steps.push({
                title: '步骤 4：此 θ 没有保证必胜策略',
                description: `180° / ${thetaText}° 不是整数。单于可从全安全角三角形开始防守，因此本演示不虚构“必胜一刀”。可切换到 45°、36° 或 60° 查看保证必胜的构造。`,
                triangle: retainedRightTriangle,
                cut: null
            });
            return steps;
        }

        if (ratioInfo.n === 2) {
            steps.push({
                title: '步骤 4：直角就是目标角，木兰获胜',
                description: '此时 θ = 90°。高线已经产生目标角，游戏立即结束。',
                triangle: retainedRightTriangle,
                cut: null
            });
            return steps;
        }

        const finalCut = getMulanOptimalCut(retainedRightTriangle, theta);
        const k = Math.floor(45 / theta) + 1;
        steps.push({
            title: '步骤 4：单于保留一个直角三角形',
            description: '单于弃置另一块，保留含 90° 的直角三角形。木兰现在要让两种选择都进入整数倍角的必胜链。',
            triangle: retainedRightTriangle,
            cut: null
        });
        steps.push({
            title: `步骤 5：构造 ${k}θ 与 ${(ratioInfo.n - k)}θ 两条必胜分支`,
            description: `取 45° < ${k}θ = ${(k * theta).toFixed(1)}° ≤ 90°。木兰在斜边上选 P 并连 AP；两个候选分别含 ${k}θ 与 ${(ratioInfo.n - k)}θ，单于无论保留哪一块，木兰都可继续把倍数递减到 θ。`,
            triangle: retainedRightTriangle,
            cut: finalCut ? { edgeIndex: finalCut.edgeIndex, t: finalCut.t } : null
        });
        return steps;
    }

    renderCurrentStep(onStepChange) {
        const step = this.demoSteps[this.stepIndex];

        let previewCut = null;
        if (step.cut) {
            const v0 = step.triangle[step.cut.edgeIndex];
            const v1 = step.triangle[(step.cut.edgeIndex + 1) % 3];
            const P = interpolatePoint(v0, v1, step.cut.t);
            previewCut = { edgeIndex: step.cut.edgeIndex, t: step.cut.t, P };
        }

        this.renderer.render(step.triangle, this.theta, {
            previewCut: previewCut,
            enableCutHover: false
        });

        if (onStepChange) {
            onStepChange(step, this.stepIndex, this.demoSteps.length);
        }
    }

    play(onStepChange) {
        if (this.isPlaying) return;
        this.isPlaying = true;

        this.timer = setInterval(() => {
            if (this.stepIndex < this.demoSteps.length - 1) {
                this.stepIndex++;
                this.renderCurrentStep(onStepChange);
            } else {
                this.pause();
            }
        }, 2500);
    }

    pause() {
        this.isPlaying = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    next(onStepChange) {
        this.pause();
        if (this.stepIndex < this.demoSteps.length - 1) {
            this.stepIndex++;
            this.renderCurrentStep(onStepChange);
        }
    }

    prev(onStepChange) {
        this.pause();
        if (this.stepIndex > 0) {
            this.stepIndex--;
            this.renderCurrentStep(onStepChange);
        }
    }

    reset(onStepChange) {
        this.pause();
        this.stepIndex = 0;
        this.renderCurrentStep(onStepChange);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProblemDemoPlayer };
}
