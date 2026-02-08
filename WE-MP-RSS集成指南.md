# 🔗 We-MP-RSS 集成指南

您已经部署了 we-mp-rss 服务，现在将它与文章聚合系统连接起来！

## 📍 您的服务地址

```
https://we-mp-rss-production-fcb0.up.railway.app/
```

---

## 🚀 快速集成步骤

### 第1步：找到 RSS 订阅链接

1. **访问您的 we-mp-rss 服务**
   ```
   https://we-mp-rss-production-fcb0.up.railway.app/
   ```

2. **查看首页或文档**
   - 通常会显示如何获取RSS链接
   - 可能的格式：
     - `/feed` - 所有订阅
     - `/rss` - RSS格式
     - `/atom` - Atom格式
     - `/feed/{公众号名称}` - 单个公众号

3. **测试RSS链接**
   尝试访问这些URL，看哪个有效：
   ```
   https://we-mp-rss-production-fcb0.up.railway.app/feed
   https://we-mp-rss-production-fcb0.up.railway.app/rss
   https://we-mp-rss-production-fcb0.up.railway.app/atom
   ```

   **有效的RSS链接应该：**
   - 显示XML格式的内容
   - 包含 `<rss>` 或 `<feed>` 标签
   - 列出文章列表

---

### 第2步：更新代码配置

**已经为您更新了 `fetcher.js` 文件！**

现在的配置已经指向您的 we-mp-rss 服务：

```javascript
const WE_MP_RSS_BASE_URL = 'https://we-mp-rss-production-fcb0.up.railway.app';

const RSS_FEEDS = [
  {
    name: '所有订阅',
    url: `${WE_MP_RSS_BASE_URL}/feed`, // 默认尝试 /feed
  },
];
```

**如果 `/feed` 不行：**

编辑 `fetcher.js` 第 16-18 行，改为：
```javascript
url: `${WE_MP_RSS_BASE_URL}/rss`,  // 或 /atom
```

---

### 第3步：上传更新到 GitHub

**方法A：网页上传（简单）**

1. 访问您的 GitHub 仓库
   ```
   https://github.com/您的用户名/wechat-rss-aggregator
   ```

2. 点击 `fetcher.js` 文件

3. 点击右上角铅笔图标（Edit）

4. 删除所有内容，复制粘贴更新后的代码

5. 滚动到底部，点击 "Commit changes"

**方法B：使用 Git（如果您会用）**

```bash
cd wechat-rss-aggregator
git add fetcher.js
git commit -m "配置 we-mp-rss 服务"
git push
```

---

### 第4步：Railway 自动部署

1. 提交到 GitHub 后，Railway 会自动检测到更新

2. 访问 Railway 项目页面：https://railway.app/

3. 点击您的项目

4. 在 "Deployments" 看到新的部署正在进行

5. 等待 2-3 分钟，直到状态变为 "Active" ✅

---

### 第5步：验证是否工作

#### 方法1：查看 Railway 日志

1. Railway 项目页面 → Deployments

2. 点击最新的部署 → View Logs

3. 查找这些日志：
   ```
   🚀 开始抓取文章...
   📡 正在抓取: 所有订阅
   📝 找到 X 篇文章
   ✅ 新增: [文章标题]
   📊 抓取完成统计
   ```

4. **如果看到错误：**
   ```
   ❌ 抓取失败: ...
   💡 提示: 请检查URL是否正确
   ```
   说明RSS链接配置不对，需要调整

#### 方法2：访问网站

1. 打开您的网站：
   ```
   https://您的项目.railway.app
   ```

2. 等待几秒（初次抓取需要时间）

3. 点击页面上的"刷新"按钮

4. **应该能看到文章了！** 🎉

#### 方法3：手动触发抓取

访问这个URL：
```
https://您的项目.railway.app/api/fetch
```

会返回：
```json
{
  "success": true,
  "message": "文章抓取完成",
  "timestamp": "2026-02-08T..."
}
```

---

## 🔧 常见问题排查

### Q1: 日志显示"没有找到文章"

**原因：** RSS URL 配置不对

**解决：**

1. 手动访问这些URL，看哪个能打开：
   ```
   https://we-mp-rss-production-fcb0.up.railway.app/feed
   https://we-mp-rss-production-fcb0.up.railway.app/rss
   https://we-mp-rss-production-fcb0.up.railway.app/atom
   https://we-mp-rss-production-fcb0.up.railway.app/feeds
   ```

2. 找到能打开且显示XML内容的URL

3. 更新 `fetcher.js` 中的URL

### Q2: we-mp-rss 首页是什么样的？

**we-mp-rss 通常提供：**
- 管理界面（添加/删除订阅）
- RSS订阅链接
- 使用说明

**如果不确定：**
- 查看 we-mp-rss 的 GitHub 仓库文档
- 或访问服务首页查看说明

### Q3: 需要在 we-mp-rss 中添加公众号订阅吗？

**是的！**

1. 访问：`https://we-mp-rss-production-fcb0.up.railway.app/`

2. 找到"添加订阅"或类似功能

3. 输入公众号名称或ID

4. 保存订阅

5. 然后我们的系统才能抓取到文章

### Q4: 如何订阅特定公众号？

**在 `fetcher.js` 中添加：**

```javascript
const RSS_FEEDS = [
  {
    name: '人民日报',
    url: `${WE_MP_RSS_BASE_URL}/feed/人民日报`,
  },
  {
    name: '新华网',
    url: `${WE_MP_RSS_BASE_URL}/feed/新华网`,
  },
  // 添加更多...
];
```

**注意：** URL格式取决于您的 we-mp-rss 配置

---

## 📊 监控抓取状态

### 查看实时日志

**Railway 日志：**
```bash
# 每小时会看到这样的输出
⏰ 定时任务触发 - 2026/2/8 10:00:00
🚀 开始抓取文章...
📡 正在抓取: 所有订阅
📝 找到 5 篇文章
  ✅ 新增: AI技术赋能传统产业
  ✅ 新增: 2026年科技趋势报告
📊 抓取完成统计:
   ✅ 新增文章: 5 篇
   ⏭️  跳过重复: 0 篇
   ⏱️  用时: 2.35 秒
```

### 健康检查

访问：
```
https://您的项目.railway.app/health
```

返回：
```json
{
  "status": "ok",
  "articlesCount": 25,
  "lastCheck": "2026-02-08T10:00:00.000Z"
}
```

---

## ⚙️ 高级配置

### 调整抓取频率

编辑 `server.js` 第 57 行：

```javascript
// 每小时抓取（默认）
cron.schedule('0 * * * *', ...

// 每30分钟抓取
cron.schedule('*/30 * * * *', ...

// 每天早上8点抓取
cron.schedule('0 8 * * *', ...

// 每15分钟抓取
cron.schedule('*/15 * * * *', ...
```

### 限制抓取数量

在 `fetcher.js` 中添加限制：

```javascript
// 找到第 43 行附近
console.log(`  📝 找到 ${feedData.items.length} 篇文章`);

// 在下一行添加：
const items = feedData.items.slice(0, 20); // 只取前20篇

// 然后修改循环：
for (const item of items) {  // 改为 items 而不是 feedData.items
  // ...
}
```

---

## ✅ 完成检查清单

部署完成后确认：

- [ ] we-mp-rss 服务正常运行
- [ ] 已在 we-mp-rss 中添加公众号订阅
- [ ] 找到了正确的RSS链接格式
- [ ] 更新了 `fetcher.js` 配置
- [ ] 代码已推送到 GitHub
- [ ] Railway 自动部署成功
- [ ] 网站能访问
- [ ] 日志显示成功抓取文章
- [ ] 网站上能看到文章列表

全部打勾？🎉 **恭喜，完全集成成功！**

---

## 🆘 需要帮助？

**如果遇到问题：**

1. **先查看 Railway 日志**
   - 找到具体的错误信息

2. **测试 RSS 链接**
   - 在浏览器中直接访问RSS链接
   - 确保能看到XML内容

3. **回到对话向我提问**
   - 复制完整的错误信息
   - 告诉我您尝试了什么

---

## 📝 下一步

集成成功后：

1. **监控运行**
   - 定期查看 Railway 日志
   - 确认每小时抓取正常

2. **添加更多订阅**
   - 在 we-mp-rss 中添加公众号
   - 自动抓取新内容

3. **自定义样式**
   - 修改颜色、布局
   - 让网站更个性化

**祝使用愉快！** 🚀
