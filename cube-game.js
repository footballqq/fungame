class CubeGame {
    constructor() {
        this.solutionMap = new Map();
        this.faceAdjacency = {
            0: [2, 3, 4, 5], // Front: Top, Bottom, Left, Right
            1: [2, 3, 4, 5], // Back: Top, Bottom, Left, Right
            2: [0, 1, 4, 5], // Top: Front, Back, Left, Right
            3: [0, 1, 4, 5], // Bottom: Front, Back, Left, Right
            4: [0, 1, 2, 3], // Left: Front, Back, Top, Bottom
            5: [0, 1, 2, 3]  // Right: Front, Back, Top, Bottom
        };
        this.SYMMETRIES = this.generateSymmetries();
        this.actualSolutionMap = new Map();
    }

    generateSymmetries() {
        const R_x = [2, 3, 1, 0, 4, 5]; // Front(0)->Top(2), Top(2)->Back(1), Back(1)->Bottom(3), Bottom(3)->Front(0)
        const R_y = [4, 5, 2, 3, 1, 0]; // Front(0)->Right(5), Right(5)->Back(1), Back(1)->Left(4), Left(4)->Front(0)
        const R_z = [0, 1, 4, 5, 3, 2]; // Top(2)->Left(4), Left(4)->Bottom(3), Bottom(3)->Right(5), Right(5)->Top(2)

        const baseRotations = [R_x, R_y, R_z];

        function compose(p1, p2) {
            // p_new[i] = p1[p2[i]]
            // This means p2 is applied first, then p1.
            // Example: if p2 maps face X to face Y (p2[X] = Y),
            // and p1 maps face Y to face Z (p1[Y] = Z),
            // then the composed permutation maps face X to face Z.
            // p_new[X] = p1[p2[X]] = p1[Y] = Z.
            // The value at index i of the new permutation is the color
            // that p1 moves to new face i, where that color comes from p2[i] of the original cube.
            // So, new_face_i_color = p1[original_color_at_p2[i]]
            // This means: new_perm[i] = p1[p2[i]]
            return p1.map((_, i) => p1[p2[i]]);
        }

        const identity = [0, 1, 2, 3, 4, 5];
        const symmetries_list = [identity];
        const queue = [identity];
        const found_set = new Set([identity.toString()]);

        while (queue.length > 0) {
            const current_perm = queue.shift();

            for (const base_rot of baseRotations) {
                const new_perm = compose(base_rot, current_perm);
                const new_perm_str = new_perm.toString();

                if (!found_set.has(new_perm_str)) {
                    symmetries_list.push(new_perm);
                    found_set.add(new_perm_str);
                    queue.push(new_perm);
                }
            }
        }

        if (symmetries_list.length !== 24) {
            console.warn(`Expected 24 symmetries, but found ${symmetries_list.length}`);
        }

        return symmetries_list;
    }

    normalizeColors(faces) {
        const colorToNormalizedId = new Map();
        let nextToken = 1;
        const normalizedFaceColors = [];

        for (const color of faces) {
            if (!colorToNormalizedId.has(color)) {
                colorToNormalizedId.set(color, nextToken);
                nextToken++;
            }
            normalizedFaceColors.push(colorToNormalizedId.get(color));
        }
        return normalizedFaceColors.join('');
    }

    isValidColoring(faces) {
        // Ensure this.faceAdjacency is accessible
        for (let i = 0; i < 6; i++) {
            const color1 = faces[i];

            // Check if the face is colored. For a submittable solution, all faces must be colored.
            if (color1 === null || color1 === undefined) { // Or other checks for "uncolored"
                return false;
            }

            const adjacentFacesIndices = this.faceAdjacency[i];
            for (const adjIdx of adjacentFacesIndices) {
                const color2 = faces[adjIdx];
                if (color1 === color2) {
                    return false; // Adjacent faces have the same color
                }
            }
        }
        return true; // All checks passed
    }

    isNewSolution(faces) {
        const rotated_normalized_patterns = [];

        for (const transform of this.SYMMETRIES) {
            // Apply the transform to the input 'faces'
            // transform[k] is the OLD face index that provides color for NEW face k.
            const transformed_actual_colors = transform.map(original_face_idx => faces[original_face_idx]);
            
            const normalized_pattern = this.normalizeColors(transformed_actual_colors);
            rotated_normalized_patterns.push(normalized_pattern);
        }

        // Check if any of these normalized patterns (from any rotation) exist in the solutionMap
        // This means we are checking if the CURRENT submitted pattern, in ANY of its symmetric forms,
        // normalizes to something already stored as a canonical key.
        for (const pattern_str of rotated_normalized_patterns) {
            if (this.solutionMap.has(pattern_str)) {
                return false; // This abstract pattern is already registered
            }
        }

        // If none were found, it's a new solution.
        // Determine the canonical pattern (lexicographically smallest) and store that one.
        rotated_normalized_patterns.sort(); // Sorts strings lexicographically
        const canonical_pattern = rotated_normalized_patterns[0];
        
        this.solutionMap.set(canonical_pattern, true);
        return true;
    }

    getCanonicalActualColors(faces) {
        if (!faces || faces.length !== 6) {
            // Or throw an error, but returning null might be safer if called unexpectedly
            console.error("getCanonicalActualColors received invalid faces array", faces);
            return null; 
        }

        let canonicalKey = null;
        for (const transform of this.SYMMETRIES) {
            // transform[k] is the OLD face index that provides color for NEW face k.
            const transformed_colors = transform.map(original_face_idx => faces[original_face_idx]);
            const key_string = JSON.stringify(transformed_colors); // Robust key from array

            if (canonicalKey === null || key_string < canonicalKey) {
                canonicalKey = key_string;
            }
        }
        return canonicalKey;
    }

    isNewActualColorSolution(faces) {
        if (!faces || faces.length !== 6 || faces.some(f => f === null || f === undefined)) {
            // Ensure faces are valid for an actual solution submission
            console.error("isNewActualColorSolution received invalid faces array", faces);
            return false; 
        }

        const canonicalKey = this.getCanonicalActualColors(faces);
        if (canonicalKey === null) return false; // Should not happen if faces are valid

        if (!this.actualSolutionMap.has(canonicalKey)) {
            this.actualSolutionMap.set(canonicalKey, true);
            return true;
        }
        return false;
    }

    // Other methods will be added later
}

// Optional: export the class if using modules, though not strictly necessary for this problem
// module.exports = CubeGame; // For Node.js environment
// export default CubeGame; // For ES6 modules
