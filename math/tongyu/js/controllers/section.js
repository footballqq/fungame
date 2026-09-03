/**
 * 核心章节流程与 Block 动态状态机控制器 (Section Controller)
 */
import { mountCanvasAnimation } from '../canvas-anim.js';
import { renderQuizBlock } from './quiz.js';

// 动态载入 12 讲章节脚本
import { Chapter1Script } from '../data/script_chapter_1.js';
import { Chapter2Script } from '../data/script_chapter_2.js';
import { Chapter3Script } from '../data/script_chapter_3.js';
import { Chapter4Script } from '../data/script_chapter_4.js';
import { Chapter5Script } from '../data/script_chapter_5.js';
import { Chapter6Script } from '../data/script_chapter_6.js';
import { Chapter7Script } from '../data/script_chapter_7.js';
import { Chapter8Script } from '../data/script_chapter_8.js';
import { Chapter9Script } from '../data/script_chapter_9.js';
import { Chapter10Script } from '../data/script_chapter_10.js';
import { Chapter11Script } from '../data/script_chapter_11.js';
import { Chapter12Script } from '../data/script_chapter_12.js';

const SCRIPT_REGISTRY = {
  chapter_1: Chapter1Script,
  chapter_2: Chapter2Script,
  chapter_3: Chapter3Script,
  chapter_4: Chapter4Script,
  chapter_5: Chapter5Script,
  chapter_6: Chapter6Script,
  chapter_7: Chapter7Script,
  chapter_8: Chapter8Script,
  chapter_9: Chapter9Script,
  chapter_10: Chapter10Script,
  chapter_11: Chapter11Script,
  chapter_12: Chapter12Script
};

export class SectionController {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('blocks-container');
    this.nextBtn = options.nextBtn || document.getElementById('btn-next-block');
    this.currentChapterId = null;
    this.currentBlocks = [];
    this.currentBlockIndex = 0;
    this.isRendering = false;

    this.initEvents();
  }

  initEvents() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.renderNextBlock();
      });
    }
  }

  loadSection(chapterId) {
    this.currentChapterId = chapterId;
    const scriptModule = SCRIPT_REGISTRY[chapterId];
    if (!scriptModule) {
      console.error(`[SectionController] Script for chapter "${chapterId}" not found.`);
      return;
    }

    // 获取小节数据
    const secKey = Object.keys(scriptModule)[0];
    const secData = scriptModule[secKey];

    this.currentBlocks = secData.blocks || [];
    this.currentBlockIndex = 0;

    // 清空视口容器
    this.container.innerHTML = '';
    this.updateNextButtonState(true);

    // 渲染第一个 Block
    this.renderNextBlock();
  }

  renderNextBlock() {
    if (this.currentBlockIndex >= this.currentBlocks.length) {
      this.updateNextButtonState(false);
      return;
    }

    const block = this.currentBlocks[this.currentBlockIndex];
    this.currentBlockIndex++;

    const blockWrapper = document.createElement('div');
    blockWrapper.className = 'block-fade-in';

    switch (block.type) {
      case 'story':
        this.renderStoryBlock(blockWrapper, block);
        break;

      case 'dialogue':
        this.renderDialogueBlock(blockWrapper, block);
        break;

      case 'concept':
        this.renderConceptBlock(blockWrapper, block);
        break;

      case 'canvas':
        this.renderCanvasBlock(blockWrapper, block);
        break;

      case 'example':
        this.renderExampleBlock(blockWrapper, block);
        break;

      case 'quiz':
        this.renderQuizBlockType(blockWrapper, block);
        break;

      default:
        console.warn(`[SectionController] Unknown block type: ${block.type}`);
        this.renderNextBlock();
        return;
    }

    this.container.appendChild(blockWrapper);

    // 全局 KaTeX 数学公式渲染
    this.triggerMathJaxKatex(blockWrapper);

    // 平滑滚动至最新 Block
    blockWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // 如果到达最后一块，更新按钮文字
    if (this.currentBlockIndex >= this.currentBlocks.length) {
      this.updateNextButtonState(false);
    }
  }

  renderStoryBlock(el, block) {
    el.innerHTML = `
      <div class="story-card">
        <div class="story-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <span>背景探索 & 思想故事</span>
        </div>
        <div class="story-paragraphs">
          ${(block.paragraphs || []).map(p => `<p>${p}</p>`).join('')}
        </div>
      </div>
    `;
  }

  renderDialogueBlock(el, block) {
    const messages = block.messages || [];
    el.innerHTML = `
      <div class="dialogue-wrapper">
        ${messages.map(m => {
          const isSister = (m.role === 'sister');
          return `
            <div class="dialogue-bubble-row ${isSister ? 'sister' : 'younger'}">
              <div class="avatar-badge ${isSister ? 'avatar-sister' : 'avatar-younger'}">
                ${isSister ? '姐' : '妹'}
              </div>
              <div class="dialogue-bubble">
                <div class="dialogue-speaker-name">${isSister ? '姐姐 Sister' : '妹妹 Younger'}</div>
                <div class="dialogue-text">${m.text}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderConceptBlock(el, block) {
    const color = block.color || 'green';
    let icon = '✅';
    let tagText = '数学定理';
    if (color === 'blue') { icon = '💡'; tagText = '易错辨析'; }
    else if (color === 'orange') { icon = '🔥'; tagText = '核心直觉'; }
    else if (color === 'gray') { icon = '📜'; tagText = '数学史话'; }

    el.innerHTML = `
      <div class="concept-card ${color}">
        <div class="concept-header">
          <div class="concept-title-group">
            <span class="concept-icon">${icon}</span>
            <span class="concept-title">${block.title || '核心概念'}</span>
          </div>
          <span class="example-tag" style="background: rgba(255,255,255,0.08); font-size: 0.75rem;">${tagText}</span>
        </div>
        <div class="concept-content">
          ${(block.content || []).map(line => `<p>${line}</p>`).join('')}
        </div>
      </div>
    `;
  }

  renderCanvasBlock(el, block) {
    mountCanvasAnimation(el, block.animId);
  }

  renderExampleBlock(el, block) {
    el.innerHTML = `
      <div class="example-card" id="${block.id || ''}">
        <div class="example-header">
          <div class="example-title-box">
            <span class="example-tag">${block.difficulty || '★★'}</span>
            <span class="example-title">${block.title || '【母题精析】'}</span>
          </div>
        </div>

        <div class="example-question-box">
          ${block.question || ''}
        </div>

        ${block.guide && block.guide.length > 0 ? `
          <div class="example-guide-section">
            <div class="example-guide-title">💭 姐妹思维点拨</div>
            <div class="dialogue-wrapper" style="gap: 10px;">
              ${block.guide.map(g => {
                const isSister = (g.role === 'sister');
                return `
                  <div class="dialogue-bubble-row ${isSister ? 'sister' : 'younger'}">
                    <div class="avatar-badge ${isSister ? 'avatar-sister' : 'avatar-younger'}" style="width: 34px; height: 34px; font-size: 0.82rem;">
                      ${isSister ? '姐' : '妹'}
                    </div>
                    <div class="dialogue-bubble" style="padding: 10px 16px; font-size: 0.94rem;">
                      <div class="dialogue-speaker-name">${isSister ? '姐姐 Sister' : '妹妹 Younger'}</div>
                      <div>${g.text}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <div class="example-solution-box">
          <div class="example-solution-title">📐 规范严密证明与解答</div>
          <div class="example-solution-body">
            ${(block.solution || []).map(s => `<p>${s}</p>`).join('')}
          </div>
        </div>

        ${block.summary ? `
          <div class="example-summary-box">
            <strong>💡 名师点穴：</strong>${block.summary}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderQuizBlockType(el, block) {
    renderQuizBlock(el, block.quizIds || [], () => {
      // 完成答题后的回调
    });
  }

  triggerMathJaxKatex(element) {
    if (window.renderMathInElement) {
      window.renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }

  updateNextButtonState(hasMore) {
    if (!this.nextBtn) return;
    if (hasMore) {
      this.nextBtn.innerHTML = `
        <span>继续探索</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      `;
      this.nextBtn.classList.add('btn-primary', 'btn-pulse');
      this.nextBtn.classList.remove('btn-secondary');
    } else {
      this.nextBtn.innerHTML = `
        <span>本讲内容已完成 🎉</span>
      `;
      this.nextBtn.classList.remove('btn-pulse');
      this.nextBtn.classList.add('btn-secondary');
    }
  }
}
