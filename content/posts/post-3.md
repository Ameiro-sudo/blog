# 博客使用指南
date: 2026-06-06
tags: 博客, 指南, 教程, 模板
time: 20:00
readTime: 5 分钟
pinned: true
---

## 写一篇新文章

在 `content/posts/` 下新建 `.md` 文件，按以下格式：

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
- 想置顶加 `pinned: true`
- 图片上传到图床后用 CDN 链接引用

---

## 添加画廊相册

在 `content/albums/` 下新建 `.md` 文件：

```markdown
---
title: 相册名称
date: 2026-06
cover: cover-photo.jpg
---
photo1.webp
photo2.webp
photo3.webp
```

照片文件名基于 CDN 根目录（`my-images/blog/`）自动拼接完整 URL。

---

## 构建索引

添加或修改文章/相册后，需要重新生成索引：

```bash
node scripts/build.js
```

输出：
```
Building indexes...
  posts: 5 articles
  albums: 1 albums
Done.
```

---

## 一键部署

```bash
./deploy.sh "提交说明"
```

自动执行：
1. 构建索引（`node scripts/build.js`）
2. 提交所有改动（`git add -A && git commit`）
3. 推送到 GitHub（`git push`）

> 不加参数会自动生成提交信息，检测到新文章 → `"add: 新文章"`，新相册 → `"add: 新相册"`，其余 → `"update: 月-日 时:分"`。

---

## 手动部署

```bash
node scripts/build.js    # 构建索引
git add -A
git commit -m "add: 标题"
git push                 # GitHub Pages 自动部署
```

等一两分钟生效。

---

## 本地预览

直接用浏览器打开 `index.html`，文章从 `content/posts/` 动态加载。无需服务器。
