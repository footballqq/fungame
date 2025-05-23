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



// Game State
let cakes = []; // Array to store cake objects
let elapsedTime = 0; // Total time elapsed (simulating minutes)
let gameRunning = false;
let initialNumCakes = 5;
let initialTimeA = 4;
let initialTimeB = 3;
let gameEnded = false;

// Pan state: null or cake object
let pan = [null, null]; 

/**
 * @function initializeGame
 * @description Initializes the game state based on user configuration.
 * Clears previous game state, creates new cakes, and renders them.
 */
function initializeGame() {
    console.log('Initializing game...');
    cakes = [];
    pan = [null, null];
    elapsedTime = 0;
    timerDisplay.textContent = elapsedTime;
    gameRunning = true;
    gameEnded = false;

    initialNumCakes = parseInt(numCakesInput.value);
    initialTimeA = parseInt(timeAInput.value);
    initialTimeB = parseInt(timeBInput.value);

    if (isNaN(initialNumCakes) || initialNumCakes < 1 || initialNumCakes > 10 ||
        isNaN(initialTimeA) || initialTimeA < 1 ||
        isNaN(initialTimeB) || initialTimeB < 1) {
        showCustomAlert('请输入有效的游戏配置！');
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
    pauseResumeBtn.disabled = true; // 不再需要暂停按钮
    pauseResumeBtn.style.display = 'none'; // 隐藏暂停按钮
    // 游戏开始时，下一步按钮的状态由updateNextStepButtonState函数决定
    // 此时应该是禁用状态，因为烙饼区还没有饼
    updateNextStepButtonState();
    console.log('Game initialized with', initialNumCakes, 'cakes. A:', initialTimeA, 'B:', initialTimeB);
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
    
    // 更新下一步按钮状态
    updateNextStepButtonState();
    
    checkWinCondition();
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
        showCustomAlert('该烙饼位已被占用！');
        return;
    }
    if ((side === 'A' && cake.isSideACooked) || (side === 'B' && cake.isSideBCooked)) {
        showCustomAlert(`饼 #${cake.id} 的 ${side}面 已经烙熟了！请选择另一面或另一块饼。`);
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
 * @description 翻转烙饼区中的饼，防止翻到已烙熟的一面
 * @param {object} cake - 烙饼区中的饼对象
 */
function flipCakeInPan(cake) {
    if (cake.location !== 'baking') return;

    const oldSide = cake.currentBakingSide;
    const newSide = oldSide === 'A' ? 'B' : 'A';
    
    // 检查当前烙制的面是否已经完成
    const isSideACurrentlyBaking = oldSide === 'A';
    const isSideBCurrentlyBaking = oldSide === 'B';
    const currentSideCooked = isSideACurrentlyBaking ? cake.isSideACooked : cake.isSideBCooked;
    
    // 如果当前面还未烙熟，则不允许翻面
    if (!currentSideCooked) {
        showCustomAlert(`饼 #${cake.id} 的 ${oldSide}面 还未烙熟，不能翻面！`);
        return;
    }

    // 检查另一面是否已烙熟
    if ((newSide === 'A' && cake.isSideACooked) || (newSide === 'B' && cake.isSideBCooked)) {
        showCustomAlert(`饼 #${cake.id} 的 ${newSide}面 已经烙熟了！`);
        // 提示用户将饼移回未完成区
        showCustomAlert(`请将饼 #${cake.id} 移回未完成区。`);
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
/**
 * @function moveCakeFromPanToPending
 * @description 将饼从烙饼区移回未完成区
 * @param {Object} cake - 要移动的饼对象
 */
function moveCakeFromPanToPending(cake) {
    if (cake.location !== 'baking') return;
    
    // 检查当前烙制的面是否已经完成
    const currentSide = cake.currentBakingSide;
    const currentSideCooked = currentSide === 'A' ? cake.isSideACooked : cake.isSideBCooked;
    
    // 如果当前面还未烙熟，则不允许移回未完成区
    if (!currentSideCooked) {
        showCustomAlert(`饼 #${cake.id} 正在烙${currentSide}面，还未完成烙制，不能移回未完成区！`);
        return;
    }

    pan[cake.panSlotIndex] = null; // Vacate the pan slot
    cake.location = 'pending';
    cake.currentBakingSide = null;
    cake.panSlotIndex = -1;
    console.log(`Cake ${cake.id} moved from pan to pending`);
    renderGame();
}


/**
 * @function updateGame
 * @description Updates the game state when player clicks "next step".
 * Handles baking progress, checks for cooked sides/cakes, and updates UI.
 */
function updateGame() {
    if (!gameRunning || gameEnded) return;

    // 检查是否有饼在烙饼区
    const hasCakesInPan = pan[0] !== null || pan[1] !== null;
    if (!hasCakesInPan) {
        showCustomAlert('烙饼区没有饼，请先放入饼再点击下一步！');
        return;
    }

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
        endGame();
    }
}

/**
 * @function endGame
 * @description Ends the game and shows the game over screen.
 */
/**
 * @function calculateOptimalSteps
 * @description 计算完成所有饼的理论最小步数
 * @returns {number} 理论最小步数
 */
function calculateOptimalSteps() {
    const numCakes = parseInt(numCakesInput.value);
    const timeA = parseInt(timeAInput.value);
    const timeB = parseInt(timeBInput.value);
    
    // 每个饼都需要烙A面和B面，且每面只能烙一次
    // 锅可以同时烙2个饼，所以理论最小步数为：
    // Math.ceil(总烙饼时间 / 锅的容量)
    // 其中，总烙饼时间 = 所有饼的(A面时间 + B面时间)
    const totalBakingTime = numCakes * (timeA + timeB);
    const panCapacity = 2; // 锅的容量
    
    return Math.ceil(totalBakingTime / panCapacity);
}

/**
 * @function endGame
 * @description Handles the game end logic, calculates optimal steps, and displays the game over screen.
 */
function endGame() {
    gameRunning = false;
    gameEnded = true;
    nextStepBtn.disabled = true;
    
    const optimalSteps = calculateOptimalSteps(initialNumCakes, initialTimeA, initialTimeB);

    // 创建游戏结束画面
    const gameOverScreen = document.createElement('div');
    gameOverScreen.style.position = 'fixed';
    gameOverScreen.style.top = '0';
    gameOverScreen.style.left = '0';
    gameOverScreen.style.width = '100%';
    gameOverScreen.style.height = '100%';
    gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverScreen.style.display = 'flex';
    gameOverScreen.style.flexDirection = 'column';
    gameOverScreen.style.justifyContent = 'center';
    gameOverScreen.style.alignItems = 'center';
    gameOverScreen.style.zIndex = '1000';
    
    const gameOverText = document.createElement('h2');
    gameOverText.textContent = `恭喜！所有饼都在 ${elapsedTime} 分钟内烙熟了！`;
    gameOverText.style.color = 'white';
    gameOverText.style.marginBottom = '1em'; // Adjusted margin

    const optimalStepsText = document.createElement('p');
    optimalStepsText.style.color = 'white';
    optimalStepsText.style.marginBottom = '0.5em';
    optimalStepsText.style.textAlign = 'center'; // Center align text

    if (optimalSteps !== -1) {
        optimalStepsText.textContent = `理论最优步数: ${optimalSteps} 分钟。`;
        if (elapsedTime === optimalSteps) {
            optimalStepsText.innerHTML += '<br><span style="color: #66FF66; font-weight: bold;">太棒了！你达到了最优步数！</span>';
        } else if (elapsedTime < optimalSteps) {
            // This case implies the BFS might have an issue or the player found an even better way (unlikely if BFS is correct)
             optimalStepsText.innerHTML += '<br><span style="color: #FFFF66; font-weight: bold;">不可思议！你甚至超越了理论最优！ (请检查最优解算法)</span>';
        } else if (elapsedTime <= optimalSteps + 3) {
            optimalStepsText.innerHTML += `<br><span style="color: #FFFF66;">表现优异！距离最优仅差 ${elapsedTime - optimalSteps} 分钟！</span>`;
        } else {
            optimalStepsText.innerHTML += `<br><span style="color: #FFCC66;">继续努力！本次比最优步数多 ${elapsedTime - optimalSteps} 分钟。</span>`;
        }
    } else {
        optimalStepsText.textContent = '理论最优步数计算中遇到问题或过于复杂。';
    }
    
    const restartButton = document.createElement('button');
    restartButton.textContent = '再来一局';
    restartButton.style.padding = '1em 2em';
    restartButton.style.fontSize = '1.2em';
    restartButton.style.backgroundColor = '#4CAF50';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '4px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.marginTop = '1em'; // Add some margin above the button
    
    restartButton.addEventListener('click', function() {
        document.body.removeChild(gameOverScreen);
        initializeGame();
    });
    
    gameOverScreen.appendChild(gameOverText);
    gameOverScreen.appendChild(optimalStepsText); // Add optimal steps text
    gameOverScreen.appendChild(restartButton);
    document.body.appendChild(gameOverScreen);
    
    console.log('Game ended. Your time:', elapsedTime, 'minutes. Optimal time:', optimalSteps, 'minutes.');
}

/**
 * @function manualNextStep
 * @description Advances the game by one time unit manually.
 * This is the main control for game progression.
 */
function manualNextStep() {
    if (!gameRunning) {
        showCustomAlert('游戏未开始！');
        return;
    }
    if (gameEnded) {
        showCustomAlert('游戏已结束！');
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
    pauseResumeBtn.style.display = 'none'; // 隐藏暂停按钮
    // 初始状态下，下一步按钮应该是禁用的，直到游戏开始
    nextStepBtn.disabled = true;
});

/**
 * @function updateNextStepButtonState
 * @description 更新下一步按钮的启用状态，根据烙饼区是否有饼来决定
 */
/**
 * @function updateNextStepButtonState
 * @description 更新下一步按钮的状态，根据游戏状态和烙饼区饼的状态决定是否启用下一步按钮
 */
function updateNextStepButtonState() {
    // 只有在游戏运行中且烙饼区有饼的情况下，下一步按钮才启用
    const hasCakesInPan = pan[0] !== null || pan[1] !== null;
    
    // 检查烙饼区是否有已烙熟但未处理的饼
    let hasCookedSideInPan = false;
    let cookedCakeId = -1;
    let cookedSide = '';
    
    // 遍历烙饼区中的饼
    for (let i = 0; i < pan.length; i++) {
        const cake = pan[i];
        if (cake !== null) {
            // 检查当前烙制的面是否已熟
            if (cake.currentBakingSide === 'A' && cake.isSideACooked) {
                hasCookedSideInPan = true;
                cookedCakeId = cake.id;
                cookedSide = 'A';
                break;
            } else if (cake.currentBakingSide === 'B' && cake.isSideBCooked) {
                hasCookedSideInPan = true;
                cookedCakeId = cake.id;
                cookedSide = 'B';
                break;
            }
        }
    }
    
    // 如果有已烙熟但未处理的饼，禁用下一步按钮并显示提示
    if (hasCookedSideInPan) {
        nextStepBtn.disabled = true;
        // 添加提示信息到按钮上
        nextStepBtn.title = `饼 #${cookedCakeId} 的 ${cookedSide}面 已烙熟，请先处理（翻面或移走）！`;
    } else {
        // 正常逻辑：游戏运行中且烙饼区有饼时启用按钮
        nextStepBtn.disabled = !gameRunning || gameEnded || !hasCakesInPan;
        nextStepBtn.title = '';
    }
}