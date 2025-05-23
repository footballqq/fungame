/**
 * @function stringifyStateForBfs
 * @description Converts the current game state (cakes and pan) into a string for BFS visited set.
 * @param {Array<object>} cakesList - The list of cake objects.
 * @param {Array<object|null>} panState - The state of the pan slots.
 * @returns {string} A string representation of the game state.
 */
function stringifyStateForBfs(cakesList, panState) {
    // Sort cakes by ID to ensure consistent string for the same state regardless of internal array order.
    const sortedCakes = [...cakesList].sort((a, b) => a.id - b.id);

    const cakeStrings = sortedCakes.map(cake => {
        return `c${cake.id}:a${cake.sideA_cookedTime}b${cake.sideB_cookedTime}L${cake.location}S${cake.currentBakingSide || ''}P${cake.panSlotIndex}`;
    });

    const panStrings = panState.map(slot => {
        if (slot) {
            return `p${slot.id}S${slot.currentBakingSide}`;
        }
        return 'null';
    });

    return cakeStrings.join('|') + '#' + panStrings.join(',');
}

/**
 * @function calculateOptimalSteps
 * @description Calculates the optimal (minimum) number of steps to cook all cakes using BFS.
 * @param {number} numCakesToCalc - The number of cakes to cook.
 * @param {number} timeA - Time to cook side A.
 * @param {number} timeB - Time to cook side B.
 * @param {number} [panCapacity=2] - The capacity of the pan.
 * @returns {number} The minimum time in minutes, or -1 if calculation fails or is too complex.
 */
function calculateOptimalSteps(numCakesToCalc, timeA, timeB, panCapacity = 2) {
    console.log(`Calculating optimal steps for ${numCakesToCalc} cakes, A=${timeA}, B=${timeB}, PanCap=${panCapacity}`);

    // Initial state for BFS
    let initialBfsCakes = [];
    for (let i = 0; i < numCakesToCalc; i++) {
        initialBfsCakes.push({
            id: i + 1,
            sideA_cookedTime: 0,
            sideB_cookedTime: 0,
            sideA_targetTime: timeA,
            sideB_targetTime: timeB,
            isSideACooked: false,
            isSideBCooked: false,
            isFullyCooked: false,
            location: 'pending', // 'pending', 'baking', 'completed'
            currentBakingSide: null, // 'A' or 'B' when in pan
            panSlotIndex: -1 // 0 or 1 if in pan
        });
    }

    const initialState = {
        cakes: initialBfsCakes,
        pan: new Array(panCapacity).fill(null), // Represents what's in each pan slot
        time: 0
    };

    const queue = [initialState];
    const visited = new Set();
    visited.add(stringifyStateForBfs(initialState.cakes, initialState.pan));

    let iterations = 0; // To prevent infinite loops in case of bugs or very large state spaces

    while (queue.length > 0) {
        iterations++;
        if (iterations > 200000) { // Safety break for very complex scenarios
            console.warn("BFS for optimal steps exceeded max iterations.");
            return -1; // Or a very high number
        }

        const currentState = queue.shift();

        // Check win condition
        let allCooked = true;
        for (const cake of currentState.cakes) {
            if (!cake.isFullyCooked) {
                allCooked = false;
                break;
            }
        }
        if (allCooked) {
            console.log(`Optimal solution found in ${currentState.time} minutes after ${iterations} iterations.`);
            return currentState.time;
        }

        // --- Start: Generate Neighboring States (This is the most complex part) ---
        // A "neighboring state" is the result of:
        // 1. Current cakes in pan cooking for 1 minute.
        // 2. Player making all possible valid moves (put new cakes, flip, remove).

        // Create a deep copy for the next state after 1 min of cooking
        let cookedStateCakes = JSON.parse(JSON.stringify(currentState.cakes));
        let cookedStatePan = JSON.parse(JSON.stringify(currentState.pan)); // Pan stores references to cake objects in cookedStateCakes

        // Update pan references to point to cakes in cookedStateCakes
        for (let i = 0; i < cookedStatePan.length; i++) {
            if (cookedStatePan[i]) {
                const originalCakeId = cookedStatePan[i].id;
                cookedStatePan[i] = cookedStateCakes.find(c => c.id === originalCakeId);
            }
        }
        
        // 1. Simulate 1 minute of cooking for cakes in the pan
        for (let i = 0; i < cookedStatePan.length; i++) {
            const cakeInPan = cookedStatePan[i];
            if (cakeInPan && !cakeInPan.isFullyCooked) {
                if (cakeInPan.currentBakingSide === 'A' && !cakeInPan.isSideACooked) {
                    cakeInPan.sideA_cookedTime++;
                    if (cakeInPan.sideA_cookedTime >= cakeInPan.sideA_targetTime) {
                        cakeInPan.isSideACooked = true;
                    }
                } else if (cakeInPan.currentBakingSide === 'B' && !cakeInPan.isSideBCooked) {
                    cakeInPan.sideB_cookedTime++;
                    if (cakeInPan.sideB_cookedTime >= cakeInPan.sideB_targetTime) {
                        cakeInPan.isSideBCooked = true;
                    }
                }

                if (cakeInPan.isSideACooked && cakeInPan.isSideBCooked) {
                    cakeInPan.isFullyCooked = true;
                    cakeInPan.location = 'completed';
                    cakeInPan.currentBakingSide = null;
                    cakeInPan.panSlotIndex = -1;
                    cookedStatePan[i] = null; // Remove from pan
                }
            }
        }

        // 2. Generate states based on player actions from this `cookedState`
        // This involves trying all combinations of:
        //    - Moving pending cakes to empty pan slots (trying both sides A and B).
        //    - Flipping cakes in pan if one side is cooked and the other isn't.
        //    - Moving cakes from pan to pending if one side is cooked.
        // Each unique valid configuration after these actions forms a new state to explore.

        // For simplicity in this step, we'll just consider one type of action: filling empty pan slots.
        // A full implementation would recursively generate all combinations of valid moves.
        
        function generateActionStatesRecursive(currentActionCakes, currentActionPan, depth, availableActions) {
            // Base case for recursion: if no more actions to try for this path or depth limit reached
            if (depth >= panCapacity * 2) { // Heuristic depth limit for combined actions
                const nextOverallState = {
                    cakes: JSON.parse(JSON.stringify(currentActionCakes)),
                    pan: JSON.parse(JSON.stringify(currentActionPan.map(c => c ? currentActionCakes.find(oc => oc.id === c.id) : null))),
                    time: currentState.time + 1
                };
                 // Update pan references in nextOverallState.pan to point to cakes in nextOverallState.cakes
                for(let i=0; i<nextOverallState.pan.length; ++i) {
                    if(nextOverallState.pan[i]) {
                        nextOverallState.pan[i] = nextOverallState.cakes.find(c => c.id === nextOverallState.pan[i].id);
                    }
                }


                const stateStr = stringifyStateForBfs(nextOverallState.cakes, nextOverallState.pan);
                if (!visited.has(stateStr)) {
                    visited.add(stateStr);
                    queue.push(nextOverallState);
                }
                return;
            }

            // Add the state *without* further player actions
             const noMoreActionsState = {
                cakes: JSON.parse(JSON.stringify(currentActionCakes)),
                pan: JSON.parse(JSON.stringify(currentActionPan.map(c => c ? currentActionCakes.find(oc => oc.id === c.id) : null))),
                time: currentState.time + 1
            };
            for(let i=0; i<noMoreActionsState.pan.length; ++i) {
                if(noMoreActionsState.pan[i]) {
                    noMoreActionsState.pan[i] = noMoreActionsState.cakes.find(c => c.id === noMoreActionsState.pan[i].id);
                }
            }
            const noMoreActionsStateStr = stringifyStateForBfs(noMoreActionsState.cakes, noMoreActionsState.pan);
            if (!visited.has(noMoreActionsStateStr)) {
                visited.add(noMoreActionsStateStr);
                queue.push(noMoreActionsState);
            }


            // Try to fill empty pan slots
            for (let i = 0; i < currentActionPan.length; i++) {
                if (currentActionPan[i] === null) { // If pan slot is empty
                    for (const cakeToConsider of currentActionCakes) {
                        if (cakeToConsider.location === 'pending') {
                            // Try putting cake to cook side A
                            if (!cakeToConsider.isSideACooked) {
                                let nextCakes = JSON.parse(JSON.stringify(currentActionCakes));
                                let nextPan = JSON.parse(JSON.stringify(currentActionPan));
                                
                                let targetCakeInNext = nextCakes.find(c => c.id === cakeToConsider.id);
                                targetCakeInNext.location = 'baking';
                                targetCakeInNext.panSlotIndex = i;
                                targetCakeInNext.currentBakingSide = 'A';
                                nextPan[i] = targetCakeInNext;
                                generateActionStatesRecursive(nextCakes, nextPan, depth + 1, availableActions);
                            }
                            // Try putting cake to cook side B
                            if (!cakeToConsider.isSideBCooked) {
                                 let nextCakes = JSON.parse(JSON.stringify(currentActionCakes));
                                let nextPan = JSON.parse(JSON.stringify(currentActionPan));

                                let targetCakeInNext = nextCakes.find(c => c.id === cakeToConsider.id);
                                targetCakeInNext.location = 'baking';
                                targetCakeInNext.panSlotIndex = i;
                                targetCakeInNext.currentBakingSide = 'B';
                                nextPan[i] = targetCakeInNext;
                                generateActionStatesRecursive(nextCakes, nextPan, depth + 1, availableActions);
                            }
                        }
                    }
                }
            }
            
            // Try to flip cakes or move them
            for (let i = 0; i < currentActionPan.length; i++) {
                const cakeInPan = currentActionPan[i];
                if (cakeInPan) {
                    const cakeRef = currentActionCakes.find(c => c.id === cakeInPan.id);
                    // Try flipping
                    if (cakeRef.currentBakingSide === 'A' && cakeRef.isSideACooked && !cakeRef.isSideBCooked) {
                        let nextCakes = JSON.parse(JSON.stringify(currentActionCakes));
                        let nextPan = JSON.parse(JSON.stringify(currentActionPan));
                        let targetCakeInNext = nextCakes.find(c => c.id === cakeRef.id);
                        targetCakeInNext.currentBakingSide = 'B';
                        // nextPan[i] remains the same cake object, just its state changes
                        generateActionStatesRecursive(nextCakes, nextPan, depth + 1, availableActions);
                    } else if (cakeRef.currentBakingSide === 'B' && cakeRef.isSideBCooked && !cakeRef.isSideACooked) {
                         let nextCakes = JSON.parse(JSON.stringify(currentActionCakes));
                        let nextPan = JSON.parse(JSON.stringify(currentActionPan));
                        let targetCakeInNext = nextCakes.find(c => c.id === cakeRef.id);
                        targetCakeInNext.currentBakingSide = 'A';
                        generateActionStatesRecursive(nextCakes, nextPan, depth + 1, availableActions);
                    }

                    // Try moving to pending (if a side is cooked) - simplified rule
                    if ( (cakeRef.currentBakingSide === 'A' && cakeRef.isSideACooked) || (cakeRef.currentBakingSide === 'B' && cakeRef.isSideBCooked) ) {
                        if (!cakeRef.isFullyCooked) { // Don't move if fully cooked, it's handled by auto-completion
                            let nextCakes = JSON.parse(JSON.stringify(currentActionCakes));
                            let nextPan = JSON.parse(JSON.stringify(currentActionPan));
                            let targetCakeInNext = nextCakes.find(c => c.id === cakeRef.id);
                            targetCakeInNext.location = 'pending';
                            targetCakeInNext.panSlotIndex = -1;
                            targetCakeInNext.currentBakingSide = null;
                            nextPan[i] = null;
                            generateActionStatesRecursive(nextCakes, nextPan, depth + 1, availableActions);
                        }
                    }
                }
            }
        }
        
        // Initial call to the recursive action generator
        // The `cookedStateCakes` and `cookedStatePan` are the state *after* 1 min of cooking, *before* player makes new moves for the *next* minute.
        generateActionStatesRecursive(cookedStateCakes, cookedStatePan, 0, []);


        // --- End: Generate Neighboring States ---
    }

    console.warn("BFS for optimal steps did not find a solution.");
    return -1; // Should not happen if a solution always exists
}