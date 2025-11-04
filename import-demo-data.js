#!/usr/bin/env node

// ===== KV 数据导入脚本 =====
// 使用 Wrangler CLI 批量导入演示数据

const fs = require('fs');
const { execSync } = require('child_process');

console.log('📦 Cloudflare Pages 博客 - 演示数据导入工具\n');

// 检查 Wrangler 是否安装
try {
  execSync('wrangler --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ 未检测到 Wrangler CLI');
  console.log('请先安装: npm install -g wrangler');
  process.exit(1);
}

// 获取 Namespace ID
const namespaceId = process.argv[2];

if (!namespaceId) {
  console.log('使用方法:');
  console.log('  node import-demo-data.js <NAMESPACE_ID>\n');
  console.log('获取 Namespace ID:');
  console.log('  1. 登录 Cloudflare Dashboard');
  console.log('  2. 进入 Workers & Pages → KV');
  console.log('  3. 点击 BLOG namespace');
  console.log('  4. 复制 Namespace ID\n');
  console.log('或使用命令:');
  console.log('  wrangler kv:namespace list');
  process.exit(1);
}

console.log(`📝 目标 Namespace ID: ${namespaceId}\n`);

// 读取演示数据
const demoData = JSON.parse(fs.readFileSync('./demo-data.json', 'utf-8'));

console.log(`📊 准备导入 ${demoData.length} 条数据...\n`);

// 保存临时文件供 wrangler 使用
const tempFile = './temp-import.json';
fs.writeFileSync(tempFile, JSON.stringify(demoData, null, 2));

try {
  // 执行导入
  console.log('⏳ 正在导入数据...\n');
  execSync(`wrangler kv:bulk put --namespace-id=${namespaceId} ${tempFile}`, {
    stdio: 'inherit'
  });
  
  console.log('\n✅ 演示数据导入成功！');
  console.log('\n包含内容:');
  console.log('  - 3 篇示例文章（欢迎文章、部署指南、Markdown 教程）');
  console.log('  - 4 个友情链接（Cloudflare、GitHub、MDN、Stack Overflow）');
  console.log('  - 站点基本设置\n');
  console.log('下一步:');
  console.log('  1. 访问你的博客首页查看文章');
  console.log('  2. 访问 /admin.html 登录后台');
  console.log('  3. 开始创作你的第一篇文章\n');
  
} catch (error) {
  console.error('\n❌ 导入失败');
  console.error('错误信息:', error.message);
  process.exit(1);
} finally {
  // 清理临时文件
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}
