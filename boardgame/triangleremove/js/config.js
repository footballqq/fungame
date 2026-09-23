// codex: 2026-09-23 三角形点阵关卡配置、色彩主题、剧情剧本与常数定义
(function(root) {
  'use strict';

  const GAME_CONFIG = {
    // 关卡阶梯定义
    LEVELS: [
      {
        id: 1,
        nRows: 2,
        title: '关卡 1：初窥星阵 (3点)',
        subtitle: '最基础的单体等边三角形',
        description: '点阵中只有 3 个点，构成 1 个正三角形。试着移除最少数量的点，使其不再构成正三角形。',
        minRemove: 1,
        hint: '只需移除任意 1 个点即可破坏唯一的正三角形。'
      },
      {
        id: 2,
        nRows: 3,
        title: '关卡 2：双阶共鸣 (6点)',
        subtitle: '引入倒立三角形与大三角形',
        description: '6 个点形成 5 个正三角形（3个正立边长1、1个倒立边长1、1个正立边长2）。至少去掉几个点？',
        minRemove: 2,
        hint: '注意观察中间的倒立三角形与外层大三角形的公共交点。'
      },
      {
        id: 3,
        nRows: 4,
        title: '关卡 3：星芒交织 (10点)',
        subtitle: '首次出现倾斜正三角形！',
        description: '10 个点共蕴含 15 个正三角形，其中首次出现了倾斜的边长 √3 正三角形！至少去掉几个点？',
        minRemove: 4,
        hint: '倾斜的正三角形容易被忽视，寻找高频交点是关键。'
      },
      {
        id: 4,
        nRows: 5,
        title: '关卡 4：十五星宿·终极挑战 (15点)',
        subtitle: '【奥数经典原题】15点阵最少去掉几个点？',
        description: '题图原题：共 15 个点、35 个正三角形（包含正立、倒立、边长√3与√7倾斜三角形）。至少去掉几个点？',
        minRemove: 7,
        hint: '根据鸽巢原理，存在 5 个完全互不相交的正三角形，故至少需要 5 个点；深入分析 6 点必有死锁，极值最优解为 7 个点！'
      }
    ],

    // 正三角形分类外观风格
    CATEGORY_STYLES: {
      '边长 1_upright': { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', name: '边长 1 (正立)' },
      '边长 1_inverted': { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', name: '边长 1 (倒立)' },
      '边长 √3 (约1.73)_tilted': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', name: '边长 √3 (倾斜)' },
      '边长 2_upright': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', name: '边长 2 (正立)' },
      '边长 2_inverted': { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', name: '边长 2 (倒立)' },
      '边长 √7 (约2.65)_tilted': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', name: '边长 √7 (倾斜)' },
      '边长 3_upright': { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', name: '边长 3 (正立)' },
      '边长 4_upright': { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', name: '边长 4 (正立大外框)' }
    },

    // 默认高亮色
    FOCUS_COLOR: '#fde047',

    // 本地存储键名
    STORAGE_KEYS: {
      STATE: 'triangle_remove_state_v1',
      HISTORY: 'triangle_remove_history_v1',
      BOOKMARKS: 'triangle_remove_bookmarks_v1',
      SETTINGS: 'triangle_remove_settings_v1'
    }
  };

  root.GAME_CONFIG = GAME_CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
