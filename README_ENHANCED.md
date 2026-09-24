# Duix.Avatar (HeyGem) 客户端定制增强版

本项目为官方 **Duix.Avatar (HeyGem)** Electron 客户端的深度定制与生产增强源码，集成了数字模特多维分组管理系统、生产环境端口防冲突配置、数据库自愈迁移，并与后台队列守护调度系统协同工作。

---

## 🛠️ 本次核心定制与改动清单

### 1. 数字模特分组管理系统 (Model Grouping)
- **数据库扩展 (v4 自动迁移)**：
  - 新增 `model_group` 分组表（`id`, `name`, `sort_order`, `created_at`）。
  - `f2f_model` 表新增 `group_id` 外键与检索索引 `idx_f2f_model_group_id`。
  - 自动通过 `src/main/db/sql.js` (version 4) 在初次启动时无感平滑迁移现有数据库，保持向下兼容。
- **后端 DAO 与 IPC 服务**：
  - `src/main/dao/model-group.js`：提供完整分组 CRUD，删除分组时采用**安全事务解绑机制**（仅将组内模特重置为 `group_id = NULL` 未分组，绝不误删模特素材与文件）。
  - `src/main/dao/f2f-model.js`：重构分页与按 ID 查询，支持 `all`、`ungrouped`、特定 `groupId` 过滤，并自动联表获取 `group_name`。
  - `src/main/service/model.js`：注册 `model_group/list`、`add`、`rename`、`remove`、`model/updateGroup` 等全套 IPC 通信通道。
- **前端页面 UI 重塑**：
  - **首页「我的数字模特」(`myModelList.vue`)**：
    - 新增左侧分组管理导航栏（全部模特、未分组、自定义分组列表，附带组内模特数量徽标 Badge）。
    - 支持分组快捷新建、重命名、安全删除弹窗。
    - 模特卡片底部直观展示所属分组彩色 Tag，hover 支持弹窗选择移动分组。
    - 实现了 HTML5 原生拖拽能力：直接拖拽模特卡片扔入左侧分组即可完成归组。
  - **视频制作页「选择模特」侧边栏 (`SelectView.vue` & `VideoEditView.vue`)**：
    - 顶部加入深色模式适配的 `t-select` 极简分组筛选下拉框（全部分组、未分组、各个分组统计）。
    - 引入 `localStorage` 持久化记忆，自动锁定上次选中的工作分组，无需反复切换。

### 2. Docker Compose 容器部署加固
- 修改 `deploy/docker-compose.yml`、`docker-compose-5090.yml`、`docker-compose-lite.yml`：
  - 将所有容器的 `restart: always` 统一调整为 `restart: "no"`，避免开机恶性循环或故障时反复抢占显存。
  - 移除 `FunASR` 默认对宿主机 `10095` 端口的强制绑定，杜绝与本地现有语音转写服务冲突。

---

## 📦 本地编译构建与部署指南

### 1. 安装依赖
```bash
npm install
```

### 2. 编译渲染层与主进程代码
```bash
npm run build
```
编译产物将输出至 `out/` 目录：
- `out/main/index.js`
- `out/preload/index.js`
- `out/renderer/`

### 3. 打包生成并部署 app.asar 到安装目录
在安装目录下（如 `C:\Program Files\Duix.Avatar\resources\`），将最新编译出的代码注入 `app.asar`：
1. 先备份现有 `app.asar` 为 `app.asar.bak`。
2. 提取或替换 asar 中的 `out/` 与相关更新文件，解包并使用 `{ unpackDir: "resources" }` 生成新 asar。
3. 覆盖替换安装目录下的 `resources/app.asar`。
4. 启动客户端测试验证。

---

## 🔗 协同仓库
- 后台自愈队列、并发防抢单调度器、双模 TTS (IndexTTS2) 与一键启停系统请参见仓库：
  https://github.com/2392772541/heygem-enhanced
