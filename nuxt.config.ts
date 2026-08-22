// SnowBlock 博客 · Nuxt 3 SSG 配置
// 策略：现有 assets/ 目录原样作为静态资源按原 URL 提供（copy-static.js 并入产物），
// CSS 走 <link> 直连不做 Vite 处理，保证视觉零回归。
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// 文章路由显式展开：列表分页是按钮而非链接，仅靠爬虫会漏掉第 2 页起的文章
const postRoutes = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'content/posts/index.json'), 'utf-8')
).map((p: { id: string }) => '/posts/' + p.id)

export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  ssr: true,
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/', '/posts', ...postRoutes],
      // 单篇失败不吞掉整站构建，错误会在日志里可见
      failOnError: false,
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'SnowBlock · 雪地笔记',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
        { name: 'description', content: 'SnowBlock 博客 — 技术、游戏、日常与碎片思考' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#f2efe9' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0b2b3b' },
        { name: 'color-scheme', content: 'light dark' },
        { property: 'og:title', content: 'SnowBlock · 博客' },
        { property: 'og:description', content: '雪地笔记 — 技术、游戏、日常与碎片思考' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'zh_CN' },
        { property: 'og:url', content: 'https://blog.snowblock.top' },
        { property: 'og:image', content: 'https://blog.snowblock.top/assets/brand/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'SnowBlock · 博客 — 雪地笔记' },
        { property: 'og:site_name', content: 'SnowBlock' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'SnowBlock · 博客' },
        { name: 'twitter:description', content: '雪地笔记 — 技术、游戏、日常与碎片思考' },
        { name: 'twitter:image', content: 'https://blog.snowblock.top/assets/brand/og-image.png' }
      ],
      link: [
        { rel: 'icon', href: '/assets/brand/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/svg+xml', href: '/assets/brand/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/assets/brand/apple-touch-icon.png' },
        { rel: 'preload', href: '/assets/vendor/images/bg.webp', as: 'image', media: '(orientation: landscape)', fetchpriority: 'low' },
        { rel: 'preload', href: '/assets/vendor/images/bg-portrait.webp', as: 'image', media: '(orientation: portrait)', fetchpriority: 'low' },
        { rel: 'stylesheet', href: '/assets/vendor/fonts/ZCOOL_KuaiLe.css' },
        { rel: 'stylesheet', href: '/assets/vendor/highlight.js@11.9.0/styles/atom-one-dark.min.css' },
        // FA 字体不挡首屏：异步加载（与旧站一致的渐进策略）
        { rel: 'stylesheet', href: '/assets/vendor/font-awesome@6.5.1/css/all.min.css', media: 'print' },
        { rel: 'stylesheet', href: '/assets/css/tokens.css' },
        { rel: 'stylesheet', href: '/assets/css/style.css' },
        { rel: 'stylesheet', href: '/assets/css/toast.css' },
        { rel: 'stylesheet', href: '/assets/css/shell.css' }
      ],
      script: [
        {
          // 防暗色模式闪烁（FOUC）：首字节就位前决定 html.dark
          innerHTML: "try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}"
        },
        {
          // FA 异步样式表加载完成后恢复生效（对应旧站 onload="this.media='all'"）
          innerHTML: "document.querySelector('link[href*=\"font-awesome\"][media=\"print\"]')?.addEventListener('load',function(){this.media='all'})",
          tagPosition: 'bodyClose'
        }
      ]
    }
  }
})

