/**
 * 计算模块 - 负责处理与面积计算相关的数学逻辑
 */

class PizzaCalculator {
    constructor(radius = 1) {
        this.radius = radius; // 披萨半径，默认为1个单位
        this.exactArea = Math.PI * Math.pow(this.radius, 2); // 精确的圆面积
    }
    
    /**
     * 更新披萨半径
     * @param {number} newRadius - 新的半径值
     */
    setRadius(newRadius) {
        this.radius = newRadius;
        this.exactArea = Math.PI * Math.pow(this.radius, 2); // 更新精确的圆面积
    }

    /**
     * 计算n个切片时的近似面积
     * @param {number} slices - 切片数量
     * @returns {number} - 近似面积
     */
    calculateApproximateArea(slices) {
        if (slices < 3) return 0; // 至少需要3个切片

        // 使用正多边形近似圆的面积
        // 每个切片是一个三角形，面积为 (r² * sin(2π/n) / 2)
        const anglePerSlice = (2 * Math.PI) / slices;
        const triangleArea = (Math.pow(this.radius, 2) * Math.sin(anglePerSlice)) / 2;
        const approximateArea = slices * triangleArea;

        return approximateArea;
    }

    /**
     * 计算近似值与精确值之间的误差
     * @param {number} approximateArea - 近似面积
     * @returns {number} - 误差百分比
     */
    calculateError(approximateArea) {
        const absoluteError = Math.abs(this.exactArea - approximateArea);
        const relativeError = (absoluteError / this.exactArea) * 100;
        return relativeError;
    }

    /**
     * 获取精确的圆面积
     * @returns {number} - 精确面积
     */
    getExactArea() {
        return this.exactArea;
    }

    /**
     * 计算给定切片数的所有数据
     * @param {number} slices - 切片数量
     * @returns {Object} - 包含近似面积、精确面积和误差的对象
     */
    calculateAll(slices) {
        const approximateArea = this.calculateApproximateArea(slices);
        const exactArea = this.exactArea;
        const error = this.calculateError(approximateArea);

        return {
            approximateArea: approximateArea.toFixed(6),
            exactArea: exactArea.toFixed(6),
            error: error.toFixed(4)
        };
    }
}

// 导出计算器类，使其可以被其他模块使用
window.PizzaCalculator = PizzaCalculator;