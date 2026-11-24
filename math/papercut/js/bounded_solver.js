// codex: 2026-11-24 限尺拼图模式 (1..K) 预设最优解与动态剪枝求解器，与自由剪纸模式共同构成「一体两面」引擎

/**
 * 限尺拼图经典预设最优解表（源自原 boardgame/square，最大尺寸 K = 4）
 */
const BOUNDED_K4_PRESETS = {
    5: [
        { row: 0, col: 0, size: 3 }, { row: 0, col: 3, size: 2 },
        { row: 2, col: 3, size: 2 }, { row: 3, col: 0, size: 2 },
        { row: 3, col: 2, size: 1 }, { row: 4, col: 2, size: 1 },
        { row: 4, col: 3, size: 1 }, { row: 4, col: 4, size: 1 }
    ],
    6: [
        { row: 0, col: 0, size: 3 }, { row: 0, col: 3, size: 3 },
        { row: 3, col: 0, size: 3 }, { row: 3, col: 3, size: 3 }
    ],
    7: [
        { row: 0, col: 0, size: 4 }, { row: 0, col: 4, size: 3 },
        { row: 3, col: 4, size: 2 }, { row: 3, col: 6, size: 1 },
        { row: 4, col: 0, size: 3 }, { row: 4, col: 3, size: 1 },
        { row: 4, col: 6, size: 1 }, { row: 5, col: 3, size: 2 },
        { row: 5, col: 5, size: 2 }
    ],
    8: [
        { row: 0, col: 0, size: 4 }, { row: 0, col: 4, size: 4 },
        { row: 4, col: 0, size: 4 }, { row: 4, col: 4, size: 4 }
    ],
    9: [
        { row: 0, col: 0, size: 3 }, { row: 0, col: 3, size: 3 }, { row: 0, col: 6, size: 3 },
        { row: 3, col: 0, size: 3 }, { row: 3, col: 3, size: 3 }, { row: 3, col: 6, size: 3 },
        { row: 6, col: 0, size: 3 }, { row: 6, col: 3, size: 3 }, { row: 6, col: 6, size: 3 }
    ],
    10: [
        { row: 0, col: 0, size: 4 }, { row: 0, col: 4, size: 4 }, { row: 4, col: 0, size: 4 },
        { row: 4, col: 4, size: 3 }, { row: 4, col: 7, size: 3 },
        { row: 7, col: 4, size: 3 }, { row: 7, col: 7, size: 3 },
        { row: 0, col: 8, size: 2 }, { row: 2, col: 8, size: 2 },
        { row: 8, col: 0, size: 2 }, { row: 8, col: 2, size: 2 }
    ],
    11: [
        { row: 0, col: 0, size: 4 }, { row: 0, col: 4, size: 4 },
        { row: 4, col: 0, size: 4 }, { row: 4, col: 4, size: 4 },
        { row: 0, col: 8, size: 3 }, { row: 3, col: 8, size: 3 },
        { row: 6, col: 8, size: 3 }, { row: 8, col: 0, size: 3 },
        { row: 8, col: 3, size: 3 }, { row: 8, col: 6, size: 2 },
        { row: 9, col: 8, size: 2 }, { row: 9, col: 10, size: 1 },
        { row: 10, col: 6, size: 1 }, { row: 10, col: 7, size: 1 },
        { row: 10, col: 10, size: 1 }
    ],
    12: [
        { row: 0, col: 0, size: 4 }, { row: 0, col: 4, size: 4 }, { row: 0, col: 8, size: 4 },
        { row: 4, col: 0, size: 4 }, { row: 4, col: 4, size: 4 }, { row: 4, col: 8, size: 4 },
        { row: 8, col: 0, size: 4 }, { row: 8, col: 4, size: 4 }, { row: 8, col: 8, size: 4 }
    ]
};

const _boundedCache = {};

/**
 * 求解 N×N 正方形在最大允许边长为 K (1 <= K <= N-1) 时的最少块数最优剖分。
 * 采用天际线 (Skyline) IDA* 迭代加深 + 面积下界剪枝，并缓存结果。
 */
function solveBoundedMinTiling(N, K) {
    const n = Math.max(2, Math.min(25, parseInt(N, 10) || 10));
    const maxTile = Math.max(1, Math.min(n - 1, parseInt(K, 10) || (n - 1)));
    const cacheKey = `${n}_${maxTile}`;
    if (_boundedCache[cacheKey]) {
        return _boundedCache[cacheKey];
    }

    // 1. 若 K = 4 且在预设表中，直接命中
    if (maxTile === 4 && BOUNDED_K4_PRESETS[n]) {
        const res = BOUNDED_K4_PRESETS[n].map(p => ({ ...p }));
        _boundedCache[cacheKey] = res;
        return res;
    }

    // 2. K = 1：全 1x1
    if (maxTile === 1) {
        const res = [];
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) res.push({ row: r, col: c, size: 1 });
        }
        _boundedCache[cacheKey] = res;
        return res;
    }

    // 3. K = 2：尽可能放 2x2，奇数边补 1x1
    if (maxTile === 2) {
        const res = [];
        const half = Math.floor(n / 2);
        for (let r = 0; r < half * 2; r += 2) {
            for (let c = 0; c < half * 2; c += 2) {
                res.push({ row: r, col: c, size: 2 });
            }
        }
        if (n % 2 === 1) {
            for (let r = 0; r < n; r++) res.push({ row: r, col: n - 1, size: 1 });
            for (let c = 0; c < n - 1; c++) res.push({ row: n - 1, col: c, size: 1 });
        }
        _boundedCache[cacheKey] = res;
        return res;
    }

    // 4. 若存在某 d <= K 整除 N 且 (N/d)^2 == ceil(N^2 / K^2) 直接最优（例如 10x10 K=5 -> 4块）
    const areaLB = Math.ceil((n * n) / (maxTile * maxTile));
    for (let d = maxTile; d >= 2; d--) {
        if (n % d === 0) {
            const cnt = (n / d) * (n / d);
            if (cnt === areaLB || cnt === 4) {
                const res = [];
                for (let r = 0; r < n; r += d) {
                    for (let c = 0; c < n; c += d) {
                        res.push({ row: r, col: c, size: d });
                    }
                }
                _boundedCache[cacheKey] = res;
                return res;
            }
        }
    }

    // 5. 通用天际线 IDA* 求解（带节点上限防卡顿，失败时回退贪心构造）
    const heights = new Int32Array(n);
    const ans = [];
    let nodes = 0;
    const MAX_NODES = 120000;
    let timedOut = false;

    function dfs(remArea, count, limit) {
        if (remArea === 0) return true;
        if (count >= limit) return false;
        if (count + Math.ceil(remArea / (maxTile * maxTile)) > limit) return false;
        if (++nodes > MAX_NODES) {
            timedOut = true;
            return false;
        }

        // 找最矮（靠左优先）列
        let minH = n;
        let c0 = 0;
        for (let c = 0; c < n; c++) {
            if (heights[c] < minH) {
                minH = heights[c];
                c0 = c;
            }
        }
        let w = 0;
        while (c0 + w < n && heights[c0 + w] === minH) w++;
        const maxS = Math.min(w, n - minH, maxTile);

        for (let s = maxS; s >= 1; s--) {
            for (let c = c0; c < c0 + s; c++) heights[c] += s;
            ans.push({ row: minH, col: c0, size: s });
            if (dfs(remArea - s * s, count + 1, limit)) return true;
            ans.pop();
            for (let c = c0; c < c0 + s; c++) heights[c] -= s;
            if (timedOut) return false;
        }
        return false;
    }

    const startLimit = Math.max(4, areaLB);
    for (let limit = startLimit; limit <= n * n; limit++) {
        nodes = 0;
        timedOut = false;
        heights.fill(0);
        ans.length = 0;
        if (dfs(n * n, 0, limit)) {
            const res = ans.map(p => ({ ...p }));
            _boundedCache[cacheKey] = res;
            return res;
        }
        if (timedOut) break;
    }

    // 兜底贪心天际线填充（保证永不失败）
    heights.fill(0);
    const greedy = [];
    let rem = n * n;
    while (rem > 0) {
        let minH = n;
        let c0 = 0;
        for (let c = 0; c < n; c++) {
            if (heights[c] < minH) {
                minH = heights[c];
                c0 = c;
            }
        }
        let w = 0;
        while (c0 + w < n && heights[c0 + w] === minH) w++;
        const s = Math.min(w, n - minH, maxTile);
        for (let c = c0; c < c0 + s; c++) heights[c] += s;
        greedy.push({ row: minH, col: c0, size: s });
        rem -= s * s;
    }
    _boundedCache[cacheKey] = greedy;
    return greedy;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BOUNDED_K4_PRESETS, solveBoundedMinTiling };
} else {
    window.BOUNDED_K4_PRESETS = BOUNDED_K4_PRESETS;
    window.solveBoundedMinTiling = solveBoundedMinTiling;
}
