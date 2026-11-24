// codex: 2026-11-24 纸艺皮肤管理器，支持经典方格纸、和风彩纸、牛皮手工垫与极客蓝图四种质感

const PAPERCUT_SKINS = {
    classic: {
        id: 'classic',
        name: '经典方格纸',
        desc: '还原数学试卷与温润米白方格纸质感，色彩柔和护眼'
    },
    origami: {
        id: 'origami',
        name: '和风彩纸',
        desc: '粉樱与淡竹马卡龙手工折纸配色，清新可爱'
    },
    craft: {
        id: 'craft',
        name: '手工切割垫',
        desc: '专业绿色模型手工切割垫风格，刻度清晰利落'
    },
    blueprint: {
        id: 'blueprint',
        name: '极客蓝图',
        desc: '深蓝建筑工程蓝图与高对比荧光刻度线'
    }
};

class SkinManager {
    constructor(storageKey = 'papercut_11_skin') {
        this.storageKey = storageKey;
        this.currentSkin = this._loadSkin();
    }

    _loadSkin() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved && PAPERCUT_SKINS[saved]) return saved;
        } catch (e) {
            // 忽略隐私模式存储异常
        }
        return 'classic';
    }

    applySkin(skinId) {
        if (!PAPERCUT_SKINS[skinId]) return;
        this.currentSkin = skinId;
        try {
            localStorage.setItem(this.storageKey, skinId);
        } catch (e) {
            // 忽略存储异常
        }
        const container = document.getElementById('paperBoardContainer');
        if (container) {
            Object.keys(PAPERCUT_SKINS).forEach(k =>
                container.classList.remove(`skin-${k}`)
            );
            container.classList.add(`skin-${skinId}`);
        }
        document.querySelectorAll('.skin-card').forEach(card => {
            card.classList.toggle('active', card.dataset.skin === skinId);
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PAPERCUT_SKINS, SkinManager };
} else {
    window.PAPERCUT_SKINS = PAPERCUT_SKINS;
    window.SkinManager = SkinManager;
}
