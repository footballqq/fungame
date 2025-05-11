// ... existing code ...




/**
 * @function endGame
 * @description Ends the game and shows the game over screen with optimal steps comparison.
 */
function endGame() {
    gameRunning = false;
    gameEnded = true;
    nextStepBtn.disabled = true;
    
    const optimalSteps = calculateOptimalSteps(initialNumCakes, initialTimeA, initialTimeB);

    // 创建游戏结束画面
// ... existing code ...
    gameOverScreen.style.zIndex = '1000';
    
    const gameOverText = document.createElement('h2');
    gameOverText.textContent = `恭喜！所有饼都在 ${elapsedTime} 分钟内烙熟了！`;
    gameOverText.style.color = 'white';
    gameOverText.style.marginBottom = '1em'; // Adjusted margin

    const optimalStepsText = document.createElement('p');
    optimalStepsText.style.color = 'white';
    optimalStepsText.style.marginBottom = '0.5em';

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
// ... existing code ...
    gameOverScreen.appendChild(gameOverText);
    gameOverScreen.appendChild(optimalStepsText); // Add optimal steps text
    gameOverScreen.appendChild(restartButton);
    document.body.appendChild(gameOverScreen);
// ... existing code ...
}

// ... existing code ...