# 示例数据导入指南

本文档说明如何为博客添加示例数据，让博客初始部署后即可看到效果。

## 方式一：通过后台手动添加（推荐）

这是最简单的方式，适合所有用户。

1. 访问后台：`https://your-domain.com/admin.html`
2. 使用密码登录
3. 点击 "新建文章"
4. 填写以下示例内容：

### 示例文章 1：欢迎使用

**标题**：欢迎使用我的博客

**别名**：welcome

**内容**：
```markdown
# 欢迎来到我的博客

这是一个基于 Cloudflare Pages 构建的现代化博客系统。

## 特性

- 零依赖架构，纯原生 JavaScript
- Adams 风格主题，简洁优雅
- 支持亮暗色主题切换
- View Transitions 动效
- 完整的后台管理系统

## 技术栈

- Cloudflare Pages Functions
- Cloudflare KV（数据库）
- Cloudflare R2（图片存储）
- 原生 ES Modules

感谢使用！
```

**分类**：公告

**标签**：欢迎, 博客

**置顶**：勾选

### 示例文章 2：第一篇技术文章

**标题**：如何使用 Cloudflare Pages 部署静态网站

**别名**：cloudflare-pages-guide

**内容**：
```markdown
# Cloudflare Pages 部署指南

Cloudflare Pages 是一个强大的静态网站托管平台。

## 优势

1. 全球 CDN 加速
2. 免费 SSL 证书
3. 无限带宽
4. Git 集成自动部署

## 部署步骤

1. 连接 GitHub 仓库
2. 配置构建设置
3. 部署完成

就是这么简单！
```

**分类**：技术

**标签**：Cloudflare, 部署, 教程

## 方式二：使用 Wrangler CLI 导入（高级）

如果你熟悉命令行，可以使用 Wrangler 批量导入数据。

### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 准备数据文件

创建 `sample-data.json`：

```json
[
  {
    "key": "post:id:welcome123",
    "value": "{\"id\":\"welcome123\",\"slug\":\"welcome\",\"title\":\"欢迎使用我的博客\",\"content\":\"# 欢迎来到我的博客\\n\\n这是一个基于 Cloudflare Pages 构建的现代化博客系统。\\n\\n## 特性\\n\\n- 零依赖架构\\n- Adams 风格主题\\n- 亮暗色主题切换\\n- View Transitions 动效\\n\\n感谢使用！\",\"excerpt\":\"欢迎来到我的博客，这是一个现代化的博客系统。\",\"category\":\"公告\",\"tags\":[\"欢迎\",\"博客\"],\"cover\":\"\",\"status\":\"published\",\"pinned\":true,\"views\":0,\"createdAt\":1730764110000,\"updatedAt\":1730764110000}"
  },
  {
    "key": "post:slug:welcome",
    "value": "welcome123"
  },
  {
    "key": "idx:post:time",
    "value": "[\"welcome123\"]"
  },
  {
    "key": "links:friend",
    "value": "[{\"name\":\"Cloudflare\",\"url\":\"https://www.cloudflare.com\",\"desc\":\"全球领先的 CDN 服务商\",\"avatar\":\"https://www.cloudflare.com/favicon.ico\"},{\"name\":\"GitHub\",\"url\":\"https://github.com\",\"desc\":\"全球最大的代码托管平台\",\"avatar\":\"https://github.com/favicon.ico\"}]"
  }
]
```

### 4. 导入数据

```bash
# 替换为你的 Namespace ID
wrangler kv:bulk put --namespace-id=YOUR_NAMESPACE_ID sample-data.json
```

## 方式三：使用 Cloudflare API（高级）

如果你更喜欢使用 API，可以直接调用 Cloudflare KV API。

### 示例：添加友链

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/storage/kv/namespaces/YOUR_NAMESPACE_ID/values/links:friend" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Cloudflare",
      "url": "https://www.cloudflare.com",
      "desc": "全球领先的 CDN 服务商",
      "avatar": "https://www.cloudflare.com/favicon.ico"
    }
  ]'
```

## 推荐的示例友链

```json
[
  {
    "name": "Cloudflare",
    "url": "https://www.cloudflare.com",
    "desc": "全球领先的 CDN 服务商",
    "avatar": "https://www.cloudflare.com/favicon.ico"
  },
  {
    "name": "GitHub",
    "url": "https://github.com",
    "desc": "全球最大的代码托管平台",
    "avatar": "https://github.com/favicon.ico"
  },
  {
    "name": "MDN Web Docs",
    "url": "https://developer.mozilla.org",
    "desc": "Web 开发者的最佳资源",
    "avatar": "https://developer.mozilla.org/favicon.ico"
  }
]
```

## 注意事项

1. 所有通过 CLI 或 API 导入的数据需要确保 JSON 格式正确
2. 时间戳使用毫秒级别的 Unix 时间戳
3. 文章 ID 和 slug 需要保持唯一性
4. 索引数据（idx:post:time）需要与实际文章 ID 对应

## 后续管理

导入示例数据后，你可以：

1. 在后台编辑或删除示例文章
2. 发布自己的文章
3. 通过后台管理友链
4. 修改网站设置

---

推荐使用方式一（后台手动添加），简单直接，适合所有用户。
