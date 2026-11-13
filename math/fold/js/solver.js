// codex: 2026-11-13 4x4折纸求解器与9重厚度最优步骤库

/**
 * 9 种理论厚度的最优折叠步序预设
 * 每个折叠动作包含:
 * - axis: 'v' (竖向) 或 'h' (横向)
 * - line: 折线在当前包围盒中的坐标 (1..dim-1)
 * - direction: 'L->R' | 'R->L' | 'T->B' | 'B->T'
 * - desc: 动效与提示说明
 */
const FOLD_SOLUTIONS = {
    1: {
        thickness: 1,
        title: "原始摊平 (1 层)",
        difficulty: "基础",
        explanation: "未经任何折叠，16 个小方格在平面上铺开，每个位置只有 1 层纸，厚度为 1。",
        steps: []
    },
    2: {
        thickness: 2,
        title: "单次边沿对折 (2 层)",
        difficulty: "初级",
        explanation: "沿最左侧竖线折叠一列，原第 1 列翻到第 2 列表面，重叠处出现 2 层纸，厚度为 2。",
        steps: [
            { axis: 'v', line: 1, direction: 'L->R', desc: '沿左侧竖线 x=1 向右翻折 1 列' }
        ]
    },
    3: {
        thickness: 3,
        title: "双向连续包折 (3 层)",
        difficulty: "中级",
        explanation: "连续沿竖线向右折叠两次，前两列分别叠在后续格子上，形成 3 层纸的重叠，厚度为 3。",
        steps: [
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 1 步：沿竖线 x=1 向右翻折' },
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 2 步：再次沿竖线 x=1 向右翻折' }
        ]
    },
    4: {
        thickness: 4,
        title: "十字双向单折 (4 层)",
        difficulty: "中级",
        explanation: "水平折 1 次（2层）且垂直折 1 次（2层），交叉区域层数相乘 2×2 = 4，厚度为 4。",
        steps: [
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 1 步：沿竖线 x=1 向右翻折 (产生2层)' },
            { axis: 'h', line: 1, direction: 'T->B', desc: '第 2 步：沿横线 y=1 向下翻折 (2×2=4层)' }
        ]
    },
    6: {
        thickness: 6,
        title: "三折交织 (6 层)",
        difficulty: "高级",
        explanation: "横向进行 3 层包折，纵向进行 2 层对折，交点最大层数达到 3×2 = 6 层。",
        steps: [
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 1 步：沿竖线 x=1 向右翻折' },
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 2 步：再次沿竖线 x=1 向右翻折 (形成3层条)' },
            { axis: 'h', line: 1, direction: 'T->B', desc: '第 3 步：沿横线 y=1 向下翻折 (3×2=6层)' }
        ]
    },
    8: {
        thickness: 8,
        title: "八层厚叠 (8 层)",
        difficulty: "高级",
        explanation: "纵向单折（2层），横向完全折叠为 4 层（4×2 = 8层），形成厚实的 8 层纸垫！",
        steps: [
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 1 步：沿竖线 x=1 向右翻折 (2层)' },
            { axis: 'h', line: 2, direction: 'T->B', desc: '第 2 步：沿横线中间 y=2 向下对折' },
            { axis: 'h', line: 1, direction: 'T->B', desc: '第 3 步：沿横线 y=1 再次向下翻折 (2×4=8层)' }
        ]
    },
    9: {
        thickness: 9,
        title: "九重九鼎 (9 层)",
        difficulty: "极难",
        explanation: "横向折成 3 层，纵向也折成 3 层，重叠核心区域层数达到 3×3 = 9 层！",
        steps: [
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 1 步：沿竖线 x=1 向右翻折' },
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 2 步：沿竖线 x=1 再次向右翻折 (竖向3层)' },
            { axis: 'h', line: 1, direction: 'T->B', desc: '第 3 步：沿横线 y=1 向下翻折' },
            { axis: 'h', line: 1, direction: 'T->B', desc: '第 4 步：沿横线 y=1 再次向下翻折 (3×3=9层)' }
        ]
    },
    12: {
        thickness: 12,
        title: "十二重天 (12 层)",
        difficulty: "极难",
        explanation: "横向折出 3 层，纵向折出 4 层，交叠处达到 3×4 = 12 层！",
        steps: [
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 1 步：沿竖线 x=1 向右翻折' },
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 2 步：沿竖线 x=1 再次向右翻折 (竖向3层)' },
            { axis: 'h', line: 2, direction: 'T->B', desc: '第 3 步：沿横向中线 y=2 向下对折' },
            { axis: 'h', line: 1, direction: 'T->B', desc: '第 4 步：沿横线 y=1 再次向下翻折 (3×4=12层)' }
        ]
    },
    16: {
        thickness: 16,
        title: "终极 16 层单方块 (16 层)",
        difficulty: "宗师",
        explanation: "完全折叠成 1×1 的单独小方块，16 个小正方形全部精准叠合在同一格，达到理论绝对极值 16 层！",
        steps: [
            { axis: 'v', line: 2, direction: 'L->R', desc: '第 1 步：沿竖向中线 x=2 向右对折' },
            { axis: 'v', line: 1, direction: 'L->R', desc: '第 2 步：沿竖向中线 x=1 再次向右翻折 (变成1列)' },
            { axis: 'h', line: 2, direction: 'T->B', desc: '第 3 步：沿横向中线 y=2 向下对折' },
            { axis: 'h', line: 1, direction: 'T->B', desc: '第 4 步：沿横线 y=1 再次向下对折 (彻底合拢为16层方块)' }
        ]
    }
};

const ALL_TARGETS = [1, 2, 3, 4, 6, 8, 9, 12, 16];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FOLD_SOLUTIONS, ALL_TARGETS };
} else {
    window.FOLD_SOLUTIONS = FOLD_SOLUTIONS;
    window.ALL_TARGETS = ALL_TARGETS;
}
