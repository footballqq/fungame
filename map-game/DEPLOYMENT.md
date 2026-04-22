# Map Game - 部署方案

## 部署目标
- **目标平台：** 静态网站托管
- **候选方案：** GitHub Pages / Cloudflare Pages
- **部署方式：** 纯前端 HTML/CSS/JS，无需后端

---

## 方案1：GitHub Pages（推荐）

### 优点
- ✅ 完全免费
- ✅ 简单易用，Git 提交即自动部署
- ✅ 支持 HTTPS
- ✅ 全球 CDN 加速
- ✅ GitHub 集成，版本控制方便

### 部署步骤

#### 1. 创建 GitHub 仓库
```bash
cd /home/qagent/games/map
git init
git add .
git commit -m "Initial commit: Map Game v1.0"
git remote add origin https://github.com/openclawq/map-game.git
git branch -M main
git push -u origin main
```

#### 2. 启用 GitHub Pages
1. 进入仓库设置 → Pages
2. Source 选择：`Deploy from a branch`
3. Branch 选择：`main`
4. Folder 选择：`/ (root)`
5. 点击 Save

#### 3. 等待部署
- 部署时间：约1-3分钟
- 部署地址：`https://openclawq.github.io/map-game/`

#### 4. 配置自定义域名（可选）
如果需要自定义域名：
1. 在仓库根目录创建 `CNAME` 文件
2. 写入你的域名：`map.example.com`
3. 配置域名 DNS 指向 `openclawq.github.io`

---

## 方案2：Cloudflare Pages

### 优点
- ✅ 完全免费
- ✅ 超快的全球 CDN
- ✅ 支持 HTTPS
- ✅ 支持自定义域名
- ✅ 支持预览部署
- ✅ 支持 Cloudflare Functions（如需后端）

### 部署步骤

#### 1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

#### 2. 登录 Cloudflare
```bash
wrangler login
```

#### 3. 创建项目并部署
```bash
cd /home/qagent/games/map
wrangler pages deploy . --project-name=map-game
```

#### 4. 配置自定义域名（可选）
1. 在 Cloudflare Dashboard 中添加域名
2. 配置 DNS 指向 Cloudflare Pages
3. 在项目设置中绑定域名

---

## 方案3：自托管（备用）

### 优点
- ✅ 完全控制
- ✅ 无平台限制

### 部署步骤
```bash
# 使用 Python 内置服务器
cd /home/qagent/games/map
python3 -m http.server 8000

# 或使用 Node.js 服务器
npx serve -p 8000
```

访问地址：`http://localhost:8000`

---

## 推荐方案

### 🎯 首选：GitHub Pages
- **理由：** 你已经有 GitHub 账号和 SSH 配置（从 TOOLS.md）
- **步骤：** 简单，只需要 Git 提交
- **成本：** 免费
- **适合：** 个人项目、开源项目

### 🥈 次选：Cloudflare Pages
- **理由：** 你之前使用过 Cloudflare
- **步骤：** 需要安装 Wrangler CLI
- **成本：** 免费
- **适合：** 需要更快速度、自定义域名

---

## 部署前检查清单

- [ ] 所有核心文件已创建
- [ ] 数据文件已验证
- [ ] 响应式设计已测试
- [ ] 移动端触摸功能已测试
- [ ] 跨浏览器兼容性已测试（Chrome、Firefox、Safari）
- [ ] 性能优化已应用
- [ ] 错误处理已完善
- [ ] README.md 已更新
- [ ] LICENSE 文件已添加

---

## 部署后验证

- [ ] 网站可以正常访问
- [ ] 所有4种游戏模式可以正常开始
- [ ] 地图可以正常渲染
- [ ] 点击和触摸交互正常
- [ ] 评分系统正常工作
- [ ] 结果页面正常显示
- [ ] 移动端适配正常
- [ ] 没有 JavaScript 错误

---

## 持续部署（CI/CD）

### GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
```

---

## 维护和更新

### 更新内容
1. 修改代码
2. Git 提交
3. 自动部署（GitHub Actions）或手动触发

### 数据更新
- 数据文件在 `data/` 目录
- 更新后 Git 提交即可
- 自动部署

---

**文档创建时间：** 2026-02-19 21:55
**状态：** 规划中
