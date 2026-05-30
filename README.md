# cloudflare-light-blog

基于 Cloudflare Workers + D1 + R2 构建的轻量级博客系统。

## 功能特性

### 前台
- ✅ 文章列表（分页、分类筛选、搜索标题和标签）
- ✅ 文章详情页（Markdown 渲染、代码高亮、代码复制按钮、折叠框）
- ✅ 图片灯箱（上一张/下一张导航、键盘操作）
- ✅ 侧边栏（个人简介、统计数据、建站时间/最后更新、分类、自定义友链）
- ✅ 密码保护文章（HMAC 认证、24小时有效期、5次/1小时速率限制）
- ✅ 全站密码保护（可选、Cookie 24小时有效期、5次/1小时速率限制）
- ✅ 响应式布局（手机端 / 平板端 / 桌面端）
- ✅ 便签贴纸风格标签

### 后台管理
- ✅ 文章管理（表格布局、分页、内联新建/编辑、封面图上传+外链）
- ✅ 分类管理（表格布局）
- ✅ 回收站（表格布局、恢复/彻底删除）
- ✅ 个人设置（头像、简介、建站时间、友链标题/内容）
- ✅ 网站设置（标题、图标、主题、页脚、自定义JS、全站密码、CORS 来源、功能开关）
- ✅ 主题切换（动物森林 / 海洋微风）
- ✅ 图片上传（支持上传 + 外链，限制 2MB）
- ✅ Markdown 编辑器工具栏（标题、加粗、斜体、链接、图片、代码、列表、引用、分割线、折叠框）
- ✅ 响应式布局（手机端 / 平板端 / 桌面端）

### 安全
- ✅ HMAC-SHA256 管理员认证（48小时过期）
- ✅ 全站密码保护（Cookie + HMAC 签名、24小时过期）
- ✅ 登录速率限制（5次/10分钟）
- ✅ 密码速率限制（全站密码 + 文章密码，5次/1小时）
- ✅ XSS 防护（Markdown 内容转义、sanitizeMarkdown）
- ✅ SQL 注入防护（参数化查询）
- ✅ 文件上传限制（2MB、类型验证）
- ✅ 错误信息隐藏（仅记录到服务器日志）
- ✅ CORS 可配置来源（支持多域名，后台设置）

### SEO
- ✅ meta 标签（description、robots）
- ✅ Open Graph 标签（og:title、og:description、og:image）
- ✅ JSON-LD 结构化数据（BlogPosting）
- ✅ canonical URL
- ✅ sitemap.xml 自动生成
- ✅ robots.txt（后台可开关）
- ✅ 图片懒加载

### 性能
- ✅ 数据库索引（status、created_at、slug、category）
- ✅ API 缓存（文章列表 60s、分类 300s、统计 60s）
- ✅ 前台页面缓存（Cache API，首页 5min）
- ✅ R2 图片缓存（1年）
- ✅ 冷启动优化（Promise 缓存避免重复初始化）
- ✅ 压缩支持（后台可开关，Cloudflare 自动处理）

## 技术栈

- **运行时**: Cloudflare Workers (ES Modules)
- **数据库**: Cloudflare D1
- **对象存储**: Cloudflare R2（可选）
- **前端**: 原生 HTML + Vue 3（后台管理）
- **Markdown**: marked.js + highlight.js
- **部署**: GitHub → Cloudflare Workers 自动部署

## 项目结构

```
src/
├── worker.js              # 主入口（路由、全站密码、robots.txt、favicon.ico）
├── api.js                 # API 处理（分页、缓存、输入验证、速率限制、密码认证）
├── lib/
│   ├── utils.js           # 工具函数（JSON 响应、HTML 转义、CORS 多域名）
│   ├── db.js              # 数据库初始化（索引、批量操作、设置读写）
│   ├── auth.js            # HMAC-SHA256 认证（48h 过期）
│   ├── cache.js           # Workers Cache API
│   └── image.js           # 图片处理（R2 上传、2MB 限制、类型验证）
└── views/
    ├── frontend.js        # 前台首页（SEO、分页、搜索、响应式）
    ├── post.js            # 文章详情页（Markdown、代码高亮、灯箱、SEO）
    ├── password.js        # 密码验证页（API 认证、速率限制）
    └── admin.js           # 后台管理页（Vue 3、响应式）
wrangler.toml              # Cloudflare 配置
```

## 部署步骤（GitHub 自动部署）

### 1. 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **D1**
3. 点击 **Create database**，名称输入 `blog-db`
4. 复制 **Database ID**

### 2. 创建 R2 存储桶（可选）

1. 进入 **Workers & Pages** → **R2**
2. 点击 **Create bucket**，名称输入 `blog-images`

### 3. 修改 wrangler.toml

编辑 `wrangler.toml`，填入你的 D1 Database ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "blog-db"
database_id = "你的-D1-Database-ID"
```

### 4. 推送到 GitHub

```bash
git init
git add .
git commit -m "Init blog"
git remote add origin https://github.com/你的用户名/cloudflare-light-blog.git
git push -u origin main
```

### 5. 连接 Cloudflare Workers

1. Cloudflare Dashboard → **Workers & Pages** → **Create Application**
2. 选择 **Workers** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 在构建配置中填写：

| 配置项 | 填写内容 |
|--------|---------|
| **生产分支** | `main` |
| **构建命令** | （留空） |
| **部署命令** | `npx wrangler deploy` |

5. 点击保存，Cloudflare 会自动读取 `wrangler.toml` 配置并部署

### 6. 设置环境变量

部署完成后，在 Worker 的 **Settings → Variables and Secrets** 中添加：

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `ADMIN_PASSWORD` | **Secret** | 管理员密码 |

> ⚠️ `ADMIN_PASSWORD` 请使用 **Secret** 类型，确保密码加密存储。
> CORS 来源、全站密码等配置在后台网站设置中管理，无需在此设置。

### 7. 后续更新

每次推送到 GitHub `main` 分支，Cloudflare 会自动重新部署：

```bash
git add .
git commit -m "Update"
git push
```

## 访问地址

| 页面 | 路径 |
|------|------|
| 前台首页 | `https://你的域名/` |
| 后台管理 | `https://你的域名/admin/` |
| 站点地图 | `https://你的域名/sitemap.xml` |
| robots.txt | `https://你的域名/robots.txt` |
| 健康检查 | `https://你的域名/api/health` |

## API 接口

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/posts?page=1&limit=10&category=slug` | 文章列表（分页） |
| GET | `/api/post/?slug=xxx` | 文章详情 |
| GET | `/api/categories` | 分类列表 |
| GET | `/api/settings` | 网站设置 |
| GET | `/api/stats` | 统计信息 |
| GET | `/api/links` | 友链列表 |
| GET | `/api/health` | 健康检查 |
| GET | `/sitemap.xml` | 站点地图 |
| POST | `/api/site-auth` | 全站密码认证 |
| POST | `/api/post-auth` | 文章密码认证 |

### 管理接口（需要 Bearer Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/login` | 登录获取 Token（5次/10分钟限制） |
| GET | `/api/admin/posts` | 所有文章（含草稿） |
| POST | `/api/admin/post` | 创建文章 |
| PUT | `/api/admin/post?id=x` | 更新文章 |
| DELETE | `/api/admin/post?id=x` | 删除文章（移至回收站） |
| GET | `/api/admin/trash` | 回收站列表 |
| POST | `/api/admin/restore` | 恢复文章 |
| POST | `/api/admin/permanent-delete` | 彻底删除 |
| POST | `/api/category` | 创建/更新分类 |
| DELETE | `/api/category?id=x` | 删除分类 |
| POST | `/api/upload` | 上传图片（2MB 限制） |
| POST | `/api/settings` | 保存设置 |
| POST | `/api/links` | 保存友链 |

## 后台设置说明

### 个人设置
- 个人名称、头像（上传或外链）
- 个人简介
- 建站时间（默认 2020-02-02）
- 友链标题（默认"友链"）
- 友链内容（名称,地址 每行一个）

### 网站设置
- 网站标题 / 副标题
- 网站图标（上传或外链）
- 主题风格（动物森林 / 海洋微风）
- 网站页脚（支持 HTML）
- 自定义 JS
- 全站密码（可选，留空不启用）
- CORS 允许来源（多域名逗号分隔，* 表示全部）
- 功能开关：允许搜索引擎爬取 / 启用压缩

## License

MIT
