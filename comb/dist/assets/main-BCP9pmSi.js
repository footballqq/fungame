/* empty css              */(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function i(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(e){if(e.ep)return;e.ep=!0;const r=i(e);fetch(e.href,r)}})();const A={II:{id:"II",nameZh:"相同球 相同盒",nameEn:"Identical Balls, Identical Boxes",calculate:(n,t,i=!1)=>{const s=Array.from({length:n+1},()=>Array(t+1).fill(0));for(let e=0;e<=t;e++)s[0][e]=1;for(let e=1;e<=n;e++)for(let r=1;r<=t;r++)s[e][r]=s[e][r-1],e>=r&&(s[e][r]+=s[e-r][r]);return s},formulaZh:`递推 1：f(n, m) = f(n, m-1) + f(n-m, m)
递推 2：f(n, m) = Σ_{k=1}^m f(n-k, k)`,formulaEn:`Recurrence 1: f(n, m) = f(n, m-1) + f(n-m, m)
Recurrence 2: f(n, m) = Σ_{k=1}^m f(n-k, k)`,closedZh:`<div style="font-size:1.6rem; font-weight:bold; margin-bottom:0.5rem;">f(n, m) = p(n, ≤m)</div>
<div style="font-size:1rem; font-family:var(--font-family); color:var(--text-secondary); text-align:left; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:8px;">
    <b>组合意义 (整数分拆 Partitions)</b>：球与盒子均无区别。等价于将数字 n 拆分为不超过 m 个正整数之和。<br>
    整数分拆不存在简单的组合数公式。除了画矩阵递推，数学上通常借助<b>母函数 (Generating Functions)</b>来求解：<br>
    <code style="display:block; margin:0.5rem 0; color:var(--highlight-1); font-size:1.1rem; text-align:center;">G(x) = 1 / [ (1-x)(1-x²)·...·(1-xᵐ) ]</code>
    其中 xⁿ 项的系数就是把 n 个球放入最多 m 个相同盒子的方案数。
</div>`,closedEn:"Note: Integer partitions of n into at most m parts. Solved via Generating Functions.",explainZh:`相同球相同盒 (整数分拆)。总数 f(n, m) 表示将 n 拆分为不超过 m 个正整数之和。
【视角 1】：讨论是否有空盒。f(n, m-1) 表示至少一个空盒；f(n-m, m) 表示全部装满（先各发一个球）。
【视角 2】：按非空盒子数 k 累加。由组合恒等式可知，分拆为“恰好 k 组”的方法数等于 f(n-k, k)。将 k 从 1 到 m 累加即得总数，在矩阵中形成斜线。
【当前结果】：当 n={n}, m={m} 时，共有 {res} 种分拆方式。`,explainEn:`Identical Balls, Identical Boxes (Integer Partitions).
[View 1]: Empty boxes f(n, m-1) vs No empty boxes f(n-m, m).
[View 2]: Summing over non-empty box count k. The number of partitions into "exactly k" parts equals f(n-k, k). Summing k from 1 to m forms a diagonal.
[Result]: When n={n}, m={m}, there are {res} ways.`,modeLabels:["视角 1 (空盒递归)","视角 2 (斜线累加)"],getDependencies:(n,t,i=!1)=>{if(i){const s=[];for(let e=1;e<=t;e++)n-e>=0&&s.push({r:n-e,c:e,cls:"cell-source-group",label:`k=${e}`});return s}else return[{r:n,c:t-1,cls:"cell-source-1",label:"空盒"},{r:n-t,c:t,cls:"cell-source-2",label:"全满"}]}},DI:{id:"DI",nameZh:"不同球 相同盒",nameEn:"Distinct Balls, Identical Boxes",calculate:(n,t,i=!1)=>{const s=Array.from({length:n+1},()=>Array(t+1).fill(0));s[0][0]=1;for(let r=1;r<=n;r++)for(let a=1;a<=t;a++)s[r][a]=a*s[r-1][a]+s[r-1][a-1];if(!i)return{matrix:s,isStirling:!0};const e=Array.from({length:n+1},()=>Array(t+1).fill(0));e[0][0]=1;for(let r=0;r<=n;r++)for(let a=1;a<=t;a++){let l=0;for(let o=1;o<=a;o++)l+=s[r][o];e[r][a]=r===0?1:l}return{matrix:e,componentMatrix:s}},formulaZh:`递推 1 (恰好 m 盒)：S(n, m) = m·S(n-1, m) + S(n-1, m-1)
公式 2 (至多 m 盒)：f(n, m) = Σ_{k=1}^m S(n, k)`,formulaEn:`Recurrence 1 (Exactly m): S(n, m) = m·S(n-1, m) + S(n-1, m-1)
Formula 2 (At most m): f(n, m) = Σ_{k=1}^m S(n, k)`,closedZh:`<div style="font-size:1.6rem; font-weight:bold; margin-bottom:0.5rem;">f(n, m) = Σ_{k=1}^m S(n, k)</div>
<div style="font-size:1rem; font-family:var(--font-family); color:var(--text-secondary); text-align:left; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:8px;">
    <b>组合意义 (斯特林数)</b>：不同球放入相同盒子，本质是“集合的无序划分”。<br>
    这里不存在简单的单项组合数连乘公式。通常通过“容斥原理”来计算恰好分入 k 个盒子的 <b>第二类斯特林数 S(n, k)</b>：<br>
    <code style="display:block; margin:0.5rem 0; color:var(--highlight-1); font-size:1.1rem; text-align:center;">S(n, k) = (1 / k!) · Σ_{i=0}^k [ (-1)ⁱ · C(k, i) · (k-i)ⁿ ]</code>
    <b>公式解析</b>：先假设盒子“不同”，每个球有 (k-i) 种选择，得出 (k-i)ⁿ；接着用组合数 <b>C(k, i)</b> 结合容斥交替排除空盒的情况；最后因为盒子其实是“相同”的，所以整体除以 <b>k!</b> 消除盒子的排列顺序。<br>
    至多 m 盒的总方案数就是把 S(n, 1) 到 S(n, m) 累加起来。
</div>`,closedEn:"Note: Distinct balls into identical boxes (Stirling numbers of the second kind)",explainZh:`不同球相同盒 (斯特林数)。由于盒子不可辨，第 n 个球放在哪个空盒里都没有区别。
【深度推导】：考虑第 n 个球的去向：
1. 它单独占领一个新盒子：剩下 n-1 个球放在 m-1 个盒子里，即 S(n-1, m-1)。
2. 它不单独占盒子：而是挤进已有的 m 个盒子之一。因为它有 m 种选择，所以是 m * S(n-1, m)。
【总数逻辑】：如果要计算“至多 m 盒”，则需将放入 1 到 m 个盒子的方案数全部相加：f(n, m) = Σ S(n, k)。
【当前结果】：当 n={n}, m={m} 时，总方案数为 {res}。`,explainEn:`Distinct Balls, Identical Boxes (Stirling Numbers).
[Deep Reasoning]: Since boxes are indistinguishable, it doesn't matter which empty box the n-th ball enters.
1. n-th ball forms its own box: Put the other n-1 balls into m-1 boxes → S(n-1, m-1).
2. n-th ball joins an existing box: There are m occupied boxes to choose from → m * S(n-1, m).
[Total Logic]: For "At most m boxes", we sum options from 1 to m: f(n, m) = Σ S(n, k).
[Result]: When n={n}, m={m}, there are {res} ways in total.`,modeLabels:["恰好 m 盒 (Exactly m)","至多 m 盒 (At most m)"],getDependencies:(n,t,i=!1)=>{if(i){const s=[];for(let e=1;e<=t;e++)s.push({r:n,c:e,cls:"cell-source-group",label:`k=${e}`,useStirling:!0});return s}else return[{r:n-1,c:t,cls:"cell-source-1",label:"m×"},{r:n-1,c:t-1,cls:"cell-source-2"}]}},ID:{id:"ID",nameZh:"相同球 不同盒",nameEn:"Identical Balls, Distinct Boxes",calculate:(n,t,i=!1)=>{const e=Array.from({length:31},()=>Array(31).fill(0));for(let a=0;a<=30;a++){e[a][0]=1;for(let l=1;l<=a;l++)e[a][l]=e[a-1][l-1]+e[a-1][l]}const r=Array.from({length:n+1},()=>Array(t+1).fill(0));r[0][0]=1;for(let a=0;a<=n;a++)for(let l=1;l<=t;l++)r[a][l]=e[a+l-1][l-1];return r},formulaZh:`递推 1：f(n, m) = f(n, m-1) + f(n-1, m)
递推 2：f(n, m) = Σ_{k=0}^n f(k, m-1)`,formulaEn:`Recurrence 1: f(n, m) = f(n, m-1) + f(n-1, m)
Recurrence 2: f(n, m) = Σ_{k=0}^n f(k, m-1)`,closedZh:`<div style="font-size:1.6rem; font-weight:bold; margin-bottom:0.5rem;">f(n, m) = C(n+m-1, m-1)</div>
<div style="font-size:1rem; font-family:var(--font-family); color:var(--text-secondary); text-align:left; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:8px;">
    <b>组合意义 (隔板法)</b>：球是相同的，盒子不同。问题等价于求方程 x₁ + x₂ + ... + xₘ = n 的非负整数解。<br>
    想象在 n 个相同的球之间插入虚拟的“隔板”，将球分为 m 组。<br>
    为了允许某些盒子分到 0 个球（即隔板可以挨在一起），我们引入 m-1 个虚拟隔板，与 n 个球混合排列。<br>
    因此，总位置数为 <b>n + m - 1</b>。<br>
    从中任选 <b>m-1</b> 个位置放置隔板，就构成了经典的组合数公式 <b>C(n+m-1, m-1)</b>。
</div>`,closedEn:"Note: Identical balls into distinct boxes (Stars and Bars): C(n+m-1, m-1)",modeLabels:["递推 1 (增量递归)","递推 2 (逐项累加)"],explainZh:`相同球不同盒 (隔板法)。
【书本做法】：使用隔板法，通解为 C(n+m-1, m-1)。
【逐项累加推导】：想象有 n 个球分给 m 个小朋友。我们按【最后一个小朋友拿到了几个球】来分类：
- 他拿 0 个：剩下的球分给前 m-1 人，即 f(n, m-1)；
- 他拿 1 个：剩下的球分给前 m-1 人，即 f(n-1, m-1)；
- ...直到他拿走所有球。
把这些所有互斥的情况加起来，就是总数。因此 f(n, m) = Σ f(k, m-1)。
【当前结果】：当 n={n}, m={m} 时，共有 {res} 种放法。`,explainEn:`Identical Balls, Distinct Boxes (Stars and Bars).
[Standard View]: General solution is C(n+m-1, m-1).
[Recursive Reasoning]: You can derive more results from known ones using the "last box" logic:
The last box can contain k balls (where 0 ≤ k ≤ n). For each choice of k, the remaining balls are distributed in m-1 boxes, giving Σ f(n-k, m-1).
[Simplified]: f(n, m) = f(n, m-1) [1st box empty] + f(n-1, m) [1st box ≥ 1 ball].
[Result]: When n={n}, m={m}, there are {res} ways.`,getDependencies:(n,t,i=!1)=>{if(i){const s=[];for(let e=0;e<=n;e++)s.push({r:e,c:t-1,cls:"cell-source-group",label:`k=${e}`});return s}else return[{r:n,c:t-1,cls:"cell-source-1",label:"0球"},{r:n-1,c:t,cls:"cell-source-2",label:"≥1球"}]}},DD:{id:"DD",nameZh:"不同球 不同盒",nameEn:"Distinct Balls, Distinct Boxes",calculate:(n,t)=>{const i=Array.from({length:n+1},()=>Array(t+1).fill(0));for(let s=0;s<=t;s++)i[0][s]=1;for(let s=1;s<=n;s++)for(let e=0;e<=t;e++)i[s][e]=Math.pow(e,s);return i},formulaZh:"递推式：f(n, m) = m · f(n-1, m)",formulaEn:"Recurrence: f(n, m) = m · f(n-1, m)",closedZh:`<div style="font-size:1.6rem; font-weight:bold; margin-bottom:0.5rem;">f(n, m) = mⁿ</div>
<div style="font-size:1rem; font-family:var(--font-family); color:var(--text-secondary); text-align:left; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:8px;">
    <b>指数模型意义</b>：每个球都是独一无二的，且盒子互不相同。<br>
    对于第 1 个球，它可以选择 m 个盒子中的任意一个；<br>
    对于第 2 个球，它也可以独立选择 m 个盒子中的任意一个；<br>
    ... 以此类推。根据基础的乘法原理，n 个球独立选择，总共有 m × m × ... (n次连乘) = <b>mⁿ</b> 种分配方式。
</div>`,closedEn:"General Form: m^n (Each ball has m independent choices)",explainZh:`不同球不同盒 (指数模型)。
【基本逻辑】：对于每个球来说都有 m 种选择（盒子是不同的），所以总共有 m^n 种方案。
【递归通式】：假设你已经放好了 n-1 个球，即 f(n-1, m)。现在要放第 n 个球，它有 m 种选盒子的方法。因此：f(n, m) = m * f(n-1, m)。
【边界条件】：f(0, m) = 1 (没有球也是 1 种状态)。
【当前结果】：当 n={n}, m={m} 时，共有 {m}^{n} = {res} 种放法。`,explainEn:`Distinct Balls, Distinct Boxes (Exponential Model).
[Basic Logic]: Each of the n distinct balls has m choices of distinct boxes, leading to m^n.
[Recursive Logic]: Suppose n-1 balls are already placed, f(n-1, m). For the n-th ball, there are m box options. Thus: f(n, m) = m * f(n-1, m).
[Boundary]: f(0, m) = 1.
[Result]: When n={n}, m={m}, there are {m}^{n} = {res} ways.`,getDependencies:(n,t)=>[{r:n-1,c:t,cls:"cell-source-1",label:"m×"}]}},O={balls:[{type:"distinct",title:"球不同 (Distinct Balls)",badge:"🔴🟢🔵 编号球 / 具名球",story:"像不同口味的糖果（草莓🍓、薄荷🌿、巧克力🍫），每个球都有独特编号或颜色，调换位置算不同情况。"},{type:"identical",title:"球相同 (Identical Balls)",badge:"⚪⚪⚪ 一模一样的白球",story:"像完全相同的大白兔奶糖或金币，球与球之间没有任何区别，只看每个盒子里分到了几个。"}],boxes:[{type:"distinct",title:"盒不同 (Distinct Boxes)",badge:"🏷️ 贴有名字的盒子 (A盒/B盒/C盒)",story:"像写着小朋友名字的书包（小明、小红），或者不同颜色的奖品箱，放在哪个盒子里意义完全不同。"},{type:"identical",title:"盒相同 (Identical Boxes)",badge:"📦📦 完全一样的透明塑料袋",story:"盒子没有任何标签或外观区别，位置可以任意调换。方案只看把球分成了怎样的几个组合（只看分组）。"}]},H={cases:{DD:{title:"球异 盒异 (DD)",count:8,formula:"2³ = 8",explanation:"每颗糖独立选朋友，2 × 2 × 2 = 8 种。"},ID:{title:"球同 盒异 (ID)",count:4,formula:"C(3+2-1, 2-1) = 4",explanation:"只看A盒拿几个(0,1,2,3颗)，B盒拿剩下的，共 4 种：(0,3),(1,2),(2,1),(3,0)。"},DI:{title:"球异 盒同 (DI)",count:4,formula:"S(3,1) + S(3,2) = 1 + 3 = 4",explanation:"装1袋：{ABC}；装2袋：{A|BC}, {B|AC}, {C|AB}。共 1 + 3 = 4 种。"},II:{title:"球同 盒同 (II)",count:2,formula:"p(3, 2) = 2",explanation:"只能分成 (3) 堆或 (2+1) 堆，共 2 种。"}}},M={DD:{id:"DD",nameZh:"不同球 不同盒",modelIntro:"这是最基础也是最直观的模型！每一个独特的球，都有各自独立的盒子可以选择。",levels:[{level:1,title:"Level 1: 感知与枚举",n:2,m:2,story:"🍬 小明有 2 颗不同口味的糖果——一颗草莓味🍓，一颗薄荷味🌿。他想分给 2 个好朋友（小红和小蓝）。每颗糖可以给任意一人，甚至一人独得两颗。",question:"请问一共有多少种不同的分法？",options:[{id:"A",text:"2 种",isCorrect:!1,hint:"💡 你是不是只考虑了每颗糖给谁，但忘了两颗糖都要分配？每个人可以拿 0、1 或 2 颗哦！"},{id:"B",text:"3 种",isCorrect:!1,hint:"💡 差一点！你是不是漏掉了两颗糖都给同一个人（全给小红或全给小蓝）的情况？"},{id:"C",text:"4 种",isCorrect:!0,hint:"🎉 太棒了！2颗糖各选2个人，2 × 2 = 4 种！"},{id:"D",text:"6 种",isCorrect:!1,hint:"💡 你是不是用了排列数？注意这里是每颗糖独立选朋友，不是朋友选糖果哦！"}],explanation:"草莓糖🍓可以选择给小红或小蓝（2种可能）；薄荷糖🌿也可以独立选择给小红或小蓝（2种可能）。由乘法原理，共有 2 × 2 = 4 种分法。",takeaway:"🌟 核心原理：每一个球都有 m 种选择，方案数是选择数的连乘！"},{level:2,title:"Level 2: 发现规律",n:3,m:2,story:"🍬 小明又多带了 1 颗巧克力糖🍫，现在共有 3 颗不同糖果（🍓🌿🍫），还是分给 2 个好朋友（小红和小蓝）。",question:"这次一共有多少种不同的分法？",options:[{id:"A",text:"6 种",isCorrect:!1,hint:"💡 6 是 3×2，但糖果不是按顺序分配给两个人，而是每颗糖都有 2 个朋友可以选！"},{id:"B",text:"8 种",isCorrect:!0,hint:"🎉 回答正确！3颗糖各自选2个人，2 × 2 × 2 = 8 种！"},{id:"C",text:"9 种",isCorrect:!1,hint:"💡 9 是 3×3，但这里只有 2 个朋友可供选择，是 2 的 3 次方哦！"},{id:"D",text:"12 种",isCorrect:!1,hint:"💡 有点偏大啦！每多一颗糖，总方案数就乘 2，上一次 2 颗是 4 种，这次 3 颗应该是 4 × 2 = 8 种！"}],explanation:"每一颗糖果都有 2 个朋友可以选择。3 颗糖依次选择：2 × 2 × 2 = 2³ = 8 种。",takeaway:"🌟 规律发现：每增加 1 颗球，总方案数就乘以盒数 m！"},{level:3,title:"Level 3: 归纳公式",n:4,m:3,story:"🎁 班级举办抽奖活动，4 位不同编号的同学（1号、2号、3号、4号）抽取 3 个不同奖品箱（金箱、银箱、铜箱）。每人必须且只能投进一个箱子。",question:"4 位同学的所有投票组合方案数是多少？",options:[{id:"A",text:"12 种",isCorrect:!1,hint:"💡 12 是 4×3，但这只是单步乘法，每位同学都有 3 种选择，总共要连乘 4 次！"},{id:"B",text:"64 种",isCorrect:!1,hint:"💡 64 是 4³，你把底数和指数弄反啦！底数是选择数（箱子数 3），指数是球数 4 哦！"},{id:"C",text:"81 种",isCorrect:!0,hint:"🎉 完全正确！3⁴ = 81 种！你已经完全掌握了指数分配模型！"},{id:"D",text:"24 种",isCorrect:!1,hint:"💡 24 是 4!（全排列），但不同同学可以投进同一个箱子，允许重复选择！"}],explanation:"第1位同学有 3 种选择，第2位有 3 种，第3位有 3 种，第4位有 3 种。总方案数为 3 × 3 × 3 × 3 = 3⁴ = 81 种。",takeaway:"🌟 通项公式：f(n, m) = m^n（n 个不同球放入 m 个不同盒）。"}]},ID:{id:"ID",nameZh:"相同球 不同盒",modelIntro:"球是一模一样的，不再有编号区别！我们只关心“每个有名字的盒子里分到了几个球”。",levels:[{level:1,title:"Level 1: 感知与枚举",n:2,m:2,story:"🐰 妈妈买了 2 颗完全一模一样的大白兔奶糖（⚪⚪），要分进 2 个贴有标签的零食盒（A盒、B盒）。允许空盒。",question:"一共有几种分法？",options:[{id:"A",text:"4 种",isCorrect:!1,hint:"💡 注意！奶糖是完全一样的，谁分到哪颗糖没有区别，只看每个盒子最后分到了几颗糖！"},{id:"B",text:"3 种",isCorrect:!0,hint:"🎉 正确！分别是 (2,0)、(1,1)、(0,2) 共 3 种！"},{id:"C",text:"2 种",isCorrect:!1,hint:"💡 你是不是只算了 (1,1) 和 (2,0)，漏掉了 (0,2)？盒子是有标签区分的哦！"},{id:"D",text:"1 种",isCorrect:!1,hint:"💡 盒子是有标签的A盒和B盒，(2,0) 和 (0,2) 是两种不同的分法！"}],explanation:"糖果完全相同，只需决定 A盒 和 B盒 各拿几颗：(2,0)、(1,1)、(0,2)，共 3 种。",takeaway:"🌟 核心原理：只关注每个盒子分配的数量序列 (x1, x2, ..., xm)，满足求和等于 n。"},{level:2,title:"Level 2: 发现规律",n:3,m:2,story:"🐰 还是分进 A盒、B盒，但这次有 3 颗完全相同的白糖（⚪⚪⚪）。",question:"一共有几种分法？",options:[{id:"A",text:"8 种",isCorrect:!1,hint:"💡 8 种是不同球时的答案！现在球完全一样，只关心 A 盒拿几颗，B 盒自动拿剩下的！"},{id:"B",text:"6 种",isCorrect:!1,hint:"💡 不需要复杂的乘法，想想 A 盒可以放 0、1、2、3 颗，每种情况 B 盒都唯一确定！"},{id:"C",text:"4 种",isCorrect:!0,hint:"🎉 回答正确！A盒可放 0、1、2、3 颗，共 4 种！"},{id:"D",text:"3 种",isCorrect:!1,hint:"💡 数数看：A盒可以放 0、1、2、3 颗，一共是 4 种可能！"}],explanation:"A盒可以放 0、1、2 或 3 颗（共 4 种可能），剩下的全自动进 B盒：(0,3), (1,2), (2,1), (3,0)，总共 4 种。",takeaway:"🌟 规律发现：把 n 个相同球分给 2 个不同盒，方案数正好就是 n + 1 种！"},{level:3,title:"Level 3: 归纳公式 (隔板法)",n:3,m:3,story:"📚 老师把 3 本完全相同的笔记本（📚📚📚）奖励给 3 位不同的小朋友（小明、小刚、小丽），允许有人得 0 本。",question:"一共有多少种分配方案？",options:[{id:"A",text:"27 种",isCorrect:!1,hint:"💡 27 是 3³，这是不同书本的情况。现在书本完全相同，只看每个人得到几本！"},{id:"B",text:"10 种",isCorrect:!0,hint:"🎉 太聪明了！用隔板法 C(3+3-1, 3-1) = C(5, 2) = 10 种！"},{id:"C",text:"6 种",isCorrect:!1,hint:"💡 你可能漏算了有人得 0 本或者一人独得 3 本的情况！试试用隔板法或递推分类。"},{id:"D",text:"15 种",isCorrect:!1,hint:"💡 多算了哦！3个球和2个隔板一共5个位置，选2个放隔板：C(5,2)=10。"}],explanation:"相当于求 x1 + x2 + x3 = 3 的非负整数解。利用经典隔板法：3 个球与 2 块隔板（共 5 个位置）排成一排，选 2 个位置放隔板，总方案数为 C(3+3-1, 3-1) = C(5, 2) = 10 种。",takeaway:"🌟 隔板法公式：C(n+m-1, m-1)（n 个相同球放入 m 个不同盒，允许空盒）。"}]},DI:{id:"DI",nameZh:"不同球 相同盒",modelIntro:"球是有编号的，但盒子完全一样（像无标签的袋子）！这意味着盒子调换顺序没有任何区别，本质是“集合的划分”。",levels:[{level:1,title:"Level 1: 感知与枚举",n:3,m:2,story:"🐱 3 只不同颜色的小猫（🐱小白、🐱小黑、🐱小花）要装进 2 个完全一样的纸箱里。纸箱外观一模一样无编号，允许空箱。",question:"一共有几种分组装箱方案？",options:[{id:"A",text:"8 种",isCorrect:!1,hint:"💡 8 种是箱子有名字时的方案。如果箱子一样，{小白}和{小黑,小花}装在哪个箱子里都算同一种分组！"},{id:"B",text:"6 种",isCorrect:!1,hint:"💡 注意盒子完全相同！把猫分成两组后，纸箱调换位置没有任何区别。"},{id:"C",text:"4 种",isCorrect:!0,hint:"🎉 正确！装1箱有1种，装2箱有3种，1 + 3 = 4 种！"},{id:"D",text:"3 种",isCorrect:!1,hint:"💡 3 种只是正好用 2 个箱子的分法，别忘了还可以把 3 只小猫全部装进 1 个箱子（空出 1 个箱子）！"}],explanation:"装进 1 个箱子：{小白, 小黑, 小花} 全部在一起，1 种；装进 2 个箱子：单独 1 只在一箱，另外 2 只一箱：{白|黑,花}、{黑|白,花}、{花|白,黑}，共 3 种。总共 1 + 3 = 4 种。",takeaway:"🌟 核心原理：至多 m 盒方案 = 恰好 1 盒 + 恰好 2 盒 + ... + 恰好 m 盒（斯特林数累加）。"},{level:2,title:"Level 2: 发现规律 (斯特林数)",n:4,m:2,story:"⚽ 4 位不同队员（A, B, C, D）要分成至多 2 个无编号的小组（可以全在 1 组，也可以分成 2 组）。",question:"一共有几种分组方案？",options:[{id:"A",text:"16 种",isCorrect:!1,hint:"💡 16 是 2⁴（小组有名字的情况）。因为小组没有名字，除了全在1组的1种外，分成两组的方案要除以2！"},{id:"B",text:"8 种",isCorrect:!0,hint:"🎉 太棒了！全在1组有1种，分成2组有7种 (S(4,2)=7)，1 + 7 = 8 种！"},{id:"C",text:"7 种",isCorrect:!1,hint:"💡 7 种是恰好分成 2 组的斯特林数 S(4,2)，别忘了加上全在 1 组的 1 种！"},{id:"D",text:"6 种",isCorrect:!1,hint:"💡 少算了哦！恰好分成2组有：(1人+3人) 4种，(2人+2人) 3种，共7种；再加上全在1组的1种。"}],explanation:"全在 1 组：{A,B,C,D} 1 种；分成 2 组：1人+3人（4种）与 2人+2人（3种），共 7 种 (即第二类斯特林数 S(4,2)=7)。总方案数：1 + 7 = 8 种。",takeaway:"🌟 递推思考：考虑第 n 个球，它要么自己单独占一盒 S(n-1,m-1)，要么挤进已有的 m 盒之一 m*S(n-1,m)！"},{level:3,title:"Level 3: 归纳与累加",n:4,m:3,story:"📦 4 本不同的故事书要打包寄出，手头最多有 3 个完全一样的包裹袋。允许只用 1 个、2 个或 3 个袋子。",question:"一共有多少种打包分组方案？",options:[{id:"A",text:"14 种",isCorrect:!0,hint:"🎉 完全正确！S(4,1)=1 + S(4,2)=7 + S(4,3)=6，最多用3个袋子总和 14 种！"},{id:"B",text:"6 种",isCorrect:!1,hint:"💡 6 种只是恰好用 3 个袋子 S(4,3) 的数量，还要加上用 1 个袋子和用 2 个袋子的情况哦！"},{id:"C",text:"15 种",isCorrect:!1,hint:"💡 15 种是允许分成 4 个袋子（贝尔数 B4）的总数，但题目规定最多只有 3 个包裹袋哦！"},{id:"D",text:"64 种",isCorrect:!1,hint:"💡 这是袋子有区别时的指数模型 4³，袋子完全相同时需要用第二类斯特林数累加。"}],explanation:"用 1 个袋子：S(4,1) = 1 种；用 2 个袋子：S(4,2) = 7 种；用 3 个袋子：S(4,3) = 6 种（选2本合在一起，C(4,2)=6）。因为最多只有 3 个袋子，总方案数为：1 + 7 + 6 = 14 种。",takeaway:"🌟 知识总结：不同球放相同盒至多 m 盒 = Σ_{k=1}^m S(n, k)（注意受限于最多盒数 m）。"}]},II:{id:"II",nameZh:"相同球 相同盒",modelIntro:"这是组合数学中最深奥的模型之一（整数分拆）！球相同、盒子也相同，相当于把一个数字 n 拆分成不超过 m 个正整数之和。",levels:[{level:1,title:"Level 1: 感知与枚举",n:3,m:2,story:"🍎 3 个完全相同的苹果，放进 2 个完全一样的盘子里。盘子无顺序，允许空盘。",question:"一共有几种放置方案？",options:[{id:"A",text:"4 种",isCorrect:!1,hint:"💡 4 种是盘子有区别 (ID) 时的分法 (3,0)(2,1)(1,2)(0,3)。但现在盘子完全相同，(2,1) 和 (1,2) 是同一种！"},{id:"B",text:"2 种",isCorrect:!0,hint:"🎉 正确！只有 [3] 和 [2, 1] 这 2 种分拆！"},{id:"C",text:"3 种",isCorrect:!1,hint:"💡 数数看苹果堆的大小：只能是 (3,0) 或者 (2,1)，没有别的拆分了哦！"},{id:"D",text:"1 种",isCorrect:!1,hint:"💡 盘子里苹果数量可以不平均，比如一个盘子放 2 个，另一个放 1 个也是一种方案！"}],explanation:"因为苹果相同、盘子也相同，方案只取决于每个盘子里放几个苹果（按从大到小排列）：方案1: [3, 0]（3 = 3）；方案2: [2, 1]（3 = 2 + 1）。总共只有 2 种！这就是整数分拆 p(3, 2)。",takeaway:"🌟 核心原理：只看从大到小的数字拆分序列（如 3 = 2+1），与位置无关。"},{level:2,title:"Level 2: 发现规律",n:4,m:2,story:"🍫 4 块完全相同的巧克力，分装进 2 个一模一样的密封袋中。允许空袋。",question:"一共有几种分装方案？",options:[{id:"A",text:"5 种",isCorrect:!1,hint:"💡 5 种是袋子不同时的分法。袋子相同时，(3,1) 和 (1,3) 算同一种！"},{id:"B",text:"3 种",isCorrect:!0,hint:"🎉 回答正确！分别是 [4]、[3, 1]、[2, 2] 共 3 种！"},{id:"C",text:"4 种",isCorrect:!1,hint:"💡 列出由大到小的数字组合：4, 3+1, 2+2，一共是 3 种！"},{id:"D",text:"2 种",isCorrect:!1,hint:"💡 你可能漏掉了 2+2（两个袋子各放2块）的分配方式！"}],explanation:"按降序排列各袋巧克力数：1) [4, 0]；2) [3, 1]；3) [2, 2]。总共只有 3 种。",takeaway:"🌟 规律发现：将 n 拆分为至多 2 份，方案数等于 floor(n/2) + 1。"},{level:3,title:"Level 3: 递归思想 (空盒与发球)",n:5,m:3,story:"🪙 5 枚相同金币放进最多 3 个完全一样的宝箱中。",question:"共有多少种金币存放方案？",options:[{id:"A",text:"5 种",isCorrect:!0,hint:"🎉 恭喜通关最高难度！[5], [4,1], [3,2], [3,1,1], [2,2,1] 共 5 种！"},{id:"B",text:"7 种",isCorrect:!1,hint:"💡 7 种是不限制宝箱数量时的全部整数分拆（包含了 1+1+1+1+1 和 2+1+1+1），但这里最多只有 3 个箱子！"},{id:"C",text:"21 种",isCorrect:!1,hint:"💡 21 是箱子有区别时的隔板法答案 C(7,2)，箱子完全相同时很多顺序都重叠了。"},{id:"D",text:"10 种",isCorrect:!1,hint:"💡 多算了哦！列出不超过 3 份的分拆：5, 4+1, 3+2, 3+1+1, 2+2+1，数数看一共有几个？"}],explanation:"分拆为不超过 3 份：1份：[5] (1种)；2份：[4,1], [3,2] (2种)；3份：[3,1,1], [2,2,1] (2种)。总计 1 + 2 + 2 = 5 种。",takeaway:"🌟 递归递推：f(n, m) = f(n, m-1) [有空盒] + f(n-m, m) [无空盒，先每盒发1个]。"}]}};function Q(n,t){if(t<=0)return[];if(n===0)return[{index:1,boxes:Array.from({length:t},()=>[])}];const i=[],s=new Array(n).fill(0);function e(r){if(r===n){const a=Array.from({length:t},()=>[]);for(let l=0;l<n;l++)a[s[l]].push(l+1);i.push({index:i.length+1,boxes:a});return}for(let a=0;a<t;a++)s[r]=a,e(r+1)}return e(0),i}function V(n,t){if(t<=0)return[];if(n===0)return[{index:1,counts:Array(t).fill(0),boxes:Array.from({length:t},()=>[])}];const i=[],s=new Array(t).fill(0);function e(r,a){if(r===t-1){s[r]=a;const l=[...s],o=l.map(c=>Array(c).fill("●"));i.push({index:i.length+1,counts:l,boxes:o});return}for(let l=0;l<=a;l++)s[r]=l,e(r+1,a-l)}return e(0,n),i}function K(n,t){if(t<=0)return[];if(n===0)return[{index:1,parts:[],summary:"空"}];const i=[];function s(e,r){if(e>n){if(r.length<=t){const a=r.map(l=>[...l].sort((o,c)=>o-c)).sort((l,o)=>o.length!==l.length?o.length-l.length:l[0]-o[0]);i.push(a)}return}for(let a=0;a<r.length;a++)r[a].push(e),s(e+1,r),r[a].pop();r.length<t&&(r.push([e]),s(e+1,r),r.pop())}return s(1,[]),i.map((e,r)=>{const a=e.map(l=>`{${l.join(",")}}`).join(" + ");return{index:r+1,parts:e,summary:a}})}function U(n,t){if(t<=0)return[];if(n===0)return[{index:1,partition:[0],summary:"0"}];const i=[];function s(e,r,a){if(e===0){i.push({index:i.length+1,partition:[...a],summary:a.join(" + ")});return}if(a.length>=t)return;const l=Math.min(e,r);for(let o=l;o>=1;o--)a.push(o),s(e-o,o,a),a.pop()}return s(n,n,[]),i}function Y(n,t,i){switch(n){case"DD":return Q(t,i);case"ID":return V(t,i);case"DI":return K(t,i);case"II":return U(t,i);default:return[]}}function J(n,t){if(!n||n.length===0)return'<div class="enum-empty">无方案</div>';const s=n.slice(0,20).map(e=>{let r="";return t==="DD"?r=e.boxes.map((a,l)=>{const o=a.map(c=>`<span class="mini-ball distinct-ball ball-c${c}">${c}</span>`).join("");return`<span class="mini-box"><small>盒${l+1}:</small>${o||"<i>空</i>"}</span>`}).join(""):t==="ID"?r=e.counts.map((a,l)=>{const o=Array(a).fill('<span class="mini-ball ident-ball">●</span>').join("");return`<span class="mini-box"><small>盒${l+1}:</small>${o||"<i>空</i>"}(${a})</span>`}).join(""):t==="DI"?(r=e.parts.map(a=>`<span class="mini-group">{${a.map(o=>`<span class="mini-ball distinct-ball ball-c${o}">${o}</span>`).join("")}}</span>`).join(" + "),r||(r="<i>{空}</i>")):t==="II"&&(r=e.partition.map(a=>`<span class="mini-part"><span class="badge-num">${a}</span></span>`).join(" + ")),`
            <div class="enum-chip">
                <span class="enum-chip-idx">#${e.index}</span>
                <div class="enum-chip-content">${r}</div>
            </div>
        `}).join("");return n.length>20?s+`<div class="enum-more">... 共有 ${n.length} 种分法</div>`:s}function X(n){return n?`
        <div class="modal-overlay" id="concept-modal-backdrop">
            <div class="modal-card animate-pop">
                <div class="modal-header">
                    <h4>📖 组合数学：球与盒子 核心概念速查</h4>
                    <button class="btn-close" id="close-concept-modal-btn">✕</button>
                </div>
                <div class="modal-body">
                    <div class="concept-grid">
                        <div class="concept-block">
                            <h5>球的性质 (Balls)</h5>
                            ${O.balls.map(t=>`
                                <div class="concept-item">
                                    <div class="concept-badge">${t.badge}</div>
                                    <p><strong>${t.title}</strong>：${t.story}</p>
                                </div>
                            `).join("")}
                        </div>
                        <div class="concept-block">
                            <h5>盒子的性质 (Boxes)</h5>
                            ${O.boxes.map(t=>`
                                <div class="concept-item">
                                    <div class="concept-badge">${t.badge}</div>
                                    <p><strong>${t.title}</strong>：${t.story}</p>
                                </div>
                            `).join("")}
                        </div>
                    </div>

                    <div class="benchmark-summary">
                        <h5>🌟 黄金基准：3 个球放入 2 个盒子 (4 种模型横向对比)</h5>
                        <div class="benchmark-grid">
                            <div class="bm-card dd"><strong>球异 盒异</strong><br>2³ = <b>8 种</b><br><small>每球自由选择</small></div>
                            <div class="bm-card id"><strong>球同 盒异</strong><br>C(4,1) = <b>4 种</b><br><small>只看各盒分几个</small></div>
                            <div class="bm-card di"><strong>球异 盒同</strong><br>1+3 = <b>4 种</b><br><small>无序分组装袋</small></div>
                            <div class="bm-card ii"><strong>球同 盒同</strong><br>p(3,2) = <b>2 种</b><br><small>[3] 或 [2+1]</small></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `:""}function G(n,t){const i=H.cases[n],s=H.cases[t];return!i||!s?"":`
        <div class="toast-content">
            <div class="toast-title">💡 模型切换对比（以 3 球 2 盒 为例）</div>
            <div class="toast-desc">
                从 <b>${i.title}</b> (${i.count} 种) 切换到 <b>${s.title}</b> (<b>${s.count} 种</b>)。
            </div>
            <div class="toast-reason">${s.explanation}</div>
            <button class="toast-btn-close" id="toast-close-btn">我知道了 ✓</button>
        </div>
    `}class tt{constructor(t={}){this.onSyncParams=t.onSyncParams||(()=>{}),this.onSwitchMode=t.onSwitchMode||(()=>{}),this.currentMode="DD",this.isExpanded=!0,this.showConceptModal=!1,this.progress={DD:{level:1,state:"unanswered",selectedId:null,attempts:0},ID:{level:1,state:"unanswered",selectedId:null,attempts:0},DI:{level:1,state:"unanswered",selectedId:null,attempts:0},II:{level:1,state:"unanswered",selectedId:null,attempts:0}},this.toastContent=null,this.toastTimer=null,this.container=null}mount(t){this.container=t,this.render()}setMode(t,i=null){M[t]&&(this.currentMode=t,this.render(),i&&i!==t&&this.showComparisonNotice(i,t))}getCurrentQuestion(){const t=M[this.currentMode],i=this.progress[this.currentMode],s=Math.max(0,Math.min(t.levels.length-1,i.level-1));return t.levels[s]}submitAnswer(t){const i=this.getCurrentQuestion(),s=i.options.find(r=>r.id===t);if(!s)return;const e=this.progress[this.currentMode];e.selectedId=t,e.attempts+=1,s.isCorrect?(e.state="correct",this.onSyncParams(i.n,i.m)):e.state="wrong",this.render()}nextLevel(){const t=M[this.currentMode],i=this.progress[this.currentMode];if(i.level<t.levels.length){i.level+=1,i.state="unanswered",i.selectedId=null,i.attempts=0;const s=this.getCurrentQuestion();this.onSyncParams(s.n,s.m)}else i.state="completed";this.render()}retryCurrentLevel(){const t=this.progress[this.currentMode];t.state="unanswered",t.selectedId=null,this.render()}restartModel(){this.progress[this.currentMode]={level:1,state:"unanswered",selectedId:null,attempts:0};const t=this.getCurrentQuestion();this.onSyncParams(t.n,t.m),this.render()}render(){if(!this.container)return;const t=M[this.currentMode],i=this.progress[this.currentMode],s=this.getCurrentQuestion();if(!this.isExpanded){this.container.innerHTML=`
                <div class="teaching-collapsed-bar" id="teaching-toggle-btn">
                    <span class="teaching-icon">📚</span>
                    <span class="teaching-title">教学引导：${t.nameZh} (关卡 ${i.level}/3)</span>
                    <button class="teaching-expand-btn">点击展开探索 ▼</button>
                </div>
            `;const o=document.getElementById("teaching-toggle-btn");o&&o.addEventListener("click",()=>{this.isExpanded=!0,this.render()});return}const e=[1,2,3].map(o=>{let c="level-dot";return o<i.level?c+=" passed":o===i.level&&(c+=" active"),`<span class="${c}">L${o}</span>`}).join(""),r=s.options.find(o=>o.id===i.selectedId),a=s.options.map(o=>{let c="quiz-opt-btn";i.state!=="unanswered"?o.id===i.selectedId?c+=o.isCorrect?" opt-correct":" opt-wrong":o.isCorrect&&(i.state==="correct"||i.state==="revealed")&&(c+=" opt-correct"):i.selectedId===o.id&&(c+=" opt-selected");const p=i.state==="correct"||i.state==="revealed"?"disabled":"";return`
                <button class="${c}" data-opt-id="${o.id}" ${p}>
                    <span class="opt-id">${o.id}</span>
                    <span class="opt-text">${o.text}</span>
                </button>
            `}).join("");let l="";if(i.state==="wrong"&&r)l=`
                <div class="quiz-feedback feedback-wrong animate-pop">
                    <div class="feedback-header">
                        <span class="feedback-icon">❌</span>
                        <strong>再想想看...</strong>
                    </div>
                    <p class="feedback-hint">${r.hint}</p>
                    <div class="feedback-actions">
                        <button class="btn-action btn-retry" id="quiz-retry-btn">🔄 重新选择</button>
                        <button class="btn-action btn-reveal" id="quiz-reveal-btn">📖 看解析与全枚举</button>
                    </div>
                </div>
            `;else if(i.state==="correct"||i.state==="revealed"){const o=Y(this.currentMode,s.n,s.m),c=J(o,this.currentMode),p=i.level<3?`下一关：Level ${i.level+1} 🚀`:"🎉 恭喜通关！探索矩阵工具";l=`
                <div class="quiz-feedback feedback-correct animate-pop">
                    <div class="feedback-header">
                        <span class="feedback-icon">✅</span>
                        <strong>${r&&r.isCorrect?"回答完全正确！":"解析已解锁"}</strong>
                    </div>
                    <p class="feedback-exp">${s.explanation}</p>
                    <div class="feedback-takeaway">${s.takeaway}</div>

                    <div class="enum-preview-section">
                        <div class="enum-preview-title">
                            <span>📋 本题全部 ${o.length} 种分配方案穷举：</span>
                            <button class="btn-sync-params" id="sync-current-params-btn" title="将此题数字放入右侧演示区">
                                🔍 演示区联动 (n=${s.n}, m=${s.m})
                            </button>
                        </div>
                        <div class="enum-cards-scroll">
                            ${c}
                        </div>
                    </div>

                    <div class="feedback-actions">
                        ${i.level<3?`
                            <button class="btn-action btn-next" id="quiz-next-btn">${p}</button>
                        `:`
                            <button class="btn-action btn-finish" id="quiz-restart-btn">🔄 重新挑战本模型</button>
                        `}
                    </div>
                </div>
            `}this.container.innerHTML=`
            <div class="teaching-card card">
                <div class="teaching-header">
                    <div class="teaching-title-row">
                        <span class="teaching-badge">💡 互动引导</span>
                        <h3>${t.nameZh} · ${s.title}</h3>
                        <div class="level-indicator">${e}</div>
                    </div>
                    <div class="teaching-controls">
                        <button class="btn-text" id="concept-quick-view-btn" title="查看球同/异、盒同/异定义">
                            🔍 概念速查
                        </button>
                        <button class="btn-icon" id="teaching-toggle-btn" title="收起面板">▲</button>
                    </div>
                </div>

                <div class="teaching-body">
                    <div class="story-box">
                        <p class="story-text">${s.story}</p>
                    </div>

                    <div class="question-box">
                        <p class="question-text">❓ <strong>${s.question}</strong></p>
                        <div class="quiz-options-grid">${a}</div>
                    </div>

                    ${l}
                </div>
            </div>

            ${X(this.showConceptModal)}
            <div id="comparison-toast" class="comparison-toast ${this.toastContent?"visible":"hidden"}">
                ${this.toastContent||""}
            </div>
        `,this.bindEvents()}showComparisonNotice(t,i){if(!this.isExpanded)return;const s=G(t,i);s&&(this.toastContent=s,this.toastTimer&&clearTimeout(this.toastTimer),this.render(),this.toastTimer=setTimeout(()=>{this.toastContent=null,this.render()},7e3))}bindEvents(){const t=document.getElementById("teaching-toggle-btn");t&&t.addEventListener("click",()=>{this.isExpanded=!this.isExpanded,this.render()});const i=document.getElementById("toast-close-btn");i&&i.addEventListener("click",()=>{this.toastContent=null,this.toastTimer&&clearTimeout(this.toastTimer),this.render()});const s=document.getElementById("concept-quick-view-btn");s&&s.addEventListener("click",()=>{this.showConceptModal=!0,this.render()});const e=document.getElementById("close-concept-modal-btn");e&&e.addEventListener("click",()=>{this.showConceptModal=!1,this.render()});const r=document.getElementById("concept-modal-backdrop");r&&r.addEventListener("click",x=>{x.target===r&&(this.showConceptModal=!1,this.render())}),this.container.querySelectorAll(".quiz-opt-btn").forEach(x=>{x.addEventListener("click",()=>{this.submitAnswer(x.dataset.optId)})});const l=document.getElementById("quiz-retry-btn");l&&l.addEventListener("click",()=>this.retryCurrentLevel());const o=document.getElementById("quiz-reveal-btn");o&&o.addEventListener("click",()=>{const x=this.progress[this.currentMode];x.state="revealed";const C=this.getCurrentQuestion();this.onSyncParams(C.n,C.m),this.render()});const c=document.getElementById("quiz-next-btn");c&&c.addEventListener("click",()=>this.nextLevel());const p=document.getElementById("quiz-restart-btn");p&&p.addEventListener("click",()=>this.restartModel());const E=document.getElementById("sync-current-params-btn");E&&E.addEventListener("click",()=>{const x=this.getCurrentQuestion();this.onSyncParams(x.n,x.m)})}}let h="DD",f=2,d=2,k=!1,S=[],L=null,b,v,I,D,T,z,g,m,j;const y=n=>document.getElementById(n),et=n=>document.querySelectorAll(n),_=n=>document.querySelector(n);let u=window.innerWidth<640?7:10;function W(){b=y("n-input"),v=y("m-input"),I=y("n-val"),D=y("m-val"),T=y("matrix-container"),z=et(".mode-btn"),_(".formula-card"),g=y("canvas"),g&&(m=g.getContext("2d")),j=_(".visual-card"),f=2,d=2,h="DD",k=!1;const n=y("teaching-container");L=new tt({onSyncParams:(t,i)=>{f=t,d=i,b&&(b.value=t,I&&(I.textContent=t)),v&&(v.value=i,D&&(D.textContent=i)),w(),B()},onSwitchMode:t=>{F(t)}}),n&&(L.mount(n),L.setMode(h)),b&&(b.value=f,b.max=u),v&&(v.value=d,v.max=u),I&&(I.textContent=f),D&&(D.textContent=d),z.forEach(t=>{t.dataset.mode===h?t.classList.add("active"):t.classList.remove("active")}),nt(),w(),B(),setTimeout(()=>{Z(),B()},100)}function F(n,t=null){if(!A[n])return;const i=t||h;h=n,k=!1,z.forEach(s=>{s.dataset.mode===h?s.classList.add("active"):s.classList.remove("active")}),L&&L.setMode(n,i),B()}function nt(){b&&b.addEventListener("input",n=>{f=parseInt(n.target.value),I&&(I.textContent=f),w(),B()}),v&&v.addEventListener("input",n=>{d=parseInt(n.target.value),D&&(D.textContent=d),w(),B()}),z.forEach(n=>{n.addEventListener("click",()=>{const t=n.dataset.mode;t!==h&&F(t,h)})}),j&&j.addEventListener("click",()=>{w(),P()}),window.addEventListener("resize",()=>{const n=window.innerWidth<640?7:10;n!==u&&(u=n,b&&(b.max=u),v&&(v.max=u),f>u&&(f=u,b&&(b.value=f),I&&(I.textContent=f)),d>u&&(d=u,v&&(v.value=d),D&&(D.textContent=d)),w(),B()),Z()}),b&&(b.max=u),v&&(v.max=u),Z()}function Z(){if(!g||!g.parentElement)return;const n=g.parentElement;g.width=n.clientWidth,g.height=n.clientHeight,P()}function B(){if(!h||!A[h])return;const n=A[h],t=n.calculate(u,u,k),i=t.matrix||t,s=i[f]?i[f][d]:0,e=p=>p?p.replace(/{n}/g,f).replace(/{m}/g,d).replace(/{res}/g,s):"",r=y("explanation-zh"),a=y("explanation-en");r&&(r.innerText=e(n.explainZh)),a&&(a.innerText=e(n.explainEn));const l=y("matrix-tabs"),o=y("active-formula-display");if(l&&o)if(n.formulaZh.includes(`
`)){l.style.display="flex";const p=n.formulaZh.split(`
`),E=n.modeLabels||[];l.innerHTML=`
                <button class="matrix-tab-btn ${k?"":"active"}" data-alt="false">
                    ${E[0]||"视角 1"}
                </button>
                <button class="matrix-tab-btn ${k?"active":""}" data-alt="true">
                    ${E[1]||"视角 2"}
                </button>
            `,o.innerHTML=k?p[1]:p[0],o.style.display="block",l.querySelectorAll(".matrix-tab-btn").forEach(x=>{x.addEventListener("click",()=>{k=x.dataset.alt==="true",B()})})}else l.style.display="none",o.innerHTML=n.formulaZh.replace(`
`,"<br>"),o.style.display="block";const c=y("closed-formula");c&&(c.innerHTML=n.closedZh||""),st(),P()}function st(){if(!T)return;const n=A[h],t=n.calculate(u,u,k),i=t.matrix||t;let s="<table><thead><tr><th>n\\m</th>";for(let e=0;e<=u;e++)s+=`<th>${e}</th>`;s+="</tr></thead><tbody>";for(let e=0;e<=u;e++){s+=`<tr><th>${e}</th>`;for(let r=0;r<=u;r++){let a=i[e][r];const l=e===f&&r===d;let o="";k&&(h==="DI"?o=t.componentMatrix[e][r]:h==="II"&&(e>=r?o=i[e-r][r]:o=0));let c=l?"cell-active":"",p="",E=o!==""?`<span class="cell-corner">${o}</span>`:"";const C=n.getDependencies(f,d,k).find($=>$.r===e&&$.c===r);C&&(h==="DI"&&k&&!l&&(a=t.componentMatrix[e][r]),l?c+=" cell-source-overlap":c=C.cls,C.label&&(p=`<span class="cell-label">${C.label}</span>`)),s+=`<td class="${c}" data-r="${e}" data-c="${r}">${p}${E}${a}</td>`}s+="</tr>"}s+="</tbody></table>",T.innerHTML=s,T.querySelectorAll("td").forEach(e=>{e.addEventListener("click",()=>{f=parseInt(e.dataset.r),d=parseInt(e.dataset.c),b&&(b.value=f),v&&(v.value=d),I&&(I.textContent=f),D&&(D.textContent=d),w(),B()})})}function w(){if(S=Array.from({length:d},()=>[]),d!==0){if(h.startsWith("D"))for(let n=0;n<f;n++){const t=Math.floor(Math.random()*d);S[t].push(n)}else{let n=f;for(let t=0;t<d-1;t++){const i=Math.floor(Math.random()*(n+1));for(let s=0;s<i;s++)S[t].push("ball");n-=i}for(let t=0;t<n;t++)S[d-1].push("ball")}h.endsWith("I")&&S.sort((n,t)=>t.length-n.length)}}function P(){if(!m||!g)return;m.clearRect(0,0,g.width,g.height);const n=50,t=80,i=60,s=(g.width-2*n-d*t)/(d-1||1);m.fillStyle="#fff",m.font="bold 16px Outfit",m.textAlign="center";const e=A[h].calculate(10,10),r=e.matrix||e,a=r[f]?r[f][d]:0;m.fillText(`${f} Balls → ${d} Boxes: ${a} ways`,g.width/2,30),m.font="12px Outfit",m.fillStyle=q("--text-secondary"),m.fillText("(点击卡片切换示例 / Click card to cycle examples)",g.width/2,50);for(let l=0;l<d;l++){const o=n+l*(t+s),c=g.height-120;m.strokeStyle=q("--accent-color"),m.lineWidth=2,m.strokeRect(o,c,t,i),m.fillStyle=q("--text-secondary"),m.font="12px Outfit",m.textAlign="center";const p=h.endsWith("D")?`Box ${l+1}`:`Part ${l+1}`;m.fillText(p,o+t/2,c+i+20);const E=S[l]||[],x=6;E.forEach((C,$)=>{const N=o+15+$%4*15,R=c+15+Math.floor($/4)*15;m.beginPath(),m.arc(N,R,x,0,Math.PI*2),typeof C=="number"?(m.fillStyle=`hsl(${C*360/(f||1)}, 70%, 60%)`,m.fill(),m.fillStyle="#fff",m.font="8px Outfit",m.fillText(C+1,N,R+3)):(m.fillStyle=q("--text-secondary"),m.fill())})}}function q(n){const t=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return t||(n==="--accent-color"?"#38bdf8":n==="--text-secondary"?"#94a3b8":"#ffffff")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",W):W();window.addEventListener("load",()=>{Z(),B()});
