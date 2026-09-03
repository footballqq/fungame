/**
 * Canvas 动画组件注册中心与生命周期管理器
 */
import { initModuloClock } from './animations/modulo_clock.js';
import { initCongruenceCalc } from './animations/congruence_calc.js';
import { initPowerOrbit } from './animations/power_orbit.js';
import { initCrtGears } from './animations/crt_gears.js';
import { initResidueDrawers } from './animations/residue_drawers.js';

const ANIM_REGISTRY = {
  anim_modulo_clock: initModuloClock,
  anim_congruence_calc: initCongruenceCalc,
  anim_power_orbit: initPowerOrbit,
  anim_crt_gears: initCrtGears,
  anim_residue_drawers: initResidueDrawers
};

let activeInstance = null;

export function mountCanvasAnimation(container, animId) {
  // 销毁上一个活跃动画实例
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
    activeInstance = null;
  }

  const factory = ANIM_REGISTRY[animId];
  if (typeof factory === 'function') {
    activeInstance = factory(container);
    return activeInstance;
  } else {
    console.warn(`[CanvasAnim] Animation ID "${animId}" not found in registry.`);
    container.innerHTML = `
      <div class="canvas-anim-wrapper" style="text-align: center; padding: 40px;">
        <p style="color: var(--text-muted);">互动模拟器 [${animId}] 正在加载中...</p>
      </div>
    `;
    return null;
  }
}
