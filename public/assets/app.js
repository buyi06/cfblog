// ===== Cloudflare Pages 博客前端核心 =====
// 纯原生 ES Modules，无任何依赖

// === 全局状态管理 ===
const AppState = {
  posts: [],
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  theme: localStorage.getItem('theme') || 'light'
};

// === 初始化应用 ===
function initApp() {
  initTheme();
  initRouter();
  initThemeToggle();
  loadPageContent();
}

// === 主题管理 ===
function initTheme() {
  document.documentElement.setAttribute('data-theme', AppState.theme);
}

function toggleTheme() {
  AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', AppState.theme);
  localStorage.setItem('theme', AppState.theme);
}

function initThemeToggle() {
  const toggleBtn = document.querySelector('.theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
    updateThemeIcon();
  }
}

function updateThemeIcon() {
  const toggleBtn = document.querySelector('.theme-toggle');
  if (!toggleBtn) return;
  
  const icon = AppState.theme === 'dark' 
    ? '<svg width="20" height="20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>'
    : '<svg width="20" height="20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>';
  
  toggleBtn.innerHTML = icon;
}

// === 路由管理（PJAX + View Transitions） ===
function initRouter() {
  // 拦截所有内部链接
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href || link.target === '_blank') return;
    
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    
    e.preventDefault();
    navigateTo(url.pathname);
  });
  
  // 处理浏览器前进/后退
  window.addEventListener('popstate', () => {
    loadPageContent();
  });
}

async function navigateTo(path) {
  // 检查是否支持 View Transitions API
  if (document.startViewTransition) {
    document.startViewTransition(() => updatePage(path));
  } else {
    // 降级到 PJAX
    await updatePageWithPJAX(path);
  }
  
  // 更新浏览器历史
  if (path !== window.location.pathname) {
    window.history.pushState({}, '', path);
  }
}

async function updatePage(path) {
  const response = await fetch(path, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  });
  
  if (!response.ok) {
    console.error('Failed to load page:', response.status);
    return;
  }
  
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 更新主内容区
  const newMain = doc.querySelector('.main');
  const currentMain = document.querySelector('.main');
  if (newMain && currentMain) {
    currentMain.innerHTML = newMain.innerHTML;
  }
  
  // 更新标题
  document.title = doc.title;
  
  // 重新初始化当前页面
  loadPageContent();
  
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updatePageWithPJAX(path) {
  // 添加淡出动画
  const main = document.querySelector('.main');
  main.style.opacity = '0';
  main.style.transform = 'translateY(20px)';
  
  await new Promise(resolve => setTimeout(resolve, 240));
  
  await updatePage(path);
  
  // 添加淡入动画
  main.style.transition = 'all 240ms cubic-bezier(0.2, 0.8, 0.2, 1)';
  requestAnimationFrame(() => {
    main.style.opacity = '1';
    main.style.transform = 'translateY(0)';
  });
}

// === 页面内容加载 ===
async function loadPageContent() {
  const path = window.location.pathname;
  
  // 根据路径加载不同内容
  if (path === '/' || path === '/index.html') {
    await loadHomePage();
  } else if (path.startsWith('/post/')) {
    await loadPostDetail();
  } else if (path === '/archive.html' || path === '/archive') {
    await loadArchivePage();
  } else if (path === '/links.html' || path === '/links') {
    await loadLinksPage();
  }
  
  // 更新导航高亮
  updateActiveNav();
}

// === 首页加载 ===
async function loadHomePage() {
  const container = document.getElementById('post-list');
  if (!container) return;
  
  showLoading(container);
  
  try {
    const response = await fetch('/api/posts?page=1&limit=10');
    const data = await response.json();
    
    if (data.posts && data.posts.length > 0) {
      AppState.posts = data.posts;
      AppState.totalPages = data.totalPages || 1;
      renderPostList(container, data.posts);
    } else {
      container.innerHTML = '<div class="loading">暂无文章</div>';
    }
  } catch (error) {
    console.error('Failed to load posts:', error);
    container.innerHTML = '<div class="loading">加载失败，请刷新重试</div>';
  }
}

function renderPostList(container, posts) {
  container.innerHTML = posts.map((post, index) => `
    <article class="post-card" style="animation-delay: ${index * 60}ms">
      <div class="post-card-header">
        <div class="post-meta">
          <span class="post-meta-item">${formatDate(post.createdAt)}</span>
          ${post.category ? `<span class="post-meta-item">${post.category}</span>` : ''}
          <span class="post-meta-item">${post.views || 0} 次浏览</span>
        </div>
        <a href="/post/${post.slug}" class="post-title">${escapeHtml(post.title)}</a>
      </div>
      ${post.excerpt ? `<div class="post-excerpt">${escapeHtml(post.excerpt)}</div>` : ''}
      ${post.tags && post.tags.length > 0 ? `
        <div class="post-tags">
          ${post.tags.map(tag => `<a href="/tag/${tag}" class="tag">${escapeHtml(tag)}</a>`).join('')}
        </div>
      ` : ''}
    </article>
  `).join('');
}

// === 文章详情加载 ===
async function loadPostDetail() {
  const container = document.getElementById('post-detail');
  if (!container) return;
  
  const slug = window.location.pathname.split('/').pop();
  showLoading(container);
  
  try {
    const response = await fetch(`/api/post/${slug}`);
    if (!response.ok) {
      throw new Error('Post not found');
    }
    
    const post = await response.json();
    renderPostDetail(container, post);
    
    // 增加浏览量
    fetch(`/api/post/${slug}/view`, { method: 'POST' }).catch(() => {});
  } catch (error) {
    console.error('Failed to load post:', error);
    container.innerHTML = '<div class="loading">文章不存在或已删除</div>';
  }
}

function renderPostDetail(container, post) {
  // 解析 Markdown 内容
  const contentHtml = post.content.startsWith('<') 
    ? post.content  // 如果已经是 HTML，直接使用
    : parseMarkdown(post.content);  // 否则解析 Markdown
  
  container.innerHTML = `
    <div class="post-header">
      <h1 class="post-title">${escapeHtml(post.title)}</h1>
      <div class="post-meta">
        <span class="post-meta-item">${formatDate(post.createdAt)}</span>
        ${post.category ? `<span class="post-meta-item">${post.category}</span>` : ''}
        <span class="post-meta-item">${post.views || 0} 次浏览</span>
      </div>
      ${post.tags && post.tags.length > 0 ? `
        <div class="post-tags">
          ${post.tags.map(tag => `<a href="/tag/${tag}" class="tag">${escapeHtml(tag)}</a>`).join('')}
        </div>
      ` : ''}
    </div>
    <div class="post-content">
      ${contentHtml}
    </div>
  `;
  
  // 懒加载图片
  lazyLoadImages(container);
}

// === 归档页面加载 ===
async function loadArchivePage() {
  const container = document.getElementById('archive-list');
  if (!container) return;
  
  showLoading(container);
  
  try {
    const response = await fetch('/api/posts?archive=true');
    const data = await response.json();
    
    if (data.posts && data.posts.length > 0) {
      renderArchiveList(container, data.posts);
    } else {
      container.innerHTML = '<div class="loading">暂无归档</div>';
    }
  } catch (error) {
    console.error('Failed to load archive:', error);
    container.innerHTML = '<div class="loading">加载失败</div>';
  }
}

function renderArchiveList(container, posts) {
  // 按年份分组
  const groupedByYear = {};
  posts.forEach(post => {
    const year = new Date(post.createdAt).getFullYear();
    if (!groupedByYear[year]) {
      groupedByYear[year] = [];
    }
    groupedByYear[year].push(post);
  });
  
  const years = Object.keys(groupedByYear).sort((a, b) => b - a);
  
  container.innerHTML = years.map(year => `
    <div class="archive-year-group">
      <h2 class="archive-year">${year}</h2>
      ${groupedByYear[year].map(post => `
        <div class="archive-item">
          <div class="archive-date">${formatDate(post.createdAt, 'MM-DD')}</div>
          <a href="/post/${post.slug}" class="archive-title">${escapeHtml(post.title)}</a>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// === 友链页面加载 ===
async function loadLinksPage() {
  const container = document.getElementById('links-grid');
  if (!container) return;
  
  showLoading(container);
  
  try {
    const response = await fetch('/api/links');
    const links = await response.json();
    
    if (links && links.length > 0) {
      renderLinksList(container, links);
    } else {
      container.innerHTML = '<div class="loading">暂无友链</div>';
    }
  } catch (error) {
    console.error('Failed to load links:', error);
    container.innerHTML = '<div class="loading">加载失败</div>';
  }
}

function renderLinksList(container, links) {
  container.innerHTML = links.map((link, index) => `
    <a href="${link.url}" class="link-card" target="_blank" rel="noopener" style="animation-delay: ${index * 60}ms">
      <img src="${link.avatar || '/assets/logo.svg'}" alt="${escapeHtml(link.name)}" class="link-avatar">
      <div class="link-info">
        <div class="link-name">${escapeHtml(link.name)}</div>
        <div class="link-desc">${escapeHtml(link.desc || '')}</div>
      </div>
    </a>
  `).join('');
}

// === 工具函数 ===

// 简单的 Markdown 解析（支持常用语法）
function parseMarkdown(markdown) {
  if (!markdown) return '';
  
  let html = markdown;
  
  // 代码块（需要先处理，避免被其他规则影响）
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // 粗体和斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 无序列表
  html = html.replace(/^\- (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
  
  // 引用
  html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');
  
  // 水平线
  html = html.replace(/^---$/gim, '<hr>');
  html = html.replace(/^\*\*\*$/gim, '<hr>');
  
  // 段落（两个换行符之间的内容）
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  // 清理多余的 <p> 标签
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
  
  return html;
}

function showLoading(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function formatDate(timestamp, format = 'YYYY-MM-DD') {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (format === 'MM-DD') {
    return `${month}-${day}`;
  }
  return `${year}-${month}-${day}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '/' && href === '/index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// === 图片懒加载 ===
function lazyLoadImages(container) {
  const images = container.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => observer.observe(img));
  } else {
    // 降级方案：直接加载所有图片
    images.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// === 搜索功能 ===
async function searchPosts(keyword) {
  if (!keyword || keyword.trim().length === 0) return;
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
    const results = await response.json();
    
    const container = document.getElementById('post-list');
    if (container && results.length > 0) {
      renderPostList(container, results);
    } else if (container) {
      container.innerHTML = '<div class="loading">未找到相关文章</div>';
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// === 应用入口 ===
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 导出给全局使用
window.BlogApp = {
  navigateTo,
  searchPosts,
  toggleTheme
};
