# 文章与相册维护指南
date: 2026-06-06
tags: 博客, 指南, 教程
time: 20:00
readTime: 6 分钟
pinned: true
---

## 写一篇新文章

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
- 可选 `description` 自定义摘要（否则自动截取正文前 200 字）
- 可选 `image` 自定义分享卡片图

---

## 添加画廊相册

图片存放在 [my-images](https://github.com/ninasukiwww-png/my-images) 仓库的 `blog/` 目录下，每个相册一个子目录。

相册目录内放 `meta.json`：

```json
{"title":"相册名","date":"2026.06","description":"简介","cover":"文件名.jpg"}
```

照片列在 `albums/index.json` 中，由构建脚本自动生成。

---

## 构建索引

```bash
node scripts/build.js
```

自动生成：
- `content/posts/index.json` — 文章索引
- `content/albums/index.json` — 相册索引（含 EXIF 信息）
- `feed.xml` — RSS
- `sitemap.xml` — 站点地图
- 给 `style.css` / `app.js` 打版本哈希
- 给 `index.html` 写入构建时间戳（缓存控制）

---

## 一键部署

```bash
./deploy.sh "提交说明"
```

流程：构建 → 提交 → 推送博客仓库 → GitHub Pages 自动部署。

附带 `deploy-full.sh`：先 WebP 转换 → 推 my-images → 再推博客。加 `-n` 跳过转换。

---

## 图片处理

所有图片通过 `raw.githubusercontent.com/ninasukiwww-png/my-images/main/blog/` 引用（jsDelivr 已弃用）。

构建时加上 `?t=构建时间戳` 刷新 CDN 缓存。

EXIF 信息（相机型号、ISO、光圈等）由 `exifr` 包在构建时自动提取，存入相册索引。

---

## Service Worker

博客注册了 Service Worker，自动缓存 CDN 图片，提升重复访问速度。
