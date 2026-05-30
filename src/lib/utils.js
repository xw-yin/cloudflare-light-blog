// ==================== 工具函数 ====================

/**
 * JSON 响应
 */
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/**
 * CSP 头（适度宽松，允许 CDN 和内联脚本/样式）
 */
export const CSP_HEADER = "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self';";

/**
 * HTTP 安全头
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/**
 * HTML 响应（带 CSP + 安全头）
 */
export function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': CSP_HEADER,
      ...SECURITY_HEADERS
    }
  });
}

/**
 * 错误响应（不暴露内部错误信息）
 */
export function errorResponse(message, status = 500, logError = null) {
  if (logError) {
    console.error(`[Error ${status}]`, logError);
  }
  const safeMessages = {
    400: '请求参数错误',
    401: '未授权访问',
    403: '禁止访问',
    404: '资源不存在',
    500: '服务器内部错误'
  };
  return json({ error: safeMessages[status] || message }, status);
}

/**
 * 生成 URL 友好的 slug
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * 生成随机文件名
 */
export function generateRandomFilename() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

/**
 * HTML 转义（防 XSS）
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 获取 CORS 头（支持多域名，从请求头 Origin 匹配）
 * @param {Request} request - 请求对象
 * @param {string} allowedOrigins - 逗号分隔的允许来源，"*" 表示全部允许
 */
export function getCorsHeaders(request, allowedOrigins) {
  const origins = (allowedOrigins || '*').split(',').map(s => s.trim()).filter(Boolean);
  const requestOrigin = request.headers.get('Origin') || '';
  let allowOrigin = '*';
  if (origins.length === 1 && origins[0] === '*') {
    allowOrigin = '*';
  } else if (origins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  } else {
    allowOrigin = origins[0] || '*';
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

/**
 * 处理 OPTIONS 预检请求
 */
export function handleOptions(request, allowedOrigins) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(request, allowedOrigins) });
  }
  return null;
}
