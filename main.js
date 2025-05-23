document.addEventListener('DOMContentLoaded', () => {
    const game = new CubeGame();

    // DOM Elements
    const cubeFaceElements = document.querySelectorAll('.face');
    const colorOptionElements = document.querySelectorAll('.color-option');
    const usedColorsEl = document.getElementById('used-colors');
    const currentValueEl = document.getElementById('current-value');
    const highscoreEl = document.getElementById('highscore');
    const submitButton = document.getElementById('submit-button');
    const resetButton = document.getElementById('reset-button');
    // const solutionsFoundEl = document.getElementById('solutions-found'); // Old
    // const totalSolutionsEl = document.getElementById('total-solutions'); // Old
    // const actualSolutionsFoundEl = document.getElementById('actual-solutions-found'); // Old
    // const totalActualSolutionsEl = document.getElementById('total-actual-solutions'); // Old
    // const abstractPatternsFoundEl = document.getElementById('abstract-patterns-found'); // Old
    // const totalAbstractPatternsEl = document.getElementById('total-abstract-patterns'); // Old
    const methodsExemplifiedCountEl = document.getElementById('methods-exemplified-count');

    // Game State
    let currentColors = Array(6).fill(null); // 0:F, 1:B, 2:T, 3:B, 4:L, 5:R
    let selectedColorValue = null;
    let highscore = 0;
    let method1Exemplified = false;
    let method2Exemplified = false;
    let method3Exemplified = false;
    let methodsExemplifiedDisplay = 0;

    // Cube Rotation State
    const cubeContainer = document.querySelector('.cube-container');
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let currentRotationX = -20; // Initial X rotation (matches example CSS)
    let currentRotationY = -30; // Initial Y rotation (matches example CSS)

    // --- Initialization ---
    updateDashboard();
    if (methodsExemplifiedCountEl) methodsExemplifiedCountEl.textContent = methodsExemplifiedDisplay.toString();

    // Apply initial rotation and cursor style via JavaScript
    if (cubeContainer) { // Ensure cubeContainer exists
        cubeContainer.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
        cubeContainer.style.cursor = 'grab';
    }


    // --- Event Listeners ---

    // 0. Cube Rotation Listeners
    if (cubeContainer) { // Ensure cubeContainer exists before adding listeners
        cubeContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
            cubeContainer.style.cursor = 'grabbing';
        });
    }

    window.addEventListener('mousemove', (e) => {
        if (!isDragging || !cubeContainer) return;

        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;

        currentRotationY += deltaX * 0.5; // Adjust sensitivity
        currentRotationX -= deltaY * 0.5; // Adjust sensitivity
        
        cubeContainer.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;

        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            if (cubeContainer) { // Ensure cubeContainer exists
                cubeContainer.style.cursor = 'grab';
            }
        }
    });

    // 1. Color Palette Interaction
    colorOptionElements.forEach(option => {
        option.addEventListener('click', () => {
            colorOptionElements.forEach(el => el.classList.remove('selected'));
            option.classList.add('selected');
            selectedColorValue = option.dataset.colorValue;
        });
    });

    // 2. Applying Color to Faces
    cubeFaceElements.forEach(faceEl => {
        faceEl.addEventListener('click', () => {
            if (selectedColorValue) {
                const faceId = parseInt(faceEl.dataset.faceId);
                currentColors[faceId] = selectedColorValue;
                faceEl.style.backgroundColor = selectedColorValue;
                faceEl.textContent = ''; // Clear placeholder text like "Front (0)"
                checkRealtimeViolations();
                updateDashboard();
            } else {
                // Maybe a small message to select a color first
                console.log("Please select a color first.");
            }
        });
    });

    // 3. Reset Button
    resetButton.addEventListener('click', () => {
        currentColors.fill(null);
        selectedColorValue = null;
        cubeFaceElements.forEach(faceEl => {
            faceEl.style.backgroundColor = '#ddd'; // Default uncolored
            faceEl.classList.remove('violating');
            // Restore placeholder text if desired, or leave blank
            const faceId = parseInt(faceEl.dataset.faceId);
            const faceNames = ["Front (0)", "Back (1)", "Top (2)", "Bottom (3)", "Left (4)", "Right (5)"];
            faceEl.textContent = faceNames[faceId];
        });
        colorOptionElements.forEach(el => el.classList.remove('selected'));
        updateDashboard();
        // currentValueEl.textContent = '0'; // Reset current value display -- THIS LINE IS REMOVED
        console.log("Cube reset.");
    });

    // 4. Submit Button
    submitButton.addEventListener('click', () => {
        // First, check if all faces are colored
        if (currentColors.some(color => color === null)) {
            alert("Please color all faces of the cube before submitting.");
            return;
        }

        // Then, use CubeGame's validation
        if (!game.isValidColoring(currentColors)) {
            // isValidColoring itself implies all faces are colored, but the above check is more user-friendly.
            // The checkRealtimeViolations should have already highlighted issues.
            alert("Invalid coloring: Adjacent faces have the same color. Please correct the red-bordered faces.");
            return;
        }

        // New core logic for checking methods
        const uniqueColorsCount = new Set(currentColors.filter(c => c !== null)).size;
        let newMethodFoundThisTurn = false;
        let submissionMessage = "";
        let newMethodType = 0; // 1, 2, or 3

        if (!method1Exemplified && game.checkMethod1Structure(currentColors, uniqueColorsCount)) {
            method1Exemplified = true;
            newMethodType = 1;
            submissionMessage = "Congratulations! You've found an example of Method 1 (3-color type: {C1,C1},{C2,C2},{C3,C3}).";
        } else if (!method2Exemplified && game.checkMethod2Structure(currentColors, uniqueColorsCount)) {
            method2Exemplified = true;
            newMethodType = 2;
            submissionMessage = "Congratulations! You've found an example of Method 2 (4-color type: {C1,C1},{C2,C2},{C3,C4}).";
        } else if (!method3Exemplified && game.checkMethod3Structure(currentColors, uniqueColorsCount)) {
            method3Exemplified = true;
            newMethodType = 3;
            submissionMessage = "Congratulations! You've found an example of Method 3 (5-color type: {C1,C1}, with 4 other distinct colors).";
        } else {
            // Check if it's a valid coloring but matches an already found method type or none of the specific structures
            if ( (uniqueColorsCount === 3 && method1Exemplified) ||
                 (uniqueColorsCount === 4 && method2Exemplified && game.checkMethod2Structure(currentColors, uniqueColorsCount)) || // also check structure to be sure
                 (uniqueColorsCount === 5 && method3Exemplified && game.checkMethod3Structure(currentColors, uniqueColorsCount)) ) {
                submissionMessage = "This is a valid coloring, but you've already exemplified this method type.";
            } else if (uniqueColorsCount === 4 && !method2Exemplified && !game.checkMethod2Structure(currentColors, uniqueColorsCount)) {
                submissionMessage = "This 4-color coloring is valid, but doesn't match the specific structure needed for Method 2 ({C1,C1},{C2,C2},{C3,C4}). Try again!";
            } else if (uniqueColorsCount === 5 && !method3Exemplified && !game.checkMethod3Structure(currentColors, uniqueColorsCount)) {
                submissionMessage = "This 5-color coloring is valid, but doesn't match the specific structure needed for Method 3 ({C1,C1}, plus 4 distinct others). Try again!";
            } else {
                submissionMessage = "This is a valid coloring, but it doesn't match a new method type you still need to find, or its specific structure.";
            }
        }

        if (newMethodType > 0) {
            methodsExemplifiedDisplay++;
            newMethodFoundThisTurn = true; // Used by scoring if desired
            // Update score - e.g., 10 points per method
            let currentScore = methodsExemplifiedDisplay * 10; 
            currentValueEl.textContent = currentScore.toString();
            if (currentScore > highscore) {
                highscore = currentScore;
                highscoreEl.textContent = highscore.toString();
            }
        } else {
             // If not a new method, reset current value or leave as is based on preference
             currentValueEl.textContent = '0'; 
        }
        
        if (methodsExemplifiedCountEl) methodsExemplifiedCountEl.textContent = methodsExemplifiedDisplay.toString();
        alert(submissionMessage);

        if (methodsExemplifiedDisplay === 3) {
            setTimeout(() => {
                displayFinalExplanation();
            }, 100);
        }
    });

    function displayFinalExplanation() {
        const explanationText = "恭喜您发现所有3种基本构造方法！\n\n" +
                            "这些方法揭示了所有独特的着色方案：\n\n" +
                            "使用恰好3种不同颜色的10种解法：\n（例如，{C1,C1}, {C2,C2}, {C3,C3} —— C代表颜色）\n" +
                            "  - 从5种颜色中选出3种：C(5,3) = 10种选择方式。\n" +
                            "  - 为每组对立面分配一种颜色：结构上仅1种排列方式。\n" +
                            "  - 总计：10 × 1 = 10种。\n\n" +
                            "使用恰好4种不同颜色的30种解法：\n（例如，{C1,C1}, {C2,C2}, {C3,C4} —— 即您所述的“2对是30种”）\n" +
                            "  - 为两组完整对立面选择颜色：C(5,2) = 10种选择方式。\n" +
                            "  - 从剩余3种颜色中为混合对立面选择2种：C(3,2) = 3种方式。\n" +
                            "  - 排列组合（此结构类型仅1种排列方式）。\n" +
                            "  - 总计：10 × 3 = 30种。\n\n" +
                            "使用恰好5种不同颜色的15种解法：\n（例如，{C1,C1}，其余4个面使用C2,C3,C4,C5 ）\n" +
                            "  - 为完整对立面选择1种颜色：C(5,1) = 5种选择方式。\n" +
                            "  - 在赤道环上排列其余4种不同颜色：存在3种不同的排列方式。(选择一种颜色固定，比如C2, 则C2的对面有三种可能，C3,C4,C5)\n" +
                            "  - 总计：5 × 3 = 15种。\n\n" +
                            "总和 = 10 + 30 + 15 = 55种不同的着色方案。";
        alert(explanationText);
        // In future, this could populate a modal div for better formatting.
    }

    // --- Helper Functions ---

    function checkRealtimeViolations() {
        // Clear previous violations
        cubeFaceElements.forEach(el => el.classList.remove('violating'));

        for (let i = 0; i < 6; i++) {
            const color1 = currentColors[i];
            if (color1 === null) continue; // Only check colored faces against their colored neighbors

            const adjacentFaceIndices = game.faceAdjacency[i];
            for (const adjIdx of adjacentFaceIndices) {
                const color2 = currentColors[adjIdx];
                if (color2 !== null && color1 === color2) {
                    // Highlight both faces involved in a violation
                    document.querySelector(`.face[data-face-id="${i}"]`).classList.add('violating');
                    document.querySelector(`.face[data-face-id="${adjIdx}"]`).classList.add('violating');
                }
            }
        }
    }

    function updateDashboard() {
        const uniqueColors = new Set(currentColors.filter(c => c !== null));
        usedColorsEl.textContent = uniqueColors.size.toString();
        // currentValueEl can be updated upon submission or based on current pattern if desired.
        // For now, highscore is updated on successful submission.
        highscoreEl.textContent = highscore.toString();
    }
});
