# SnowBlock · 雪地笔记

一个零后端的静态博客。写 markdown,跑个脚本,GitHub Pages 托管,全站没有一台服务器。

```
$ node scripts/build.js   # 生成索引/feed/版本 hash
$ git push                # CI 自动构建部署
```

## 雪境速览

- **纯静态 SPA** — hash 路由,零后端,零数据库
- **全本地依赖** — JS/CSS/字体/图标全部在仓库里,不引 CDN
- **雪地主题** — 雪花粒子、水晶加载页、横竖屏双背景、深浅双色
- **自动部署** — push 即上线(GitHub Actions → gh-pages),顺带产出 Lighthouse 报告

## 内容

文章· 相册 · 说说 · 友链 · 归档热力图 · 随机文章

## 技术

markdown-it + DOMPurify + highlight.js · Node 构建 · CI/CD

> 雪落无声,码字有声。
