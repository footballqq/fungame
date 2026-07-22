// codex: 2026-07-22 Verify victory recording, keyboard P angles, dynamic demos, labels, snapping, and strategy.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.join(__dirname, '..');
const sourceFiles = ['geometry.js', 'ai.js', 'game.js', 'guide.js', 'demo.js', 'renderer.js'];
const source = sourceFiles.map(fileName =>
    fs.readFileSync(path.join(projectRoot, 'js', fileName), 'utf8')
).join('\n');
const sandbox = {
    console,
    Math,
    setInterval,
    clearInterval,
    setTimeout: () => 0,
    window: { devicePixelRatio: 1, addEventListener() {} },
    ResizeObserver: undefined
};
vm.createContext(sandbox);
vm.runInContext(`${source}\nglobalThis.frontendApi = { splitTriangle, calculateTriangleAngles, calculateCutPointAngles, calculateCutVertexAngles, snapCutParameter, findCutParameterForPointAngle, roundAngleForDisplay, formatAngleForDisplay, checkAngleSafety, hasExactThetaAngle, isTriangleSafe, getShanYuChoice, getMulanOptimalCut, PaperTriangleGame, getChallengingInitialTriangle, GameGuide, ProblemDemoPlayer, TriangleRenderer, getCanvasPointFromClient, getInteriorArcGeometry, getAngleAnnotationLayout, getCutPointAngleLabels, getPendingSplitPresentation, orientVerticesForDisplay };`, sandbox);

const {
    splitTriangle,
    calculateTriangleAngles,
    calculateCutPointAngles,
    calculateCutVertexAngles,
    snapCutParameter,
    findCutParameterForPointAngle,
    roundAngleForDisplay,
    formatAngleForDisplay,
    checkAngleSafety,
    hasExactThetaAngle,
    isTriangleSafe,
    getShanYuChoice,
    getMulanOptimalCut,
    PaperTriangleGame,
    getChallengingInitialTriangle,
    GameGuide,
    ProblemDemoPlayer,
    TriangleRenderer,
    getCanvasPointFromClient,
    getInteriorArcGeometry,
    getAngleAnnotationLayout,
    getCutPointAngleLabels,
    getPendingSplitPresentation,
    orientVerticesForDisplay
} = sandbox.frontendApi;

function testOddNWinningStrategy() {
    const theta = 60;
    const initialTriangle = [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 2, y: 5 }];
    const altitudeCut = getMulanOptimalCut(initialTriangle, theta);
    const [firstTriangle, secondTriangle] = splitTriangle(
        initialTriangle,
        altitudeCut.edgeIndex,
        altitudeCut.P
    );
    const keptIndex = getShanYuChoice(firstTriangle, secondTriangle, theta).keepIndex;
    const rightTriangle = keptIndex === 0 ? firstTriangle : secondTriangle;

    assert(
        calculateTriangleAngles(rightTriangle).some(angle => Math.abs(angle.angle - 90) < 1e-4),
        'θ=60° 的第一步应得到直角三角形'
    );

    const forcingCut = getMulanOptimalCut(rightTriangle, theta);
    const [choiceOne, choiceTwo] = splitTriangle(
        rightTriangle,
        forcingCut.edgeIndex,
        forcingCut.P
    );
    assert(!isTriangleSafe(choiceOne, theta), '第一种选择必须含有 θ 的整数倍角');
    assert(!isTriangleSafe(choiceTwo, theta), '第二种选择必须含有 θ 的整数倍角');
}

function testDemoFinalCutProducesTargetAngle() {
    const demo = new ProblemDemoPlayer({ render() {} }, 45);
    const finalStep = demo.demoSteps[4];
    const edgeStart = finalStep.triangle[finalStep.cut.edgeIndex];
    const edgeEnd = finalStep.triangle[(finalStep.cut.edgeIndex + 1) % 3];
    const cutPoint = {
        x: edgeStart.x + (edgeEnd.x - edgeStart.x) * finalStep.cut.t,
        y: edgeStart.y + (edgeEnd.y - edgeStart.y) * finalStep.cut.t
    };
    const [choiceOne, choiceTwo] = splitTriangle(
        finalStep.triangle,
        finalStep.cut.edgeIndex,
        cutPoint
    );
    assert(hasExactThetaAngle(choiceOne, 45), '演示第 5 步的第一块必须含 45°');
    assert(hasExactThetaAngle(choiceTwo, 45), '演示第 5 步的第二块必须含 45°');
}

function testDemoFirstStepRendersInitialTriangle() {
    let renderedTriangle = null;
    const demo = new ProblemDemoPlayer({
        render(triangle) { renderedTriangle = triangle; }
    }, 45);
    demo.renderCurrentStep();
    assert.strictEqual(renderedTriangle.length, 3);
    assert.deepStrictEqual(
        JSON.parse(JSON.stringify(renderedTriangle)),
        [{ x: 2, y: 5 }, { x: 0, y: 0 }, { x: 8, y: 0 }]
    );
}

function testBothWinningChoicesResolveImmediately() {
    const game = new PaperTriangleGame();
    game.init(45, [{ x: 2, y: 5 }, { x: 0, y: 0 }, { x: 2, y: 0 }], 'shanyu');
    assert(game.executeCut(0, 5 / 7));
    assert.strictEqual(game.gameOver, true);
    assert.strictEqual(game.winner, 'mulan');
    assert.strictEqual(game.pendingSplit, null);
    assert.strictEqual(game.history[0].forcedWin, true);
}

function testKeptTargetAngleRecordsMulanWin() {
    const game = new PaperTriangleGame();
    const triangle = [{ x: 2, y: 5 }, { x: 0, y: 0 }, { x: 8, y: 0 }];
    const cutT = findCutParameterForPointAngle(triangle, 1, 0.5, 45, 'angleP1');
    game.init(45, triangle, 'sandbox');
    assert(game.executeCut(1, cutT));
    assert.notStrictEqual(game.pendingSplit, null);
    game.selectTriangle(0);
    assert.strictEqual(game.gameOver, true);
    assert.strictEqual(game.winner, 'mulan');
    assert.strictEqual(game.history[0].result, 'mulan-win');
}

function testGuideProvidesCompleteTeachingPath() {
    const guide = new GameGuide();
    assert.strictEqual(guide.steps.length, 6);
    assert.deepStrictEqual(
        JSON.parse(JSON.stringify(guide.steps.map(step => step.id))),
        ['cut-map', 'concept', 'altitude', 'reduction', 'counterexample', 'practice']
    );
    assert(guide.steps.every(step => step.presetTriangle.length === 3));
    const constructionStep = guide.steps.find(step => step.id === 'reduction');
    const constructionAngles = calculateTriangleAngles(constructionStep.presetTriangle);
    assert(Math.abs(constructionAngles[0].angle - 90) < 1e-10);
    assert(constructionAngles[1].angle <= 45);
}

function testPointerCoordinateNormalization() {
    const point = getCanvasPointFromClient(
        410,
        230,
        { left: 10, top: 30, width: 800, height: 400 },
        400,
        200
    );
    assert.strictEqual(point.x, 200);
    assert.strictEqual(point.y, 100);
}

function testArcUsesCalculatedInteriorAngle() {
    const degrees = value => value * Math.PI / 180;
    const arc = getInteriorArcGeometry(degrees(170), degrees(-80), 110);
    assert(Math.abs((arc.endAngle - arc.startAngle) - degrees(110)) < 1e-10);
    assert(Math.abs(arc.midAngle - degrees(225)) < 1e-10);
}

function testSplitAngleLabelsUseSeparatedArrowLayouts() {
    const center = { x: 120, y: 160 };
    const arc = getInteriorArcGeometry(0, Math.PI / 2, 90);
    const first = getAngleAnnotationLayout(center, arc, 44, 0);
    const second = getAngleAnnotationLayout(center, arc, 62, 1);
    const firstLeaderLength = Math.hypot(
        first.label.x - first.anchor.x,
        first.label.y - first.anchor.y
    );
    const secondLeaderLength = Math.hypot(
        second.label.x - second.anchor.x,
        second.label.y - second.anchor.y
    );
    assert(firstLeaderLength > 45, '角度文字应通过足够长的引线远离顶点');
    assert(secondLeaderLength > 45, '第二个角度文字应通过足够长的引线远离顶点');
    assert(
        Math.hypot(first.label.x - second.label.x, first.label.y - second.label.y) > 35,
        '相邻的分割角标签应错开，避免重叠'
    );
}

function testAnnotationPlacementAvoidsExistingLabels() {
    const context = {
        setTransform() {},
        measureText(text) { return { width: text.length * 7 }; }
    };
    const canvas = {
        parentElement: { clientWidth: 800, clientHeight: 500 },
        getContext() { return context; },
        style: {}
    };
    const renderer = new TriangleRenderer(canvas);
    renderer.beginAnnotationLayout([{ x: 400, y: 250 }]);
    const first = renderer.placeAnnotation('∠P₁(A侧): 97.8°', { x: 400, y: 250 }, 0, 70);
    const second = renderer.placeAnnotation('∠P₂(B侧): 82.2°', { x: 400, y: 250 }, 0, 70);
    const boxesOverlap = first.box.x < second.box.x + second.box.width + 8 &&
        first.box.x + first.box.width + 8 > second.box.x &&
        first.box.y < second.box.y + second.box.height + 8 &&
        first.box.y + first.box.height + 8 > second.box.y;
    assert.strictEqual(boxesOverlap, false, '相邻标注必须自动错开并保留间隔');
}

function testCutPointAngleLabelsMatchTheirEdgeSides() {
    assert.strictEqual(getCutPointAngleLabels(0).angleP1, '∠P₁(靠A)');
    assert.strictEqual(getCutPointAngleLabels(0).angleP2, '∠P₂(靠B)');
    assert.strictEqual(getCutPointAngleLabels(1).angleP1, '∠P₁(靠B)');
    assert.strictEqual(getCutPointAngleLabels(1).angleP2, '∠P₂(靠C)');
}

function testCutVertexAnglesSumToOriginalAngle() {
    const triangle = [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 2, y: 5 }];
    const splitAngles = calculateCutVertexAngles(triangle, 1, 0.6);
    const originalAngle = calculateTriangleAngles(triangle)[splitAngles.vertexIndex].angle;
    assert(Math.abs(splitAngles.angleV1 + splitAngles.angleV2 - originalAngle) < 1e-10);
}

function testPendingSplitPresentationUsesDistinctChoiceColors() {
    const presentations = getPendingSplitPresentation();
    assert.strictEqual(presentations.length, 2);
    assert.strictEqual(presentations[0].label, 'T₁ 绿色候选');
    assert.strictEqual(presentations[1].label, 'T₂ 红色候选');
    assert.notStrictEqual(presentations[0].fillColor, presentations[1].fillColor);
}

function testCutSnapsToExactRightAngle() {
    const triangle = [{ x: 2, y: 5 }, { x: 0, y: 0 }, { x: 8, y: 0 }];
    const snapped = snapCutParameter(triangle, 1, 0.252, [90], 0.02);
    assert.strictEqual(snapped.targetAngle, 90);
    assert(Math.abs(snapped.t - 0.25) < 1e-8);
}

function testCutPointAngleCanAdjustByOneTenthDegree() {
    const triangle = [{ x: 2, y: 5 }, { x: 0, y: 0 }, { x: 8, y: 0 }];
    const initialT = 0.4;
    const initialAngle = calculateCutPointAngles(triangle, 1, initialT).angleP1;
    const adjustedT = findCutParameterForPointAngle(
        triangle,
        1,
        initialT,
        initialAngle + 0.1,
        'angleP1'
    );
    const adjustedAngle = calculateCutPointAngles(triangle, 1, adjustedT).angleP1;
    assert(Math.abs(adjustedAngle - initialAngle - 0.1) < 1e-8);
}

function testDisplayedTargetAngleIsRecognizedAsTarget() {
    const safety = checkAngleSafety(36.04, 36);
    assert.strictEqual(safety.isExactTheta, true);
    assert.strictEqual(safety.isUnsafe, true);
    const displayedTargetRadians = 36.04 * Math.PI / 180;
    assert.strictEqual(hasExactThetaAngle(
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, {
            x: Math.cos(displayedTargetRadians),
            y: Math.sin(displayedTargetRadians)
        }],
        36
    ), true);
}

function testAngleHistoryAndJudgmentShareOneDecimalRounding() {
    assert.strictEqual(formatAngleForDisplay(17.94), '17.9');
    assert.strictEqual(formatAngleForDisplay(17.95), '18.0');
    assert.strictEqual(roundAngleForDisplay(17.95), 18);
    assert.strictEqual(checkAngleSafety(17.94, 18).isExactTheta, false);
    assert.strictEqual(checkAngleSafety(17.95, 18).isExactTheta, true);

    const mainSource = fs.readFileSync(path.join(projectRoot, 'js', 'main.js'), 'utf8');
    assert(mainSource.includes('.map(angle => formatAngleForDisplay(angle.angle) + \'°\')'));
    assert.strictEqual(mainSource.includes('.map(angle => angle.angle.toFixed(0)'), false);
}

function testDisplayOrientationKeepsLongestEdgeHorizontal() {
    const triangle = [{ x: 0, y: 0 }, { x: 0.5, y: 5 }, { x: 0, y: 10 }];
    const oriented = orientVerticesForDisplay(triangle);
    assert(Math.abs(oriented[2].y - oriented[0].y) < 1e-10);
    const originalDistance = Math.hypot(
        triangle[2].x - triangle[0].x,
        triangle[2].y - triangle[0].y
    );
    const orientedDistance = Math.hypot(
        oriented[2].x - oriented[0].x,
        oriented[2].y - oriented[0].y
    );
    assert(Math.abs(originalDistance - orientedDistance) < 1e-10);
}

function testExecutedCutPreservesPVertexIdentity() {
    const game = new PaperTriangleGame();
    game.init(45, [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 2, y: 5 }], 'sandbox');
    assert(game.executeCut(1, 0.4));
    assert.strictEqual(game.pendingSplit.T1[1].isCutPoint, true);
    assert.strictEqual(game.pendingSplit.T2[0].isCutPoint, true);
}

function testDemoAdaptsToValidAndInvalidTheta() {
    const demo = new ProblemDemoPlayer({ render() {} }, 36);
    assert.strictEqual(demo.demoSteps.length, 5);
    assert(demo.demoSteps[4].title.includes('2θ'));
    assert.notStrictEqual(demo.demoSteps[4].cut, null);

    demo.setTheta(50);
    assert.strictEqual(demo.demoSteps.length, 4);
    assert.strictEqual(demo.demoSteps[3].cut, null);
}

function testQuickThetaPresetsContainEightWinningAndTwoDefensiveChoices() {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const presetSection = html.match(/<div class="preset-buttons">([\s\S]*?)<\/div>/);
    assert(presetSection, '应提供快速设置角度区域');
    const presetValues = [...presetSection[1].matchAll(/data-theta="([\d.]+)"/g)]
        .map(match => Number(match[1]));
    assert.strictEqual(presetValues.length, 10, '快速设置应恰有十个选项');

    const winningCount = presetValues.filter(theta => {
        const n = Math.round(180 / theta);
        return n >= 2 && Math.abs(180 / n - theta) < 1e-8;
    }).length;
    assert.strictEqual(winningCount, 8, '应有八个 θ=180°/n 的木兰必胜选项');
    assert.strictEqual(presetValues.includes(22.5), true, '应包含小数必胜角 22.5°');
    assert.strictEqual(presetValues.includes(50.5), true, '应包含小数防守角 50.5°');
    assert.strictEqual(presetValues.includes(37.5), true, '应包含小数防守角 37.5°');
}

function testCanvasKeepsKeyboardFocusForCutAdjustments() {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const mainSource = fs.readFileSync(path.join(projectRoot, 'js', 'main.js'), 'utf8');
    assert(
        html.includes('id="geo-canvas" tabindex="0"'),
        '主画布应可获得键盘焦点'
    );
    assert(mainSource.includes("canvas.addEventListener('pointerenter', focusCutCanvas)"));
    assert(mainSource.includes('document.activeElement !== canvas'));
}

function testKeyboardHintExplainsAngleDirectionWithoutFalseRotationClaim() {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const mainSource = fs.readFileSync(path.join(projectRoot, 'js', 'main.js'), 'utf8');
    assert(html.includes('id="cut-keyboard-hint"'));
    assert(html.includes('← 减少 ∠P₁ 0.1°'));
    assert(html.includes('→ 增加 ∠P₁ 0.1°'));
    assert(html.includes('顺/逆时针方向会随所选边变化'));
    assert(
        html.indexOf('id="cut-keyboard-hint"') <
        html.indexOf('<div class="canvas-container">'),
        '快捷键提示应位于画布容器外侧，不能遮挡三角形'
    );
    assert(mainSource.includes('function updateCutKeyboardHint(angle = null)'));
}

function testResetOpeningAvoidsImmediateThetaMultiples() {
    const game = new PaperTriangleGame();
    game.init(36, null, 'mulan');
    const openingAngles = calculateTriangleAngles(game.currentTriangle);
    assert.strictEqual(
        openingAngles.some(angle => checkAngleSafety(angle.angle, 36).isUnsafe),
        false,
        'θ=36° 的重置局面不应直接含有 36°、72° 等危险倍数角'
    );
    assert.strictEqual(hasExactThetaAngle(game.currentTriangle, 36), false);
    assert.deepStrictEqual(
        game.currentTriangle,
        getChallengingInitialTriangle(36),
        '重置应使用高难度初始三角形'
    );
}

testOddNWinningStrategy();
testDemoFinalCutProducesTargetAngle();
testDemoFirstStepRendersInitialTriangle();
testBothWinningChoicesResolveImmediately();
testKeptTargetAngleRecordsMulanWin();
testGuideProvidesCompleteTeachingPath();
testPointerCoordinateNormalization();
testArcUsesCalculatedInteriorAngle();
testSplitAngleLabelsUseSeparatedArrowLayouts();
testAnnotationPlacementAvoidsExistingLabels();
testCutPointAngleLabelsMatchTheirEdgeSides();
testCutVertexAnglesSumToOriginalAngle();
testPendingSplitPresentationUsesDistinctChoiceColors();
testCutSnapsToExactRightAngle();
testCutPointAngleCanAdjustByOneTenthDegree();
testDisplayedTargetAngleIsRecognizedAsTarget();
testAngleHistoryAndJudgmentShareOneDecimalRounding();
testDisplayOrientationKeepsLongestEdgeHorizontal();
testExecutedCutPreservesPVertexIdentity();
testDemoAdaptsToValidAndInvalidTheta();
testQuickThetaPresetsContainEightWinningAndTwoDefensiveChoices();
testCanvasKeepsKeyboardFocusForCutAdjustments();
testKeyboardHintExplainsAngleDirectionWithoutFalseRotationClaim();
testResetOpeningAvoidsImmediateThetaMultiples();
console.log('JavaScript frontend regression tests passed.');
