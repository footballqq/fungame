import { MODELS } from './math.js';

let currentMode = 'II';
let currentN = 5;
let currentM = 3;
let useAltRecurrence = false;
let distribution = [];

let nInput, mInput, nVal, mVal, matrixContainer, modeBtns, formulaCard, canvas, ctx, visualCard;

// Helper to safely get elements
const getEl = (id) => document.getElementById(id);
const queryAll = (sel) => document.querySelectorAll(sel);
const query = (sel) => document.querySelector(sel);

let matrixSize = window.innerWidth < 640 ? 7 : 10;

function init() {
    // 1. Robust DOM selection
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

    if (!nInput || !mInput || !matrixContainer) {
        console.error("Critical UI elements not found!");
        return;
    }

    // 2. Determine initial size based on screen
    matrixSize = window.innerWidth < 640 ? 7 : 10;

    // 3. Sync state with DOM, capping values to current matrix limits
    let n = parseInt(nInput.value);
    let m = parseInt(mInput.value);

    currentN = Math.min(isNaN(n) ? 5 : n, matrixSize);
    currentM = Math.min(isNaN(m) ? 3 : m, matrixSize);

    // 4. Update UI to reflect internal state
    nInput.value = currentN;
    mInput.value = currentM;
    nInput.max = matrixSize;
    mInput.max = matrixSize;
    if (nVal) nVal.textContent = currentN;
    if (mVal) mVal.textContent = currentM;

    // 5. Sync mode with active button
    const activeBtn = query('.mode-btn.active');
    if (activeBtn) currentMode = activeBtn.dataset.mode;

    // 6. Setup all interactions
    setupEventListeners();

    // 7. Initial render sequence
    generateDistribution();
    updateUI();

    // 8. Re-render after a short delay to account for CSS Grid/Flex layout settling
    setTimeout(() => {
        resizeCanvas();
        updateUI();
    }, 150);
}

function setupEventListeners() {
    nInput.addEventListener('input', (e) => {
        currentN = parseInt(e.target.value);
        nVal.textContent = currentN;
        generateDistribution();
        updateUI();
    });

    mInput.addEventListener('input', (e) => {
        currentM = parseInt(e.target.value);
        mVal.textContent = currentM;
        generateDistribution();
        updateUI();
    });

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            useAltRecurrence = false; // Reset to default
            updateUI();
        });
    });

    // Toggle recurrence mode
    formulaCard.addEventListener('click', (e) => {
        const model = MODELS[currentMode];
        if (model.formulaZh.includes('\n')) {
            useAltRecurrence = !useAltRecurrence;
            updateUI();
        }
    });

    visualCard.addEventListener('click', () => {
        generateDistribution();
        drawVisualDemo();
    });

    window.addEventListener('resize', () => {
        const newSize = window.innerWidth < 640 ? 7 : 10;
        if (newSize !== matrixSize) {
            matrixSize = newSize;
            nInput.max = matrixSize;
            mInput.max = matrixSize;
            if (currentN > matrixSize) {
                currentN = matrixSize;
                nInput.value = currentN;
                nVal.textContent = currentN;
            }
            if (currentM > matrixSize) {
                currentM = matrixSize;
                mInput.value = currentM;
                mVal.textContent = currentM;
            }
            updateUI();
        }
        resizeCanvas();
    });

    // Initial slider setup
    nInput.max = matrixSize;
    mInput.max = matrixSize;

    resizeCanvas();
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawVisualDemo();
}

function updateUI() {
    const model = MODELS[currentMode];

    // Update labels with dynamic result calculation
    const resultData = model.calculate(matrixSize, matrixSize, useAltRecurrence);
    const matrix = resultData.matrix || resultData;
    const currentRes = matrix[currentN][currentM];

    const formatString = (str) => {
        return str.replace(/{n}/g, currentN)
            .replace(/{m}/g, currentM)
            .replace(/{res}/g, currentRes);
    };

    document.getElementById('explanation-zh').innerText = formatString(model.explainZh);
    document.getElementById('explanation-en').innerText = formatString(model.explainEn);

    const rf = document.getElementById('recurrence-formula');
    rf.innerHTML = model.formulaZh.replace('\n', '<br>');
    if (model.formulaZh.includes('\n')) {
        rf.style.cursor = 'pointer';
        rf.title = '点击切换递推演示 / Click to toggle recurrence demo';
        const lines = model.formulaZh.split('\n');
        const labels = model.modeLabels || [];
        rf.innerHTML = `<div class="${!useAltRecurrence ? 'active-formula' : ''}">${labels[0] ? `<b>${labels[0]}</b><br>` : ''}${lines[0]}</div>
                        <div class="${useAltRecurrence ? 'active-formula' : ''}">${labels[1] ? `<b>${labels[1]}</b><br>` : ''}${lines[1]}</div>`;
    } else {
        rf.style.cursor = 'default';
        rf.title = '';
    }

    // Clear result display from formula (it will be in the matrix)
    document.getElementById('closed-formula').innerHTML = model.closedZh;

    renderMatrix();
    drawVisualDemo();
}

function renderMatrix() {
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

            // Calculate corner value (Exactly m) when in At most m mode
            let cornerVal = '';
            if (useAltRecurrence) {
                if (currentMode === 'DI') {
                    // DI: Matrix shows Sum, Corner shows S(i, j)
                    cornerVal = result.componentMatrix[i][j];
                } else if (currentMode === 'II') {
                    // II: Matrix shows Sum f(i, j), Corner shows p(i, j) = f(i-j, j)
                    if (i >= j) cornerVal = matrix[i - j][j];
                    else cornerVal = 0;
                }
            }

            let cls = isSelected ? 'cell-active' : '';
            let label = '';
            let cornerHtml = cornerVal !== '' ? `<span class="cell-corner">${cornerVal}</span>` : '';

            // In summation mode for DI, use componentMatrix for dependencies
            const depMatrix = (currentMode === 'DI' && useAltRecurrence) ? result.componentMatrix : matrix;

            // Check if this cell is a dependency of the selected cell
            const deps = model.getDependencies(currentN, currentM, useAltRecurrence);
            const dep = deps.find(d => d.r === i && d.c === j);
            if (dep) {
                // If it's a dependency, show the component value if in DI sum mode
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
            nInput.value = currentN;
            mInput.value = currentM;
            nVal.textContent = currentN;
            mVal.textContent = currentM;
            updateUI();
        });
    });
}

function generateDistribution() {
    distribution = Array.from({ length: currentM }, () => []);

    if (currentMode.startsWith('D')) {
        // Distinct balls: assign each to a random box
        for (let i = 0; i < currentN; i++) {
            const dest = Math.floor(Math.random() * currentM);
            distribution[dest].push(i);
        }
    } else {
        // Identical balls: random composition
        let remaining = currentN;
        for (let i = 0; i < currentM - 1; i++) {
            const count = Math.floor(Math.random() * (remaining + 1));
            for (let k = 0; k < count; k++) distribution[i].push('ball');
            remaining -= count;
        }
        for (let k = 0; k < remaining; k++) distribution[currentM - 1].push('ball');
    }

    // If Identical boxes, sort the distribution to show canonical form
    if (currentMode.endsWith('I')) {
        distribution.sort((a, b) => b.length - a.length);
    }
}

function drawVisualDemo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = 50;
    const boxW = 80;
    const boxH = 60;
    const spacing = (canvas.width - 2 * margin - currentM * boxW) / (currentM - 1 || 1);

    // Dynamic Header
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Outfit';
    ctx.textAlign = 'center';
    const val = MODELS[currentMode].calculate(10, 10);
    const matrix = val.matrix || val;
    ctx.fillText(`${currentN} Balls → ${currentM} Boxes: ${matrix[currentN][currentM]} ways`, canvas.width / 2, 30);
    ctx.font = '12px Outfit';
    ctx.fillStyle = varColor('--text-secondary');
    ctx.fillText('(点击卡片切换示例 / Click card to cycle examples)', canvas.width / 2, 50);

    // Draw Boxes and Balls inside them
    for (let i = 0; i < currentM; i++) {
        const x = margin + i * (boxW + spacing);
        const y = canvas.height - 120;

        // Draw Box
        ctx.strokeStyle = varColor('--accent-color');
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxW, boxH);

        // Box Label
        ctx.fillStyle = varColor('--text-secondary');
        ctx.font = '12px Outfit';
        ctx.textAlign = 'center';
        const label = currentMode.endsWith('D') ? `Box ${i + 1}` : `Part ${i + 1}`;
        ctx.fillText(label, x + boxW / 2, y + boxH + 20);

        // Draw Balls in this box
        const balls = distribution[i];
        const ballRadius = 6;
        balls.forEach((ball, idx) => {
            const bx = x + 15 + (idx % 4) * 15;
            const by = y + 15 + Math.floor(idx / 4) * 15;

            ctx.beginPath();
            ctx.arc(bx, by, ballRadius, 0, Math.PI * 2);
            if (typeof ball === 'number') {
                ctx.fillStyle = `hsl(${(ball * 360 / currentN)}, 70%, 60%)`;
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
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// 1. Initialize logic as soon as DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 2. Refresh canvas once everything (CSS/Fonts) is fully loaded
window.addEventListener('load', () => {
    resizeCanvas();
    updateUI();
});
