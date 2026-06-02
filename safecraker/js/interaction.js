// codex: 2026-06-02 交互控制 - 按钮旋转 + 拖拽旋转
// Safe Cracker 50 - interaction.js

/**
 * InteractionController - 处理用户交互
 * 支持按钮旋转和拖拽旋转两种方式
 */
class InteractionController {
    /**
     * @param {SVGElement} svgElement - SVG DOM 元素
     * @param {RingModel} model - 数据模型
     * @param {Function} onRotate - 旋转回调(blockId, direction)
     * @param {Function} onRender - 重新渲染回调
     */
    constructor(svgElement, model, onRotate, onRender) {
        this.svg = svgElement;
        this.model = model;
        this.onRotate = onRotate;
        this.onRender = onRender;
        this.N = window.GameConfig.SECTOR_COUNT;
        this.sectorAngle = 360 / this.N;

        // 拖拽状态
        this.isDragging = false;
        this.dragBlockId = null;          // 当前拖拽的积木 ID
        this.dragStartAngle = 0;          // 拖拽起始角度
        this.dragAccumulated = 0;         // 累积旋转角度
        this.lastSnapOffset = 0;          // 上次吸附的偏移

        // 动画锁，防止重复触发
        this.isAnimating = false;

        this._bindEvents();
    }

    /**
     * 绑定所有事件监听
     */
    _bindEvents() {
        // 鼠标事件
        this.svg.addEventListener('mousedown', this._onPointerDown.bind(this));
        document.addEventListener('mousemove', this._onPointerMove.bind(this));
        document.addEventListener('mouseup', this._onPointerUp.bind(this));

        // 触摸事件
        this.svg.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this._onPointerUp.bind(this));

        // 防止右键菜单
        this.svg.addEventListener('contextmenu', e => e.preventDefault());
    }

    /**
     * 获取 SVG 坐标系中的点击位置
     * @param {MouseEvent|Touch} event - 事件对象
     * @returns {{x: number, y: number}} SVG 坐标
     */
    _getSVGPoint(event) {
        const rect = this.svg.getBoundingClientRect();
        const svgWidth = this.svg.viewBox.baseVal.width;
        const svgHeight = this.svg.viewBox.baseVal.height;
        const svgX = this.svg.viewBox.baseVal.x;
        const svgY = this.svg.viewBox.baseVal.y;

        const scaleX = svgWidth / rect.width;
        const scaleY = svgHeight / rect.height;

        return {
            x: (event.clientX - rect.left) * scaleX + svgX,
            y: (event.clientY - rect.top) * scaleY + svgY
        };
    }

    /**
     * 计算点到圆心的角度（度）
     * 0° 在正上方，顺时针增加
     */
    _getAngle(x, y) {
        const angle = Math.atan2(x, -y) * 180 / Math.PI;
        return (angle + 360) % 360;
    }

    /**
     * 计算点到圆心的距离
     */
    _getRadius(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    /**
     * 鼠标按下
     */
    _onPointerDown(event) {
        if (this.isAnimating) return;

        const point = this._getSVGPoint(event);
        const radius = this._getRadius(point.x, point.y);
        const blockId = this.model.getBlockIdByRadius(radius);

        if (!blockId) return;

        event.preventDefault();
        this.isDragging = true;
        this.dragBlockId = blockId;
        this.dragStartAngle = this._getAngle(point.x, point.y);
        this.dragAccumulated = 0;
        this.lastSnapOffset = 0;

        // 添加拖拽视觉反馈
        this.svg.style.cursor = 'grabbing';
        this._highlightBlock(blockId, true);
    }

    /**
     * 触摸开始
     */
    _onTouchStart(event) {
        if (this.isAnimating) return;
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        const point = this._getSVGPoint(touch);
        const radius = this._getRadius(point.x, point.y);
        const blockId = this.model.getBlockIdByRadius(radius);

        if (!blockId) return;

        event.preventDefault();
        this.isDragging = true;
        this.dragBlockId = blockId;
        this.dragStartAngle = this._getAngle(point.x, point.y);
        this.dragAccumulated = 0;
        this.lastSnapOffset = 0;
    }

    /**
     * 鼠标/触摸移动
     */
    _onPointerMove(event) {
        if (!this.isDragging) return;

        const point = this._getSVGPoint(event);
        const currentAngle = this._getAngle(point.x, point.y);

        // 计算角度差
        let delta = currentAngle - this.dragStartAngle;

        // 处理 360° 跨越
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        this.dragAccumulated = delta;

        // 计算已经跨过多少个扇区
        const sectorsCrossed = Math.round(this.dragAccumulated / this.sectorAngle);

        if (sectorsCrossed !== this.lastSnapOffset) {
            const direction = sectorsCrossed > this.lastSnapOffset ? 1 : -1;
            const steps = Math.abs(sectorsCrossed - this.lastSnapOffset);

            for (let i = 0; i < steps; i++) {
                this.onRotate(this.dragBlockId, direction);
            }
            this.lastSnapOffset = sectorsCrossed;
            this.onRender();
        }
    }

    /**
     * 触摸移动
     */
    _onTouchMove(event) {
        if (!this.isDragging) return;
        if (event.touches.length !== 1) return;
        event.preventDefault();
        this._onPointerMove(event.touches[0]);
    }

    /**
     * 鼠标/触摸释放
     */
    _onPointerUp() {
        if (!this.isDragging) return;
        this._highlightBlock(this.dragBlockId, false);
        this.isDragging = false;
        this.dragBlockId = null;
        this.svg.style.cursor = 'grab';
    }

    /**
     * 高亮/取消高亮指定积木的 SVG group
     * @param {string} blockId - 积木 ID
     * @param {boolean} active - 是否高亮
     */
    _highlightBlock(blockId, active) {
        const group = this.svg.querySelector(`[data-block="${blockId}"]`);
        if (group) {
            if (active) {
                group.style.filter = 'brightness(1.2) drop-shadow(0 0 6px rgba(255,215,0,0.4))';
            } else {
                group.style.filter = '';
            }
        }
    }

    /**
     * 按钮旋转（带动画）
     * @param {string} blockId - 积木 ID
     * @param {number} direction - 方向: 1=顺时针, -1=逆时针
     */
    buttonRotate(blockId, direction) {
        if (this.isAnimating) return;

        this.onRotate(blockId, direction);
        this.onRender();
    }

    /**
     * 销毁控制器，移除事件监听
     */
    destroy() {
        this.svg.removeEventListener('mousedown', this._onPointerDown);
        document.removeEventListener('mousemove', this._onPointerMove);
        document.removeEventListener('mouseup', this._onPointerUp);
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.InteractionController = InteractionController;
}
