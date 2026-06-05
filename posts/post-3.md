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

## 一键推送（推荐）

写完 `.md` 文件后，直接跑：

```bash
./deploy.sh
```

脚本会自动：构建索引 → `git add` → `git commit` → `git push`。

也可以加自定义提交信息：

```bash
./deploy.sh "add: Rust 入门指南"
```

## 手动推送

```bash
node build.js          # 构建索引
git add -A
git commit -m "add: 文章标题"
git push               # 推送上线
```

推送后 GitHub Pages 会自动部署，等一两分钟就能看到。

## 本地预览

直接用浏览器打开 `index.html` 即可预览，不需要服务器。文章内容从 `posts/` 目录动态加载。
