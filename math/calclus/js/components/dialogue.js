// js/components/dialogue.js

export class DialogueBox {
  /**
   * @param {HTMLElement} container 
   * @param {Array<{role: 'sister'|'younger', text: string}>} messages 
   * @param {Function} onComplete
   */
  constructor(container, messages, onComplete) {
    this.container = container;
    this.messages = messages;
    this.currentIndex = 0;
    this.onComplete = onComplete;
    this.isCompleted = false;

    this.renderInitial();
  }

  renderInitial() {
    this.container.innerHTML = `
      <div class="dialogue-box" aria-live="polite">
        <div class="messages-container"></div>
        <div class="dialogue-action">
          <button class="btn btn-continue">点击继续 ▼</button>
        </div>
      </div>
    `;
    this.messagesContainer = this.container.querySelector('.messages-container');
    this.actionContainer = this.container.querySelector('.dialogue-action');
    this.continueBtn = this.container.querySelector('.btn-continue');
    
    this.continueBtn.addEventListener('click', () => this.showNext());
    
    // 显示第一条
    this.showNext();
  }

  showNext() {
    if (this.currentIndex >= this.messages.length) {
      return;
    }

    const msg = this.messages[this.currentIndex];
    
    const msgEl = document.createElement('div');
    msgEl.className = `dialogue-message role-${msg.role} visible`;
    // For local dev, use emoji instead of image if image is missing
    const avatar = msg.role === 'sister' ? '👩' : '👧';
    
    let htmlText = msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    msgEl.innerHTML = `
      <div class="dialogue-avatar" style="font-size: 32px; background: var(--color-primary-800); border-radius: 50%; width: 48px; height: 48px; display:flex; align-items:center; justify-content:center; border: 2px solid ${msg.role === 'sister' ? 'var(--color-sister-border)' : 'var(--color-younger-border)'}">${avatar}</div>
      <div class="dialogue-bubble">${htmlText}</div>
    `;
    
    this.messagesContainer.appendChild(msgEl);
    
    // Render KaTeX in this new element if available
    if (window.renderMathInElement) {
      window.renderMathInElement(msgEl, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false
      });
    }

    this.currentIndex++;

    // Scroll into view gently
    setTimeout(() => {
        if (this.currentIndex < this.messages.length) {
            this.continueBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 50);

    if (this.currentIndex >= this.messages.length) {
      this.actionContainer.style.display = 'none';
      this.isCompleted = true;
      if (this.onComplete) this.onComplete();
    }
  }
}
