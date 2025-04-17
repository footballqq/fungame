/**
 * 主程序入口 - 初始化并连接所有模块
 */

document.addEventListener('DOMContentLoaded', () => {
    // 创建计算器实例（使用单位半径1，方便计算）
    const initialRadius = 150;
    const calculator = new PizzaCalculator(1); // 单位半径为1
    
    // 创建可视化器实例（使用像素半径150，适合画布大小）
    //const initialRadius = 150;
    const visualizer = new PizzaVisualizer('pizzaCanvas', initialRadius);
    
    // 设置半径滑块的初始值
    document.getElementById('radiusValue').textContent = initialRadius;
    
    // 创建UI控制器实例，并传入计算器和可视化器
    const uiController = new PizzaUIController(calculator, visualizer);
    
    // 初始化显示
    visualizer.drawFullPizza();
    
    // 显示初始计算结果
    const initialSlices = parseInt(document.getElementById('sliceSlider').value);
    const initialResults = calculator.calculateAll(initialSlices);
    document.getElementById('approxArea').textContent = initialResults.approximateArea;
    document.getElementById('exactArea').textContent = initialResults.exactArea;
    document.getElementById('errorValue').textContent = initialResults.error + '%';
    
    // 添加窗口大小变化的响应
    window.addEventListener('resize', () => {
        // 重新绘制当前状态
        const currentSlices = parseInt(document.getElementById('sliceSlider').value);
        visualizer.drawSlicedPizza(currentSlices);
    });
    
    console.log('微积分披萨演示已初始化');
});