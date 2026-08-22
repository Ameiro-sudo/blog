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

// —— 加载层（对应旧版内联 #loader：最短展示 1s 即撤，与背景下载解耦）——
const loaderHidden = ref(false)
const loaderGone = ref(false)

function hideLoader () {
  if (loaderHidden.value) return
  loaderHidden.value = true
  document.body.classList.add('bg-loaded')
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

onMounted(() => {
  dark.value = document.documentElement.classList.contains('dark')
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // 最短 1s 后撤下加载层（transitionend 后彻底移除，避免遮挡点击）
  setTimeout(hideLoader, 1000)
  startSnow()
})

function toggleTheme () {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  try { localStorage.setItem('theme', dark.value ? 'dark' : 'light') } catch (e) {}
}

function onScroll () { showTop.value = window.scrollY > 300 }
function toTop () { window.scrollTo({ top: 0, behavior: 'smooth' }) }

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <!-- ===== 加载层（保留在 DOM：#loader.hidden~#snowCanvas 的显隐依赖兄弟选择器） ===== -->
  <div id="loader" :class="{ hidden: loaderHidden }" :style="loaderGone ? { display: 'none' } : null" @transitionend="loaderGone = true">
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
        <nav class="nav-links" id="navLinks">
          <NuxtLink
            v-for="n in navs"
            :key="n.key"
            :to="n.to"
            :class="isActiveCls(n)"
          ><i class="fa-solid" :class="n.icon"></i><span>{{ n.label }}</span></NuxtLink>
        </nav>
        <div class="topbar-actions">
          <button id="themeToggle" class="topbar-btn" aria-label="切换主题" title="切换主题" @click="toggleTheme">
            <Transition name="ti" mode="out-in">
              <i id="themeIcon" :key="dark ? 'sun' : 'moon'" class="fa-solid" :class="dark ? 'fa-sun' : 'fa-moon'"></i>
            </Transition>
          </button>
        </div>
      </div>
    </header>

    <NuxtPage />
  </div>
</template>
