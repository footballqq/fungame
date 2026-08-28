// codex: 2026-08-28 教学引导核心控制器，管理答题状态、自适应难度与主视图双向联动

import { QUESTION_BANK } from './questions.js';
import { getEnumeration } from './enumerate.js';
import {
    renderEnumerationCardsHtml,
    renderConceptModalHtml,
    renderComparisonToastContent
} from './teaching_view.js';

export class TeachingManager {
    /**
     * @param {Object} options
     * @param {Function} options.onSyncParams 同步参数到主界面
     * @param {Function} options.onSwitchMode 切换模型回调
     */
    constructor(options = {}) {
        this.onSyncParams = options.onSyncParams || (() => {});
        this.onSwitchMode = options.onSwitchMode || (() => {});

        this.currentMode = 'DD'; // 默认从最直观的 DD 模型开始
        this.isExpanded = true;
        this.showConceptModal = false;

        this.progress = {
            DD: { level: 1, state: 'unanswered', selectedId: null, attempts: 0 },
            ID: { level: 1, state: 'unanswered', selectedId: null, attempts: 0 },
            DI: { level: 1, state: 'unanswered', selectedId: null, attempts: 0 },
            II: { level: 1, state: 'unanswered', selectedId: null, attempts: 0 }
        };

        this.container = null;
    }

    mount(containerElement) {
        this.container = containerElement;
        this.render();
    }

    setMode(mode, previousMode = null) {
        if (!QUESTION_BANK[mode]) return;
        this.currentMode = mode;
        this.render();

        if (previousMode && previousMode !== mode) {
            this.showComparisonNotice(previousMode, mode);
        }
    }

    getCurrentQuestion() {
        const bank = QUESTION_BANK[this.currentMode];
        const state = this.progress[this.currentMode];
        const levelIdx = Math.max(0, Math.min(bank.levels.length - 1, state.level - 1));
        return bank.levels[levelIdx];
    }

    submitAnswer(optionId) {
        const question = this.getCurrentQuestion();
        const selectedOpt = question.options.find(o => o.id === optionId);
        if (!selectedOpt) return;

        const state = this.progress[this.currentMode];
        state.selectedId = optionId;
        state.attempts += 1;

        if (selectedOpt.isCorrect) {
            state.state = 'correct';
            this.onSyncParams(question.n, question.m);
        } else {
            state.state = 'wrong';
        }

        this.render();
    }

    nextLevel() {
        const bank = QUESTION_BANK[this.currentMode];
        const state = this.progress[this.currentMode];

        if (state.level < bank.levels.length) {
            state.level += 1;
            state.state = 'unanswered';
            state.selectedId = null;
            state.attempts = 0;
            const nextQ = this.getCurrentQuestion();
            this.onSyncParams(nextQ.n, nextQ.m);
        } else {
            state.state = 'completed';
        }
        this.render();
    }

    retryCurrentLevel() {
        const state = this.progress[this.currentMode];
        state.state = 'unanswered';
        state.selectedId = null;
        this.render();
    }

    restartModel() {
        this.progress[this.currentMode] = {
            level: 1,
            state: 'unanswered',
            selectedId: null,
            attempts: 0
        };
        const q = this.getCurrentQuestion();
        this.onSyncParams(q.n, q.m);
        this.render();
    }

    render() {
        if (!this.container) return;

        const bank = QUESTION_BANK[this.currentMode];
        const state = this.progress[this.currentMode];
        const question = this.getCurrentQuestion();

        if (!this.isExpanded) {
            this.container.innerHTML = `
                <div class="teaching-collapsed-bar" id="teaching-toggle-btn">
                    <span class="teaching-icon">📚</span>
                    <span class="teaching-title">教学引导：${bank.nameZh} (关卡 ${state.level}/3)</span>
                    <button class="teaching-expand-btn">点击展开探索 ▼</button>
                </div>
            `;
            const toggleBtn = document.getElementById('teaching-toggle-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    this.isExpanded = true;
                    this.render();
                });
            }
            return;
        }

        const levelBadges = [1, 2, 3].map(lvl => {
            let cls = 'level-dot';
            if (lvl < state.level) cls += ' passed';
            else if (lvl === state.level) cls += ' active';
            return `<span class="${cls}">L${lvl}</span>`;
        }).join('');

        const selectedOpt = question.options.find(o => o.id === state.selectedId);

        const optionsHtml = question.options.map(opt => {
            let btnClass = 'quiz-opt-btn';
            if (state.state !== 'unanswered') {
                if (opt.id === state.selectedId) {
                    btnClass += opt.isCorrect ? ' opt-correct' : ' opt-wrong';
                } else if (opt.isCorrect && (state.state === 'correct' || state.state === 'revealed')) {
                    btnClass += ' opt-correct';
                }
            } else if (state.selectedId === opt.id) {
                btnClass += ' opt-selected';
            }

            const disabled = (state.state === 'correct' || state.state === 'revealed') ? 'disabled' : '';
            return `
                <button class="${btnClass}" data-opt-id="${opt.id}" ${disabled}>
                    <span class="opt-id">${opt.id}</span>
                    <span class="opt-text">${opt.text}</span>
                </button>
            `;
        }).join('');

        let feedbackHtml = '';
        if (state.state === 'wrong' && selectedOpt) {
            feedbackHtml = `
                <div class="quiz-feedback feedback-wrong animate-pop">
                    <div class="feedback-header">
                        <span class="feedback-icon">❌</span>
                        <strong>再想想看...</strong>
                    </div>
                    <p class="feedback-hint">${selectedOpt.hint}</p>
                    <div class="feedback-actions">
                        <button class="btn-action btn-retry" id="quiz-retry-btn">🔄 重新选择</button>
                        <button class="btn-action btn-reveal" id="quiz-reveal-btn">📖 看解析与全枚举</button>
                    </div>
                </div>
            `;
        } else if (state.state === 'correct' || state.state === 'revealed') {
            const enums = getEnumeration(this.currentMode, question.n, question.m);
            const enumListHtml = renderEnumerationCardsHtml(enums, this.currentMode);
            const nextBtnText = state.level < 3 ? `下一关：Level ${state.level + 1} 🚀` : '🎉 恭喜通关！探索矩阵工具';

            feedbackHtml = `
                <div class="quiz-feedback feedback-correct animate-pop">
                    <div class="feedback-header">
                        <span class="feedback-icon">✅</span>
                        <strong>${selectedOpt && selectedOpt.isCorrect ? '回答完全正确！' : '解析已解锁'}</strong>
                    </div>
                    <p class="feedback-exp">${question.explanation}</p>
                    <div class="feedback-takeaway">${question.takeaway}</div>

                    <div class="enum-preview-section">
                        <div class="enum-preview-title">
                            <span>📋 本题全部 ${enums.length} 种分配方案穷举：</span>
                            <button class="btn-sync-params" id="sync-current-params-btn" title="将此题数字放入右侧演示区">
                                🔍 演示区联动 (n=${question.n}, m=${question.m})
                            </button>
                        </div>
                        <div class="enum-cards-scroll">
                            ${enumListHtml}
                        </div>
                    </div>

                    <div class="feedback-actions">
                        ${state.level < 3 ? `
                            <button class="btn-action btn-next" id="quiz-next-btn">${nextBtnText}</button>
                        ` : `
                            <button class="btn-action btn-finish" id="quiz-restart-btn">🔄 重新挑战本模型</button>
                        `}
                    </div>
                </div>
            `;
        }

        this.container.innerHTML = `
            <div class="teaching-card card">
                <div class="teaching-header">
                    <div class="teaching-title-row">
                        <span class="teaching-badge">💡 互动引导</span>
                        <h3>${bank.nameZh} · ${question.title}</h3>
                        <div class="level-indicator">${levelBadges}</div>
                    </div>
                    <div class="teaching-controls">
                        <button class="btn-text" id="concept-quick-view-btn" title="查看球同/异、盒同/异定义">
                            🔍 概念速查
                        </button>
                        <button class="btn-icon" id="teaching-toggle-btn" title="收起面板">▲</button>
                    </div>
                </div>

                <div class="teaching-body">
                    <div class="story-box">
                        <p class="story-text">${question.story}</p>
                    </div>

                    <div class="question-box">
                        <p class="question-text">❓ <strong>${question.question}</strong></p>
                        <div class="quiz-options-grid">${optionsHtml}</div>
                    </div>

                    ${feedbackHtml}
                </div>
            </div>

            ${renderConceptModalHtml(this.showConceptModal)}
            <div id="comparison-toast" class="comparison-toast hidden"></div>
        `;

        this.bindEvents();
    }

    showComparisonNotice(fromMode, toMode) {
        const toast = document.getElementById('comparison-toast');
        if (!toast) return;

        const content = renderComparisonToastContent(fromMode, toMode);
        if (!content) return;

        toast.innerHTML = content;
        toast.classList.remove('hidden');
        toast.classList.add('visible');

        const closeBtn = document.getElementById('toast-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('visible');
                toast.classList.add('hidden');
            });
        }

        setTimeout(() => {
            if (toast) {
                toast.classList.remove('visible');
                toast.classList.add('hidden');
            }
        }, 7000);
    }

    bindEvents() {
        const toggleBtn = document.getElementById('teaching-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.isExpanded = !this.isExpanded;
                this.render();
            });
        }

        const conceptBtn = document.getElementById('concept-quick-view-btn');
        if (conceptBtn) {
            conceptBtn.addEventListener('click', () => {
                this.showConceptModal = true;
                this.render();
            });
        }

        const closeConceptBtn = document.getElementById('close-concept-modal-btn');
        if (closeConceptBtn) {
            closeConceptBtn.addEventListener('click', () => {
                this.showConceptModal = false;
                this.render();
            });
        }

        const backdrop = document.getElementById('concept-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.showConceptModal = false;
                    this.render();
                }
            });
        }

        const optBtns = this.container.querySelectorAll('.quiz-opt-btn');
        optBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.submitAnswer(btn.dataset.optId);
            });
        });

        const retryBtn = document.getElementById('quiz-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryCurrentLevel());
        }

        const revealBtn = document.getElementById('quiz-reveal-btn');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => {
                const state = this.progress[this.currentMode];
                state.state = 'revealed';
                const q = this.getCurrentQuestion();
                this.onSyncParams(q.n, q.m);
                this.render();
            });
        }

        const nextBtn = document.getElementById('quiz-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextLevel());
        }

        const restartBtn = document.getElementById('quiz-restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartModel());
        }

        const syncParamsBtn = document.getElementById('sync-current-params-btn');
        if (syncParamsBtn) {
            syncParamsBtn.addEventListener('click', () => {
                const q = this.getCurrentQuestion();
                this.onSyncParams(q.n, q.m);
            });
        }
    }
}
