// codex: 2026-08-28 单元测试脚本：验证全枚举生成器与组合数学计算完全一致
import { enumerateDD, enumerateID, enumerateDI, enumerateII } from './src/enumerate.js';
import { MODELS } from './src/math.js';

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, desc) {
    if (actual === expected) {
        passed++;
    } else {
        console.error(`FAIL: ${desc} -> got ${actual}, expected ${expected}`);
        failed++;
    }
}

console.log('=== 开始单元测试：球盒全枚举与数学公式一致性 ===');

// 1. 测试 DD (m^n)
for (let n = 1; n <= 4; n++) {
    for (let m = 1; m <= 4; m++) {
        const enums = enumerateDD(n, m);
        const expected = Math.pow(m, n);
        assertEqual(enums.length, expected, `DD(n=${n}, m=${m})`);
    }
}

// 2. 测试 ID (C(n+m-1, m-1))
const idCalc = MODELS.ID.calculate(5, 5);
for (let n = 1; n <= 4; n++) {
    for (let m = 1; m <= 4; m++) {
        const enums = enumerateID(n, m);
        const expected = idCalc[n][m];
        assertEqual(enums.length, expected, `ID(n=${n}, m=${m})`);
    }
}

// 3. 测试 DI (sum_{k=1}^m S(n,k))
const diCalc = MODELS.DI.calculate(5, 5, true); // alt=true 表示至多 m 盒
for (let n = 1; n <= 4; n++) {
    for (let m = 1; m <= 4; m++) {
        const enums = enumerateDI(n, m);
        const expected = diCalc.matrix[n][m];
        assertEqual(enums.length, expected, `DI(n=${n}, m=${m})`);
    }
}

// 4. 测试 II (整数分拆 p(n, m))
const iiCalc = MODELS.II.calculate(5, 5);
for (let n = 1; n <= 5; n++) {
    for (let m = 1; m <= 5; m++) {
        const enums = enumerateII(n, m);
        const expected = iiCalc[n][m];
        assertEqual(enums.length, expected, `II(n=${n}, m=${m})`);
    }
}

// 5. 验证关键教学用例：3 球 2 盒
const dd32 = enumerateDD(3, 2).length;
const id32 = enumerateID(3, 2).length;
const di32 = enumerateDI(3, 2).length;
const ii32 = enumerateII(3, 2).length;
console.log(`关键对比用例 3 球 2 盒结果：DD=${dd32}(8), ID=${id32}(4), DI=${di32}(4), II=${ii32}(2)`);
assertEqual(dd32, 8, '3球2盒 DD=8');
assertEqual(id32, 4, '3球2盒 ID=4');
assertEqual(di32, 4, '3球2盒 DI=4');
assertEqual(ii32, 2, '3球2盒 II=2');

console.log(`\n测试完成: 通过 ${passed} 个, 失败 ${failed} 个`);
if (failed > 0) {
    process.exit(1);
}
