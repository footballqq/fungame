/**
 * Math utilities for the 4 combinatorial cases
 */

export const MODELS = {
    II: {
        id: 'II',
        nameZh: '相同球 相同盒',
        nameEn: 'Identical Balls, Identical Boxes',
        calculate: (n, m) => {
            // Partition function p(n, m) - partitions of n into at most m parts
            const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
            for (let j = 0; j <= m; j++) dp[0][j] = 1;
            for (let i = 1; i <= n; i++) {
                for (let j = 1; j <= m; j++) {
                    dp[i][j] = dp[i][j - 1];
                    if (i >= j) dp[i][j] += dp[i - j][j];
                }
            }
            return dp;
        },
        formulaZh: '递推 1：f(n, m) = f(n, m-1) + f(n-m, m)\n递推 2：f(n, m) = Σ_{k=1}^m f(n-k, k)',
        formulaEn: 'Recurrence 1: f(n, m) = f(n, m-1) + f(n-m, m)\nRecurrence 2: f(n, m) = Σ_{k=1}^m f(n-k, k)',
        closedZh: '组合意义：n 的 m 分拆 (Integer Partitions)',
        closedEn: 'Note: Partitions of n into at most m parts',
        explainZh: '相同球相同盒。讨论如何分类：如果至少有一个空盒，即 f(n, m-1)；如果每个盒子都有球，先各放一个，剩下 n-m 个球放进 m 个盒子，即 f(n-m, m)。另一种方式是按非空盒子数 k 累加，在矩阵中表现为斜线。',
        explainEn: 'Identical balls, Identical boxes. Two views: 1. At least one empty box f(n, m-1) vs. all boxes have balls f(n-m, m). 2. Summing over exactly k non-empty boxes, which forms a diagonal in the matrix.',
        getDependencies: (n, m, alt = false) => {
            if (!alt) {
                return [
                    { r: n, c: m - 1, cls: 'cell-source-1', label: '空盒' },
                    { r: n - m, c: m, cls: 'cell-source-2', label: '全满' }
                ];
            } else {
                const deps = [];
                for (let k = 1; k <= m; k++) {
                    if (n - k >= 0) {
                        deps.push({ r: n - k, c: k, cls: 'cell-source-group', label: `k=${k}` });
                    }
                }
                return deps;
            }
        }
    },
    DI: {
        id: 'DI',
        nameZh: '不同球 相同盒',
        nameEn: 'Distinct Balls, Identical Boxes',
        calculate: (n, m) => {
            const S = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
            S[0][0] = 1;
            for (let i = 1; i <= n; i++) {
                for (let j = 1; j <= m; j++) {
                    S[i][j] = j * S[i - 1][j] + S[i - 1][j - 1];
                }
            }
            const total = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
            for (let i = 0; i <= n; i++) {
                for (let j = 1; j <= m; j++) {
                    let sum = 0;
                    for (let k = 1; k <= j; k++) sum += S[i][k];
                    total[i][j] = i === 0 ? 1 : sum;
                }
            }
            return { matrix: S, totalMatrix: total, isStirling: true };
        },
        formulaZh: '递推 1：S(n, m) = m·S(n-1, m) + S(n-1, m-1)\n公式 2：f(n, m) = Σ_{k=1}^m S(n, k)',
        formulaEn: 'Recurrence 1: S(n, m) = m·S(n-1, m) + S(n-1, m-1)\nFormula 2: f(n, m) = Σ_{k=1}^m S(n, k)',
        closedZh: '总数：Σ S(n, k) (将 n 个不同球放入不超过 m 个相同盒子)',
        closedEn: 'Total: Σ S(n, k) (n distinct balls into at most m identical boxes)',
        explainZh: '不同球相同盒。S(n, m) 是第二类斯特林数。逻辑：新球可以放进已有的 m 个盒子里 (m*S(n-1, m))，也可以单独占一个新盒子 (S(n-1, m-1))。总数是放入 1 到 m 个盒子的方法和。',
        explainEn: 'Distinct balls into identical boxes. S(n, m) is Stirling Number II. Logic: New ball enters one of m existing boxes, or creates a new box. The total f(n, m) is the sum of S(n, k) for k=1 to m.',
        getDependencies: (n, m, alt = false) => {
            if (!alt) {
                return [
                    { r: n - 1, c: m, cls: 'cell-source-1', label: 'm×' },
                    { r: n - 1, c: m - 1, cls: 'cell-source-2' }
                ];
            } else {
                const deps = [];
                for (let k = 1; k <= m; k++) {
                    deps.push({ r: n, c: k, cls: 'cell-source-group', label: `k=${k}`, useStirling: true });
                }
                return deps;
            }
        }
    },
    ID: {
        id: 'ID',
        nameZh: '相同球 不同盒',
        nameEn: 'Identical Balls, Distinct Boxes',
        calculate: (n, m) => {
            // Combinations with repetition: H(m, n) = C(n+m-1, m-1)
            // Recurrence: C(N, K) = C(N-1, K) + C(N-1, K-1)
            // Here f(n, m) = C(n+m-1, m-1)
            const maxN = 20;
            const C = Array.from({ length: maxN + 1 }, () => Array(maxN + 1).fill(0));
            for (let i = 0; i <= maxN; i++) {
                C[i][0] = 1;
                for (let j = 1; j <= i; j++) {
                    C[i][j] = C[i - 1][j - 1] + C[i - 1][j];
                }
            }
            const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
            for (let i = 0; i <= n; i++) {
                for (let j = 1; j <= m; j++) {
                    dp[i][j] = C[i + j - 1][j - 1];
                }
            }
            return dp;
        },
        formulaZh: '递推 1：f(n, m) = f(n, m-1) + f(n-1, m)\n递推 2：f(n, m) = Σ_{k=0}^n f(k, m-1)',
        formulaEn: 'Recurrence 1: f(n, m) = f(n, m-1) + f(n-1, m)\nRecurrence 2: f(n, m) = Σ_{k=0}^n f(k, m-1)',
        closedZh: '组合意义：n 个球放入 m 个盒子 (隔板法 C(n+m-1, m-1))',
        closedEn: 'Note: Identical balls into distinct boxes (Stars and Bars)',
        explainZh: '相同球不同盒。可以按最后一个盒子的球数分类：放 0 个球，1 个球... 到 n 个球。即 f(n, m) 等于前 m-1 个盒子放不同数量球的方法数之和。',
        explainEn: 'Identical balls into distinct boxes. Classify by the last box: it can have 0 to n balls. Thus f(n, m) is the sum of ways to put k balls into m-1 boxes.',
        getDependencies: (n, m, alt = false) => {
            if (!alt) {
                return [
                    { r: n, c: m - 1, cls: 'cell-source-1', label: '0球' },
                    { r: n - 1, c: m, cls: 'cell-source-2', label: '≥1球' }
                ];
            } else {
                const deps = [];
                for (let k = 0; k <= n; k++) {
                    deps.push({ r: k, c: m - 1, cls: 'cell-source-group', label: `k=${k}` });
                }
                return deps;
            }
        }
    },
    DD: {
        id: 'DD',
        nameZh: '不同球 不同盒',
        nameEn: 'Distinct Balls, Distinct Boxes',
        calculate: (n, m) => {
            // f(n, m) = m^n
            // Recurrence: f(n, m) = m * f(n-1, m)
            const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
            for (let j = 0; j <= m; j++) dp[0][j] = 1;
            for (let i = 1; i <= n; i++) {
                for (let j = 0; j <= m; j++) {
                    dp[i][j] = Math.pow(j, i);
                }
            }
            return dp;
        },
        formulaZh: '递推式：f(n, m) = m · f(n-1, m)',
        formulaEn: 'Recurrence: f(n, m) = m · f(n-1, m)',
        closedZh: '通项公式：m^n (每个球有 m 种选择)',
        closedEn: 'General Form: m^n (Each ball has m choices)',
        explainZh: '不同球不同盒。假设已经放好了 n-1 个球，对于第 n 个球，依然有 m 种盒子可以选。所以 f(n, m) = m * f(n-1, m)。总数即 m^n。',
        explainEn: 'Distinct balls into distinct boxes. Suppose n-1 balls are placed. The n-th ball still has m choices. Thus f(n, m) = m * f(n-1, m). Total is m^n.',
        getDependencies: (n, m) => [
            { r: n - 1, c: m, cls: 'cell-source-1', label: 'm×' }
        ]
    }
};
