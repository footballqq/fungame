// codex: 2026-08-28 单元测试脚本：验证题库数据完整性与数学准确性
import { QUESTION_BANK, CONCEPT_DEFINITIONS, BENCHMARK_3_2_COMPARISON } from './src/questions.js';
import { getEnumeration } from './src/enumerate.js';
import { MODELS } from './src/math.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        console.error(`FAIL: ${message}`);
        failed++;
    }
}

console.log('=== 开始单元测试：题库数据完整性与正确性 ===');

// 1. 验证概念对比与基准用例
assert(CONCEPT_DEFINITIONS.balls.length === 2, '球概念包含不同球与相同球');
assert(CONCEPT_DEFINITIONS.boxes.length === 2, '盒概念包含不同盒与相同盒');
assert(BENCHMARK_3_2_COMPARISON.cases.DD.count === 8, '基准 3球2盒 DD=8');
assert(BENCHMARK_3_2_COMPARISON.cases.ID.count === 4, '基准 3球2盒 ID=4');
assert(BENCHMARK_3_2_COMPARISON.cases.DI.count === 4, '基准 3球2盒 DI=4');
assert(BENCHMARK_3_2_COMPARISON.cases.II.count === 2, '基准 3球2盒 II=2');

// 2. 遍历每个模型的每道题目
const modes = ['DD', 'ID', 'DI', 'II'];

modes.forEach(mode => {
    const bank = QUESTION_BANK[mode];
    assert(!!bank, `模型 ${mode} 题库存在`);
    assert(bank.levels.length === 3, `模型 ${mode} 包含 3 个等级题目`);

    bank.levels.forEach((levelData, idx) => {
        const desc = `${mode} - Level ${levelData.level} (n=${levelData.n}, m=${levelData.m})`;
        assert(levelData.options.length === 4, `${desc} 包含 4 个选项`);

        const correctOpts = levelData.options.filter(o => o.isCorrect);
        assert(correctOpts.length === 1, `${desc} 恰好有 1 个正确选项`);

        // 验证提示信息
        levelData.options.forEach(opt => {
            assert(!!opt.hint && opt.hint.length > 5, `${desc} 选项 ${opt.id} 包含有效针对性提示`);
        });

        // 验证与全枚举数量一致
        const enums = getEnumeration(mode, levelData.n, levelData.m);
        const correctText = correctOpts[0].text;
        const correctCount = parseInt(correctText.replace(/[^0-9]/g, ''));
        assert(correctCount === enums.length, `${desc} 正确答案数字 (${correctCount}) 与枚举算法计算 (${enums.length}) 一致`);

        // 验证与 math.js 一致
        let mathExpected = 0;
        if (mode === 'DD') {
            mathExpected = Math.pow(levelData.m, levelData.n);
        } else if (mode === 'ID') {
            const mData = MODELS.ID.calculate(levelData.n, levelData.m);
            mathExpected = mData[levelData.n][levelData.m];
        } else if (mode === 'DI') {
            const mData = MODELS.DI.calculate(levelData.n, levelData.m, true);
            mathExpected = mData.matrix[levelData.n][levelData.m];
        } else if (mode === 'II') {
            const mData = MODELS.II.calculate(levelData.n, levelData.m);
            mathExpected = mData[levelData.n][levelData.m];
        }

        assert(correctCount === mathExpected, `${desc} 正确答案数字 (${correctCount}) 与公式计算 (${mathExpected}) 一致`);
    });
});

console.log(`\n测试完成: 通过 ${passed} 个断言, 失败 ${failed} 个`);
if (failed > 0) {
    process.exit(1);
}
