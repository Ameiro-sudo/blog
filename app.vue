<script setup>
const route = useRoute()

// 与旧版 router.setActiveNav 相同的七个分区
const navs = [
  { key: 'home', label: '首页', icon: 'fa-house', to: '/', match: p => p === '/' },
  { key: 'posts', label: '文章', icon: 'fa-book-open', to: '/posts', match: p => p.startsWith('/posts') },
  { key: 'archive', label: '归档', icon: 'fa-clock', to: '/archive', match: p => p.startsWith('/archive') },
  { key: 'gallery', label: '相册', icon: 'fa-camera', to: '/gallery', match: p => p.startsWith('/gallery') },
  { key: 'moments', label: '说说', icon: 'fa-message', to: '/moments', match: p => p.startsWith('/moments') },
  { key: 'friends', label: '友链', icon: 'fa-handshake', to: '/friends', match: p => p.startsWith('/friends') },
  { key: 'about', label: '关于', icon: 'fa-user', to: '/about', match: p => p.startsWith('/about') }
]

function isActiveCls (n) {
  return n.match(route.path) ? 'active' : ''
}

const dark = ref(false)
const showTop = ref(false)

// —— 移动端菜单（CSS 侧 .topbar-menu / .nav-links.open 早已就绪，这里补上元素与状态）——
const menuOpen = ref(false)
function toggleMenu () { menuOpen.value = !menuOpen.value }
function closeMenu () { menuOpen.value = false }
watch(() => route.path, closeMenu)

// —— 加载层 ——
// 这里原来是一个写死的 setTimeout(hideLoader, 1000)：任何网络条件下用户都要先看
// 1 秒全屏 #loader，LCP 被硬生生推后至少 1000ms。而它又是**纯计时器**——bg.webp
// （140KB）1 秒后还没到，hideLoader 照样执行，背景位先闪一下底色再补上。
//
// 改成「就绪或兜底，谁先到谁撤」。就绪信号两个：
//   document.fonts.ready —— ZCOOL KuaiLe 晚到，标题会先回退成系统字体再跳一下
//   bg.webp 的 decode()   —— body::after 用的就是它，早撤会先闪 --color-bg-deep
// 兜底 600ms：正常网络远早于它到达，慢网络不再额外受罚。
const LOADER_FALLBACK_MS = 600
const loaderHidden = ref(false)
const loaderGone = ref(false)

function hideLoader () {
  if (loaderHidden.value) return
  loaderHidden.value = true
  document.body.classList.add('bg-loaded')
}

function loaderReady () {
  const waits = []
  // fonts.ready 在不支持的浏览器上是 undefined，这里当已就绪
  if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready)
  // 与 CSS 里 body::after 引的是同一个 URL，走同一份 HTTP 缓存，不会多下一遍。
  // decode() 在图片还没挂到文档上也能跑；失败（404 / 解码错误）不算就绪信号，
  // 由 600ms 兜底接手。
  const bg = new Image()
  bg.src = '/assets/vendor/images/bg.webp'
  waits.push(bg.decode ? bg.decode().catch(() => {}) : Promise.resolve())
  return Promise.all(waits)
}

// —— 雪花层（旧版 snowCanvas 粒子系统：30fps + 移动端减半 + reduced-motion 停止）——
const snowEl = ref(null)

function startSnow () {
  const canvas = snowEl.value
  if (!canvas || !canvas.getContext) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const ctx = canvas.getContext('2d')
  let W = 0
  let H = 0
  let rafId = 0
  let frame = 0
  const isMobile = window.innerWidth < 768
  const COUNT = isMobile ? 15 : 30
  const createParticle = () => ({
    x: Math.random() * W,
    y: Math.random() * H - 20,
    r: Math.random() * 2.4 + 1,
    s: Math.random() * 0.6 + 0.2,
    w: Math.random() * 0.3 - 0.12,
    a: Math.random() * 0.4 + 0.15
  })
  let particles = []
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
  const draw = () => {
    frame++
    if (frame % 2 === 0) {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,' + p.a + ')'
        ctx.fill()
        p.y += p.s
        p.x += p.w
        if (p.y > H + 25) particles[i] = createParticle()
        if (p.x > W + 20) p.x = -15
        else if (p.x < -20) p.x = W + 10
      }
      while (particles.length < COUNT) particles.push(createParticle())
    }
    rafId = requestAnimationFrame(draw)
  }
  window.addEventListener('resize', resize)
  resize()
  particles = Array.from({ length: COUNT }, createParticle)
  draw()
  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
  })
}

let loaderCap = 0
onMounted(() => {
  dark.value = document.documentElement.classList.contains('dark')
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // 就绪先到就撤；600ms 兜底保证再慢的网络也不会被加载层一直挡着
  loaderCap = window.setTimeout(hideLoader, LOADER_FALLBACK_MS)
  loaderReady().then(() => { clearTimeout(loaderCap); hideLoader() })
  startSnow()
})

/* 主题切换的整场过渡由 <html>.theme-shift 统一扫一遍，扫完立刻撤掉——
   不撤的话它会一直用 !important 压着全站每张卡片自己的 transition，
   鼠标划过就只有 350ms 一个速度（见 style.css 里那条规则的注释）。 */
let themeShiftTimer = 0
function toggleTheme () {
  dark.value = !dark.value
  const el = document.documentElement
  el.classList.toggle('dark', dark.value)
  el.classList.add('theme-shift')
  if (themeShiftTimer) clearTimeout(themeShiftTimer)
  // 400ms > 那条规则的 350ms，多留半档让最后一批属性收完再撤
  themeShiftTimer = window.setTimeout(() => el.classList.remove('theme-shift'), 400)
  try { localStorage.setItem('theme', dark.value ? 'dark' : 'light') } catch (e) {}
}

function onScroll () { showTop.value = window.scrollY > 300 }
function toTop () { window.scrollTo({ top: 0, behavior: 'smooth' }) }

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (themeShiftTimer) clearTimeout(themeShiftTimer)
  if (loaderCap) clearTimeout(loaderCap)
})
</script>

<template>
  <!-- ===== 加载层（保留在 DOM：#loader.hidden~#snowCanvas 的显隐依赖兄弟选择器）
       aria-hidden：这段文字「正在连接雪境」是唯一落在任何 landmark 之外的内容，
       axe 的 region 规则会在**加载层还可见的那 600ms 里**逐页报一次
       （而 @axe-core/cli 恰好就在这一刻扫）。更要紧的是它对读屏用户没有价值——
       一个不透明全屏浮层里的孤零零一句话，没有上下文、紧接着就被真实内容取代。
       另外两个站的加载层都已经是 aria-hidden，这里是唯一漏下的一个。 ===== -->
  <div id="loader" aria-hidden="true" :class="{ hidden: loaderHidden }" :style="loaderGone ? { display: 'none' } : null" @transitionend="loaderGone = true">
    <div class="loader-crystal">
      <div class="crystal-wrapper">
        <div class="crystal-glow"></div>
        <svg class="crystal-svg" width="90" height="90" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path class="main-line" stroke="#8fd8ef" stroke-width="2.2" stroke-linecap="round" fill="none" d="M50 5 L50 95
 M50 5 L75 25 L50 50
 M50 5 L25 25 L50 50
 M50 95 L75 75 L50 50
 M50 95 L25 75 L50 50
 M50 50 L95 50
 M75 25 L95 50
 M25 25 L5 50
 M75 75 L95 50
 M25 75 L5 50" />
          <path class="inner-line" stroke="#c0f0ff" stroke-width="1.4" stroke-linecap="round" fill="none" d="M50 15 L50 85
 M50 15 L65 30 L50 50
 M50 15 L35 30 L50 50
 M50 85 L65 70 L50 50
 M50 85 L35 70 L50 50
 M50 50 L85 50
 M65 30 L85 50
 M35 30 L15 50
 M65 70 L85 50
 M35 70 L15 50" />
          <path class="core-line" stroke="#ffe6b0" stroke-width="1.8" stroke-linecap="round" fill="none" d="M50 38 L50 62
 M50 38 L57 44 L50 50
 M50 38 L43 44 L50 50
 M50 62 L57 56 L50 50
 M50 62 L43 56 L50 50
 M50 50 L62 50
 M57 44 L62 50
 M43 44 L38 50
 M57 56 L62 50
 M43 56 L38 50" />
        </svg>
      </div>
      <div class="loader-text-frost"><svg viewBox="0 0 24 24" width="17" height="17" style="vertical-align:-0.15em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M4 7l16 10M20 7L4 17"/></svg> 正在连接雪境</div>
      <div class="loader-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>

  <canvas id="snowCanvas" ref="snowEl" aria-hidden="true"></canvas>

  <div class="toast" id="toast" aria-live="polite"></div>
  <button id="backToTop" aria-label="回到顶部" :class="{ show: showTop }" @click="toTop">^</button>

  <div class="container" id="app">
    <header class="top-bar">
      <div class="top-bar-inner">
        <NuxtLink to="/" class="site-name"><i class="fa-solid fa-snowflake"></i> SnowBlock</NuxtLink>
        <nav class="nav-links" id="navLinks" :class="{ open: menuOpen }" @click="closeMenu">
          <NuxtLink
            v-for="n in navs"
            :key="n.key"
            :to="n.to"
            :class="isActiveCls(n)"
          ><i class="fa-solid" :class="n.icon"></i><span>{{ n.label }}</span></NuxtLink>
        </nav>
        <div class="topbar-actions">
          <button
            id="navToggle"
            class="topbar-menu topbar-btn"
            aria-label="切换导航菜单"
            aria-controls="navLinks"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            @click="toggleMenu"
          ><i class="fa-solid fa-bars" :class="{ open: menuOpen }"></i></button>
          <button id="themeToggle" class="topbar-btn" aria-label="切换主题" title="切换主题" @click="toggleTheme">
            <Transition name="ti" mode="out-in">
              <i id="themeIcon" :key="dark ? 'sun' : 'moon'" class="fa-solid" :class="dark ? 'fa-sun' : 'fa-moon'"></i>
            </Transition>
          </button>
        </div>
      </div>
    </header>

    <!-- 页���内容包在 <main> 里。
         每个页面自己的根元素都是一个裸 <div>，所以整站**一个 main landmark 都没有**——
         axe 的 landmark-one-main 在十个页面上各报一次，读屏用户只能靠「浏览模式」盲猜
         当前在哪一节。页面里那些 article-card / archive-card / module-wrap 全落在
         任何 landmark 之外，于是 region 规则又把里面每一个可交互元素逐个报一遍
         （实测 post1 一页 108 处）。

         这里只加一层语义标签，不改任何类名与层级：main 是 display:block，
         而 .container 上没有任何 `> ` 子选择器，所以布局不受影响——
         这件事由 CI 里的 visual-check 盯着（它量标题字体与横向截断）。 -->
    <main id="mainContent">
      <NuxtPage />
    </main>
  </div>
</template>
