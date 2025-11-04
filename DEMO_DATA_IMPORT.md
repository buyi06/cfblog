# 演示数据快速导入指南

本文档说明如何快速导入演示数据，让你的博客部署后立即展示效果。

## 包含内容

演示数据包含：

### 文章（3 篇）

1. **欢迎使用 Cloudflare Pages 博客**（置顶）
   - 介绍博客系统的核心特性
   - 技术栈说明
   - 快速开始指南
   - 分类：公告 | 标签：欢迎、博客、Cloudflare

2. **Cloudflare Pages 完整部署指南**
   - 详细部署步骤
   - 高级功能介绍（Functions、KV、R2）
   - 性能优化技巧
   - 故障排查
   - 分类：技术 | 标签：Cloudflare、部署、教程

3. **Markdown 语法完全指南**
   - 标题、文本样式
   - 链接、图片
   - 列表、代码、引用
   - 最佳实践
   - 分类：技术 | 标签：Markdown、写作、教程

### 友情链接（4 个）

- Cloudflare
- GitHub
- MDN Web Docs
- Stack Overflow

### 站点设置

- 网站名称
- 描述
- 作者
- 页脚信息

## 方法一：使用导入脚本（推荐）

### 前置要求

1. 安装 Node.js（v14+）
2. 安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```
3. 登录 Cloudflare：
   ```bash
   wrangler login
   ```

### 导入步骤

1. **获取 Namespace ID**

   方法 A - 通过命令行：
   ```bash
   wrangler kv:namespace list
   ```
   找到名为 `BLOG` 的 Namespace，复制其 ID。

   方法 B - 通过 Dashboard：
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 进入 Workers & Pages → KV
   - 点击 `BLOG` namespace
   - 复制 Namespace ID

2. **运行导入脚本**

   ```bash
   cd cms
   node import-demo-data.js YOUR_NAMESPACE_ID
   ```

   替换 `YOUR_NAMESPACE_ID` 为你的实际 ID。

3. **验证导入**

   访问你的博客首页，应该能看到 3 篇示例文章。

## 方法二：手动导入（逐条）

如果你更喜欢手动操作或不想安装 Node.js：

### 使用 Wrangler CLI

```bash
# 登录
wrangler login

# 导入单个键值对
wrangler kv:key put --namespace-id=YOUR_NAMESPACE_ID "post:id:welcome2025" @demo-data.json --path="$[0].value"

# 批量导入
wrangler kv:bulk put --namespace-id=YOUR_NAMESPACE_ID demo-data.json
```

### 使用 Cloudflare API

使用 REST API 逐条导入（适合脚本自动化）：

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/storage/kv/namespaces/YOUR_NAMESPACE_ID/values/post:id:welcome2025" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @demo-data.json
```

## 方法三：通过后台手动添加

如果你不想使用命令行：

1. 访问 `/admin.html` 并登录
2. 点击"新建文章"
3. 复制 `demo-data.json` 中对应文章的内容
4. 填写表单并发布

**示例文章 1 的内容**：

**标题**：欢迎使用 Cloudflare Pages 博客

**别名**：welcome

**内容**：复制 JSON 中 `content` 字段的值（已经是 Markdown 格式）

**分类**：公告

**标签**：欢迎, 博客, Cloudflare

**置顶**：勾选

重复此过程添加其他文章。

## 导入后检查

导入完成后，请验证：

- [ ] 首页显示 3 篇文章
- [ ] 置顶文章在最上方
- [ ] 点击文章标题可以查看详情
- [ ] Markdown 格式正确渲染
- [ ] 友链页面显示 4 个链接
- [ ] 归档页面按年份分组显示

## 自定义演示数据

如果你想修改演示数据：

1. 编辑 `demo-data.json`
2. 修改文章内容、标题、标签等
3. 保持 JSON 格式正确
4. 重新运行导入脚本

### JSON 结构说明

```json
{
  "key": "post:id:文章ID",
  "value": "JSON字符串，包含文章所有信息"
}
```

文章数据字段：
- `id`：唯一标识
- `slug`：URL 别名
- `title`：标题
- `content`：Markdown 内容
- `excerpt`：摘要
- `category`：分类
- `tags`：标签数组
- `status`：状态（published/draft）
- `pinned`：是否置顶
- `views`：浏览量
- `createdAt`：创建时间（毫秒时间戳）
- `updatedAt`：更新时间（毫秒时间戳）

## 清除演示数据

如果你想清除演示数据：

```bash
# 删除所有数据
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "post:id:welcome2025"
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "post:id:cf-pages-guide"
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "post:id:markdown-guide"
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "post:slug:welcome"
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "post:slug:cloudflare-pages-deployment"
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "post:slug:markdown-syntax"
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "idx:post:time"
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "links:friend"
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "site:settings"
```

或者在后台逐个删除文章。

## 常见问题

### Q: 导入后看不到文章？

A: 检查：
1. Namespace ID 是否正确
2. KV 是否正确绑定到 Pages 项目（变量名必须是 `BLOG`）
3. 是否重新部署了项目
4. 浏览器是否缓存了旧页面（清除缓存或强制刷新）

### Q: 文章显示乱码？

A: 确保：
1. JSON 文件编码为 UTF-8
2. 导入时使用正确的命令
3. 特殊字符已正确转义

### Q: 导入脚本报错？

A: 检查：
1. Node.js 版本（需要 v14+）
2. Wrangler 已安装且登录
3. Namespace ID 正确
4. 网络连接正常

## 下一步

导入演示数据后：

1. **浏览博客**：查看首页、文章详情、归档、友链
2. **登录后台**：`/admin.html`
3. **编辑文章**：修改演示文章或删除它们
4. **创作内容**：发布你的第一篇原创文章
5. **自定义设置**：修改网站名称、Logo 等

祝你使用愉快！
