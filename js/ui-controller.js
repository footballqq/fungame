/**
 * 用户界面控制模块 - 负责处理用户交互和界面更新
 */

class PizzaUIController {
    constructor(calculatorInstance, visualizerInstance) {
        // 存储计算器和可视化器实例
        this.calculator = calculatorInstance;
        this.visualizer = visualizerInstance;
        
        // 获取DOM元素
        this.sliceSlider = document.getElementById('sliceSlider');
        this.sliceCountDisplay = document.getElementById('sliceCount');
        this.radiusSlider = document.getElementById('radiusSlider');
        this.radiusValueDisplay = document.getElementById('radiusValue');
        this.animateBtn = document.getElementById('animateBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.explainBtn = document.getElementById('explainBtn');
        
        // 结果显示元素
        this.approxAreaDisplay = document.getElementById('approxArea');
        this.exactAreaDisplay = document.getElementById('exactArea');
        this.errorDisplay = document.getElementById('errorValue');
        
        // 解释内容元素
        this.explanationElement = document.getElementById('explanation');
        
        // 初始化事件监听器
        this.initEventListeners();
        
        // 初始状态
        this.currentSlices = parseInt(this.sliceSlider.value);
        this.updateUI();
    }
    
    /**
     * 初始化所有事件监听器
     */
    initEventListeners() {
        // 切片数量滑块变化事件
        this.sliceSlider.addEventListener('input', () => {
            this.currentSlices = parseInt(this.sliceSlider.value);
            this.sliceCountDisplay.textContent = this.currentSlices;
            this.updateUI();
        });
        
        // 半径滑块变化事件
        this.radiusSlider.addEventListener('input', () => {
            const newRadius = parseInt(this.radiusSlider.value);
            this.radiusValueDisplay.textContent = newRadius;
            this.visualizer.setRadius(newRadius);
            // 同时更新计算器的半径值
            this.calculator.setRadius(newRadius / 150); // 将像素半径转换为单位半径（150px对应单位半径1）
            this.updateUI();
        });
        
        // 动画按钮点击事件
        this.animateBtn.addEventListener('click', () => {
            this.animateBtn.disabled = true;
            this.sliceSlider.disabled = true;
            
            // 执行动画
            this.visualizer.animateSlicing(this.currentSlices, () => {
                // 动画完成后更新UI并启用控件
                this.updateUI();
                this.animateBtn.disabled = false;
                this.sliceSlider.disabled = false;
            });
        });
        
        // 重置按钮点击事件
        this.resetBtn.addEventListener('click', () => {
            // 保持当前半径设置
            const currentRadius = parseInt(this.radiusSlider.value);
            this.visualizer.setRadius(currentRadius);
            this.visualizer.drawFullPizza();
            this.updateExplanation(0);
        });
        
        // 三角形近似法按钮点击事件
        this.explainBtn.addEventListener('click', () => {
            this.visualizer.drawApproximationExplanation(this.currentSlices);
        });
    }
    
    /**
     * 更新整个用户界面
     */
    updateUI() {
        // 更新可视化
        this.visualizer.drawSlicedPizza(this.currentSlices);
        
        // 计算并更新数值
        const results = this.calculator.calculateAll(this.currentSlices);
        this.approxAreaDisplay.textContent = results.approximateArea;
        this.exactAreaDisplay.textContent = results.exactArea;
        this.errorDisplay.textContent = results.error + '%';
        
        // 更新解释文本
        this.updateExplanation(results.error);
    }
    
    /**
     * 根据误差更新解释文本
     * @param {number} error - 计算误差
     */
    updateExplanation(error) {
        let explanationHTML = '';
        
        if (error === 0) {
            // 初始状态或重置状态
            explanationHTML = `
                <p>这个演示展示了割圆术的基本原理，这是微积分中积分概念的前身。</p>
                <p>通过增加切片数量，我们可以看到近似值如何越来越接近圆的实际面积。</p>
                <p>当切片数趋于无穷大时，近似值与实际值的差异趋于零，这正是极限的概念。</p>
            `;
        } else if (error > 10) {
            // 误差较大
            explanationHTML = `
                <p>当我们只用${this.currentSlices}个切片时，近似值与实际值相差较大。</p>
                <p>每个切片是一个三角形，其面积为 r² × sin(2π/${this.currentSlices}) / 2。</p>
                <p>尝试增加切片数量，观察误差如何减小！</p>
            `;
        } else if (error > 1) {
            // 中等误差
            explanationHTML = `
                <p>使用${this.currentSlices}个切片，我们的近似已经相当不错了！</p>
                <p>这说明了微积分的核心思想：通过将复杂图形分割成更小的、易于计算的部分，然后求和。</p>
                <p>继续增加切片数量，看看能否进一步减小误差。</p>
            `;
        } else {
            // 误差很小
            explanationHTML = `
                <p>太棒了！使用${this.currentSlices}个切片，我们的近似非常接近实际值。</p>
                <p>这展示了微积分中的极限概念：当分割数量趋于无穷大时，近似值趋近于精确值。</p>
                <p>这正是积分的基本思想，通过无限分割和求和来计算复杂图形的面积。</p>
            `;
        }
        
        this.explanationElement.innerHTML = explanationHTML;
    }
}

// 导出UI控制器类，使其可以被其他模块使用
window.PizzaUIController = PizzaUIController;