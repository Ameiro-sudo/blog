# 博客使用指南
date: 2026-06-05
tags: 博客, 指南, 教程, 模板
time: 22:00
readTime: 4 分钟
pinned: true
---
## 写一篇新文章

在 `posts/` 目录下新建 `.md` 文件，按以下格式写：

```markdown
# 文章标题
date: 2026-06-05
tags: 标签1, 标签2
time: 14:20
readTime: 3 分钟
---
正文从这里开始，支持 **Markdown** 语法。
```

第一行必须是 `# 标题`，`date`/`tags`/`time`/`readTime` 写在标题和 `---` 之间，`---` 后面是正文。多个标签用英文逗号分隔。

如果想置顶，加一行 `pinned: true`：

```markdown
# 文章标题
date: 2026-06-05
tags: 标签1, 标签2
time: 14:20
readTime: 3 分钟
pinned: true
---
正文...
```

## 一键推送

```bash
./deploy.sh
```

脚本自动：构建索引 → git add → commit → push。也可加自定义信息：

```bash
./deploy.sh "add: 文章标题"
```

## 手动推送

```bash
node build.js          # 构建索引
git add -A
git commit -m "add: 标题"
git push               # 推送上线
```

推送后 GitHub Pages 自动部署，等一两分钟就能看到。

## 添加画廊相册

在 `albums/index.json` 里添加一个对象即可，无需改代码，无需跑构建：

```json
{
  "id": "my-album",
  "title": "相册标题",
  "description": "简介",
  "cover": "https://example.com/cover.jpg",
  "date": "2026.06",
  "photos": [
    { "url": "https://example.com/photo1.jpg" },
    { "url": "https://example.com/photo2.jpg" }
  ]
}
```

- `id` —— 唯一标识，字母+短横线
- `title` —— 标题
- `description` —— 选填，简介文字
- `cover` —— 封面图
- `date` —— 日期
- `photos` —— 照片 URL 列表，点击可放大

支持任意图片 URL，建议用竖构图照片，在瀑布流里效果更好。

## 关于其他子站

MC 状态、导航页这些子站很多只是空壳，进不去是正常的。有内容的话会在这里更新。

## 本地预览

直接用浏览器打开 `index.html` 即可预览，文章从 `posts/` 动态加载。
