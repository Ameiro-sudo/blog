# SnowBlock Blog

零后端静态单页博客。基于 Markdown 写作，构建时生成索引，GitHub Pages 托管，全站无数据库无服务器。

## 架构

```
blog/
├── index.html          # SPA 入口
├── assets/
│   ├── css/style.css   # 全局样式（毛玻璃暗色设计）
│   └── js/app.js       # 前端逻辑（路由/搜索/画廊/灯箱等）
├── content/
│   ├── posts/          # 文章 .md 文件
│   ├── albums/          # 相册索引（构建生成）
│   └── pages/          # 独立页面（如 about.md）
├── scripts/build.js    # 构建脚本
├── sw.js               # Service Worker
├── deploy.sh           # 博客一键部署
└── deploy-full.sh      # 完整部署（含图片转换）
```

my-images 仓库用于存储图片：

```
my-images/
└── blog/
    ├── 相册1/
    ├── 相册2/
    └── test_diff/
```

## 核心功能

- **文章系统** -- Markdown 写作，置顶/分页/搜索/标签筛选/标签云
- **归档热力图** -- 年度发文分布，点击方块查看当日文章
- **画廊** -- 瀑布流相册，分批加载，灯箱缩放+拖拽，EXIF 展示
- **文章目录** -- 自动提取标题，滚动高亮当前章节
- **阅读进度条** -- 顶部渐变色进度指示
- **随机文章** -- `#/random` 路由
- **全文搜索** -- 标题/标签/日期/正文，搜索高亮
- **RSS / Sitemap** -- 订阅源与 SEO
- **OG 标签** -- 社交分享卡片
- **CDN 缓存控制** -- 构建时间戳参数 `?t=BUILD_TS`
- **EXIF 提取** -- 构建时自动解析相机参数
- **Service Worker** -- 缓存 CDN 图片加速访问
- **WebP 转换** -- `deploy-full.sh -n` 跳过转换
- **响应式** -- 暗色模式/打印样式/移动端适配

## 写文章

在 `content/posts/` 下新建 `.md`：

```markdown
# 标题
date: 2026-06-05
tags: 标签1, 标签2
time: 14:20
readTime: 3 分钟
---
正文，支持 **Markdown**。
```

元数据字段：`date` `tags` `time` `readTime` `pinned` `description` `image`

## 加相册

图片放在 `my-images/blog/相册名/` 下，加 `meta.json`：

```json
{"title":"相册名","date":"2026.06","description":"简介","cover":"封面文件名"}
```

构建脚本自动扫描目录，提取 EXIF，生成相册索引。

## 构建 & 部署

```bash
# 仅构建博客
node scripts/build.js

# 一键部署博客
./deploy.sh "提交说明"

# 完整部署（WebP 转换 + 推 my-images + 推博客）
./deploy-full.sh

# 跳过 WebP 转换
./deploy-full.sh -n
```

`deploy.sh` 内部：构建 → 提交 → 推送到 GitHub → GitHub Pages 自动部署。

## 图片 CDN

图片通过 `raw.githubusercontent.com/ninasukiwww-png/my-images` 引用（jsDelivr 已弃用）。

## 技术栈

- 纯前端 SPA（无框架，原生 JS）
- CSS 毛玻璃暗色设计系统
- GitHub Pages 托管
- exifr 构建时 EXIF 提取
- Service Worker 离线缓存
