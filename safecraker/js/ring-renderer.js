// codex: 2026-06-02 优化阴影滤镜，增加 3D 侧面厚度渲染以增强层叠立体感
// Safe Cracker 50 - ring-renderer.js

/**
 * RingRenderer - SVG 环形拼图渲染器
 * 负责将 RingModel 的数据渲染为 SVG 图形
 */
class RingRenderer {
    /**
     * @param {SVGElement} svgElement - SVG DOM 元素
     * @param {RingModel} model - 数据模型
     */
    constructor(svgElement, model) {
        this.svg = svgElement;
        this.model = model;
        this.N = window.GameConfig.SECTOR_COUNT;
        this.radii = window.GameConfig.RING_RADII;
        this.sectorAngle = 360 / this.N;         // 每个扇区的角度
        this.halfSector = this.sectorAngle / 2;   // 半扇区角度

        // 旋转动画用的 SVG group 引用
        this.blockGroups = {};

        // 创建 SVG defs（渐变、滤镜等）
        this._createDefs();
    }

    /**
     * 创建 SVG defs - 渐变和滤镜定义
     */
    _createDefs() {
        const defs = this._createSVGElement('defs');

        // 为每个积木创建木纹渐变
        window.GameConfig.BLOCK_DEFINITIONS.forEach(block => {
            // 径向渐变模拟木纹
            const grad = this._createSVGElement('radialGradient');
            grad.setAttribute('id', `grad-${block.id}`);
            grad.setAttribute('cx', '40%');
            grad.setAttribute('cy', '40%');
            grad.setAttribute('r', '60%');

            const stop1 = this._createSVGElement('stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', block.color.light);

            const stop2 = this._createSVGElement('stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', block.color.dark);

            grad.appendChild(stop1);
            grad.appendChild(stop2);
            defs.appendChild(grad);
        });

        // 中心圆渐变
        const centerGrad = this._createSVGElement('radialGradient');
        centerGrad.setAttribute('id', 'grad-center');
        centerGrad.setAttribute('cx', '35%');
        centerGrad.setAttribute('cy', '35%');

        const cs1 = this._createSVGElement('stop');
        cs1.setAttribute('offset', '0%');
        cs1.setAttribute('stop-color', '#8B7355');
        const cs2 = this._createSVGElement('stop');
        cs2.setAttribute('offset', '100%');
        cs2.setAttribute('stop-color', '#3E2723');
        centerGrad.appendChild(cs1);
        centerGrad.appendChild(cs2);
        defs.appendChild(centerGrad);

        // 内阴影滤镜 - 增加立体感
        const shadow = this._createSVGElement('filter');
        shadow.setAttribute('id', 'inner-shadow');
        shadow.setAttribute('x', '-20%');
        shadow.setAttribute('y', '-20%');
        shadow.setAttribute('width', '140%');
        shadow.setAttribute('height', '140%');

        const feFlood = this._createSVGElement('feFlood');
        feFlood.setAttribute('flood-color', 'rgba(0,0,0,0.3)');
        shadow.appendChild(feFlood);

        const feComposite1 = this._createSVGElement('feComposite');
        feComposite1.setAttribute('in2', 'SourceAlpha');
        feComposite1.setAttribute('operator', 'in');
        shadow.appendChild(feComposite1);

        const feGaussian = this._createSVGElement('feGaussianBlur');
        feGaussian.setAttribute('stdDeviation', '2');
        shadow.appendChild(feGaussian);

        const feComposite2 = this._createSVGElement('feComposite');
        feComposite2.setAttribute('in2', 'SourceAlpha');
        feComposite2.setAttribute('operator', 'in');
        shadow.appendChild(feComposite2);

        const feMerge = this._createSVGElement('feMerge');
        const feMergeNode1 = this._createSVGElement('feMergeNode');
        feMergeNode1.setAttribute('in', 'SourceGraphic');
        const feMergeNode2 = this._createSVGElement('feMergeNode');
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        shadow.appendChild(feMerge);
        defs.appendChild(shadow);

        // drop-shadow 滤镜 - 上层板块投影
        const dropShadow = this._createSVGElement('filter');
        dropShadow.setAttribute('id', 'drop-shadow');
        dropShadow.setAttribute('x', '-20%');
        dropShadow.setAttribute('y', '-20%');
        dropShadow.setAttribute('width', '140%');
        dropShadow.setAttribute('height', '140%');

        const feDropShadow = this._createSVGElement('feDropShadow');
        feDropShadow.setAttribute('dx', '0');
        feDropShadow.setAttribute('dy', '2.5');
        feDropShadow.setAttribute('stdDeviation', '2');
        feDropShadow.setAttribute('flood-color', 'rgba(0,0,0,0.55)');
        dropShadow.appendChild(feDropShadow);
        defs.appendChild(dropShadow);

        this.svg.appendChild(defs);
    }

    /**
     * 极坐标转直角坐标
     * @param {number} radius - 半径
     * @param {number} angleDeg - 角度（度），0° 在正上方
     * @returns {{x: number, y: number}}
     */
    _polar(radius, angleDeg) {
        const rad = (angleDeg - 90) * Math.PI / 180;
        return {
            x: radius * Math.cos(rad),
            y: radius * Math.sin(rad)
        };
    }

    /**
     * 创建环形扇区的 SVG path 数据
     * @param {number} innerR - 内半径
     * @param {number} outerR - 外半径
     * @param {number} startAngle - 起始角度
     * @param {number} endAngle - 结束角度
     * @returns {string} SVG path d 属性
     */
    _sectorPath(innerR, outerR, startAngle, endAngle) {
        const outerStart = this._polar(outerR, startAngle);
        const outerEnd = this._polar(outerR, endAngle);
        const innerEnd = this._polar(innerR, endAngle);
        const innerStart = this._polar(innerR, startAngle);
        const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

        return [
            `M ${outerStart.x} ${outerStart.y}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
            `L ${innerEnd.x} ${innerEnd.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
            'Z'
        ].join(' ');
    }

    /**
     * 创建 SVG 元素
     */
    _createSVGElement(tag) {
        return document.createElementNS('http://www.w3.org/2000/svg', tag);
    }

    /**
     * 完整渲染整个拼图
     */
    render() {
        // 清除除 defs 外的所有内容
        const defs = this.svg.querySelector('defs');
        this.svg.innerHTML = '';
        if (defs) this.svg.appendChild(defs);

        this.blockGroups = {};

        // 外圈背景环（装饰边框）
        this._renderOuterBorder();

        // 按渲染顺序绘制每一层
        const renderLayers = this.model.getRenderLayers();

        // 为每个积木创建 group
        const blockOrder = ['blockA', 'blockB', 'blockC', 'blockD', 'blockE'];
        blockOrder.forEach(blockId => {
            const group = this._createSVGElement('g');
            group.setAttribute('data-block', blockId);
            group.classList.add('ring-group');
            this.blockGroups[blockId] = group;
        });

        // 绘制每一层到对应的 group
        for (const layer of renderLayers) {
            const group = this.blockGroups[layer.blockId];
            this._renderLayer(group, layer);
        }

        // 将 groups 按顺序添加到 SVG
        blockOrder.forEach(blockId => {
            this.svg.appendChild(this.blockGroups[blockId]);
        });

        // 绘制中心圆
        this._renderCenter();

        // 绘制直径指示线
        this._renderDiameterLines();
    }

    /**
     * 渲染外圈装饰边框
     */
    _renderOuterBorder() {
        const outerR = this.radii.ring5.outer + 8;
        const border = this._createSVGElement('circle');
        border.setAttribute('cx', 0);
        border.setAttribute('cy', 0);
        border.setAttribute('r', outerR);
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#3E2723');
        border.setAttribute('stroke-width', '4');
        this.svg.appendChild(border);
    }

    /**
     * 渲染一个数据层
     * @param {SVGGElement} group - 目标 SVG group
     * @param {Object} layer - 层渲染数据
     */
    _renderLayer(group, layer) {
        const isUpper = layer.isUpper;

        for (let pos = 0; pos < this.N; pos++) {
            const value = layer.values[pos];

            // 上层中 null 位置表示镂空，不渲染
            if (isUpper && value === null) continue;

            const startAngle = pos * this.sectorAngle;
            const endAngle = startAngle + this.sectorAngle;
            const midAngle = startAngle + this.halfSector;

            // 绘制扇区背景
            const path = this._createSVGElement('path');
            const d = this._sectorPath(layer.innerR, layer.outerR, startAngle, endAngle);
            path.setAttribute('d', d);

            if (isUpper) {
                // 1. 绘制 3D 厚度边（侧面），下移 3.5px 并应用投影
                const thickness = this._createSVGElement('path');
                thickness.setAttribute('d', d);
                thickness.setAttribute('fill', layer.color.thickness || layer.color.stroke);
                thickness.setAttribute('transform', 'translate(0, 3.5)');
                thickness.setAttribute('filter', 'url(#drop-shadow)');
                thickness.setAttribute('pointer-events', 'none');
                group.appendChild(thickness);

                // 2. 绘制上层表面
                path.setAttribute('fill', layer.color.base);
                path.setAttribute('stroke', layer.color.stroke);
                path.setAttribute('stroke-width', '1');
            } else {
                // 下层用渐变
                path.setAttribute('fill', `url(#grad-${layer.blockId})`);
                path.setAttribute('stroke', layer.color.stroke);
                path.setAttribute('stroke-width', '0.5');
            }

            group.appendChild(path);

            // 绘制数字
            if (value !== null && value !== undefined) {
                const textPos = this._polar(
                    (layer.innerR + layer.outerR) / 2,
                    midAngle
                );

                const text = this._createSVGElement('text');
                text.setAttribute('x', textPos.x);
                text.setAttribute('y', textPos.y);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'central');
                text.setAttribute('font-family', "'Courier New', monospace");
                text.setAttribute('font-size', this._getFontSize(layer.innerR, layer.outerR));
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('fill', '#2C1810');
                text.setAttribute('pointer-events', 'none');

                // 数字朝向圆心的旋转
                // 数字底部面向圆心（从外侧向圆心方向阅读）
                const rotation = midAngle;
                text.setAttribute('transform',
                    `rotate(${rotation}, ${textPos.x}, ${textPos.y})`);

                text.textContent = value;
                group.appendChild(text);
            }
        }
    }

    /**
     * 根据环的宽度计算合适的字体大小
     */
    _getFontSize(innerR, outerR) {
        const width = outerR - innerR;
        if (width > 40) return '15px';
        if (width > 30) return '13px';
        return '11px';
    }

    /**
     * 渲染中心圆
     */
    _renderCenter() {
        const r = this.radii.center.radius;
        const centerGroup = this._createSVGElement('g');

        // 1. 中心圆 3D 厚度边（侧面），下移 3.5px 并应用投影
        const thickness = this._createSVGElement('circle');
        thickness.setAttribute('cx', 0);
        thickness.setAttribute('cy', 3.5);
        thickness.setAttribute('r', r);
        thickness.setAttribute('fill', '#3E2723'); // 深木色侧边
        thickness.setAttribute('filter', 'url(#drop-shadow)');
        centerGroup.appendChild(thickness);

        // 2. 中心圆表面
        const circle = this._createSVGElement('circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', 'url(#grad-center)');
        circle.setAttribute('stroke', '#2C1810');
        circle.setAttribute('stroke-width', '1.5');
        centerGroup.appendChild(circle);

        // 中心文字 "SAFE" 和 "CRACKER"
        const text1 = this._createSVGElement('text');
        text1.setAttribute('x', 0);
        text1.setAttribute('y', -8);
        text1.setAttribute('text-anchor', 'middle');
        text1.setAttribute('dominant-baseline', 'central');
        text1.setAttribute('font-family', "'Georgia', serif");
        text1.setAttribute('font-size', '9px');
        text1.setAttribute('font-weight', 'bold');
        text1.setAttribute('fill', '#FFD700');
        text1.setAttribute('letter-spacing', '1');
        text1.textContent = 'SAFE';
        centerGroup.appendChild(text1);

        const text2 = this._createSVGElement('text');
        text2.setAttribute('x', 0);
        text2.setAttribute('y', 3);
        text2.setAttribute('text-anchor', 'middle');
        text2.setAttribute('dominant-baseline', 'central');
        text2.setAttribute('font-family', "'Georgia', serif");
        text2.setAttribute('font-size', '7px');
        text2.setAttribute('fill', '#FFD700');
        text2.setAttribute('letter-spacing', '0.5');
        text2.textContent = 'CRACKER';
        centerGroup.appendChild(text2);

        const text3 = this._createSVGElement('text');
        text3.setAttribute('x', 0);
        text3.setAttribute('y', 14);
        text3.setAttribute('text-anchor', 'middle');
        text3.setAttribute('dominant-baseline', 'central');
        text3.setAttribute('font-family', "'Georgia', serif");
        text3.setAttribute('font-size', '11px');
        text3.setAttribute('font-weight', 'bold');
        text3.setAttribute('fill', '#FFD700');
        text3.textContent = '50';
        centerGroup.appendChild(text3);

        this.svg.appendChild(centerGroup);
    }

    /**
     * 渲染列指示线和列号标签
     */
    _renderDiameterLines() {
        const outerR = this.radii.ring5.outer;
        const labelR = outerR + 16; // 列号标签半径
        const linesGroup = this._createSVGElement('g');

        for (let i = 0; i < this.N; i++) {
            const angle = i * this.sectorAngle + this.halfSector;

            // 从圆心到外圈的淡色指示线
            const p1 = this._polar(this.radii.center.radius, angle);
            const p2 = this._polar(outerR, angle);

            const line = this._createSVGElement('line');
            line.setAttribute('x1', p1.x);
            line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x);
            line.setAttribute('y2', p2.y);
            line.setAttribute('stroke', '#FFD700');
            line.setAttribute('stroke-width', '0.3');
            line.setAttribute('opacity', '0.1');
            linesGroup.appendChild(line);

            // 列号标签
            const labelPos = this._polar(labelR, angle);
            const label = this._createSVGElement('text');
            label.setAttribute('x', labelPos.x);
            label.setAttribute('y', labelPos.y);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'central');
            label.setAttribute('font-family', "'Inter', sans-serif");
            label.setAttribute('font-size', '9px');
            label.setAttribute('font-weight', '500');
            label.setAttribute('fill', '#FFD700');
            label.setAttribute('opacity', '0.5');
            label.textContent = i + 1;
            linesGroup.appendChild(label);
        }

        this.svg.appendChild(linesGroup);
    }

    /**
     * 为旋转动画更新指定积木的 transform
     * @param {string} blockId - 积木 ID
     * @param {number} angleDeg - 旋转角度
     */
    setBlockRotation(blockId, angleDeg) {
        const group = this.blockGroups[blockId];
        if (group) {
            group.style.transform = `rotate(${angleDeg}deg)`;
            group.style.transformOrigin = '0 0';
        }
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.RingRenderer = RingRenderer;
}
