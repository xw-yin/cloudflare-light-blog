# cloudflare-light-blog

基于 Cloudflare Workers + D1 + R2 构建的轻量级博客系统。

## 功能特性

- ✅ 文章管理（后台发布/编辑/删除）
- ✅ 文章分类
- ✅ 文章封面图片（支持 R2 对象存储）
- ✅ 前台文章列表和详情页
- ✅ 浏览次数统计
- ✅ 自动数据库初始化（D1）
- ✅ 管理员密码保护

## 技术栈

- **运行时**: Cloudflare Workers
- **数据库**: Cloudflare D1
- **对象存储**: Cloudflare R2（可选）
- **前端**: 原生 HTML + Vue 3

## 部署步骤

### 1. 克隆项目

```bash
git clone https://github.com/your-username/cloudflare-light-blog.git
cd cloudflare-light-blog
npm install
```

### 2. 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **D1**
3. 点击 **Create database**
4. 输入名称 `blog-db`，点击 Create
5. 点击数据库进入详情页，复制 **Database ID**

### 3. 创建 R2 存储桶（可选）

1. 进入 **Workers & Pages** → **R2**
2. 点击 **Create bucket**
3. 输入名称 `blog-images`，点击 Create

### 4. 修改 wrangler.toml

编辑 `wrangler.toml`，填入你的 D1 Database ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "blog-db"
database_id = "你的-D1-Database-ID"  # 替换为你的 ID

# 如果使用 R2，取消注释：
# [[r2_buckets]]
# binding = "R2"
# bucket_name = "blog-images"
```

### 5. 设置环境变量

在 Worker 的 **Settings → Variables** 中添加：

| 变量名 | 说明 |
|--------|------|
| ADMIN_PASSWORD | 管理员密码 |

### 6. 部署

```bash
# 本地测试
npm run dev

# 推送到 GitHub（会自动部署）
git add .
git commit -m "Init"
git push origin main
```

## GitHub 部署说明

### 绑定 GitHub 仓库

1. Cloudflare Dashboard → Workers & Pages → Create Application
2. 选择 **Workers** → **Connect to Git**
3. 选择你的仓库

### 配置部署

在 GitHub 仓库的 Settings 中配置：

1. **Build settings**:
   - Build command: （留空）
   - Build output directory: （留空）
   - Deploy command: `npx wrangler deploy`

2. **环境变量**（可选，用于 CI/CD）:
   - `D1_DATABASE_ID`: 你的 D1 数据库 ID

### 为什么 wrangler.toml 需要配置绑定？

每次从 GitHub 部署时，Cloudflare 会使用 `wrangler.toml` 中的配置来更新 Worker。必须在配置文件中声明 D1 和 R2 绑定，部署后绑定才不会丢失。

## 访问

- 前台: `https://你的域名/`
- 后台: `https://你的域名/admin/`

## 本地开发

```bash
# 复制环境变量文件
cp .dev.vars.example .dev.vars

# 编辑 .dev.vars 填入密码

# 启动开发服务器
npm run dev
```

## 注意事项

- 首次部署时会自动创建数据库表（D1）
- 图片上传需要配置 R2 存储（可选，不配置则使用 base64 编码）
- 必须设置 ADMIN_PASSWORD 保护后台安全

## License

MIT