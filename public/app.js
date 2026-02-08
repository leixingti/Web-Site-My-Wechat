// ========================================
// 全局状态
// ========================================

let currentPage = 1;
let currentSearch = '';
const ARTICLES_PER_PAGE = 12;

// ========================================
// DOM 元素
// ========================================

const articlesGrid = document.getElementById('articlesGrid');
const pagination = document.getElementById('pagination');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');

// ========================================
// 初始化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  loadArticles();
  loadStats();
  setupEventListeners();
});

// ========================================
// 事件监听
// ========================================

function setupEventListeners() {
  // 搜索功能
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  // 刷新按钮
  refreshBtn.addEventListener('click', handleRefresh);
}

function handleSearch() {
  currentSearch = searchInput.value.trim();
  currentPage = 1;
  loadArticles();
}

async function handleRefresh() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = '刷新中...';
  
  try {
    const response = await fetch('/api/fetch', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showNotification('✅ 数据已刷新', 'success');
      loadArticles();
      loadStats();
    } else {
      showNotification('❌ 刷新失败: ' + data.error, 'error');
    }
  } catch (err) {
    showNotification('❌ 网络错误', 'error');
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = '刷新';
  }
}

// ========================================
// 加载文章列表
// ========================================

async function loadArticles() {
  showLoading();
  hideError();

  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: ARTICLES_PER_PAGE,
      search: currentSearch
    });

    const response = await fetch(`/api/articles?${params}`);
    
    if (!response.ok) {
      throw new Error('加载失败');
    }

    const data = await response.json();
    displayArticles(data.articles);
    displayPagination(data.pagination);
  } catch (err) {
    showError('加载文章失败，请稍后重试');
    console.error('加载错误:', err);
  } finally {
    hideLoading();
  }
}

// ========================================
// 加载统计信息
// ========================================

async function loadStats() {
  try {
    const response = await fetch('/api/articles?limit=1000'); // 获取所有文章用于统计
    const data = await response.json();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let todayCount = 0;
    let yesterdayCount = 0;
    let weekCount = 0;
    let olderCount = 0;
    
    data.articles.forEach(article => {
      const pubDate = new Date(article.pubDate);
      if (pubDate >= today) {
        todayCount++;
      } else if (pubDate >= yesterday) {
        yesterdayCount++;
      } else if (pubDate >= weekAgo) {
        weekCount++;
      } else {
        olderCount++;
      }
    });
    
    document.getElementById('totalArticles').textContent = data.pagination.total || 0;
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('yesterdayCount').textContent = yesterdayCount;
    document.getElementById('weekCount').textContent = weekCount;
    document.getElementById('olderCount').textContent = olderCount;
  } catch (err) {
    console.error('加载统计失败:', err);
  }
}

// ========================================
// 显示文章列表（按日期分类）
// ========================================

function displayArticles(articles) {
  if (articles.length === 0) {
    articlesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="font-size: 1.125rem; color: var(--text-secondary);">
          ${currentSearch ? '😔 没有找到匹配的文章' : '📭 暂无文章'}
        </p>
      </div>
    `;
    return;
  }

  // 按日期分组
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = {
    today: [],
    yesterday: [],
    week: [],
    older: []
  };

  articles.forEach(article => {
    const pubDate = new Date(article.pubDate);
    if (pubDate >= today) {
      groups.today.push(article);
    } else if (pubDate >= yesterday) {
      groups.yesterday.push(article);
    } else if (pubDate >= weekAgo) {
      groups.week.push(article);
    } else {
      groups.older.push(article);
    }
  });

  // 生成HTML
  let html = '';
  
  const sections = [
    { key: 'today', title: '📅 今天', articles: groups.today },
    { key: 'yesterday', title: '📅 昨天', articles: groups.yesterday },
    { key: 'week', title: '📅 本周', articles: groups.week },
    { key: 'older', title: '📅 更早', articles: groups.older }
  ];

  sections.forEach(section => {
    if (section.articles.length > 0) {
      html += `
        <div style="grid-column: 1/-1;">
          <h2 class="section-title">${section.title}</h2>
        </div>
      `;
      
      section.articles.forEach(article => {
        html += generateArticleCard(article);
      });
    }
  });

  articlesGrid.innerHTML = html;
}

function generateArticleCard(article) {
  return `
    <article class="article-card" onclick="openArticle('${escapeHtml(article.link)}')">
      ${article.imageUrl ? `
        <img src="${escapeHtml(article.imageUrl)}" 
             alt="${escapeHtml(article.title)}" 
             class="article-image"
             onerror="this.style.display='none'"
        >
      ` : ''}
      
      <div class="article-content">
        <div class="article-meta">
          <span class="article-source">${escapeHtml(article.source)}</span>
          <span class="article-date">
            📅 ${formatDate(article.pubDate)}
          </span>
        </div>
        
        <h2 class="article-title">${escapeHtml(article.title)}</h2>
        
        <p class="article-description">
          ${escapeHtml(article.description || '暂无摘要')}
        </p>
        
        <div class="article-footer">
          <span class="article-author">
            ✍️ ${escapeHtml(article.source)}
          </span>
          <a href="${escapeHtml(article.link)}" 
             class="read-more" 
             onclick="event.stopPropagation();"
             target="_blank"
             rel="noopener noreferrer"
          >
            阅读原文 →
          </a>
        </div>
      </div>
    </article>
  `;
}

// ========================================
// 显示分页
// ========================================

function displayPagination(pagination) {
  if (pagination.totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const { page, totalPages } = pagination;
  
  let html = `
    <button class="page-btn" 
            onclick="changePage(${page - 1})" 
            ${page === 1 ? 'disabled' : ''}>
      ← 上一页
    </button>
  `;

  // 显示页码
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      html += `<span class="page-info">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="page-btn ${i === page ? 'active' : ''}" 
              onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span class="page-info">...</span>`;
    }
    html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }

  html += `
    <button class="page-btn" 
            onclick="changePage(${page + 1})" 
            ${page === totalPages ? 'disabled' : ''}>
      下一页 →
    </button>
  `;

  this.pagination.innerHTML = html;
}

// ========================================
// 翻页
// ========================================

function changePage(page) {
  currentPage = page;
  loadArticles();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// 打开文章
// ========================================

function openArticle(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ========================================
// UI 辅助函数
// ========================================

function showLoading() {
  loading.style.display = 'block';
  articlesGrid.style.display = 'none';
}

function hideLoading() {
  loading.style.display = 'none';
  articlesGrid.style.display = 'grid';
}

function showError(message) {
  error.textContent = message;
  error.style.display = 'block';
}

function hideError() {
  error.style.display = 'none';
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========================================
// 工具函数
// ========================================

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// ========================================
// 添加CSS动画
// ========================================

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
