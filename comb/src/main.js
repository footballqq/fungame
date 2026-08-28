// codex: 2026-08-28 集成教学引导组件与双向参数联动，默认采用从易到难推荐模式 (DD)

import { MODELS } from './math.js';
import { TeachingManager } from './teaching.js';

let currentMode = 'DD';
let currentN = 2;
let currentM = 2;
let useAltRecurrence = false;
let distribution = [];
let teachingManager = null;

let nInput, mInput, nVal, mVal, matrixContainer, modeBtns, formulaCard, canvas, ctx, visualCard;

// Helper to safely get elements
const getEl = (id) => document.getElementById(id);
const queryAll = (sel) => document.querySelectorAll(sel);
const query = (sel) => document.querySelector(sel);

let matrixSize = window.innerWidth < 640 ? 7 : 10;

function init() {
    // 1. DOM selection
    nInput = getEl('n-input');
    mInput = getEl('m-input');
    nVal = getEl('n-val');
    mVal = getEl('m-val');
    matrixContainer = getEl('matrix-container');
    modeBtns = queryAll('.mode-btn');
    formulaCard = query('.formula-card');
    canvas = getEl('canvas');
    if (canvas) ctx = canvas.getContext('2d');
    visualCard = query('.visual-card');

    currentN = 2;
    currentM = 2;
    currentMode = 'DD';
    useAltRecurrence = false;

    // 2. 初始化教学引导控制器
    const teachingContainer = getEl('teaching-container');
    teachingManager = new TeachingManager({
        onSyncParams: (n, m) => {
            currentN = n;
            currentM = m;
            if (nInput) {
                nInput.value = n;
                if (nVal) nVal.textContent = n;
            }
            if (mInput) {
                mInput.value = m;
                if (mVal) mVal.textContent = m;
            }
            generateDistribution();
            updateUI();
        },
        onSwitchMode: (mode) => {
            switchMode(mode);
        }
    });

    if (teachingContainer) {
        teachingManager.mount(teachingContainer);
        teachingManager.setMode(currentMode);
    }

    // 3. Update DOM to match defaults
    if (nInput) {
        nInput.value = currentN;
        nInput.max = matrixSize;
    }
    if (mInput) {
        mInput.value = currentM;
        mInput.max = matrixSize;
    }
    if (nVal) nVal.textContent = currentN;
    if (mVal) mVal.textContent = currentM;

    // Reset button states
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === currentMode) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    // 4. Setup all interactions
    setupEventListeners();

    // 5. Initial render sequence
    generateDistribution();
    updateUI();

    // 6. Final polish after layout settles
    setTimeout(() => {
        resizeCanvas();
        updateUI();
    }, 100);
}

function switchMode(newMode, prevMode = null) {
    if (!MODELS[newMode]) return;
    const oldMode = prevMode || currentMode;
    currentMode = newMode;
    useAltRecurrence = false;

    modeBtns.forEach(b => {
        if (b.dataset.mode === currentMode) b.classList.add('active');
        else b.classList.remove('active');
    });

    if (teachingManager) {
        teachingManager.setMode(newMode, oldMode);
    }

    updateUI();
}

function setupEventListeners() {
    if (nInput) {
        nInput.addEventListener('input', (e) => {
            currentN = parseInt(e.target.value);
            if (nVal) nVal.textContent = currentN;
            generateDistribution();
            updateUI();
        });
    }

    if (mInput) {
        mInput.addEventListener('input', (e) => {
            currentM = parseInt(e.target.value);
            if (mVal) mVal.textContent = currentM;
            generateDistribution();
            updateUI();
        });
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newMode = btn.dataset.mode;
            if (newMode !== currentMode) {
                switchMode(newMode, currentMode);
            }
        });
    });

    // Toggle recurrence mode
    if (formulaCard) {
        formulaCard.addEventListener('click', () => {
            const model = MODELS[currentMode];
            if (model && model.formulaZh && model.formulaZh.includes('\n')) {
                useAltRecurrence = !useAltRecurrence;
                updateUI();
            }
        });
    }

    if (visualCard) {
        visualCard.addEventListener('click', () => {
            generateDistribution();
            drawVisualDemo();
        });
    }

    window.addEventListener('resize', () => {
        const newSize = window.innerWidth < 640 ? 7 : 10;
        if (newSize !== matrixSize) {
            matrixSize = newSize;
            if (nInput) nInput.max = matrixSize;
            if (mInput) mInput.max = matrixSize;
            if (currentN > matrixSize) {
                currentN = matrixSize;
                if (nInput) nInput.value = currentN;
                if (nVal) nVal.textContent = currentN;
            }
            if (currentM > matrixSize) {
                currentM = matrixSize;
                if (mInput) mInput.value = currentM;
                if (mVal) mVal.textContent = currentM;
            }
            generateDistribution();
            updateUI();
        }
        resizeCanvas();
    });

    if (nInput) nInput.max = matrixSize;
    if (mInput) mInput.max = matrixSize;

    resizeCanvas();
}

function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawVisualDemo();
}

function updateUI() {
    if (!currentMode || !MODELS[currentMode]) return;
    const model = MODELS[currentMode];

    // 1. Calculate values
    const resultData = model.calculate(matrixSize, matrixSize, useAltRecurrence);
    const matrix = resultData.matrix || resultData;
    const currentRes = matrix[currentN] ? matrix[currentN][currentM] : 0;

    // 2. Update explanations
    const formatString = (str) => {
        if (!str) return '';
        return str.replace(/{n}/g, currentN)
            .replace(/{m}/g, currentM)
            .replace(/{res}/g, currentRes);
    };

    const exZh = getEl('explanation-zh');
    const exEn = getEl('explanation-en');
    if (exZh) exZh.innerText = formatString(model.explainZh);
    if (exEn) exEn.innerText = formatString(model.explainEn);

    // 3. Update Formulas
    const rf = getEl('recurrence-formula');
    if (rf) {
        if (model.formulaZh.includes('\n')) {
            rf.style.cursor = 'pointer';
            rf.title = '点击切换递推演示 / Click to toggle recurrence demo';
            const lines = model.formulaZh.split('\n');
            const labels = model.modeLabels || [];
            rf.innerHTML = `<div class="${!useAltRecurrence ? 'active-formula' : ''}">${labels[0] ? `<b>${labels[0]}</b><br>` : ''}${lines[0]}</div>
                            <div class="${useAltRecurrence ? 'active-formula' : ''}">${labels[1] ? `<b>${labels[1]}</b><br>` : ''}${lines[1]}</div>`;
        } else {
            rf.innerHTML = model.formulaZh.replace('\n', '<br>');
            rf.style.cursor = 'default';
            rf.title = '';
        }
    }

    const cf = getEl('closed-formula');
    if (cf) cf.innerHTML = model.closedZh || '';

    // 4. Matrix & Visualization
    renderMatrix();
    drawVisualDemo();
}

function renderMatrix() {
    if (!matrixContainer) return;
    const model = MODELS[currentMode];
    const result = model.calculate(matrixSize, matrixSize, useAltRecurrence);
    const matrix = result.matrix || result;

    let html = '<table><thead><tr><th>n\\m</th>';
    for (let j = 0; j <= matrixSize; j++) html += `<th>${j}</th>`;
    html += '</tr></thead><tbody>';

    for (let i = 0; i <= matrixSize; i++) {
        html += `<tr><th>${i}</th>`;
        for (let j = 0; j <= matrixSize; j++) {
            let val = matrix[i][j];
            const isSelected = (i === currentN && j === currentM);

            let cornerVal = '';
            if (useAltRecurrence) {
                if (currentMode === 'DI') {
                    cornerVal = result.componentMatrix[i][j];
                } else if (currentMode === 'II') {
                    if (i >= j) cornerVal = matrix[i - j][j];
                    else cornerVal = 0;
                }
            }

            let cls = isSelected ? 'cell-active' : '';
            let label = '';
            let cornerHtml = cornerVal !== '' ? `<span class="cell-corner">${cornerVal}</span>` : '';

            const deps = model.getDependencies(currentN, currentM, useAltRecurrence);
            const dep = deps.find(d => d.r === i && d.c === j);
            if (dep) {
                if (currentMode === 'DI' && useAltRecurrence && !isSelected) {
                    val = result.componentMatrix[i][j];
                }

                if (!isSelected) cls = dep.cls;
                else cls += ' cell-source-overlap';

                if (dep.label) label = `<span class="cell-label">${dep.label}</span>`;
            }

            html += `<td class="${cls}" data-r="${i}" data-c="${j}">${label}${cornerHtml}${val}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';

    matrixContainer.innerHTML = html;

    // Add click event to matrix cells
    matrixContainer.querySelectorAll('td').forEach(td => {
        td.addEventListener('click', () => {
            currentN = parseInt(td.dataset.r);
            currentM = parseInt(td.dataset.c);
            if (nInput) nInput.value = currentN;
            if (mInput) mInput.value = currentM;
            if (nVal) nVal.textContent = currentN;
            if (mVal) mVal.textContent = currentM;
            generateDistribution();
            updateUI();
        });
    });
}

function generateDistribution() {
    distribution = Array.from({ length: currentM }, () => []);

    if (currentM === 0) return; // Prevent crash when m=0

    if (currentMode.startsWith('D')) {
        for (let i = 0; i < currentN; i++) {
            const dest = Math.floor(Math.random() * currentM);
            distribution[dest].push(i);
        }
    } else {
        let remaining = currentN;
        for (let i = 0; i < currentM - 1; i++) {
            const count = Math.floor(Math.random() * (remaining + 1));
            for (let k = 0; k < count; k++) distribution[i].push('ball');
            remaining -= count;
        }
        for (let k = 0; k < remaining; k++) distribution[currentM - 1].push('ball');
    }

    if (currentMode.endsWith('I')) {
        distribution.sort((a, b) => b.length - a.length);
    }
}

function drawVisualDemo() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = 50;
    const boxW = 80;
    const boxH = 60;
    const spacing = (canvas.width - 2 * margin - currentM * boxW) / (currentM - 1 || 1);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Outfit';
    ctx.textAlign = 'center';
    const val = MODELS[currentMode].calculate(10, 10);
    const matrix = val.matrix || val;
    const ways = matrix[currentN] ? matrix[currentN][currentM] : 0;
    ctx.fillText(`${currentN} Balls → ${currentM} Boxes: ${ways} ways`, canvas.width / 2, 30);
    ctx.font = '12px Outfit';
    ctx.fillStyle = varColor('--text-secondary');
    ctx.fillText('(点击卡片切换示例 / Click card to cycle examples)', canvas.width / 2, 50);

    for (let i = 0; i < currentM; i++) {
        const x = margin + i * (boxW + spacing);
        const y = canvas.height - 120;

        ctx.strokeStyle = varColor('--accent-color');
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxW, boxH);

        ctx.fillStyle = varColor('--text-secondary');
        ctx.font = '12px Outfit';
        ctx.textAlign = 'center';
        const label = currentMode.endsWith('D') ? `Box ${i + 1}` : `Part ${i + 1}`;
        ctx.fillText(label, x + boxW / 2, y + boxH + 20);

        const balls = distribution[i] || [];
        const ballRadius = 6;
        balls.forEach((ball, idx) => {
            const bx = x + 15 + (idx % 4) * 15;
            const by = y + 15 + Math.floor(idx / 4) * 15;

            ctx.beginPath();
            ctx.arc(bx, by, ballRadius, 0, Math.PI * 2);
            if (typeof ball === 'number') {
                ctx.fillStyle = `hsl(${(ball * 360 / (currentN || 1))}, 70%, 60%)`;
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '8px Outfit';
                ctx.fillText(ball + 1, bx, by + 3);
            } else {
                ctx.fillStyle = varColor('--text-secondary');
                ctx.fill();
            }
        });
    }
}

function varColor(name) {
    const color = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (color) return color;
    if (name === '--accent-color') return '#38bdf8';
    if (name === '--text-secondary') return '#94a3b8';
    return '#ffffff';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('load', () => {
    resizeCanvas();
    updateUI();
});
