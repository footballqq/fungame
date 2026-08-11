// codex: 2026-08-10 在无浏览器环境中执行配对演示的首次 SVG 渲染。
const fs = require('fs');
const vm = require('vm');

const root = process.cwd();
const nodes = new Map();
const treeFocusButtons = ['treeOne', 'treeTwo', 'both'].map(treeFocus => ({
    ...makeNode(),
    dataset: { treeFocus }
}));
function makeNode() {
    return {
    children: [],
        attributes: {},
        listeners: {},
        style: {},
        innerHTML: '',
        textContent: '',
        setAttribute(name, value) { this.attributes[name] = String(value); },
        appendChild(child) { this.children.push(child); return child; },
        addEventListener(name, listener) { this.listeners[name] = listener; }
    };
}
const document = {
    createElementNS() { return makeNode(); },
    getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, makeNode());
        return nodes.get(id);
    },
    querySelectorAll(selector) { return selector === '[data-tree-focus]' ? treeFocusButtons : []; }
};
const context = vm.createContext({ console, document, Set, Map, Object, Number, Math });
const page = fs.readFileSync(`${root}\\pairing_demo.html`, 'utf8');
const inlineScript = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];

if (!inlineScript) throw new Error('未找到配对演示内联脚本');
vm.runInContext(fs.readFileSync(`${root}\\js\\game.js`, 'utf8'), context);
vm.runInContext(fs.readFileSync(`${root}\\js\\lehman.js`, 'utf8'), context);
vm.runInContext(inlineScript, context);

if (nodes.get('demoSvg')?.children.length === 0) {
    throw new Error('首次渲染没有生成 SVG 节点');
}
if (!nodes.get('treeProof')?.innerHTML.includes('树甲 T1：S → T ✓ 连通')
    || !nodes.get('treeProof')?.innerHTML.includes('树乙 T2：S → T ✓ 连通')) {
    throw new Error('首次渲染未证实两棵树均 S-T 连通');
}
treeFocusButtons[0].listeners.click();
const focusedClasses = nodes.get('demoSvg').children.map(node => node.attributes.class || '');
if (!focusedClasses.some(className => className.includes('focused-tree'))
    || !focusedClasses.some(className => className.includes('muted-tree'))
    || !focusedClasses.some(className => className.includes('shared-overlay'))) {
    throw new Error('选择树甲后没有高亮目标树并淡化另一棵树');
}
nodes.get('nextBtn').listeners.click();
nodes.get('nextBtn').listeners.click();
const selectedRedLine = nodes.get('demoSvg').children.find(node => node.attributes['data-edge-id'] !== 'rh_0_0' && node.listeners.click);
if (!selectedRedLine?.listeners.click) throw new Error('未找到可选的非默认红色切割边');
selectedRedLine.listeners.click();
if (!nodes.get('cutChoice').textContent.includes('本轮讲解沿用你选择的切割')
    || nodes.get('cutChoice').textContent.includes('正在使用示例')) {
    throw new Error('页面没有保留玩家选择的非默认切割边');
}
nodes.get('nextBtn').listeners.click();
nodes.get('nextBtn').listeners.click();
if (!nodes.get('dynamicStatus').innerHTML.includes('为什么选绿色边')
    || /(?:rh_|bv_|bh_)/.test(nodes.get('dynamicStatus').innerHTML)) {
    throw new Error('跨割边讲解没有使用可读的棋盘位置描述');
}
nodes.get('nextBtn').listeners.click();
nodes.get('nextBtn').listeners.click();
if (!nodes.get('dynamicStatus').innerHTML.includes('下一轮为何仍可应对')) {
    throw new Error('修复推演没有说明下一轮不变量');
}
console.log(`pairing demo smoke passed: ${nodes.get('demoSvg').children.length} SVG nodes`);
