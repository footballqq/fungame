// codex: 2026-08-28 球盒模型小规模全枚举生成器，用于教学解析中直观展示所有分配方案

/**
 * 球盒模型全枚举工具
 * 支持 4 种模型的分配方案穷举与格式化渲染
 */

/**
 * 1. DD: 不同球 不同盒 (Distinct Balls, Distinct Boxes)
 * 每个球独立放入 1..m 某个盒子中，共 m^n 种方案
 * @param {number} n 球数
 * @param {number} m 盒数
 * @returns {Array<{index: number, boxes: number[][]}>}
 */
export function enumerateDD(n, m) {
    if (m <= 0) return [];
    if (n === 0) return [{ index: 1, boxes: Array.from({ length: m }, () => []) }];

    const results = [];
    const current = new Array(n).fill(0);

    function backtrack(ballIdx) {
        if (ballIdx === n) {
            const boxes = Array.from({ length: m }, () => []);
            for (let i = 0; i < n; i++) {
                boxes[current[i]].push(i + 1); // 球编号 1..n
            }
            results.push({
                index: results.length + 1,
                boxes: boxes
            });
            return;
        }

        for (let boxIdx = 0; boxIdx < m; boxIdx++) {
            current[ballIdx] = boxIdx;
            backtrack(ballIdx + 1);
        }
    }

    backtrack(0);
    return results;
}

/**
 * 2. ID: 相同球 不同盒 (Identical Balls, Distinct Boxes)
 * 非负整数解 x1 + x2 + ... + xm = n，共 C(n+m-1, m-1) 种方案
 * @param {number} n 球数
 * @param {number} m 盒数
 * @returns {Array<{index: number, counts: number[], boxes: number[][]}>}
 */
export function enumerateID(n, m) {
    if (m <= 0) return [];
    if (n === 0) {
        return [{
            index: 1,
            counts: Array(m).fill(0),
            boxes: Array.from({ length: m }, () => [])
        }];
    }

    const results = [];
    const current = new Array(m).fill(0);

    function backtrack(boxIdx, remaining) {
        if (boxIdx === m - 1) {
            current[boxIdx] = remaining;
            const counts = [...current];
            const boxes = counts.map(count => Array(count).fill('●'));
            results.push({
                index: results.length + 1,
                counts: counts,
                boxes: boxes
            });
            return;
        }

        for (let count = 0; count <= remaining; count++) {
            current[boxIdx] = count;
            backtrack(boxIdx + 1, remaining - count);
        }
    }

    backtrack(0, n);
    return results;
}

/**
 * 3. DI: 不同球 相同盒 (Distinct Balls, Identical Boxes)
 * 允许空盒：即划分到 1..m 个非空集合（斯特林数累加 sum_{k=1}^m S(n,k)）
 * @param {number} n 球数
 * @param {number} m 盒数 (最多可用盒数)
 * @returns {Array<{index: number, parts: number[][], summary: string}>}
 */
export function enumerateDI(n, m) {
    if (m <= 0) return [];
    if (n === 0) {
        return [{
            index: 1,
            parts: [],
            summary: '空'
        }];
    }

    const allPartitions = [];

    // 生成将 {1..n} 划分为非空集合的方案（集合无序）
    function partitionBacktrack(ballIdx, currentGroups) {
        if (ballIdx > n) {
            if (currentGroups.length <= m) {
                // 规范化排序：按各组第一个元素排序或组大小排序
                const sortedGroups = currentGroups
                    .map(g => [...g].sort((a, b) => a - b))
                    .sort((a, b) => {
                        if (b.length !== a.length) return b.length - a.length;
                        return a[0] - b[0];
                    });
                allPartitions.push(sortedGroups);
            }
            return;
        }

        // 尝试加入已有的一组
        for (let i = 0; i < currentGroups.length; i++) {
            currentGroups[i].push(ballIdx);
            partitionBacktrack(ballIdx + 1, currentGroups);
            currentGroups[i].pop();
        }

        // 尝试开辟新的一组 (如果未超过 m)
        if (currentGroups.length < m) {
            currentGroups.push([ballIdx]);
            partitionBacktrack(ballIdx + 1, currentGroups);
            currentGroups.pop();
        }
    }

    partitionBacktrack(1, []);

    // 格式化输出
    return allPartitions.map((parts, idx) => {
        const summary = parts.map(p => `{${p.join(',')}}`).join(' + ');
        return {
            index: idx + 1,
            parts: parts,
            summary: summary
        };
    });
}

/**
 * 4. II: 相同球 相同盒 (Identical Balls, Identical Boxes)
 * 整数分拆：将 n 拆分为不超过 m 个非负整数之和，按降序排列
 * @param {number} n 球数
 * @param {number} m 盒数 (最多可用份数)
 * @returns {Array<{index: number, partition: number[], summary: string}>}
 */
export function enumerateII(n, m) {
    if (m <= 0) return [];
    if (n === 0) {
        return [{
            index: 1,
            partition: [0],
            summary: '0'
        }];
    }

    const results = [];

    function backtrack(remaining, maxAllowed, current) {
        if (remaining === 0) {
            results.push({
                index: results.length + 1,
                partition: [...current],
                summary: current.join(' + ')
            });
            return;
        }

        if (current.length >= m) return;

        const limit = Math.min(remaining, maxAllowed);
        for (let val = limit; val >= 1; val--) {
            current.push(val);
            backtrack(remaining - val, val, current);
            current.pop();
        }
    }

    backtrack(n, n, []);
    return results;
}

/**
 * 统一获取指定模型下的枚举列表
 * @param {string} mode 'DD' | 'ID' | 'DI' | 'II'
 * @param {number} n 球数
 * @param {number} m 盒数
 */
export function getEnumeration(mode, n, m) {
    switch (mode) {
        case 'DD':
            return enumerateDD(n, m);
        case 'ID':
            return enumerateID(n, m);
        case 'DI':
            return enumerateDI(n, m);
        case 'II':
            return enumerateII(n, m);
        default:
            return [];
    }
}
