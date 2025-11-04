// ===== 后台管理系统 =====
// 纯原生 JavaScript，无任何依赖

const AdminApp = {
  currentPost: null,
  isEditing: false,
  autoSaveTimer: null
};

// === 初始化 ===
function initAdmin() {
  checkAuth();
  initEditor();
  initUpload();
  initAutoSave();
  loadDraft();
}

// === 认证检查 ===
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check');
    if (!response.ok) {
      showLoginForm();
      return;
    }
    showAdminPanel();
  } catch (error) {
    showLoginForm();
  }
}

function showLoginForm() {
  const container = document.getElementById('admin-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="admin-form">
      <h2>博客后台登录</h2>
      <form id="login-form" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label class="form-label">密码</label>
          <input type="password" id="password" class="form-input" required autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn-primary">登录</button>
        <div id="login-error" style="color: red; margin-top: 1rem;"></div>
      </form>
    </div>
  `;
}

async function handleLogin(event) {
  event.preventDefault();
  
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    if (response.ok) {
      window.location.reload();
    } else {
      errorDiv.textContent = '密码错误';
    }
  } catch (error) {
    errorDiv.textContent = '登录失败，请重试';
  }
}

function showAdminPanel() {
  const container = document.getElementById('admin-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="admin-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
      <h1>文章管理</h1>
      <div style="display: flex; gap: 1rem;">
        <button onclick="loadPostsList()" class="btn btn-secondary">文章列表</button>
        <button onclick="showNewPostForm()" class="btn btn-primary">新建文章</button>
        <button onclick="handleLogout()" class="btn btn-secondary">退出登录</button>
      </div>
    </div>
    <div id="admin-content"></div>
  `;
  
  showNewPostForm();
}

// === 文章编辑器 ===
function showNewPostForm() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  
  AdminApp.currentPost = null;
  AdminApp.isEditing = false;
  
  content.innerHTML = `
    <div class="admin-form">
      <form id="post-form" onsubmit="handleSavePost(event)">
        <div class="form-group">
          <label class="form-label">标题</label>
          <input type="text" id="post-title" class="form-input" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">别名（URL Slug）</label>
          <input type="text" id="post-slug" class="form-input" placeholder="留空自动生成">
        </div>
        
        <div class="form-group">
          <label class="form-label">内容（支持 Markdown）</label>
          <textarea id="post-content" class="form-textarea" style="min-height: 400px;" required></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">摘要</label>
          <textarea id="post-excerpt" class="form-textarea" rows="3"></textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">分类</label>
            <input type="text" id="post-category" class="form-input">
          </div>
          
          <div class="form-group">
            <label class="form-label">标签（逗号分隔）</label>
            <input type="text" id="post-tags" class="form-input" placeholder="技术, 生活">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">封面图片</label>
          <input type="text" id="post-cover" class="form-input" placeholder="图片 URL">
          <div style="margin-top: 0.5rem;">
            <input type="file" id="cover-upload" accept="image/*" style="display: none;" onchange="handleImageUpload(event, 'post-cover')">
            <button type="button" onclick="document.getElementById('cover-upload').click()" class="btn btn-secondary">上传图片</button>
          </div>
        </div>
        
        <div style="display: flex; gap: 1rem; align-items: center;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="post-pinned">
            <span>置顶</span>
          </label>
          
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="post-draft">
            <span>保存为草稿</span>
          </label>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="submit" class="btn btn-primary">发布文章</button>
          <button type="button" onclick="saveDraft()" class="btn btn-secondary">保存草稿</button>
          <button type="button" onclick="previewPost()" class="btn btn-secondary">预览</button>
        </div>
        
        <div id="save-status" style="margin-top: 1rem; color: var(--color-text-secondary);"></div>
      </form>
    </div>
  `;
}

function initEditor() {
  // 简单的 Markdown 编辑器增强
  document.addEventListener('keydown', (e) => {
    const textarea = document.getElementById('post-content');
    if (!textarea || e.target !== textarea) return;
    
    // Ctrl/Cmd + S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDraft();
    }
    
    // Tab 键支持
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
  });
}

// === 图片上传 ===
function initUpload() {
  // 拖拽上传支持
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      await uploadImage(files[0]);
    }
  });
}

async function handleImageUpload(event, targetInputId) {
  const file = event.target.files[0];
  if (!file) return;
  
  const url = await uploadImage(file);
  if (url && targetInputId) {
    document.getElementById(targetInputId).value = url;
  }
}

async function uploadImage(file) {
  const statusDiv = document.getElementById('save-status');
  if (statusDiv) statusDiv.textContent = '上传中...';
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    if (statusDiv) statusDiv.textContent = '上传成功！';
    
    return data.url;
  } catch (error) {
    console.error('Upload error:', error);
    if (statusDiv) statusDiv.textContent = '上传失败';
    return null;
  }
}

// === 保存文章 ===
async function handleSavePost(event) {
  event.preventDefault();
  
  const postData = getPostFormData();
  const statusDiv = document.getElementById('save-status');
  
  try {
    statusDiv.textContent = '发布中...';
    
    const url = AdminApp.currentPost 
      ? `/api/post/${AdminApp.currentPost.id}`
      : '/api/posts';
    
    const method = AdminApp.currentPost ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      throw new Error('Save failed');
    }
    
    const result = await response.json();
    statusDiv.textContent = '发布成功！';
    statusDiv.style.color = 'green';
    
    // 清除草稿
    clearDraft();
    
    // 3秒后跳转到文章页
    setTimeout(() => {
      window.location.href = `/post/${result.slug}`;
    }, 2000);
    
  } catch (error) {
    console.error('Save error:', error);
    statusDiv.textContent = '发布失败，请重试';
    statusDiv.style.color = 'red';
  }
}

function getPostFormData() {
  const title = document.getElementById('post-title').value;
  const slug = document.getElementById('post-slug').value;
  const content = document.getElementById('post-content').value;
  const excerpt = document.getElementById('post-excerpt').value;
  const category = document.getElementById('post-category').value;
  const tagsInput = document.getElementById('post-tags').value;
  const cover = document.getElementById('post-cover').value;
  const pinned = document.getElementById('post-pinned').checked;
  const draft = document.getElementById('post-draft').checked;
  
  const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
  
  return {
    title,
    slug: slug || generateSlug(title),
    content,
    excerpt: excerpt || content.substring(0, 200),
    category,
    tags,
    cover,
    pinned,
    status: draft ? 'draft' : 'published'
  };
}

function generateSlug(title) {
  // 简单的 slug 生成：拼音或时间戳
  return Date.now().toString(36);
}

// === 自动保存草稿 ===
function initAutoSave() {
  const textarea = document.getElementById('post-content');
  if (!textarea) return;
  
  textarea.addEventListener('input', () => {
    clearTimeout(AdminApp.autoSaveTimer);
    AdminApp.autoSaveTimer = setTimeout(saveDraft, 3000);
  });
}

function saveDraft() {
  const formData = getPostFormData();
  localStorage.setItem('blog_draft', JSON.stringify({
    ...formData,
    savedAt: Date.now()
  }));
  
  const statusDiv = document.getElementById('save-status');
  if (statusDiv) {
    statusDiv.textContent = `草稿已保存 ${new Date().toLocaleTimeString()}`;
    statusDiv.style.color = 'var(--color-text-secondary)';
  }
}

function loadDraft() {
  const draft = localStorage.getItem('blog_draft');
  if (!draft) return;
  
  try {
    const data = JSON.parse(draft);
    const hoursSinceLastSave = (Date.now() - data.savedAt) / 1000 / 60 / 60;
    
    // 只加载24小时内的草稿
    if (hoursSinceLastSave > 24) {
      clearDraft();
      return;
    }
    
    // 询问是否恢复草稿
    if (confirm('检测到未保存的草稿，是否恢复？')) {
      fillFormWithData(data);
    }
  } catch (error) {
    console.error('Failed to load draft:', error);
  }
}

function fillFormWithData(data) {
  document.getElementById('post-title').value = data.title || '';
  document.getElementById('post-slug').value = data.slug || '';
  document.getElementById('post-content').value = data.content || '';
  document.getElementById('post-excerpt').value = data.excerpt || '';
  document.getElementById('post-category').value = data.category || '';
  document.getElementById('post-tags').value = data.tags ? data.tags.join(', ') : '';
  document.getElementById('post-cover').value = data.cover || '';
  document.getElementById('post-pinned').checked = data.pinned || false;
  document.getElementById('post-draft').checked = data.status === 'draft';
}

function clearDraft() {
  localStorage.removeItem('blog_draft');
}

// === 文章列表 ===
async function loadPostsList() {
  const content = document.getElementById('admin-content');
  if (!content) return;
  
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  try {
    const response = await fetch('/api/posts?all=true');
    const data = await response.json();
    
    content.innerHTML = `
      <div class="admin-form">
        <h2>所有文章</h2>
        <div style="margin-top: 1rem;">
          ${data.posts.map(post => `
            <div style="padding: 1rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3>${post.title}</h3>
                  <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
                    ${post.status === 'draft' ? '[草稿] ' : ''}
                    ${new Date(post.createdAt).toLocaleDateString()} · ${post.views || 0} 浏览
                  </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button onclick="editPost('${post.id}')" class="btn btn-secondary">编辑</button>
                  <button onclick="deletePost('${post.id}')" class="btn btn-secondary">删除</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = '<div class="loading">加载失败</div>';
  }
}

async function editPost(postId) {
  try {
    const response = await fetch(`/api/post/${postId}`);
    const post = await response.json();
    
    AdminApp.currentPost = post;
    AdminApp.isEditing = true;
    
    showNewPostForm();
    fillFormWithData(post);
  } catch (error) {
    alert('加载文章失败');
  }
}

async function deletePost(postId) {
  if (!confirm('确定要删除这篇文章吗？')) return;
  
  try {
    const response = await fetch(`/api/post/${postId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('删除成功');
      loadPostsList();
    } else {
      alert('删除失败');
    }
  } catch (error) {
    alert('删除失败');
  }
}

// === 预览 ===
function previewPost() {
  const formData = getPostFormData();
  const previewWindow = window.open('', 'preview', 'width=800,height=600');
  
  // 简单的 Markdown 解析（复制自 app.js）
  const parseMarkdown = (markdown) => {
    if (!markdown) return '';
    let html = markdown;
    
    // 如果已经是 HTML，直接返回
    if (html.startsWith('<')) return html;
    
    // 代码块
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
    });
    
    // 标题
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // 粗体和斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // 图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    
    return html;
  };
  
  const contentHtml = parseMarkdown(formData.content);
  
  previewWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>预览: ${formData.title}</title>
      <link rel="stylesheet" href="/assets/style.css">
    </head>
    <body>
      <div class="container" style="padding: 2rem;">
        <div class="post-detail">
          <div class="post-header">
            <h1 class="post-title">${formData.title}</h1>
            <div class="post-meta">
              <span>${formData.category || '未分类'}</span>
            </div>
          </div>
          <div class="post-content">
            ${contentHtml}
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
}

// === 退出登录 ===
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  } catch (error) {
    alert('退出失败');
  }
}

// === 应用入口 ===
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}

// 导出全局函数
window.handleLogin = handleLogin;
window.handleSavePost = handleSavePost;
window.handleImageUpload = handleImageUpload;
window.saveDraft = saveDraft;
window.previewPost = previewPost;
window.loadPostsList = loadPostsList;
window.showNewPostForm = showNewPostForm;
window.editPost = editPost;
window.deletePost = deletePost;
window.handleLogout = handleLogout;
