// codex: 2026-06-02 增加环旋转物理耦合联动逻辑，旋转外环时内部所有环同步旋转
// Safe Cracker 50 - ring-model.js

/**
 * RingModel - 环形拼图的数据模型
 * 管理4个可旋转积木的偏移量，计算每个扇区位置的可见数字
 */
class RingModel {
    constructor() {
        const { SECTOR_COUNT, RING_DATA, BLOCK_DEFINITIONS } = window.GameConfig;
        this.N = SECTOR_COUNT;
        this.data = RING_DATA;
        this.blocks = BLOCK_DEFINITIONS;

        // 4个可旋转积木的偏移量 (B, C, D, E)，初始随机打乱
        this.offsets = {
            blockB: 0,
            blockC: 0,
            blockD: 0,
            blockE: 0
        };

        // 初始打乱
        this.shuffle();
    }

    /**
     * 随机打乱所有可旋转积木的偏移量
     */
    shuffle() {
        const rotatableBlocks = this.blocks.filter(b => b.rotatable);
        rotatableBlocks.forEach(block => {
            this.offsets[block.id] = Math.floor(Math.random() * this.N);
        });
    }

    /**
     * 重置所有偏移量为 0
     */
    reset() {
        Object.keys(this.offsets).forEach(key => {
            this.offsets[key] = 0;
        });
    }

    /**
     * 设置为正确解的偏移量
     * 通过暴力搜索确认的唯一解: B=12, C=8, D=9, E=13
     */
    solve() {
        this.offsets.blockB = 12;
        this.offsets.blockC = 8;
        this.offsets.blockD = 9;
        this.offsets.blockE = 13;
    }

    /**
     * 旋转指定积木
     * 根据物理拼图结构，旋转某个环时，所有放置在它上面的环（即内圈的环）也会跟随旋转。
     * 层叠关系由外到内为：blockB (Ring4) -> blockC (Ring3) -> blockD (Ring2) -> blockE (Ring1)
     * @param {string} blockId - 积木 ID (blockB/C/D/E)
     * @param {number} direction - 旋转方向: 1=顺时针, -1=逆时针
     */
    rotate(blockId, direction) {
        if (this.offsets[blockId] === undefined) return;

        const blocksToRotate = [];
        if (blockId === 'blockB') {
            blocksToRotate.push('blockB', 'blockC', 'blockD', 'blockE');
        } else if (blockId === 'blockC') {
            blocksToRotate.push('blockC', 'blockD', 'blockE');
        } else if (blockId === 'blockD') {
            blocksToRotate.push('blockD', 'blockE');
        } else if (blockId === 'blockE') {
            blocksToRotate.push('blockE');
        }

        blocksToRotate.forEach(id => {
            if (this.offsets[id] !== undefined) {
                this.offsets[id] = (this.offsets[id] + direction + this.N) % this.N;
            }
        });
    }

    /**
     * 设置指定积木的偏移量
     * @param {string} blockId - 积木 ID
     * @param {number} offset - 偏移量 (0 ~ N-1)
     */
    setOffset(blockId, offset) {
        if (this.offsets[blockId] === undefined) return;
        this.offsets[blockId] = ((offset % this.N) + this.N) % this.N;
    }

    /**
     * 获取指定积木的偏移量
     * @param {string} blockId - 积木 ID
     * @returns {number} 偏移量
     */
    getOffset(blockId) {
        return this.offsets[blockId] || 0;
    }

    /**
     * 获取指定层在指定位置的数据值（考虑旋转偏移）
     * @param {string} layerName - 层名称 (如 'down5', 'up4' 等)
     * @param {number} position - 扇区位置 (0~15)
     * @returns {number|null} 数据值，null 表示该位置镂空
     */
    getLayerValue(layerName, position) {
        // 找到该层所属的积木
        const block = this.blocks.find(b => b.layers.includes(layerName));
        if (!block) return null;

        const layerData = this.data[layerName];
        if (!layerData) return null;

        // 如果是固定积木(blockA)，不施加偏移
        if (!block.rotatable) {
            return layerData[position];
        }

        // 施加旋转偏移：逻辑位置 = (物理位置 - 偏移量) mod N
        const offset = this.offsets[block.id] || 0;
        const logicalIndex = ((position - offset) % this.N + this.N) % this.N;
        return layerData[logicalIndex];
    }

    /**
     * 获取指定环（圈）在指定位置的可见数字
     * 上层有值时显示上层，否则显示下层
     * @param {number} ringNumber - 环编号 (1~5)
     * @param {number} position - 扇区位置 (0~15)
     * @returns {number} 可见数字
     */
    getVisibleValue(ringNumber, position) {
        if (ringNumber === 5) {
            // 最外圈只有 down5
            return this.getLayerValue('down5', position);
        }

        // 其他环有上下两层
        const upLayer = `up${ringNumber}`;
        const downLayer = `down${ringNumber}`;

        const upValue = this.getLayerValue(upLayer, position);
        if (upValue !== null) {
            return upValue;
        }
        return this.getLayerValue(downLayer, position);
    }

    /**
     * 获取指定位置所有环的可见数字详情（用于渲染和调试）
     * @param {number} position - 扇区位置 (0~15)
     * @returns {Array} 从外到内每圈的可见信息
     */
    getColumnDetails(position) {
        const details = [];
        for (let ring = 5; ring >= 1; ring--) {
            const upLayer = `up${ring}`;
            const downLayer = `down${ring}`;
            const upVal = ring < 5 ? this.getLayerValue(upLayer, position) : null;
            const downVal = this.getLayerValue(downLayer, position);

            details.push({
                ring,
                visibleValue: upVal !== null ? upVal : downVal,
                isUpper: upVal !== null,
                upperValue: upVal,
                lowerValue: downVal
            });
        }
        return details;
    }

    /**
     * 计算一列的可见数字之和
     * 每列有5个可见数字（5圈各1个）
     * @param {number} pos - 扇区位置 (0~15)
     * @returns {number} 该列的数字总和
     */
    getColumnSum(pos) {
        let sum = 0;
        for (let ring = 5; ring >= 1; ring--) {
            sum += this.getVisibleValue(ring, pos);
        }
        return sum;
    }

    /**
     * 获取所有16列的和
     * @returns {Array<{pos: number, sum: number, correct: boolean}>}
     */
    getAllColumnSums() {
        const results = [];
        for (let pos = 0; pos < this.N; pos++) {
            const sum = this.getColumnSum(pos);
            results.push({
                pos,
                sum,
                correct: sum === window.GameConfig.TARGET_SUM
            });
        }
        return results;
    }

    /**
     * 检查是否所有列之和都等于目标值
     * @returns {boolean} 是否胜利
     */
    checkWin() {
        for (let pos = 0; pos < this.N; pos++) {
            if (this.getColumnSum(pos) !== window.GameConfig.TARGET_SUM) {
                return false;
            }
        }
        return true;
    }

    /**
     * 根据点击/拖拽位置判断属于哪个积木
     * @param {number} radius - 距圆心距离
     * @returns {string|null} 积木 ID 或 null
     */
    getBlockIdByRadius(radius) {
        const radii = window.GameConfig.RING_RADII;

        // 第四圈区域 → 积木B (up4 部分)
        if (radius >= radii.ring4.inner && radius <= radii.ring4.outer) {
            return 'blockB';
        }
        // 第三圈区域 → 积木C (up3 部分)
        if (radius >= radii.ring3.inner && radius <= radii.ring3.outer) {
            return 'blockC';
        }
        // 第二圈区域 → 积木D (up2 部分)
        if (radius >= radii.ring2.inner && radius <= radii.ring2.outer) {
            return 'blockD';
        }
        // 第一圈区域 → 积木E (up1)
        if (radius >= radii.ring1.inner && radius <= radii.ring1.outer) {
            return 'blockE';
        }
        return null;
    }

    /**
     * 获取所有渲染需要的层数据（含位置和颜色信息）
     * @returns {Array} 渲染用的层列表，从底层到顶层排序
     */
    getRenderLayers() {
        const layers = [];
        const radii = window.GameConfig.RING_RADII;

        // 从外到内、从下到上的渲染顺序
        const renderOrder = [
            { layer: 'down5', ring: 'ring5', zIndex: 0 },
            { layer: 'down4', ring: 'ring4', zIndex: 1 },
            { layer: 'up4',   ring: 'ring4', zIndex: 2 },
            { layer: 'down3', ring: 'ring3', zIndex: 3 },
            { layer: 'up3',   ring: 'ring3', zIndex: 4 },
            { layer: 'down2', ring: 'ring2', zIndex: 5 },
            { layer: 'up2',   ring: 'ring2', zIndex: 6 },
            { layer: 'down1', ring: 'ring1', zIndex: 7 },
            { layer: 'up1',   ring: 'ring1', zIndex: 8 }
        ];

        for (const item of renderOrder) {
            const block = this.blocks.find(b => b.layers.includes(item.layer));
            const ringRadii = radii[item.ring];
            const values = [];

            for (let pos = 0; pos < this.N; pos++) {
                values.push(this.getLayerValue(item.layer, pos));
            }

            layers.push({
                layerName: item.layer,
                blockId: block.id,
                innerR: ringRadii.inner,
                outerR: ringRadii.outer,
                color: block.color,
                values,
                isUpper: item.layer.startsWith('up'),
                zIndex: item.zIndex,
                offset: block.rotatable ? this.offsets[block.id] : 0
            });
        }

        return layers;
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.RingModel = RingModel;
}
