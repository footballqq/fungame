// codex: 2026-09-14 设定双方默认均为6向上、3面向对面（白方朝北为3/迎面为4，黑方朝南为3/迎面为3）
class DittleDie {
    constructor(color, top = 6, front = null, right = 2) {
        this.color = color; // 'white' or 'black'
        this.top = top;
        // 双方默认均为 6 是 top，3 面向对面：
        // 白方底线在南端 (Row 6)，面向对面（北端 Row 0）为 3，因此朝向玩家自己的南面 (front) 为 4
        // 黑方底线在北端 (Row 0)，面向对面（南端 Row 6）为 3，因此朝向对面的南面 (front) 为 3
        if (front === null) {
            this.front = color === 'white' ? 4 : 3;
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
