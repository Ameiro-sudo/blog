# SnowBlock 博客项目总览
date: 2026-06-06
tags: 博客, 项目, 指南
time: 20:00
readTime: 6 分钟
pinned: true
---

一个零后端静态单页博客。基于 Markdown 写作，构建时生成索引，GitHub Pages 托管，全站无数据库无服务器。

## 架构

```
blog/
├── index.html            # SPA 入口
├── assets/
│   ├── css/style.css     # 全局样式（毛玻璃暗色设计）
│   └── js/app.js         # 前端路由/搜索/画廊/灯箱等
├── content/
│   ├── posts/            # 文章 .md 文件
│   ├── albums/           # 相册索引（构建生成）
│   └── pages/            # 独立页面（about.md）
├── scripts/build.js      # 构建脚本
├── sw.js                 # Service Worker
├── deploy.sh             # 博客一键部署
└── deploy-full.sh        # 完整部署（含 WebP 转换）
```

图片存储在独立的 [my-images](https://github.com/ninasukiwww-png/my-images) 仓库。

## 写文章

在 `content/posts/` 下新建 `.md` 文件：

```markdown
# 文章标题
date: 2026-06-05
tags: 标签1, 标签2
time: 14:20
readTime: 3 分钟
---
正文从这里开始，支持 **Markdown** 语法。
```

- 第一行 `# 标题` 用作文章标题
- `date` / `tags` / `time` / `readTime` 写在标题和 `---` 之间
- 多个标签用英文逗号分隔
- 置顶加 `pinned: true`
- 可选 `description` 自定义摘要，可选 `image` 自定义分享图

## 添加相册

图片放在 `my-images/blog/相册名/` 目录下。每个相册目录放 `meta.json`：

```json
{"title":"相册名称","date":"2026.06","description":"简介","cover":"封面文件名"}
```

构建时自动扫描目录，提取 EXIF 信息（相机型号、ISO、光圈等），生成相册索引。

## 构建

```bash
node scripts/build.js
```

自动生成：
- 文章索引 `content/posts/index.json`
- 相册索引 `content/albums/index.json`（含 EXIF）
- RSS 订阅 `feed.xml`
- 站点地图 `sitemap.xml`
- 资源版本号 + 构建时间戳（浏览器缓存控制）

## 部署

```bash
# 博客单独部署
./deploy.sh "提交说明"

# 完整部署（WebP 转换 + 推 my-images + 推博客）
./deploy-full.sh
./deploy-full.sh -n    # 跳过 WebP 转换
```

推到 GitHub 后由 GitHub Pages 自动部署。

## 图片 CDN

图片通过 `raw.githubusercontent.com/ninasukiwww-png/my-images` 引用，构建时加时间戳 `?t=BUILD_TS` 刷新 CDN 缓存。

Service Worker 自动缓存已加载的 CDN 图片，提升重复访问速度。

## 功能列表

- Markdown 文章系统（置顶/分页/搜索/标签筛选/标签云）
- 归档热力图（年度发文分布，点击查看当日文章）
- 画廊瀑布流（分批加载/灯箱缩放拖拽/EXIF 展示）
- 文章目录（自动提取标题，滚动高亮）
- 阅读进度条
- 随机文章 `#/random`
- 全文搜索 + 高亮
- RSS 订阅 / Sitemap / OG 社交卡片
- 暗色模式 / 打印样式 / 移动端适配
