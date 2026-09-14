// codex: 2026-09-14 修正初始朝向：6 顶面朝上、3 面向对面玩家（白方北面=3，黑方南面=3，两军 3 互相对视）
class DittleDie {
    constructor(color, top = 6, front = null, right = 2) {
        this.color = color; // 'white' or 'black'
        this.top = top;
        // 双方默认均为 6 顶面朝上、3 面向对面玩家：
        // 白方坐南端 (Row 6) 向北推进，面向对面的北面 (back) 为 3 → front = 4
        // 黑方坐北端 (Row 0) 向南推进，面向对面的南面 (front) 为 3
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
