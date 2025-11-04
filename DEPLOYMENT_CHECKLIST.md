# 部署检查清单

在完成部署后，请按照此清单逐项检查，确保博客系统正常运行。

## 部署前检查

- [ ] 已创建 GitHub 仓库
- [ ] 所有项目文件已上传到仓库
- [ ] 已创建 Cloudflare 账号
- [ ] 已创建 Cloudflare KV Namespace（命名为 BLOG）
- [ ] 已创建 Cloudflare R2 Bucket（命名为 blog-assets）
- [ ] R2 Bucket 已启用公开访问
- [ ] 已记录 R2 公开访问域名

## 部署配置检查

- [ ] 已在 Cloudflare Pages 连接 GitHub 仓库
- [ ] Build command 设置为空
- [ ] Build output directory 设置为 `public`
- [ ] 已绑定 KV Namespace（变量名：BLOG）
- [ ] 已绑定 R2 Bucket（变量名：BLOG_ASSETS）

## 环境变量检查

- [ ] `ADMIN_PASSWORD_HASH`：已设置密码哈希
- [ ] `SESSION_SECRET`：已设置随机字符串（至少 32 字符）
- [ ] `SITE_NAME`：已设置网站名称
- [ ] `R2_PUBLIC_BASE`：已设置 R2 公开域名（格式：https://pub-xxxxx.r2.dev）

## 功能测试

### 前端测试

- [ ] 访问首页：显示空列表或示例文章
- [ ] 点击导航链接：归档、友链页面正常显示
- [ ] 主题切换：点击主题按钮，页面切换亮暗色
- [ ] 响应式：在手机和桌面浏览器均显示正常

### 后台测试

- [ ] 访问 `/admin.html`：显示登录页面
- [ ] 使用密码登录：登录成功进入后台
- [ ] 创建文章：填写表单，点击发布
- [ ] 查看文章：在首页看到新发布的文章
- [ ] 编辑文章：点击编辑，修改内容后保存
- [ ] 删除文章：点击删除，文章从列表消失

### 上传测试

- [ ] 点击上传按钮：选择图片文件
- [ ] 上传成功：返回图片 URL
- [ ] 图片可访问：在浏览器打开 URL，图片正常显示
- [ ] 拖拽上传：拖拽图片到编辑器，上传成功

### API 测试

在浏览器控制台运行以下代码测试 API：

```javascript
// 测试获取文章列表
fetch('/api/posts')
  .then(r => r.json())
  .then(console.log);

// 测试获取友链
fetch('/api/links')
  .then(r => r.json())
  .then(console.log);

// 测试 RSS
fetch('/rss.xml')
  .then(r => r.text())
  .then(console.log);
```

预期结果：
- `/api/posts`：返回文章列表（可能为空）
- `/api/links`：返回友链列表（可能为空）
- `/rss.xml`：返回 XML 格式的 RSS 订阅

### 性能测试

- [ ] 打开 Chrome DevTools → Lighthouse
- [ ] 运行性能测试
- [ ] Performance 评分 >= 90
- [ ] Accessibility 评分 >= 90
- [ ] Best Practices 评分 >= 90
- [ ] SEO 评分 >= 90

## 常见问题排查

### 问题 1：登录失败

**症状**：输入密码后提示"密码错误"

**排查步骤**：
1. 检查环境变量 `ADMIN_PASSWORD_HASH` 是否设置
2. 重新生成密码哈希（使用 README 中的方法）
3. 更新环境变量
4. 重新部署（Deployments → Retry deployment）

### 问题 2：图片上传失败

**症状**：点击上传后提示"上传失败"

**排查步骤**：
1. 检查 R2 Bucket 绑定：变量名必须是 `BLOG_ASSETS`
2. 检查 R2 公开访问已启用
3. 检查环境变量 `R2_PUBLIC_BASE` 格式正确
4. 重新部署

### 问题 3：文章列表为空

**症状**：首页显示"暂无文章"

**说明**：这是正常的，初始部署后没有文章。

**解决方法**：
1. 登录后台发布第一篇文章
2. 或参考 SAMPLE_DATA.md 导入示例数据

### 问题 4：样式显示异常

**症状**：页面布局混乱，样式丢失

**排查步骤**：
1. 清除浏览器缓存（Ctrl+Shift+R 或 Cmd+Shift+R）
2. 检查 `/assets/style.css` 是否可访问
3. 检查浏览器控制台是否有 404 错误
4. 如果有 404，检查 `_routes.json` 配置

### 问题 5：API 返回 404

**症状**：所有 `/api/*` 请求返回 404

**排查步骤**：
1. 检查 `functions` 目录是否存在
2. 检查 `functions/[[path]].js` 文件是否存在
3. 检查 `_routes.json` 配置是否正确
4. 重新部署

### 问题 6：View Transitions 不工作

**说明**：View Transitions API 仅在 Chrome/Edge 89+ 支持

**解决方法**：
- Chrome/Edge：应该正常工作
- Safari/Firefox：会自动降级到 PJAX 模式
- 这不是错误，是正常的浏览器兼容性行为

## 部署后优化

### 自定义域名

1. 在 Cloudflare Pages 项目设置中
2. 进入 Custom domains
3. 添加你的域名
4. 按照提示配置 DNS
5. 等待 SSL 证书生成（通常几分钟）

### 添加分析

在 `public/index.html` 的 `</body>` 前添加：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

或使用 Cloudflare Web Analytics（推荐）：

1. 在 Cloudflare Dashboard 中启用 Web Analytics
2. 复制提供的脚本代码
3. 添加到所有 HTML 文件的 `<head>` 中

### SEO 优化

1. 编辑每个 HTML 文件的 `<meta>` 标签
2. 添加 sitemap.xml（可选）
3. 提交到 Google Search Console
4. 配置 robots.txt

### 性能优化

已内置的优化：
- 静态资源 CDN 加速
- 图片懒加载
- CSS/JS 压缩（Cloudflare 自动）
- HTTP/2 和 HTTP/3 支持
- 全球边缘节点缓存

## 维护建议

### 定期备份

每月导出 KV 数据：
```bash
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID > backup-$(date +%Y%m%d).json
```

### 监控

使用 Cloudflare Analytics 监控：
- 访问量统计
- 错误率
- 响应时间
- 带宽使用

### 更新

关注项目更新：
- 查看 GitHub 仓库的 Releases
- 阅读 CHANGELOG.md
- 按需更新代码

## 完成

- [ ] 所有检查项均已完成
- [ ] 博客正常运行
- [ ] 已发布第一篇文章
- [ ] 已分享给朋友

恭喜！你的博客已经成功部署并正常运行。

---

如遇到其他问题，请参考 README.md 或提交 Issue。
