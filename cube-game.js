class CubeGame {
    constructor() {
        this.faceAdjacency = {
            0: [2, 3, 4, 5], // Front: Top, Bottom, Left, Right
            1: [2, 3, 4, 5], // Back: Top, Bottom, Left, Right
            2: [0, 1, 4, 5], // Top: Front, Back, Left, Right
            3: [0, 1, 4, 5], // Bottom: Front, Back, Left, Right
            4: [0, 1, 2, 3], // Left: Front, Back, Top, Bottom
            5: [0, 1, 2, 3]  // Right: Front, Back, Top, Bottom
        };
        this.SYMMETRIES = this.generateSymmetries();
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

    checkMethod1Structure(faces, uniqueColorsCount) {
        // Assumes isValidColoring(faces) is already true.
        // Any valid 3-color solution must be of the {C1,C1}, {C2,C2}, {C3,C3} structure.
        return uniqueColorsCount === 3;
    }

    checkMethod2Structure(faces, uniqueColorsCount) {
        // Structure: {C1,C1}, {C2,C2}, {C3,C4} using 4 unique colors.
        if (uniqueColorsCount !== 4) return false;
        // Assumes isValidColoring(faces) is true.

        const colorCounts = new Map();
        for (const color of faces) {
            colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
        }

        if (colorCounts.size !== 4) return false; // Should be caught by uniqueColorsCount, but defensive.

        let singleCountColors = 0;
        let doubleCountColors = 0;
        let colorsAppearingTwice = [];

        for (const [color, count] of colorCounts) {
            if (count === 1) {
                singleCountColors++;
            } else if (count === 2) {
                doubleCountColors++;
                colorsAppearingTwice.push(color);
            } else {
                return false; // Invalid count for this structure (e.g. color appears > 2 times)
            }
        }

        if (!(singleCountColors === 2 && doubleCountColors === 2)) return false;

        // Check if the two colors appearing twice are on opposite faces.
        let pairsFound = 0;
        for (const color of colorsAppearingTwice) {
            if ((faces[0] === color && faces[1] === color) || // Front-Back
                (faces[2] === color && faces[3] === color) || // Top-Bottom
                (faces[4] === color && faces[5] === color)) { // Left-Right
                pairsFound++;
            } else {
                // This color that appears twice is not on an opposite pair, so invalid structure.
                return false; 
            }
        }
        return pairsFound === 2; // Both colors that appear twice must form opposite pairs.
    }

    checkMethod3Structure(faces, uniqueColorsCount) {
        // Structure: {C1,C1}, C2,C3,C4,C5 using 5 unique colors.
        if (uniqueColorsCount !== 5) return false;
        // Assumes isValidColoring(faces) is true.

        const colorCounts = new Map();
        for (const color of faces) {
            colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
        }

        if (colorCounts.size !== 5) return false;

        let singleCountColors = 0;
        let doubleCountColor = null;
        let hasDouble = false;

        for (const [color, count] of colorCounts) {
            if (count === 1) {
                singleCountColors++;
            } else if (count === 2 && !hasDouble) { // Only one color can appear twice
                doubleCountColor = color;
                hasDouble = true;
            } else {
                return false; // Invalid count (e.g., >1 color appears twice, or a color appears >2 times)
            }
        }
        
        if (!(singleCountColors === 4 && hasDouble)) return false;

        // Check if the color appearing twice is on opposite faces.
        if (!((faces[0] === doubleCountColor && faces[1] === doubleCountColor) ||
              (faces[2] === doubleCountColor && faces[3] === doubleCountColor) ||
              (faces[4] === doubleCountColor && faces[5] === doubleCountColor))) {
            return false;
        }
        return true;
    }

    // Other methods will be added later
}

// Optional: export the class if using modules, though not strictly necessary for this problem
// module.exports = CubeGame; // For Node.js environment
// export default CubeGame; // For ES6 modules
