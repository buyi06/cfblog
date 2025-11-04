// ===== Cloudflare Pages Functions 主路由 =====
// 纯原生 JavaScript，使用 Cloudflare Workers Runtime

// === 工具函数 ===

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 生成 slug
function generateSlug(title) {
  // 简化版：使用时间戳
  return Date.now().toString(36);
}

// 验证密码
async function verifyPassword(password, hash) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === hash;
}

// 生成密码哈希
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Cookie 解析
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    cookies[name.trim()] = rest.join('=').trim();
  });
  
  return cookies;
}

// 验证会话
async function validateSession(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const sessionId = cookies.session;
  
  if (!sessionId) return false;
  
  const session = await env.BLOG.get(`session:${sessionId}`);
  return session !== null;
}

// JSON 响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

// === KV 数据库操作 ===

// 获取文章列表
async function getPosts(env, options = {}) {
  const { page = 1, limit = 10, archive = false, all = false } = options;
  
  // 从索引获取文章 ID 列表
  const indexKey = 'idx:post:time';
  const indexData = await env.BLOG.get(indexKey, 'json');
  
  if (!indexData || indexData.length === 0) {
    return { posts: [], total: 0, totalPages: 0 };
  }
  
  // 分页
  const start = all ? 0 : (page - 1) * limit;
  const end = all ? indexData.length : start + limit;
  const paginatedIds = indexData.slice(start, end);
  
  // 获取文章详情
  const posts = await Promise.all(
    paginatedIds.map(async (id) => {
      const post = await env.BLOG.get(`post:id:${id}`, 'json');
      return post;
    })
  );
  
  const filteredPosts = posts.filter(p => p !== null);
  
  // 如果不是全部模式，过滤掉草稿
  const finalPosts = all 
    ? filteredPosts 
    : filteredPosts.filter(p => p.status !== 'draft');
  
  return {
    posts: finalPosts,
    total: indexData.length,
    totalPages: Math.ceil(indexData.length / limit)
  };
}

// 获取单篇文章
async function getPost(env, slugOrId) {
  // 先尝试通过 slug 查找
  const postId = await env.BLOG.get(`post:slug:${slugOrId}`);
  
  if (postId) {
    return await env.BLOG.get(`post:id:${postId}`, 'json');
  }
  
  // 尝试直接通过 ID 查找
  return await env.BLOG.get(`post:id:${slugOrId}`, 'json');
}

// 保存文章
async function savePost(env, postData) {
  const id = postData.id || generateId();
  const slug = postData.slug || generateSlug(postData.title);
  const now = Date.now();
  
  const post = {
    id,
    slug,
    title: postData.title,
    content: postData.content,
    excerpt: postData.excerpt || postData.content.substring(0, 200),
    category: postData.category || '',
    tags: postData.tags || [],
    cover: postData.cover || '',
    status: postData.status || 'published',
    pinned: postData.pinned || false,
    views: postData.views || 0,
    createdAt: postData.createdAt || now,
    updatedAt: now
  };
  
  // 保存文章数据
  await env.BLOG.put(`post:id:${id}`, JSON.stringify(post));
  
  // 保存 slug 映射
  await env.BLOG.put(`post:slug:${slug}`, id);
  
  // 更新索引
  await updatePostIndex(env, id);
  
  return post;
}

// 更新文章索引
async function updatePostIndex(env, postId) {
  const indexKey = 'idx:post:time';
  const indexData = await env.BLOG.get(indexKey, 'json') || [];
  
  // 如果不存在则添加到开头
  if (!indexData.includes(postId)) {
    indexData.unshift(postId);
    await env.BLOG.put(indexKey, JSON.stringify(indexData));
  }
}

// 删除文章
async function deletePost(env, postId) {
  const post = await env.BLOG.get(`post:id:${postId}`, 'json');
  if (!post) return false;
  
  // 删除文章数据
  await env.BLOG.delete(`post:id:${postId}`);
  await env.BLOG.delete(`post:slug:${post.slug}`);
  
  // 从索引中移除
  const indexKey = 'idx:post:time';
  const indexData = await env.BLOG.get(indexKey, 'json') || [];
  const newIndex = indexData.filter(id => id !== postId);
  await env.BLOG.put(indexKey, JSON.stringify(newIndex));
  
  return true;
}

// 增加浏览量
async function incrementViews(env, postId) {
  const post = await env.BLOG.get(`post:id:${postId}`, 'json');
  if (!post) return;
  
  post.views = (post.views || 0) + 1;
  await env.BLOG.put(`post:id:${postId}`, JSON.stringify(post));
}

// 获取友链
async function getLinks(env) {
  const links = await env.BLOG.get('links:friend', 'json');
  return links || [];
}

// === API 路由处理器 ===

// 登录
async function handleLogin(request, env) {
  const { password } = await request.json();
  const adminHash = env.ADMIN_PASSWORD_HASH;
  
  if (!adminHash) {
    return jsonResponse({ error: 'Admin password not configured' }, 500);
  }
  
  const isValid = await verifyPassword(password, adminHash);
  
  if (!isValid) {
    return jsonResponse({ error: 'Invalid password' }, 401);
  }
  
  // 创建会话
  const sessionId = generateId();
  await env.BLOG.put(`session:${sessionId}`, 'valid', { expirationTtl: 86400 * 7 }); // 7天
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`
    }
  });
}

// 检查认证
async function handleAuthCheck(request, env) {
  const isValid = await validateSession(request, env);
  return jsonResponse({ authenticated: isValid }, isValid ? 200 : 401);
}

// 退出登录
async function handleLogout(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const sessionId = cookies.session;
  
  if (sessionId) {
    await env.BLOG.delete(`session:${sessionId}`);
  }
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    }
  });
}

// 获取文章列表
async function handleGetPosts(request, env) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const archive = url.searchParams.get('archive') === 'true';
  const all = url.searchParams.get('all') === 'true';
  
  // 如果是 all 模式，需要验证权限
  if (all) {
    const isAuthed = await validateSession(request, env);
    if (!isAuthed) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }
  
  const result = await getPosts(env, { page, limit, archive, all });
  return jsonResponse(result);
}

// 获取单篇文章
async function handleGetPost(request, env, slug) {
  const post = await getPost(env, slug);
  
  if (!post) {
    return jsonResponse({ error: 'Post not found' }, 404);
  }
  
  return jsonResponse(post);
}

// 创建/更新文章
async function handleSavePost(request, env, postId = null) {
  const isAuthed = await validateSession(request, env);
  if (!isAuthed) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  const postData = await request.json();
  
  if (postId) {
    postData.id = postId;
  }
  
  const post = await savePost(env, postData);
  return jsonResponse(post);
}

// 删除文章
async function handleDeletePost(request, env, postId) {
  const isAuthed = await validateSession(request, env);
  if (!isAuthed) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  const success = await deletePost(env, postId);
  
  if (!success) {
    return jsonResponse({ error: 'Post not found' }, 404);
  }
  
  return jsonResponse({ success: true });
}

// 增加浏览量
async function handlePostView(request, env, slug) {
  const post = await getPost(env, slug);
  if (post) {
    await incrementViews(env, post.id);
  }
  return jsonResponse({ success: true });
}

// 获取友链
async function handleGetLinks(request, env) {
  const links = await getLinks(env);
  return jsonResponse(links);
}

// 搜索文章
async function handleSearch(request, env) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('q');
  
  if (!keyword) {
    return jsonResponse([]);
  }
  
  const { posts } = await getPosts(env, { all: false, limit: 100 });
  
  const results = posts.filter(post => 
    post.title.includes(keyword) || 
    post.content.includes(keyword) ||
    post.excerpt.includes(keyword)
  );
  
  return jsonResponse(results);
}

// 上传图片到 R2
async function handleUpload(request, env) {
  const isAuthed = await validateSession(request, env);
  if (!isAuthed) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return jsonResponse({ error: 'No file provided' }, 400);
    }
    
    // 生成文件名
    const ext = file.name.split('.').pop();
    const fileName = `${generateId()}.${ext}`;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const objectKey = `${year}/${month}/${fileName}`;
    
    // 上传到 R2
    await env.BLOG_ASSETS.put(objectKey, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });
    
    // 返回公开 URL
    const publicUrl = `${env.R2_PUBLIC_BASE}/${objectKey}`;
    
    return jsonResponse({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse({ error: 'Upload failed' }, 500);
  }
}

// 生成 RSS
async function handleRSS(request, env) {
  const { posts } = await getPosts(env, { limit: 20 });
  const siteUrl = new URL(request.url).origin;
  const siteName = env.SITE_NAME || '我的博客';
  
  const rssItems = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/post/${post.slug}</link>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <guid>${siteUrl}/post/${post.slug}</guid>
    </item>
  `).join('');
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>最新文章</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;
  
  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

// === 主路由处理 ===
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // API 路由
  if (path.startsWith('/api/')) {
    // CORS 处理
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    try {
      // 认证相关
      if (path === '/api/auth/login' && method === 'POST') {
        return await handleLogin(request, env);
      }
      if (path === '/api/auth/check' && method === 'GET') {
        return await handleAuthCheck(request, env);
      }
      if (path === '/api/auth/logout' && method === 'POST') {
        return await handleLogout(request, env);
      }
      
      // 文章相关
      if (path === '/api/posts' && method === 'GET') {
        return await handleGetPosts(request, env);
      }
      if (path === '/api/posts' && method === 'POST') {
        return await handleSavePost(request, env);
      }
      
      const postMatch = path.match(/^\/api\/post\/([^/]+)$/);
      if (postMatch) {
        const slug = postMatch[1];
        if (method === 'GET') {
          return await handleGetPost(request, env, slug);
        }
        if (method === 'PUT') {
          return await handleSavePost(request, env, slug);
        }
        if (method === 'DELETE') {
          return await handleDeletePost(request, env, slug);
        }
      }
      
      const viewMatch = path.match(/^\/api\/post\/([^/]+)\/view$/);
      if (viewMatch && method === 'POST') {
        return await handlePostView(request, env, viewMatch[1]);
      }
      
      // 友链
      if (path === '/api/links' && method === 'GET') {
        return await handleGetLinks(request, env);
      }
      
      // 搜索
      if (path === '/api/search' && method === 'GET') {
        return await handleSearch(request, env);
      }
      
      // 上传
      if (path === '/api/upload' && method === 'POST') {
        return await handleUpload(request, env);
      }
      
      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('API error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }
  
  // RSS
  if (path === '/rss.xml') {
    return await handleRSS(request, env);
  }
  
  // 文章详情页 SSR
  if (path.startsWith('/post/')) {
    const slug = path.split('/')[2];
    const post = await getPost(env, slug);
    
    if (!post) {
      return new Response('404 Not Found', { status: 404 });
    }
    
    // 返回静态 HTML，让前端 JS 处理
    return env.ASSETS.fetch(request);
  }
  
  // 其他请求转发到静态资源
  return env.ASSETS.fetch(request);
}
