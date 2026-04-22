// codex: 2026-04-22 why: 初始化数据结构，封装对 LocalStorage 的读写操作，存储默认的 30 题题库

const DEFAULT_QUESTIONS = [
    { id: 1, category: "必答题", subcategory: "人生轨迹", content: "介绍你从 1996 年踏入清华校门到 2026 年这三十年的经历。" },
    { id: 2, category: "必答题", subcategory: "家庭现状", content: "目前的家庭状况，孩子几岁了，他们身上是否有你当年“技术流”的影子？" },
    { id: 3, category: "必答题", subcategory: "坐标职业", content: "现在工作生活在哪个城市？在从事什么细分领域（依然在代码一线，还是在管理、创业、投融资或跨界）？" },
    { id: 4, category: "必答题", subcategory: "身体状态", content: "“为祖国健康工作五十载”的进度条目前到哪了？最常做的运动是什么？" },
    { id: 5, category: "必答题", subcategory: "核心技能", content: "现在最想做的事情是什么？" },

    { id: 6, category: "选答题", subcategory: "回忆杀", content: "还记得当年在 9# 宿舍或实验室熬夜写代码，为了解决哪个 Bug 曾让你彻夜难眠？" },
    { id: 7, category: "选答题", subcategory: "回忆杀", content: "你在清华写下的第一行让你有成就感的程序是什么？是用 Pascal, C 还是汇编？" },
    { id: 8, category: "选答题", subcategory: "回忆杀", content: "哪位老师的哪一句话，至今仍会在你做决策或写逻辑时在你耳边响起？" },
    { id: 9, category: "选答题", subcategory: "回忆杀", content: "十食堂、八食堂或是七食堂的哪道菜，是你现在身处世界任何角落都复刻不出来的？" },
    { id: 10, category: "选答题", subcategory: "回忆杀", content: "在微信出现前的年代，你当时最活跃的社交平台是水木清华 BBS、9#bbs？什么版块？" },
    { id: 11, category: "选答题", subcategory: "回忆杀", content: "上学时除了修学分，你投入精力最多的一件事是什么（如：长跑、社团、打游戏、组装电脑）？" },
    { id: 12, category: "选答题", subcategory: "回忆杀", content: "1996 年报到那天，你对清华的第一印象和现在的感受有何最大的反差？" },
    { id: 13, category: "选答题", subcategory: "回忆杀", content: "哪门课程曾让你在考前感到“逻辑崩溃”，最后又是如何低空飘过的？高分大佬们请忽略" },
    { id: 14, category: "选答题", subcategory: "回忆杀", content: "此时此刻，你最想感谢的一位同寝室或同班同学是谁？" },
    { id: 15, category: "选答题", subcategory: "回忆杀", content: "你在清华期间买过最贵或最引以为傲的电子产品是什么？" },

    { id: 16, category: "选答题", subcategory: "跨越30年", content: "从 1996 年的互联网萌芽到现在的 AI 浪潮，哪个技术转折点对你的职场生涯产生了决定性影响？" },
    { id: 17, category: "选答题", subcategory: "跨越30年", content: "如果能回到 1996 年，你会给刚踏进系馆的自己一个关于“技术选型”或“职业路径”的什么建议？" },
    { id: 18, category: "选答题", subcategory: "跨越30年", content: "离开校园后，你发现哪项“软技能”其实比算法和数据结构更重要？" },
    { id: 19, category: "选答题", subcategory: "跨越30年", content: "过去 30 年里，哪次挫折让你重新审视了自己？你是如何实现“系统重启”的？" },
    { id: 20, category: "选答题", subcategory: "跨越30年", content: "你这辈子到目前为止，最让你有成就感的一个“作品”（可以是一个算法、一个产品、一个项目或一个决定）是什么？" },
    { id: 21, category: "选答题", subcategory: "跨越30年", content: "“清华计算机”这个背景，在社会上带给你更多的是助力还是“必须优秀”的压力？" },
    { id: 22, category: "选答题", subcategory: "跨越30年", content: "经历了市场的牛熊转换与周期更替，你现在如何定义“财务自由”？" },
    { id: 23, category: "选答题", subcategory: "跨越30年", content: "面对当前的生成式人工智能，你是否产生了“技术焦虑”，还是已经将其接入了自己的工作流？" },
    { id: 24, category: "选答题", subcategory: "跨越30年", content: "过去 30 年里，对你价值观影响最大的一本书是什么？" },
    { id: 25, category: "选答题", subcategory: "跨越30年", content: "如果现在给你一个月的时间回到清华当学生，且没有任何考试压力，你最想去做什么？" },

    { id: 26, category: "选答题", subcategory: "展望未来", content: "如果明天就退休，你最想去实现的“非职业”梦想是什么？" },
    { id: 27, category: "选答题", subcategory: "展望未来", content: "对于下一代，你更希望他们继承你的逻辑思维，还是希望他们去尝试你未曾涉足的感性世界？" },
    { id: 28, category: "选答题", subcategory: "展望未来", content: "如果用一行代码（任何语言）来总结你的前 50 年人生，你会怎么写？" },
    { id: 29, category: "选答题", subcategory: "展望未来", content: "想象 2046 年（入学 50 周年）再次聚会，你最希望那时候的自己依然保持什么特质？" },
    { id: 30, category: "选答题", subcategory: "展望未来", content: "现场选一位老同学，问一个你藏了 30 年一直想问但没问出口的问题。" }
];

const DEFAULT_DECK_CONFIG = {
    '♠': { active: true, min: 1, max: 13 },
    '♥': { active: true, min: 1, max: 13 },
    '♣': { active: true, min: 1, max: 13 },
    '♦': { active: true, min: 1, max: 13 }
};

// 封装状态管理对象
const AppStore = {
    // 获取全部问题
    getQuestions: function () {
        const stored = localStorage.getItem('jh_questions');
        return stored ? JSON.parse(stored) : DEFAULT_QUESTIONS;
    },
    // 保存全部问题
    saveQuestions: function (questions) {
        localStorage.setItem('jh_questions', JSON.stringify(questions));
    },
    // 获取牌库配置
    getDeckConfig: function () {
        const stored = localStorage.getItem('jh_deck_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            // 兼容旧版本数据结构
            if (parsed.suits) {
                return DEFAULT_DECK_CONFIG;
            }
            return parsed;
        }
        return DEFAULT_DECK_CONFIG;
    },
    // 保存牌库配置
    saveDeckConfig: function (config) {
        localStorage.setItem('jh_deck_config', JSON.stringify(config));
    },
    // 获取抽奖历史 (已抽出的牌)
    getDrawHistory: function () {
        const stored = localStorage.getItem('jh_draw_history');
        return stored ? JSON.parse(stored) : [];
    },
    // 保存抽奖历史
    saveDrawHistory: function (history) {
        localStorage.setItem('jh_draw_history', JSON.stringify(history));
    },
    // 重置抽奖历史
    resetDrawHistory: function () {
        localStorage.removeItem('jh_draw_history');
    },
    // 重置系统到默认状态
    factoryReset: function () {
        localStorage.removeItem('jh_questions');
        localStorage.removeItem('jh_deck_config');
        localStorage.removeItem('jh_draw_history');
    }
};
