# 图床配置：PicGo + GitHub + jsDelivr 一步到位
date: 2026-06-06
tags: 图床, PicGo, GitHub, CDN, 教程
time: 09:30
readTime: 3 分钟
---
从截图到生成可访问的图片链接，全程只需要两步，中间没有任何手动上传、等待、复制的冗余操作。

## 原理

```
截图 → Ctrl+V → PicGo 自动上传 GitHub → jsDelivr CDN 加速
                                              → 链接已复制到剪贴板
```

## 准备工作

### 1. 创建公开仓库

去 GitHub 新建一个 Public 仓库，用来存放图片。仓库名随意，比如 `my-images`。

### 2. 生成 Token

GitHub "Settings" → "Developer settings" → "Personal access tokens" → "Tokens (classic)"

点 "Generate new token"，勾选 `repo` 权限，生成后**立刻复制保存**，之后无法再次查看。

## PicGo 配置

打开 PicGo，左侧选 "图床设置" → "GitHub图床"，新建配置：

| 字段 | 填写内容 |
|------|----------|
| 设定仓库名 | `你的用户名/仓库名`（如 `ninasukiwww-png/my-images`） |
| 设定分支名 | `main` 或 `master` |
| 设定 Token | 粘贴刚才保存的 Token |
| 指定存储路径 | 如 `blog/`，保持仓库整洁 |
| 设定自定义域名 | `https://cdn.jsdelivr.net/gh/你的用户名/你的仓库名` |

保存并设为默认图床。

## 使用

在 PicGo 上传区拖入图片，或直接 `Ctrl+V` / `Cmd+V` 粘贴截图。右下角弹出成功通知后，链接已自动复制到剪贴板，直接粘贴到 Markdown 里即可：

```markdown
![](https://cdn.jsdelivr.net/gh/ninasukiwww-png/my-images/blog/xxx.jpg)
```

## 相册工作流

配合博客的画廊功能，图片上传后只需在 `albums/` 下写个 markdown 文件：

```markdown
---
title: 相册名
description: 简介
date: 2026.06
cover: photo.jpg
---
photo.jpg
photo2.jpg
photo3.jpg
```

然后运行 `node build-albums.js` 自动生成相册索引。

## 注意事项

- **上传失败**：检查网络、Token 是否过期、仓库名和分支名是否正确
- **图片不显示**：CDN 缓存需几分钟生效，或访问 `https://purge.jsdelivr.net/gh/用户名/仓库名/图片名` 强制刷新
- **同名图片**：CDN 有缓存，更新图片后需要 purge 刷新

这套流程配好后，从截图到拿到链接就真的是一步到位了。
