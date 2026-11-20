// js/components/canvas-anim.js
import { initGridAreaAnim } from '../animations/anim_grid_area.js?v=23';
import { initEpsilonNAnim } from '../animations/anim_epsilon_n.js?v=23';
import { initClusterPointAnim } from '../animations/anim_cluster_point.js?v=23';
import { initLimitSequenceAnim } from '../animations/anim_limit_sequence.js?v=23';
import { initZenoTurtleAnim } from '../animations/anim_zeno_turtle.js?v=23';
import { initBisectionAnim } from '../animations/anim_bisection.js?v=23';
import { initNumberLineZoomAnim } from '../animations/anim_number_line_zoom.js?v=23';
import { initSqueezeTheoremAnim } from '../animations/anim_squeeze_theorem.js?v=23';
import { initEightTheoremsAnim } from '../animations/anim_eight_theorems.js?v=23';
import { initFunctionMachineAnim } from '../animations/anim_function_machine.js?v=23';
import { initSecantTangentAnim } from '../animations/anim_secant_tangent.js?v=23';
import { initFenceAreaAnim } from '../animations/anim_fence_area.js?v=23';
import { initMvtTangentAnim } from '../animations/anim_mvt_tangent.js?v=23';
import { initConcavityAnim } from '../animations/anim_concavity.js?v=23';
import { initIntegralRectsAnim } from '../animations/anim_integral_rects.js?v=23';
import { initAreaMachineAnim } from '../animations/anim_area_machine.js?v=23';
import { initNewtonMethodAnim } from '../animations/anim_newton_method.js?v=23';
import { initCarDashboardAnim } from '../animations/anim_car_dashboard.js?v=23';

export class CanvasAnimWrapper {
  constructor(container, animId) {
    this.container = container;
    this.animId = animId;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="card canvas-container" style="background: var(--color-primary-800); position: relative; padding: var(--space-4);">
        <canvas width="600" height="400" style="width: 100%; height: auto; max-width: 600px; display: block; margin: 0 auto; border-radius: var(--radius-md); background: var(--color-primary-950); box-shadow: inset 0 0 20px rgba(0,0,0,0.5);"></canvas>
      </div>
    `;
    const canvas = this.container.querySelector('canvas');
    
    if (this.animId === 'anim_grid_area') {
        initGridAreaAnim(canvas);
    } else if (this.animId === 'anim_epsilon_n') {
        initEpsilonNAnim(canvas);
    } else if (this.animId === 'anim_cluster_point') {
        initClusterPointAnim(canvas);
    } else if (this.animId === 'anim_limit_sequence') {
        initLimitSequenceAnim(canvas);
    } else if (this.animId === 'anim_zeno_turtle') {
        initZenoTurtleAnim(canvas);
    } else if (this.animId === 'anim_bisection') {
        initBisectionAnim(canvas);
    } else if (this.animId === 'anim_number_line_zoom') {
        initNumberLineZoomAnim(canvas);
    } else if (this.animId === 'anim_squeeze_theorem') {
        initSqueezeTheoremAnim(canvas);
    } else if (this.animId === 'anim_eight_theorems') {
        initEightTheoremsAnim(canvas);
    } else if (this.animId === 'anim_function_machine') {
        initFunctionMachineAnim(canvas);
    } else if (this.animId === 'anim_secant_tangent') {
        initSecantTangentAnim(canvas);
    } else if (this.animId === 'anim_fence_area') {
        initFenceAreaAnim(canvas);
    } else if (this.animId === 'anim_mvt_tangent') {
        initMvtTangentAnim(canvas);
    } else if (this.animId === 'anim_concavity') {
        initConcavityAnim(canvas);
    } else if (this.animId === 'anim_integral_rects') {
        initIntegralRectsAnim(canvas);
    } else if (this.animId === 'anim_area_machine') {
        initAreaMachineAnim(canvas);
    } else if (this.animId === 'anim_newton_method') {
        initNewtonMethodAnim(canvas);
    } else if (this.animId === 'anim_car_dashboard') {
        initCarDashboardAnim(canvas);
    } else {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Animation [${this.animId}] not implemented yet.`, 50, 50);
    }
  }
}
