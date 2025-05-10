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
/**
 * @function showCustomAlert
 * @description 显示自定义的居中alert对话框
 * @param {string} message - 要显示的消息
 */
function showCustomAlert(message) {
    // 创建对话框元素
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.padding = '20px';
    dialog.style.backgroundColor = 'white';
    dialog.style.border = '1px solid #ccc';
    dialog.style.borderRadius = '5px';
    dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    dialog.style.zIndex = '1000';
    dialog.style.minWidth = '300px';
    dialog.style.textAlign = 'center';
    
    // 添加消息
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.marginBottom = '20px';
    
    // 添加确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定';
    confirmButton.style.padding = '8px 16px';
    confirmButton.style.backgroundColor = '#4CAF50';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '4px';
    confirmButton.style.cursor = 'pointer';
    
    // 添加背景遮罩
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '999';
    
    // 点击确认按钮关闭对话框
    confirmButton.addEventListener('click', function() {
        document.body.removeChild(dialog);
        document.body.removeChild(overlay);
    });
    
    // 组装对话框
    dialog.appendChild(messageElement);
    dialog.appendChild(confirmButton);
    
    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // 聚焦确认按钮
    confirmButton.focus();
}

/**
 * @function showCustomPrompt
 * @description 显示自定义的居中prompt对话框
 * @param {string} message - 提示消息
 * @param {string} defaultValue - 默认值
 * @returns {Promise} 返回用户输入的值或null
 */
function showCustomPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        // 创建对话框元素
        const dialog = document.createElement('div');
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.padding = '20px';
        dialog.style.backgroundColor = 'white';
        dialog.style.border = '1px solid #ccc';
        dialog.style.borderRadius = '5px';
        dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        dialog.style.zIndex = '1000';
        dialog.style.minWidth = '300px';
        dialog.style.textAlign = 'center';
        
        // 添加消息
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.style.marginBottom = '15px';
        
        // 添加输入框
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = defaultValue;
        inputElement.style.width = '100%';
        inputElement.style.padding = '8px';
        inputElement.style.marginBottom = '15px';
        inputElement.style.boxSizing = 'border-box';
        inputElement.style.border = '1px solid #ccc';
        inputElement.style.borderRadius = '4px';
        
        // 添加按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        
        // 添加确认按钮
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '确定';
        confirmButton.style.padding = '8px 16px';
        confirmButton.style.backgroundColor = '#4CAF50';
        confirmButton.style.color = 'white';
        confirmButton.style.border = 'none';
        confirmButton.style.borderRadius = '4px';
        confirmButton.style.cursor = 'pointer';
        confirmButton.style.flex = '1';
        confirmButton.style.marginRight = '10px';
        
        // 添加取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.padding = '8px 16px';
        cancelButton.style.backgroundColor = '#f44336';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.flex = '1';
        
        // 添加背景遮罩
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';
        
        // 点击确认按钮
        confirmButton.addEventListener('click', function() {
            const value = inputElement.value;
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve(value);
        });
        
        // 点击取消按钮
        cancelButton.addEventListener('click', function() {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve(null);
        });
        
        // 按Enter键确认
        inputElement.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                confirmButton.click();
            }
        });
        
        // 组装对话框
        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        dialog.appendChild(messageElement);
        dialog.appendChild(inputElement);
        dialog.appendChild(buttonContainer);
        
        // 添加到页面
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        // 聚焦输入框
        inputElement.focus();
        inputElement.select();
    });
}

async function handlePendingCakeClick(cakeId) {
    if (!gameRunning || gameEnded) {
        showCustomAlert('游戏未开始或已结束！');
        return;
    }
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake || cake.isFullyCooked) return;

    const targetPanSlotIndex = pan[0] === null ? 0 : (pan[1] === null ? 1 : -1);
    if (targetPanSlotIndex === -1) {
        showCustomAlert('烙饼区已满！');
        return;
    }

    const sideToCook = await showCustomPrompt(`将饼 #${cakeId} 放入烙饼区，烙哪一面？ (输入 A 或 B):`, 'A');
    if (sideToCook && (sideToCook.toUpperCase() === 'A' || sideToCook.toUpperCase() === 'B')) {
        moveCakeToPan(cake, targetPanSlotIndex, sideToCook.toUpperCase());
    } else if (sideToCook !== null) {
        showCustomAlert('请输入有效的面 (A 或 B)。');
    }
}

/**
 * @function handleBakingCakeClick
 * @description Handles click events on cakes in the baking area (pan).
 * @param {number} cakeId - The ID of the clicked cake.
 */
async function handleBakingCakeClick(cakeId) {
    if (!gameRunning || gameEnded) {
        showCustomAlert('游戏未开始或已结束！');
        return;
    }
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake) return;

    const action = await showCustomPrompt(`操作饼 #${cakeId}：\n1. 翻面\n2. 移回未完成区\n请输入操作编号 (1 或 2):`);
    if (action === '1') {
        flipCakeInPan(cake);
    } else if (action === '2') {
        moveCakeFromPanToPending(cake);
    } else if (action !== null) {
        showCustomAlert('无效操作！');
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
 * @description Flips a cake currently in a pan slot.
 * @param {object} cake - The cake object in the pan.
 */
function flipCakeInPan(cake) {
    if (cake.location !== 'baking') return;

    const oldSide = cake.currentBakingSide;
    const newSide = oldSide === 'A' ? 'B' : 'A';

    if ((newSide === 'A' && cake.isSideACooked) || (newSide === 'B' && cake.isSideBCooked)) {
        showCustomAlert(`饼 #${cake.id} 的 ${newSide}面 已经烙熟了！`);
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
function endGame() {
    gameRunning = false;
    gameEnded = true;
    nextStepBtn.disabled = true;
    
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
    gameOverText.style.marginBottom = '2em';
    
    const restartButton = document.createElement('button');
    restartButton.textContent = '再来一局';
    restartButton.style.padding = '1em 2em';
    restartButton.style.fontSize = '1.2em';
    restartButton.style.backgroundColor = '#4CAF50';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '4px';
    restartButton.style.cursor = 'pointer';
    
    restartButton.addEventListener('click', function() {
        document.body.removeChild(gameOverScreen);
        initializeGame();
    });
    
    gameOverScreen.appendChild(gameOverText);
    gameOverScreen.appendChild(restartButton);
    document.body.appendChild(gameOverScreen);
    
    console.log('Game ended.');
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