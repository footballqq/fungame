const GRID_SIZE = 8;
const TOTAL_NODES = GRID_SIZE * GRID_SIZE;
const MAX_FOX_MOVES = 10;

// Graph setup
const graph = Array.from({length: TOTAL_NODES}, () => []);
for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = 0; row < GRID_SIZE; row++) {
        let u = col * GRID_SIZE + row;
        if (col > 0) graph[u].push((col - 1) * GRID_SIZE + row);
        if (col < GRID_SIZE - 1) graph[u].push((col + 1) * GRID_SIZE + row);
        if (row > 0) graph[u].push(col * GRID_SIZE + row - 1);
        if (row < GRID_SIZE - 1) graph[u].push(col * GRID_SIZE + row + 1);
    }
}
const FOX_START = 3 * GRID_SIZE + 3; // (3, 3) 居中位置
const GOOSE_START = 0;               // (0, 0) 左上角
const DIAG_END = 4 * GRID_SIZE + 4;  // (4, 4) 对角线目的地

// Add the single diagonal
graph[FOX_START].push(DIAG_END);
graph[DIAG_END].push(FOX_START);

// State variables
let foxPos = FOX_START;
let goosePos = GOOSE_START;
let currentTurn = 'fox'; // 'fox' or 'goose'
let foxMovesMade = 0;
let gameMode = 'pvp';
let gameOver = false;
let isPlacingFox = false;
let isDemo = false;
let demoStep = 0;

// DOM Elements
const boardLines = document.getElementById('board-lines');
const boardNodes = document.getElementById('board-nodes');
const turnIndicator = document.getElementById('turn-indicator');
const movesLeftEl = document.getElementById('moves-left');
const gameOverModal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const btnRestart = document.getElementById('btn-restart');
const btnPlayAgain = document.getElementById('btn-play-again');
const radioModes = document.querySelectorAll('input[name="gameMode"]');
const cbSuperMode = document.getElementById('cb-super-mode');
const btnDemo = document.getElementById('btn-demo');

let foxEl, gooseEl;

// Minimax Solver
const memo = new Map();
function solve(fox, goose, isFoxTurn, movesLeft) {
    if (fox === goose) return 1000 + movesLeft;
    if (movesLeft === 0) return -1000;
    
    const key = `${fox},${goose},${isFoxTurn},${movesLeft}`;
    if (memo.has(key)) return memo.get(key);
    
    if (isFoxTurn) {
        let best = -Infinity;
        for (let next of graph[fox]) {
            best = Math.max(best, solve(next, goose, false, movesLeft - 1));
        }
        memo.set(key, best);
        return best;
    } else {
        let best = Infinity;
        let neighbors = graph[goose].filter(n => n !== fox);
        if (neighbors.length === 0) {
            best = 1000 + movesLeft; // Trapped, Fox wins
        } else {
            for (let next of neighbors) {
                best = Math.min(best, solve(fox, next, true, movesLeft));
            }
        }
        memo.set(key, best);
        return best;
    }
}

function getBestMove(fox, goose, isFoxTurn, movesLeft) {
    if (isFoxTurn) {
        let bestVal = -Infinity;
        let bestMoves = [];
        for (let next of graph[fox]) {
            let val = solve(next, goose, false, movesLeft - 1);
            if (val > bestVal) {
                bestVal = val;
                bestMoves = [next];
            } else if (val === bestVal) {
                bestMoves.push(next);
            }
        }
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    } else {
        let bestVal = Infinity;
        let bestMoves = [];
        let neighbors = graph[goose].filter(n => n !== fox);
        if (neighbors.length === 0) return null;
        for (let next of neighbors) {
            let val = solve(fox, next, true, movesLeft);
            if (val < bestVal) {
                bestVal = val;
                bestMoves = [next];
            } else if (val === bestVal) {
                bestMoves.push(next);
            }
        }
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
}

// Coordinate helper
function getXY(nodeIndex) {
    const col = Math.floor(nodeIndex / GRID_SIZE);
    const row = nodeIndex % GRID_SIZE;
    const spacing = 500 / (GRID_SIZE - 1);
    return {
        x: col * spacing,
        y: row * spacing
    };
}

// Initialization
function initGame() {
    boardLines.innerHTML = '';
    boardNodes.innerHTML = '';
    
    // Draw lines
    const drawnEdges = new Set();
    for (let u = 0; u < TOTAL_NODES; u++) {
        for (let v of graph[u]) {
            if (u < v) {
                const p1 = getXY(u);
                const p2 = getXY(v);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', p1.x);
                line.setAttribute('y1', p1.y);
                line.setAttribute('x2', p2.x);
                line.setAttribute('y2', p2.y);
                line.setAttribute('class', 'line');
                boardLines.appendChild(line);
            }
        }
    }
    
    // Draw nodes
    for (let i = 0; i < TOTAL_NODES; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.id = `node-${i}`;
        const p = getXY(i);
        node.style.left = `${p.x}px`;
        node.style.top = `${p.y}px`;
        
        // Add number label for original board mapping
        const col = Math.floor(i / GRID_SIZE);
        const row = i % GRID_SIZE;
        const originalNumber = (7 - col) * 8 + row + 1;
        
        const label = document.createElement('div');
        label.className = 'node-label';
        label.textContent = originalNumber;
        node.appendChild(label);
        
        node.addEventListener('click', () => handleNodeClick(i));
        boardNodes.appendChild(node);
    }
    
    // Create pieces
    foxEl = document.createElement('div');
    foxEl.className = 'piece piece-fox';
    foxEl.style.zIndex = 15;
    boardNodes.appendChild(foxEl);
    
    gooseEl = document.createElement('div');
    gooseEl.className = 'piece piece-goose';
    gooseEl.style.zIndex = 14;
    boardNodes.appendChild(gooseEl);
    
    resetState();
}

function resetState() {
    isDemo = false;
    demoStep++; // used to cancel running demo
    
    // Get mode
    const selectedMode = document.querySelector('input[name="gameMode"]:checked').value;
    gameMode = selectedMode;
    const isSuperMode = cbSuperMode.checked;
    
    goosePos = GOOSE_START;
    currentTurn = 'fox';
    foxMovesMade = 0;
    gameOver = false;
    gameOverModal.classList.add('hidden');
    
    if (isSuperMode) {
        isPlacingFox = true;
        foxPos = -1;
        foxEl.style.display = 'none';
        
        turnIndicator.textContent = '🌟 请点击选择狐狸起点';
        turnIndicator.className = 'turn-indicator fox';
        movesLeftEl.textContent = `狐狸剩余步数: ${MAX_FOX_MOVES}`;
        
        const gp = getXY(goosePos);
        gooseEl.style.left = `${gp.x}px`;
        gooseEl.style.top = `${gp.y}px`;
        
        document.querySelectorAll('.node').forEach(n => {
            if (parseInt(n.id.split('-')[1]) !== GOOSE_START) {
                n.classList.add('valid-move');
            } else {
                n.classList.remove('valid-move');
            }
        });
    } else {
        isPlacingFox = false;
        foxPos = FOX_START;
        foxEl.style.display = 'block';
        updateUI();
        
        // Check if AI needs to start
        if (gameMode === 'pve_goose' && currentTurn === 'fox') {
            setTimeout(playAITurn, 500);
        }
    }
}

function updateUI() {
    // Update piece positions
    const fp = getXY(foxPos);
    foxEl.style.left = `${fp.x}px`;
    foxEl.style.top = `${fp.y}px`;
    
    const gp = getXY(goosePos);
    gooseEl.style.left = `${gp.x}px`;
    gooseEl.style.top = `${gp.y}px`;
    
    // Update status
    if (!gameOver) {
        if (currentTurn === 'fox') {
            turnIndicator.textContent = '🦊 狐狸的回合';
            turnIndicator.className = 'turn-indicator fox';
        } else {
            turnIndicator.textContent = '🦢 鹅的回合';
            turnIndicator.className = 'turn-indicator goose';
        }
    }
    
    movesLeftEl.textContent = `狐狸剩余步数: ${MAX_FOX_MOVES - foxMovesMade}`;
    
    // Highlight valid moves for human player
    document.querySelectorAll('.node').forEach(n => n.classList.remove('valid-move'));
    
    if (!gameOver) {
        const isHumanTurn = 
            (gameMode === 'pvp') ||
            (gameMode === 'pve_fox' && currentTurn === 'fox') ||
            (gameMode === 'pve_goose' && currentTurn === 'goose');
            
        if (isHumanTurn) {
            let validMoves = [];
            if (currentTurn === 'fox') {
                validMoves = graph[foxPos];
            } else {
                validMoves = graph[goosePos].filter(n => n !== foxPos);
            }
            
            validMoves.forEach(n => {
                document.getElementById(`node-${n}`).classList.add('valid-move');
            });
        }
    }
}

function handleNodeClick(nodeIndex) {
    if (gameOver) return;
    
    if (isPlacingFox) {
        if (nodeIndex !== GOOSE_START) {
            foxPos = nodeIndex;
            isPlacingFox = false;
            foxEl.style.display = 'block';
            updateUI();
            if (gameMode === 'pve_goose' && currentTurn === 'fox') {
                setTimeout(playAITurn, 500);
            }
        }
        return;
    }
    
    const isHumanTurn = 
        (gameMode === 'pvp') ||
        (gameMode === 'pve_fox' && currentTurn === 'fox') ||
        (gameMode === 'pve_goose' && currentTurn === 'goose');
        
    if (!isHumanTurn) return;
    
    let validMoves = [];
    if (currentTurn === 'fox') {
        validMoves = graph[foxPos];
    } else {
        validMoves = graph[goosePos].filter(n => n !== foxPos);
    }
    
    if (validMoves.includes(nodeIndex)) {
        executeMove(nodeIndex);
    }
}

function executeMove(targetNode) {
    if (currentTurn === 'fox') {
        foxPos = targetNode;
        foxMovesMade++;
    } else {
        goosePos = targetNode;
    }
    
    // Check win conditions
    if (foxPos === goosePos) {
        endGame('狐狸胜！', '🦊 成功捉住了鹅！');
        updateUI();
        return;
    }
    
    if (currentTurn === 'fox' && foxMovesMade >= MAX_FOX_MOVES && foxPos !== goosePos) {
        endGame('鹅胜！', '🦊 10步内未能捉住鹅！');
        updateUI();
        return;
    }
    
    // Special case: Goose is trapped with no valid moves
    if (currentTurn === 'fox') {
        const gooseMoves = graph[goosePos].filter(n => n !== foxPos);
        if (gooseMoves.length === 0) {
            endGame('狐狸胜！', '🦢 被逼入死角，无路可逃！');
            updateUI();
            return;
        }
    }
    
    // Next turn
    currentTurn = currentTurn === 'fox' ? 'goose' : 'fox';
    updateUI();
    
    // Trigger AI if needed
    if (!gameOver) {
        const isAITurn = 
            (gameMode === 'pve_fox' && currentTurn === 'goose') ||
            (gameMode === 'pve_goose' && currentTurn === 'fox');
            
        if (isAITurn) {
            setTimeout(playAITurn, 600);
        }
    }
}

function playAITurn() {
    if (gameOver) return;
    
    const bestMove = getBestMove(foxPos, goosePos, currentTurn === 'fox', MAX_FOX_MOVES - foxMovesMade);
    if (bestMove !== null) {
        executeMove(bestMove);
    }
}

function endGame(title, message) {
    gameOver = true;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    turnIndicator.textContent = '游戏结束';
    turnIndicator.className = 'turn-indicator';
    setTimeout(() => {
        gameOverModal.classList.remove('hidden');
    }, 500);
}

// Event Listeners
btnRestart.addEventListener('click', resetState);
btnPlayAgain.addEventListener('click', resetState);
radioModes.forEach(radio => {
    radio.addEventListener('change', resetState);
});
cbSuperMode.addEventListener('change', resetState);

btnDemo.addEventListener('click', runDemo);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
    if (isDemo) return;
    isDemo = true;
    gameOver = true;
    const currentDemoStep = ++demoStep;
    
    gameOverModal.classList.add('hidden');
    document.querySelectorAll('.node').forEach(n => n.classList.remove('valid-move'));
    
    let demoPath = [
        { msg: "【演示】开始：注意狐狸和鹅形成的相对位置，这就是必胜态的“正方形”！" },
        { x: 1, y: 1, msg: "【演示】鹅为了不直接撞到狐狸，只能往上方逃跑..." },
        { foxX: 2, foxY: 2, msg: "【演示】狐狸向同方向平移，继续保持正方形压制！" },
        { x: 0, y: 1, msg: "【演示】鹅继续逃跑，被逼到了左边的墙上！" },
        { foxX: 1, foxY: 2, msg: "【演示】狐狸再次平移，依然保持完美的距离压制！" },
        { x: 0, y: 0, msg: "【演示】鹅退无可退，被迫缩进棋盘最左上角的死角！" },
        { foxX: 1, foxY: 1, msg: "【演示】狐狸跟进！此时鹅的仅有两条退路都在狐狸的嘴边。" },
        { x: 1, y: 0, msg: "【演示】鹅无论怎么走，都只能自动走到与狐狸相邻的格子上..." },
        { foxX: 1, foxY: 0, msg: "【演示】狐狸走上去完成绝杀！只要保持对角状态，鹅必败无疑。" }
    ];

    goosePos = 1 * GRID_SIZE + 2; // (1,2)
    foxPos = 2 * GRID_SIZE + 3; // (2,3)
    foxEl.style.display = 'block';
    
    const fg = getXY(foxPos);
    foxEl.style.left = `${fg.x}px`;
    foxEl.style.top = `${fg.y}px`;
    
    const gg = getXY(goosePos);
    gooseEl.style.left = `${gg.x}px`;
    gooseEl.style.top = `${gg.y}px`;
    
    turnIndicator.textContent = demoPath[0].msg;
    turnIndicator.className = 'turn-indicator fox';
    movesLeftEl.textContent = '动画演示中...';
    
    await sleep(4000);
    
    for (let i = 1; i < demoPath.length; i++) {
        if (!isDemo || demoStep !== currentDemoStep) break;
        let step = demoPath[i];
        
        if (step.foxX !== undefined) {
            foxPos = step.foxX * GRID_SIZE + step.foxY;
            const fxy = getXY(foxPos);
            foxEl.style.left = `${fxy.x}px`;
            foxEl.style.top = `${fxy.y}px`;
        } else {
            goosePos = step.x * GRID_SIZE + step.y;
            const gxy = getXY(goosePos);
            gooseEl.style.left = `${gxy.x}px`;
            gooseEl.style.top = `${gxy.y}px`;
        }
        
        turnIndicator.textContent = step.msg;
        await sleep(2500);
    }
    
    if (isDemo && demoStep === currentDemoStep) {
        isDemo = false;
        setTimeout(() => {
            if (demoStep === currentDemoStep) resetState();
        }, 4000);
    }
}

// Start
initGame();
