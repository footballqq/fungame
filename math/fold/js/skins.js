// codex: 2026-11-13 纸艺皮肤与纹理系统，支持经典网格/和风折纸/极客蓝图/彩虹色谱

const SKINS = {
    classic: {
        id: 'classic',
        name: '经典网格 📜',
        desc: '还原试卷与方格纸质感，清晰坐标与数字标识',
        themeClass: 'skin-classic',
        frontColor: '#fdfbf7',
        backColor: '#eae4d8',
        borderColor: '#c5b8a5',
        textColor: '#3e2723',
        gridLineColor: 'rgba(74, 53, 39, 0.45)',
        previewColors: ['#fdfbf7', '#eae4d8', '#bcaaa4']
    },
    origami: {
        id: 'origami',
        name: '和风彩纸 🌸',
        desc: '柔和水粉马卡龙色调，粉樱与若竹双面配色',
        themeClass: 'skin-origami',
        frontColor: '#ffebee',
        backColor: '#e8f5e9',
        borderColor: '#ef9a9a',
        textColor: '#4a148c',
        gridLineColor: 'rgba(156, 39, 176, 0.4)',
        previewColors: ['#ffebee', '#e8f5e9', '#e1bee7']
    },
    cyber: {
        id: 'cyber',
        name: '极客蓝图 🌌',
        desc: '深空暗色工程蓝图，荧光青色网格线条与高对比度',
        themeClass: 'skin-cyber',
        frontColor: '#102a43',
        backColor: '#0b1d30',
        borderColor: '#334e68',
        textColor: '#62b0e8',
        gridLineColor: 'rgba(72, 199, 242, 0.55)',
        previewColors: ['#102a43', '#0b1d30', '#48c7f2']
    },
    rainbow: {
        id: 'rainbow',
        name: '彩虹色谱 🌈',
        desc: '16 个方格各自拥有独立光谱色，翻折轨迹一目了然',
        themeClass: 'skin-rainbow',
        frontColor: 'rainbow',
        backColor: '#37474f',
        borderColor: '#78909c',
        textColor: '#ffffff',
        gridLineColor: 'rgba(255, 255, 255, 0.6)',
        previewColors: ['#ef5350', '#ffca28', '#42a5f5', '#66bb6a']
    }
};

class SkinManager {
    constructor() {
        this.currentSkin = localStorage.getItem('fold_skin_theme') || 'classic';
        if (!SKINS[this.currentSkin]) this.currentSkin = 'classic';
    }

    getSkin() {
        return SKINS[this.currentSkin];
    }

    setSkin(skinId) {
        if (SKINS[skinId]) {
            this.currentSkin = skinId;
            localStorage.setItem('fold_skin_theme', skinId);
            this.applyToDOM();
            return true;
        }
        return false;
    }

    applyToDOM() {
        const board = document.getElementById('paperBoardContainer');
        if (board) {
            Object.values(SKINS).forEach(s => board.classList.remove(s.themeClass));
            board.classList.add(SKINS[this.currentSkin].themeClass);
        }
    }

    // 根据方格 ID 返回特制颜色 (尤其是彩虹皮肤)
    getSquareColor(squareId, faceUp) {
        if (this.currentSkin === 'rainbow') {
            if (!faceUp) return '#37474f';
            const hue = ((squareId - 1) * 22.5) % 360;
            return `hsl(${hue}, 80%, 65%)`;
        }
        const skin = SKINS[this.currentSkin];
        return faceUp ? skin.frontColor : skin.backColor;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SKINS, SkinManager };
} else {
    window.SKINS = SKINS;
    window.SkinManager = SkinManager;
}
