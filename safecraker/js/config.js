// codex: 2026-06-02 增加3D厚度属性，优化同心圆环层叠的立体效果
// Safe Cracker 50 - config.js

/**
 * 16个扇区的数量
 */
const SECTOR_COUNT = 16;

/**
 * 目标和值：每条直径上所有可见数字之和应等于此值
 */
const TARGET_SUM = 50;

/**
 * 环形半径配置（从外到内）
 * 每个环占据 innerR ~ outerR 的环形区域
 */
const RING_RADII = {
    ring5: { inner: 200, outer: 240 },  // 最外圈 (5down)
    ring4: { inner: 155, outer: 200 },  // 第四圈 (4down / 4up)
    ring3: { inner: 110, outer: 155 },  // 第三圈 (3down / 3up)
    ring2: { inner: 65, outer: 110 },   // 第二圈 (2down / 2up)
    ring1: { inner: 30, outer: 65 },    // 第一圈 (1down / 1up)
    center: { radius: 30 }             // 中心圆
};

/**
 * SVG 画布尺寸
 */
const SVG_SIZE = 560;
const SVG_VIEWBOX = `-280 -280 ${SVG_SIZE} ${SVG_SIZE}`;

/**
 * 环形数据 - 来自 safe.csv
 * null 表示该位置上层没有覆盖（镂空），显示下层数字
 *
 * 行编号对应 CSV:
 * 5down  = 最外圈（固定不动，作为基座的一部分）
 * 4down  = 第四圈底层（与 5down 绑定）
 * 4up    = 第四圈上层（交替有值，与 3down 绑定）
 * 3down  = 第三圈底层（与 4up 绑定）
 * 3up    = 第三圈上层（交替有值，与 2down 绑定）
 * 2down  = 第二圈底层（与 3up 绑定）
 * 2up    = 第二圈上层（交替有值，与 1down 绑定）
 * 1down  = 第一圈底层（与 2up 绑定）
 * 1up    = 第一圈上层（交替有值，独立层）
 */
const RING_DATA = {
    // 最外圈 - 始终可见
    down5: [1, 10, 7, 15, 4, 8, 16, 0, 7, 4, 16, 15, 3, 5, 4, 10],

    // 第四圈底层（与 5down 绑定，即积木A）
    down4: [10, 10, 10, 18, 10, 13, 11, 13, 27, 9, 2, 18, 19, 7, 15, 10],
    // 第四圈上层（与 3down 绑定，即积木B），偶数位有值
    up4: [6, null, 9, null, 8, null, 8, null, 9, null, 10, null, 8, null, 10, null],

    // 第三圈底层（与 4up 绑定，即积木B）
    down3: [5, 8, 5, 0, 22, 12, 10, 1, 12, 20, 7, 20, 10, 8, 24, 1],
    // 第三圈上层（与 2down 绑定，即积木C），偶数位有值
    up3: [11, null, 10, null, 8, null, 8, null, 8, null, 11, null, 0, null, 10, null],

    // 第二圈底层（与 3up 绑定，即积木C）
    down2: [19, 22, 0, 13, 13, 20, 12, 20, 15, 10, 19, 8, 20, 5, 0, 10],
    // 第二圈上层（与 1down 绑定，即积木D），偶数位有值
    up2: [12, null, 8, null, 11, null, 14, null, 10, null, 8, null, 3, null, 11, null],

    // 第一圈底层（与 2up 绑定，即积木D）
    down1: [4, 14, 4, 20, 4, 17, 8, 18, 6, 5, 10, 17, 10, 14, 1, 5],
    // 第一圈上层（独立，即积木E），偶数位有值
    up1: [19, null, 16, null, 8, null, 8, null, 6, null, 6, null, 17, null, 8, null]
};

/**
 * 积木定义 - 每个积木是一组绑定的层，旋转时同步转动
 * 颜色呈白枫色和浅褐色交替（双色无渐变，确保字迹高度清晰）
 *
 * 积木A: 5down + 4down  （基座，固定，白枫木）
 * 积木B: 4up + 3down    （环B，可转，浅褐木）
 * 积木C: 3up + 2down    （环C，可转，白枫木）
 * 积木D: 2up + 1down    （环D，可转，浅褐木）
 * 积木E: 1up            （环E，可转，白枫木）
 */
const BLOCK_DEFINITIONS = [
    {
        id: 'blockA',
        name: '基座 (固定)',
        layers: ['down5', 'down4'],
        rotatable: false,
        color: { base: '#FAF6EE', light: '#FFFFFF', dark: '#F3EBE0', stroke: '#E0D5C3', thickness: '#C5B59E' }
    },
    {
        id: 'blockB',
        name: '环 B',
        layers: ['up4', 'down3'],
        rotatable: true,
        color: { base: '#B28362', light: '#C19777', dark: '#9C6F4F', stroke: '#7F5639' }
    },
    {
        id: 'blockC',
        name: '环 C',
        layers: ['up3', 'down2'],
        rotatable: true,
        color: { base: '#FAF6EE', light: '#FFFFFF', dark: '#F3EBE0', stroke: '#E0D5C3' }
    },
    {
        id: 'blockD',
        name: '环 D',
        layers: ['up2', 'down1'],
        rotatable: true,
        color: { base: '#B28362', light: '#C19777', dark: '#9C6F4F', stroke: '#7F5639' }
    },
    {
        id: 'blockE',
        name: '环 E',
        layers: ['up1'],
        rotatable: true,
        color: { base: '#FAF6EE', light: '#FFFFFF', dark: '#F3EBE0', stroke: '#E0D5C3' }
    }
];

/**
 * 层到环编号的映射 - 确定每层数据应渲染在哪个环的半径范围
 */
const LAYER_TO_RING = {
    down5: 'ring5',
    down4: 'ring4',
    up4: 'ring4',
    down3: 'ring3',
    up3: 'ring3',
    down2: 'ring2',
    up2: 'ring2',
    down1: 'ring1',
    up1: 'ring1'
};

/**
 * 动画配置
 */
const ANIMATION_CONFIG = {
    rotateDuration: 300,      // 旋转动画持续时间(ms)
    snapThreshold: 11.25,     // 拖拽吸附阈值(度) = 360/16/2
    dragSensitivity: 1.0      // 拖拽灵敏度
};

// 导出（兼容非模块化环境）
if (typeof window !== 'undefined') {
    window.GameConfig = {
        SECTOR_COUNT,
        TARGET_SUM,
        RING_RADII,
        SVG_SIZE,
        SVG_VIEWBOX,
        RING_DATA,
        BLOCK_DEFINITIONS,
        LAYER_TO_RING,
        ANIMATION_CONFIG
    };
}
