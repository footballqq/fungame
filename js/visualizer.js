/**
 * 可视化模块 - 负责绘制披萨及其切片
 */

class PizzaVisualizer {
    constructor(canvasId, radius = 150) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = radius; // 披萨半径（像素）
        
        // 颜色设置
        this.pizzaColor = '#FFD700'; // 披萨底色（金黄色）
        this.sliceColors = [
            '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9A3C',
            '#6A0572', '#AB83A1', '#F15BB5', '#00BBF9', '#00F5D4'
        ];
        this.outlineColor = '#8B4513'; // 轮廓颜色（棕色）
        
        // 初始化
        this.clear();
    }
    
    /**
     * 清除画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 绘制完整的圆形披萨
     */
    drawFullPizza() {
        this.clear();
        
        // 绘制披萨底色
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.pizzaColor;
        this.ctx.fill();
        
        // 绘制披萨轮廓
        this.ctx.strokeStyle = this.outlineColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制披萨中心点
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 3, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#333';
        this.ctx.fill();
    }
    
    /**
     * 绘制切片后的披萨
     * @param {number} slices - 切片数量
     */
    drawSlicedPizza(slices) {
        this.clear();
        
        const anglePerSlice = (2 * Math.PI) / slices;
        
        // 绘制每个切片
        for (let i = 0; i < slices; i++) {
            const startAngle = i * anglePerSlice;
            const endAngle = (i + 1) * anglePerSlice;
            
            // 绘制切片
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            
            // 填充切片颜色
            this.ctx.fillStyle = this.sliceColors[i % this.sliceColors.length];
            this.ctx.fill();
            
            // 绘制切片边界
            this.ctx.strokeStyle = this.outlineColor;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // 绘制披萨中心点
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 3, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#333';
        this.ctx.fill();
    }
    
    /**
     * 动画展示从完整披萨到切片披萨的过程
     * @param {number} slices - 最终切片数量
     * @param {function} onComplete - 动画完成后的回调函数
     */
    animateSlicing(slices, onComplete) {
        // 先绘制完整披萨
        this.drawFullPizza();
        
        let currentSlice = 0;
        const anglePerSlice = (2 * Math.PI) / slices;
        
        // 设置动画间隔，逐渐切片
        const sliceInterval = setInterval(() => {
            currentSlice++;
            
            if (currentSlice <= slices) {
                // 清除画布
                this.clear();
                
                // 绘制已切的部分
                for (let i = 0; i < currentSlice; i++) {
                    const startAngle = i * anglePerSlice;
                    const endAngle = (i + 1) * anglePerSlice;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.centerX, this.centerY);
                    this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
                    this.ctx.closePath();
                    
                    this.ctx.fillStyle = this.sliceColors[i % this.sliceColors.length];
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = this.outlineColor;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
                
                // 绘制未切的部分
                if (currentSlice < slices) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.centerX, this.centerY);
                    this.ctx.arc(this.centerX, this.centerY, this.radius, 
                                currentSlice * anglePerSlice, 2 * Math.PI);
                    this.ctx.closePath();
                    
                    this.ctx.fillStyle = this.pizzaColor;
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = this.outlineColor;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
                
                // 绘制中心点
                this.ctx.beginPath();
                this.ctx.arc(this.centerX, this.centerY, 3, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#333';
                this.ctx.fill();
            } else {
                // 动画完成，清除间隔
                clearInterval(sliceInterval);
                if (onComplete) onComplete();
            }
        }, 100); // 每100毫秒切一片
    }
    
    /**
     * 绘制三角形近似法的说明图，并显示详细的数学公式
     * @param {number} slices - 切片数量
     */
    drawApproximationExplanation(slices) {
        // 在现有披萨上添加辅助线和说明
        const anglePerSlice = (2 * Math.PI) / slices;
        
        // 清除画布并绘制基本圆形
        this.clear();
        
        // 绘制一个切片的三角形近似
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(0),
            this.centerY + this.radius * Math.sin(0)
        );
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(anglePerSlice),
            this.centerY + this.radius * Math.sin(anglePerSlice)
        );
        this.ctx.closePath();
        
        // 高亮显示这个三角形
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制圆弧部分，显示三角形与圆弧之间的差异区域
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.centerX + this.radius * Math.cos(0),
            this.centerY + this.radius * Math.sin(0)
        );
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, anglePerSlice);
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(anglePerSlice),
            this.centerY + this.radius * Math.sin(anglePerSlice)
        );
        this.ctx.closePath();
        
        // 使用不同颜色填充差异区域
        this.ctx.fillStyle = 'rgba(0, 128, 255, 0.4)';
        this.ctx.fill();
        
        // 明确绘制三角形的边缘线
        // 绘制从中心到第一个点的线
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(0),
            this.centerY + this.radius * Math.sin(0)
        );
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制从中心到第二个点的线
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(anglePerSlice),
            this.centerY + this.radius * Math.sin(anglePerSlice)
        );
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制三角形底边（弧附近的边）
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.centerX + this.radius * Math.cos(0),
            this.centerY + this.radius * Math.sin(0)
        );
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(anglePerSlice),
            this.centerY + this.radius * Math.sin(anglePerSlice)
        );
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 添加详细的数学公式说明
        this.drawMathFormulas(slices);
    }
    
    /**
     * 绘制详细的数学公式说明
     * @param {number} slices - 切片数量
     */
    drawMathFormulas(slices) {
        const anglePerSlice = (2 * Math.PI) / slices;
        const sinValue = Math.sin(anglePerSlice);
        const triangleArea = (Math.pow(this.radius, 2) * sinValue) / 2;
        const approximateArea = slices * triangleArea;
        const exactArea = Math.PI * Math.pow(this.radius, 2);
        
        // 保存当前上下文状态
        this.ctx.save();
        
        // 设置文本样式
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'left';
        
        // 计算文本位置（在画布右侧）
        const textX = this.centerX + this.radius + 20;
        let textY = this.centerY - this.radius + 20;
        const lineHeight = 20;
        
        // 绘制标题
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('数学公式详解:', textX, textY);
        textY += lineHeight + 5;
        this.ctx.font = '14px Arial';
        
        // 1. 三角形面积公式
        this.ctx.fillText('1. 三角形面积计算:', textX, textY);
        textY += lineHeight;
        this.ctx.fillText('   底 = 2 × r × sin(θ/2)', textX, textY);
        textY += lineHeight;
        this.ctx.fillText('   高 = r × cos(θ/2)', textX, textY);
        textY += lineHeight;
        this.ctx.fillText('   面积 = (1/2) × 底 × 高', textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   = (1/2) × 2r × sin(${(anglePerSlice/2).toFixed(4)}) × r × cos(${(anglePerSlice/2).toFixed(4)})`, textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   = r² × sin(${anglePerSlice.toFixed(4)}) / 2`, textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   = ${triangleArea.toFixed(4)}`, textX, textY);
        textY += lineHeight + 5;
        
        // 2. n个切片的近似面积
        this.ctx.fillText('2. n个切片的近似面积:', textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   A ≈ n × (r² × sin(2π/n) / 2)`, textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   = ${slices} × (${Math.pow(this.radius, 2)} × sin(${anglePerSlice.toFixed(4)}) / 2)`, textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   = ${slices} × ${triangleArea.toFixed(4)}`, textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   = ${approximateArea.toFixed(4)}`, textX, textY);
        textY += lineHeight + 5;
        
        // 3. 圆的精确面积
        this.ctx.fillText('3. 圆的精确面积:', textX, textY);
        textY += lineHeight;
        this.ctx.fillText('   A = πr²', textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   = π × ${Math.pow(this.radius, 2)}`, textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   = ${exactArea.toFixed(4)}`, textX, textY);
        textY += lineHeight + 5;
        
        // 4. 极限说明
        this.ctx.fillText('4. 当n→∞时:', textX, textY);
        textY += lineHeight;
        this.ctx.fillText('   lim n→∞ [n × (r² × sin(2π/n) / 2)] = πr²', textX, textY);
        textY += lineHeight;
        this.ctx.fillText(`   误差: ${((Math.abs(exactArea - approximateArea) / exactArea) * 100).toFixed(4)}%`, textX, textY);
        
        // 恢复上下文状态
        this.ctx.restore();
    }
}

// 导出可视化器类，使其可以被其他模块使用
window.PizzaVisualizer = PizzaVisualizer;