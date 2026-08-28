/**
 * Math utilities for the 4 combinatorial cases
 */

export const MODELS = {
    II: {
        id: 'II',
        nameZh: '相同球 相同盒',
        nameEn: 'Identical Balls, Identical Boxes',
        calculate: (n, m, alt = false) => {
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
        closedZh: `<div style="font-size:1.6rem; font-weight:bold; margin-bottom:0.5rem;">f(n, m) = p(n, ≤m)</div>
<div style="font-size:1rem; font-family:var(--font-family); color:var(--text-secondary); text-align:left; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:8px;">
    <b>组合意义 (整数分拆 Partitions)</b>：球与盒子均无区别。等价于将数字 n 拆分为不超过 m 个正整数之和。<br>
    整数分拆不存在简单的组合数公式。除了画矩阵递推，数学上通常借助<b>母函数 (Generating Functions)</b>来求解：<br>
    <code style="display:block; margin:0.5rem 0; color:var(--highlight-1); font-size:1.1rem; text-align:center;">G(x) = 1 / [ (1-x)(1-x²)·...·(1-xᵐ) ]</code>
    其中 xⁿ 项的系数就是把 n 个球放入最多 m 个相同盒子的方案数。
</div>`,
        closedEn: 'Note: Integer partitions of n into at most m parts. Solved via Generating Functions.',
        explainZh: '相同球相同盒 (整数分拆)。总数 f(n, m) 表示将 n 拆分为不超过 m 个正整数之和。\n【视角 1】：讨论是否有空盒。f(n, m-1) 表示至少一个空盒；f(n-m, m) 表示全部装满（先各发一个球）。\n【视角 2】：按非空盒子数 k 累加。由组合恒等式可知，分拆为“恰好 k 组”的方法数等于 f(n-k, k)。将 k 从 1 到 m 累加即得总数，在矩阵中形成斜线。\n【当前结果】：当 n={n}, m={m} 时，共有 {res} 种分拆方式。',
        explainEn: 'Identical Balls, Identical Boxes (Integer Partitions).\n[View 1]: Empty boxes f(n, m-1) vs No empty boxes f(n-m, m).\n[View 2]: Summing over non-empty box count k. The number of partitions into "exactly k" parts equals f(n-k, k). Summing k from 1 to m forms a diagonal.\n[Result]: When n={n}, m={m}, there are {res} ways.',
        modeLabels: ['视角 1 (空盒递归)', '视角 2 (斜线累加)'],
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
        calculate: (n, m, alt = false) => {
            const S = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
            S[0][0] = 1;
            for (let i = 1; i <= n; i++) {
                for (let j = 1; j <= m; j++) {
                    S[i][j] = j * S[i - 1][j] + S[i - 1][j - 1];
                }
            }
            if (!alt) return { matrix: S, isStirling: true };

            const total = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
            total[0][0] = 1;
            for (let i = 0; i <= n; i++) {
                for (let j = 1; j <= m; j++) {
                    let sum = 0;
                    for (let k = 1; k <= j; k++) sum += S[i][k];
                    total[i][j] = i === 0 ? 1 : sum;
                }
            }
            return { matrix: total, componentMatrix: S };
        },
        formulaZh: '递推 1 (恰好 m 盒)：S(n, m) = m·S(n-1, m) + S(n-1, m-1)\n公式 2 (至多 m 盒)：f(n, m) = Σ_{k=1}^m S(n, k)',
        formulaEn: 'Recurrence 1 (Exactly m): S(n, m) = m·S(n-1, m) + S(n-1, m-1)\nFormula 2 (At most m): f(n, m) = Σ_{k=1}^m S(n, k)',
        closedZh: `<div style="font-size:1.6rem; font-weight:bold; margin-bottom:0.5rem;">f(n, m) = Σ_{k=1}^m S(n, k)</div>
<div style="font-size:1rem; font-family:var(--font-family); color:var(--text-secondary); text-align:left; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:8px;">
    <b>组合意义 (斯特林数)</b>：不同球放入相同盒子，本质是“集合的无序划分”。<br>
    这里不存在简单的单项组合数连乘公式。通常通过“容斥原理”来计算恰好分入 k 个盒子的 <b>第二类斯特林数 S(n, k)</b>：<br>
    <code style="display:block; margin:0.5rem 0; color:var(--highlight-1); font-size:1.1rem; text-align:center;">S(n, k) = (1 / k!) · Σ_{i=0}^k [ (-1)ⁱ · C(k, i) · (k-i)ⁿ ]</code>
    <b>公式解析</b>：先假设盒子“不同”，每个球有 (k-i) 种选择，得出 (k-i)ⁿ；接着用组合数 <b>C(k, i)</b> 结合容斥交替排除空盒的情况；最后因为盒子其实是“相同”的，所以整体除以 <b>k!</b> 消除盒子的排列顺序。<br>
    至多 m 盒的总方案数就是把 S(n, 1) 到 S(n, m) 累加起来。
</div>`,
        closedEn: 'Note: Distinct balls into identical boxes (Stirling numbers of the second kind)',
        explainZh: '不同球相同盒 (斯特林数)。由于盒子不可辨，第 n 个球放在哪个空盒里都没有区别。\n【深度推导】：考虑第 n 个球的去向：\n1. 它单独占领一个新盒子：剩下 n-1 个球放在 m-1 个盒子里，即 S(n-1, m-1)。\n2. 它不单独占盒子：而是挤进已有的 m 个盒子之一。因为它有 m 种选择，所以是 m * S(n-1, m)。\n【总数逻辑】：如果要计算“至多 m 盒”，则需将放入 1 到 m 个盒子的方案数全部相加：f(n, m) = Σ S(n, k)。\n【当前结果】：当 n={n}, m={m} 时，总方案数为 {res}。',
        explainEn: 'Distinct Balls, Identical Boxes (Stirling Numbers).\n[Deep Reasoning]: Since boxes are indistinguishable, it doesn\'t matter which empty box the n-th ball enters.\n1. n-th ball forms its own box: Put the other n-1 balls into m-1 boxes → S(n-1, m-1).\n2. n-th ball joins an existing box: There are m occupied boxes to choose from → m * S(n-1, m).\n[Total Logic]: For "At most m boxes", we sum options from 1 to m: f(n, m) = Σ S(n, k).\n[Result]: When n={n}, m={m}, there are {res} ways in total.',
        modeLabels: ['恰好 m 盒 (Exactly m)', '至多 m 盒 (At most m)'],
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
        calculate: (n, m, alt = false) => {
            // Combinations with repetition: H(m, n) = C(n+m-1, m-1)
            const maxN = 30;
            const C = Array.from({ length: maxN + 1 }, () => Array(maxN + 1).fill(0));
            for (let i = 0; i <= maxN; i++) {
                C[i][0] = 1;
                for (let j = 1; j <= i; j++) {
                    C[i][j] = C[i - 1][j - 1] + C[i - 1][j];
                }
            }
            const total = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
            total[0][0] = 1;
            for (let i = 0; i <= n; i++) {
                for (let j = 1; j <= m; j++) {
                    total[i][j] = C[i + j - 1][j - 1];
                }
            }
            if (!alt) return total;

            // In alt mode, show components if needed, but ID usually just shows the total recurrence
            // Here we'll stick to total for consistency with the summation formula
            return total;
        },
        formulaZh: '递推 1：f(n, m) = f(n, m-1) + f(n-1, m)\n递推 2：f(n, m) = Σ_{k=0}^n f(k, m-1)',
        formulaEn: 'Recurrence 1: f(n, m) = f(n, m-1) + f(n-1, m)\nRecurrence 2: f(n, m) = Σ_{k=0}^n f(k, m-1)',
        closedZh: `<div style="font-size:1.6rem; font-weight:bold; margin-bottom:0.5rem;">f(n, m) = C(n+m-1, m-1)</div>
<div style="font-size:1rem; font-family:var(--font-family); color:var(--text-secondary); text-align:left; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:8px;">
    <b>组合意义 (隔板法)</b>：球是相同的，盒子不同。问题等价于求方程 x₁ + x₂ + ... + xₘ = n 的非负整数解。<br>
    想象在 n 个相同的球之间插入虚拟的“隔板”，将球分为 m 组。<br>
    为了允许某些盒子分到 0 个球（即隔板可以挨在一起），我们引入 m-1 个虚拟隔板，与 n 个球混合排列。<br>
    因此，总位置数为 <b>n + m - 1</b>。<br>
    从中任选 <b>m-1</b> 个位置放置隔板，就构成了经典的组合数公式 <b>C(n+m-1, m-1)</b>。
</div>`,
        closedEn: 'Note: Identical balls into distinct boxes (Stars and Bars): C(n+m-1, m-1)',
        modeLabels: ['递推 1 (增量递归)', '递推 2 (逐项累加)'],
        explainZh: '相同球不同盒 (隔板法)。\n【书本做法】：使用隔板法，通解为 C(n+m-1, m-1)。\n【逐项累加推导】：想象有 n 个球分给 m 个小朋友。我们按【最后一个小朋友拿到了几个球】来分类：\n- 他拿 0 个：剩下的球分给前 m-1 人，即 f(n, m-1)；\n- 他拿 1 个：剩下的球分给前 m-1 人，即 f(n-1, m-1)；\n- ...直到他拿走所有球。\n把这些所有互斥的情况加起来，就是总数。因此 f(n, m) = Σ f(k, m-1)。\n【当前结果】：当 n={n}, m={m} 时，共有 {res} 种放法。',
        explainEn: 'Identical Balls, Distinct Boxes (Stars and Bars).\n[Standard View]: General solution is C(n+m-1, m-1).\n[Recursive Reasoning]: You can derive more results from known ones using the "last box" logic:\nThe last box can contain k balls (where 0 ≤ k ≤ n). For each choice of k, the remaining balls are distributed in m-1 boxes, giving Σ f(n-k, m-1).\n[Simplified]: f(n, m) = f(n, m-1) [1st box empty] + f(n-1, m) [1st box ≥ 1 ball].\n[Result]: When n={n}, m={m}, there are {res} ways.',
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
        closedZh: `<div style="font-size:1.6rem; font-weight:bold; margin-bottom:0.5rem;">f(n, m) = mⁿ</div>
<div style="font-size:1rem; font-family:var(--font-family); color:var(--text-secondary); text-align:left; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:8px;">
    <b>指数模型意义</b>：每个球都是独一无二的，且盒子互不相同。<br>
    对于第 1 个球，它可以选择 m 个盒子中的任意一个；<br>
    对于第 2 个球，它也可以独立选择 m 个盒子中的任意一个；<br>
    ... 以此类推。根据基础的乘法原理，n 个球独立选择，总共有 m × m × ... (n次连乘) = <b>mⁿ</b> 种分配方式。
</div>`,
        closedEn: 'General Form: m^n (Each ball has m independent choices)',
        explainZh: '不同球不同盒 (指数模型)。\n【基本逻辑】：对于每个球来说都有 m 种选择（盒子是不同的），所以总共有 m^n 种方案。\n【递归通式】：假设你已经放好了 n-1 个球，即 f(n-1, m)。现在要放第 n 个球，它有 m 种选盒子的方法。因此：f(n, m) = m * f(n-1, m)。\n【边界条件】：f(0, m) = 1 (没有球也是 1 种状态)。\n【当前结果】：当 n={n}, m={m} 时，共有 {m}^{n} = {res} 种放法。',
        explainEn: 'Distinct Balls, Distinct Boxes (Exponential Model).\n[Basic Logic]: Each of the n distinct balls has m choices of distinct boxes, leading to m^n.\n[Recursive Logic]: Suppose n-1 balls are already placed, f(n-1, m). For the n-th ball, there are m box options. Thus: f(n, m) = m * f(n-1, m).\n[Boundary]: f(0, m) = 1.\n[Result]: When n={n}, m={m}, there are {m}^{n} = {res} ways.',
        getDependencies: (n, m) => [
            { r: n - 1, c: m, cls: 'cell-source-1', label: 'm×' }
        ]
    }
};
