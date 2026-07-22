// codex: 2026-07-22 Keep P keyboard controls focused and reliable after pointer selection.
/**
 * Main entry point initializing game, renderer, guide, demo player, size selector, and user interactions.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Instances
    const canvas = document.getElementById('geo-canvas');
    const demoCanvas = document.getElementById('demo-canvas');

    const renderer = new TriangleRenderer(canvas);
    const demoRenderer = new TriangleRenderer(demoCanvas);

    const game = new PaperTriangleGame();
    const guide = new GameGuide();
    const demoPlayer = new ProblemDemoPlayer(demoRenderer, 45);

    // 2. DOM Elements
    const thetaSlider = document.getElementById('theta-slider');
    const thetaDisplay = document.getElementById('theta-val-display');
    const ratioStatusText = document.getElementById('ratio-status-text');
    const modeTabs = document.querySelectorAll('.tab-btn');
    const statusBadge = document.getElementById('game-status-badge');
    const stepCounter = document.getElementById('step-counter');
    const anglesInspector = document.getElementById('angles-inspector-card');
    const historyContainer = document.getElementById('history-list-container');
    const choiceOverlay = document.getElementById('choice-overlay');
    const chooseT1Btn = document.getElementById('choose-t1-btn');
    const chooseT2Btn = document.getElementById('choose-t2-btn');
    const winDialog = document.getElementById('win-dialog');
    const winDialogMessage = document.getElementById('win-dialog-message');
    const winDialogCloseBtn = document.getElementById('win-dialog-close-btn');
    const winDialogResetBtn = document.getElementById('win-dialog-reset-btn');

    const mainSidebar = document.getElementById('main-control-sidebar');
    const mainViewport = document.getElementById('main-viewport-panel');
    const mainInfoSidebar = document.getElementById('main-info-sidebar');
    const inspectorSection = document.getElementById('inspector-section');
    const guideSection = document.getElementById('guide-section');
    const demoContainer = document.getElementById('demo-mode-container');

    // Demo Controls DOM
    const demoPlayBtn = document.getElementById('demo-play-btn');
    const demoPrevBtn = document.getElementById('demo-prev-btn');
    const demoNextBtn = document.getElementById('demo-next-btn');
    const demoResetBtn = document.getElementById('demo-reset-btn');
    const demoStepTitle = document.getElementById('demo-step-title');
    const demoStepDesc = document.getElementById('demo-step-desc');
    const demoStepBadge = document.getElementById('demo-step-badge');
    const demoThetaIndicator = document.getElementById('demo-theta-indicator');
    const cutKeyboardHint = document.getElementById('cut-keyboard-hint');

    // Prevent default drag/selection on canvas elements
    [canvas, demoCanvas].forEach(c => {
        if (!c) return;
        c.addEventListener('dragstart', (e) => e.preventDefault());
        c.addEventListener('selectstart', (e) => e.preventDefault());
    });

    // 3. Render Update Function
    function updateUI() {
        const ratioInfo = isIntegerRatioTheta(game.theta);
        thetaDisplay.textContent = `${game.theta.toFixed(1)}°`;
        thetaSlider.value = game.theta;

        if (ratioInfo.isValid) {
            ratioStatusText.innerHTML = `180° / ${game.theta.toFixed(1)}° = <strong>n = ${ratioInfo.n}</strong> (整数！木兰必胜 🎉)`;
            ratioStatusText.parentElement.className = 'success-box';
        } else {
            const ratioVal = (180.0 / game.theta).toFixed(2);
            ratioStatusText.innerHTML = `180° / ${game.theta.toFixed(1)}° = <strong>${ratioVal}</strong> (非整数！单于可防守 🛡️)`;
            ratioStatusText.parentElement.className = 'warn-box';
        }

        stepCounter.textContent = game.stepCount;
        if (game.gameOver && game.winner === 'mulan') {
            statusBadge.className = 'status-badge status-win';
            statusBadge.innerHTML = '🏆 绝杀！木兰获得了含有 θ 目标角的三角形，木兰获胜！';
        } else {
            statusBadge.className = 'status-badge status-ongoing';
            statusBadge.innerHTML = `🎮 游戏进行中 (第 <strong>${game.stepCount}</strong> 步)`;
        }

        const lastHistoryItem = game.history[game.history.length - 1];
        if (game.gameOver && game.winner === 'mulan') {
            const forcedWin = lastHistoryItem?.result === 'mulan-forced-win';
            winDialogMessage.textContent = forcedWin
                ? '两块候选三角形都含有目标角 θ。单于无论保留哪一块，木兰都获胜！'
                : '单于保留的三角形已经含有目标角 θ，游戏结束。';
            winDialog.style.display = 'flex';
        } else {
            winDialog.style.display = 'none';
        }

        const currentAngles = calculateTriangleAngles(game.currentTriangle);
        anglesInspector.innerHTML = currentAngles.map(a => {
            const safety = checkAngleSafety(a.angle, game.theta);
            let tag = '<span class="highlight-safe">安全角</span>';
            if (safety.isExactTheta) tag = '<span style="color: var(--accent-gold); font-weight: bold;">🎯 目标角 θ!</span>';
            else if (safety.isUnsafe) tag = `<span class="highlight-unsafe">⚠️ ${safety.k}θ 危险倍数角</span>`;

            return `
                <div class="glass-panel" style="padding: 8px 12px; font-size: 0.88rem; display: flex; justify-content: space-between; align-items: center;">
                    <strong>顶角 ${a.label}: ${formatAngleForDisplay(a.angle)}°</strong>
                    <div>${tag}</div>
                </div>
            `;
        }).join('');

        historyContainer.innerHTML = game.history.slice().reverse().map(item => {
            const keptAngles = calculateTriangleAngles(item.keptTriangle)
                .map(angle => formatAngleForDisplay(angle.angle) + '°')
                .join(', ');
            const resultText = item.result === 'mulan-forced-win'
                ? '🏆 强制胜局：两种选择都含 θ，木兰获胜！'
                : item.result === 'mulan-win'
                    ? '🏆 木兰获胜：保留的三角形含 θ。'
                    : `单于保留了包含角度 ${keptAngles} 的三角形`;
            return `
                <div class="history-item">
                    <div style="font-weight: 600; color: var(--accent-cyan);">第 ${item.step} 步剪切</div>
                    <div>${resultText}</div>
                </div>
            `;
        }).join('');

        if (game.pendingSplit && game.mode === 'shanyu') {
            choiceOverlay.style.display = 'flex';
            const formatChoiceInfo = triangle => {
                const angleText = calculateTriangleAngles(triangle)
                    .map(angle => formatAngleForDisplay(angle.angle) + '°')
                    .join(', ');
                return hasExactThetaAngle(triangle, game.theta)
                    ? `内角: ${angleText} · 🎯 保留即木兰获胜`
                    : `内角: ${angleText} · 可继续防守`;
            };
            document.getElementById('t1-angle-info').textContent = formatChoiceInfo(game.pendingSplit.T1);
            document.getElementById('t2-angle-info').textContent = formatChoiceInfo(game.pendingSplit.T2);
        } else {
            choiceOverlay.style.display = 'none';
        }

        renderer.render(game.currentTriangle, game.theta, {
            enableCutHover: !game.gameOver && !game.pendingSplit,
            pendingSplit: game.pendingSplit
        });
    }

    game.onStateChange = updateUI;
    winDialogCloseBtn?.addEventListener('click', () => {
        winDialog.style.display = 'none';
    });
    winDialogResetBtn?.addEventListener('click', () => {
        game.init(game.theta, null, game.mode);
    });
    renderer.onResize = () => {
        if (mainViewport.style.display !== 'none') updateUI();
    };
    demoRenderer.onResize = () => {
        if (demoContainer.style.display !== 'none') {
            demoPlayer.renderCurrentStep(updateDemoStepInfo);
        }
    };

    // 4. Size Selector Controls (Small / Medium / Large / Extra Large)
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const size = btn.dataset.size;
            document.body.className = `zoom-${size}`;

            requestAnimationFrame(() => {
                renderer.resize();
                renderer.render(game.currentTriangle, game.theta);
                demoRenderer.resize();
                demoPlayer.renderCurrentStep(updateDemoStepInfo);
            });
        });
    });

    // 5. Interaction Events
    thetaSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        game.setTheta(val);
    });

    document.querySelectorAll('.preset-buttons .btn-chip[data-theta]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.preset-buttons .btn-chip[data-theta]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const theta = parseFloat(btn.dataset.theta);
            game.setTheta(theta);
        });
    });

    document.getElementById('tri-preset-right')?.addEventListener('click', () => game.init(game.theta, [ {x: 0, y: 0}, {x: 6, y: 0}, {x: 0, y: 5} ], game.mode));
    document.getElementById('tri-preset-scalene')?.addEventListener('click', () => game.init(game.theta, [ {x: 0, y: 0}, {x: 10, y: 0}, {x: 1, y: 3} ], game.mode));
    document.getElementById('tri-preset-acute')?.addEventListener('click', () => game.init(game.theta, [ {x: 0, y: 0}, {x: 8, y: 0}, {x: 3, y: 7} ], game.mode));
    document.getElementById('tri-preset-reset')?.addEventListener('click', () => game.init(game.theta, null, game.mode));

    // Mode Switcher with Canvas Re-measurement
    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.dataset.mode;

            if (mode === 'demo') {
                demoPlayer.setTheta(game.theta);
                mainSidebar.style.display = 'none';
                mainViewport.style.display = 'none';
                mainInfoSidebar.style.display = 'none';
                demoContainer.style.display = 'grid';

                renderDemoWhenVisible();
            } else {
                mainSidebar.style.display = 'flex';
                mainViewport.style.display = 'flex';
                mainInfoSidebar.style.display = 'flex';
                demoContainer.style.display = 'none';

                requestAnimationFrame(() => {
                    renderer.resize();
                    if (mode === 'sandbox') {
                        inspectorSection.style.display = 'none';
                        guideSection.style.display = 'block';
                        renderer.render(game.currentTriangle, game.theta, {
                            enableCutHover: !game.gameOver && !game.pendingSplit,
                            pendingSplit: game.pendingSplit
                        });
                        guide.renderCurrentStep(guideSection, (presetTheta, presetTriangle) => {
                            game.init(presetTheta, presetTriangle, 'sandbox');
                        });
                    } else {
                        inspectorSection.style.display = 'block';
                        guideSection.style.display = 'none';
                        game.setMode(mode);
                    }
                });
            }
        });
    });

    // Demo Animation Event Listeners
    function updateDemoStepInfo(step, idx, total) {
        if (!step) return;
        demoStepTitle.textContent = step.title;
        demoStepDesc.textContent = step.description;
        demoStepBadge.textContent = `步骤 ${idx + 1} / ${total}`;
        demoThetaIndicator.textContent = `θ = ${demoPlayer.theta.toFixed(1)}°`;
    }

    function renderDemoWhenVisible(attempt = 0) {
        requestAnimationFrame(() => {
            if (demoCanvas.clientWidth === 0 || demoCanvas.clientHeight === 0) {
                if (attempt < 2) renderDemoWhenVisible(attempt + 1);
                return;
            }
            demoRenderer.resize();
            demoPlayer.renderCurrentStep(updateDemoStepInfo);
        });
    }

    demoPlayBtn?.addEventListener('click', () => {
        if (demoPlayer.isPlaying) {
            demoPlayer.pause();
            demoPlayBtn.innerHTML = '▶️ 播放演示动画';
        } else {
            demoPlayer.play(updateDemoStepInfo);
            demoPlayBtn.innerHTML = '⏸️ 暂停演示动画';
        }
    });

    demoNextBtn?.addEventListener('click', () => demoPlayer.next(updateDemoStepInfo));
    demoPrevBtn?.addEventListener('click', () => demoPlayer.prev(updateDemoStepInfo));
    demoResetBtn?.addEventListener('click', () => {
        demoPlayer.reset(updateDemoStepInfo);
        demoPlayBtn.innerHTML = '▶️ 播放演示动画';
    });

    // Control Buttons
    document.getElementById('undo-btn')?.addEventListener('click', () => game.undo());
    document.getElementById('reset-game-btn')?.addEventListener('click', () => game.init(game.theta, null, game.mode));

    document.getElementById('ai-cut-hint-btn')?.addEventListener('click', () => {
        const hint = getMulanOptimalCut(game.currentTriangle, game.theta);
        if (hint) game.executeCut(hint.edgeIndex, hint.t);
    });

    document.getElementById('altitude-cut-btn')?.addEventListener('click', () => {
        const angles = calculateTriangleAngles(game.currentTriangle);
        let maxVertexIdx = 0;
        let maxAngle = angles[0].angle;
        for (let i = 1; i < 3; i++) {
            if (angles[i].angle > maxAngle) {
                maxAngle = angles[i].angle;
                maxVertexIdx = i;
            }
        }
        const alt = findAltitudeFoot(game.currentTriangle, maxVertexIdx);
        if (alt) game.executeCut(alt.edgeIndex, alt.t);
    });

    chooseT1Btn.addEventListener('click', () => game.selectTriangle(0));
    chooseT2Btn.addEventListener('click', () => game.selectTriangle(1));

    function getPointerPoint(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        return getCanvasPointFromClient(
            clientX,
            clientY,
            rect,
            renderer.width,
            renderer.height
        );
    }

    function snapHoveredCut(edgeIndex, t, scaledVertices) {
        const edgeStart = scaledVertices[edgeIndex];
        const edgeEnd = scaledVertices[(edgeIndex + 1) % 3];
        const edgeLength = Math.hypot(edgeEnd.x - edgeStart.x, edgeEnd.y - edgeStart.y);
        const snapped = snapCutParameter(
            game.currentTriangle,
            edgeIndex,
            t,
            [90, game.theta],
            Math.min(0.08, 16 / Math.max(edgeLength, 1))
        );
        renderer.hoverSnapAngle = snapped.targetAngle;
        return snapped.t;
    }

    let keyboardCut = null;

    function updateCutKeyboardHint(angle = null) {
        if (!cutKeyboardHint) return;
        const baseHint = '← 减少 ∠P₁ 0.1°　→ 增加 ∠P₁ 0.1°　空格执行切割';
        const directionHint = '数值方向固定；画面中的顺/逆时针方向会随所选边变化。';
        const currentAngle = angle === null ? '' :
            `　当前 ∠P₁：${formatAngleForDisplay(angle)}°`;
        cutKeyboardHint.innerHTML = `${baseHint}${currentAngle}<small>${directionHint}</small>`;
        cutKeyboardHint.classList.toggle('is-active', angle !== null);
    }

    function focusCutCanvas() {
        if (document.activeElement !== canvas) {
            canvas.focus({ preventScroll: true });
        }
    }

    function showKeyboardCut(edgeIndex, t) {
        const scaledVertices = renderer.getScaledVertices(game.currentTriangle);
        renderer.hoverEdgeIndex = edgeIndex;
        renderer.hoverT = t;
        renderer.hoverPoint = interpolatePoint(
            scaledVertices[edgeIndex],
            scaledVertices[(edgeIndex + 1) % 3],
            t
        );
        renderer.hoverSnapAngle = null;
        renderer.keyboardAngleTarget = calculateCutPointAngles(
            game.currentTriangle,
            edgeIndex,
            t
        ).angleP1;
        updateCutKeyboardHint(renderer.keyboardAngleTarget);
        renderer.render(game.currentTriangle, game.theta, { enableCutHover: true });
    }

    // Canvas Mouse Hover & Click Interaction with pan lock
    canvas.addEventListener('pointerenter', focusCutCanvas);
    canvas.addEventListener('pointerdown', focusCutCanvas);
    canvas.addEventListener('mousemove', (e) => {
        e.preventDefault();
        if (game.gameOver || game.pendingSplit) return;
        focusCutCanvas();
        const mouseP = getPointerPoint(e.clientX, e.clientY);

        const scaledVerts = renderer.getScaledVertices(game.currentTriangle);

        let minDistance = Infinity;
        let bestEdgeIndex = -1;
        let bestT = 0.5;
        let bestPoint = null;

        for (let i = 0; i < 3; i++) {
            const v0 = scaledVerts[i];
            const v1 = scaledVerts[(i + 1) % 3];
            const proj = projectPointToSegment(mouseP, v0, v1);
            if (proj.dist < minDistance) {
                minDistance = proj.dist;
                bestEdgeIndex = i;
                bestT = proj.t;
                bestPoint = proj.point;
            }
        }

        if (minDistance < 40) {
            renderer.hoverEdgeIndex = bestEdgeIndex;
            renderer.hoverT = snapHoveredCut(bestEdgeIndex, bestT, scaledVerts);
            renderer.hoverPoint = interpolatePoint(
                scaledVerts[bestEdgeIndex],
                scaledVerts[(bestEdgeIndex + 1) % 3],
                renderer.hoverT
            );
            keyboardCut = { edgeIndex: bestEdgeIndex, t: renderer.hoverT };
            renderer.keyboardAngleTarget = calculateCutPointAngles(
                game.currentTriangle,
                bestEdgeIndex,
                renderer.hoverT
            ).angleP1;
            updateCutKeyboardHint(renderer.keyboardAngleTarget);
        } else {
            renderer.hoverEdgeIndex = -1;
            renderer.hoverPoint = null;
            renderer.hoverSnapAngle = null;
            renderer.keyboardAngleTarget = null;
            updateCutKeyboardHint();
        }

        renderer.render(game.currentTriangle, game.theta, { enableCutHover: true });
    });

    canvas.addEventListener('click', (e) => {
        e.preventDefault();
        if (renderer.hoverEdgeIndex >= 0 && !game.gameOver && !game.pendingSplit) {
            game.executeCut(renderer.hoverEdgeIndex, renderer.hoverT);
        }
    });

    document.addEventListener('keydown', (e) => {
        const isArrowKey = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
        const isSpaceKey = e.code === 'Space' || e.key === ' ';
        if (!isArrowKey && !isSpaceKey) return;
        if (!keyboardCut || game.gameOver || game.pendingSplit) return;
        if (document.activeElement && document.activeElement !== document.body &&
            document.activeElement !== canvas) return;

        if (isSpaceKey) {
            e.preventDefault();
            game.executeCut(keyboardCut.edgeIndex, keyboardCut.t);
            return;
        }

        const currentAngle = calculateCutPointAngles(
            game.currentTriangle,
            keyboardCut.edgeIndex,
            keyboardCut.t
        ).angleP1;
        const targetAngle = Math.max(
            0.1,
            Math.min(179.9, currentAngle + (e.key === 'ArrowRight' ? 0.1 : -0.1))
        );
        const adjustedT = findCutParameterForPointAngle(
            game.currentTriangle,
            keyboardCut.edgeIndex,
            keyboardCut.t,
            targetAngle,
            'angleP1'
        );
        if (adjustedT === null) return;

        e.preventDefault();
        keyboardCut.t = adjustedT;
        showKeyboardCut(keyboardCut.edgeIndex, adjustedT);
    });

    // Touch support for Pad/Mobile with pan lock
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseP = getPointerPoint(touch.clientX, touch.clientY);
            const scaledVerts = renderer.getScaledVertices(game.currentTriangle);

            let minDistance = Infinity;
            let bestEdgeIndex = -1;
            let bestT = 0.5;

            for (let i = 0; i < 3; i++) {
                const v0 = scaledVerts[i];
                const v1 = scaledVerts[(i + 1) % 3];
                const proj = projectPointToSegment(mouseP, v0, v1);
                if (proj.dist < minDistance) {
                    minDistance = proj.dist;
                    bestEdgeIndex = i;
                    bestT = proj.t;
                }
            }

            if (minDistance < 60 && !game.gameOver && !game.pendingSplit) {
                const snappedT = snapHoveredCut(bestEdgeIndex, bestT, scaledVerts);
                keyboardCut = { edgeIndex: bestEdgeIndex, t: snappedT };
                game.executeCut(bestEdgeIndex, snappedT);
            }
        }
    }, { passive: false });

    // Initial setup
    game.init(45, null, 'mulan');
});
