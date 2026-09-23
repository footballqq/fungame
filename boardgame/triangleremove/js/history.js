// codex: 2026-09-23 本地存储与历史记录管理：玩家做法持久化、作答历史、自定义解法收藏与一键复盘载入
(function(root) {
  'use strict';

  class HistoryStorage {
    constructor() {
      this.STORAGE_KEYS = (window.GAME_CONFIG && window.GAME_CONFIG.STORAGE_KEYS) || {
        STATE: 'triangle_remove_state_v1',
        HISTORY: 'triangle_remove_history_v1',
        BOOKMARKS: 'triangle_remove_bookmarks_v1',
        SETTINGS: 'triangle_remove_settings_v1'
      };
    }

    /**
     * 保存当前棋盘未完成状态
     */
    saveCurrentState(levelId, removedPoints) {
      try {
        const data = {
          levelId: levelId,
          removedPoints: Array.from(removedPoints),
          savedAt: Date.now()
        };
        localStorage.setItem(this.STORAGE_KEYS.STATE, JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage 保存状态失败', e);
      }
    }

    /**
     * 读取上次未完成状态
     */
    loadCurrentState() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEYS.STATE);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

    /**
     * 清空当前草稿状态
     */
    clearCurrentState() {
      try {
        localStorage.removeItem(this.STORAGE_KEYS.STATE);
      } catch (e) {}
    }

    /**
     * 获取全部作答历史列表
     */
    getHistory() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    }

    /**
     * 新增一条作答历史记录
     */
    recordAttempt(record) {
      try {
        const list = this.getHistory();
        const entry = Object.assign({
          id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
          levelId: record.levelId,
          levelTitle: record.levelTitle,
          removedPoints: record.removedPoints,
          removedCount: record.removedPoints.length,
          remainingCount: record.remainingCount,
          isSolved: record.isSolved,
          isOptimal: record.isOptimal
        }, record);

        // 插入头部，保留最新 60 条
        list.unshift(entry);
        if (list.length > 60) list.pop();

        localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(list));
        return entry;
      } catch (e) {
        console.warn('LocalStorage 保存历史失败', e);
        return null;
      }
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
      try {
        localStorage.removeItem(this.STORAGE_KEYS.HISTORY);
      } catch (e) {}
    }

    /**
     * 获取全部收藏解法
     */
    getBookmarks() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEYS.BOOKMARKS);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    }

    /**
     * 收藏玩家当前专属解法
     */
    saveBookmark(title, levelId, levelTitle, removedPoints, note = '') {
      try {
        const list = this.getBookmarks();
        const entry = {
          id: 'bm_' + Date.now(),
          title: title || '我的专属解法',
          levelId: levelId,
          levelTitle: levelTitle,
          removedPoints: Array.from(removedPoints),
          removedCount: removedPoints.length,
          note: note,
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
        };
        list.unshift(entry);
        localStorage.setItem(this.STORAGE_KEYS.BOOKMARKS, JSON.stringify(list));
        return entry;
      } catch (e) {
        console.warn('LocalStorage 保存收藏失败', e);
        return null;
      }
    }

    /**
     * 删除单条收藏
     */
    deleteBookmark(id) {
      try {
        let list = this.getBookmarks();
        list = list.filter(item => item.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.BOOKMARKS, JSON.stringify(list));
        return true;
      } catch (e) {
        return false;
      }
    }

    renderHistoryTable(container) {
      const list = this.getHistory();
      if (!container) return;
      if (list.length === 0) {
        container.innerHTML = '<div class="empty-hint"><p>暂无作答历史，去试着解开谜题吧！</p></div>';
        return;
      }
      let html = '<div class="history-table-wrap"><table class="history-table"><thead><tr><th>时间</th><th>关卡</th><th>移除点数</th><th>剩余三角形</th><th>结果</th><th>操作</th></tr></thead><tbody>';
      list.forEach(item => {
        const resText = item.isOptimal ? '🌟 极值最优' : (item.isSolved ? '✅ 消除成功' : `⚡ 剩 ${item.remainingCount} 个`);
        html += `
          <tr>
            <td>${item.timestamp}</td>
            <td>${item.levelTitle || `关卡 ${item.levelId}`}</td>
            <td><strong>${item.removedCount}</strong> 个</td>
            <td>${item.remainingCount}</td>
            <td>${resText}</td>
            <td><button class="btn btn-sm btn-subtle" onclick='window.gameUI.loadHistoricalAttempt(${JSON.stringify(item.removedPoints)})'>载入棋盘</button></td>
          </tr>
        `;
      });
      html += '</tbody></table></div>';
      container.innerHTML = html;
    }

    renderBookmarks(container) {
      const list = this.getBookmarks();
      if (!container) return;
      if (list.length === 0) {
        container.innerHTML = '<div class="empty-hint"><p>尚未收藏任何解法。点击棋盘下方的“⭐ 收藏当前解法”即可保存！</p></div>';
        return;
      }
      let html = '<div class="bookmark-cards">';
      list.forEach(bm => {
        html += `
          <div class="bm-card">
            <div class="bm-header">
              <h4>${bm.title}</h4>
              <span class="bm-badge">${bm.removedCount} 点解法</span>
            </div>
            <p class="bm-date">${bm.createdAt} · ${bm.levelTitle}</p>
            <div class="bm-actions">
              <button class="btn btn-sm btn-primary" onclick='window.gameUI.loadHistoricalAttempt(${JSON.stringify(bm.removedPoints)})'>载入棋盘</button>
              <button class="btn btn-sm btn-danger" onclick="window.gameUI.deleteBookmark('${bm.id}')">删除</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
      container.innerHTML = html;
    }
  }

  root.HistoryStorage = HistoryStorage;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HistoryStorage };
  }
})(typeof window !== 'undefined' ? window : globalThis);
