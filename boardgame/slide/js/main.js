// codex: 2026-09-14 游戏入口主脚本，初始化游戏状态机、AI、音频与 UI 管理器
import { IceSkatingGame } from './game.js';
import { IceSkatingAI } from './ai.js';
import { AudioManager } from './audio.js';
import { UIManager } from './ui.js';

function init() {
  const game = new IceSkatingGame();
  const ai = new IceSkatingAI('medium');
  const audio = new AudioManager();
  const ui = new UIManager(game, ai, audio);

  // 挂载到全局方便调试与自动化测试验证
  window.__SLIDE_GAME__ = {
    game,
    ai,
    audio,
    ui
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
