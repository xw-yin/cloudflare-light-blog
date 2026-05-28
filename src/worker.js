// ==================== Cloudflare Light Blog - 主入口 ====================
// 模块化架构 | HMAC 认证 | 分页 | 缓存 | SEO

import { html, errorResponse, handleOptions, getCorsHeaders } from './lib/utils.js';
import { initDB, getSettings } from './lib/db.js';
import { authenticateRequest } from './lib/auth.js';
import { handleImage } from './lib/image.js';
import { withCache } from './lib/cache.js';
import { handleAPI } from './api.js';
import { getFrontendHTML } from './views/frontend.js';
import { getPostHTML } from './views/post.js';
import { getPasswordHTML } from './views/password.js';
import { getAdminHTML } from './views/admin.js';

// 数据库初始化状态缓存
let dbInitPromise = null;

function ensureDB(env) {
  if (!dbInitPromise) {
    dbInitPromise = initDB(env).catch(e => {
      dbInitPromise = null; // 失败时重置，允许重试
      throw e;
    });
  }
  return dbInitPromise;
}

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    const optionsResponse = handleOptions(request, env);
    if (optionsResponse) return optionsResponse;

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 初始化数据库（幂等操作，Promise 缓存避免重复执行）
      await ensureDB(env);

      // ========== 路由分发 ==========

      // Sitemap
      if (path === '/sitemap.xml') {
        return handleAPI(request, env, path);
      }

      // API 路由
      if (path.startsWith('/api/')) {
        return handleAPI(request, env, path);
      }

      // 后台路由
      if (path.startsWith('/admin')) {
        return handleAdmin(request, env, path);
      }

      // R2 图片
      if (path.startsWith('/images/')) {
        return handleImage(request, env, path);
      }

      // 文章详情页
      if (path.startsWith('/post/')) {
        return handlePostPage(request, env, path, ctx);
      }

      // 首页（带缓存）
      return handleFrontendPage(request, env, ctx);

    } catch (e) {
      console.error('[Worker] 未捕获错误:', e);
      return errorResponse('服务器错误', 500, e);
    }
  }
};

// ==================== 页面处理 ====================

/**
 * 首页（带缓存）
 */
async function handleFrontendPage(request, env, ctx) {
  return withCache(request, async () => {
    const settings = await getSettings(env);
    return html(getFrontendHTML(settings));
  }, 300); // 缓存 5 分钟
}

/**
 * 文章详情页（带缓存）
 */
async function handlePostPage(request, env, path, ctx) {
  const match = path.match(/^\/post\/(\d{6})\/(\d+)$/);
  if (!match) {
    return html('无效的文章链接', 404);
  }

  const id = parseInt(match[2]);
  const url = new URL(request.url);
  const providedPassword = url.searchParams.get('password');

  // 如果带密码参数，不缓存
  if (providedPassword) {
    return renderPostPage(env, id, providedPassword);
  }

  // 文章详情页不缓存（编辑后立即生效）
  return renderPostPage(env, id, null);
}

/**
 * 渲染文章详情页
 */
async function renderPostPage(env, id, providedPassword) {
  const settings = await getSettings(env);

  const post = await env.DB.prepare(
    "SELECT * FROM posts WHERE id=? AND status='published'"
  ).bind(id).first();

  if (!post) {
    return html('文章不存在', 404);
  }

  // 检查密码保护
  if (post.password && post.password !== '') {
    if (providedPassword !== post.password) {
      return html(getPasswordHTML(post));
    }
  }

  return html(getPostHTML(post, settings));
}

/**
 * 后台管理页面
 */
async function handleAdmin(request, env, path) {
  // 登录页面不需要认证
  if (path === '/admin/' || path === '/admin') {
    return html(getAdminHTML());
  }

  // 其他后台路径需要认证
  if (env.ADMIN_PASSWORD) {
    const isAuthed = await authenticateRequest(request, env);
    if (!isAuthed) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return html(getAdminHTML());
}
