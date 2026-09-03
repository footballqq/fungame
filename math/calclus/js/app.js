// app.js
import { Store } from './state.js?v=23';
import { eventBus } from './eventBus.js?v=23';
import { router } from './router.js?v=23';

class App {
  constructor() {
    this.init();
  }

  init() {
    // 更新最后访问时间及连续登陆天数
    Store.updateLastVisit();
    
    // 初始化 UI 组件监听
    this.bindGlobalEvents();
    this.updateNavbarXP(Store.getCurrentUser()?.totalXP || 0);

    // 检查是否有活跃用户，如果没有则导向用户管理或新建弹窗
    if (!Store.getCurrentUser()) {
      window.location.hash = '/users';
    }
  }

  bindGlobalEvents() {
    // 监听分数更新，更新导航栏
    eventBus.on('SCORE_UPDATED', (newXP) => {
      this.updateNavbarXP(newXP);
    });

    // 监听全局提示 (Toast)
    eventBus.on('SHOW_TOAST', (data) => {
      this.showToast(data.message, data.type);
    });

    // 监听成就解锁
    eventBus.on('ACHIEVEMENT_UNLOCKED', (achievementId) => {
      this.showToast(`🏅 新成就解锁！`, 'success');
    });
  }

  updateNavbarXP(xp) {
    const xpElement = document.getElementById('nav-xp');
    if (xpElement) {
      xpElement.innerText = xp;
      // 触发一点缩放动画
      xpElement.parentElement.style.animation = 'pulse-glow 0.5s ease-out';
      setTimeout(() => {
        xpElement.parentElement.style.animation = '';
      }, 500);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `achievement-toast toast-${type}`;
    
    let icon = '💡';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-text">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideUpFade 0.5s ease-in reverse forwards';
      setTimeout(() => {
        if(container.contains(toast)) container.removeChild(toast);
      }, 500);
    }, 3000);
  }
}

// 启动应用
window.showConfirmModal = function(title, text, onConfirm) {
  const container = document.getElementById('modal-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="modal-dialog">
      <h2 class="modal-title">${title}</h2>
      <p class="modal-text">${text}</p>
      <div class="modal-actions">
        <button class="btn" id="btn-modal-cancel" style="background-color: transparent; border: 1px solid var(--color-primary-600);">取消</button>
        <button class="btn" id="btn-modal-confirm" style="background-color: var(--color-wrong); border: none;">确定</button>
      </div>
    </div>
  `;
  
  container.classList.remove('hidden');
  
  const close = () => {
    container.classList.add('hidden');
    container.innerHTML = '';
  };
  
  document.getElementById('btn-modal-cancel').onclick = close;
  document.getElementById('btn-modal-confirm').onclick = () => {
    close();
    onConfirm();
  };
};

document.addEventListener('DOMContentLoaded', () => {
  window.mathPlanetApp = new App();
});
