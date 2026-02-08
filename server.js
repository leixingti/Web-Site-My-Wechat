const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const db = require('./database');
const { fetchArticles } = require('./fetcher');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 健康检查端点
app.get('/health', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM articles', (err, row) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: err.message 
      });
    }
    res.json({
      status: 'ok',
      articlesCount: row.count,
      lastCheck: new Date().toISOString()
    });
  });
});

// API: 获取所有文章
app.get('/api/articles', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let query = 'SELECT * FROM articles';
  let countQuery = 'SELECT COUNT(*) as total FROM articles';
  const params = [];

  if (search) {
    query += ' WHERE title LIKE ? OR description LIKE ?';
    countQuery += ' WHERE title LIKE ? OR description LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY pubDate DESC LIMIT ? OFFSET ?';
  
  db.get(countQuery, params, (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.all(query, [...params, limit, offset], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        articles: rows,
        pagination: {
          page,
          limit,
          total: countRow.total,
          totalPages: Math.ceil(countRow.total / limit)
        }
      });
    });
  });
});

// API: 获取单篇文章
app.get('/api/articles/:id', (req, res) => {
  db.get('SELECT * FROM articles WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '文章未找到' });
    }
    res.json(row);
  });
});

// API: 手动触发抓取
app.post('/api/fetch', async (req, res) => {
  try {
    console.log('📡 手动触发文章抓取...');
    await fetchArticles();
    res.json({ 
      success: true, 
      message: '文章抓取完成',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 抓取失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 服务前端页面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 定时任务：每小时抓取一次
cron.schedule('0 * * * *', async () => {
  console.log('⏰ 定时任务触发 -', new Date().toLocaleString('zh-CN'));
  try {
    await fetchArticles();
    console.log('✅ 定时抓取完成');
  } catch (error) {
    console.error('❌ 定时抓取失败:', error);
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`⏰ 定时任务已设置：每小时抓取一次文章`);
  console.log(`📊 健康检查：http://localhost:${PORT}/health`);
  
  // 启动时立即抓取一次
  fetchArticles().then(() => {
    console.log('✅ 初始数据加载完成');
  }).catch(err => {
    console.error('❌ 初始数据加载失败:', err.message);
  });
});
