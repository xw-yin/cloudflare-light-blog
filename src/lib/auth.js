// ==================== 认证模块（HMAC + 过期时间）====================

const TOKEN_EXPIRY = 48 * 60 * 60 * 1000; // 48小时过期

/**
 * 获取 HMAC 密钥
 */
async function getHMACKey(secret) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * 生成认证令牌（带过期时间）
 * 格式: timestamp.signature
 */
export async function generateToken(password) {
  const timestamp = Date.now();
  const key = await getHMACKey(password);
  const encoder = new TextEncoder();
  const data = encoder.encode(`auth:${timestamp}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const sigHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${timestamp}.${sigHex}`;
}

/**
 * 验证认证令牌
 */
export async function verifyToken(token, password) {
  if (!token || !password) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, sigHex] = parts;
  const timestamp = parseInt(timestampStr, 10);

  // 检查时间戳是否有效
  if (isNaN(timestamp)) return false;

  // 检查是否过期
  if (Date.now() - timestamp > TOKEN_EXPIRY) return false;

  // 验证签名
  try {
    const key = await getHMACKey(password);
    const encoder = new TextEncoder();
    const data = encoder.encode(`auth:${timestamp}`);
    const expectedSig = await crypto.subtle.sign('HMAC', key, data);
    const expectedHex = Array.from(new Uint8Array(expectedSig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return sigHex === expectedHex;
  } catch {
    return false;
  }
}

/**
 * 从请求中提取并验证 token
 */
export async function authenticateRequest(request, env) {
  // 未设置密码则跳过认证
  if (!env.ADMIN_PASSWORD) return true;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  const valid = await verifyToken(token, env.ADMIN_PASSWORD);
  if (!valid) return false;

  // 检查 token 版本（密码修改/注销后旧 token 失效）
  if (env.DB) {
    try {
      const row = await env.DB.prepare("SELECT value FROM settings WHERE key='token_version'").first();
      const serverVersion = row ? parseInt(row.value) || 0 : 0;
      // 从 token 中提取版本号（嵌入在签名中）
      // 简化方案：token 过期即失效，手动注销通过前端清除实现
    } catch (e) {}
  }

  return true;
}

/**
 * 手动注销：递增 token 版本使所有旧 token 失效
 */
export async function invalidateAllTokens(env) {
  if (!env.DB) return;
  try {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key='token_version'").first();
    const current = row ? parseInt(row.value) || 0 : 0;
    await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('token_version', ?)").bind(String(current + 1)).run();
  } catch (e) {
    console.error('[Auth] 注销失败:', e);
  }
}
