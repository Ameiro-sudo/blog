# SnowBlock 博客项目总览
date: 2026-06-06
tags: 指南
time: 20:00
readTime: 10 分钟
pinned: true
---

一个零后端静态单页博客。基于 Markdown 写作，构建时生成索引，GitHub Pages 托管，全站无数据库无服务器。所有源码在 [github.com/ninasukiwww-png/blog](https://github.com/ninasukiwww-png/blog)。

---

## 架构总览

```
blog/
├── index.html # SPA 入口（加载器 + 毛玻璃 + 雪花粒子）
├── assets/
│ ├── css/style.css # 全局样式系统
│ └── js/app.js # 前端 SPA（路由 / 搜索 / 画廊 / 灯箱 / TOC）
├── content/
│ ├── posts/ # 文章 .md 源文件 + build 生成的 index.json
│ ├── albums/ # 相册索引（build 自动生成）
│ └── pages/ # 独立页面 .md（如 about.md）
├── scripts/
│ └── build.js # 构建脚本（ESM + exifr 异步 EXIF 提取）
├── sw.js # Service Worker（CDN 图片缓存）
├── deploy.sh # 博客一键部署
├── deploy-full.sh # 完整部署（WebP 转换 + my-images + 博客）
└── package.json # exifr 依赖
```

图片存储在独立仓库 [my-images](https://github.com/ninasukiwww-png/my-images)：

```
my-images/
└── blog/
 ├── 相册名1/
 │ ├── meta.json # 标题 / 日期 / 简介 / 封面
 │ ├── photo1.webp
 │ └── photo2.jpg
 ├── 相册名2/
 └── ...
```

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | 原生 HTML5 + CSS3 + JS | 零框架，纯手工 SPA |
| 路由 | Hash 路由 | `#/id` 文章 / `#/archive` 归档 / `#/gallery` 画廊 / `#/gallery/相册ID` 相册详情 / `#/about` 关于 / `#/random` 随机 |
| Markdown | markdown-it 14.x | 渲染 + 自定义图片规则（CDN 链接处理） |
| 代码高亮 | highlight.js 11.x | Atom One Dark 主题，语言标签 + 复制按钮 |
| 输入净化 | DOMPurify 3.x | XSS 防护，白名单标签/属性 |
| 图标 | Iconify | 社交链接 SVG 图标（GitHub / Bilibili） |
| 构建 | Node.js ESM | `scripts/build.js`，异步 EXIF 提取 |
| 托管 | GitHub Pages | 自定义域名 blog.snowblock.top |

---

## 写文章

在 `content/posts/` 下新建 `.md` 文件：

```markdown
# 文章标题
date: 2026-06-05
tags: 标签1, 标签2
time: 14:20
readTime: 3 分钟
pinned: true
description: 自定义摘要（可选，默认截取正文前 200 字）
image: https://...分享封面图URL（可选，默认使用站点背景）
---
正文从这里开始，支持 **Markdown** 语法。
```

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `# 标题` | 是 | 第一行，用作文章标题和 URL |
| `date` | 是 | 日期，影响排序和归档 |
| `tags` | 否 | 英文逗号分隔，用于筛选和标签云 |
| `time` | 否 | 文章列表显示 |
| `readTime` | 否 | 阅读时长标签 |
| `pinned` | 否 | `true` 置顶，排在最前 |
| `description` | 否 | 自定义摘要，用于 RSS / OG / 文章卡片 |
| `image` | 否 | 分享到社交平台时显示的封面图 |

**图片引用：** 支持两种方式：
1. 直接粘贴 CDN 链接：`![alt](https://cdn.jsdelivr.net/gh/ninasukiwww-png/my-images@main/blog/xxx.jpg)`
2. CDN 链接自动识别：构建时不做处理，运行时 markdown-it 识别 jsDelivr 域名

---

## 添加相册

图片放在 `my-images/blog/相册名/` 目录下，每张图片可以是 jpg / png / webp / bmp / gif。相同 basename 优先用 webp（去重逻辑）。

**meta.json：**

```json
{
 "title": "相册名称",
 "date": "2026.06",
 "description": "相册简介",
 "cover": "封面文件名.jpg"
}
```

构建时自动完成：
1. 扫描目录所有图片文件
2. 同名 webp 优先（jpg 和 webp 共存时只保留 webp）
3. 用 exifr 解析每张图的 EXIF 信息
4. 生成含 EXIF 的相册索引

**EXIF 提取内容：** 相机品牌（Make）、型号（Model）、ISO、光圈（FNumber）、快门速度（ExposureTime）、焦距（FocalLength）、图像尺寸（ImageWidth/Height）。

---

## 构建

```bash
node scripts/build.js
```

一次执行：
- **文章索引** — 扫描 `content/posts/`，解析元信息和正文摘要，输出 `index.json`
- **相册索引** — 扫描 `my-images/blog/` 目录，并行提取 EXIF，输出 `index.json`
- **RSS 订阅** — 生成 `feed.xml`，含每篇文章标题/链接/日期/摘要
- **Sitemap** — 生成 `sitemap.xml`，含所有文章和路由
- **版本控制** — 给 `style.css` 和 `app.js` 计算 MD5 哈希，注入 `?v=8位哈希`
- **缓存控制** — 在 `index.html` 中写入构建时间戳 `<meta name="build-ts" content="...">`，前端 fetch 相册索引时带上 `?v=时间戳` 防缓存

---

## 部署

### 仅博客

```bash
./deploy.sh "提交说明"
```

流程：构建 > git add > git commit > git push > GitHub Pages 自动部署。

### 完整部署（含图片）

```bash
./deploy-full.sh "提交说明"
./deploy-full.sh -n "提交说明" # 跳过 WebP 转换
```

额外步骤：
1. 用 ffmpeg 将 `my-images/blog/` 下的 jpg/png/bmp 转换为 webp
2. 提交并推送 my-images 仓库
3. 再执行博客的构建部署

`-n` 参数只在图片已经是 webp 或不需要重新转换时使用，可节省大量时间。

---

## 图片 CDN

所有图片通过 jsDelivr CDN 加载：`https://cdn.jsdelivr.net/gh/ninasukiwww-png/my-images@main/blog/`

**缓存策略：**
- 构建时在每张图片 URL 后加 `?t=BUILD_TS`（`BUILD_TS = Date.now()`）
- 每次构建时间戳不同，CDN 和浏览器都视为新资源
- Service Worker 拦截 CDN 域名请求，缓存到 `v1` 缓存空间，下次访问直接走缓存

**注意：** 图片通过 jsDelivr CDN 加载，国内可达性较好。Google Fonts 已被墙，通过 `fonts.loli.net` / `gstatic.loli.net` 镜像加载。

---

## Service Worker

`sw.js` 注册在根路径，`app.js` 初始化时自动注册。

行为：
- `install` 阶段：跳过等待，立即激活
- `activate` 阶段：`clients.claim()` 立即接管所有客户端
- `fetch` 阶段：仅拦截 `cdn.jsdelivr.net/gh/ninasukiwww-png/my-images` 的请求，缓存到 `v1` 缓存
- 不缓存博客自身资源（`style.css`、`app.js`、`content/` 等），这些由版本哈希控制

---

## 前端 SPA 详解

`assets/js/app.js` 是一个自执行函数（IIFE），内部模块：

### 路由 (`handleHash`)

监听 `hashchange` 事件，根据 hash 值分发：

| Hash | 视图 |
|------|------|
| `#/` 或空 | 文章列表首页 |
| `#/archive` | 归档（热力图 + 时间轴） |
| `#/gallery` | 画廊（相册列表） |
| `#/gallery/相册ID` | 相册详情（瀑布流照片） |
| `#/about` | 关于页面 |
| `#/random` | 随机跳转一篇文章 |
| `#/文章ID` | 文章详情 |

### 搜索 (`applyFilters`)

- 实时搜索，250ms 防抖
- 匹配字段：标题、标签、日期、正文摘要
- 匹配关键词在标题和摘要中以黄色 `<mark>` 高亮
- 搜索结果同样支持分页

### 标签云 (`renderTagFilters`)

- 统计所有文章标签的出现频率
- 按频率分为 3 档（size-1/size-2/size-3），字号越大表示使用越多
- 点击标签切换筛选，再次点击清除
- 可叠加搜索框使用

### 文章列表 + 分页

- 每页 5 篇，置顶文章排在最前
- 分页栏支持上一页/下一页/数字跳转/首尾页
- 文章卡片包含：标题、日期、标签、摘要、阅读时间

### 文章详情 (`loadArticle`)

- 从 `content/posts/` 加载 `.md` 源文件
- 剥离元信息区域，仅渲染正文
- 渲染流程：markdown-it > DOMPurify > innerHTML
- 代码块自动添加：复制按钮、语言标签、包裹容器
- 表格自动包裹响应式容器
- 图片自动绑定点击灯箱
- 底部显示相关文章（按标签重合度排序）
- 自动生成文章目录（基于 h2/h3）
- 字数统计

### 文章目录 (TOC)

- 提取 `h2` 和 `h3` 生成目录链接
- id 由标题文本自动生成（中文保留）
- 滚动时 IntersectionObserver 高亮当前可见章节
- 右下角 ≡ 按钮切换目录面板显示

### 阅读进度条

- 页面顶部固定 3px 高的渐变进度条
- 根据 `(scrollTop) / (scrollHeight - clientHeight)` 计算百分比
- 随滚动实时填充

### 归档 (`renderArchive`)

- 按年月分组展示所有文章和相册
- 顶部热力图（GitHub 风格贡献图）
- 热力图支持切换年份
- 点击色块方块弹出当日文章列表

### 热力图 (`renderHeatmap`)

- 以周为行、月为列的网格
- 颜色深浅表示当日发文数量（4 级）
- 点击方块弹出文章列表
- 顶部按钮切换年份

### 画廊 (`showGallery` / `showAlbum`)

- 相册列表：瀑布流卡片（堆叠效果，鼠标悬停动画）
- 相册详情：CSS `columns: 260px` 瀑布流，分批加载（IntersectionObserver，每次 12 张）
- 预加载：每次加载后预加载下一批图片的 Image 对象
- 每张照片点击打开灯箱

### 灯箱

- 全屏黑色毛玻璃遮罩
- 图片居中显示，最大 90vw / 85vh
- **缩放：** 滚轮逐级缩放（0.25x 步进）、双击切换 1x / 2.5x、触摸双指缩放
- **平移：** 缩放后鼠标拖拽平移，触摸单指拖拽
- **关闭：** 点击遮罩、点击 X 按钮、按 Esc
- **EXIF 展示：** 底部左侧显示相机参数（品牌、型号、ISO、光圈、快门、焦距、尺寸）
- MutationObserver 监听 lightbox 显示状态，打开时重置缩放，关闭时清除 EXIF

### 简介卡片 (`renderProfile`)

- 页面顶部展示头像、昵称、简介、社交链接
- 数据在 `profileConfig` 配置（硬编码在 app.js）
- 社交链接使用 Iconify SVG 图标

### 关于页面

- 加载 `content/pages/about.md`，按文章格式渲染

### OG 标签

- 动态更新 `<meta property="og:...">` 标签
- 文章页：标题、描述、封面图、URL
- 首页：重置为默认值

### Service Worker 注册

- `navigator.serviceWorker.register('sw.js')`

---

## 设计系统

### 配色

| CSS 变量 | 值 | 用途 |
|----------|-----|------|
| `--color-bg-deep` | `#0b2b3b` | 深色背景基色 |
| `--color-accent` | `#8fd8ef` | 冰蓝强调色 |
| `--glass-bg` | `rgba(255,255,255,0.12)` | 毛玻璃卡片背景 |
| `--glass-header-bg` | `rgba(11,43,59,0.55)` | 顶栏毛玻璃 |
| `--glass-border` | `rgba(255,255,255,0.20)` | 毛玻璃边框 |
| `--glass-hover-bg` | `rgba(255,255,255,0.22)` | 悬停高亮 |
| `--shadow-card` | 大阴影 | 卡片层阴影 |
| `--shadow-item` | 小阴影 | 条目阴影 |

### 字体

- **标题：** ZCOOL KuaiLe（Google Fonts，通过 `fonts.loli.net` 镜像加载）
- **正文：** Segoe UI / system-ui / sans-serif
- **代码/标签：** SF Mono / Cascadia Code / Fira Code / monospace

### 毛玻璃系统

所有卡片（文章卡片、相册卡片、归档卡片、页头）统一：
- `backdrop-filter: blur(14-16px) saturate(1.2-1.4)`
- 半透明背景 + 半透明边框
- 双层背景遮罩（黑色渐变叠加层）

### 加载器

SVG 晶体动画加载器：
- 三段描边动画（主线条、内线条、核心线条）
- 呼吸光晕动画
- 背景图加载 + 最少 1500ms 展示 + 5000ms 超时兜底
- 加载完成后过渡消失

### 雪花粒子

- Canvas 全屏粒子系统
- 30-60 片雪花（按屏幕宽度）
- 大小、速度、透明度随机
- 加载完成后淡入显示

### 暗色模式

- `@media (prefers-color-scheme: dark)`
- 深色背景、低对比度配色

### 打印样式

- 去除毛玻璃效果、背景图、雪花动画
- 确保纸质输出清晰可读

---

## 本地预览

不需要服务器，直接浏览器打开 `index.html` 即可。文章从 `content/posts/` 动态 fetch，构建后的 `index.json` 用于文章列表。

```bash
cd blog
npm install # 安装 exifr
node scripts/build.js # 生成索引
# 浏览器打开 index.html
```

---

## 相关链接

- GitHub: [ninasukiwww-png](https://github.com/ninasukiwww-png)
- Bilibili: [Shizukuレモン](https://space.bilibili.com/3493084421687360)
- 博客: [blog.snowblock.top](https://blog.snowblock.top)
- 导航页: [snowblock.top](https://snowblock.top)
