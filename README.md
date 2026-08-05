# 三五小星知识成果检测站 - 微信小程序前端

本目录是检测站的**微信小程序前端工程**，与现网 H5（`knowledge-outcome-station-h5-handoff-2026-08-03/`）**视觉样式 1:1 复刻**，但**不含静态内容资源**（348 集手册 JSON、单集配图），内容数据后续由主 App 后端下发。

## 与 H5 的关系

| 维度 | 现网 H5 | 本小程序 |
|---|---|---|
| 技术栈 | React 19 + Vite | 原生微信小程序（WXML/WXSS/JS） |
| 视觉样式 | `src/styles.css` | 各 `.wxss`，逐屏翻译，配色/间距/字号一致 |
| 页面结构 | 单文件 `App.jsx` 三屏状态机 | 三页面（courses/episodes/manual）+ 自定义组件 |
| 内容数据 | 本地 348 集 JSON（`public/content/guides/`） | **不含**，由后端 `/guide/*` 接口下发（见下） |
| 鉴权 | 无 | 预留 JWT 持久化挂载点 |

## 目录结构

```
check-miniprogram/
├── app.js                      # 入口：全局状态机 + JWT 持久化挂载点
├── app.json                    # 页面注册 + 自定义导航栏
├── app.wxss                    # 全局样式：CSS 变量、配色系统、reset
├── project.config.json         # 工程配置（appid 需替换）
├── sitemap.json
├── images/
│   └── swxx-brand-mark.png     # 品牌 logo（UI 资产，非内容资源）
├── utils/
│   └── api.js                  # 数据接口层（后端挂载点，当前占位）
├── components/
│   └── feedback-drawer/        # 点评抽屉组件（对应 H5 FeedbackDrawer）
│       ├── feedback-drawer.json
│       ├── feedback-drawer.wxml
│       ├── feedback-drawer.js
│       └── feedback-drawer.wxss
└── pages/
    ├── courses/                # 课程目录（对应 H5 CourseDirectory）
    │   ├── courses.{json,wxml,wxss,js}
    ├── episodes/               # 集数目录（对应 H5 EpisodeDirectory）
    │   └── episodes.{json,wxml,wxss,js}
    └── manual/                 # 本集手册（对应 H5 EpisodeManual）
        └── manual.{json,wxml,wxss,js}
```

## 如何打开

1. 打开**微信开发者工具**，选择「导入项目」。
2. 项目目录选本文件夹 `check-miniprogram/`。
3. AppID 填写你的小程序 AppID（或选「测试号」）。
4. 即可在模拟器中预览。当前数据为空占位，页面会显示「暂无内容」状态，属正常。

## 接入后端（已完成接线）

小程序已对接独立后端 `check-station-server`。接口集中在 `utils/api.js`，调用真实后端：

| 小程序调用 | 后端接口 | 作用 |
|---|---|---|
| `api.sendCode(phone)` | `POST /auth/send_code` | 发送验证码 |
| `api.login(phone, code)` | `POST /auth/login` | 验码登录，存 JWT |
| `api.getChildProgress(tel)` | `POST /child/progress` | 查孩子学习进度（核心） |
| `api.fetchCatalog()` | `GET /content/catalog` → OSS | 课程目录 |
| `api.fetchEpisodeGuide(id)` | `GET /content/episode/:id` → OSS | 单集内容 |

### 页面流程（已实现）
```
登录页 (pages/login)         输家长手机号+验证码
   ↓
绑定孩子页 (pages/bindChild)  输孩子手机号 → 显示各科进度 → 选某门课
   ↓
课程目录 (pages/courses)      带 focus 参数自动定位到选中课程
   ↓
集数目录 (pages/episodes)     选某集
   ↓
本集手册 (pages/manual)       考察孩子（不存储记录）
```

### 联调步骤（密钥到位后）
1. **后端**：`cd check-station-server && npm install && cp .env.example .env`（填密钥）`&& npm start`
2. **小程序**：改 `app.js` 的 `apiBase` 为后端实际地址（本地 `http://localhost:3000`，线上你的域名）
3. 微信开发者工具勾选「不校验合法域名」（开发期），即可联调
4. **OSS 内容**：先用内容后台（`http://后端域名/manage/`）发布至少一门课的目录和几集内容，否则小程序拉不到内容

## 样式映射说明（H5 → 小程序）

- H5 使用 Phosphor Icons（SVG），小程序暂用 **Unicode 字形占位**（⚛🌍🍃🗺 ☰ 等），视觉结构一致；后续可替换为 icon 字体或图片。
- 单位换算：H5 设计宽 390px，小程序 750rpx，换算系数 ≈1.923，关键尺寸按 px×2 取近似 rpx。
- CSS 变量（`--blue` 等）定义在 `app.wxss` 的 `page` 选择器，各页面直接引用。
- 配色、字号、间距、圆角、tone（blue/green/yellow/coral）与 H5 完全对齐。

## 已知差异

- 图标：Unicode 占位 ≠ Phosphor Icons 精确外观，结构布局一致，仅字形待替换。
- 内容：空占位，接入后端后填充。
- 动画：屏切换、抽屉入场动画已保留；如需与 H5 完全相同的微动效，可在 wxss 中微调。
