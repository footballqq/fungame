// codex: 2026-08-28 教学引导界面 HTML 模板与卡片渲染视图模块

import { CONCEPT_DEFINITIONS, BENCHMARK_3_2_COMPARISON } from './questions.js';

/**
 * 渲染全枚举卡片
 */
export function renderEnumerationCardsHtml(enums, mode) {
    if (!enums || enums.length === 0) return '<div class="enum-empty">无方案</div>';

    const displayList = enums.slice(0, 20);

    const cards = displayList.map(item => {
        let detail = '';
        if (mode === 'DD') {
            detail = item.boxes.map((box, bIdx) => {
                const balls = box.map(b => `<span class="mini-ball distinct-ball ball-c${b}">${b}</span>`).join('');
                return `<span class="mini-box"><small>盒${bIdx + 1}:</small>${balls || '<i>空</i>'}</span>`;
            }).join('');
        } else if (mode === 'ID') {
            detail = item.counts.map((cnt, bIdx) => {
                const balls = Array(cnt).fill('<span class="mini-ball ident-ball">●</span>').join('');
                return `<span class="mini-box"><small>盒${bIdx + 1}:</small>${balls || '<i>空</i>'}(${cnt})</span>`;
            }).join('');
        } else if (mode === 'DI') {
            detail = item.parts.map(p => {
                const balls = p.map(b => `<span class="mini-ball distinct-ball ball-c${b}">${b}</span>`).join('');
                return `<span class="mini-group">{${balls}}</span>`;
            }).join(' + ');
            if (!detail) detail = '<i>{空}</i>';
        } else if (mode === 'II') {
            detail = item.partition.map(cnt => {
                return `<span class="mini-part"><span class="badge-num">${cnt}</span></span>`;
            }).join(' + ');
        }

        return `
            <div class="enum-chip">
                <span class="enum-chip-idx">#${item.index}</span>
                <div class="enum-chip-content">${detail}</div>
            </div>
        `;
    }).join('');

    if (enums.length > 20) {
        return cards + `<div class="enum-more">... 共有 ${enums.length} 种分法</div>`;
    }
    return cards;
}

/**
 * 渲染概念速查弹窗
 */
export function renderConceptModalHtml(showModal) {
    if (!showModal) return '';

    return `
        <div class="modal-overlay" id="concept-modal-backdrop">
            <div class="modal-card animate-pop">
                <div class="modal-header">
                    <h4>📖 组合数学：球与盒子 核心概念速查</h4>
                    <button class="btn-close" id="close-concept-modal-btn">✕</button>
                </div>
                <div class="modal-body">
                    <div class="concept-grid">
                        <div class="concept-block">
                            <h5>球的性质 (Balls)</h5>
                            ${CONCEPT_DEFINITIONS.balls.map(b => `
                                <div class="concept-item">
                                    <div class="concept-badge">${b.badge}</div>
                                    <p><strong>${b.title}</strong>：${b.story}</p>
                                </div>
                            `).join('')}
                        </div>
                        <div class="concept-block">
                            <h5>盒子的性质 (Boxes)</h5>
                            ${CONCEPT_DEFINITIONS.boxes.map(b => `
                                <div class="concept-item">
                                    <div class="concept-badge">${b.badge}</div>
                                    <p><strong>${b.title}</strong>：${b.story}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="benchmark-summary">
                        <h5>🌟 黄金基准：3 个球放入 2 个盒子 (4 种模型横向对比)</h5>
                        <div class="benchmark-grid">
                            <div class="bm-card dd"><strong>球异 盒异</strong><br>2³ = <b>8 种</b><br><small>每球自由选择</small></div>
                            <div class="bm-card id"><strong>球同 盒异</strong><br>C(4,1) = <b>4 种</b><br><small>只看各盒分几个</small></div>
                            <div class="bm-card di"><strong>球异 盒同</strong><br>1+3 = <b>4 种</b><br><small>无序分组装袋</small></div>
                            <div class="bm-card ii"><strong>球同 盒同</strong><br>p(3,2) = <b>2 种</b><br><small>[3] 或 [2+1]</small></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 渲染模型切换提示内容
 */
export function renderComparisonToastContent(fromMode, toMode) {
    const fromCase = BENCHMARK_3_2_COMPARISON.cases[fromMode];
    const toCase = BENCHMARK_3_2_COMPARISON.cases[toMode];
    if (!fromCase || !toCase) return '';

    return `
        <div class="toast-content">
            <div class="toast-title">💡 模型切换对比（以 3 球 2 盒 为例）</div>
            <div class="toast-desc">
                从 <b>${fromCase.title}</b> (${fromCase.count} 种) 切换到 <b>${toCase.title}</b> (<b>${toCase.count} 种</b>)。
            </div>
            <div class="toast-reason">${toCase.explanation}</div>
            <button class="toast-btn-close" id="toast-close-btn">我知道了 ✓</button>
        </div>
    `;
}
