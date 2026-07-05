# cloudflare-light-blog

基于 Cloudflare Workers + D1 + R2 构建的轻量级博客系统。

## 更新日志

### v1.1.0 (2026-07-05)

#### 新增功能
- **标签云模块**：前台新增标签云展示，自动聚合所有无密码文章的标签，字体随机大小，支持点击标签筛选文章
- **模块位置开关**：个人简介和标签云模块支持居左/居右位置切换
- **图标静态化**：后台管理、前台首页、文章详情页的图标统一改为静态资源（public/icon/），替换对应文件即可自定义图标
- **图片删除增强**：文章管理中删除封面图片时增加二次确认弹框，可选择是否同时删除存储桶中的图片资源
- **导入文章**：支持导入 WordPress XML 文件（WXR 格式），批量导入文章、分类、标签及状态信息
- **置顶文章**：在网站设置中配置置顶文章编号，置顶文章在首页首位展示并添加金色边框和📌置顶标识
- **后台美化**：后台导航栏图标优化，选中项使用 navigate.png 指示器，管理后台标题和退出登录按钮分别添加 home.png、logout.png 图标

#### 默认值优化
- 标签云模块默认开启
- 个人简介和标签云模块默认居左显示

#### 新增设置项
| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 标签云开关 | 控制是否显示标签云模块 | 开启 |
| 个人简介位置 | 居左 / 居右 | 居左 |
| 标签云位置 | 居左 / 居右 | 居左 |
| 置顶文章ID | 置顶显示的文章编号，留空表示不置顶 | 空 |

### v1.0.0

初始版本发布

---

## 预览图
<table>
  <tr>
    <td><div align="center"><img src="https://tvax2.sinaimg.cn/large/78f38e4bgy1idtpne8ezsj21d10y5amt.jpg" width=99% referrerpolicy="no-referrer" /></div></td>
    <td><div align="center"><img src="https://tvax1.sinaimg.cn/large/78f38e4bgy1idtpnefku6j219i0z2h2d.jpg" width=99% referrerpolicy="no-referrer" /></div></td>
  </tr>
</table>

## 功能特性

### 前台
- ✅ 文章列表（分页、分类筛选、搜索标题和标签）
- ✅ 文章详情页（Markdown 渲染、代码高亮、代码复制按钮、折叠框、引用样式）
- ✅ 图片灯箱（上一张/下一张导航、键盘操作、图片计数器）
- ✅ 侧边栏（个人简介、文章/分类/标签统计、建站时间/最后更新、分类列表、自定义友链）
- ✅ 标签云模块（自动聚合标签、随机字体大小、点击筛选文章）
- ✅ 密码保护文章（HKDF 密钥派生、HMAC 签名、24小时有效期、5次/1小时速率限制）
- ✅ 全站密码保护（可选、Cookie 24小时有效期、5次/1小时速率限制）
- ✅ 搜索栏（实时搜索文章标题和标签）
- ✅ 便签贴纸风格标签
- ✅ 响应式布局（手机端 / 平板端 / 桌面端）
- ✅ 文章置顶（在网站设置中配置置顶文章编号，置顶文章首位显示，带金色边框和📌置顶标识）

### 后台管理
- ✅ 文章管理（表格布局、分页、内联新建/编辑、封面图上传+外链、Markdown 编辑器工具栏、标签列展示）
- ✅ 分类管理（表格布局、增删改）
- ✅ 回收站（表格布局、恢复/彻底删除）
- ✅ 个人设置（头像、简介、建站时间、友链标题/内容、图标配置、模块位置开关）
- ✅ 网站设置（标题、图标、主题、页脚、自定义JS、全站密码、CORS 来源、功能开关）
- ✅ 主题切换（动物森林 / 海洋微风）
- ✅ 图片上传（支持上传 + 外链，限制 2MB，类型验证）
- ✅ 图片删除二次确认（可选择是否删除存储桶资源）
- ✅ Markdown 编辑器（标题、加粗、斜体、链接、图片、代码、列表、引用、分割线、折叠框）
- ✅ 页面刷新保持当前导航页
- ✅ 响应式布局（手机端 / 平板端 / 桌面端）
- ✅ 文章导入（支持 WordPress XML 格式，批量导入文章、分类、标签）
- ✅ 网站设置中配置置顶文章编号（置顶文章首位显示，带金色边框和📌标识）

### 安全
- ✅ HMAC-SHA256 管理员认证（48小时过期）
- ✅ HKDF 密钥派生（从密码派生 32 字节安全密钥，不直接使用密码原文）
- ✅ 恒定时间比较（timingSafeEqual，防止时序攻击）
- ✅ 密码哈希存储（文章密码使用 HMAC-SHA256 哈希，数据库不存明文）
- ✅ 全站密码保护（HKDF 派生 Cookie 密钥、24小时过期）
- ✅ 登录速率限制（5次/10分钟）
- ✅ 密码速率限制（全站密码 + 文章密码，5次/1小时）
- ✅ XSS 防护（Markdown 内容转义、sanitizeMarkdown）
- ✅ SQL 注入防护（参数化查询、表名白名单验证）
- ✅ 文件上传限制（2MB、MIME 类型验证、文件名正则校验）
- ✅ 错误信息隐藏（仅记录截断的错误摘要到服务器日志）
- ✅ CORS 可配置来源（支持多域名逗号分隔，后台设置）
- ✅ HTTP 安全头（X-Content-Type-Options、X-Frame-Options、Referrer-Policy、HSTS）
- ✅ Cookie 安全属性（HttpOnly、SameSite=Lax、Max-Age）

### SEO
- ✅ meta 标签（description、robots）
- ✅ Open Graph 标签（og:title、og:description、og:image）
- ✅ JSON-LD 结构化数据（BlogPosting）
- ✅ canonical URL
- ✅ sitemap.xml 自动生成
- ✅ robots.txt（后台可开关）
- ✅ 图片懒加载（loading="lazy"）

### 性能
- ✅ 数据库索引（status、created_at、slug、category）
- ✅ API 缓存（文章列表 60s、分类 300s、统计 60s）
- ✅ 前台页面缓存（Cache API，首页 5min）
- ✅ R2 图片缓存（1年）
- ✅ 冷启动优化（Promise 缓存避免重复初始化）
- ✅ 压缩支持（后台可开关，Cloudflare 自动处理）

## 技术栈

- **运行时**: Cloudflare Workers (ES Modules, compatibility_date: 2025-05-01)
- **数据库**: Cloudflare D1
- **对象存储**: Cloudflare R2（可选）
- **前端**: 原生 HTML + Vue 3（后台管理）
- **Markdown**: marked.js + highlight.js
- **部署**: GitHub → Cloudflare Workers 自动部署

## 项目结构

```
src/
├── worker.js              # 主入口（路由、全站密码验证、robots.txt、favicon.ico）
├── api.js                 # API 处理（分页、缓存、输入验证、速率限制、密码认证、Cookie 生成）
├── lib/
│   ├── utils.js           # 工具函数（JSON/HTML 响应、CORS 多域名、HTTP 安全头）
│   ├── db.js              # 数据库初始化（索引、表名白名单、设置读写）
│   ├── auth.js            # 认证模块（HKDF 密钥派生、HMAC-SHA256、恒定时间比较、密码哈希）
│   ├── cache.js           # Workers Cache API
│   └── image.js           # 图片处理（R2 上传、2MB 限制、MIME 验证、文件名校验）
└── views/
    ├── frontend.js        # 前台首页（SEO、分页、搜索、响应式）
    ├── post.js            # 文章详情页（Markdown、代码高亮、灯箱、SEO、懒加载）
    ├── password.js        # 密码验证页（API 认证、速率限制）
    └── admin.js           # 后台管理页（Vue 3、响应式、SRI）
public/icon/               # 静态图标资源（随项目部署）
wrangler.toml              # Cloudflare 配置
```

### 图标资源说明

`public/icon/` 目录下的图片文件用途如下：

| 文件名 | 用途 |
|--------|------|
| `home.png` | 后台管理标题前置图标 |
| `navigate.png` | 导航栏选中项指示器 |
| `logout.png` | 退出登录按钮前置图标 |
| `profile.png` | 个人头像 |
| `favicon.ico` | 网站图标 |
| `category.png` | 分类标题图标 |
| `friend-links.png` | 友链标题图标 |

> 替换对应的图片文件即可自定义图标，无需修改代码。

## 部署步骤

### 1. 获取项目代码（二选一）

**方式一：Fork 仓库（推荐）**

1. 在 GitHub 上 Fork 本仓库到你的账号
2. 后续可同步上游更新

**方式二：克隆到新仓库**

```bash
git clone https://github.com/你的用户名/cloudflare-light-blog.git
cd cloudflare-light-blog
# 如需推送到自己的仓库
git remote set-url origin https://github.com/你的用户名/cloudflare-light-blog.git
git push -u origin main
```

### 2. 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **D1**
3. 点击 **Create database**，名称输入 `blog-db`
4. 复制 **Database ID**

### 3. 配置 D1 数据库绑定（三选一）

**方式一：修改 wrangler.toml（适合私有仓库）**

编辑 `wrangler.toml`，将 `database_id` 替换为你的 D1 Database ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "blog-db"
database_id = "你的-D1-Database-ID"
```

**方式二：通过 Dashboard 绑定（推荐，无需修改代码）**

1. 进入 Cloudflare Dashboard → **Workers & Pages** → 你的 Worker
2. 点击 **Settings** → **Bindings** → **Add**
3. 选择 **D1 Database**，变量名填 `DB`，选择你创建的 `blog-db` 数据库
4. 保存后重新部署

> 💡 Dashboard 绑定优先级高于 `wrangler.toml`，两者会自动合并。此方式无需在代码中写入 Database ID。

**方式三：使用环境变量（仅限本地 Wrangler CLI 部署）**

在 `wrangler.toml` 中使用 `database_id = "${DB_ID}"`，本地部署前设置环境变量：

```bash
export DB_ID="你的-D1-Database-ID"
npx wrangler deploy
```

> ⚠️ 此方式仅适用于本地 CLI 部署，GitHub 自动部署不支持环境变量替换。

### 4. 创建 R2 存储桶（可选）

R2 存储桶用于存储文章封面图片等静态资源。

| 绑定 R2 | 不绑定 R2 |
|---------|----------|
| 图片上传到 R2 存储，通过 `/images/xxx` 路径访问 | 图片以 base64 格式内嵌在文章中 |
| 图片独立存储，不占用 Worker 响应体积 | 图片数据随文章内容返回，增加响应体积 |
| 支持长期缓存（1年），加载更快 | 每次请求都传输图片数据 |
| 适合有大量图片的博客 | 适合少量图片或纯文字博客 |

如需绑定 R2：

1. 进入 **Workers & Pages** → **R2**
2. 点击 **Create bucket**，名称输入 `blog-images`
3. `wrangler.toml` 中已预配置 R2 绑定，无需额外修改

### 5. 连接 Cloudflare Workers

1. Cloudflare Dashboard → **Workers & Pages** → **Create Application**
2. 选择 **Workers** → **Connect to Git**
3. 选择你的 GitHub 仓库（Fork 的仓库或自己的仓库）
4. 在构建配置中填写：

| 配置项 | 填写内容 |
|--------|--------|
| **生产分支** | `main` |
| **构建命令** | （留空） |
| **部署命令** | `npx wrangler deploy` |

5. 点击保存，Cloudflare 会自动读取 `wrangler.toml` 配置并部署

### 6. 设置环境变量

部署完成后，在 Worker 的 **Settings → Variables and Secrets** 中添加：

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `ADMIN_USERNAME` | **Secret** | 管理员账号 |
| `ADMIN_PASSWORD` | **Secret** | 管理员密码 |

> ⚠️ `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 请使用 **Secret** 类型，确保凭据加密存储。
> CORS 来源、全站密码等配置在后台网站设置中管理，无需在此设置。

> 📌 **凭据重置提示：** 若遗忘管理员账号或密码，可前往 Cloudflare Dashboard → Workers & Pages → 你的 Worker → Settings → Variables and Secrets，重新设置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 的值，保存后触发重新部署即可生效。无需修改代码或推送仓库。

### 7. 后续更新

**Fork 用户：** 在 GitHub 上点击 **Sync fork** 同步上游更新，Cloudflare 会自动重新部署。

**自有仓库用户：** 推送到 `main` 分支即可自动部署：

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
| favicon | `https://你的域名/favicon.ico` |
| 健康检查 | `https://你的域名/api/health` |

## 后台设置说明

### 个人设置

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 个人名称 | 侧边栏显示的作者名 | 空 |
| 个人头像 | 支持 emoji/图片外链/图片上传 | 空 |
| 个人简介 | 侧边栏简介文字 | 空 |
| 建站时间 | 侧边栏显示的建站日期 | 2020-02-02 |
| 友链标题 | 侧边栏友链模块标题 | 友链 |
| 友链内容 | 名称,地址 每行一个 | 空 |
| 分类标题图标 | 支持 emoji/图片外链/图片上传 | 📂 |
| 友链标题图标 | 支持 emoji/图片外链/图片上传 | 🔗 |
| 标签云开关 | 控制是否显示标签云模块 | 显示 |
| 个人简介位置 | 居左 / 居右 | 居左 |
| 标签云位置 | 居左 / 居右 | 居左 |

### 网站设置

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 网站标题 | 浏览器标题栏和侧边栏 | 我的博客 |
| 网站副标题 | 首页描述文字 | 空 |
| 网站图标 | 支持 emoji/图片外链/图片上传 | 空 |
| 主题风格 | 动物森林 / 海洋微风 | 动物森林 |
| 网站页脚 | 支持 HTML | © 2026 我的博客 |
| 自定义 JS | 注入到页面的自定义脚本 | 空 |
| 全站密码 | 留空则不启用，访问任何页面需输入密码 | 空 |
| CORS 允许来源 | 多域名逗号分隔，* 表示全部 | * |
| 允许搜索引擎爬取 | 控制 robots.txt 是否允许爬取 | 开启 |
| 启用压缩 | 控制 Cloudflare 自动压缩 | 开启 |
| 置顶文章ID | 置顶显示的文章编号，留空表示不置顶 | 空 |

## API 接口

<details>
<summary>点击展开 API 接口文档</summary>

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/posts?page=1&limit=10&category=slug` | 文章列表（分页） |
| GET | `/api/post/?slug=xxx` | 文章详情 |
| GET | `/api/categories` | 分类列表 |
| GET | `/api/settings` | 网站设置 |
| GET | `/api/stats` | 统计信息（文章数、分类数、标签数、最新更新日期） |
| GET | `/api/links` | 友链列表 |
| GET | `/api/health` | 健康检查（数据库连接状态） |
| GET | `/sitemap.xml` | 站点地图 |
| POST | `/api/site-auth` | 全站密码认证（返回 HttpOnly Cookie） |
| POST | `/api/post-auth` | 文章密码认证（返回 HttpOnly Cookie） |

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
| POST | `/api/delete-image` | 删除存储桶图片（需传入图片路径） |
| POST | `/api/settings` | 保存设置 |
| POST | `/api/links` | 保存友链 |
| POST | `/api/admin/import-wordpress` | 导入 WordPress XML 文件 |

</details>

## License

MIT
