// SnowBlock 博客 · Nuxt 3 SSG 配置
// 策略：现有 assets/ 目录原样作为静态资源按原 URL 提供（copy-static.js 并入产物），
// CSS 走 <link> 直连不做 Vite 处理，保证视觉零回归。
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// 这里原来还读 content/posts/index.json、把每篇文章的路由手工展开进 prerender.routes——
// 因为文章卡片当时是 <div role="button"> 而不是链接，crawlLinks 爬不到第 2 页起的文章。
// 卡片改成 NuxtLink 之后链接就在 DOM 里，crawlLinks 自己能发现，那段展开连同它对
// build.js 产物的隐式依赖一起删掉了：配置文件不该在**加载期**去读另一个脚本的输出。
//
// 唯一读 site.config.json 的地方还在（下面 OG 那些 meta 用）。
const ROOT = dirname(fileURLToPath(import.meta.url))
const siteConfig = JSON.parse(readFileSync(resolve(ROOT, 'site.config.json'), 'utf-8'))
const SITE = siteConfig.SITE_URL
const OG = siteConfig.ogDefaults

export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  ssr: true,
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/', '/posts'],
      // 单篇失败不吞掉整站构建，错误会在日志里可见
      failOnError: false,
    },
  },
  app: {
    // 路由切换过渡：旧 SPA 是 hash 整页闪切，Vue 下用淡入上移平滑衔接
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'SnowBlock · 雪地笔记',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
        // 内容安全策略。写在 nuxt.config 里而不是某个 .vue 的 <head>：
        // SSG 的每一页 HTML 都是从这一份配置生成的，写在页面里只会覆盖到那一页。
        //
        // 两个 'unsafe-inline' 都是**已知且必要**的，写在这里是为了下一个人
        // 知道它是买来的而不是漏掉的：
        //   script-src —— Nuxt SSG 会把 hydration 数据以内联 <script> 注入每个页面，
        //                另外 head.script 里那两段（防暗色闪烁、FA 样式表回填）
        //                本来就刻意做成内联的。
        //   style-src  —— Nuxt 默认把组件样式内联进 <style> 块。
        // 真正白拿的是 base-uri / form-action / object-src：它们拦的是注入进来的
        // 表单提交与 base 标签改写，跟内联脚本无关。frame-ancestors 只能走 HTTP
        // 响应头，写在 <meta> 里会被浏览器忽略并每页刷一条警告，所以不写
        // （A 站与 B 站的策略里也是同样的处理，注释写在那边）。
        {
          // 键名必须是 'http-equiv'。写成 `httpEquiv` 时 unhead 会原样输出成
          // `httpequiv=` —— 浏览器不认这个属性，整条策略**静默失效**，而且
          // 产物里看上去是有 meta 的。这属于「配了但等于没配」的一种。
          'http-equiv': 'Content-Security-Policy',
          content: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self'",
            "img-src 'self' data: blob:",
            "connect-src 'self'",
            "base-uri 'none'",
            "form-action 'self'",
            "object-src 'none'",
          ].join('; '),
        },
        { name: 'description', content: 'SnowBlock 博客 — 技术、游戏、日常与碎片思考' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#f2efe9' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0b2b3b' },
        { name: 'color-scheme', content: 'light dark' },
        { property: 'og:title', content: OG.title },
        { property: 'og:description', content: OG.description },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'zh_CN' },
        { property: 'og:url', content: SITE },
        { property: 'og:image', content: OG.image },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'SnowBlock · 博客 — 雪地笔记' },
        { property: 'og:site_name', content: 'SnowBlock' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: OG.title },
        { name: 'twitter:description', content: OG.description },
        { name: 'twitter:image', content: OG.image }
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
          // FA 异步样式表加载完成后恢复生效（对应旧站 onload="this.media='all'"）。
          // 必须同时兜住「样式表先于本脚本加载完」这一路：那种情况下 load 事件早已
          // 触发过，只挂监听会永远等不到，media 永久停在 print，全站图标消失
          // （实测线上约 1/4 的访问命中）。
          innerHTML: "(function(){var l=document.querySelector('link[href*=\"font-awesome\"][media=\"print\"]');if(!l)return;var go=function(){l.media='all'};if(l.sheet){go();return}l.addEventListener('load',go,{once:true});l.addEventListener('error',go,{once:true})})()",
          tagPosition: 'bodyClose'
        }
      ],
      style: [
        {
          // 关键内联样式：在外部 CSS 就位前的窗口期只渲染加载层（不透明、定尺寸），
          // 杜绝「无样式界面瞬时闪现」——任何首帧都不可能露出未装饰的内容
          innerHTML: "html{background:#f2efe9}html.dark{background:#0b2b3b}#loader{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#e8eef2;font-family:system-ui,'Segoe UI',sans-serif}html.dark #loader{background:#12222c}.crystal-wrapper{position:relative;width:90px;height:90px;display:flex;align-items:center;justify-content:center}.crystal-svg{width:90px;height:90px;display:block}.loader-text-frost{margin-top:1.1rem;color:#5b8aa6;font-size:1.25rem;text-align:center}.loader-dots{display:flex;gap:6px;margin-top:.6rem}.loader-dots span{width:6px;height:6px;border-radius:50%;background:#8fd8ef}"
        }
      ]
    }
  }
})

