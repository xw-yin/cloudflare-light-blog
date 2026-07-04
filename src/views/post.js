// ==================== 文章详情页（SEO 优化）====================

import { escapeHtml } from '../lib/utils.js';

export function getPostHTML(post, settings) {
  settings = settings || {};
  const siteName = settings.site_name || '我的博客';
  const siteDesc = settings.site_description || '';
  const siteAuthor = settings.site_author || siteName;
  const siteAvatar = settings.site_avatar || '';
  const favicon = settings.site_favicon || '';
  const postExcerpt = post.excerpt || (post.content ? post.content.substring(0, 160).split('#').join('').split('*').join('').split('\n').join(' ').trim() : '');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} - ${escapeHtml(siteName)}</title>
  <meta name="description" content="${escapeHtml(postExcerpt)}">
  <meta name="author" content="${escapeHtml(siteAuthor)}">
  <meta name="robots" content="index, follow">
  ${favicon ? `<link rel="icon" href="${escapeHtml(favicon)}">` : ''}
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <link rel="canonical" href="/post/${new Date(post.created_at).getFullYear()}${String(new Date(post.created_at).getMonth()+1).padStart(2,'0')}/${post.id}">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(postExcerpt)}">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="article:published_time" content="${post.published_at || post.created_at}">
  <meta property="article:modified_time" content="${post.updated_at}">
  ${post.category ? `<meta property="article:section" content="${escapeHtml(post.category)}">` : ''}
  ${post.tags ? post.tags.split(',').map(t => `<meta property="article:tag" content="${escapeHtml(t.trim())}">`).join('\n  ') : ''}
  ${post.cover_image ? `<meta property="og:image" content="${escapeHtml(post.cover_image)}">` : ''}
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": postExcerpt,
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at,
    "author": { "@type": "Person", "name": settings.site_author || siteName },
    "mainEntityOfPage": { "@type": "WebPage" }
  })}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Nunito, 'Noto Sans SC', sans-serif; background: var(--body-bg, #f8f8f0); color: var(--text-body, #725d42); }
    header { background: linear-gradient(135deg, #7DC395 0%, #5BAF7A 100%); color: #fff; padding: 40px 20px; text-align: center; position: relative; overflow: hidden; }
    header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: linear-gradient(transparent, rgba(0,0,0,0.05)); }
    header h1 { font-size: 2.5em; font-weight: 800; margin-bottom: 8px; }
    header a { color: #fff; text-decoration: none; }
    header p { opacity: 0.9; font-size: 1.1em; font-weight: 500; }
    main { max-width: 1124px; margin: 30px auto; padding: 0 20px; display: flex; gap: 24px; align-items: flex-start; }
    .sidebar { width: 280px; flex-shrink: 0; }
    .content-area { flex: 1; min-width: 0; }
    .profile-card { background: #f7f3df; border-radius: 20px; padding: 24px; box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42); border: 2px solid #e8e0cc; }
    .profile-card .avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin: 0 auto 14px; display: block; border: 3px solid #c4b89e; background: #e8e0cc; }
    .profile-card .name { font-size: 1.1em; font-weight: 700; text-align: center; margin-bottom: 4px; color: #794f27; }
    .profile-card .bio { color: #725d42; font-size: 0.85em; text-align: center; margin-bottom: 14px; }
    .profile-card .stats { display: flex; justify-content: center; gap: 16px; padding-bottom: 14px; border-bottom: 2px solid #e8e0cc; margin-bottom: 14px; }
    .profile-card .stat-item { text-align: center; }
    .profile-card .stat-num { font-size: 1.1em; font-weight: 800; color: #19c8b9; }
    .profile-card .stat-label { font-size: 0.75em; color: #9f927d; font-weight: 600; }
    .profile-card h4 { font-size: 0.85em; color: #9f927d; margin: 14px 0 8px; font-weight: 700; }
    .profile-card .category-list a, .profile-card .link-list a { display: block; padding: 8px 12px; margin: 0 0 6px 0; color: #725d42; text-decoration: none; background: #f0e8d8; border-radius: 12px; font-size: 0.85em; font-weight: 600; transition: all 0.2s; border: 2px solid transparent; }
    .profile-card .category-list a:hover, .profile-card .link-list a:hover { background: #e6f9f6; border-color: #19c8b9; color: #11a89b; }
    .post-article { background: #f7f3df; padding: 36px; border-radius: 20px; box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42); border: 2px solid #e8e0cc; }
    .post-article h1 { font-size: 1.8em; margin-bottom: 16px; color: #794f27; font-weight: 800; }
    .post-article p { margin: 0.8em 0; line-height: 1.8; }
    .post-article img { max-width: 100%; height: auto; margin: 1em 0; border-radius: 12px; cursor: zoom-in; }
    .post-article img:hover { transform: scale(1.02); transition: transform 0.2s; }
    .post-meta { color: #9f927d; font-size: 0.85em; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e8e0cc; font-weight: 600; }
    .post-meta span { margin-right: 16px; }
    .back-link { display: inline-block; margin-bottom: 20px; padding: 10px 24px; background: #19c8b9; color: #fff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 0.9em; box-shadow: 0 4px 0 0 #11a89b; transition: all 0.25s; }
    .back-link:hover { transform: translateY(-1px); box-shadow: 0 5px 0 0 #11a89b; }
    footer { text-align: center; padding: 30px 20px; color: #9f927d; font-size: 0.85em; }
    .lightbox { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.92); z-index: 2000; display: none; align-items: center; justify-content: center; cursor: zoom-out; }
    .lightbox.active { display: flex; }
    .lightbox img { max-width: 85%; max-height: 85%; border-radius: 12px; border: 4px solid rgba(255,255,255,0.3); box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1); cursor: default; transition: opacity 0.2s; }
    .lightbox-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; color: #fff; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 1; transition: all 0.2s; }
    .lightbox-close:hover { background: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.5); }
    .lightbox-bottom { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; background: rgba(0,0,0,0.5); padding: 8px 20px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.15); }
    .lightbox-nav { width: 36px; height: 36px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; user-select: none; flex-shrink: 0; }
    .lightbox-nav:hover { background: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.5); }
    .lightbox-nav:active { transform: scale(0.9); }
    .lightbox-counter { color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 600; white-space: nowrap; min-width: 50px; text-align: center; }
    .back-to-top { position: fixed; bottom: 30px; right: 30px; width: 44px; height: 44px; background: #19c8b9; color: #fff; border: none; border-radius: 50%; font-size: 20px; cursor: pointer; box-shadow: 0 4px 0 0 #11a89b; display: flex; align-items: center; justify-content: center; z-index: 998; opacity: 0; pointer-events: none; transition: all 0.25s; }
    .back-to-top.show { opacity: 1; pointer-events: auto; }
    .mobile-nav-toggle { display: none; position: fixed; top: 12px; left: 12px; z-index: 1004; width: 40px; height: 40px; background: #19c8b9; border: none; border-radius: 12px; color: #fff; font-size: 20px; cursor: pointer; box-shadow: 0 3px 0 #11a89b; transition: left 0.3s; }
    .mobile-nav-toggle.nav-open { left: 208px !important; }
    .mobile-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; }
    .mobile-overlay.show { display: block; }
    @media (max-width: 768px) {
      header { padding: 16px; }
      header h1 { font-size: 1.4em; }
      header p { font-size: 0.85em; }
      .mobile-nav-toggle { display: flex; align-items: center; justify-content: center; }
      .mobile-overlay.show { display: block; }
      main { flex-direction: row; padding: 0 12px; gap: 0; margin-top: 12px; position: relative; }
      .sidebar { width: 260px; position: fixed; top: 0; left: -260px; height: 100vh; z-index: 1002; transition: left 0.3s ease; overflow-y: auto; background: #f8f8f0; padding: 16px; box-shadow: 2px 0 8px rgba(0,0,0,0.1); }
      .sidebar.open { left: 0; }
      .profile-card { border-radius: 16px; padding: 16px; }
      .profile-card .avatar { width: 56px; height: 56px; }
      .profile-card .name { font-size: 1em; }
      .post-article { padding: 20px; border-radius: 16px; }
      .post-article h1 { font-size: 1.3em; }
      footer { padding: 20px 16px; font-size: 0.8em; }
    }
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css">
</head>
<body>
  <button class="mobile-nav-toggle" onclick="toggleNav()">☰</button>
  <div class="mobile-overlay" id="mobileOverlay" onclick="toggleNav()"></div>
  <header>
    <h1><a href="/">${escapeHtml(siteName)}</a></h1>
    ${siteDesc ? `<p>${escapeHtml(siteDesc)}</p>` : ''}
  </header>
  <main>
    <aside class="sidebar" ${settings.profile_position === 'right' ? 'style="order:2"' : ''}>
      <div class="profile-card">
        ${siteAvatar ? `<img class="avatar" src="${escapeHtml(siteAvatar)}" alt="${escapeHtml(siteAuthor)}">` : `<img class="avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect fill='%23e8e0cc' width='80' height='80'/%3E%3Ctext x='40' y='45' text-anchor='middle' fill='%239f927d' font-size='32'%3E?%3C/text%3E%3C/svg%3E" alt="头像">`}
        <div class="name">${escapeHtml(siteAuthor)}</div>
        ${settings.site_bio ? `<div class="bio">${escapeHtml(settings.site_bio)}</div>` : ''}
        <div class="stats">
          <div class="stat-item"><div id="stat-posts" class="stat-num">-</div><div class="stat-label">文章</div></div>
          <div class="stat-item"><div id="stat-cats" class="stat-num">-</div><div class="stat-label">分类</div></div>
          <div class="stat-item"><div id="stat-tags" class="stat-num">-</div><div class="stat-label">标签</div></div>
        </div>
        <div style="font-size:0.78em;color:#9f927d;margin-bottom:14px;line-height:1.8">
          <div>建站时间：${(function(d){return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'})(new Date(settings.site_created_at || '2020-02-02'))}</div>
          <div>最后更新：<span id="site-updated">-</span></div>
        </div>
        <h4>${settings.category_icon ? (settings.category_icon.startsWith('http') || settings.category_icon.startsWith('/images/') ? '<img src="' + escapeHtml(settings.category_icon) + '" style="width:18px;height:18px;vertical-align:middle;margin-right:4px">' : settings.category_icon + ' ') : '📂 '}分类</h4>
        <div id="category-list" class="category-list"></div>
        <h4>${settings.links_icon ? (settings.links_icon.startsWith('http') || settings.links_icon.startsWith('/images/') ? '<img src="' + escapeHtml(settings.links_icon) + '" style="width:18px;height:18px;vertical-align:middle;margin-right:4px">' : settings.links_icon + ' ') : '🔗 '}${escapeHtml(settings.links_title || '友链')}</h4>
        <div id="link-list" class="link-list"></div>
      </div>
      ${settings.enable_tag_cloud !== '0' && settings.tag_cloud_position === 'left' ? `
      <div class="profile-card" style="margin-top:16px">
        <h4>${settings.tag_cloud_icon ? (settings.tag_cloud_icon.startsWith('http') || settings.tag_cloud_icon.startsWith('/images/') ? '<img src="' + escapeHtml(settings.tag_cloud_icon) + '" style="width:18px;height:18px;vertical-align:middle;margin-right:4px">' : settings.tag_cloud_icon + ' ') : '🏷️ '}标签云</h4>
        <div id="tag-cloud" class="tag-cloud" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 0"></div>
      </div>
      ` : ''}
    </aside>
    <div class="content-area" ${settings.profile_position === 'right' ? 'style="order:1"' : ''}>
      ${settings.enable_tag_cloud !== '0' && settings.tag_cloud_position === 'right' ? `
      <div style="margin-bottom:16px;padding:16px;background:#f7f3df;border-radius:20px;border:2px solid #e8e0cc">
        <h4 style="margin-bottom:10px">${settings.tag_cloud_icon ? (settings.tag_cloud_icon.startsWith('http') || settings.tag_cloud_icon.startsWith('/images/') ? '<img src="' + escapeHtml(settings.tag_cloud_icon) + '" style="width:18px;height:18px;vertical-align:middle;margin-right:4px">' : settings.tag_cloud_icon + ' ') : '🏷️ '}标签云</h4>
        <div id="tag-cloud" class="tag-cloud" style="display:flex;flex-wrap:wrap;gap:6px"></div>
      </div>
      ` : ''}
      <a class="back-link" href="/">← 返回首页</a>
      <article class="post-article">
        <h1>${escapeHtml(post.title)}</h1>
        <div class="post-meta">
          <span>📂 ${escapeHtml(post.category)}</span>
          <span>${(function(d){return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'})(new Date(post.created_at))}</span>
        </div>
        <div id="post-content" style="line-height:1.8"></div>
        ${post.tags ? `<div style="margin-top:24px;padding-top:16px;border-top:2px solid #e8e0cc;display:flex;flex-wrap:wrap;gap:8px">${post.tags.split(',').map(t =>
          `<span style="display:inline-block;padding:4px 12px;background:#e6f5f0;color:#3a7a6a;font-size:0.82em;font-weight:700;border:1px solid #b8ddd0;border-radius:4px;box-shadow:1px 2px 3px rgba(58,122,106,0.12)">${escapeHtml(t.trim())}</span>`
        ).join('')}</div>` : ''}
      </article>
    </div>
  </main>
  <div class="lightbox" id="lightbox" onclick="closeLightbox(event)">
    <button class="lightbox-close" onclick="closeLightbox(event)">×</button>
    <img id="lightbox-img" src="" alt="">
    <div class="lightbox-bottom">
      <button class="lightbox-nav" onclick="event.stopPropagation();navLightbox(-1)">‹</button>
      <div class="lightbox-counter" id="lightbox-counter"></div>
      <button class="lightbox-nav" onclick="event.stopPropagation();navLightbox(1)">›</button>
    </div>
  </div>
  <button class="back-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>
  <footer>${settings.site_footer ? escapeHtml(settings.site_footer) : '&copy; 2026 ' + escapeHtml(siteName)}</footer>
  <script>
    fetch('/api/stats').then(function(r){return r.json()}).then(function(s){
      document.getElementById('stat-posts').textContent = s.postCount;
      document.getElementById('stat-cats').textContent = s.catCount;
      document.getElementById('stat-tags').textContent = s.tagCount || 0;
      if (s.latestDate) { var d = new Date(s.latestDate); document.getElementById('site-updated').textContent = d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'; }
    });
    fetch('/api/categories').then(function(r){return r.json()}).then(function(cats){
      var list = document.getElementById('category-list');
      if(cats && cats.length > 0) list.innerHTML = '<a href="/">全部</a>' + cats.map(function(c){return '<a href="/?category='+encodeURIComponent(c.slug)+'">'+c.name+'</a>'}).join('');
    });
    fetch('/api/links').then(function(r){return r.json()}).then(function(links){
      var list = document.getElementById('link-list');
      if(links && links.length > 0) list.innerHTML = links.map(function(l){return '<a href="'+l.url+'" target="_blank" rel="noopener">'+l.name+'</a>'}).join('');
    });

    // 加载标签云
    var tagCloudEl = document.getElementById('tag-cloud');
    if (tagCloudEl) {
      fetch('/api/posts?limit=999').then(function(r){return r.json()}).then(function(res) {
        var posts = res.data || [];
        var tagMap = {};
        posts.forEach(function(post) {
          if (post.password) return; // 跳过有密码的文章
          if (post.tags) {
            post.tags.split(',').forEach(function(t) {
              var tag = t.trim();
              if (tag) {
                tagMap[tag] = (tagMap[tag] || 0) + 1;
              }
            });
          }
        });
        var tags = Object.keys(tagMap);
        if (tags.length > 0) {
          var sizes = [0.75, 0.85, 1, 1.15, 1.3];
          tagCloudEl.innerHTML = tags.map(function(tag) {
            var size = sizes[Math.floor(Math.random() * sizes.length)];
            return '<a href="/?tag=' + encodeURIComponent(tag) + '" style="font-size:' + size + 'em;padding:3px 10px;background:#e6f5f0;color:#3a7a6a;border:1px solid #b8ddd0;border-radius:4px;text-decoration:none;white-space:nowrap">' + tag + '</a>';
          }).join('');
        } else {
          tagCloudEl.innerHTML = '<span style="color:#9f927d;font-size:0.85em">暂无标签</span>';
        }
      });
    }

    window.addEventListener('scroll', function() {
      var btn = document.querySelector('.back-to-top');
      if (btn) btn.classList.toggle('show', window.scrollY > 300);
    });

    function toggleNav() {
      document.querySelector('.sidebar').classList.toggle('open');
      document.getElementById('mobileOverlay').classList.toggle('show');
      document.querySelector('.mobile-nav-toggle').classList.toggle('nav-open');
    }

    var lightboxImages = [];
    var lightboxIndex = 0;

    function initLightbox() {
      lightboxImages = Array.from(document.querySelectorAll('.post-article img'));
      lightboxImages.forEach(function(img, index) {
        img.addEventListener('click', function() {
          openLightbox(index);
        });
      });
    }

    function openLightbox(index) {
      lightboxIndex = index;
      updateLightbox();
      document.getElementById('lightbox').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function updateLightbox() {
      if (!lightboxImages[lightboxIndex]) return;
      document.getElementById('lightbox-img').src = lightboxImages[lightboxIndex].src;
      var counter = document.getElementById('lightbox-counter');
      if (lightboxImages.length > 1) {
        counter.textContent = (lightboxIndex + 1) + ' / ' + lightboxImages.length;
        counter.style.display = 'block';
      } else {
        counter.style.display = 'none';
      }
    }

    function navLightbox(dir) {
      var newIndex = lightboxIndex + dir;
      if (newIndex < 0) newIndex = lightboxImages.length - 1;
      if (newIndex >= lightboxImages.length) newIndex = 0;
      lightboxIndex = newIndex;
      updateLightbox();
    }

    function closeLightbox(e) {
      if (e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')) {
        document.getElementById('lightbox').classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    document.addEventListener('keydown', function(e) {
      var lb = document.getElementById('lightbox');
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') { lb.classList.remove('active'); document.body.style.overflow = ''; }
      else if (e.key === 'ArrowLeft') navLightbox(-1);
      else if (e.key === 'ArrowRight') navLightbox(1);
    });
  </script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js" crossorigin="anonymous"></script>
  <style>
    pre { background: #2b2118; border-radius: 20px; padding: 20px 24px; overflow-x: auto; margin: 14px 0; border: 1px solid #3d3028; box-shadow: none; position: relative; }
    .copy-btn { position: absolute; top: 12px; right: 12px; padding: 4px 12px; background: rgba(232,213,188,0.1); border: 1px solid rgba(232,213,188,0.2); border-radius: 6px; color: rgba(232,213,188,0.6); font-size: 12px; cursor: pointer; transition: all 0.2s; z-index: 2; }
    .copy-btn:hover { background: rgba(232,213,188,0.2); color: #e8d5bc; }
    .copy-btn.copied { background: rgba(25,200,185,0.3); color: #19c8b9; border-color: #19c8b9; }
    pre code { font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 14px; line-height: 1.7; color: #e8d5bc; background: none; padding: 0; border: none; border-radius: 0; box-shadow: none; display: block; font-weight: 600; }
    code { font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; background: #3d3028; color: #e8d5bc; padding: 3px 10px; border-radius: 6px; font-size: 0.88em; border: 1px solid #4d4038; font-weight: 600; }
    .hljs-keyword, .hljs-selector-tag { color: #d4a0e0; }
    .hljs-string, .hljs-attr { color: #a8d4a0; }
    .hljs-number, .hljs-literal { color: #80c0e0; }
    .hljs-comment { color: #8b8070; font-style: italic; }
    .hljs-function .hljs-title, .hljs-title.function_ { color: #e06c75; }
    .hljs-built_in { color: #f0a870; }
    .hljs-type, .hljs-class .hljs-title { color: #f0a870; }
    .hljs-params { color: #e8d5bc; }
    .hljs-meta { color: #80c0e0; }
    .hljs-punctuation { color: #d4b896; }
    .hljs-property { color: #80c0e0; }
    .hljs-title { color: #e06c75; }
    .hljs-emphasis { font-style: italic; color: #f0a870; }
    .hljs-strong { font-weight: bold; color: #f0a870; }
    .hljs-link { color: #a8d4a0; text-decoration: underline; }
    .hljs-addition { color: #a8d4a0; background: rgba(46,160,67,0.15); }
    blockquote { position: relative; background: #f0ece2; border-left: 4px solid #c4b89e; border-radius: 0 12px 12px 0; padding: 16px 20px 16px 48px; margin: 16px 0; color: #6b5d45; font-style: italic; line-height: 1.8; }
    blockquote::before { content: '\\201C'; position: absolute; left: 14px; top: 8px; font-size: 48px; color: #c4b89e; font-family: Georgia, serif; line-height: 1; font-style: normal; }
    blockquote p { margin: 0; }
    blockquote p + p { margin-top: 8px; }
    details { background: #f5f2eb; border: 1.5px solid #ddd6c6; border-radius: 12px; padding: 0; margin: 16px 0; overflow: hidden; }
    summary { padding: 14px 20px; background: #ede8dc; cursor: pointer; font-weight: 700; color: #794f27; border-bottom: 1.5px solid #ddd6c6; list-style: none; display: flex; align-items: center; gap: 8px; }
    summary::before { content: '\\25B6'; font-size: 12px; transition: transform 0.2s; display: inline-block; }
    details[open] summary::before { transform: rotate(90deg); }
    summary::-webkit-details-marker { display: none; }
    details > div, details > p { padding: 16px 20px; }
    .hljs-deletion { color: #e06c75; background: rgba(224,108,117,0.15); }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var raw = ${JSON.stringify((post.content || '').split('</script>').join('<\\/script>'))};
      var fence = String.fromCharCode(96)+String.fromCharCode(96)+String.fromCharCode(96);
      var tick = String.fromCharCode(96);
      var nl = String.fromCharCode(10);

      // 第一步：提取代码块，转义 HTML
      var codeBlocks = [];
      var content = raw;
      // 先处理三反引号代码块
      while (true) {
        var fs = content.indexOf(nl + fence);
        if (fs === -1) fs = content.indexOf(fence);
        if (fs === -1) break;
        var af = content.indexOf(fence, fs + fence.length);
        if (af === -1) break;
        var cc = content.substring(fs + fence.length, af);
        var fn = cc.indexOf(nl);
        if (fn !== -1) cc = cc.substring(fn + 1);
        var esc = cc.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
        var idx = codeBlocks.length;
        codeBlocks.push(esc);
        content = content.substring(0, fs) + nl + '%%CB_' + idx + '%%' + nl + content.substring(af + fence.length);
      }
      // 再处理未闭合的单反引号代码块
      while (true) {
        var si = content.indexOf(tick);
        if (si === -1) break;
        var ei = content.indexOf(tick, si + 1);
        if (ei !== -1) {
          // 有闭合的单反引号
          var sc = content.substring(si + 1, ei);
          var esc2 = sc.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
          var idx2 = codeBlocks.length;
          codeBlocks.push(esc2);
          content = content.substring(0, si) + '%%CB_' + idx2 + '%%' + content.substring(ei + 1);
        } else {
          // 没有闭合的反引号，取到内容结尾
          var sc2 = content.substring(si + 1);
          var esc3 = sc2.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
          var idx3 = codeBlocks.length;
          codeBlocks.push(esc3);
          content = content.substring(0, si) + '%%CB_' + idx3 + '%%';
        }
      }

      // 第二步：用 marked 解析（代码块已被占位符替换，不会有 HTML 问题）
      var html;
      if (typeof marked !== 'undefined' && marked.parse) {
        marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
        html = marked.parse(content);
      } else {
        html = '<p>' + content.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split(String.fromCharCode(10)).join('<br>') + '</p>';
      }

      // 第三步：还原代码块，用 <pre><code> 包裹 + 语法高亮
      for (var j = 0; j < codeBlocks.length; j++) {
        var placeholder = '%%CB_' + j + '%%';
        var highlighted = codeBlocks[j];
        try {
          if (typeof hljs !== 'undefined') {
            highlighted = hljs.highlightAuto(codeBlocks[j].split('&amp;').join('&').split('&lt;').join('<').split('&gt;').join('>')).value;
          }
        } catch(e) { highlighted = codeBlocks[j]; }
        var block = '<pre><code class="hljs">' + highlighted + '</code></pre>';
        html = html.replace(placeholder, block);
      }

      // 给所有图片添加懒加载（在插入 DOM 前）
      html = html.split('<img ').join('<img loading="lazy" ');
      document.getElementById('post-content').innerHTML = html;

      // 为代码块添加复制按钮
      var pres = document.querySelectorAll('pre');
      for (var p = 0; p < pres.length; p++) {
        var btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = '复制';
        btn.onclick = (function(pre, button) {
          return function() {
            var code = pre.querySelector('code');
            var text = code ? code.textContent : pre.textContent;
            navigator.clipboard.writeText(text).then(function() {
              button.textContent = '已复制';
              button.classList.add('copied');
              setTimeout(function() { button.textContent = '复制'; button.classList.remove('copied'); }, 2000);
            });
          };
        })(pres[p], btn);
        pres[p].appendChild(btn);
      }

      initLightbox();
      // 图片懒加载
      document.querySelectorAll('.post-article img').forEach(function(img) { img.setAttribute('loading', 'lazy'); });
    });
  </script>
  <script>
  (function(){
    var s = ${(JSON.stringify(settings.custom_js || ''))};
    if(s && s.trim()){
      var d=document.createElement('div');d.innerHTML=s;
      var scripts=d.querySelectorAll('script');
      scripts.forEach(function(old){
        var n=document.createElement('script');
        for(var i=0;i<old.attributes.length;i++)n.setAttribute(old.attributes[i].name,old.attributes[i].value);
        if(old.textContent)n.textContent=old.textContent;
        document.body.appendChild(n);
      });
      if(!scripts.length)document.body.appendChild(d);
    }
  })();
  </script>
</body>
</html>`;
}
