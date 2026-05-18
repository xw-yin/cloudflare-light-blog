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
  if (!env.DB) return;

  try {
    // 检查表是否存在
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='posts'"
    ).all();

    if (results.length === 0) {
      // 创建文章表
      await env.DB.exec(`
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          content TEXT NOT NULL,
          excerpt TEXT,
          cover_image TEXT,
          category TEXT DEFAULT '未分类',
          tags TEXT,
          status TEXT DEFAULT 'draft',
          view_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `);

      // 创建分类表
      await env.DB.exec(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT
        )
      `);

      // 创建设置表
      await env.DB.exec(`
        CREATE TABLE settings (
          id INTEGER PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT
        )
      `);

      // 插入默认设置
      await env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_name', '我的博客').run();

      await env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?)"
      ).bind('site_description', '一个使用 Cloudflare 构建的博客').run();

      // 插入示例文章
      await env.DB.prepare(`
        INSERT INTO posts (title, slug, content, excerpt, cover_image, category, tags, status, view_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        0
      ).run();

      console.log('数据库初始化完成，已添加示例文章');
    }
  } catch (e) {
    console.error('数据库初始化错误:', e);
  }
}

// ==================== API 处理 ====================
async function handleAPI(request, env, path) {
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

  // 认证检查（其他 API 需要认证）
  if (env.ADMIN_PASSWORD) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token !== generateToken(env.ADMIN_PASSWORD)) {
      return json({ error: '未授权' }, 401);
    }
  }

  // 公开 API
  if (path === '/api/posts' && method === 'GET') {
    const { results } = await env.DB.prepare(
      "SELECT id, title, slug, excerpt, cover_image, category, tags, view_count, created_at FROM posts WHERE status='published' ORDER BY created_at DESC"
    ).all();
    return json(results);
  }

  if (path === '/api/post/' && method === 'GET') {
    const slug = new URL(request.url).searchParams.get('slug');
    if (!slug) return json({ error: '缺少 slug' }, 400);

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
  }

  if (path === '/api/categories' && method === 'GET') {
    const { results } = await env.DB.prepare(
      "SELECT * FROM categories ORDER BY name"
    ).all();
    return json(results);
  }

  if (path === '/api/settings' && method === 'GET') {
    const { results } = await env.DB.prepare("SELECT * FROM settings").all();
    const settings = {};
    results.forEach(s => settings[s.key] = s.value);
    return json(settings);
  }

  // 需要认证的 API
  if (path === '/api/admin/posts' && method === 'GET') {
    const { results } = await env.DB.prepare(
      "SELECT id, title, slug, status, category, view_count, created_at FROM posts ORDER BY created_at DESC"
    ).all();
    return json(results);
  }

  if (path === '/api/admin/post' && method === 'POST') {
    try {
      const body = await request.json();

      // 生成 slug
      const slug = body.slug || generateSlug(body.title);

      // 处理封面图片
      let coverImage = body.cover_image;
      if (body.cover_image && body.cover_image.startsWith('data:')) {
        coverImage = await uploadImage(env, body.cover_image, slug);
      }

      const result = await env.DB.prepare(`
        INSERT INTO posts (title, slug, content, excerpt, cover_image, category, tags, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        body.title,
        slug,
        body.content,
        body.excerpt || (body.content ? body.content.substring(0, 200) + '...' : ''),
        coverImage || '',
        body.category || '未分类',
        body.tags || '',
        body.status || 'draft'
      ).run();

      return json({ success: true, id: result.lastInsertRowid });
    } catch (e) {
      console.error('创建文章失败:', e);
      return json({ success: false, error: e.message }, 500);
    }
  }

  if (path === '/api/admin/post' && method === 'PUT') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return json({ error: '缺少 id' }, 400);

    try {
      const body = await request.json();

      // 处理封面图片
      let coverImage = body.cover_image;
      if (body.cover_image && body.cover_image.startsWith('data:')) {
        coverImage = await uploadImage(env, body.cover_image, id);
      }

      await env.DB.prepare(`
        UPDATE posts SET
          title=?, content=?, excerpt=?, cover_image=?, category=?, tags=?, status=?,
          updated_at=datetime('now')
        WHERE id=?
      `).bind(
        body.title,
        body.content,
        body.excerpt || (body.content ? body.content.substring(0, 200) : ''),
        coverImage || body.cover_image || '',
        body.category || '未分类',
        body.tags || '',
        body.status || 'draft',
        id
      ).run();

      return json({ success: true });
    } catch (e) {
      console.error('更新文章失败:', e);
      return json({ success: false, error: e.message }, 500);
    }
  }

  if (path === '/api/admin/post' && method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return json({ error: '缺少 id' }, 400);

    await env.DB.prepare("DELETE FROM posts WHERE id=?").bind(id).run();
    return json({ success: true });
  }

  // 图片上传
  if (path === '/api/upload' && method === 'POST') {
    const body = await request.formData();
    const file = body.get('file');
    if (!file) return json({ error: '没有文件' }, 400);

    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const contentType = file.type;
    const filename = `${Date.now()}-${file.name}`;

    if (env.R2) {
      await env.R2.put(filename, arrayBuffer, {
        httpMetadata: { contentType }
      });
      return json({ url: `/images/${filename}` });
    }

    // 如果没有 R2，返回 base64（演示用）
    return json({ url: `data:${contentType};base64,${base64}` });
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

    const filename = `${prefix}-${Date.now()}.${contentType.split('/')[1]}`;

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
  return new Response(getFrontendHTML(), {
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

// ==================== 前端 HTML ====================
function getFrontendHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>博客</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
    header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 40px 20px; text-align: center; }
    header h1 { font-size: 2.5em; margin-bottom: 10px; }
    header p { opacity: 0.9; font-size: 1.1em; }
    main { max-width: 900px; margin: 40px auto; padding: 0 20px; }
    .post-list { display: grid; gap: 30px; }
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
    <h1>我的博客</h1>
    <p>分享技术，记录生活</p>
  </header>
  <main>
    <div class="post-list" id="app">
      <p style="text-align:center;color:#999;">加载中...</p>
    </div>
  </main>
  <footer>
    &copy; 2026 我的博客. All rights reserved.
  </footer>
  <script>
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
        
        app.innerHTML = posts.map(post => \`
          <article class="post-card">
            \${post.cover_image ? \`<img src="\${post.cover_image}" alt="\${post.title}">\` : ''}
            <div class="content">
              <h2><a href="/post/\${post.slug}">\${post.title}</a></h2>
              <p class="excerpt">\${post.excerpt || ''}</p>
              <div class="meta">
                <span>\${post.category}</span>
                <span>\${post.view_count} 阅读</span>
                <span>\${new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
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
          <button class="btn" @click="openAdd">新建文章</button>
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
            <label>分类</label>
            <input v-model="form.category" placeholder="分类">
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
            <label>封面图片</label>
            <input type="file" @change="handleCoverChange" accept="image/*">
            <img v-if="coverPreview" :src="coverPreview" class="cover-preview">
          </div>
          <div class="form-group">
            <label>摘要</label>
            <textarea v-model="form.excerpt" placeholder="文章摘要"></textarea>
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
          editingId.value = post.id;
          form.value = { ...post };
          coverPreview.value = post.cover_image || '';
          showModal.value = true;
        };

        const handleCoverChange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            form.value.cover_image = e.target.result;
            coverPreview.value = e.target.result;
          };
          reader.readAsDataURL(file);
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

        return { logged, password, login, logout, posts, showModal, editingId, form, coverPreview, toast, openAdd, openEdit, handleCoverChange, savePost, deletePost };
      }
    }).mount('#app');
  </script>
</body>
</html>`;
}