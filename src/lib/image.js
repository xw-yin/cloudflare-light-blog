// ==================== 图片处理模块（优化内存使用）====================

import { generateRandomFilename } from './utils.js';

/**
 * 处理 R2 图片请求
 */
export async function handleImage(request, env, path) {
  const filename = path.replace('/images/', '');

  // 验证文件名（防止路径遍历）
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return new Response('Bad Request', { status: 400 });
  }

  if (!env.R2) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const object = await env.R2.get(filename);
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (e) {
    console.error('[Image] R2 读取失败:', e);
    return new Response('Internal Error', { status: 500 });
  }
}

/**
 * 上传图片到 R2（优化：直接使用 ArrayBuffer，不经过 base64）
 */
export async function uploadImage(env, data, prefix) {
  try {
    let arrayBuffer, contentType, ext;

    if (typeof data === 'string' && data.startsWith('data:')) {
      // base64 数据（来自编辑器粘贴）
      const matches = data.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) return data;

      contentType = matches[1];
      const binaryStr = atob(matches[2]);
      arrayBuffer = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        arrayBuffer[i] = binaryStr.charCodeAt(i);
      }
      ext = contentType.split('/')[1] || 'jpg';
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      // 直接的 ArrayBuffer（来自文件上传）
      arrayBuffer = data;
      contentType = 'application/octet-stream';
      ext = 'bin';
    } else {
      return data; // 无法处理，原样返回
    }

    const filename = `${prefix}_${generateRandomFilename()}.${ext}`;

    if (env.R2) {
      await env.R2.put(filename, arrayBuffer, {
        httpMetadata: { contentType }
      });
      return `/images/${filename}`;
    }

    // 无 R2 时回退到 base64（仅小图）
    if (typeof data === 'string') return data;
    return '';
  } catch (e) {
    console.error('[Image] 上传失败:', e);
    return typeof data === 'string' ? data : '';
  }
}

/**
 * 处理文件上传请求（优化：直接传 ArrayBuffer 到 R2）
 */
export async function handleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return { error: '没有文件', status: 400 };
    }

    // 文件大小限制（1MB）
    const MAX_SIZE = 2 * 1024 * 1024;
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return { error: '文件大小不能超过 10MB', status: 400 };
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (file.type && !allowedTypes.includes(file.type)) {
      return { error: '不支持的文件类型', status: 400 };
    }

    const ext = (file.type?.split('/')[1] || 'jpg').replace('+xml', '');
    const filename = `${generateRandomFilename()}.${ext}`;

    if (env.R2) {
      await env.R2.put(filename, arrayBuffer, {
        httpMetadata: { contentType: file.type || 'image/jpeg' }
      });
      return { url: `/images/${filename}` };
    }

    // 无 R2 时回退到 base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return { url: `data:${file.type || 'image/jpeg'};base64,${base64}` };
  } catch (e) {
    console.error('[Image] 上传处理失败:', e);
    return { error: '上传失败', status: 500 };
  }
}
