// Lighthouse 的门禁配置。
//
// 阈值不是拍脑袋定的，是对着本地 serve-dist 实测出来的分数反推的
// （2026-10-05，Chrome 稳定版，模拟节流单次跑）：
//
//   类别                实测     门槛     依据
//   accessibility       100      100      最近几轮 a11y 修复打下的地基，不许退
//   best-practices      100      100      同上
//   seo                 100      100      OG/canonical/sitemap 都是构建期生成的
//   performance          84       75      见下
//
// performance 为什么不是 90：这一站真正的瓶颈是渲染阻塞——nuxt.config.ts 刻意
// 用 <link> 直连 4 个 CSS 绕过 Vite（为了「保证视觉零回归」），CSS 又没压缩，
// 于是 hydration 在模拟节流下要 3.5s 才跑得到，Lighthouse 量到的 LCP 元素是
// #loader 里的那句「正在连接雪境」本身（4070ms）。这是真问题，但修它要动
// nuxt.config 的 CSS 加载策略，不在这次范围内。
//
// 门槛 75 的作用是「不许再退回去」：serve-dist 没开 gzip 之前实测是 68，
// 加载层写死 1 秒时更差。也就是说这个门槛能咬住已经修好的两类回归，
// 又给 CI runner 的抖动留了余量。真的把 CSS 压缩 + 提上去之后，把这里调高。
module.exports = {
  ci: {
    collect: {
      // 用 url 而不是 staticDistDir。staticDistDir 会让 lhci 自己起一个静态服务器，
      // 而那个服务器既不 gzip 也不发 Cache-Control——量出来的分数里有一大截是
      // 「本地服务器缺这两样能力」，不是站点慢在哪（实测 68 vs 84）。
      // 走 scripts/serve-dist.cjs 之后量的是 GitHub Pages 上真实会发生的传输情况。
      // 代价是这个服务器要已经在跑，CI 里由 visual-check 那一步负责起。
      url: ['http://127.0.0.1:4173/'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        maxWaitForFcp: 15000,
        maxWaitForLoad: 45000
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
      }
    }
    // 不配 upload：temporary-public-storage 会把报告传到 Google 的公开桶里，
    // 那是往外部发数据，不该由一个门禁配置默认替人决定。要传就显式加。
  }
}