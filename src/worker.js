// 博客系统 - Cloudflare Workers + D1 + R2
// 项目名称: cloudflare-light-blog

// ==================== 路由处理 ====================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 初始化数据库
    await initDB(env);

    // API 路由
    if (path.startsWith('/api/')) {
      return handleAPI(request, env, path);
    }

    // 后台路由
    if (path.startsWith('/admin/')) {
      return handleAdmin(request, env, path);
    }

    // 静态资源（R2 图片）
    if (path.startsWith('/images/')) {
      return handleImage(request, env, path);
    }

    // 前台页面
    return handleFrontend(request, env);
  }
};

// ==================== 数据库初始化 ====================
async function initDB(env) {
  if (!env.DB) {
    console.error('D1 数据库未绑定');
    return false;
  }

  try {
    // 检查 posts 表是否存在
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='posts'"
    ).all();

    // 检查并添加 password 列（如果不存在）
    if (results.length > 0) {
      try {
        await env.DB.prepare("SELECT password FROM posts LIMIT 1").all();
      } catch (e) {
        await env.DB.prepare("ALTER TABLE posts ADD COLUMN password TEXT").run();
        console.log('已添加 password 列');
      }
    }

    // 检查 categories 表是否存在
    const catResults = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
    ).all();

    if (catResults.results ? catResults.results.length === 0 : catResults.length === 0) {
      console.log('创建分类表...');
      await env.DB.prepare(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL
        )
      `).run();
    }

    // 检查 settings 表是否存在
    const setResults = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'"
    ).all();

    if (setResults.results ? setResults.results.length === 0 : setResults.length === 0) {
      console.log('开始创建数据库表...');
      
      // 使用 prepare 执行 CREATE TABLE
      await env.DB.prepare(`
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          content TEXT NOT NULL,
          excerpt TEXT,
          password TEXT,
          cover_image TEXT,
          category TEXT DEFAULT '未分类',
          tags TEXT,
          status TEXT DEFAULT 'draft',
          view_count INTEGER DEFAULT 0,
          created_at TEXT,
          updated_at TEXT
        )
      `).run();

      // 获取当前时间
      const now = new Date().toISOString();

      // 插入默认设置
      await env.DB.prepare(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_name', '我的博客').run();

      await env.DB.prepare(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_description', '一个使用 Cloudflare 构建的博客').run();

      await env.DB.prepare(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_favicon', '').run();

      await env.DB.prepare(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_avatar', '').run();

      await env.DB.prepare(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_bio', '').run();

      await env.DB.prepare(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_links', '').run();

      await env.DB.prepare(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_author', '').run();

      // 插入示例文章
      await env.DB.prepare(`
        INSERT INTO posts (title, slug, content, excerpt, cover_image, category, tags, status, view_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        '欢迎使用 cloudflare-light-blog',
        'welcome',
        '# 欢迎\
\
这是一个基于 Cloudflare Workers + D1 + R2 构建的轻量级博客系统。\
\
## 功能特点\
\
- ✅ 简洁的后台管理\
- ✅ 支持文章封面图\
- ✅ 高速部署\
- ✅ 免费额度充足\
\
开始你的博客之旅吧！',
        '这是一个基于 Cloudflare Workers 构建的轻量级博客系统...',
        '',
        '技术教程',
        'Cloudflare,博客',
        'published',
        0,
        now,
        now
      ).run();

      console.log('数据库初始化完成，已添加示例文章');
    }
    return true;
  } catch (e) {
    console.error('数据库初始化错误:', e);
    return false;
  }
}

// ==================== API 处理 ====================
async function handleAPI(request, env, path) {
  // 确保数据库已初始化
  await initDB(env);
  
  const method = request.method;
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  // 登录接口不需要认证
  if (path === '/api/login' && method === 'POST') {
    const body = await request.json();
    if (!env.ADMIN_PASSWORD) {
      return json({ success: true, token: 'no-auth' });
    }
    if (body.password === env.ADMIN_PASSWORD) {
      return json({ success: true, token: generateToken(env.ADMIN_PASSWORD) });
    }
    return json({ success: false, error: '密码错误' }, 401);
  }

  // 确保数据库已初始化
  await initDB(env);

  // 公开 API（不需要认证）
  const publicAPIs = ['/api/posts', '/api/post/', '/api/categories', '/api/settings', '/api/stats', '/api/links'];
  const isPublicAPI = publicAPIs.some(api => path.startsWith(api));

  // 认证检查（非公开 API 需要认证）
  if (!isPublicAPI && env.ADMIN_PASSWORD) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token !== generateToken(env.ADMIN_PASSWORD)) {
      return json({ error: '未授权' }, 401);
    }
  }

  // 公开 API
  if (path === '/api/posts' && method === 'GET') {
    try {
      const { results } = await env.DB.prepare(
        "SELECT id, title, slug, content, excerpt, cover_image, category, tags, view_count, created_at FROM posts WHERE status='published' ORDER BY created_at DESC"
      ).all();
      return json(results);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (path === '/api/post/' && method === 'GET') {
    const slug = new URL(request.url).searchParams.get('slug');
    if (!slug) return json({ error: '缺少 slug' }, 400);

    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM posts WHERE slug=? AND status='published'"
      ).bind(slug).all();

      if (results.length === 0) {
        return json({ error: '文章不存在' }, 404);
      }

      // 更新浏览次数
      await env.DB.prepare(
        "UPDATE posts SET view_count = view_count + 1 WHERE id=?"
      ).bind(results[0].id).run();

      return json(results[0]);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (path === '/api/categories' && method === 'GET') {
    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM categories ORDER BY name"
      ).all();
      return json(results);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // 获取统计信息
  if (path === '/api/stats' && method === 'GET') {
    try {
      await initDB(env);
      const postCountResult = await env.DB.prepare("SELECT COUNT(*) as cnt FROM posts WHERE status='published'").first();
      const catCountResult = await env.DB.prepare("SELECT COUNT(*) as cnt FROM categories").first();
      console.log('stats result:', postCountResult, catCountResult);
      const result = { 
        postCount: postCountResult?.cnt ?? 0,
        catCount: catCountResult?.cnt ?? 0
      };
      console.log('stats returning:', result);
      return json(result);
    } catch (e) {
      console.error('stats error:', e);
      return json({ postCount: 0, catCount: 0 });
    }
  }

  // 友链管理 API
  if (path === '/api/links' && method === 'GET') {
    try {
      await initDB(env);
      const links = await env.DB.prepare("SELECT value FROM settings WHERE key='site_links'").first();
      const linksData = links?.value || '';
      // 解析简单格式：名称,地址 每行一个
      const result = linksData.split('\
').filter(line => line.trim()).map(line => {
        const parts = line.split(',');
        return { name: parts[0]?.trim() || '', url: parts[1]?.trim() || '' };
      }).filter(l => l.name && l.url);
      return json(result);
    } catch (e) {
      return json([]);
    }
  }

  if (path === '/api/links' && method === 'POST') {
    try {
      await initDB(env);
      const body = await request.json();
      // 转换为简单格式存储
      const text = Array.isArray(body) ? body.map(l => `${l.name},${l.url}`).join('\
') : '';
      await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind('site_links', text).run();
      return json({ success: true });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // 分类管理 API
  if (path === '/api/category' && method === 'POST') {
    try {
      const body = await request.json();
      const slug = body.name.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
      await env.DB.prepare(
        "INSERT INTO categories (name, slug) VALUES (?, ?)"
      ).bind(body.name, slug).run();
      return json({ success: true });
    } catch (e) {
      console.error('添加分类失败:', e);
      return json({ error: e.message }, 500);
    }
  }

  if (path.startsWith('/api/category') && method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return json({ error: '缺少id' }, 400);
    try {
      await env.DB.prepare("DELETE FROM categories WHERE id=?").bind(id).run();
      return json({ success: true });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (path === '/api/settings' && method === 'GET') {
    try {
      await initDB(env);
      const { results } = await env.DB.prepare("SELECT * FROM settings").all();
      const settings = {};
      if (results) {
        results.forEach(s => settings[s.key] = s.value);
      }
      return json(settings);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // 保存设置
  if (path === '/api/settings' && method === 'POST') {
    try {
      await initDB(env);
      const body = await request.json();
      for (const [key, value] of Object.entries(body)) {
        await env.DB.prepare(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
        ).bind(key, value).run();
      }
      return json({ success: true });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // 需要认证的 API
  if (path === '/api/admin/posts' && method === 'GET') {
    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM posts ORDER BY created_at DESC"
      ).all();
      return json(results);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (path === '/api/admin/post' && method === 'POST') {
    try {
      const body = await request.json();
      const slug = body.slug || generateSlug(body.title);
      let coverImage = body.cover_image;
      if (body.cover_image && body.cover_image.startsWith('data:')) {
        coverImage = await uploadImage(env, body.cover_image, slug);
      }
      const now = new Date().toISOString();
      const result = await env.DB.prepare(`
        INSERT INTO posts (title, slug, content, excerpt, cover_image, category, tags, status, password, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        body.title,
        slug,
        body.content,
        body.excerpt || (body.content ? body.content.substring(0, 200) : ''),
        coverImage || '',
        body.category || '未分类',
        body.tags || '',
        body.status || 'draft',
        body.password || '',
        now,
        now
      ).run();
      return json({ success: true, id: result.lastInsertRowid });
    } catch (e) {
      return json({ success: false, error: e.message }, 500);
    }
  }

  if (path === '/api/admin/post' && method === 'PUT') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return json({ error: '缺少 id' }, 400);
    try {
      const body = await request.json();
      let coverImage = body.cover_image;
      if (body.cover_image && body.cover_image.startsWith('data:')) {
        coverImage = await uploadImage(env, body.cover_image, id);
      }
      const now = new Date().toISOString();
      await env.DB.prepare(`
        UPDATE posts SET title=?, content=?, excerpt=?, cover_image=?, category=?, tags=?, status=?, password=?, updated_at=? WHERE id=?
      `).bind(
        body.title,
        body.content,
        body.excerpt || (body.content ? body.content.substring(0, 200) : ''),
        coverImage || body.cover_image || '',
        body.category || '未分类',
        body.tags || '',
        body.status || 'draft',
        body.password || '',
        now,
        id
      ).run();
      return json({ success: true });
    } catch (e) {
      return json({ success: false, error: e.message }, 500);
    }
  }

  if (path === '/api/admin/post' && method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return json({ error: '缺少 id' }, 400);
    try {
      await env.DB.prepare("DELETE FROM posts WHERE id=?").bind(id).run();
      return json({ success: true });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // 图片上传
  if (path === '/api/upload' && method === 'POST') {
    try {
      const body = await request.formData();
      const file = body.get('file');
      if (!file) return json({ error: '没有文件' }, 400);
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const contentType = file.type;
      const ext = contentType.split('/')[1] || 'jpg';
      const filename = generateRandomFilename() + '.' + ext;
      if (env.R2) {
        await env.R2.put(filename, arrayBuffer, { httpMetadata: { contentType } });
        return json({ url: `/images/${filename}` });
      }
      return json({ url: `data:${contentType};base64,${base64}` });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  return json({ error: '未找到接口' }, 404);
}

// ==================== 后台处理 ====================
async function handleAdmin(request, env, path) {
  // 检查是否是静态资源请求
  const url = new URL(request.url);
  
  // 登录页面不需要认证
  if (url.pathname === '/admin/' || url.pathname === '/admin') {
    return new Response(getAdminHTML(), {
      headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
  }

  // API 请求需要认证
  if (env.ADMIN_PASSWORD) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token !== generateToken(env.ADMIN_PASSWORD)) {
      return new Response(JSON.stringify({ error: '未授权' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 返回后台 HTML
  return new Response(getAdminHTML(), {
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
}

// ==================== 图片处理 ====================
async function handleImage(request, env, path) {
  const filename = path.replace('/images/', '');

  if (env.R2) {
    const object = await env.R2.get(filename);
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  }

  return new Response('Not Found', { status: 404 });
}

// 生成12位随机文件名
function generateRandomFilename() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function uploadImage(env, base64Data, prefix) {
  try {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return base64Data;

    const contentType = matches[1];
    const data = atob(matches[2]);
    const arrayBuffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      arrayBuffer[i] = data.charCodeAt(i);
    }

    const ext = contentType.split('/')[1] || 'jpg';
    const filename = generateRandomFilename() + '.' + ext;

    if (env.R2) {
      await env.R2.put(filename, arrayBuffer, {
        httpMetadata: { contentType }
      });
      return `/images/${filename}`;
    }

    return base64Data;
  } catch (e) {
    console.error('图片上传失败:', e);
    return base64Data;
  }
}

// ==================== 前台处理 ====================
async function handleFrontend(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 文章详情页 - /post/YYYYMM/ID 格式
  if (path.startsWith('/post/')) {
    const match = path.match(/^\/post\/(\d{6})\/(\d+)$/);
    if (!match) {
      return new Response('无效的文章链接', { status: 404 });
    }
    const id = parseInt(match[2]);
    const url = new URL(request.url);
    const providedPassword = url.searchParams.get('password');
    await initDB(env);
    
    // 获取网站设置
    let siteSettings = { site_name: '我的博客', site_description: '', site_favicon: '', site_avatar: '', site_bio: '', site_author: '' };
    try {
      const { results } = await env.DB.prepare("SELECT * FROM settings").all();
      results.forEach(s => siteSettings[s.key] = s.value);
    } catch (e) {}
    
    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM posts WHERE id=? AND status='published'"
      ).bind(id).all();
      
      if (results.length === 0) {
        return new Response('文章不存在', { status: 404 });
      }
      
      const post = results[0];
      
      // 检查密码
      if (post.password && post.password !== '') {
        if (providedPassword !== post.password) {
          return new Response(getPasswordHTML(post), {
            headers: { 'Content-Type': 'text/html;charset=utf-8' }
          });
        }
      }
      
      return new Response(getPostHTML(post, siteSettings), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    } catch (e) {
      return new Response('加载失败: ' + e.message, { status: 500 });
    }
  }
  
  // 首页 - 获取设置
  await initDB(env);
  let siteSettings = { site_name: '我的博客', site_description: '', site_favicon: '', site_avatar: '', site_bio: '', site_author: '' };
  try {
    const { results } = await env.DB.prepare("SELECT * FROM settings").all();
    if (results) {
      results.forEach(s => siteSettings[s.key] = s.value);
    }
  } catch (e) {}
  
  return new Response(getFrontendHTML(siteSettings), {
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
}

// ==================== 工具函数 ====================
function generateToken(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash = hash & hash;
  }
  return 'token_' + Math.abs(hash).toString(36);
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// 密码验证页面
function getPasswordHTML(post) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>输入密码</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); text-align: center; }
    h2 { margin-bottom: 20px; }
    input { padding: 12px; width: 200px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; margin-bottom: 16px; }
    button { padding: 12px 32px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
    .error { color: #ef4444; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="box">
    <h2>文章密码保护</h2>
    <p style="color:#666;margin-bottom:20px">请输入密码访问文章</p>
    <form>
      <input type="password" id="pwd" placeholder="请输入密码">
      <br>
      <button type="submit">确认</button>
      <p id="msg" class="error"></p>
    </form>
    <script>
      document.querySelector('form').onsubmit = (e) => {
        e.preventDefault();
        const pwd = document.getElementById('pwd').value;
        window.location.href = '/post/\${new Date(post.created_at).getFullYear()}\${String(post.created_at.getMonth()+1).padStart(2,'0')}/\${post.id}?password=' + encodeURIComponent(pwd);
      };
    </script>
  </div>
</body>
</html>`;
}

// ==================== 前端 HTML ====================

// 文章详情页 HTML
function getPostHTML(post, settings) {
  settings = settings || {};
  const siteName = settings.site_name || '我的博客';
  const favicon = settings.site_favicon || '';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} - ${siteName}</title>
  ${favicon ? `<link rel="icon" href="${favicon}">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
    header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; text-align: center; }
    header h1 { font-size: 1.5em; }
    header a { color: white; text-decoration: none; }
    main { max-width: 800px; margin: 30px auto; padding: 0 20px; }
    .post-content { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .post-content h1 { font-size: 1.8em; margin-bottom: 20px; }
    .post-content p { margin: 1em 0; line-height: 1.8; }
    .post-content img { max-width: 100%; height: auto; margin: 1em 0; }
    .post-meta { color: #999; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    footer { text-align: center; padding: 30px 20px; color: #999; }
  </style>
</head>
<body>
  <header>
    <h1><a href="/">${siteName}</a></h1>
  </header>
  <main>
    <article class="post-content">
      <h1>${post.title}</h1>
      <div class="post-meta">
        <span>分类: ${post.category}</span> | 
        <span>阅读: ${post.view_count}</span> | 
        <span>${new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
      </div>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <div style="white-space:pre-wrap;word-break:break-word;">${post.content}</div>
    </article>
  </main>
  <footer>
    &copy; 2026 ${siteName}. All rights reserved.
  </footer>
</body>
</html>`;
}

function getFrontendHTML(settings) {
  settings = settings || {};
  const siteName = settings.site_name || '我的博客';
  const siteDesc = settings.site_description || '';
  const favicon = settings.site_favicon || '';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
  ${favicon ? `<link rel="icon" href="${favicon}">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
    header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 40px 20px; text-align: center; }
    header h1 { font-size: 2.5em; margin-bottom: 10px; }
    header p { opacity: 0.9; font-size: 1.1em; }
    main { max-width: 1100px; margin: 40px auto; padding: 0 20px; display: flex; gap: 30px; }
    .sidebar { width: 280px; flex-shrink: 0; }
    .post-list { flex: 1; display: grid; gap: 30px; }
    .profile-card { background: white; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .profile-card .avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 16px; background: #e2e8f0; }
    .profile-card .name { font-size: 1.3em; font-weight: bold; margin-bottom: 8px; }
    .profile-card .bio { color: #666; font-size: 0.9em; margin-bottom: 16px; }
    .profile-card .stats { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    .profile-card .stat-item { text-align: center; }
    .profile-card .stat-num { font-size: 1.2em; font-weight: bold; color: #667eea; }
    .profile-card .stat-label { font-size: 0.8em; color: #999; }
    .profile-card h4 { font-size: 0.9em; color: #999; margin: 16px 0 12px; text-align: left; }
    .profile-card .category-list, .profile-card .link-list { text-align: left; }
    .profile-card .category-list a, .profile-card .link-list a { display: block; padding: 8px 0; color: #333; text-decoration: none; border-bottom: 1px solid #f5f5f5; }
    .profile-card .category-list a:hover, .profile-card .link-list a:hover { color: #667eea; }
    .profile-card .link-list a { display: flex; justify-content: space-between; }
    .post-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s; }
    .post-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .post-card img { width: 100%; height: 240px; object-fit: cover; }
    .post-card .content { padding: 24px; }
    .post-card h2 { font-size: 1.4em; margin-bottom: 12px; color: #1a1a1a; }
    .post-card .excerpt { color: #666; line-height: 1.6; margin-bottom: 16px; }
    .post-card .meta { display: flex; gap: 16px; color: #999; font-size: 0.9em; }
    .post-card a { display: inline-block; color: #667eea; text-decoration: none; font-weight: 500; }
    .post-card a:hover { text-decoration: underline; }
    footer { text-align: center; padding: 40px 20px; color: #999; }
  </style>
</head>
<body>
  <header>
    <h1>${siteName}</h1>
    ${siteDesc ? `<p>${siteDesc}</p>` : ''}
    <div id="nav-categories" style="margin-top:20px">
      <a href="/" style="color:white;margin:0 10px">全部</a>
    </div>
  </header>
  <main>
    <aside class="sidebar">
      <div class="profile-card">
        <img id="profile-avatar" class="avatar" src="" alt="头像">
        <div class="name">${settings.site_author || siteName}</div>
        <div id="profile-bio" class="bio"></div>
        <div class="stats">
          <div class="stat-item">
            <div id="stat-posts" class="stat-num">0</div>
            <div class="stat-label">文章</div>
          </div>
          <div class="stat-item">
            <div id="stat-cats" class="stat-num">0</div>
            <div class="stat-label">分类</div>
          </div>
        </div>
        <h4>分类导航</h4>
        <div id="category-list" class="category-list"></div>
        <h4>友情链接</h4>
        <div id="link-list" class="link-list"></div>
      </div>
    </aside>
    <div class="post-list" id="app">
      <p style="text-align:center;color:#999;">加载中...</p>
    </div>
  </main>
  <footer>
    &copy; 2026 我的博客. All rights reserved.
  </footer>
  <script>
    // 加载博客信息
    fetch('/api/settings').then(r=>r.json()).then(s=>{
      if(s.site_avatar) document.getElementById('profile-avatar').src = s.site_avatar;
      if(s.site_bio) document.getElementById('profile-bio').textContent = s.site_bio;
    }).catch(e=>console.error('加载设置失败',e));
    
    // 加载统计
    fetch('/api/stats').then(r=>{console.log('stats:',r.status);return r.json()}).then(s=>{
      console.log('stats data:', s);
      document.getElementById('stat-posts').textContent = s.postCount;
      document.getElementById('stat-cats').textContent = s.catCount;
    }).catch(e=>console.error('加载统计失败',e));
    
    // 加载分类导航
    fetch('/api/categories')
      .then(r => r.json())
      .then(cats => {
        const list = document.getElementById('category-list');
        if (cats && Array.isArray(cats) && cats.length > 0) {
          list.innerHTML = '<a href="/">全部</a>' + 
            cats.map(c => '<a href="/?category=' + encodeURIComponent(c.name) + '">' + c.name + '</a>').join('');
        } else {
          list.innerHTML = '<span style="color:#999;font-size:13px">暂无分类</span>';
        }
      });
    
    // 加载友链
    fetch('/api/links')
      .then(r => r.json())
      .then(links => {
        const list = document.getElementById('link-list');
        if (links && Array.isArray(links) && links.length > 0) {
          list.innerHTML = links.map(l => '<a href="' + l.url + '" target="_blank">' + l.name + '</a>').join('');
        } else {
          list.innerHTML = '<span style="color:#999;font-size:13px">暂无友链</span>';
        }
      });
    
    async function loadPosts() {
      try {
        const res = await fetch('/api/posts');
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        const posts = await res.json();
        const app = document.getElementById('app');
        
        if (!posts || posts.length === 0) {
          app.innerHTML = '<p style="text-align:center;color:#999;">暂无文章</p>';
          return;
        }
        
        // 日期格式化函数
        const formatDate = (dateStr) => {
          const d = new Date(dateStr);
          return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0');
        };
        
        // 摘要截取函数
        const getExcerpt = (content) => {
          if (!content) return '...';
          return content.substring(0, 30) + (content.length > 30 ? '...' : '');
        };
        
        // 分类数组
        const categories = [];
        
        app.innerHTML = posts.map(post => \`
          <article class="post-card" style="display:flex;flex-direction:row">
            <div style="width:240px;flex-shrink:0;background:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:180px">
              \${post.cover_image ? \`<img src="\${post.cover_image}" alt="\${post.title}" style="width:100%;height:100%;object-fit:cover">\` : \`<span style="color:#94a3b8">暂无封面</span>\`}
            </div>
            <div class="content" style="flex:1;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <h2><a href="/post/\${formatDate(post.created_at)}/\${post.id}">\${post.title}</a></h2>
                <p class="excerpt">\${getExcerpt(post.content)}</p>
              </div>
              <div>
                <div class="meta">
                  <span>\${post.category}</span>
                  <span>\${post.view_count} 阅读</span>
                  <span>\${new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <a href="/post/\${formatDate(post.created_at)}/\${post.id}" target="_blank" style="display:inline-block;margin-top:12px;padding:8px 20px;background:#667eea;color:white;text-decoration:none;border-radius:6px;font-size:14px">阅读更多</a>
              </div>
            </div>
          </article>
        \`).join('');
      } catch (e) {
        console.error('加载失败:', e);
        document.getElementById('app').innerHTML = '<p style="text-align:center;color:#f00;">加载失败: ' + e.message + '</p>';
      }
    }
    loadPosts();
  </script>
</body>
</html>`;
}

// ==================== 后台 HTML ====================
function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>博客管理后台</title>
  <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .login { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea, #764ba2); }
    .login-box { background: white; padding: 40px; border-radius: 16px; width: 100%; max-width: 400px; text-align: center; }
    .login-box h1 { margin-bottom: 20px; color: #333; }
    .login-box input { width: 100%; padding: 12px; margin-bottom: 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
    .login-box button { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
    .navbar { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
    .navbar h1 { font-size: 18px; }
    .navbar button { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .main { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .toolbar { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .btn { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .btn:hover { background: #5568d3; }
    table { width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    th, td { padding: 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
    .status { padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    .status.draft { background: #fef3c7; color: #d97706; }
    .status.published { background: #dcfce7; color: #16a34a; }
    .actions button { padding: 6px 12px; margin-right: 8px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .actions .edit { background: #dbeafe; color: #2563eb; }
    .actions .delete { background: #fee2e2; color: #dc2626; }
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-box { background: white; border-radius: 16px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; }
    .modal-header { padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { font-size: 18px; }
    .modal-close { width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; }
    .modal-body { padding: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 500; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
    .form-group textarea { min-height: 200px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-footer { padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
    .cover-preview { max-width: 200px; margin-top: 10px; }
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; background: #22c55e; color: white; border-radius: 8px; z-index: 2000; }
  </style>
</head>
<body>
  <div id="app">
    <div v-if="!logged" class="login">
      <div class="login-box">
        <h1>博客管理后台</h1>
        <input v-model="password" type="password" placeholder="请输入管理员密码" @keyup.enter="login">
        <button @click="login">登录</button>
      </div>
    </div>
    <div v-else>
      <nav class="navbar">
        <h1>博客管理后台</h1>
        <button @click="logout">退出</button>
      </nav>
      <main class="main">
        <div class="toolbar">
          <h2>文章列表</h2>
          <div>
            <button class="btn" style="margin-right:10px" @click="openSettingsModal">网站设置</button>
            <button class="btn" style="margin-right:10px" @click="openCategoryModal">分类管理</button>
            <button class="btn" @click="openAdd">新建文章</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>状态</th>
              <th>浏览</th>
              <th>日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post.id">
              <td>{{ post.title }}</td>
              <td>{{ post.category }}</td>
              <td><span :class="'status ' + post.status">{{ post.status === 'published' ? '已发布' : '草稿' }}</span></td>
              <td>{{ post.view_count }}</td>
              <td>{{ new Date(post.created_at).toLocaleDateString('zh-CN') }}</td>
              <td class="actions">
                <button class="edit" @click="openEdit(post)">编辑</button>
                <button class="delete" @click="deletePost(post.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
    
    <div v-if="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box">
        <div class="modal-header">
          <h2>{{ editingId ? '编辑文章' : '新建文章' }}</h2>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input v-model="form.title" placeholder="文章标题">
          </div>
          <div class="form-group">
            <label>文章密码（可选）</label>
            <input v-model="form.password" type="password" placeholder="留空则无需密码">
          </div>
          
          <div class="form-group">
            <label>分类</label>
            <select v-model="form.category" required>
              <option value="">请选择分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>状态</label>
              <select v-model="form.status">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>
            <div class="form-group">
              <label>标签（逗号分隔）</label>
              <input v-model="form.tags" placeholder="标签1,标签2">
            </div>
          </div>
          <div class="form-group">
            <label>封面图片（拖拽或点击上传）</label>
            <div 
              class="cover-upload-area"
              @click="$refs.fileInput.click()"
              @dragover.prevent
              @drop.prevent="handleDrop"
              style="border:2px dashed #cbd5e1;border-radius:8px;padding:30px;text-align:center;cursor:pointer;margin-bottom:10px"
            >
              <input ref="fileInput" type="file" @change="handleCoverChange" accept="image/*" style="display:none">
              <div v-if="!coverPreview">
                <p style="color:#64748b">点击或拖拽图片到这里</p>
              </div>
              <img v-else :src="coverPreview" style="max-width:200px;max-height:150px;object-fit:cover">
            </div>
            <div v-if="uploading" style="margin-bottom:10px">
              <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden">
                <div :style="{width:uploadProgress+'%',background:'#667eea',height:'100%'}"></div>
              </div>
              <p style="font-size:12px;color:#666">上传中... {{ uploadProgress }}%</p>
            </div>
            <div v-if="coverPreview" style="display:flex;gap:10px">
              <button type="button" @click="$refs.fileInput.click()" style="padding:8px 16px;background:#dbeafe;color:#2563eb;border:none;border-radius:6px;cursor:pointer">更换图片</button>
              <button type="button" @click="deleteCover" style="padding:8px 16px;background:#fee2e2;color:#dc2626;border:none;border-radius:6px;cursor:pointer">删除图片</button>
            </div>
          </div>

          <div class="form-group">
            <label>内容</label>
            <textarea v-model="form.content" placeholder="文章内容（支持 Markdown）"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer">取消</button>
          <button @click="savePost" class="btn">保存</button>
        </div>
      </div>
    </div>
    
    <div v-if="toast" class="toast">{{ toast }}</div>
    
    <!-- 分类管理模态框 -->
    <div v-if="categoryModal" class="modal" @click.self="categoryModal = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>分类管理</h3>
          <button class="modal-close" @click="categoryModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>新建分类</label>
            <div style="display:flex;gap:10px">
              <input v-model="categoryForm.name" placeholder="分类名称" style="flex:1">
              <button @click="saveCategory" class="btn">添加</button>
            </div>
          </div>
          <div style="margin-top:20px">
            <h4>已有分类</h4>
            <div v-for="cat in categories" :key="cat.id" style="display:flex;justify-content:space-between;padding:10px;background:#f8fafc;margin-bottom:8px;border-radius:6px">
              <span>{{ cat.name }}</span>
              <button @click="deleteCategory(cat.id)" style="color:#dc2626;background:none;border:none;cursor:pointer">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 网站设置模态框 -->
    <div v-if="settingsModal" class="modal" @click.self="settingsModal = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>网站设置</h3>
          <button class="modal-close" @click="settingsModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>网站标题</label>
            <input v-model="settingsForm.site_name" placeholder="网站标题">
          </div>
          <div class="form-group">
            <label>个人名称</label>
            <input v-model="settingsForm.site_author" placeholder="个人名称">
          </div>
          <div class="form-group">
            <label>网站副标题</label>
            <input v-model="settingsForm.site_description" placeholder="网站副标题">
          </div>
          <div class="form-group">
            <label>博客头像</label>
            <div 
              class="cover-upload-area"
              @click="$refs.avatarInput.click()"
              @dragover.prevent
              @drop.prevent="handleAvatarDrop"
              style="border:2px dashed #cbd5e1;border-radius:8px;padding:20px;text-align:center;cursor:pointer;margin-bottom:10px"
            >
              <input ref="avatarInput" type="file" @change="handleAvatar" accept="image/*" style="display:none">
              <div v-if="!settingsForm.site_avatar">
                <p style="color:#64748b">点击或拖拽头像到这里</p>
              </div>
              <img v-else :src="settingsForm.site_avatar" style="width:64px;height:64px;border-radius:50%">
            </div>
            <div v-if="avatarUploading" style="margin-bottom:10px">
              <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden">
                <div :style="{width:avatarProgress+'%',background:'#667eea',height:'100%'}"></div>
              </div>
              <p style="font-size:12px;color:#666">上传中... {{ avatarProgress }}%</p>
            </div>
            <div v-if="settingsForm.site_avatar" style="display:flex;gap:10px">
              <button type="button" @click="$refs.avatarInput.click()" style="padding:6px 12px;background:#dbeafe;color:#2563eb;border:none;border-radius:6px;cursor:pointer;font-size:12px">更换</button>
              <button type="button" @click="settingsForm.site_avatar = ''" style="padding:6px 12px;background:#fee2e2;color:#dc2626;border:none;border-radius:6px;cursor:pointer;font-size:12px">删除</button>
            </div>
          </div>
          <div class="form-group">
            <label>个人简介</label>
            <textarea v-model="settingsForm.site_bio" placeholder="个人简介" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>友链（每行一个，格式：名称,地址）</label>
            <textarea v-model="settingsForm.site_links" placeholder="例如：Google,https://google.com" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>网站图标（建议 ICO 格式，32x32 或 64x64）</label>
            <div 
              class="cover-upload-area"
              @click="$refs.faviconInput.click()"
              @dragover.prevent
              @drop.prevent="handleFaviconDrop"
              style="border:2px dashed #cbd5e1;border-radius:8px;padding:20px;text-align:center;cursor:pointer;margin-bottom:10px"
            >
              <input ref="faviconInput" type="file" @change="handleFavicon" accept=".ico,image/*" style="display:none">
              <div v-if="!settingsForm.site_favicon">
                <p style="color:#64748b">点击或拖拽图标到这里（建议 ICO 格式）</p>
              </div>
              <img v-else :src="settingsForm.site_favicon" style="width:32px;height:32px">
            </div>
            <div v-if="faviconUploading" style="margin-bottom:10px">
              <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden">
                <div :style="{width:faviconProgress+'%',background:'#667eea',height:'100%'}"></div>
              </div>
              <p style="font-size:12px;color:#666">上传中... {{ faviconProgress }}%</p>
            </div>
            <div v-if="settingsForm.site_favicon" style="display:flex;gap:10px">
              <button type="button" @click="$refs.faviconInput.click()" style="padding:8px 16px;background:#dbeafe;color:#2563eb;border:none;border-radius:6px;cursor:pointer">更换图标</button>
              <button type="button" @click="settingsForm.site_favicon = ''" style="padding:8px 16px;background:#fee2e2;color:#dc2626;border:none;border-radius:6px;cursor:pointer">删除图标</button>
            </div>
          </div>
          <button @click="saveSettings" class="btn" style="width:100%;margin-top:20px">保存设置</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const { createApp, ref, onMounted } = Vue;

    createApp({
      setup() {
        const logged = ref(false);
        const password = ref('');
        const posts = ref([]);
        const showModal = ref(false);
        const editingId = ref(null);
        const form = ref({ title: '', category: '', status: 'draft', tags: '', excerpt: '', content: '', cover_image: '' });
        const coverPreview = ref('');
        const toast = ref('');

        // 检查登录状态
        const check = () => {
          const token = localStorage.getItem('token');
          if (token) {
            logged.value = true;
            loadPosts();
          }
        };

        const api = (url, options = {}) => {
          options.headers = options.headers || {};
          options.headers['Authorization'] = 'Bearer ' + localStorage.getItem('token');
          return axios(url, options);
        };

        const login = async () => {
          try {
            const res = await axios.post('/api/login', { password: password.value });
            if (res.data.success) {
              localStorage.setItem('token', res.data.token);
              logged.value = true;
              loadPosts();
            }
          } catch (e) {
            alert('登录失败');
          }
        };

        const logout = () => {
          localStorage.removeItem('token');
          logged.value = false;
        };

        const loadPosts = async () => {
          const res = await api('/api/admin/posts');
          posts.value = res.data;
        };

        const openAdd = () => {
          editingId.value = null;
          form.value = { title: '', category: '', status: 'draft', tags: '', excerpt: '', content: '', cover_image: '' };
          coverPreview.value = '';
          showModal.value = true;
        };

        const openEdit = (post) => {
          console.log('openEdit 被调用', post);
          editingId.value = post.id;
          form.value.title = post.title || '';
          form.value.content = post.content || '';
          form.value.excerpt = post.excerpt || '';
          form.value.category = post.category || '';
          form.value.password = post.password || '';
          form.value.tags = post.tags || '';
          form.value.status = post.status || 'draft';
          form.value.cover_image = post.cover_image || '';
          console.log('form.value 已更新', form.value);
          coverPreview.value = post.cover_image || '';
          showModal.value = true;
        };

        const uploading = ref(false);
        const uploadProgress = ref(0);
        
        const handleCoverChange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          await uploadFile(file);
        };
        
        const handleDrop = async (e) => {
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            await uploadFile(file);
          }
        };
        
        const uploadFile = async (file) => {
          uploading.value = true;
          uploadProgress.value = 0;
          
          const progressInterval = setInterval(() => {
            if (uploadProgress.value < 90) uploadProgress.value += 10;
          }, 100);
          
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const token = localStorage.getItem('token');
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: token ? { 'Authorization': 'Bearer ' + token } : {},
              body: formData
            });
            
            const data = await res.json();
            clearInterval(progressInterval);
            uploadProgress.value = 100;
            
            if (data.url) {
              form.value.cover_image = data.url;
              coverPreview.value = data.url;
            }
          } catch (err) {
            clearInterval(progressInterval);
            alert('上传失败');
          } finally {
            setTimeout(() => {
              uploading.value = false;
              uploadProgress.value = 0;
            }, 500);
          }
        };
        
        const deleteCover = () => {
          form.value.cover_image = '';
          coverPreview.value = '';
        };

        const savePost = async () => {
          try {
            if (editingId.value) {
              const res = await api('/api/admin/post?id=' + editingId.value, { method: 'PUT', data: form.value });
              if (res.data.success) {
                showModal.value = false;
                loadPosts();
                showToast('保存成功');
              } else {
                alert('保存失败: ' + (res.data.error || '未知错误'));
              }
            } else {
              const res = await api('/api/admin/post', { method: 'POST', data: form.value });
              if (res.data.success) {
                showModal.value = false;
                loadPosts();
                showToast('保存成功');
              } else {
                alert('保存失败: ' + (res.data.error || '未知错误'));
              }
            }
          } catch (e) {
            alert('保存失败: ' + (e.response?.data?.error || e.message));
          }
        };

        const deletePost = async (id) => {
          if (!confirm('确定删除？')) return;
          try {
            await api('/api/admin/post?id=' + id, { method: 'DELETE' });
            loadPosts();
            showToast('删除成功');
          } catch (e) {
            alert('删除失败');
          }
        };

        const showToast = (msg) => {
          toast.value = msg;
          setTimeout(() => toast.value = '', 3000);
        };

        onMounted(() => {
          const token = localStorage.getItem('token');
          if (token) {
            logged.value = true;
            loadPosts();
          }
        });

        let categories = ref([]);
        let settings = ref({});
        
        const loadCategories = async () => {
          try {
            const res = await api('/api/categories');
            console.log('分类数据:', res.data);
            categories.value = res.data;
          } catch(e) {
            console.error('加载分类失败:', e);
          }
        };
        
        const loadSettings = async () => {
          try {
            const res = await api('/api/settings');
            settings.value = res.data;
          } catch(e) {
            console.error('加载设置失败:', e);
          }
        };
        
        const settingsModal = ref(false);
        const settingsForm = ref({ site_name: '', site_description: '', site_favicon: '', site_avatar: '', site_bio: '', site_links: '', site_author: '' });
        const faviconUploading = ref(false);
        const faviconProgress = ref(0);
        const avatarUploading = ref(false);
        const avatarProgress = ref(0);
        
        const openSettingsModal = () => {
          settingsForm.value = { 
            site_name: settings.value.site_name || '',
            site_description: settings.value.site_description || '',
            site_favicon: settings.value.site_favicon || '',
            site_avatar: settings.value.site_avatar || '',
            site_bio: settings.value.site_bio || '',
            site_links: settings.value.site_links || '',
            site_author: settings.value.site_author || ''
          };
          settingsModal.value = true;
        };
        
        const saveSettings = async () => {
          try {
            await api('/api/settings', { method: 'POST', data: settingsForm.value });
            await loadSettings();
            settingsModal.value = false;
          } catch(e) { alert('保存失败'); }
        };
        
        const handleFavicon = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          await uploadFavicon(file);
        };
        
        const handleFaviconDrop = async (e) => {
          const file = e.dataTransfer.files[0];
          if (file && (file.type.startsWith('image/') || file.name.endsWith('.ico'))) {
            await uploadFavicon(file);
          }
        };
        
        const uploadFavicon = async (file) => {
          faviconUploading.value = true;
          faviconProgress.value = 0;
          
          const progressInterval = setInterval(() => {
            if (faviconProgress.value < 90) faviconProgress.value += 10;
          }, 100);
          
          try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            clearInterval(progressInterval);
            faviconProgress.value = 100;
            if (data.url) {
              settingsForm.value.site_favicon = data.url;
            }
          } catch (err) {
            clearInterval(progressInterval);
            alert('上传失败');
          } finally {
            setTimeout(() => {
              faviconUploading.value = false;
              faviconProgress.value = 0;
            }, 500);
          }
        };
        
        const handleAvatar = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          await uploadAvatar(file);
        };
        
        const handleAvatarDrop = async (e) => {
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            await uploadAvatar(file);
          }
        };
        
        const uploadAvatar = async (file) => {
          avatarUploading.value = true;
          avatarProgress.value = 0;
          
          const progressInterval = setInterval(() => {
            if (avatarProgress.value < 90) avatarProgress.value += 10;
          }, 100);
          
          try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            clearInterval(progressInterval);
            avatarProgress.value = 100;
            if (data.url) {
              settingsForm.value.site_avatar = data.url;
            }
          } catch (err) {
            clearInterval(progressInterval);
            alert('上传失败');
          } finally {
            setTimeout(() => {
              avatarUploading.value = false;
              avatarProgress.value = 0;
            }, 500);
          }
        };
        
        onMounted(() => { 
          check(); 
          loadCategories();
          loadSettings();
        });
        
        const categoryModal = ref(false);
        const categoryForm = ref({ name: '' });
        
        const openCategoryModal = () => {
          categoryForm.value = { name: '' };
          categoryModal.value = true;
        };
        
        const saveCategory = async () => {
          try {
            await api('/api/category', { method: 'POST', data: categoryForm.value });
            await loadCategories();
            categoryForm.value = { name: '', description: '' };
          } catch(e) { alert('保存失败'); }
        };
        
        const deleteCategory = async (id) => {
          if(!confirm('确定删除?')) return;
          try {
            await api('/api/category?id='+id, {method:'DELETE'});
            loadCategories();
          } catch(e) {}
        };
        
        onMounted(() => { 
          check(); 
          loadCategories();
          loadSettings();
        });
        
        return { logged, password, login, logout, posts, showModal, editingId, form, coverPreview, toast, uploading, uploadProgress, openAdd, openEdit, handleCoverChange, savePost, deletePost, categories, categoryModal, categoryForm, openCategoryModal, saveCategory, deleteCategory, settings, settingsModal, settingsForm, openSettingsModal, saveSettings, handleFavicon, handleFaviconDrop, faviconUploading, faviconProgress, handleAvatar, handleAvatarDrop, avatarUploading, avatarProgress };
      }
    }).mount('#app');
  </script>
</body>
</html>`;
}