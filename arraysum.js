/**
 * 等差数列求和可视化脚本
 */
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const nTermsInput = document.getElementById('nTerms');
    const visualizeBtn = document.getElementById('visualizeBtn');
    const resetBtn = document.getElementById('resetBtn');
    const triangle1Container = document.getElementById('triangle1');
    const triangle2Container = document.getElementById('triangle2');
    const rectangleContainer = document.getElementById('rectangle');
    const visualizationContainer = document.querySelector('.visualization-container');
    const sumResultDisplay = document.getElementById('sumResult');

    let animationTimeout = null; // 用于存储动画超时ID

    /**
     * 创建柱状图元素
     * @param {number} value - 柱子代表的数值 (决定高度)
     * @param {number} maxValue - 数列中的最大值 (用于计算相对高度)
     * @param {string} color - 柱子的背景颜色
     * @returns {HTMLElement} - 创建好的柱子元素
     */
    function createBar(value, maxValue, color) {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        // 根据数值和最大值计算相对高度，设定一个基础高度和比例因子
        const maxHeight = 200; // 设定最大高度（像素）
        const minHeight = 10; // 设定最小高度
        const height = Math.max(minHeight, (value / maxValue) * maxHeight);
        bar.style.height = `${height}px`;
        bar.style.backgroundColor = color;
        bar.textContent = value; // 在柱子上显示数值
        return bar;
    }

    /**
     * 清除可视化区域的内容
     */
    function clearVisualization() {
        triangle1Container.innerHTML = '';
        triangle2Container.innerHTML = '';
        rectangleContainer.innerHTML = '';
        sumResultDisplay.textContent = '';
        visualizationContainer.classList.remove('merging');
        // 清除可能存在的动画超时
        if (animationTimeout) {
            clearTimeout(animationTimeout);
            animationTimeout = null;
        }
    }

    /**
     * 执行可视化演示
     */
    function visualizeSummation() {
        clearVisualization();

        const n = parseInt(nTermsInput.value);
        if (isNaN(n) || n < 2) {
            alert('请输入有效的项数 (n >= 2)');
            return;
        }

        // 生成等差数列 (1, 2, ..., n)
        const series = Array.from({ length: n }, (_, i) => i + 1);
        const maxValue = n; // 最大值就是n
        const sum = n * (1 + n) / 2; // 计算总和

        // 创建第一个三角形 (正序)
        series.forEach(value => {
            const bar = createBar(value, maxValue, '#4CAF50'); // 绿色
            triangle1Container.appendChild(bar);
        });

        // 创建第二个三角形 (逆序)
        series.slice().reverse().forEach(value => {
            const bar = createBar(value, maxValue, '#FF9800'); // 橙色
            triangle2Container.appendChild(bar);
        });

        // 创建矩形 (合并后的结果，高度为 n+1)
        const rectangleValue = 1 + n;
        series.forEach(() => {
            const bar = createBar(rectangleValue, maxValue + 1, '#2196F3'); // 蓝色，高度基于 n+1
            // 调整矩形柱子的高度计算基准
            const maxHeight = 200; 
            const minHeight = 10;
            const height = Math.max(minHeight, (rectangleValue / (maxValue + 1)) * maxHeight);
            bar.style.height = `${height}px`;
            bar.textContent = `${rectangleValue}`;
            rectangleContainer.appendChild(bar);
        });

        // 延迟触发合并动画
        animationTimeout = setTimeout(() => {
            visualizationContainer.classList.add('merging');
            // 显示求和结果
            sumResultDisplay.textContent = `数列的和 S = ${sum}`;
        }, 1000); // 延迟1秒开始合并
    }

    // --- 事件监听器 ---
    visualizeBtn.addEventListener('click', visualizeSummation);
    resetBtn.addEventListener('click', clearVisualization);

    // 初始调用一次以显示默认值 (可选)
    // visualizeSummation(); 
});