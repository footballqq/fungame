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
    // Get mode
    const selectedMode = document.querySelector('input[name="gameMode"]:checked').value;
    gameMode = selectedMode;
    
    foxPos = FOX_START;
    goosePos = GOOSE_START;
    currentTurn = 'fox';
    foxMovesMade = 0;
    gameOver = false;
    
    gameOverModal.classList.add('hidden');
    
    updateUI();
    
    // Check if AI needs to start
    if (gameMode === 'pve_goose' && currentTurn === 'fox') {
        setTimeout(playAITurn, 500);
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

// Start
initGame();
