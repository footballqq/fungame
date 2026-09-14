// codex: 2026-09-14 修正：3朝向玩家自己（白方3朝南front=3，黑方3朝北back=3即front=4）
class DittleDie {
    constructor(color, top = 6, front = null, right = 2) {
        this.color = color; // 'white' or 'black'
        this.top = top;
        // 双方默认均为 6 是 top，3 面向玩家自己：
        // 白方坐在南端 (Row 6)，3 朝向自己（南面 front）→ front = 3
        // 黑方坐在北端 (Row 0)，3 朝向自己（北面 back）→ front = 4
        if (front === null) {
            this.front = color === 'white' ? 3 : 4;
        } else {
            this.front = front;
        }
        this.right = right; // faces East (col 6)
    }

    getBottom() { return 7 - this.top; }
    getBack() { return 7 - this.front; }
    getLeft() { return 7 - this.right; }

    clone() {
        return new DittleDie(this.color, this.top, this.front, this.right);
    }

    // Direction: 'north' (up, r-1), 'south' (down, r+1), 'east' (right, c+1), 'west' (left, c-1)
    tilt(dir) {
        const oldTop = this.top;
        const oldFront = this.front;
        const oldRight = this.right;

        if (dir === 'north') {
            this.top = oldFront;
            this.front = 7 - oldTop;
        } else if (dir === 'south') {
            this.top = 7 - oldFront;
            this.front = oldTop;
        } else if (dir === 'east') {
            this.top = 7 - oldRight;
            this.right = oldTop;
        } else if (dir === 'west') {
            this.top = oldRight;
            this.right = 7 - oldTop;
        }
        return this;
    }
}

window.DittleDie = DittleDie;
