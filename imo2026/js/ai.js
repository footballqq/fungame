// codex: 2026-07-22 Implement the official IMO 2026 P4 strategy for odd and even n.
/**
 * AI module for IMO 2026 Problem 4 game logic.
 */

/**
 * Shan-Yu's AI decision: given T1 and T2, decide which triangle to KEEP (0 for T1, 1 for T2)
 */
function getShanYuChoice(T1, T2, theta) {
    const angles1 = calculateTriangleAngles(T1);
    const angles2 = calculateTriangleAngles(T2);

    const safe1 = isTriangleSafe(T1, theta);
    const safe2 = isTriangleSafe(T2, theta);

    // 1. If one is safe and the other is not, pick the safe one!
    if (safe1 && !safe2) {
        return { keepIndex: 0, reason: "保留全安全角三角形，淘汰带有危险倍数角的三角形" };
    }
    if (safe2 && !safe1) {
        return { keepIndex: 1, reason: "保留全安全角三角形，淘汰带有危险倍数角的三角形" };
    }

    // 2. If both are safe, pick the one furthest from creating theta
    // Calculate minimum difference to theta for each triangle
    const minDiff1 = Math.min(...angles1.map(a => Math.abs(a.angle - theta)));
    const minDiff2 = Math.min(...angles2.map(a => Math.abs(a.angle - theta)));

    if (safe1 && safe2) {
        if (minDiff1 >= minDiff2) {
            return { keepIndex: 0, reason: "两者皆安全，保留角度离 θ 更远的三角形" };
        } else {
            return { keepIndex: 1, reason: "两者皆安全，保留角度离 θ 更远的三角形" };
        }
    }

    // 3. If neither is safe (e.g. forced by Mulan when theta = 180/n),
    // pick the triangle with the lowest count of exact theta angles, or largest min diff to theta
    const exact1 = angles1.filter(a => Math.abs(a.angle - theta) < 1e-4).length;
    const exact2 = angles2.filter(a => Math.abs(a.angle - theta) < 1e-4).length;

    if (exact1 !== exact2) {
        return { keepIndex: exact1 < exact2 ? 0 : 1, reason: "被迫保留 θ 目标角较少的三角形" };
    }

    return {
        keepIndex: minDiff1 >= minDiff2 ? 0 : 1,
        reason: "尽量避免生成目标角 θ"
    };
}

/**
 * Mulan's AI decision: analyze current triangle T, return optimal cut { edgeIndex, P, reason }
 */
function getMulanOptimalCut(vertices, theta) {
    const angles = calculateTriangleAngles(vertices);
    const ratioInfo = isIntegerRatioTheta(theta);

    // Case 1: Check if we have an angle that is k*theta (k > 1)
    for (let i = 0; i < 3; i++) {
        const angObj = angles[i];
        const safety = checkAngleSafety(angObj.angle, theta);
        if (safety.isUnsafe && safety.k > 1) {
            // Cut this vertex angle into theta and (k-1)*theta
            // Find edge opposite to vertex i
            const edgeIndex = (i + 1) % 3;
            // Target point P on edge so that angle at vertex i becomes theta
            // We can search or solve for t
            const P = findPointForTargetAngle(vertices, i, theta);
            if (P) {
                return {
                    edgeIndex: P.edgeIndex,
                    P: P.point,
                    t: P.t,
                    reason: `将 ${angObj.label} 角 (${angObj.angle.toFixed(1)}° = ${safety.k}θ) 切出一个 θ = ${theta.toFixed(1)}° 角`
                };
            }
        }
    }

    // Case 2: A right triangle can be advanced for every n >= 3.
    // If its acute angle B is at most 45°, choose k with 45° < kθ <= 90°.
    // The next cut gives the two choices angles kθ and (n-k)θ respectively.
    if (ratioInfo.isValid) {
        const rightAngleIndex = angles.findIndex(angle =>
            Math.abs(angle.angle - 90) < EPSILON
        );
        if (ratioInfo.n >= 3 && rightAngleIndex >= 0) {
            const acuteIndices = [0, 1, 2].filter(index => index !== rightAngleIndex);
            const smallerAcuteIndex = angles[acuteIndices[0]].angle <= angles[acuteIndices[1]].angle
                ? acuteIndices[0]
                : acuteIndices[1];
            const k = Math.floor(45 / theta) + 1;
            const multipleAngle = k * theta;
            const targetAngle = multipleAngle - angles[smallerAcuteIndex].angle;
            const cut = findPointForRightTriangleStrategy(
                vertices,
                rightAngleIndex,
                smallerAcuteIndex,
                targetAngle
            );
            if (cut) {
                return {
                    ...cut,
                    reason: `在直角三角形中构造 ${k}θ 与 ${(ratioInfo.n - k)}θ，单于两种选择都进入必胜链`
                };
            }
        }

        // First turn: select an altitude whose foot lies on the opposite side.
        // Find altitude cut from vertex with largest angle
        let maxVertexIdx = 0;
        let maxAngle = angles[0].angle;
        for (let i = 1; i < 3; i++) {
            if (angles[i].angle > maxAngle) {
                maxAngle = angles[i].angle;
                maxVertexIdx = i;
            }
        }
        const alt = findAltitudeFoot(vertices, maxVertexIdx);
        if (alt) {
            return {
                edgeIndex: alt.edgeIndex,
                P: alt.point,
                t: alt.t,
                reason: '作高线构造直角三角形，为下一步的整数倍角构造做准备'
            };
        }
    }

    // Fallback: Pick mid-point cut on longest edge
    let maxEdgeIdx = 0;
    let maxLen = 0;
    for (let i = 0; i < 3; i++) {
        const len = distance(vertices[i], vertices[(i + 1) % 3]);
        if (len > maxLen) {
            maxLen = len;
            maxEdgeIdx = i;
        }
    }
    const p1 = vertices[maxEdgeIdx];
    const p2 = vertices[(maxEdgeIdx + 1) % 3];
    const midP = interpolatePoint(p1, p2, 0.5);

    return {
        edgeIndex: maxEdgeIdx,
        P: midP,
        t: 0.5,
        reason: "在中点尝试直线剪切"
    };
}

/**
 * Finds the official second cut in a right triangle. The reference acute vertex
 * anchors the requested angle and the cut point remains on the opposite edge.
 */
function findPointForRightTriangleStrategy(
    vertices,
    rightAngleIndex,
    referenceVertexIndex,
    targetAngle
) {
    const edgeIndex = (rightAngleIndex + 1) % 3;
    const edgeStartIndex = edgeIndex;
    const edgeEndIndex = (edgeIndex + 1) % 3;
    const referenceIsStart = edgeStartIndex === referenceVertexIndex;
    if (!referenceIsStart && edgeEndIndex !== referenceVertexIndex) return null;

    const referencePoint = vertices[referenceVertexIndex];
    const otherPoint = vertices[
        referenceIsStart ? edgeEndIndex : edgeStartIndex
    ];
    const apex = vertices[rightAngleIndex];
    let low = 0.0001;
    let high = 0.9999;

    for (let step = 0; step < 40; step++) {
        const fraction = (low + high) / 2;
        const point = interpolatePoint(referencePoint, otherPoint, fraction);
        const referenceVector = {
            x: referencePoint.x - apex.x,
            y: referencePoint.y - apex.y
        };
        const cutVector = { x: point.x - apex.x, y: point.y - apex.y };
        const cosine = Math.max(-1, Math.min(1,
            (referenceVector.x * cutVector.x + referenceVector.y * cutVector.y) /
            (Math.hypot(referenceVector.x, referenceVector.y) * Math.hypot(cutVector.x, cutVector.y))
        ));
        const angle = (Math.acos(cosine) * 180) / Math.PI;
        if (Math.abs(angle - targetAngle) < EPSILON) {
            return {
                edgeIndex,
                t: referenceIsStart ? fraction : 1 - fraction,
                P: point
            };
        }
        if (angle < targetAngle) low = fraction;
        else high = fraction;
    }
    return null;
}

/**
 * Helper: Find point P on opposite edge to vertex V such that angle at V is targetAngle
 */
function findPointForTargetAngle(vertices, vertexIndex, targetAngle) {
    const V = vertices[vertexIndex];
    const edgeIndex = (vertexIndex + 1) % 3;
    const P1 = vertices[edgeIndex];
    const P2 = vertices[(edgeIndex + 1) % 3];

    // Binary search for t in [0.01, 0.99]
    let low = 0.01, high = 0.99;
    let bestT = 0.5;
    let bestPoint = interpolatePoint(P1, P2, 0.5);

    for (let step = 0; step < 20; step++) {
        const midT = (low + high) / 2;
        const P = interpolatePoint(P1, P2, midT);

        // Vector VP1 and VP
        const v1 = { x: P1.x - V.x, y: P1.y - V.y };
        const vp = { x: P.x - V.x, y: P.y - V.y };

        const dot = v1.x * vp.x + v1.y * vp.y;
        const mag1 = Math.hypot(v1.x, v1.y);
        const magP = Math.hypot(vp.x, vp.y);

        const cosVal = Math.max(-1, Math.min(1, dot / (mag1 * magP)));
        const angDeg = (Math.acos(cosVal) * 180) / Math.PI;

        if (Math.abs(angDeg - targetAngle) < 1e-3) {
            return { point: P, edgeIndex, t: midT };
        }

        if (angDeg < targetAngle) {
            low = midT;
        } else {
            high = midT;
        }
        bestT = midT;
        bestPoint = P;
    }

    return { point: bestPoint, edgeIndex, t: bestT };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getShanYuChoice,
        getMulanOptimalCut,
        findPointForRightTriangleStrategy
    };
}
