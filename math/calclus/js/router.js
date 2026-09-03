// router.js
import { Store } from './state.js?v=23';
import { eventBus } from './eventBus.js?v=23';

const routes = {
  '/': 'views/home.html',
  '/toc': 'views/toc.html',
  '/chapter/:id': 'views/chapter.html',
  '/chapter/:id/section/:sid': 'views/section.html',
  '/exam/:id': 'views/exam.html',
  '/profile': 'views/profile.html',
  '/users': 'views/users.html',
  '/glossary': 'views/glossary.html',
  '/generator': 'views/generator.html'
};

class Router {
  constructor() {
    this.appRoot = document.getElementById('app-root');
    this.currentView = null;
    
    window.addEventListener('hashchange', this.handleRouteChange.bind(this));
    window.addEventListener('load', this.handleRouteChange.bind(this));
  }

  matchRoute(hash) {
    let path = hash.replace('#', '') || '/';
    // Remove query params if any
    path = path.split('?')[0];

    for (const [routePath, templatePath] of Object.entries(routes)) {
      const routeParts = routePath.split('/');
      const pathParts = path.split('/');

      if (routeParts.length !== pathParts.length) continue;

      let match = true;
      let params = {};

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          params[routeParts[i].substring(1)] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return { templatePath, params, path };
      }
    }
    return { templatePath: routes['/'], params: {}, path: '/' };
  }

  async handleRouteChange() {
    const route = this.matchRoute(window.location.hash);
    
    // 路由守卫检查
    if (!this.checkGuards(route)) return;

    this.showLoading();

    try {
      // 模拟或者真实的 fetch 模板
      const html = await this.fetchTemplate(route.templatePath);
      this.appRoot.innerHTML = html;
      this.initView(route);
    } catch (e) {
      console.error('Failed to load view:', e);
      this.appRoot.innerHTML = '<div class="error-view"><h3>页面加载失败</h3><a href="#/" class="btn">返回基地</a></div>';
    }
  }

  checkGuards(route) {
    if (route.path.startsWith('/chapter/')) {
      const chapterId = route.params.id;
      const state = Store.getChapterState(chapterId);
      if (state && state.status === 'locked') {
        eventBus.emit('SHOW_TOAST', { message: '星区未解锁，请先完成前置任务！', type: 'error' });
        window.location.hash = '/';
        return false;
      }
    }
    return true;
  }

  async fetchTemplate(path) {
    // 真实环境中使用 fetch，这里可以为了本地无服务器测试使用内联或者兜底
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(path + '?v=' + timestamp);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.text();
    } catch (e) {
      // 兜底的空页面提示，方便当前开发
      return `<div style="text-align: center; padding: 50px;">
                <h2>视图 ${path} 尚未实现</h2>
                <p>建设中...</p>
              </div>`;
    }
  }

  showLoading() {
    this.appRoot.innerHTML = '<div class="loading-spinner">正在准备星际跃迁...</div>';
  }

  async initView(route) {
    // 触发渲染完成后的脚本执行、KaTeX渲染等
    if (window.renderMathInElement) {
      window.renderMathInElement(this.appRoot, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        output: 'html',
        throwOnError: false
      });
    }
    eventBus.emit('VIEW_LOADED', route);
    
    // 动态加载并执行对应的控制器
    const controllerMap = {
      'views/home.html': './controllers/home.js?v=23',
      'views/toc.html': './controllers/toc.js?v=23',
      'views/chapter.html': './controllers/chapter.js?v=23',
      'views/section.html': './controllers/section.js?v=23',
      'views/exam.html': './controllers/exam.js?v=23',
      'views/profile.html': './controllers/profile.js?v=23',
      'views/users.html': './controllers/users.js?v=23',
      'views/generator.html': './controllers/generator.js?v=23',
    };
    
    const controllerPath = controllerMap[route.templatePath];
    if (controllerPath) {
      try {
        const module = await import(controllerPath);
        if (module.init) {
          module.init();
        }
      } catch (err) {
        console.error('Failed to load controller', controllerPath, err);
      }
    }
  }
}

export const router = new Router();
