// DOM Elements
const numCakesInput = document.getElementById('numCakes');
const timeAInput = document.getElementById('timeA');
const timeBInput = document.getElementById('timeB');
const startGameBtn = document.getElementById('startGameBtn');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const nextStepBtn = document.getElementById('nextStepBtn'); // Manual step button
const timerDisplay = document.getElementById('timer');
const pendingArea = document.getElementById('pending-area');
const bakingArea = document.getElementById('baking-area');
const completedArea = document.getElementById('completed-area');
const panSlot1 = document.getElementById('pan-slot-1');
const panSlot2 = document.getElementById('pan-slot-2');

// Game State
let cakes = []; // Array to store cake objects
let gameInterval = null; // For the game timer
let elapsedTime = 0; // Total time elapsed in seconds (simulating minutes)
let gameRunning = false;
let initialNumCakes = 5;
let initialTimeA = 4;
let initialTimeB = 3;

// Pan state: null or cake object
let pan = [null, null]; 

/**
 * @function initializeGame
 * @description Initializes the game state based on user configuration.
 * Clears previous game state, creates new cakes, and renders them.
 */
function initializeGame() {
    console.log('Initializing game...');
    stopGame(); // Stop any existing game
    cakes = [];
    pan = [null, null];
    elapsedTime = 0;
    timerDisplay.textContent = elapsedTime;
    gameRunning = false;

    initialNumCakes = parseInt(numCakesInput.value);
    initialTimeA = parseInt(timeAInput.value);
    initialTimeB = parseInt(timeBInput.value);

    if (isNaN(initialNumCakes) || initialNumCakes < 1 || initialNumCakes > 10 ||
        isNaN(initialTimeA) || initialTimeA < 1 ||
        isNaN(initialTimeB) || initialTimeB < 1) {
        alert('请输入有效的游戏配置！');
        return;
    }

    for (let i = 0; i < initialNumCakes; i++) {
        cakes.push({
            id: i + 1,
            sideA_cookedTime: 0, // Time cooked on side A
            sideB_cookedTime: 0, // Time cooked on side B
            sideA_targetTime: initialTimeA,
            sideB_targetTime: initialTimeB,
            isSideACooked: false,
            isSideBCooked: false,
            isFullyCooked: false,
            location: 'pending', // 'pending', 'baking', 'completed'
            currentBakingSide: null, // 'A' or 'B' when in pan
            panSlotIndex: -1 // 0 or 1 if in pan
        });
    }
    renderGame();
    startGameBtn.textContent = '重新开始';
    pauseResumeBtn.disabled = false;
    pauseResumeBtn.textContent = '暂停';
    nextStepBtn.disabled = true; // Disabled when game is running automatically
    console.log('Game initialized with', initialNumCakes, 'cakes. A:', initialTimeA, 'B:', initialTimeB);
    startGame();
}

/**
 * @function renderGame
 * @description Renders all cakes in their respective areas (pending, baking, completed).
 */
function renderGame() {
    // Clear existing cakes from UI
    pendingArea.innerHTML = '<h3>未完成区</h3>';
    completedArea.innerHTML = '<h3>已完成区</h3>';
    panSlot1.innerHTML = '空位1';
    panSlot1.classList.remove('occupied');
    panSlot2.innerHTML = '空位2';
    panSlot2.classList.remove('occupied');

    cakes.forEach(cake => {
        const cakeElement = createCakeElement(cake);
        if (cake.location === 'pending') {
            pendingArea.appendChild(cakeElement);
        } else if (cake.location === 'completed') {
            completedArea.appendChild(cakeElement);
        } else if (cake.location === 'baking') {
            if (cake.panSlotIndex === 0) {
                panSlot1.innerHTML = ''; // Clear '空位1'
                panSlot1.appendChild(cakeElement);
                panSlot1.classList.add('occupied');
            } else if (cake.panSlotIndex === 1) {
                panSlot2.innerHTML = ''; // Clear '空位2'
                panSlot2.appendChild(cakeElement);
                panSlot2.classList.add('occupied');
            }
        }
    });
    checkWinCondition();
}

/**
 * @function createCakeElement
 * @description Creates an HTML element for a single cake.
 * @param {object} cake - The cake object.
 * @returns {HTMLElement} The created cake div element.
 */
function createCakeElement(cake) {
    const cakeDiv = document.createElement('div');
    cakeDiv.classList.add('cake');
    cakeDiv.dataset.cakeId = cake.id;
    cakeDiv.draggable = cake.location === 'pending' || cake.location === 'baking'; // Make draggable if not completed

    const sideAStatus = cake.isSideACooked ? '熟' : `生(${cake.sideA_cookedTime}/${cake.sideA_targetTime})`;
    const sideBStatus = cake.isSideBCooked ? '熟' : `生(${cake.sideB_cookedTime}/${cake.sideB_targetTime})`;

    cakeDiv.innerHTML = `
        <span>饼 #${cake.id}</span>
        <span class="side-status side-a ${cake.isSideACooked ? 'cooked' : 'raw'}">A面: ${sideAStatus}</span>
        <span class="side-status side-b ${cake.isSideBCooked ? 'cooked' : 'raw'}">B面: ${sideBStatus}</span>
    `;

    if (cake.location === 'pending') {
        cakeDiv.onclick = () => handlePendingCakeClick(cake.id);
    }
    if (cake.location === 'baking') {
        cakeDiv.onclick = () => handleBakingCakeClick(cake.id);
    }

    return cakeDiv;
}

/**
 * @function handlePendingCakeClick
 * @description Handles click events on cakes in the pending area.
 * @param {number} cakeId - The ID of the clicked cake.
 */
function handlePendingCakeClick(cakeId) {
    if (!gameRunning && !gameInterval) {
        alert('请先开始或继续游戏！');
        return;
    }
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake || cake.isFullyCooked) return;

    const targetPanSlotIndex = pan[0] === null ? 0 : (pan[1] === null ? 1 : -1);
    if (targetPanSlotIndex === -1) {
        alert('烙饼区已满！');
        return;
    }

    const sideToCook = prompt(`将饼 #${cakeId} 放入烙饼区，烙哪一面？ (输入 A 或 B):`, 'A');
    if (sideToCook && (sideToCook.toUpperCase() === 'A' || sideToCook.toUpperCase() === 'B')) {
        moveCakeToPan(cake, targetPanSlotIndex, sideToCook.toUpperCase());
    } else if (sideToCook !== null) {
        alert('请输入有效的面 (A 或 B)。');
    }
}

/**
 * @function handleBakingCakeClick
 * @description Handles click events on cakes in the baking area (pan).
 * @param {number} cakeId - The ID of the clicked cake.
 */
function handleBakingCakeClick(cakeId) {
    if (!gameRunning && !gameInterval) {
        alert('请先开始或继续游戏！');
        return;
    }
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake) return;

    const action = prompt(`操作饼 #${cakeId}：\n1. 翻面\n2. 移回未完成区\n请输入操作编号 (1 或 2):`);
    if (action === '1') {
        flipCakeInPan(cake);
    } else if (action === '2') {
        moveCakeFromPanToPending(cake);
    } else if (action !== null) {
        alert('无效操作！');
    }
}

/**
 * @function moveCakeToPan
 * @description Moves a cake from pending to a pan slot.
 * @param {object} cake - The cake object to move.
 * @param {number} panSlotIndex - The index of the pan slot (0 or 1).
 * @param {string} side - The side to start baking ('A' or 'B').
 */
function moveCakeToPan(cake, panSlotIndex, side) {
    if (pan[panSlotIndex] !== null) {
        alert('该烙饼位已被占用！');
        return;
    }
    if ((side === 'A' && cake.isSideACooked) || (side === 'B' && cake.isSideBCooked)) {
        alert(`饼 #${cake.id} 的 ${side}面 已经烙熟了！请选择另一面或另一块饼。`);
        return;
    }

    cake.location = 'baking';
    cake.panSlotIndex = panSlotIndex;
    cake.currentBakingSide = side;
    pan[panSlotIndex] = cake;
    console.log(`Cake ${cake.id} moved to pan slot ${panSlotIndex}, baking side ${side}`);
    renderGame();
}

/**
 * @function flipCakeInPan
 * @description Flips a cake currently in a pan slot.
 * @param {object} cake - The cake object in the pan.
 */
function flipCakeInPan(cake) {
    if (cake.location !== 'baking') return;

    const oldSide = cake.currentBakingSide;
    const newSide = oldSide === 'A' ? 'B' : 'A';

    if ((newSide === 'A' && cake.isSideACooked) || (newSide === 'B' && cake.isSideBCooked)) {
        alert(`饼 #${cake.id} 的 ${newSide}面 已经烙熟了！`);
        // Optionally, move it out or let user decide next action
        return;
    }

    cake.currentBakingSide = newSide;
    console.log(`Cake ${cake.id} flipped to side ${newSide}`);
    renderGame();
}

/**
 * @function moveCakeFromPanToPending
 * @description Moves a cake from a pan slot back to the pending area.
 * @param {object} cake - The cake object in the pan.
 */
function moveCakeFromPanToPending(cake) {
    if (cake.location !== 'baking') return;

    pan[cake.panSlotIndex] = null; // Vacate the pan slot
    cake.location = 'pending';
    cake.currentBakingSide = null;
    cake.panSlotIndex = -1;
    console.log(`Cake ${cake.id} moved from pan to pending`);
    renderGame();
}


/**
 * @function updateGame
 * @description Updates the game state every second (simulating a minute).
 * Handles baking progress, checks for cooked sides/cakes, and updates UI.
 */
function updateGame() {
    if (!gameRunning) return;

    elapsedTime++;
    timerDisplay.textContent = elapsedTime;

    let gameChanged = false;

    pan.forEach((cakeInPan, index) => {
        if (cakeInPan) {
            if (cakeInPan.currentBakingSide === 'A' && !cakeInPan.isSideACooked) {
                cakeInPan.sideA_cookedTime++;
                gameChanged = true;
                if (cakeInPan.sideA_cookedTime >= cakeInPan.sideA_targetTime) {
                    cakeInPan.isSideACooked = true;
                    console.log(`Cake ${cakeInPan.id} side A cooked.`);
                    // Player needs to flip or move
                }
            } else if (cakeInPan.currentBakingSide === 'B' && !cakeInPan.isSideBCooked) {
                cakeInPan.sideB_cookedTime++;
                gameChanged = true;
                if (cakeInPan.sideB_cookedTime >= cakeInPan.sideB_targetTime) {
                    cakeInPan.isSideBCooked = true;
                    console.log(`Cake ${cakeInPan.id} side B cooked.`);
                    // Player needs to flip or move
                }
            }

            if (cakeInPan.isSideACooked && cakeInPan.isSideBCooked && !cakeInPan.isFullyCooked) {
                cakeInPan.isFullyCooked = true;
                cakeInPan.location = 'completed';
                pan[index] = null; // Remove from pan
                cakeInPan.currentBakingSide = null;
                cakeInPan.panSlotIndex = -1;
                console.log(`Cake ${cakeInPan.id} is fully cooked and moved to completed.`);
                gameChanged = true;
            }
        }
    });

    if (gameChanged) {
        renderGame();
    }

    if (checkWinCondition()) {
        stopGame();
        alert(`恭喜！所有饼都在 ${elapsedTime} 分钟内烙熟了！`);
    }
}

/**
 * @function startGame
 * @description Starts the game timer and sets the game to running state.
 */
function startGame() {
    if (gameInterval) clearInterval(gameInterval); // Clear existing interval if any
    gameRunning = true;
    pauseResumeBtn.textContent = '暂停';
    pauseResumeBtn.disabled = false;
    nextStepBtn.disabled = true; // Disable manual step when auto-running
    // Game updates every 1 second (simulating 1 minute)
    gameInterval = setInterval(updateGame, 1000);
    console.log('Game started.');
}

/**
 * @function stopGame
 * @description Stops the game timer and clears the interval.
 */
function stopGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    gameRunning = false;
    pauseResumeBtn.textContent = '继续';
    // Enable next step button only if game is not won and there are cakes to cook
    const pendingOrBakingCakes = cakes.some(c => c.location === 'pending' || c.location === 'baking');
    if (!checkWinCondition() && pendingOrBakingCakes) {
        nextStepBtn.disabled = false;
    }
    console.log('Game stopped/paused.');
}

/**
 * @function togglePauseResume
 * @description Toggles the game between paused and running states.
 */
function togglePauseResume() {
    if (gameRunning) {
        stopGame(); // This will set gameRunning to false and update button text
    } else {
        // Check if there's anything to resume or if it's a fresh start needed
        if (cakes.length === 0 || checkWinCondition()) {
            // If no cakes or game won, effectively means 'start new game'
            initializeGame(); // This will also call startGame()
        } else {
            startGame(); // Resume existing game
        }
    }
}

/**
 * @function manualNextStep
 * @description Advances the game by one time unit manually.
 * This is used when the game is paused.
 */
function manualNextStep() {
    if (gameRunning || gameInterval) {
        alert('请先暂停游戏以使用手动模式！');
        return;
    }
    if (checkWinCondition()) {
        alert('游戏已结束！');
        return;
    }
    updateGame(); // Perform one step of game logic
    console.log('Manual step executed.');
}


/**
 * @function checkWinCondition
 * @description Checks if all cakes are fully cooked.
 * @returns {boolean} True if all cakes are cooked, false otherwise.
 */
function checkWinCondition() {
    if (cakes.length === 0 && elapsedTime > 0) return false; // Game not started or reset mid-game
    if (cakes.length > 0 && cakes.every(cake => cake.isFullyCooked)) {
        console.log('Win condition met!');
        return true;
    }
    return false;
}

// Event Listeners
startGameBtn.addEventListener('click', initializeGame);
pauseResumeBtn.addEventListener('click', togglePauseResume);
nextStepBtn.addEventListener('click', manualNextStep);

// Initial setup message or placeholder content
document.addEventListener('DOMContentLoaded', () => {
    console.log('CookCake game script loaded.');
    // Set initial values for config inputs
    numCakesInput.value = initialNumCakes;
    timeAInput.value = initialTimeA;
    timeBInput.value = initialTimeB;
    // Initial render or placeholder text for areas
    renderGame(); // Render empty state initially
    pauseResumeBtn.disabled = true;
    nextStepBtn.disabled = true;
});