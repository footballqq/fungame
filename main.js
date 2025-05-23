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

    // Game State
    let currentColors = Array(6).fill(null); // 0:F, 1:B, 2:T, 3:B, 4:L, 5:R
    let selectedColorValue = null;
    let highscore = 0;

    // Cube Rotation State
    const cubeContainer = document.querySelector('.cube-container');
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let currentRotationX = -20; // Initial X rotation (matches example CSS)
    let currentRotationY = -30; // Initial Y rotation (matches example CSS)

    // --- Initialization ---
    updateDashboard();
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

        // If valid, check if it's a new solution
        if (game.isNewSolution(currentColors)) {
            const uniqueColorsCount = new Set(currentColors.filter(c => c !== null)).size;
            // Placeholder scoring: unique colors factorial.
            // The problem's "颜色阶乘 × 结构唯一性" is more complex.
            // For now, score = uniqueColorsCount.
            let currentScore = uniqueColorsCount; // Simplified score
            if (uniqueColorsCount > 0) { // basic factorial
                let fact = 1;
                for(let i=2; i<=uniqueColorsCount; i++) fact *=i;
                currentScore = fact;
            }


            currentValueEl.textContent = currentScore.toString();
            if (currentScore > highscore) {
                highscore = currentScore;
                highscoreEl.textContent = highscore.toString();
            }

            let solutionTypeDescription = "";
            // Note: The counts 10, 10, 5 refer to C(5,k) * (number of abstract patterns for k colors)
            // k=3: C(5,3)*1 = 10
            // k=4: C(5,4)*2 = 10
            // k=5: C(5,5)*5 = 5
            if (uniqueColorsCount === 3) {
                solutionTypeDescription = "10 possible distinct colorings of this type when choosing 3 colors from 5.";
            } else if (uniqueColorsCount === 4) {
                solutionTypeDescription = "10 possible distinct colorings of this type when choosing 4 colors from 5.";
            } else if (uniqueColorsCount === 5) {
                solutionTypeDescription = "5 possible distinct colorings of this type when choosing 5 colors from 5.";
            }

            let alertMessage = `New abstract pattern found using ${uniqueColorsCount} colors!\nYour Score: ${currentScore}.`;
            if (solutionTypeDescription) {
                alertMessage += `\n(This discovery is part of ${solutionTypeDescription})`;
            }
            alert(alertMessage);
            // Potentially reset cube or allow modification for next solution
        } else {
            alert("This coloring pattern has already been found or is a symmetrical equivalent of a found pattern.");
            currentValueEl.textContent = '0';
        }
    });

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
