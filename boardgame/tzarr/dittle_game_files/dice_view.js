// codex: 2026-09-14 骰子视觉渲染模块：修正面值映射——CSS face-front(translateZ 朝观众) 才是
// 骰子坐在棋盘上的"视觉顶面"，face-top(rotateX90 朝北) 是视觉背面。此前把 front 填进视觉顶面，
// 导致初始顶面显示 3 而非 6，且东西向翻滚(不改变 front)看起来"点数不变"。
// 视觉映射：face-front = 顶面(top) | face-top = 朝北背面(7-front) | face-right = 朝东右面(right)
class DittleDiceView {
    createDieElement(die, r, c) {
        const wrap = document.createElement('div');
        wrap.className = `die-3d-wrap ${die.color}`;
        wrap.dataset.r = r;
        wrap.dataset.c = c;
        const colorName = die.color === 'white' ? '白骰' : '黑骰';
        const fwdNewTop = die.color === 'white' ? die.front : 7 - die.front;
        const leftNewTop = die.right;
        const rightNewTop = 7 - die.right;
        wrap.title = `${colorName} [顶面:${die.top} | 迎面:${die.front} | 右面:${die.right}]\n翻滚后顶面将变为: 前->${fwdNewTop} | 左->${leftNewTop} | 右->${rightNewTop}`;

        const cube = document.createElement('div');
        cube.className = 'die-cube';
        // 视觉顶面（朝观众/天空）显示 top；朝北背面显示 7-front；朝东面显示 right
        cube.appendChild(this.createFaceElement('face-front', die.top));
        cube.appendChild(this.createFaceElement('face-top', 7 - die.front, `${7 - die.front}`));
        cube.appendChild(this.createFaceElement('face-right', die.right, `${die.right}`));

        wrap.appendChild(cube);
        return wrap;
    }

    createFaceElement(faceClass, value, badgeText = '') {
        const faceEl = document.createElement('div');
        faceEl.className = `die-face ${faceClass}`;
        const grid = document.createElement('div');
        grid.className = 'pips-grid';
        this.fillPipGrid(grid, value);
        faceEl.appendChild(grid);
        if (badgeText) {
            const badge = document.createElement('span');
            badge.className = 'face-badge';
            badge.textContent = badgeText;
            faceEl.appendChild(badge);
        }
        return faceEl;
    }

    fillPipGrid(grid, value) {
        grid.innerHTML = '';
        const pipIndices = this.getPipPositionsForNumber(value);
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'pip-slot';
            if (pipIndices.includes(i)) {
                const pipDot = document.createElement('div');
                pipDot.className = 'pip';
                slot.appendChild(pipDot);
            }
            grid.appendChild(slot);
        }
    }

    updateDieContent(dieEl, die) {
        if (!dieEl || !die) return;
        const cube = dieEl.querySelector('.die-cube');
        if (!cube) return;
        const topFace = cube.querySelector('.face-front');   // 视觉顶面
        const backFace = cube.querySelector('.face-top');    // 视觉朝北背面
        const rightFace = cube.querySelector('.face-right'); // 视觉朝东右面
        if (topFace) this.refreshFace(topFace, die.top);
        if (backFace) this.refreshFace(backFace, 7 - die.front, `${7 - die.front}`);
        if (rightFace) this.refreshFace(rightFace, die.right, `${die.right}`);
    }

    refreshFace(faceEl, value, badgeText = '') {
        const grid = faceEl.querySelector('.pips-grid');
        if (grid) this.fillPipGrid(grid, value);
        let badge = faceEl.querySelector('.face-badge');
        if (badgeText) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'face-badge';
                faceEl.appendChild(badge);
            }
            badge.textContent = badgeText;
        } else if (badge) {
            badge.remove();
        }
    }

    getPipPositionsForNumber(num) {
        const pips = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
        return pips[num] || [];
    }
}

window.DittleDiceView = DittleDiceView;
