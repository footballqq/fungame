// codex: 2026-09-14 实现六边形立方坐标系统、距离、邻居、几何渲染与图连通性算法
/**
 * 六边形坐标与几何算法模块
 * 采用立方坐标 (Cube Coordinates: q, r, s)，其中 q + r + s = 0
 */

export const HEX_DIRECTIONS = [
  { q: +1, r: -1, s: 0 },
  { q: +1, r: 0, s: -1 },
  { q: 0, r: +1, s: -1 },
  { q: -1, r: +1, s: 0 },
  { q: -1, r: 0, s: +1 },
  { q: 0, r: -1, s: +1 }
];

export class HexCoord {
  constructor(q, r, s) {
    if (q + r + s !== 0) {
      throw new Error(`Invalid HexCoord: ${q} + ${r} + ${s} !== 0`);
    }
    this.q = q;
    this.r = r;
    this.s = s;
  }

  key() {
    return `${this.q},${this.r},${this.s}`;
  }

  static fromKey(key) {
    const parts = key.split(',').map(Number);
    return new HexCoord(parts[0], parts[1], parts[2]);
  }

  equals(other) {
    return this.q === other.q && this.r === other.r && this.s === other.s;
  }

  add(dir) {
    return new HexCoord(this.q + dir.q, this.r + dir.r, this.s + dir.s);
  }

  distanceTo(other) {
    return (
      Math.abs(this.q - other.q) +
      Math.abs(this.r - other.r) +
      Math.abs(this.s - other.s)
    ) / 2;
  }

  isAdjacent(other) {
    return this.distanceTo(other) === 1;
  }

  neighbors() {
    return HEX_DIRECTIONS.map(d => this.add(d));
  }

  /**
   * 将尖顶 (Pointy-topped) 六边形立方坐标转换为二维像素坐标
   * @param {number} size 六边形外接圆半径
   * @param {number} originX 画布中心 X
   * @param {number} originY 画布中心 Y
   */
  toPixel(size, originX = 0, originY = 0) {
    const x = size * Math.sqrt(3) * (this.q + this.r / 2);
    const y = size * (3 / 2) * this.r;
    return { x: originX + x, y: originY + y };
  }

  /**
   * 生成尖顶正六边形的 6 个顶点多边形坐标点字符串 (用于 SVG polygon)
   * @param {number} size
   * @param {number} originX
   * @param {number} originY
   */
  getPolygonPoints(size, originX = 0, originY = 0) {
    const center = this.toPixel(size, originX, originY);
    const points = [];
    for (let i = 0; i < 6; i++) {
      // 尖顶六边形角度：从 30 度 (PI/6) 开始，每次递增 60 度 (PI/3)
      const angle = (Math.PI / 6) + (i * Math.PI / 3);
      const px = center.x + size * Math.cos(angle);
      const py = center.y + size * Math.sin(angle);
      points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
    }
    return points.join(' ');
  }
}

/**
 * 生成初始 19 个底座（中心 1 个，向外扩展两圈：半径为 2）
 * @returns {Set<string>} 包含 19 个底座 key 的 Set
 */
export function getInitialTilesSet() {
  const tileSet = new Set();
  const radius = 2;
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      tileSet.add(`${q},${r},${s}`);
    }
  }
  return tileSet;
}

/**
 * 初始配置：双方各执 3 枚棋子，间隔摆放在最外圈的 6 个角/边缘顶点上。
 * 角顶点按环形顺序排列
 */
export function getInitialPiecesMap() {
  const corners = [
    new HexCoord(0, -2, 2),
    new HexCoord(2, -2, 0),
    new HexCoord(2, 0, -2),
    new HexCoord(0, 2, -2),
    new HexCoord(-2, 2, 0),
    new HexCoord(-2, 0, 2)
  ];
  return {
    1: [corners[0], corners[2], corners[4]], // 玩家 1 (红方)
    2: [corners[1], corners[3], corners[5]]  // 玩家 2 (蓝方)
  };
}

/**
 * 使用广度优先搜索 (BFS) 检查给定的底座集合是否全连通
 * @param {Set<string>} tileKeysSet
 * @returns {boolean}
 */
export function isTilesConnected(tileKeysSet) {
  if (tileKeysSet.size <= 1) return true;
  const iterator = tileKeysSet.values();
  const firstKey = iterator.next().value;
  const startCoord = HexCoord.fromKey(firstKey);

  const visited = new Set([firstKey]);
  const queue = [startCoord];

  while (queue.length > 0) {
    const curr = queue.shift();
    for (const neighbor of curr.neighbors()) {
      const nKey = neighbor.key();
      if (tileKeysSet.has(nKey) && !visited.has(nKey)) {
        visited.add(nKey);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === tileKeysSet.size;
}
