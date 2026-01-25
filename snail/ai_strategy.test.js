// codex: 2026-01-25 补测试：冒险模式作弊布局求解器（能踩雷就踩雷）
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildImoEdgeEscapePath,
    getLastMoveAxisFromPath,
    validateMastermindIntercept,
    canStartAdventureAtCell,
    tryBuildAdventureCheatMonsterLayout,
    buildMastermindDefeatText,
    shouldAutoStartNextAttempt,
} = require('./game.js');

function assertPathPointsAreValid(path, rows, cols) {
    assert.ok(Array.isArray(path), 'path 必须是数组');
    assert.ok(path.length > 0, 'path 不能为空');

    for (const point of path) {
        assert.ok(Number.isInteger(point.r), 'r 必须为整数');
        assert.ok(Number.isInteger(point.c), 'c 必须为整数');
        assert.ok(point.r >= 0 && point.r < rows, `r 越界: ${point.r}`);
        assert.ok(point.c >= 0 && point.c < cols, `c 越界: ${point.c}`);
    }

    for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1];
        const curr = path[i];
        const manhattan = Math.abs(curr.r - prev.r) + Math.abs(curr.c - prev.c);
        assert.equal(manhattan, 1, `路径不连续: (${prev.r},${prev.c}) -> (${curr.r},${curr.c})`);
    }
}

function assertPathDoesNotContain(path, forbiddenPoint) {
    const hasForbidden = path.some((point) => point.r === forbiddenPoint.r && point.c === forbiddenPoint.c);
    assert.equal(hasForbidden, false, `路径不应包含禁用点: (${forbiddenPoint.r},${forbiddenPoint.c})`);
}

test('getLastMoveAxisFromPath：识别最后一步移动轴', () => {
    assert.equal(getLastMoveAxisFromPath([{ r: 0, c: 0 }]), null);
    assert.equal(
        getLastMoveAxisFromPath([
            { r: 0, c: 0 },
            { r: 0, c: 1 },
        ]),
        'HORIZONTAL',
    );
    assert.equal(
        getLastMoveAxisFromPath([
            { r: 0, c: 0 },
            { r: 1, c: 0 },
        ]),
        'VERTICAL',
    );
    assert.equal(
        getLastMoveAxisFromPath([
            { r: 0, c: 0 },
            { r: 2, c: 0 },
        ]),
        null,
    );
});

test('buildImoEdgeEscapePath：左边缘 M1 + 向南遇到 M2（VERTICAL）', () => {
    const rows = 10;
    const cols = 9;
    const m1Col = 0;
    const staircaseDir = 1;
    const m2Row = 4;
    const m2Col = 4; // 阶梯的“向下”格

    const path = buildImoEdgeEscapePath({
        rows,
        cols,
        m1Col,
        m2Row,
        m2Col,
        staircaseDir,
        m2EncounterAxis: 'VERTICAL',
    });

    assertPathPointsAreValid(path, rows, cols);
    assert.deepEqual(path[0], { r: 0, c: 1 });
    assert.deepEqual(path[path.length - 1], { r: rows - 1, c: m1Col });
    assertPathDoesNotContain(path, { r: 1, c: m1Col }); // 避开 M1 本体
    assertPathDoesNotContain(path, { r: m2Row, c: m2Col }); // 避开 M2 本体
    assert.ok(path.some((p) => p.r === m2Row && p.c === m2Col - staircaseDir), '应到达 M2 左侧安全格');
});

test('buildImoEdgeEscapePath：左边缘 M1 + 向东遇到 M2（HORIZONTAL）', () => {
    const rows = 10;
    const cols = 9;
    const m1Col = 0;
    const staircaseDir = 1;
    const m2Row = 4;
    const m2Col = 5; // 阶梯的“向右”格

    const path = buildImoEdgeEscapePath({
        rows,
        cols,
        m1Col,
        m2Row,
        m2Col,
        staircaseDir,
        m2EncounterAxis: 'HORIZONTAL',
    });

    assertPathPointsAreValid(path, rows, cols);
    assert.deepEqual(path[0], { r: 0, c: 1 });
    assert.deepEqual(path[path.length - 1], { r: rows - 1, c: m1Col });
    assertPathDoesNotContain(path, { r: 1, c: m1Col });
    assertPathDoesNotContain(path, { r: m2Row, c: m2Col });
    assert.ok(path.some((p) => p.r === m2Row && p.c === m2Col - staircaseDir), '应到达 M2 左侧安全格');
});

test('buildImoEdgeEscapePath：右边缘 M1 + 向南遇到 M2（VERTICAL）', () => {
    const rows = 10;
    const cols = 9;
    const m1Col = cols - 1;
    const staircaseDir = -1;
    const m2Row = 4;
    const m2Col = 4; // 阶梯的“向下”格

    const path = buildImoEdgeEscapePath({
        rows,
        cols,
        m1Col,
        m2Row,
        m2Col,
        staircaseDir,
        m2EncounterAxis: 'VERTICAL',
    });

    assertPathPointsAreValid(path, rows, cols);
    assert.deepEqual(path[0], { r: 0, c: cols - 2 });
    assert.deepEqual(path[path.length - 1], { r: rows - 1, c: m1Col });
    assertPathDoesNotContain(path, { r: 1, c: m1Col });
    assertPathDoesNotContain(path, { r: m2Row, c: m2Col });
    assert.ok(path.some((p) => p.r === m2Row && p.c === m2Col - staircaseDir), '应到达 M2 右侧安全格');
});

test('buildImoEdgeEscapePath：右边缘 M1 + 向西遇到 M2（HORIZONTAL）', () => {
    const rows = 10;
    const cols = 9;
    const m1Col = cols - 1;
    const staircaseDir = -1;
    const m2Row = 4;
    const m2Col = 3; // 阶梯的“向左”格

    const path = buildImoEdgeEscapePath({
        rows,
        cols,
        m1Col,
        m2Row,
        m2Col,
        staircaseDir,
        m2EncounterAxis: 'HORIZONTAL',
    });

    assertPathPointsAreValid(path, rows, cols);
    assert.deepEqual(path[0], { r: 0, c: cols - 2 });
    assert.deepEqual(path[path.length - 1], { r: rows - 1, c: m1Col });
    assertPathDoesNotContain(path, { r: 1, c: m1Col });
    assertPathDoesNotContain(path, { r: m2Row, c: m2Col });
    assert.ok(path.some((p) => p.r === m2Row && p.c === m2Col - staircaseDir), '应到达 M2 右侧安全格');
});

test('validateMastermindIntercept：已确认安全格禁止放怪物（优先级最高）', () => {
    const safeCells = new Set(['2,3']);
    const monsters = [{ r: 2, c: 3 }];
    assert.deepEqual(
        validateMastermindIntercept({ safeCells, monsters, r: 2, c: 3 }),
        { ok: false, reason: 'cell_already_safe' },
    );
});

test('validateMastermindIntercept：同行/同列规则校验', () => {
    const safeCells = new Set();
    assert.deepEqual(
        validateMastermindIntercept({ safeCells, monsters: [{ r: 2, c: 1 }], r: 2, c: 3 }),
        { ok: false, reason: 'row_already_has_monster' },
    );
    assert.deepEqual(
        validateMastermindIntercept({ safeCells, monsters: [{ r: 2, c: 1 }], r: 4, c: 1 }),
        { ok: false, reason: 'col_already_has_monster' },
    );
    assert.deepEqual(
        validateMastermindIntercept({ safeCells, monsters: [{ r: 2, c: 1 }], r: 4, c: 3 }),
        { ok: true, reason: 'ok' },
    );
});

test('canStartAdventureAtCell：允许第0行任意格出发', () => {
    assert.equal(canStartAdventureAtCell({ visitedLayers: [], monsterRevealed: false }, 0), true);
    assert.equal(canStartAdventureAtCell({ visitedLayers: [], monsterRevealed: true }, 0), true);
});

test('canStartAdventureAtCell：允许从已确认安全格出发（走过且未揭示怪物）', () => {
    assert.equal(canStartAdventureAtCell({ visitedLayers: [0], monsterRevealed: false }, 3), true);
    assert.equal(canStartAdventureAtCell({ visitedLayers: [], monsterRevealed: false }, 3), false);
    assert.equal(canStartAdventureAtCell({ visitedLayers: [0], monsterRevealed: true }, 3), false);
    assert.equal(canStartAdventureAtCell(null, 3), false);
});

test('buildImoEdgeEscapePath：参数不合法返回 null', () => {
    const path = buildImoEdgeEscapePath({
        rows: 10,
        cols: 9,
        m1Col: 0,
        m2Row: 4,
        m2Col: 4,
        staircaseDir: 0,
        m2EncounterAxis: 'VERTICAL',
    });
    assert.equal(path, null);
});

test('buildMastermindDefeatText：中文文案包含次数与完整句', () => {
    const text = buildMastermindDefeatText('CN', 3);
    assert.equal(text.title, '你失败了');
    assert.ok(text.message.includes('3'), 'message 应包含次数');
    assert.ok(text.full.includes('你失败了'), 'full 应包含失败提示');
    assert.ok(text.full.includes('3'), 'full 应包含次数');
});

test('buildMastermindDefeatText：英文文案包含次数与完整句', () => {
    const text = buildMastermindDefeatText('EN', 2);
    assert.equal(text.title, 'You lost');
    assert.ok(text.message.includes('2'), 'message 应包含次数');
    assert.ok(text.full.includes('You lost'), 'full 应包含失败提示');
    assert.ok(text.full.includes('2'), 'full 应包含次数');
});

test('shouldAutoStartNextAttempt：暂停时不自动进入下一次', () => {
    assert.equal(shouldAutoStartNextAttempt(true), false);
    assert.equal(shouldAutoStartNextAttempt(false), true);
});

function assertAdventureMonsterLayoutValid(monsters, rows, cols, { enforceUniqueColumns }) {
    const middleRows = [];
    for (let r = 1; r <= rows - 2; r++) middleRows.push(r);
    assert.equal(monsters.length, middleRows.length, '怪物数量应等于中间行数');

    const seenRow = new Set();
    const seenCol = new Set();
    for (const monster of monsters) {
        assert.ok(Number.isInteger(monster.r) && Number.isInteger(monster.c), '怪物坐标必须为整数');
        assert.ok(monster.r >= 1 && monster.r <= rows - 2, `怪物行必须在中间行: ${monster.r}`);
        assert.ok(monster.c >= 0 && monster.c < cols, `怪物列越界: ${monster.c}`);
        assert.equal(seenRow.has(monster.r), false, `每行应恰好 1 个怪物，重复行: ${monster.r}`);
        seenRow.add(monster.r);
        if (enforceUniqueColumns) {
            assert.equal(seenCol.has(monster.c), false, `列应唯一（本用例要求），重复列: ${monster.c}`);
            seenCol.add(monster.c);
        }
    }
}

test('tryBuildAdventureCheatMonsterLayout：可行时强制 forcedMonster 成为怪物（唯一列）', () => {
    const rows = 8;
    const cols = 10;
    const confirmedSafeCellKeys = new Set(['1,0', '2,1', '3,2', '4,3']);
    const forcedMonster = { r: 3, c: 7 };
    const monsters = tryBuildAdventureCheatMonsterLayout({
        rows,
        cols,
        revealedMonsters: [],
        confirmedSafeCellKeys,
        forcedMonster,
        enforceUniqueColumns: true,
    });
    assert.ok(monsters, '应返回可行布局');
    assertAdventureMonsterLayoutValid(monsters, rows, cols, { enforceUniqueColumns: true });
    assert.ok(monsters.some((m) => m.r === forcedMonster.r && m.c === forcedMonster.c), '必须包含 forcedMonster');
    for (const key of confirmedSafeCellKeys) {
        assert.equal(monsters.some((m) => `${m.r},${m.c}` === key), false, `不应放在已确认安全格: ${key}`);
    }
});

test('tryBuildAdventureCheatMonsterLayout：forcedMonster 在安全格时返回 null', () => {
    const rows = 6;
    const cols = 6;
    const confirmedSafeCellKeys = new Set(['2,3']);
    const monsters = tryBuildAdventureCheatMonsterLayout({
        rows,
        cols,
        revealedMonsters: [],
        confirmedSafeCellKeys,
        forcedMonster: { r: 2, c: 3 },
        enforceUniqueColumns: true,
    });
    assert.equal(monsters, null);
});

test('tryBuildAdventureCheatMonsterLayout：forcedMonster 与已揭示怪物冲突时返回 null', () => {
    const rows = 8;
    const cols = 8;
    const monsters = tryBuildAdventureCheatMonsterLayout({
        rows,
        cols,
        revealedMonsters: [{ r: 3, c: 1 }],
        confirmedSafeCellKeys: new Set(),
        forcedMonster: { r: 3, c: 2 },
        enforceUniqueColumns: true,
    });
    assert.equal(monsters, null);
});

test('tryBuildAdventureCheatMonsterLayout：列数不足时降级允许重复列（仍强制踩雷）', () => {
    const rows = 10;
    const cols = 3; // 中间行=8，无法做到“列唯一”
    const forcedMonster = { r: 4, c: 2 };
    const monsters = tryBuildAdventureCheatMonsterLayout({
        rows,
        cols,
        revealedMonsters: [{ r: 2, c: 1 }],
        confirmedSafeCellKeys: new Set(['5,0', '6,0', '7,0']),
        forcedMonster,
        enforceUniqueColumns: false,
    });
    assert.ok(monsters, '应返回可行布局（允许重复列）');
    assertAdventureMonsterLayoutValid(monsters, rows, cols, { enforceUniqueColumns: false });
    assert.ok(monsters.some((m) => m.r === forcedMonster.r && m.c === forcedMonster.c), '必须包含 forcedMonster');
});
