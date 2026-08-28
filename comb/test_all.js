// codex: 2026-08-28 全局自动化测试套件：覆盖数学模型、枚举、题库、文件规模规范
import fs from 'fs';
import path from 'path';
import { enumerateDD, enumerateID, enumerateDI, enumerateII, getEnumeration } from './src/enumerate.js';
import { QUESTION_BANK, CONCEPT_DEFINITIONS, BENCHMARK_3_2_COMPARISON } from './src/questions.js';
import { MODELS } from './src/math.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
    }
}

console.log('========================================================');
console.log('🎯 启动球盒模型教学系统全模块自动化测试');
console.log('========================================================\n');

// 1. 验证枚举算法准确性
console.log('--- 1. 枚举生成算法测试 ---');
for (let n = 1; n <= 4; n++) {
    for (let m = 1; m <= 4; m++) {
        // DD
        const dd = enumerateDD(n, m);
        assert(dd.length === Math.pow(m, n), `DD(n=${n}, m=${m}) 生成 ${dd.length} 项 (期望 ${Math.pow(m, n)})`);

        // ID
        const id = enumerateID(n, m);
        const idExp = MODELS.ID.calculate(n, m)[n][m];
        assert(id.length === idExp, `ID(n=${n}, m=${m}) 生成 ${id.length} 项 (期望 ${idExp})`);

        // DI (至多 m 盒)
        const di = enumerateDI(n, m);
        const diExp = MODELS.DI.calculate(n, m, true).matrix[n][m];
        assert(di.length === diExp, `DI(n=${n}, m=${m}) 生成 ${di.length} 项 (期望 ${diExp})`);

        // II
        const ii = enumerateII(n, m);
        const iiExp = MODELS.II.calculate(n, m)[n][m];
        assert(ii.length === iiExp, `II(n=${n}, m=${m}) 生成 ${ii.length} 项 (期望 ${iiExp})`);
    }
}

// 2. 验证关键基准对比 (3球2盒)
console.log('\n--- 2. 黄金基准 (3球2盒) 四模型对比测试 ---');
assert(BENCHMARK_3_2_COMPARISON.cases.DD.count === 8, 'DD 3球2盒 = 8');
assert(BENCHMARK_3_2_COMPARISON.cases.ID.count === 4, 'ID 3球2盒 = 4');
assert(BENCHMARK_3_2_COMPARISON.cases.DI.count === 4, 'DI 3球2盒 = 4');
assert(BENCHMARK_3_2_COMPARISON.cases.II.count === 2, 'II 3球2盒 = 2');

// 3. 验证题库与自适应关卡数据
console.log('\n--- 3. 题库关卡完整性与诊断提示测试 ---');
['DD', 'ID', 'DI', 'II'].forEach(mode => {
    const bank = QUESTION_BANK[mode];
    assert(bank.levels.length === 3, `${mode} 包含 3 级递进关卡`);
    bank.levels.forEach(lvl => {
        const correctOpts = lvl.options.filter(o => o.isCorrect);
        assert(correctOpts.length === 1, `${mode} L${lvl.level} 存在且仅有 1 个正确答案`);

        // 验证提示完整性
        lvl.options.forEach(opt => {
            assert(!!opt.hint && opt.hint.length > 5, `${mode} L${lvl.level} 选项 ${opt.id} 包含针对性诊断提示`);
        });

        // 验证正确答案数值
        const correctCount = parseInt(correctOpts[0].text.replace(/[^0-9]/g, ''));
        const enumCount = getEnumeration(mode, lvl.n, lvl.m).length;
        assert(correctCount === enumCount, `${mode} L${lvl.level} 正确选项 (${correctCount}) 与枚举算法结果 (${enumCount}) 匹配`);
    });
});

// 4. 验证代码工程规范：单个源文件 <= 500 行
console.log('\n--- 4. 代码工程规范检查 (单文件 <= 500 行) ---');
const srcDir = path.resolve('src');
const files = fs.readdirSync(srcDir);

files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.css')) {
        const fullPath = path.join(srcDir, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lineCount = content.split('\n').length;
        assert(lineCount <= 500, `文件 src/${file} 行数 ${lineCount} <= 500 行`);
    }
});

console.log('\n========================================================');
console.log(`✅ 测试总结: 全部断言 ${passed} 项通过, 失败 ${failed} 项`);
console.log('========================================================');

if (failed > 0) {
    process.exit(1);
}
