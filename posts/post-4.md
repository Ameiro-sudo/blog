# 博客更新指南 · 写文章与推送
date: 2026-06-05
tags: 博客, 指南, 教程
time: 23:30
readTime: 3 分钟
---
## 写一篇新文章

在 `posts/` 目录下新建一个 `.md` 文件，命名规则：`post-编号.md`。

文件格式：

```markdown
# 文章标题
date: 2026-06-05
tags: 标签1, 标签2
time: 14:20
readTime: 3 分钟
---
这里是正文内容，支持标准 Markdown 语法。
```

注意：
- 第一行必须是 `# 标题`
- `date`、`tags`、`time`、`readTime` 写在标题和 `---` 之间
- 多个标签用英文逗号分隔
- `---` 后面是正文

## 构建索引

```bash
node build.js
```

这个脚本会扫描 `posts/` 目录下所有 `.md` 文件，提取元数据，生成 `posts/index.json`。

## 推送上线

```bash
git add -A
git commit -m "add: 新文章标题"
git push
```

推送后 GitHub Pages 会自动部署，等一两分钟就能看到。

## 完整流程示例

```bash
# 1. 写文章
vim posts/post-5.md

# 2. 构建
node build.js

# 3. 提交推送
git add -A && git commit -m "add: 新文章" && git push
```

## 本地预览

直接用浏览器打开 `index.html` 即可预览，不需要服务器。文章内容从 `posts/` 目录动态加载。
