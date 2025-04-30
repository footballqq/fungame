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

    let initialDelayTimeout = null; // 用于存储初始延迟超时ID
    let mergeDelayTimeout = null; // 用于存储合并延迟超时ID

    /**
     * 创建柱状图元素
     * @param {number} value - 柱子代表的数值 (决定高度)
     * @param {number} maxValue - 数列中的最大值 (用于计算相对高度)
     * @param {string} color - 柱子的背景颜色
     * @param {number} [offsetY=0] - 可选的垂直偏移量 (像素)
     * @returns {HTMLElement} - 创建好的柱子元素
     */
    function createBar(value, maxValue, color, offsetY = 0) {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        // 根据数值和最大值计算相对高度，设定一个基础高度和比例因子
        const maxHeight = 800; // 设定最大高度（像素） - 放大4倍
        const minHeight = 40; // 设定最小高度 - 相应放大
        const height = Math.max(minHeight, (value / maxValue) * maxHeight);
        bar.style.height = `${height}px`;
        bar.style.backgroundColor = color;
        bar.textContent = value; // 在柱子上显示数值
        if (offsetY !== 0) {
            bar.style.transform = `translateY(${offsetY}px)`;
        }
        return bar;
    }

    /**
     * 清除可视化区域的内容
     */
    function clearVisualization() {
        triangle1Container.innerHTML = '';
        triangle1Container.innerHTML = '';
        triangle2Container.innerHTML = '';
        rectangleContainer.innerHTML = '';
        sumResultDisplay.textContent = '';
        visualizationContainer.classList.remove('preparing-merge', 'merging'); // 移除所有动画状态类
        // 清除可能存在的动画超时
        if (initialDelayTimeout) {
            clearTimeout(initialDelayTimeout);
            initialDelayTimeout = null;
        }
        if (mergeDelayTimeout) {
            clearTimeout(mergeDelayTimeout);
            mergeDelayTimeout = null;
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

        // 创建第一个三角形 (绿色，逆序，左长右短)
        series.slice().reverse().forEach(value => {
            const bar = createBar(value, maxValue, '#4CAF50'); // 绿色
            triangle1Container.appendChild(bar);
        });

        // 创建第二个三角形 (橙色，正序，左短右长)
        // 需要计算偏移量以实现与绿色柱子互补
        const maxHeightPixels = 800; // 与createBar中的maxHeight保持一致
        const minHeightPixels = 40; // 与createBar中的minHeight保持一致
        const totalHeightValue = n + 1; // 目标总高度值

        series.forEach((value, index) => {
            // 对应的绿色柱子的值是 series.slice().reverse()[index]
            const correspondingGreenValue = series.slice().reverse()[index];
            // 绿色柱子的高度（像素）
            const greenHeightPixels = Math.max(minHeightPixels, (correspondingGreenValue / maxValue) * maxHeightPixels);
            // 橙色柱子本身的高度（像素）
            const orangeHeightPixels = Math.max(minHeightPixels, (value / maxValue) * maxHeightPixels);
            // 目标总高度（像素）
            const targetTotalHeightPixels = Math.max(minHeightPixels, (totalHeightValue / (maxValue +1)) * maxHeightPixels); // 使用 n+1 作为新的最大值来计算总高
            // 需要的偏移量 = 目标总高度 - 绿色柱子高度 - 橙色柱子高度
            // 由于橙色柱子是底部对齐的，偏移量应该是负值（向上移动）
            // 修正：偏移量应该是让橙色柱子的顶部接触到 (总高度 - 绿色柱子高度) 的位置
            // 容器是 flex-start (顶部对齐)，依赖 CSS 实现，移除 JS 偏移计算
            // const rectangleMaxValue = n + 1; // 移除
            // const targetTotalHeightPixels = Math.max(minHeightPixels, (rectangleMaxValue / rectangleMaxValue) * maxHeightPixels); // 移除
            // const orangeHeightPixels = Math.max(minHeightPixels, (value / maxValue) * maxHeightPixels); // 移除
            // const offsetY = targetTotalHeightPixels - orangeHeightPixels; // 移除偏移计算

            const bar = createBar(value, maxValue, '#FF9800'); // 橙色，移除偏移参数
            triangle2Container.appendChild(bar);
        });

        // 创建矩形 (合并后的结果，高度为 n+1)
        const rectangleValue = n + 1;
        const rectangleMaxValue = n + 1; // 矩形的高度基于 n+1
        series.forEach(() => {
            // 使用调整后的最大值创建矩形柱子
            const bar = createBar(rectangleValue, rectangleMaxValue, '#2196F3'); // 蓝色
            bar.textContent = `${rectangleValue}`;
            // 矩形柱子默认顶部对齐（在CSS中设置），不需要额外偏移
            rectangleContainer.appendChild(bar);
        });

        // 延迟触发第一阶段动画（移动到中间）
        initialDelayTimeout = setTimeout(() => {
            visualizationContainer.classList.add('preparing-merge');

            // 再延迟触发第二阶段动画（合并为矩形）
            mergeDelayTimeout = setTimeout(() => {
                visualizationContainer.classList.add('merging');
                // 显示求和结果
                sumResultDisplay.textContent = `数列的和 S = ${sum}`;
            }, 3000); // 在移动后停留3秒再合并 (增加停留时间)

        }, 2000); // 延迟2秒开始移动 (增加延迟时间)
    }

    // --- 事件监听器 ---
    visualizeBtn.addEventListener('click', visualizeSummation);
    resetBtn.addEventListener('click', clearVisualization);

    // 初始调用一次以显示默认值 (可选)
    // visualizeSummation(); 
});