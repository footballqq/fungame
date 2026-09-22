// codex: 2026-09-22 实现青蛙与表情包皮肤系统，支持经典萌蛙、Pepe、柴犬猫咪与Emoji表情派对
/**
 * 青蛙皮肤与表情包系统 (skins.js)
 * 提供多种风格的表情包、贴纸与自定义形象，支持跳跃、被跨越、待机与胜利动态表情
 */

const FROG_SKINS = {
    'classic_frog': {
        id: 'classic_frog',
        name: '荷塘萌蛙 🐸',
        desc: '原版白蛙与黑蛙（还原题图插画风格）',
        white: {
            name: '翡翠白蛙',
            emoji: '🐸',
            symbol: '⚪',
            color: '#a8e6cf',
            textColor: '#1b5e20',
            borderColor: '#66bb6a',
            idleSvg: `<svg viewBox="0 0 100 100" class="frog-svg">
                <ellipse cx="50" cy="55" rx="38" ry="32" fill="#dcedc8" stroke="#81c784" stroke-width="4"/>
                <ellipse cx="32" cy="28" rx="14" ry="14" fill="#dcedc8" stroke="#81c784" stroke-width="4"/>
                <ellipse cx="68" cy="28" rx="14" ry="14" fill="#dcedc8" stroke="#81c784" stroke-width="4"/>
                <circle cx="34" cy="28" r="6" fill="#2e7d32"/>
                <circle cx="66" cy="28" r="6" fill="#2e7d32"/>
                <circle cx="36" cy="26" r="2" fill="#fff"/>
                <circle cx="68" cy="26" r="2" fill="#fff"/>
                <path d="M 38 60 Q 50 72 62 60" fill="none" stroke="#2e7d32" stroke-width="3" stroke-linecap="round"/>
                <circle cx="28" cy="58" r="4" fill="#ffab91" opacity="0.6"/>
                <circle cx="72" cy="58" r="4" fill="#ffab91" opacity="0.6"/>
            </svg>`,
            cheerSvg: '✨🐸✨'
        },
        black: {
            name: '玄墨夜蛙',
            emoji: '🐸',
            symbol: '⚫',
            color: '#424242',
            textColor: '#f5f5f5',
            borderColor: '#212121',
            idleSvg: `<svg viewBox="0 0 100 100" class="frog-svg">
                <ellipse cx="50" cy="55" rx="38" ry="32" fill="#424242" stroke="#212121" stroke-width="4"/>
                <ellipse cx="32" cy="28" rx="14" ry="14" fill="#424242" stroke="#212121" stroke-width="4"/>
                <ellipse cx="68" cy="28" rx="14" ry="14" fill="#424242" stroke="#212121" stroke-width="4"/>
                <circle cx="34" cy="28" r="6" fill="#fff"/>
                <circle cx="66" cy="28" r="6" fill="#fff"/>
                <circle cx="35" cy="28" r="3" fill="#000"/>
                <circle cx="65" cy="28" r="3" fill="#000"/>
                <path d="M 38 60 Q 50 70 62 60" fill="none" stroke="#bdbdbd" stroke-width="3" stroke-linecap="round"/>
                <circle cx="28" cy="58" r="4" fill="#78909c" opacity="0.5"/>
                <circle cx="72" cy="58" r="4" fill="#78909c" opacity="0.5"/>
            </svg>`,
            cheerSvg: '🌟🐸🌟'
        }
    },
    'meme_pepe': {
        id: 'meme_pepe',
        name: 'Pepe 表情包 🥳',
        desc: '风靡全网的搞怪青蛙与墨镜大佬',
        white: {
            name: '喜悦蛙 Pepe',
            emoji: '🐸',
            symbol: '💚',
            color: '#c8e6c9',
            textColor: '#1b5e20',
            borderColor: '#4caf50',
            idleSvg: `<div class="meme-face">🤪<span class="meme-sub">白队Pepe</span></div>`,
            cheerSvg: '🥳🎉'
        },
        black: {
            name: '墨镜大佬 Pepe',
            emoji: '🕶️',
            symbol: '🖤',
            color: '#37474f',
            textColor: '#eceff1',
            borderColor: '#263238',
            idleSvg: `<div class="meme-face">😎<span class="meme-sub">暗黑大佬</span></div>`,
            cheerSvg: '👑😎'
        }
    },
    'pet_party': {
        id: 'pet_party',
        name: '柴犬 vs 酷猫 🐶🐱',
        desc: '汪星人与喵星人的池塘对决',
        white: {
            name: '元气柴柴',
            emoji: '🐶',
            symbol: '🐕',
            color: '#ffe0b2',
            textColor: '#e65100',
            borderColor: '#ff9800',
            idleSvg: `<div class="meme-face">🐶<span class="meme-sub">元气柴</span></div>`,
            cheerSvg: '🐕✨'
        },
        black: {
            name: '暗夜酷猫',
            emoji: '🐱',
            symbol: '🐈‍⬛',
            color: '#546e7a',
            textColor: '#eceff1',
            borderColor: '#37474f',
            idleSvg: `<div class="meme-face">😼<span class="meme-sub">酷黑猫</span></div>`,
            cheerSvg: '🐈‍⬛💖'
        }
    },
    'emoji_fun': {
        id: 'emoji_fun',
        name: '魔性黄脸表情 😊😈',
        desc: '经典滑稽、憨笑与小恶魔',
        white: {
            name: '阳光滑稽',
            emoji: '😊',
            symbol: '☀️',
            color: '#fff9c4',
            textColor: '#f57f17',
            borderColor: '#fbc02d',
            idleSvg: `<div class="meme-face">😏<span class="meme-sub">滑稽君</span></div>`,
            cheerSvg: '🤩🌟'
        },
        black: {
            name: '搞怪恶魔',
            emoji: '😈',
            symbol: '💜',
            color: '#673ab7',
            textColor: '#f3e5f5',
            borderColor: '#512da8',
            idleSvg: `<div class="meme-face">😈<span class="meme-sub">小恶魔</span></div>`,
            cheerSvg: '🔥🚀'
        }
    }
};

class SkinManager {
    constructor() {
        this.currentSkinId = 'classic_frog';
    }

    getCurrentSkin() {
        return FROG_SKINS[this.currentSkinId] || FROG_SKINS['classic_frog'];
    }

    setSkin(skinId) {
        if (FROG_SKINS[skinId]) {
            this.currentSkinId = skinId;
            return true;
        }
        return false;
    }

    getFrogVisual(frogColor, isJumping = false, isOverjumped = false) {
        const skin = this.getCurrentSkin();
        const conf = frogColor === WHITE ? skin.white : skin.black;

        let extraClass = '';
        if (isJumping) extraClass += ' jumping-frog';
        if (isOverjumped) extraClass += ' overjumped-frog';

        return `
            <div class="frog-avatar-wrap ${extraClass}" data-color="${frogColor}">
                ${conf.idleSvg}
            </div>
        `;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FROG_SKINS, SkinManager };
}
