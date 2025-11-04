# Cloudflare Pages 博客系统

一个现代化、优雅的博客系统，专为 Cloudflare Pages 设计。无需 npm 构建，纯原生 ES Modules，手机即可完成部署。

## 特性

- **零依赖架构**：纯原生 ES Modules，无任何 npm 包
- **Adams 风格主题**：简洁优雅的卡片设计，支持亮暗色主题
- **现代化动效**：View Transitions API + PJAX 降级，交错上移动画
- **完整博客功能**：发文、分类、标签、友链、置顶、草稿、别名 slug、RSS
- **后台管理系统**：可视化编辑器，图片上传，自动保存草稿
- **Cloudflare 原生**：KV 数据库 + R2 图片存储，全球加速
- **手机友好部署**：连接 Git 即可，无需本地环境
- **高性能**：Lighthouse 评分 90+

## 技术栈

- **前端**：原生 JavaScript ES Modules，CSS Variables
- **后端**：Cloudflare Pages Functions（原生 Runtime）
- **数据库**：Cloudflare KV
- **存储**：Cloudflare R2
- **部署**：Cloudflare Pages（自动部署）

## 快速开始

### 前置要求

1. GitHub 账号
2. Cloudflare 账号（免费计划即可）
3. Git 客户端（手机可用 Working Copy、Termux 等）

### 演示数据

项目包含可直接导入的演示数据（3 篇示例文章 + 4 个友链）。

**快速导入**：
```bash
# 安装 Wrangler（如果还没安装）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 导入数据（替换为你的 Namespace ID）
node import-demo-data.js YOUR_NAMESPACE_ID
```

详细说明请查看 [DEMO_DATA_IMPORT.md](DEMO_DATA_IMPORT.md)。

### 部署步骤

#### 步骤 1：创建 GitHub 仓库

1. 在 GitHub 创建新仓库（public 或 private 均可）
2. 将本项目所有文件上传到仓库

```bash
# 使用 Git 命令行
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

#### 步骤 2：配置 Cloudflare KV

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages → KV
3. 点击 "Create namespace"
4. 命名为 `BLOG`，点击 "Add"
5. 记录 Namespace ID（后续需要）

#### 步骤 3：配置 Cloudflare R2

1. 在 Cloudflare Dashboard，进入 R2
2. 点击 "Create bucket"
3. 命名为 `blog-assets`，选择区域（建议选择离用户最近的）
4. 创建完成后，进入桶设置
5. 在 "Public access" 中启用公开访问
6. 记录公开访问域名（如 `https://pub-xxxxx.r2.dev`）

#### 步骤 4：部署到 Cloudflare Pages

1. 在 Cloudflare Dashboard，进入 Workers & Pages → Pages
2. 点击 "Create application" → "Connect to Git"
3. 授权 GitHub 并选择你的仓库
4. 配置构建设置：
   - **Framework preset**: None
   - **Build command**: 留空
   - **Build output directory**: `public`
5. 点击 "Save and Deploy"

#### 步骤 5：绑定资源

部署完成后，进入项目设置：

1. **绑定 KV Namespace**：
   - 进入 Settings → Functions → KV namespace bindings
   - 添加绑定：
     - Variable name: `BLOG`
     - KV namespace: 选择刚创建的 `BLOG`
   - 点击 "Save"

2. **绑定 R2 Bucket**：
   - 进入 Settings → Functions → R2 bucket bindings
   - 添加绑定：
     - Variable name: `BLOG_ASSETS`
     - R2 bucket: 选择刚创建的 `blog-assets`
   - 点击 "Save"

#### 步骤 6：配置环境变量

进入 Settings → Environment variables，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ADMIN_PASSWORD_HASH` | （见下方生成方法） | 管理员密码哈希 |
| `SESSION_SECRET` | （任意随机字符串） | 会话密钥 |
| `SITE_NAME` | 我的博客 | 网站名称 |
| `R2_PUBLIC_BASE` | https://pub-xxxxx.r2.dev | R2 公开访问域名 |

**生成密码哈希**：

在浏览器控制台运行以下代码：

```javascript
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Password Hash:', hashHex);
}

// 将 'your-password' 替换为你想设置的密码
hashPassword('your-password');
```

复制输出的哈希值，填入 `ADMIN_PASSWORD_HASH`。

#### 步骤 7：重新部署

1. 在 Deployments 页面，点击最新部署右侧的菜单
2. 选择 "Retry deployment"
3. 等待部署完成

### 访问博客

- **首页**：`https://your-project.pages.dev`
- **后台**：`https://your-project.pages.dev/admin.html`

使用你设置的密码登录后台，即可开始发布文章。

## 目录结构

```
cms/
├── public/                # 前端静态资源
│   ├── index.html        # 首页
│   ├── post.html         # 文章详情页
│   ├── admin.html        # 后台管理
│   ├── archive.html      # 归档页
│   ├── links.html        # 友链页
│   └── assets/
│       ├── style.css     # Adams 风格样式
│       ├── app.js        # 前端核心逻辑
│       ├── admin.js      # 后台管理逻辑
│       └── logo.svg      # 网站 Logo
├── functions/            # Cloudflare Pages Functions
│   └── [[path]].js       # 动态路由处理
├── _routes.json          # 路由配置
├── README.md             # 本文档
└── CHANGELOG.md          # 更新日志
```

## 功能说明

### 文章管理

- **发布文章**：支持 Markdown 格式
- **草稿保存**：自动保存草稿，防止意外丢失
- **置顶功能**：重要文章可置顶显示
- **别名 Slug**：自定义友好 URL
- **分类标签**：灵活的内容组织
- **封面图片**：支持上传或外链

### 图片上传

- **拖拽上传**：直接拖拽图片到编辑器
- **点击上传**：点击按钮选择文件
- **自动压缩**：优化加载速度
- **全球加速**：R2 自动分发到全球节点

### 主题切换

- **亮色模式**：适合白天阅读
- **暗色模式**：适合夜间阅读
- **自动保存**：记忆用户选择

### 友情链接

编辑 KV 中的 `links:friend` 键，JSON 格式：

```json
[
  {
    "name": "示例博客",
    "url": "https://example.com",
    "desc": "一个很棒的博客",
    "avatar": "https://example.com/avatar.jpg"
  }
]
```

### RSS 订阅

- **订阅地址**：`https://your-domain.com/rss.xml`
- **自动更新**：发布新文章自动生成

## 手机部署指南

### iOS（使用 Working Copy）

1. 在 App Store 下载 [Working Copy](https://apps.apple.com/app/working-copy/id896694807)
2. 在 Working Copy 中克隆仓库或创建新仓库
3. 将项目文件通过 Files 应用复制到 Working Copy
4. 提交并推送到 GitHub
5. 在手机浏览器访问 Cloudflare Dashboard 完成后续配置

### Android（使用 Termux）

1. 安装 [Termux](https://f-droid.org/packages/com.termux/)
2. 安装 Git：`pkg install git`
3. 克隆或创建仓库：
   ```bash
   git clone https://github.com/你的用户名/仓库名.git
   cd 仓库名
   ```
4. 添加文件并推送：
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```
5. 在手机浏览器访问 Cloudflare Dashboard 完成后续配置

## 常见问题

### 1. 登录后台时提示密码错误

检查环境变量 `ADMIN_PASSWORD_HASH` 是否正确设置。重新生成哈希并更新环境变量，然后重新部署。

### 2. 图片上传失败

确认：
- R2 bucket 已正确绑定，变量名为 `BLOG_ASSETS`
- 环境变量 `R2_PUBLIC_BASE` 设置正确
- R2 bucket 已启用公开访问

### 3. 文章列表为空

这是正常的，因为初始没有文章。登录后台发布第一篇文章即可。

### 4. 页面样式错误

清除浏览器缓存，确保加载了最新的 CSS 文件。

### 5. View Transitions 不生效

View Transitions API 目前仅 Chrome/Edge 支持。Safari 和 Firefox 会自动降级到 PJAX 模式。

## 性能优化

- **静态资源缓存**：CSS/JS 文件长期缓存
- **图片懒加载**：可视区外图片延迟加载
- **按需渲染**：首屏快速加载，后续 AJAX 获取
- **全球 CDN**：Cloudflare 自动分发到全球节点
- **KV 缓存**：数据读取极快

## 安全性

- **密码哈希**：SHA-256 加密存储
- **HttpOnly Cookie**：防止 XSS 攻击
- **会话过期**：7 天自动过期
- **CSRF 防护**：SameSite Cookie 策略

## 自定义

### 修改主题颜色

编辑 `public/assets/style.css`，修改 CSS 变量：

```css
:root {
  --color-primary: #2563eb;  /* 主色调 */
  --color-bg: #ffffff;        /* 背景色 */
  /* ... */
}
```

### 修改网站信息

在 Cloudflare Pages 环境变量中修改：
- `SITE_NAME`：网站名称
- 在 HTML 文件中修改页脚版权信息

### 添加统计代码

在 `public/index.html` 的 `</body>` 前添加统计代码。

## 迁移与备份

### 导出数据

使用 Cloudflare API 或 Wrangler CLI 导出 KV 数据：

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 导出 KV
wrangler kv:key list --namespace-id=你的NAMESPACE_ID
```

### 导入数据

使用 Wrangler 批量导入：

```bash
wrangler kv:bulk put --namespace-id=你的NAMESPACE_ID data.json
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License

## 致谢

- **Cloudflare**：提供强大的边缘计算平台
- **Adams 主题**：灵感来源

---

如有问题，请提交 Issue 或联系开发者。
