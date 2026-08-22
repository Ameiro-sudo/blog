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

文章 · 相册 · 说说 · 友链 · 归档热力图 · 随机文章

## 技术

markdown-it + DOMPurify + highlight.js · Node 构建 · CI/CD

> 雪落无声,码字有声。

---

## 架构（Nuxt 3 SSG）

自 v2 起博客迁移为 Nuxt 3 静态生成：真实路由（`/posts/<id>/` 等），Markdown 在构建期由
`scripts/build.js` 渲染为消毒后的 HTML payload，前端零运行时 Markdown 解析。

```bash
npm install        # 含 nuxt / markdown-it / highlight.js / sanitize-html
npm run dev        # 本地开发（先跑内容索引再起 nuxt dev）
npm run build      # 索引 → nuxt generate → assets 并入 .output/public
npx serve .output/public   # 或 node scripts/serve-dist.cjs 本地预览产物
```

- 内容管线不变：`content/posts/*.md` + frontmatter → 各 `index.json` 与文章 payload
- 视觉零回归：`assets/css/*` 与全部静态资源按原 URL 提供（copy-static.js 并入产物）
- 部署：CI 将 `.output/public` 发布到 gh-pages 分支（CNAME/.nojekyll 在 public/ 内）