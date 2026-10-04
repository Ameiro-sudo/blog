// Lighthouse 的门禁配置。
//
// **不用 preset。** 之前试过 `preset: 'lighthouse:recommended'`，第一次跑就红了
// 18 条：bf-cache / forced-reflow-insight / image-delivery-insight /
// lcp-discovery-insight / network-dependency-tree-insight / unminified-css /
// unused-css-rules / unused-javascript …… 里面没有一条是「这个站最近变差了」，
// 全是「Google 有一条 audit 而这个站没满分」。对个人博客来说那不是门禁，
// 是罚站，而罚站的红会被习惯性忽略，忽略的红等于没有红。
//
// 所以这里只断言两类东西：
//   1. 四个类别的分数——防止整体退步
//   2. 两条我亲手修过、且想钉住不许退回去的：压缩与缓存（serve-dist 不开这两样
//      时实测 performance 是 68 而不是 84）
// 外加 FCP/LCP 两条警告级的红线——加载层写死 1 秒那次就是它们能咬住的那类回归，
// 等 CSS 渲染阻塞解决后把 warn 改成 error。
//
// 阈值对着本地实测反推（2026-10-05，Chrome 稳定版，模拟节流单次跑，
// 经 scripts/serve-dist.cjs 带 gzip + cache-control 起服务）：
//   accessibility / best-practices / seo = 100  -> 门槛 100，不许退
//   performance = 84                          -> 门槛 75（没开 gzip 时是 68，
//                                               加载层写死 1s 时更差）
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
      assertions: {
        'categories:performance': ['error', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],

        // 传输层这两条是 serve-dist.cjs 提供的。少一样，这个站的分数就会掉回 68。
        'uses-text-compression': ['error', { minScore: 1 }],
        'uses-long-cache-ttl': ['error', { minScore: 1 }],

        // 加载层回归的红线。LCP 元素目前就是 #loader 里那句「正在连接雪境」，
        // 所以它同时是「加载层多久撤下」的度量——写死 1 秒那次它冲到 4s+。
        'first-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 6000 }]
      }
    }
    // 不配 upload：temporary-public-storage 会把报告传到 Google 的公开桶里，
    // 那是往外部发数据，不该由一个门禁配置默认替人决定。要传就显式加。
  }
}