// codex: 2026-06-02 优化缩放控制为5档预设快速选择面板（100%-200%）
// Safe Cracker 50 - app.js

/**
 * SafeCrackerApp - 游戏应用主控制器
 * 组装 RingModel、RingRenderer、InteractionController、GameLogic
 */
class SafeCrackerApp {
    constructor() {
        this.model = null;
        this.renderer = null;
        this.interaction = null;
        this.gameLogic = null;
    }

    /**
     * 初始化应用
     */
    init() {
        // 获取 DOM 元素
        const svgEl = document.getElementById('puzzle-svg');
        const statusEl = document.getElementById('game-status');
        const sumsEl = document.getElementById('diameter-sums');

        if (!svgEl) {
            console.error('SVG 元素未找到');
            return;
        }

        // 设置 SVG viewBox
        svgEl.setAttribute('viewBox', window.GameConfig.SVG_VIEWBOX);

        // 创建数据模型
        this.model = new window.RingModel();

        // 创建渲染器
        this.renderer = new window.RingRenderer(svgEl, this.model);

        // 创建游戏逻辑
        this.gameLogic = new window.GameLogic(this.model, statusEl, sumsEl);

        // 创建交互控制器
        this.interaction = new window.InteractionController(
            svgEl,
            this.model,
            (blockId, direction) => {
                this.model.rotate(blockId, direction);
                this.gameLogic.incrementMoves();
            },
            () => {
                this.renderer.render();
                this.gameLogic.update();
            }
        );

        // 设置拖拽光标
        svgEl.style.cursor = 'grab';

        // 初始渲染
        this.renderer.render();
        this.gameLogic.update();

        // 绑定控制面板按钮
        this._bindControlButtons();

        // 绑定规则弹窗
        this._bindRulesModal();

        // 初始化缩放控制
        this._initZoomControls();

        console.log('Safe Cracker 50 游戏已初始化');
    }

    /**
     * 绑定控制面板的旋转按钮
     */
    _bindControlButtons() {
        // 为每个可旋转积木绑定按钮
        const rotatableBlocks = window.GameConfig.BLOCK_DEFINITIONS.filter(b => b.rotatable);

        rotatableBlocks.forEach(block => {
            const ccwBtn = document.getElementById(`btn-${block.id}-ccw`);
            const cwBtn = document.getElementById(`btn-${block.id}-cw`);

            if (ccwBtn) {
                ccwBtn.addEventListener('click', () => {
                    this.interaction.buttonRotate(block.id, -1);
                });
            }
            if (cwBtn) {
                cwBtn.addEventListener('click', () => {
                    this.interaction.buttonRotate(block.id, 1);
                });
            }
        });

        // 重置按钮
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this._handleShuffle());
        }

        // 求解按钮（将所有偏移量设为 0 来展示解法）
        const solveBtn = document.getElementById('btn-solve');
        if (solveBtn) {
            solveBtn.addEventListener('click', () => this._handleSolve());
        }
    }

    /**
     * 处理重新打乱
     */
    _handleShuffle() {
        this.model.shuffle();
        this.gameLogic.reset();
        this.renderer.render();
        this.gameLogic.update();
    }

    /**
     * 处理求解（演示用）
     */
    _handleSolve() {
        this.model.solve();
        this.renderer.render();
        this.gameLogic.update();
    }

    /**
     * 绑定规则弹窗
     */
    _bindRulesModal() {
        const rulesBtn = document.getElementById('btn-rules');
        const modal = document.getElementById('rules-modal');
        const closeBtn = document.getElementById('modal-close');

        if (rulesBtn && modal) {
            rulesBtn.addEventListener('click', () => {
                modal.classList.add('show');
            });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }
    }

    /**
     * 初始化缩放控制（5 档预设按钮）
     */
    _initZoomControls() {
        const svgEl = document.getElementById('puzzle-svg');
        const zoomBtns = document.querySelectorAll('.btn-zoom-opt');

        if (!svgEl || zoomBtns.length === 0) return;

        const baseSize = 560; // 默认渲染尺寸

        const updateZoom = (scale, activeBtn) => {
            const size = Math.round(baseSize * scale);
            // 通过 inline style 强行控制，避开 CSS 媒体查询限制
            svgEl.style.width = `${size}px`;
            svgEl.style.height = `${size}px`;
            
            // 更新当前激活按钮的状态样式
            zoomBtns.forEach(btn => btn.classList.remove('active'));
            if (activeBtn) {
                activeBtn.classList.add('active');
            } else {
                // 如果没有显式指定按钮（如初始化时），依据 scale 值查找对应按钮高亮
                const match = document.querySelector(`.btn-zoom-opt[data-scale="${scale.toFixed(1)}"]`) ||
                              document.querySelector(`.btn-zoom-opt[data-scale="${scale}"]`);
                if (match) match.classList.add('active');
            }
        };

        zoomBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const scale = parseFloat(btn.getAttribute('data-scale'));
                updateZoom(scale, btn);
            });
        });

        // 默认初始化为 100% 比例
        updateZoom(1.0);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const app = new SafeCrackerApp();
    app.init();
    window.safeCrackerApp = app; // 方便调试
});
