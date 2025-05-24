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

    // 向下平移 triangle1Container
    if (triangle1Container) {
        const downwardShiftAmount = '920px'; // 您可以根据需要调整这个值
        triangle1Container.style.position = 'relative'; // 确保可以相对定位
        triangle1Container.style.top = downwardShiftAmount;
    }

    let initialDelayTimeout = null; // 用于存储初始延迟超时ID
    let mergeDelayTimeout = null; // 用于存储合并延迟超时ID

    /**
     * 创建柱状图元素
     * @param {number} value - 柱子代表的数值 (决定高度)
     * @param {number} maxValue - 数列中的最大值 (用于计算相对高度)
     * @param {string} color - 柱子的背景颜色
     * @param {number} index - 柱子的水平位置索引
     * @param {string} position - 位置标识：'top', 'bottom' 或 'center'
     * @returns {HTMLElement} - 创建好的柱子元素
     */
    function createBar(value, maxValue, color, index, position = 'center') {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        
        // 根据数值和最大值计算相对高度
        const maxHeight = 800; // 最大高度（像素）
        const minHeight = 40; // 最小高度（像素）
        const height = Math.max(minHeight, (value / maxValue) * maxHeight);
        
        // 设置基本样式
        bar.style.height = `${height}px`;
        bar.style.backgroundColor = color;
        bar.textContent = value;
        
        // 设置水平位置
        const barWidth = 30;
        const gap = 2;
        const leftOffset = index * (barWidth + gap);
        bar.style.left = `${leftOffset}px`;
        
        // 设置垂直位置偏移
        const offset = 20; // 垂直偏移量（像素）
        switch(position) {
            case 'top':
                bar.style.top = '0';
                bar.style.transform = `translateY(${offset}px)`;
                break;
            case 'bottom':
                bar.style.bottom = '0';
                bar.style.transform = `translateY(-${offset}px)`;
                break;
            default:
                bar.style.top = '50%';
                bar.style.transform = 'translateY(-50%)';
        }
        
        return bar;
    }

    /**
     * 清除可视化区域的内容
     */    
    function clearVisualization() {
        // 清除所有容器的内容
        triangle1Container.innerHTML = '';
        triangle2Container.innerHTML = '';
        rectangleContainer.innerHTML = '';
        sumResultDisplay.textContent = '';
        
        // 移除动画状态类
        visualizationContainer.classList.remove('preparing-merge', 'merging');
        
        // 清除定时器
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
        const maxValue = n;
        const sum = n * (1 + n) / 2;

        // 创建第一个三角形（绿色，从大到小）
        series.slice().reverse().forEach((value, index) => {
            const bar = createBar(value, maxValue, '#4CAF50', index, 'bottom');
            triangle1Container.appendChild(bar);
        });

        // 创建第二个三角形（橙色，从小到大）
        series.forEach((value, index) => {
            const bar = createBar(value, maxValue, '#FF9800', index, 'top');
            triangle2Container.appendChild(bar);
        });

        // 创建矩形 (合并后的结果，高度为 n+1)
        const rectangleValue = n + 1;
        const rectangleMaxValue = n + 1; // 矩形的高度基于 n+1
        series.forEach((_, index) => {
            const bar = createBar(rectangleValue, rectangleMaxValue, '#2196F3', index, 'center');
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
            }, 3000); // 在移动后停留3秒再合并

        }, 500); // 延迟2秒开始移动
    }

    // --- 事件监听器 ---
    visualizeBtn.addEventListener('click', visualizeSummation);
    resetBtn.addEventListener('click', clearVisualization);
});