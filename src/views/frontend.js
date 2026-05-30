// ==================== 前台首页（SEO 优化 + 分页）====================

import { escapeHtml } from '../lib/utils.js';

export function getFrontendHTML(settings) {
  settings = settings || {};
  const siteName = settings.site_name || '我的博客';
  const siteDesc = settings.site_description || '';
  const siteAuthor = settings.site_author || siteName;
  const siteAvatar = settings.site_avatar || '';
  const siteBio = settings.site_bio || '';
  const favicon = settings.site_favicon || '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(siteName)}</title>
  <meta name="description" content="${escapeHtml(siteDesc || siteName + ' - 基于 Cloudflare Workers 构建的轻量级博客')}">
  <meta name="author" content="${escapeHtml(siteAuthor)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="/">
  <link rel="sitemap" href="/sitemap.xml">
  ${favicon ? `<link rel="icon" href="${escapeHtml(favicon)}">` : ''}
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(siteName)}">
  <meta property="og:description" content="${escapeHtml(siteDesc || siteName + ' - 基于 Cloudflare Workers 构建的轻量级博客')}">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  ${siteAvatar ? `<meta property="og:image" content="${escapeHtml(siteAvatar)}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Nunito, 'Noto Sans SC', sans-serif; background: var(--body-bg, #f8f8f0); color: var(--text-body, #725d42); }
    header { background: linear-gradient(135deg, #7DC395 0%, #5BAF7A 100%); color: #fff; padding: 40px 20px; text-align: center; position: relative; overflow: hidden; }
    header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: linear-gradient(transparent, rgba(0,0,0,0.05)); }
    header h1 { font-size: 2.5em; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.02em; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    header a { color: #fff; text-decoration: none; }
    header p { opacity: 0.9; font-size: 1.1em; font-weight: 500; }
    main { max-width: 1124px; margin: 30px auto; padding: 0 20px; display: flex; gap: 24px; align-items: flex-start; }
    .sidebar { width: 280px; flex-shrink: 0; }
    .post-list { flex: 1; }
    #app { display: flex; flex-direction: column; gap: 28px; }
    .post-card { background: #f7f3df; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42); display: flex; flex-direction: row; transition: all 0.3s ease; border: 2px solid #e8e0cc; }
    .post-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(114, 93, 66, 0.15); }
    .post-card .post-cover { width: 220px; flex-shrink: 0; background: #e8e0cc; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .post-card .post-cover img { width: 100%; height: 100%; object-fit: cover; }
    .post-card .post-content { flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; overflow: hidden; }
    .post-card h2 { font-size: 1.35em; margin-bottom: 8px; color: #794f27; font-weight: 700; }
    .post-card h2 a { color: #794f27; text-decoration: none; }
    .post-card .meta { display: flex; flex-wrap: nowrap; align-items: center; gap: 12px; color: #9f927d; font-size: 0.8em; margin-top: 12px; font-weight: 600; }
    .post-card a.read-more { display: inline-block; padding: 6px 16px; background: #19c8b9; color: #fff; text-decoration: none; border-radius: 50px; font-size: 0.8em; font-weight: 600; box-shadow: 0 3px 0 0 #11a89b; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; }
    .post-card a.read-more:hover { transform: translateY(-1px); box-shadow: 0 5px 0 0 #11a89b; }
    .post-card a.read-more:active { transform: translateY(2px); box-shadow: 0 1px 0 0 #11a89b; }
    .profile-card { background: #f7f3df; border-radius: 20px; padding: 24px; box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42); border: 2px solid #e8e0cc; }
    .profile-card .avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin: 0 auto 14px; display: block; border: 3px solid #c4b89e; background: #e8e0cc; }
    .profile-card .name { font-size: 1.1em; font-weight: 700; text-align: center; margin-bottom: 4px; color: #794f27; }
    .profile-card .bio { color: #725d42; font-size: 0.85em; text-align: center; margin-bottom: 14px; font-weight: 500; }
    .profile-card .stats { display: flex; justify-content: center; gap: 16px; padding-bottom: 14px; border-bottom: 2px solid #e8e0cc; margin-bottom: 14px; }
    .profile-card .stat-item { text-align: center; }
    .profile-card .stat-num { font-size: 1.1em; font-weight: 800; color: #19c8b9; }
    .profile-card .stat-label { font-size: 0.75em; color: #9f927d; font-weight: 600; }
    .profile-card h4 { font-size: 0.85em; color: #9f927d; margin: 14px 0 8px; font-weight: 700; letter-spacing: 0.5px; }
    .profile-card .category-list a, .profile-card .link-list a { display: block; padding: 8px 12px; margin: 0 0 6px 0; color: #725d42; text-decoration: none; background: #f0e8d8; border-radius: 12px; font-size: 0.85em; font-weight: 600; transition: all 0.2s; border: 2px solid transparent; outline: none; }
    .profile-card .category-list a:hover, .profile-card .link-list a:hover { background: #e6f9f6; border-color: #19c8b9; color: #11a89b; }
    footer { text-align: center; padding: 30px 20px; color: #9f927d; font-size: 0.85em; font-weight: 500; }
    .pagination { display: flex; justify-content: center; gap: 8px; margin: 24px 0; flex-wrap: wrap; }
    .pagination a, .pagination span { display: inline-block; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85em; text-decoration: none; transition: all 0.2s; }
    .pagination a { background: #f0e8d8; color: #725d42; border: 2px solid #e8e0cc; }
    .pagination a:hover { background: #19c8b9; color: #fff; border-color: #19c8b9; }
    .pagination .current { background: #19c8b9; color: #fff; border: 2px solid #19c8b9; }
    .pagination .disabled { opacity: 0.4; cursor: default; pointer-events: none; }
    .back-to-top { position: fixed; bottom: 30px; right: 30px; width: 44px; height: 44px; background: #19c8b9; color: #fff; border: none; border-radius: 50%; font-size: 20px; cursor: pointer; box-shadow: 0 4px 0 0 #11a89b; transition: all 0.25s; display: flex; align-items: center; justify-content: center; z-index: 998; opacity: 0; pointer-events: none; }
    .back-to-top.show { opacity: 1; pointer-events: auto; }
    .back-to-top:hover { transform: translateY(-2px); box-shadow: 0 6px 0 0 #11a89b; }
    .mobile-nav-toggle { display: none; position: fixed; top: 12px; left: 12px; z-index: 1004; width: 40px; height: 40px; background: #19c8b9; border: none; border-radius: 12px; color: #fff; font-size: 20px; cursor: pointer; box-shadow: 0 3px 0 #11a89b; transition: left 0.3s; }
    .mobile-nav-toggle.nav-open { left: 208px !important; }
    .mobile-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; }
    .mobile-overlay.show { display: block; }
    @media (max-width: 768px) {
      header { padding: 16px; }
      header h1 { font-size: 1.4em; }
      header p { font-size: 0.85em; }
      .mobile-nav-toggle { display: flex; align-items: center; justify-content: center; }
      main { flex-direction: row; padding: 0 12px; gap: 0; margin-top: 12px; position: relative; }
      .sidebar { width: 260px; position: fixed; top: 0; left: -260px; height: 100vh; z-index: 1002; transition: left 0.3s ease; overflow-y: auto; background: #f8f8f0; padding: 16px; box-shadow: 2px 0 8px rgba(0,0,0,0.1); }
      .sidebar.open { left: 0; }
      .profile-card { border-radius: 16px; padding: 16px; }
      .profile-card .avatar { width: 56px; height: 56px; }
      .profile-card .name { font-size: 1em; }
      .post-list { width: 100%; }
      #app { gap: 20px; }
      .post-card { flex-direction: column; border-radius: 16px; }
      .post-card .post-cover { display: none; }
      .post-card .post-content { padding: 14px; }
      .post-card h2 { font-size: 1em; }
      .post-card .meta { font-size: 0.75em; }
      footer { padding: 20px 16px; font-size: 0.8em; }
    }
  </style>
</head>
<body>
  <button class="mobile-nav-toggle" onclick="toggleNav()">☰</button>
  <div class="mobile-overlay" id="mobileOverlay" onclick="toggleNav()"></div>
  <header>
    <h1><a href="/">${escapeHtml(siteName)}</a></h1>
    ${siteDesc ? `<p>${escapeHtml(siteDesc)}</p>` : ''}
  </header>
  <main>
    <aside class="sidebar">
      <div class="profile-card">
        ${siteAvatar ? `<img class="avatar" src="${escapeHtml(siteAvatar)}" alt="${escapeHtml(siteAuthor)}">` : `<img class="avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect fill='%23e8e0cc' width='80' height='80'/%3E%3Ctext x='40' y='45' text-anchor='middle' fill='%239f927d' font-size='32'%3E?%3C/text%3E%3C/svg%3E" alt="头像">`}
        <div class="name">${escapeHtml(siteAuthor)}</div>
        ${siteBio ? `<div class="bio">${escapeHtml(siteBio)}</div>` : ''}
        <div class="stats">
          <div class="stat-item"><div id="stat-posts" class="stat-num">-</div><div class="stat-label">文章</div></div>
          <div class="stat-item"><div id="stat-cats" class="stat-num">-</div><div class="stat-label">分类</div></div>
          <div class="stat-item"><div id="stat-tags" class="stat-num">-</div><div class="stat-label">标签</div></div>
        </div>
        <div style="font-size:0.78em;color:#9f927d;margin-bottom:14px;line-height:1.8">
          <div>建站时间：<span id="site-created">${(function(d){return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'})(new Date(settings.site_created_at || '2020-02-02'))}</span></div>
          <div>最后更新：<span id="site-updated">-</span></div>
        </div>
        <h4>📂 分类</h4>
        <div id="category-list" class="category-list"></div>
        <h4>🔗 ${escapeHtml(settings.links_title || '友链')}</h4>
        <div id="link-list" class="link-list"></div>
      </div>
    </aside>
    <div class="post-list">
      <div style="margin-bottom:16px">
        <input id="search-input" type="text" placeholder="搜索文章标题或标签……" style="width:100%;padding:12px 18px;border:2px solid #e8e0cc;border-radius:14px;font-size:15px;background:#f7f3df;color:#725d42;outline:none;transition:border-color 0.2s;box-shadow:0 2px 8px rgba(107,92,67,0.08)" onfocus="this.style.borderColor='#19c8b9'" onblur="this.style.borderColor='#e8e0cc'">
      </div>
      <div id="app">
        <p style="text-align:center;color:#9f927d;">加载中...</p>
      </div>
    </div>
  </main>
  <button class="back-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>
  <footer>${settings.site_footer ? escapeHtml(settings.site_footer) : '&copy; 2026 ' + escapeHtml(siteName)}</footer>
  ${settings.custom_js ? '<script>' + settings.custom_js + '<\/script>' : ''}
  <script>
    // 返回顶部
    window.addEventListener('scroll', function() {
      var btn = document.querySelector('.back-to-top');
      if (btn) { btn.classList.toggle('show', window.scrollY > 300); }
    });

    // 移动端导航
    function toggleNav() {
      document.querySelector('.sidebar').classList.toggle('open');
      document.getElementById('mobileOverlay').classList.toggle('show');
      document.querySelector('.mobile-nav-toggle').classList.toggle('nav-open');
    }

    // 加载侧边栏数据
    fetch('/api/stats').then(function(r){return r.json()}).then(function(s){
      document.getElementById('stat-posts').textContent = s.postCount;
      document.getElementById('stat-cats').textContent = s.catCount;
      document.getElementById('stat-tags').textContent = s.tagCount || 0;
      if (s.latestDate) { var d = new Date(s.latestDate); document.getElementById('site-updated').textContent = d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'; }
    });
    fetch('/api/categories').then(function(r){return r.json()}).then(function(cats){
      var list = document.getElementById('category-list');
      if(cats && cats.length > 0) {
        list.innerHTML = '<a href="/">全部</a>' + cats.map(function(c){return '<a href="/?category='+encodeURIComponent(c.slug)+'">'+c.name+'</a>'}).join('');
      }
    });
    fetch('/api/links').then(function(r){return r.json()}).then(function(links){
      var list = document.getElementById('link-list');
      if(links && links.length > 0) {
        list.innerHTML = links.map(function(l){return '<a href="'+l.url+'" target="_blank" rel="noopener">'+l.name+'</a>'}).join('');
      }
    });

    // 加载文章列表（支持分页）
    var currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
    var currentCategory = new URLSearchParams(window.location.search).get('category');

    function loadPosts(page) {
      page = page || 1;
      var apiUrl = '/api/posts?page=' + page + '&limit=10';
      if (currentCategory) apiUrl += '&category=' + encodeURIComponent(currentCategory);

      fetch(apiUrl).then(function(r){return r.json()}).then(function(res) {
        var posts = res.data || [];
        var pagination = res.pagination || {};
        var app = document.getElementById('app');
        var html = '';

        if (currentCategory) {
          html += '<div style="margin-bottom:16px"><a href="/" style="display:inline-block;padding:8px 20px;background:#19c8b9;color:#fff;text-decoration:none;border-radius:50px;font-weight:600;font-size:0.9em;box-shadow:0 4px 0 0 #11a89b">← 返回首页</a> <span id="current-cat" style="color:#794f27;font-weight:600;margin-left:8px"></span></div>';
          fetch('/api/categories').then(function(r){return r.json()}).then(function(cats){
            var cat = cats.find(function(c){return c.slug === currentCategory});
            var el = document.getElementById('current-cat');
            if(el && cat) el.textContent = '当前分类：' + cat.name;
          });
        }

        if (!posts || posts.length === 0) {
          app.innerHTML = html + '<p style="text-align:center;color:#9f927d;">暂无文章</p>';
          return;
        }

        var formatDate = function(d) { var dt = new Date(d); return dt.getFullYear() + String(dt.getMonth()+1).padStart(2,'0'); };
        html += posts.map(function(post) {
          var cover = post.cover_image ? '<img src="' + post.cover_image + '" alt="' + post.title + '" loading="lazy">' : '<span style="color:#9f927d">封面</span>';
          var tags = post.tags ? post.tags.split(',').map(function(t) {
            return '<span style="display:inline-block;padding:3px 10px;background:#e6f5f0;color:#3a7a6a;font-size:0.72em;font-weight:700;margin-right:8px;border:1px solid #b8ddd0;border-radius:4px;box-shadow:1px 2px 3px rgba(58,122,106,0.12)">' + t.trim() + '</span>';
          }).join('') : '';
          function stripHtml(str) { return str ? str.split('<').join('').split('>').join('').split('&lt;').join('<').split('&gt;').join('>').split('&amp;').join('&').substring(0, 80) : ''; }
          var rawText = post.excerpt || post.content || '';
          var excerpt = post.password ? '🔒 该文章受到密码保护' : stripHtml(rawText) + (rawText.length > 80 ? '...' : '');
          return '<article class="post-card">' +
            '<div class="post-cover">' + cover + '</div>' +
            '<div class="post-content">' +
              '<h2><a href="/post/' + formatDate(post.created_at) + '/' + post.id + '">' + post.title + '</a></h2>' +
              '<p style="color:#725d42;font-size:0.9em;line-height:1.7;margin:8px 0">' + excerpt + '</p>' +
              (tags ? '<div style="margin:8px 0 0">' + tags + '</div>' : '') +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">' +
                '<div class="meta"><span>📂 ' + post.category + '</span><span>' + (function(d){return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'})(new Date(post.created_at)) + '</span></div>' +
                '<a class="read-more" href="/post/' + formatDate(post.created_at) + '/' + post.id + '">阅读更多</a>' +
              '</div>' +
            '</div>' +
          '</article>';
        }).join('');

        // 分页控件
        if (pagination.totalPages > 1) {
          html += '<div class="pagination">';
          if (page > 1) {
            html += '<a href="javascript:void(0)" onclick="loadPosts(' + (page-1) + ')">上一页</a>';
          }
          for (var i = 1; i <= pagination.totalPages; i++) {
            if (i === page) {
              html += '<span class="current">' + i + '</span>';
            } else if (Math.abs(i - page) <= 2 || i === 1 || i === pagination.totalPages) {
              html += '<a href="javascript:void(0)" onclick="loadPosts(' + i + ')">' + i + '</a>';
            } else if (Math.abs(i - page) === 3) {
              html += '<span style="padding:8px 8px">...</span>';
            }
          }
          if (page < pagination.totalPages) {
            html += '<a href="javascript:void(0)" onclick="loadPosts(' + (page+1) + ')">下一页</a>';
          }
          html += '</div>';
        }

        app.innerHTML = html;
      }).catch(function(e) {
        console.error('加载文章失败:', e);
        document.getElementById('app').innerHTML = '<p style="text-align:center;color:#e05a5a;">加载失败，请刷新重试</p>';
      });
    }

    loadPosts(currentPage);

    // 搜索功能（标题 + 标签）
    var searchTimer;
    document.getElementById('search-input').addEventListener('input', function() {
      clearTimeout(searchTimer);
      var keyword = this.value.trim().toLowerCase();
      searchTimer = setTimeout(function() {
        var cards = document.querySelectorAll('.post-card');
        cards.forEach(function(card) {
          if (!keyword) { card.style.display = ''; return; }
          var title = card.querySelector('h2 a');
          var titleText = title ? title.textContent.toLowerCase() : '';
          var tags = card.querySelectorAll('span[style*="background:#e6f5f0"]');
          var tagText = '';
          tags.forEach(function(t) { tagText += t.textContent.toLowerCase() + ' '; });
          var match = titleText.indexOf(keyword) !== -1 || tagText.indexOf(keyword) !== -1;
          card.style.display = match ? '' : 'none';
        });
      }, 200);
    });
  </script>
</body>
</html>`;
}
