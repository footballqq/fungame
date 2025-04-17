/**
 * 可视化模块 - 负责绘制披萨及其切片
 */

class PizzaVisualizer {
    constructor(canvasId, radius = 240) {
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
     * 设置披萨半径
     * @param {number} newRadius - 新的半径值（像素）
     */
    setRadius(newRadius) {
        this.radius = newRadius;
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
        
        // 清除画布
        this.clear();
        
        // 1. 首先绘制完整圆形
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.pizzaColor;
        this.ctx.fill();
        this.ctx.strokeStyle = this.outlineColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 2. 然后绘制扇形
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, anglePerSlice);
        this.ctx.closePath();
        this.ctx.fillStyle = this.sliceColors[0];
        this.ctx.fill();
        this.ctx.strokeStyle = this.outlineColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 3. 最后绘制三角形，使用明显的颜色和粗线条
        // 绘制三角形底色
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
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        this.ctx.fill();
        
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
        this.ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
        this.ctx.fill();
        
        // 明确绘制三角形的边缘线 - 使用更粗更明显的线条
        // 绘制从中心到第一个点的线
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(0),
            this.centerY + this.radius * Math.sin(0)
        );
        this.ctx.strokeStyle = '#FF0000'; // 纯红色
        this.ctx.lineWidth = 5; // 增加线宽
        this.ctx.stroke();
        
        // 绘制从中心到第二个点的线
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(anglePerSlice),
            this.centerY + this.radius * Math.sin(anglePerSlice)
        );
        this.ctx.strokeStyle = '#FF0000'; // 纯红色
        this.ctx.lineWidth = 5; // 增加线宽
        this.ctx.stroke();
        
        // 绘制三角形底边（弧附近的边）- 使用更粗更明显的线条
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.centerX + this.radius * Math.cos(0),
            this.centerY + this.radius * Math.sin(0)
        );
        this.ctx.lineTo(
            this.centerX + this.radius * Math.cos(anglePerSlice),
            this.centerY + this.radius * Math.sin(anglePerSlice)
        );
        this.ctx.strokeStyle = '#FF0000'; // 纯红色
        this.ctx.lineWidth = 5; // 增加线宽
        this.ctx.stroke();
        
        // 绘制中心点
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fill();
        
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
        
        // 创建或更新HTML元素来显示公式，而不是在画布上绘制
        let formulaBox = document.getElementById('triangle-formula-box');
        
        // 如果元素不存在，创建一个新的
        if (!formulaBox) {
            formulaBox = document.createElement('div');
            formulaBox.id = 'triangle-formula-box';
            formulaBox.className = 'formula-overlay';
            document.querySelector('.visualization-area').appendChild(formulaBox);
            
            // 添加样式
            const style = document.createElement('style');
            style.textContent = `
                .formula-overlay {
                    position: absolute;
                    top: 200px;
                    left: 1080px;
                    width: 500px;
                    height: 1680px;
                    background-color: rgba(255, 255, 255, 0.95);
                    border: 2px solid #ff9a3c;
                    border-radius: 10px;
                    padding: 15px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    font-family: 'Arial', sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    max-height: 680px;
                    overflow-y: auto;
                    z-index: 100;
                    cursor: move;
                }
                .formula-overlay h4 {
                    color: #ff6b6b;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #f0f0f0;
                    padding-bottom: 5px;
                    padding-right: 30px; /* 为关闭按钮留出空间 */
                }
                .formula-overlay p {
                    margin-bottom: 8px;
                }
                .formula-section {
                    margin-bottom: 15px;
                }
                .close-btn {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    color: white;
                    background-color: #ff6b6b;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    z-index: 101;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 添加拖动功能
        let isDragging = false;
        let offsetX, offsetY;
        
        formulaBox.addEventListener('mousedown', function(e) {
            // 只有点击框体而不是内部元素时才允许拖动
            if (e.target === formulaBox) {
                isDragging = true;
                offsetX = e.clientX - formulaBox.getBoundingClientRect().left;
                offsetY = e.clientY - formulaBox.getBoundingClientRect().top;
            }
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                formulaBox.style.left = (e.clientX - offsetX) + 'px';
                formulaBox.style.top = (e.clientY - offsetY) + 'px';
            }
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
        
        // 点击框外自动关闭
        document.addEventListener('click', function(e) {
            if (formulaBox.style.display === 'block' && 
                !formulaBox.contains(e.target) && 
                e.target.id !== 'explainBtn') {
                formulaBox.style.display = 'none';
            }
        });
        
        // 更新公式内容
        formulaBox.innerHTML = `
            <span class="close-btn" onclick="this.parentElement.style.display='none';">×</span>
            <h4>数学公式详解</h4>
            
            <div class="formula-section">
                <p><strong>1. 三角形面积计算:</strong></p>
                <p>底 = 2 × r × sin(θ/2)</p>
                <p>高 = r × cos(θ/2)</p>
                <p>面积 = (1/2) × 底 × 高</p>
                <p>= (1/2) × 2r × sin(${(anglePerSlice/2).toFixed(4)}) × r × cos(${(anglePerSlice/2).toFixed(4)})</p>
                <p>= r² × sin(${anglePerSlice.toFixed(4)}) / 2</p>
                <p>= ${triangleArea.toFixed(4)}</p>
            </div>
            
            <div class="formula-section">
                <p><strong>2. n个切片的近似面积:</strong></p>
                <p>A ≈ n × (r² × sin(2π/n) / 2)</p>
                <p>= ${slices} × (${Math.pow(this.radius, 2)} × sin(${anglePerSlice.toFixed(4)}) / 2)</p>
                <p>= ${slices} × ${triangleArea.toFixed(4)}</p>
                <p>= ${approximateArea.toFixed(4)}</p>
            </div>
            
            <div class="formula-section">
                <p><strong>3. 圆的精确面积:</strong></p>
                <p>A = πr²</p>
                <p>= π × ${Math.pow(this.radius, 2)}</p>
                <p>= ${exactArea.toFixed(4)}</p>
            </div>
            
            <div class="formula-section">
                <p><strong>4. 当n→∞时:</strong></p>
                <p>lim n→∞ [n × (r² × sin(2π/n) / 2)] = πr²</p>
                <p>误差: ${((Math.abs(exactArea - approximateArea) / exactArea) * 100).toFixed(4)}%</p>
            </div>
        `;
        
        // 显示公式框
        formulaBox.style.display = 'block';
        
        // 在画布上添加提示文字
        this.ctx.save();
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('三角形近似法演示', this.centerX, this.centerY - this.radius - 20);
        this.ctx.restore();
    }
}

// 导出可视化器类，使其可以被其他模块使用
window.PizzaVisualizer = PizzaVisualizer;