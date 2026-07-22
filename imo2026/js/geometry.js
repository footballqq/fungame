// codex: 2026-07-22 Calculate cut angles, snap targets, and support keyboard angle adjustment.
/**
 * Geometry engine for triangle operations and angle safety checks.
 */

const EPSILON = 1e-4;
// 角度显示、历史记录和交互判定统一为一位小数，避免不同舍入规则给出矛盾结论。
const ANGLE_DISPLAY_PRECISION = 10;

function roundAngleForDisplay(angle) {
    return Math.round((angle + Number.EPSILON) * ANGLE_DISPLAY_PRECISION) /
        ANGLE_DISPLAY_PRECISION;
}

function formatAngleForDisplay(angle) {
    return roundAngleForDisplay(angle).toFixed(1);
}

function isIntegerRatioTheta(theta) {
    if (theta <= 0 || theta >= 180) return { isValid: false, n: null };
    const n = Math.round(180.0 / theta);
    const isExact = n >= 2 && Math.abs(180.0 / n - theta) < EPSILON;
    return { isValid: isExact, n: isExact ? n : null };
}

function checkAngleSafety(angle, theta) {
    const displayedAngle = roundAngleForDisplay(angle);
    const displayedTheta = roundAngleForDisplay(theta);
    const k = Math.round(displayedAngle / displayedTheta);
    const isMultiple = k >= 1 &&
        Math.abs(k * displayedTheta - displayedAngle) < EPSILON;
    const isExactTheta = Math.abs(displayedAngle - displayedTheta) < EPSILON;
    return {
        isUnsafe: isMultiple,
        isExactTheta: isExactTheta,
        k: isMultiple ? k : null
    };
}

function distance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function calculateTriangleAngles(vertices) {
    const [A, B, C] = vertices;
    const lab = distance(A, B);
    const lbc = distance(B, C);
    const lca = distance(C, A);

    const cosA = Math.max(-1, Math.min(1, (lab * lab + lca * lca - lbc * lbc) / (2 * lab * lca)));
    const cosB = Math.max(-1, Math.min(1, (lab * lab + lbc * lbc - lca * lca) / (2 * lab * lbc)));
    const cosC = Math.max(-1, Math.min(1, (lbc * lbc + lca * lca - lab * lab) / (2 * lbc * lca)));

    const angA = (Math.acos(cosA) * 180) / Math.PI;
    const angB = (Math.acos(cosB) * 180) / Math.PI;
    const angC = (Math.acos(cosC) * 180) / Math.PI;

    return [
        { vertexIndex: 0, label: 'A', angle: angA },
        { vertexIndex: 1, label: 'B', angle: angB },
        { vertexIndex: 2, label: 'C', angle: angC }
    ];
}

function interpolatePoint(p1, p2, t) {
    return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
    };
}

function projectPointToSegment(P, A, B) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { point: A, t: 0, dist: distance(P, A) };

    let t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
    t = Math.max(0.01, Math.min(0.99, t));

    const proj = { x: A.x + t * dx, y: A.y + t * dy };
    return { point: proj, t: t, dist: distance(P, proj) };
}

/**
 * Projects a point to the finite segment without the UI safety margin.
 * Returns null when the perpendicular foot is not an interior cut point.
 */
function projectPointToInteriorSegment(P, A, B) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return null;

    const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
    if (t <= EPSILON || t >= 1 - EPSILON) return null;

    return {
        point: { x: A.x + t * dx, y: A.y + t * dy },
        t,
        dist: 0
    };
}

function findAltitudeFoot(vertices, vertexIndex) {
    const oppVertex = vertices[vertexIndex];
    const p1 = vertices[(vertexIndex + 1) % 3];
    const p2 = vertices[(vertexIndex + 2) % 3];
    const proj = projectPointToInteriorSegment(oppVertex, p1, p2);
    if (!proj) return null;
    return { point: proj.point, edgeIndex: (vertexIndex + 1) % 3, t: proj.t };
}

function splitTriangle(vertices, edgeIndex, P) {
    const v0 = vertices[edgeIndex];
    const v1 = vertices[(edgeIndex + 1) % 3];
    const vOpp = vertices[(edgeIndex + 2) % 3];

    const T1 = [ { ...v0 }, { ...P }, { ...vOpp } ];
    const T2 = [ { ...P }, { ...v1 }, { ...vOpp } ];

    return [T1, T2];
}

/**
 * Calculate the two supplementary angles formed at cut point P on edgeIndex
 * Returns { P, angleP1, angleP2 }
 */
function calculateCutPointAngles(vertices, edgeIndex, t) {
    const v0 = vertices[edgeIndex];
    const v1 = vertices[(edgeIndex + 1) % 3];
    const vOpp = vertices[(edgeIndex + 2) % 3];

    const P = interpolatePoint(v0, v1, t);

    const vPA = { x: vOpp.x - P.x, y: vOpp.y - P.y };
    const vPB = { x: v0.x - P.x, y: v0.y - P.y };
    const vPC = { x: v1.x - P.x, y: v1.y - P.y };

    const magPA = Math.hypot(vPA.x, vPA.y) || 1;
    const magPB = Math.hypot(vPB.x, vPB.y) || 1;
    const magPC = Math.hypot(vPC.x, vPC.y) || 1;

    const cos1 = Math.max(-1, Math.min(1, (vPA.x * vPB.x + vPA.y * vPB.y) / (magPA * magPB)));
    const cos2 = Math.max(-1, Math.min(1, (vPA.x * vPC.x + vPA.y * vPC.y) / (magPA * magPC)));

    const ang1 = (Math.acos(cos1) * 180) / Math.PI;
    const ang2 = (Math.acos(cos2) * 180) / Math.PI;

    return { P, angleP1: ang1, angleP2: ang2 };
}

/**
 * Snaps a cut parameter to an exact P-side angle when the pointer is nearby.
 */
function snapCutParameter(vertices, edgeIndex, currentT, targetAngles, maxDeltaT) {
    const candidates = [];
    const sampleCount = 80;
    const evaluate = (t, angleKey, targetAngle) =>
        calculateCutPointAngles(vertices, edgeIndex, t)[angleKey] - targetAngle;

    targetAngles.forEach(targetAngle => {
        if (targetAngle <= 0 || targetAngle >= 180) return;
        ['angleP1', 'angleP2'].forEach(angleKey => {
            let previousT = 0.01;
            let previousValue = evaluate(previousT, angleKey, targetAngle);
            for (let index = 1; index <= sampleCount; index++) {
                const nextT = 0.01 + index * 0.98 / sampleCount;
                const nextValue = evaluate(nextT, angleKey, targetAngle);
                if (previousValue === 0 || previousValue * nextValue <= 0) {
                    let low = previousT;
                    let high = nextT;
                    for (let step = 0; step < 32; step++) {
                        const middle = (low + high) / 2;
                        const middleValue = evaluate(middle, angleKey, targetAngle);
                        if (previousValue * middleValue <= 0) high = middle;
                        else {
                            low = middle;
                            previousValue = middleValue;
                        }
                    }
                    const t = (low + high) / 2;
                    candidates.push({ t, targetAngle });
                }
                previousT = nextT;
                previousValue = nextValue;
            }
        });
    });

    candidates.sort((first, second) =>
        Math.abs(first.t - currentT) - Math.abs(second.t - currentT)
    );
    const nearest = candidates[0];
    if (nearest && Math.abs(nearest.t - currentT) <= maxDeltaT) return nearest;
    return { t: currentT, targetAngle: null };
}

/**
 * Finds the nearest cut parameter that gives one named P-side angle exactly.
 */
function findCutParameterForPointAngle(vertices, edgeIndex, currentT, targetAngle, angleKey) {
    if (targetAngle <= 0 || targetAngle >= 180) return null;
    const candidates = [];
    const sampleCount = 100;
    const evaluate = t => calculateCutPointAngles(vertices, edgeIndex, t)[angleKey] - targetAngle;
    let previousT = 0.01;
    let previousValue = evaluate(previousT);

    for (let index = 1; index <= sampleCount; index++) {
        const nextT = 0.01 + index * 0.98 / sampleCount;
        const nextValue = evaluate(nextT);
        if (previousValue === 0 || previousValue * nextValue <= 0) {
            let low = previousT;
            let high = nextT;
            let lowValue = previousValue;
            for (let step = 0; step < 36; step++) {
                const middle = (low + high) / 2;
                const middleValue = evaluate(middle);
                if (lowValue * middleValue <= 0) high = middle;
                else {
                    low = middle;
                    lowValue = middleValue;
                }
            }
            candidates.push((low + high) / 2);
        }
        previousT = nextT;
        previousValue = nextValue;
    }

    candidates.sort((first, second) => Math.abs(first - currentT) - Math.abs(second - currentT));
    return candidates[0] ?? null;
}

/**
 * Calculates the two angles into which the opposite vertex is split by a cut.
 */
function calculateCutVertexAngles(vertices, edgeIndex, t) {
    const v0 = vertices[edgeIndex];
    const v1 = vertices[(edgeIndex + 1) % 3];
    const vOpp = vertices[(edgeIndex + 2) % 3];
    const P = interpolatePoint(v0, v1, t);
    const vectorToP = { x: P.x - vOpp.x, y: P.y - vOpp.y };
    const vectorToV0 = { x: v0.x - vOpp.x, y: v0.y - vOpp.y };
    const vectorToV1 = { x: v1.x - vOpp.x, y: v1.y - vOpp.y };

    const angleBetween = (first, second) => {
        const dot = first.x * second.x + first.y * second.y;
        const magnitude = Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y);
        return Math.acos(Math.max(-1, Math.min(1, dot / (magnitude || 1)))) * 180 / Math.PI;
    };

    return {
        P,
        vertexIndex: (edgeIndex + 2) % 3,
        angleV1: angleBetween(vectorToP, vectorToV0),
        angleV2: angleBetween(vectorToP, vectorToV1)
    };
}

function hasExactThetaAngle(vertices, theta) {
    const angles = calculateTriangleAngles(vertices);
    return angles.some(a => checkAngleSafety(a.angle, theta).isExactTheta);
}

function isTriangleSafe(vertices, theta) {
    const angles = calculateTriangleAngles(vertices);
    return angles.every(a => !checkAngleSafety(a.angle, theta).isUnsafe);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isIntegerRatioTheta,
        roundAngleForDisplay,
        formatAngleForDisplay,
        checkAngleSafety,
        distance,
        calculateTriangleAngles,
        interpolatePoint,
        projectPointToSegment,
        projectPointToInteriorSegment,
        findAltitudeFoot,
        splitTriangle,
        calculateCutPointAngles,
        snapCutParameter,
        findCutParameterForPointAngle,
        calculateCutVertexAngles,
        hasExactThetaAngle,
        isTriangleSafe
    };
}
