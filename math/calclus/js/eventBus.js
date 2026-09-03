// eventBus.js
/**
 * 简易的事件总线，用于跨模块通信，解耦组件。
 */
class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * 订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} callback 回调函数
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  /**
   * 取消订阅
   * @param {string} eventName 事件名称
   * @param {Function} callback 回调函数
   */
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }

  /**
   * 触发事件
   * @param {string} eventName 事件名称
   * @param {any} data 传递的数据
   */
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventBus();
