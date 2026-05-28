// ==================== 后台管理页面 ====================

import { escapeHtml } from '../lib/utils.js';

export function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>博客管理后台</title>
  <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Nunito, 'Noto Sans SC', sans-serif; background: var(--body-bg, #f8f8f0); color: var(--text-body, #725d42); }
    .login { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--header-bg, linear-gradient(135deg, #7DC395, #5BAF7A)); }
    .login-box { background: #f7f3df; padding: 40px; border-radius: 20px; width: 100%; max-width: 400px; text-align: center; border: 2px solid #e8e0cc; box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42); }
    .login-box h1 { margin-bottom: 20px; color: #794f27; font-weight: 700; }
    .login-box input { width: 100%; padding: 12px 18px; margin-bottom: 16px; border: 2.5px solid #c4b89e; border-radius: 50px; font-size: 14px; background: #f8f8f0; color: #725d42; box-shadow: 0 3px 0 0 #d4c9b4; outline: none; }
    .login-box input:focus { border-color: #ffcc00; box-shadow: 0 3px 0 0 #e0b800; }
    .login-box button { width: 100%; padding: 14px; background: #19c8b9; color: #fff; border: none; border-radius: 50px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 5px 0 0 #11a89b; }
    .admin-layout { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: var(--sidebar-bg, linear-gradient(180deg, #7DC395, #5BAF7A)); color: #fff; flex-shrink: 0; }
    .sidebar-header { padding: 24px 20px; text-align: center; border-bottom: 2px solid rgba(255,255,255,0.2); }
    .sidebar-header h1 { font-size: 18px; }
    .sidebar-menu { padding: 16px 12px; }
    .sidebar-menu a { display: block; padding: 12px 16px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 12px; font-weight: 600; margin-bottom: 4px; }
    .sidebar-menu a:hover, .sidebar-menu a.active { background: rgba(255,255,255,0.2); color: #fff; }
    .sidebar-footer { padding: 16px 20px; border-top: 2px solid rgba(255,255,255,0.2); }
    .sidebar-footer button { width: 100%; padding: 10px; background: rgba(255,255,255,0.2); color: #fff; border: none; border-radius: 50px; cursor: pointer; }
    .main-content { flex: 1; padding: 30px; }
    .page-header { margin-bottom: 24px; }
    .page-header h2 { color: #794f27; font-size: 1.5em; }
    .btn { padding: 10px 24px; background: var(--btn-bg, #19c8b9); color: #fff; border: none; border-radius: 50px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 0 0 var(--btn-shadow, #11a89b); }
    .btn:hover { transform: translateY(-1px); }
    .btn-danger { background: var(--danger-bg, #e05a5a); box-shadow: 0 4px 0 0 var(--danger-shadow, #c94444); }
    .btn-cancel { background: #f0e8d8; color: #725d42; border: 2px solid #c4b89e; box-shadow: none; }
    .card { background: var(--card-bg, #f7f3df); border-radius: 20px; padding: 24px; box-shadow: 0 4px 10px rgba(107,92,67,0.42); border: 2px solid var(--card-border, #e8e0cc); margin-bottom: 16px; }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #794f27; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 12px 18px; border: 2.5px solid var(--input-border, #c4b89e); border-radius: 50px; font-size: 14px; background-color: #f8f8f0; color: var(--text-body, #725d42); box-shadow: 0 3px 0 0 var(--input-shadow, #d4c9b4); font-weight: 500; }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: #ffcc00; box-shadow: 0 3px 0 0 #e0b800; outline: none; }
    .form-group textarea { border-radius: 18px; min-height: 80px; resize: vertical; }
    .custom-select { position: relative; }
    .custom-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: #f8f8f0;
      border: 2.5px solid #c4b89e;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 3px 0 0 #d4c9b4;
      transition: all 0.25s;
      font-weight: 500;
      color: #725d42;
      min-height: 45px;
    }
    .custom-select-trigger:hover { border-color: #a89878; }
    .custom-select-trigger.active { border-color: #ffcc00; box-shadow: 0 3px 0 0 #e0b800; }
    .custom-select-trigger::after {
      content: '';
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid #725d42;
      transition: transform 0.2s;
    }
    .custom-select-trigger.active::after { transform: rotate(180deg); }
    .custom-select-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #f8f8f0;
      border: 2px solid #c4b89e;
      border-radius: 12px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      box-shadow: 0 8px 24px rgba(107, 92, 67, 0.2);
    }
    .custom-select-dropdown.show { display: block; }
    .custom-select-option {
      padding: 10px 16px;
      cursor: pointer;
      transition: all 0.15s;
      font-weight: 500;
    }
    .custom-select-option:first-child { border-radius: 10px 10px 0 0; }
    .custom-select-option:last-child { border-radius: 0 0 10px 10px; }
    .custom-select-option:hover { background: #e6f9f6; color: #11a89b; }
    .custom-select-option.selected { background: #19c8b9; color: #fff; }
    .custom-select-option.disabled { color: #c4b89e; cursor: default; }
    .custom-select-option.disabled:hover { background: transparent; color: #c4b89e; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .actions { display: flex; gap: 6px; }
    .actions button { padding: 6px 14px; border: none; border-radius: 50px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .actions .edit, .edit { background: #19c8b9; color: #fff; box-shadow: 0 3px 0 0 #11a89b; }
    .actions .edit:hover, .edit:hover { transform: translateY(-1px); box-shadow: 0 4px 0 0 #11a89b; }
    .actions .delete, .delete { background: #e05a5a; color: #fff; box-shadow: 0 3px 0 0 #c94444; }
    .actions .delete:hover, .delete:hover { transform: translateY(-1px); box-shadow: 0 4px 0 0 #c94444; }
    .editor-layout { display: flex; gap: 20px; }
    .editor-main { flex: 7; }
    .editor-side { flex: 3; }
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(107,92,67,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-box { background: #f7f3df; border-radius: 20px; padding: 32px; max-width: 400px; width: 90%; border: 2px solid #e8e0cc; }
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; background: #6fba2c; color: #fff; border-radius: 50px; font-weight: 600; }
    @media (max-width: 768px) {
      .admin-layout { flex-direction: column; }
      .sidebar { 
        width: 100%; 
        flex-direction: row; 
        overflow-x: auto;
        padding: 0;
      }
      .sidebar-header { 
        padding: 12px 16px; 
        white-space: nowrap;
      }
      .sidebar-header h1 { font-size: 16px; }
      .sidebar-menu { 
        display: flex; 
        padding: 8px 12px; 
        gap: 6px; 
        flex-wrap: nowrap;
        overflow-x: auto;
      }
      .sidebar-menu a { 
        white-space: nowrap; 
        padding: 8px 14px; 
        margin: 0; 
        font-size: 13px;
        border-radius: 10px;
      }
      .sidebar-footer { 
        padding: 8px 12px; 
        white-space: nowrap;
      }
      .sidebar-footer button { 
        padding: 8px 16px;
        font-size: 13px;
      }
      .main-content { padding: 16px; }
      .page-header h2 { font-size: 1.3em; }
      .card { padding: 16px; border-radius: 16px; }
      .editor-layout { flex-direction: column; }
      .editor-main, .editor-side { width: 100%; }
      .form-row { grid-template-columns: 1fr; }
      .btn { padding: 10px 20px; font-size: 14px; }
      .custom-select-dropdown { max-height: 150px; }
    }
  </style>
</head>
<body>
  <div id="app">
    <div v-if="!logged" class="login">
      <div class="login-box">
        <h1>博客管理后台</h1>
        <input v-model="password" type="password" placeholder="请输入密码" @keyup.enter="login">
        <button @click="login">登录</button>
      </div>
    </div>
    <div v-else class="admin-layout">
      <nav class="sidebar">
        <div class="sidebar-header"><h1>管理后台</h1></div>
        <div class="sidebar-menu">
          <a href="#" :class="{active:currentPage==='posts'}" @click.prevent="currentPage='posts'">📝 文章管理</a>
          <a href="#" :class="{active:currentPage==='new'}" @click.prevent="openAdd()">✏️ 新建文章</a>
          <a href="#" :class="{active:currentPage==='category'}" @click.prevent="currentPage='category'">📂 分类管理</a>
          <a href="#" :class="{active:currentPage==='trash'}" @click.prevent="currentPage='trash'">🗑️ 回收站</a>
          <a href="#" :class="{active:currentPage==='settings'}" @click.prevent="currentPage='settings'">⚙️ 网站设置</a>
        </div>
        <div class="sidebar-footer"><button @click="logout">退出登录</button></div>
      </nav>
      <div class="main-content">
        <div v-if="currentPage==='posts'">
          <div class="page-header"><h2>文章管理</h2></div>
          <button class="btn" @click="openAdd()" style="margin-bottom:16px">新建文章</button>
          <div class="card" style="padding:0;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f0e8d8">
                  <th style="padding:12px 16px;text-align:left;color:#794f27;font-weight:700;font-size:13px;width:70px;white-space:nowrap">删除</th>
                  <th style="padding:12px 16px;text-align:left;color:#794f27;font-weight:700;font-size:13px;width:70px;white-space:nowrap">编辑</th>
                  <th style="padding:12px 16px;text-align:left;color:#794f27;font-weight:700;font-size:13px">文章标题</th>
                  <th style="padding:12px 16px;text-align:left;color:#794f27;font-weight:700;font-size:13px;width:100px">分类</th>
                  <th style="padding:12px 16px;text-align:center;color:#794f27;font-weight:700;font-size:13px;width:80px">状态</th>
                  <th style="padding:12px 16px;text-align:right;color:#794f27;font-weight:700;font-size:13px;width:120px">发布日期</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="post in posts" :key="post.id">
                  <tr style="border-top:1px solid #e8e0cc">
                    <td style="padding:10px 16px;white-space:nowrap"><button class="delete" @click="deletePost(post.id)" style="padding:5px 14px;border:none;border-radius:50px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap">删除</button></td>
                    <td style="padding:10px 16px;white-space:nowrap"><button class="edit" @click="toggleEdit(post)" style="padding:5px 14px;border:none;border-radius:50px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap">{{editingId===post.id?'收起':'编辑'}}</button></td>
                    <td style="padding:10px 16px;color:#794f27;font-weight:600;font-size:14px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{post.title}}</td>
                    <td style="padding:10px 16px;color:#9f927d;font-size:13px">{{post.category}}</td>
                    <td style="padding:10px 16px;text-align:center;white-space:nowrap"><span :style="{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:post.status==='published'?'#22c55e':'#9f927d',marginRight:'6px',verticalAlign:'middle'}"></span><span style="font-size:13px;color:#725d42;verticalAlign:'middle'">{{post.status==='published'?'已发布':'草稿'}}</span></td>
                    <td style="padding:10px 16px;text-align:right;color:#9f927d;font-size:13px">{{new Date(post.published_at || post.created_at).toLocaleDateString('zh-CN')}}</td>
                  </tr>
                  <tr v-if="editingId===post.id">
                    <td colspan="6" style="padding:20px 16px;background:#faf8f2;border-top:2px solid #e8e0cc">
                      <div class="editor-layout">
                        <div class="editor-main" style="display:flex;flex-direction:column">
                          <div class="form-group"><label>标题</label><input v-model="form.title"></div>
                          <div class="form-group" style="flex:1;display:flex;flex-direction:column">
                            <label>内容</label>
                            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
                              <button type="button" @click="insertMd('heading')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;color:#725d42">标题</button>
                              <button type="button" @click="insertMd('bold')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;color:#725d42">B</button>
                              <button type="button" @click="insertMd('italic')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;font-style:italic;color:#725d42">I</button>
                              <button type="button" @click="insertMd('link')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">🔗</button>
                              <button type="button" @click="insertMd('image')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">🖼</button>
                              <button type="button" @click="insertMd('code')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">代码</button>
                              <button type="button" @click="insertMd('ul')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">•列表</button>
                              <button type="button" @click="insertMd('ol')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">1.序号</button>
                              <button type="button" @click="insertMd('quote')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">❝引用</button>
                              <button type="button" @click="insertMd('hr')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">—分割线</button>
                            </div>
                            <textarea v-model="form.content" style="flex:1;min-height:200px"></textarea>
                          </div>
                          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px"><button class="btn" @click="savePost">保存</button><button class="btn btn-cancel" @click="editingId=null">取消</button></div>
                        </div>
                        <div class="editor-side">
                          <div class="form-group"><label>状态</label>
                            <div class="custom-select" @click.stop>
                              <div class="custom-select-trigger" :class="{active: customSelects['status']}" @click="toggleSelect('status')">{{ form.status === 'draft' ? '草稿' : '已发布' }}</div>
                              <div class="custom-select-dropdown" :class="{show: customSelects['status']}">
                                <div class="custom-select-option" :class="{selected: form.status==='draft'}" @click="selectOption('status', 'draft', 'status')">草稿</div>
                                <div class="custom-select-option" :class="{selected: form.status==='published'}" @click="selectOption('status', 'published', 'status')">已发布</div>
                              </div>
                            </div>
                          </div>
                          <div class="form-group"><label>日期</label><input type="date" v-model="form.published_at"></div>
                          <div class="form-group"><label>分类</label>
                            <div class="custom-select" @click.stop>
                              <div class="custom-select-trigger" :class="{active: customSelects['category']}" @click="toggleSelect('category')">{{ form.category || '请选择' }}</div>
                              <div class="custom-select-dropdown" :class="{show: customSelects['category']}">
                                <div class="custom-select-option" @click="selectOption('category', '', 'category')">请选择</div>
                                <div v-for="cat in categories" :key="cat.id" class="custom-select-option" :class="{selected: form.category===cat.name}" @click="selectOption('category', cat.name, 'category')">{{ cat.name }}</div>
                              </div>
                            </div>
                          </div>
                          <div class="form-group"><label>标签</label><input v-model="form.tags" placeholder="用英文逗号隔开"></div>
                          <div class="form-group"><label>密码（可选）</label><input v-model="form.password" type="password" placeholder="留空无需密码"></div>
                          <div class="form-group">
                            <label>封面图片</label>
                            <div class="cover-upload" @click="$refs.editFileInput.click()" @dragover.prevent @drop.prevent="handleDrop" style="padding:16px;border:2px dashed #c4b89e;border-radius:12px;background:#f0e8d8">
                              <input ref="editFileInput" type="file" @change="handleCoverChange" accept="image/*" style="display:none">
                              <div v-if="!coverPreview"><p style="color:#9f927d;font-size:13px">点击或拖拽上传</p></div>
                              <img v-else :src="coverPreview" style="max-width:100%;border-radius:8px">
                            </div>
                            <div v-if="coverPreview" style="display:flex;gap:6px;margin-top:6px">
                              <button @click="$refs.editFileInput.click()" style="flex:1;padding:8px 16px;background:#19c8b9;color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 3px 0 0 #11a89b">更换</button>
                              <button @click="deleteCover" style="flex:1;padding:8px 16px;background:#e05a5a;color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 3px 0 0 #c94444">删除</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="currentPage==='new'">
          <div class="page-header"><h2>{{editingId?'编辑文章':'新建文章'}}</h2></div>
          <button class="btn btn-cancel" @click="currentPage='posts';editingId=null" style="margin-bottom:16px">返回列表</button>
          <div class="editor-layout">
            <div class="editor-main"><div class="card" style="display:flex;flex-direction:column;height:100%">
              <div class="form-group"><label>标题</label><input v-model="form.title"></div>
              <div class="form-group" style="flex:1;display:flex;flex-direction:column">
                <label>内容</label>
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
                  <button type="button" @click="insertMd('heading')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;color:#725d42">标题</button>
                  <button type="button" @click="insertMd('bold')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;color:#725d42">B</button>
                  <button type="button" @click="insertMd('italic')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;font-style:italic;color:#725d42">I</button>
                  <button type="button" @click="insertMd('link')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">🔗</button>
                  <button type="button" @click="insertMd('image')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">🖼</button>
                  <button type="button" @click="insertMd('code')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">代码</button>
                  <button type="button" @click="insertMd('ul')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">•列表</button>
                  <button type="button" @click="insertMd('ol')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">1.序号</button>
                  <button type="button" @click="insertMd('quote')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">❝引用</button>
                  <button type="button" @click="insertMd('hr')" style="padding:4px 10px;background:#f0e8d8;border:2px solid #c4b89e;border-radius:6px;cursor:pointer;font-size:12px;color:#725d42">—分割线</button>
                </div>
                <textarea v-model="form.content" style="flex:1;min-height:300px"></textarea>
              </div>
              <button class="btn" @click="savePost" style="width:100%;margin-top:16px">保存文章</button>
            </div></div>
            <div class="editor-side"><div class="card">
              <div class="form-group"><label>状态</label>
                <div class="custom-select" @click.stop>
                  <div class="custom-select-trigger" :class="{active: customSelects['status']}" @click="toggleSelect('status')">{{ form.status === 'draft' ? '草稿' : '已发布' }}</div>
                  <div class="custom-select-dropdown" :class="{show: customSelects['status']}">
                    <div class="custom-select-option" :class="{selected: form.status==='draft'}" @click="selectOption('status', 'draft', 'status')">草稿</div>
                    <div class="custom-select-option" :class="{selected: form.status==='published'}" @click="selectOption('status', 'published', 'status')">已发布</div>
                  </div>
                </div>
              </div>
              <div class="form-group"><label>日期</label><input type="date" v-model="form.published_at"></div>
              <div class="form-group"><label>分类</label>
                <div class="custom-select" @click.stop>
                  <div class="custom-select-trigger" :class="{active: customSelects['category']}" @click="toggleSelect('category')">{{ form.category || '请选择' }}</div>
                  <div class="custom-select-dropdown" :class="{show: customSelects['category']}">
                    <div class="custom-select-option" @click="selectOption('category', '', 'category')">请选择</div>
                    <div v-for="cat in categories" :key="cat.id" class="custom-select-option" :class="{selected: form.category===cat.name}" @click="selectOption('category', cat.name, 'category')">{{ cat.name }}</div>
                  </div>
                </div>
              </div>
              <div class="form-group"><label>标签</label><input v-model="form.tags" placeholder="用英文逗号隔开，如：标签1,标签2"></div>
              <div class="form-group"><label>密码（可选）</label><input v-model="form.password" type="password" placeholder="留空则无需密码"></div>
              <div class="form-group">
                <label>封面图片</label>
                <div class="cover-upload" @click="$refs.newFileInput.click()" @dragover.prevent @drop.prevent="handleDrop" style="padding:16px;border:2px dashed #c4b89e;border-radius:12px;background:#f0e8d8">
                  <input ref="newFileInput" type="file" @change="handleCoverChange" accept="image/*" style="display:none">
                  <div v-if="!coverPreview"><p style="color:#9f927d;font-size:13px">点击或拖拽上传</p></div>
                  <img v-else :src="coverPreview" style="max-width:100%;border-radius:8px">
                </div>
                <div v-if="coverPreview" style="display:flex;gap:6px;margin-top:6px">
                  <button @click="$refs.newFileInput.click()" style="flex:1;padding:8px 16px;background:#19c8b9;color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 3px 0 0 #11a89b">更换</button>
                  <button @click="deleteCover" style="flex:1;padding:8px 16px;background:#e05a5a;color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 3px 0 0 #c94444">删除</button>
                </div>
              </div>
            </div></div>
          </div>
        </div>
        <div v-if="currentPage==='category'">
          <div class="page-header"><h2>分类管理</h2></div>
          <button class="btn" @click="editingCategory='new';categoryForm={name:'',slug:'',description:''}" style="margin-bottom:16px">添加分类</button>
          <div v-if="editingCategory==='new'" class="card">
            <h3 style="margin-bottom:16px;color:#794f27">添加分类</h3>
            <div class="form-row">
              <div class="form-group"><label>英文ID</label><input v-model="categoryForm.slug"></div>
              <div class="form-group"><label>中文名称</label><input v-model="categoryForm.name"></div>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" @click="saveCategory">保存</button><button class="btn btn-cancel" @click="editingCategory=null">取消</button></div>
          </div>
          <div v-for="cat in categories" :key="cat.id" class="card">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="actions"><button class="delete" @click="deleteCategory(cat.id)">删除</button><button class="edit" @click="editingCategory===cat.id?editingCategory=null:editCategory(cat)">{{editingCategory===cat.id?'收起':'编辑'}}</button></div>
              <div style="flex:1"><span style="font-weight:600;color:#794f27">{{cat.name}}</span><span style="color:#9f927d;margin-left:8px">/{{cat.slug}}</span></div>
            </div>
            <div v-if="editingCategory===cat.id" style="margin-top:16px;padding-top:16px;border-top:2px solid #e8e0cc">
              <div class="form-row">
                <div class="form-group"><label>英文ID</label><input v-model="categoryForm.slug"></div>
                <div class="form-group"><label>中文名称</label><input v-model="categoryForm.name"></div>
              </div>
              <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" @click="saveCategory">保存</button><button class="btn btn-cancel" @click="editingCategory=null">取消</button></div>
            </div>
          </div>
        </div>

        <div v-if="currentPage==='trash'">
          <div class="page-header"><h2>回收站</h2></div>
          <div v-if="trashPosts.length===0" class="card" style="text-align:center;color:#9f927d">回收站是空的</div>
          <div v-for="post in trashPosts" :key="post.id" class="card">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="actions"><button class="btn" @click="restorePost(post.id)" style="padding:6px 14px;font-size:13px">恢复</button><button class="btn btn-danger" @click="permanentDelete(post.id)" style="padding:6px 14px;font-size:13px">彻底删除</button></div>
              <h3 style="flex:1;color:#794f27">{{post.title}}</h3>
            </div>
          </div>
        </div>
        <div v-if="currentPage==='settings'">
          <div class="page-header"><h2>网站设置</h2></div>
          <div class="editor-layout">
            <div class="editor-main">
              <div class="card">
                <h3 style="color:#794f27;margin-bottom:16px">网站设置</h3>
                <div class="form-group"><label>网站标题</label><input v-model="settingsForm.site_name"></div>
                <div class="form-group"><label>网站副标题</label><input v-model="settingsForm.site_description"></div>
                <div class="form-group">
                  <label>网站图标（建议ICO格式）</label>
                  <div style="display:flex;gap:12px">
                    <div class="cover-upload" @click="$refs.faviconInput.click()" @dragover.prevent @drop.prevent="handleFaviconDrop" style="width:120px;padding:16px;border:2px dashed #c4b89e;border-radius:12px;background:#f0e8d8;min-height:80px;display:flex;align-items:center;justify-content:center">
                      <input ref="faviconInput" type="file" @change="handleFavicon" accept=".ico,image/*" style="display:none">
                      <div v-if="!settingsForm.site_favicon"><p style="color:#9f927d;font-size:13px">点击或拖拽上传</p></div>
                      <img v-else :src="settingsForm.site_favicon" style="width:40px;height:40px">
                    </div>
                    <div v-if="settingsForm.site_favicon" style="display:flex;flex-direction:column;gap:8px;justify-content:center">
                      <button @click="$refs.faviconInput.click()" style="padding:8px 16px;background:#19c8b9;color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 3px 0 0 #11a89b;white-space:nowrap">更换</button>
                      <button @click="settingsForm.site_favicon=''" style="padding:8px 16px;background:#e05a5a;color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 3px 0 0 #c94444;white-space:nowrap">删除</button>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label>主题风格</label>
                  <div class="custom-select" @click.stop>
                    <div class="custom-select-trigger" :class="{active: customSelects['theme']}" @click="toggleSelect('theme')">{{ settingsForm.site_theme === 'animal-forest' ? '🌲 动物森林' : '🌊 海洋微风' }}</div>
                    <div class="custom-select-dropdown" :class="{show: customSelects['theme']}">
                      <div class="custom-select-option" :class="{selected: settingsForm.site_theme==='animal-forest'}" @click="selectOption('theme', 'animal-forest', 'theme');applyTheme()">🌲 动物森林</div>
                      <div class="custom-select-option" :class="{selected: settingsForm.site_theme==='ocean-breeze'}" @click="selectOption('theme', 'ocean-breeze', 'theme');applyTheme()">🌊 海洋微风</div>
                    </div>
                  </div>
                  <p style="font-size:12px;color:#9f927d;margin-top:4px">选择不同的主题风格，也可自行开发新主题</p>
                </div>
                <div class="form-group"><label>网站页脚（HTML）</label><textarea v-model="settingsForm.site_footer" rows="3"></textarea></div>
                <div class="form-group"><label>自定义JS</label><textarea v-model="settingsForm.custom_js" rows="4"></textarea></div>
              </div>
            </div>
            <div class="editor-side">
              <div class="card">
                <h3 style="color:#794f27;margin-bottom:16px">个人设置</h3>
                <div class="form-group"><label>个人名称</label><input v-model="settingsForm.site_author"></div>
                <div class="form-group">
                  <label>个人头像</label>
                  <div style="display:flex;gap:12px">
                    <div class="cover-upload" @click="$refs.avatarInput.click()" @dragover.prevent @drop.prevent="handleAvatarDrop" style="width:120px;padding:16px;border:2px dashed #c4b89e;border-radius:12px;background:#f0e8d8;min-height:100px;display:flex;align-items:center;justify-content:center">
                      <input ref="avatarInput" type="file" @change="handleAvatar" accept="image/*" style="display:none">
                      <div v-if="!settingsForm.site_avatar"><p style="color:#9f927d;font-size:13px">点击或拖拽上传</p></div>
                      <img v-else :src="settingsForm.site_avatar" style="width:64px;height:64px;border-radius:50%">
                    </div>
                    <div v-if="settingsForm.site_avatar" style="display:flex;flex-direction:column;gap:8px;justify-content:center">
                      <button @click="$refs.avatarInput.click()" style="padding:8px 16px;background:#19c8b9;color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 3px 0 0 #11a89b;white-space:nowrap">更换</button>
                      <button @click="settingsForm.site_avatar=''" style="padding:8px 16px;background:#e05a5a;color:#fff;border:none;border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 3px 0 0 #c94444;white-space:nowrap">删除</button>
                    </div>
                  </div>
                </div>
                <div class="form-group"><label>个人简介</label><textarea v-model="settingsForm.site_bio" rows="3"></textarea></div>
                <div class="form-group"><label>友链（名称,地址 每行一个）</label><textarea v-model="settingsForm.site_links" rows="4"></textarea></div>
                <button class="btn" @click="saveSettings" style="width:100%;margin-top:16px">保存所有设置</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="confirmModal.show" class="modal" @click.self="confirmModal.show=false">
        <div class="modal-box">
          <h3 style="color:#794f27;margin-bottom:12px">{{confirmModal.title}}</h3>
          <p style="margin-bottom:24px">{{confirmModal.message}}</p>
          <div style="display:flex;gap:12px;justify-content:center">
            <button class="btn btn-cancel" @click="confirmModal.show=false">取消</button>
            <button class="btn" @click="confirmModal.onConfirm()">确认</button>
          </div>
        </div>
      </div>
      <div v-if="toast" class="toast">{{toast}}</div>
    </div>
  </div>
  <script>
    const { createApp, ref, onMounted } = Vue;
    createApp({
      setup() {
        const logged = ref(false);
        const password = ref('');
        const posts = ref([]);
        const editingId = ref(null);
        const form = ref({ title: '', content: '', category: '', tags: '', status: 'draft', cover_image: '', password: '', published_at: new Date().toISOString().split('T')[0] });
        const coverPreview = ref('');
        const toast = ref('');
        const categories = ref([]);
        const currentPage = ref('posts');
        const settingsForm = ref({ site_name: '', site_description: '', site_favicon: '', site_avatar: '', site_bio: '', site_links: '', site_author: '', site_footer: '', custom_js: '', site_theme: 'animal-forest' });
        const categoryForm = ref({ name: '', slug: '', description: '' });
        const editingCategory = ref(null);
        const trashPosts = ref([]);
        const confirmModal = ref({ show: false, title: '', message: '', onConfirm: null });
        const check = () => { const t = localStorage.getItem('token'); if (t) { logged.value = true; loadPosts(); loadCategories(); loadSettings(); loadTrash(); } };
        const api = (url, o = {}) => {
          o.headers = o.headers || {};
          o.headers['Authorization'] = 'Bearer ' + localStorage.getItem('token');
          return axios(url, o).catch(function(e) {
            if (e.response && e.response.status === 401) {
              localStorage.removeItem('token');
              logged.value = false;
            }
            throw e;
          });
        };
        const login = async () => { try { const r = await axios.post('/api/login', { password: password.value }); if (r.data.success) { localStorage.setItem('token', r.data.token); logged.value = true; loadPosts(); loadCategories(); loadSettings(); loadTrash(); } } catch (e) { alert('登录失败'); } };
        const logout = () => { localStorage.removeItem('token'); logged.value = false; };
        const loadPosts = async () => { try { const r = await api('/api/admin/posts'); posts.value = r.data; } catch (e) {} };
        const loadCategories = async () => { try { const r = await api('/api/categories'); categories.value = r.data; } catch (e) {} };
        const loadSettings = async () => { try { const r = await api('/api/settings'); settingsForm.value = { site_name: r.data.site_name || '', site_description: r.data.site_description || '', site_favicon: r.data.site_favicon || '', site_avatar: r.data.site_avatar || '', site_bio: r.data.site_bio || '', site_links: r.data.site_links || '', site_author: r.data.site_author || '', site_footer: r.data.site_footer || '', custom_js: r.data.custom_js || '', site_theme: r.data.site_theme || 'animal-forest' }; } catch (e) {} };
        const loadTrash = async () => { try { const r = await api('/api/admin/trash'); trashPosts.value = r.data; } catch (e) {} };
        const showToast = (m) => { toast.value = m; setTimeout(() => toast.value = '', 2000); };
        const showConfirm = (t, m) => new Promise(r => { confirmModal.value = { show: true, title: t, message: m, onConfirm: () => { confirmModal.value.show = false; r(true); } }; });
        const openAdd = () => { editingId.value = null; form.value = { title: '', content: '', category: '', tags: '', status: 'draft', cover_image: '', password: '', published_at: new Date().toISOString().split('T')[0] }; coverPreview.value = ''; currentPage.value = 'new'; };
        const toggleEdit = (p) => { if (editingId.value === p.id) { editingId.value = null; } else { editingId.value = p.id; form.value = { title: p.title, content: p.content, category: p.category, tags: p.tags, status: p.status, cover_image: p.cover_image || '', password: p.password || '', published_at: p.published_at ? p.published_at.split('T')[0] : new Date().toISOString().split('T')[0] }; coverPreview.value = p.cover_image || ''; } };
        const savePost = async () => { const c = await showConfirm('确认保存', '确定保存？'); if (!c) return; try { if (editingId.value) { await api('/api/admin/post?id=' + editingId.value, { method: 'PUT', data: form.value }); editingId.value = null; } else { await api('/api/admin/post', { method: 'POST', data: form.value }); currentPage.value = 'posts'; } loadPosts(); showToast('保存成功'); } catch (e) { alert('保存失败'); } };
        const deletePost = async (id) => { const c = await showConfirm('确认删除', '移到回收站？'); if (!c) return; try { await api('/api/admin/post?id=' + id, { method: 'DELETE' }); loadPosts(); loadTrash(); showToast('已移到回收站'); } catch (e) {} };
        const editCategory = (c) => { editingCategory.value = c.id; categoryForm.value = { name: c.name, slug: c.slug, description: c.description || '' }; };
        const saveCategory = async () => { if (!categoryForm.value.name || !categoryForm.value.slug) { alert('请填写'); return; } const c = await showConfirm('确认保存', '确定？'); if (!c) return; try { const d = { ...categoryForm.value }; if (editingCategory.value && editingCategory.value !== 'new') d.id = editingCategory.value; await api('/api/category', { method: 'POST', data: d }); loadCategories(); editingCategory.value = null; categoryForm.value = { name: '', slug: '', description: '' }; showToast('保存成功'); } catch (e) { alert('保存失败'); } };
        const deleteCategory = async (id) => { const c = await showConfirm('确认删除', '确定？'); if (!c) return; try { await api('/api/category?id=' + id, { method: 'DELETE' }); loadCategories(); showToast('已删除'); } catch (e) {} };
        const saveSettings = async () => { try { await api('/api/settings', { method: 'POST', data: settingsForm.value }); showToast('保存成功'); } catch (e) { alert('保存失败'); } };
        const handleCoverChange = async (e) => { const f = e.target.files[0]; if (f) await uploadFile(f); };
        const handleDrop = async (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) await uploadFile(f); };
        const uploadFile = async (f) => { const fd = new FormData(); fd.append('file', f); const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json(); if (d.url) { form.value.cover_image = d.url; coverPreview.value = d.url; } };
        const handleAvatarDrop = async (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) { const fd = new FormData(); fd.append('file', f); const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json(); if (d.url) settingsForm.value.site_avatar = d.url; } };
        const deleteCover = () => { form.value.cover_image = ''; coverPreview.value = ''; };
        const handleFavicon = async (e) => { const f = e.target.files[0]; if (f) await uploadFavicon(f); };
        const handleFaviconDrop = async (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) await uploadFavicon(f); };
        const uploadFavicon = async (f) => { const fd = new FormData(); fd.append('file', f); const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json(); if (d.url) settingsForm.value.site_favicon = d.url; };
        const handleAvatar = async (e) => { const f = e.target.files[0]; if (!f) return; const fd = new FormData(); fd.append('file', f); const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json(); if (d.url) settingsForm.value.site_avatar = d.url; };
        const restorePost = async (id) => { try { await api('/api/admin/restore', { method: 'POST', data: { id } }); loadPosts(); loadTrash(); showToast('已恢复'); } catch (e) {} };
        const permanentDelete = async (id) => { const c = await showConfirm('确认删除', '彻底删除？不可恢复！'); if (!c) return; try { await api('/api/admin/permanent-delete', { method: 'POST', data: { id } }); loadTrash(); showToast('已删除'); } catch (e) {} };
        const emptyTrash = async () => { const c = await showConfirm('确认清空', '清空回收站？不可恢复！'); if (!c) return; try { await api('/api/admin/empty-trash', { method: 'POST' }); loadTrash(); showToast('已清空'); } catch (e) {} };
        
        const insertMd = (type) => {
          const ta = document.querySelector('textarea:focus') || document.querySelector('textarea');
          if (!ta) return;
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const text = form.value.content || '';
          const selected = text.substring(start, end);
          let insert = '';
          switch(type) {
            case 'heading': insert = '## ' + (selected || '标题'); break;
            case 'bold': insert = '**' + (selected || '加粗') + '**'; break;
            case 'italic': insert = '*' + (selected || '斜体') + '*'; break;
            case 'link': insert = '[' + (selected || '链接') + '](https://)'; break;
            case 'image': insert = '![' + (selected || '图片') + '](https://)'; break;
            case 'code': var hasNL = selected.indexOf(String.fromCharCode(10)) >= 0; var cb = String.fromCharCode(96)+String.fromCharCode(96)+String.fromCharCode(96); insert = hasNL ? cb + String.fromCharCode(10) + (selected || '代码') + String.fromCharCode(10) + cb : String.fromCharCode(96) + (selected || '代码') + String.fromCharCode(96); break;
            case 'ul': insert = '- ' + (selected || '列表项'); break;
            case 'ol': insert = '1. ' + (selected || '列表项'); break;
            case 'quote': insert = '> ' + (selected || '引用'); break;
            case 'hr': insert = String.fromCharCode(10) + '---' + String.fromCharCode(10); break;
          }
          form.value.content = text.substring(0, start) + insert + text.substring(end);
          setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + insert.length; }, 0);
        };

        // 主题配置
        const themes = {
          'animal-forest': {
            name: '动物森林',
            headerBg: 'linear-gradient(180deg, #7DC395 0%, #5BAF7A 100%)',
            sidebarBg: 'linear-gradient(180deg, #7DC395, #5BAF7A)',
            btnBg: '#19c8b9',
            btnShadow: '#11a89b',
            dangerBg: '#e05a5a',
            dangerShadow: '#c94444',
            cardBg: '#f7f3df',
            cardBorder: '#e8e0cc',
            bodyBg: '#f8f8f0',
            textPrimary: '#794f27',
            textBody: '#725d42',
            textSecondary: '#9f927d',
            inputBorder: '#c4b89e',
            inputShadow: '#d4c9b4'
          },
          'ocean-breeze': {
            name: '海洋微风',
            headerBg: 'linear-gradient(180deg, #4ECDC4 0%, #2C9C93 100%)',
            sidebarBg: 'linear-gradient(180deg, #4ECDC4, #2C9C93)',
            btnBg: '#4ECDC4',
            btnShadow: '#2C9C93',
            dangerBg: '#E74C3C',
            dangerShadow: '#C0392B',
            cardBg: '#F0F9F8',
            cardBorder: '#B8E6E1',
            bodyBg: '#F5FCFB',
            textPrimary: '#1A535C',
            textBody: '#2C3E50',
            textSecondary: '#7F8C8D',
            inputBorder: '#B8E6E1',
            inputShadow: '#A0D8D2'
          }
        };

        const applyTheme = () => {
          const theme = themes[settingsForm.value.site_theme] || themes['animal-forest'];
          const root = document.documentElement;
          root.style.setProperty('--header-bg', theme.headerBg);
          root.style.setProperty('--sidebar-bg', theme.sidebarBg);
          root.style.setProperty('--btn-bg', theme.btnBg);
          root.style.setProperty('--btn-shadow', theme.btnShadow);
          root.style.setProperty('--danger-bg', theme.dangerBg);
          root.style.setProperty('--danger-shadow', theme.dangerShadow);
          root.style.setProperty('--card-bg', theme.cardBg);
          root.style.setProperty('--card-border', theme.cardBorder);
          root.style.setProperty('--body-bg', theme.bodyBg);
          root.style.setProperty('--text-primary', theme.textPrimary);
          root.style.setProperty('--text-body', theme.textBody);
          root.style.setProperty('--text-secondary', theme.textSecondary);
          root.style.setProperty('--input-border', theme.inputBorder);
          root.style.setProperty('--input-shadow', theme.inputShadow);
        };

        // 自定义下拉组件
        const customSelects = ref({});
        
        const toggleSelect = (id) => {
          Object.keys(customSelects.value).forEach(key => {
            if (key !== id) customSelects.value[key] = false;
          });
          customSelects.value[id] = !customSelects.value[id];
        };
        
        const selectOption = (id, value, field) => {
          if (field === 'category') form.value.category = value;
          else if (field === 'status') form.value.status = value;
          else if (field === 'theme') settingsForm.value.site_theme = value;
          customSelects.value[id] = false;
        };
        
        const getSelectLabel = (options, value) => {
          const opt = options.find(o => o.value === value);
          return opt ? opt.label : '请选择';
        };
        
        const closeAllSelects = () => {
          Object.keys(customSelects.value).forEach(key => {
            customSelects.value[key] = false;
          });
        };

        onMounted(() => { check(); document.addEventListener('click', closeAllSelects); });
        return { logged, password, login, logout, posts, editingId, form, coverPreview, toast, openAdd, toggleEdit, handleCoverChange, handleDrop, deleteCover, savePost, deletePost, categories, currentPage, categoryForm, saveCategory, deleteCategory, editCategory, editingCategory, settingsForm, saveSettings, handleFavicon, handleFaviconDrop, handleAvatar, handleAvatarDrop, trashPosts, restorePost, permanentDelete, emptyTrash, confirmModal, showConfirm, insertMd, applyTheme, customSelects, toggleSelect, selectOption, getSelectLabel };
      }
    }).mount('#app');
  <\/script>
</body>
</html>`;
}
