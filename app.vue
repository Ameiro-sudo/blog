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

function toggleTheme () {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  try { localStorage.setItem('theme', dark.value ? 'dark' : 'light') } catch (e) {}
}

function onScroll () { showTop.value = window.scrollY > 300 }
function toTop () { window.scrollTo({ top: 0, behavior: 'smooth' }) }

onMounted(() => {
  dark.value = document.documentElement.classList.contains('dark')
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
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
            <i id="themeIcon" class="fa-solid" :class="dark ? 'fa-sun' : 'fa-moon'"></i>
          </button>
        </div>
      </div>
    </header>

    <NuxtPage />
  </div>
</template>
