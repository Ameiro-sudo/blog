<script setup>
import siteConfig from '~/site.config.json'
import postsAll from '~/content/posts/index.json'
import momentsAll from '~/content/moments/index.json'
import albumsAll from '~/content/albums/index.json'

// 索引数据均为构建管线产物，构建期静态导入（SSG 零运行时请求）
const posts = ref(postsAll)
const moments = ref(momentsAll)
const albums = ref(albumsAll)

useHead({ title: 'SnowBlock · 雪地笔记' })

function abs (u) {
  if (!u) return ''
  if (/^(https?:)?\/\//.test(u)) return u
  return u.startsWith('/') ? u : '/' + u
}

// —— 个人卡片（对应旧 app.profile.render）——
const profile = siteConfig.profile || {}
const avatarSrc = abs(profile.avatar)
const profileLinks = (profile.links || []).map(l => ({
  ...l,
  iconSrc: l.icon ? '/assets/vendor/iconify/' + l.icon.replace('/', '-') + '.svg' : ''
}))
const statPosts = posts.value.length
const statAlbums = albums.value.length
const statTags = new Set((posts.value || []).flatMap(p => p.tags || [])).size

// —— 最新文章（对应旧 app.home.renderPosts）——
const hero = computed(() => (posts.value || [])[0])
const rest = computed(() => (posts.value || []).slice(1, 4))
const cardGradients = [
  'linear-gradient(135deg,#16334d,#2a6b94)',
  'linear-gradient(135deg,#232a4d,#4a5f9e)',
  'linear-gradient(135deg,#123f44,#2e7f86)',
  'linear-gradient(135deg,#3d2f55,#6a4f9e)'
]
function coverStyle (p, i) {
  return p.image
    ? `background-image:url(${abs(p.image)});background-size:cover;background-position:center;`
    : `background:${cardGradients[(i || 0) % cardGradients.length]};`
}
function heroStyle (p) {
  return p && p.image
    ? `background-image:url(${abs(p.image)});background-size:cover;background-position:center;`
    : 'background:#2a6390;'
}

// —— 最新说说（前 3 条）——
const latestMoments = computed(() => (moments.value || []).slice(0, 3))

// —— 照片墙轮播（对应旧 app.home.renderPhotos）——
const photos = computed(() => {
  const out = []
  for (const a of (albums.value || [])) {
    const list = (a.photos && a.photos.length) ? a.photos : (a.cover ? [{ url: a.cover }] : [])
    for (const p of list) out.push({ url: p.url, album: a.id })
  }
  return out
})
const photoIdx = ref(0)
const photoUrl = ref('')
let photoTimer = null
function showPhoto (i) {
  if (!photos.value.length) return
  photoIdx.value = (i + photos.value.length) % photos.value.length
  photoUrl.value = abs(photos.value[photoIdx.value].url)
}
function startPhotoTimer () {
  stopPhotoTimer()
  photoTimer = setInterval(() => showPhoto(photoIdx.value + 1), 4000)
}
function stopPhotoTimer () { if (photoTimer) clearInterval(photoTimer); photoTimer = null }
onMounted(() => { showPhoto(0); startPhotoTimer() })
onBeforeUnmount(stopPhotoTimer)
</script>

<template>
  <div id="homeDashboard">
    <div class="home-row">
      <div class="home-col-main">
        <!-- 个人卡片 -->
        <div id="profileCard" v-if="profile.name">
          <div class="profile-wrap">
            <span v-if="avatarSrc" class="profile-avatar-ring">
              <img class="profile-avatar" :src="avatarSrc" alt="avatar">
            </span>
            <NuxtLink to="https://snowblock.top" class="profile-name">{{ profile.name }}</NuxtLink>
            <div class="profile-divider"></div>
            <div v-if="profile.bio" class="profile-bio">{{ profile.bio }}</div>
            <div class="profile-stats">
              <div class="stat-item"><div class="stat-num">{{ statPosts }}</div><div class="stat-label">文章</div></div>
              <div class="stat-divider"></div>
              <div class="stat-item"><div class="stat-num">{{ statAlbums }}</div><div class="stat-label">相册</div></div>
              <div class="stat-divider"></div>
              <div class="stat-item"><div class="stat-num">{{ statTags }}</div><div class="stat-label">标签</div></div>
            </div>
            <div v-if="profileLinks.length" class="profile-links">
              <a v-for="l in profileLinks" :key="l.url" :href="l.url" target="_blank" rel="noopener" :title="l.name">
                <img v-if="l.iconSrc" :src="l.iconSrc" :alt="l.name" class="profile-icon">
                <template v-else>{{ l.name }}</template>
              </a>
            </div>
          </div>
        </div>

        <!-- 最新文章 -->
        <div class="home-panel">
          <div class="home-panel-title"><i class="fa-solid fa-book-open"></i> 最新文章</div>
          <div id="homePostsBody">
            <template v-if="hero">
              <NuxtLink class="home-hero" :to="`/posts/${hero.id}`" :style="heroStyle(hero)">
                <div class="home-hero-mask"></div>
                <div class="home-hero-info">
                  <h3 class="home-hero-title">{{ hero.title }}</h3>
                  <div class="home-hero-meta">{{ hero.date }}<template v-if="hero.readTime"> · {{ hero.readTime }}</template></div>
                </div>
              </NuxtLink>
              <div v-if="rest.length" class="home-post-row">
                <NuxtLink
                  v-for="(p, i) in rest"
                  :key="p.id"
                  class="home-post-card"
                  :to="`/posts/${p.id}`"
                  :style="coverStyle(p, i)"
                >
                  <div class="home-post-card-mask"></div>
                  <div class="home-post-card-info">
                    <div class="home-post-card-title">{{ p.title }}</div>
                    <div class="home-post-card-date">{{ p.date }}</div>
                  </div>
                </NuxtLink>
              </div>
            </template>
            <div v-else class="home-empty">暂无文章</div>
            <NuxtLink class="home-more" to="/posts">全部文章 <i class="fa-solid fa-arrow-right"></i></NuxtLink>
          </div>
        </div>
      </div>

      <div class="home-col-side">
        <!-- 最新说说 -->
        <div class="home-panel">
          <div class="home-panel-title"><i class="fa-solid fa-message"></i> 最新说说</div>
          <div id="homeMomentsBody">
            <div v-if="latestMoments.length" class="home-moments">
              <div v-for="(m, i) in latestMoments" :key="i" class="home-moment">
                <div class="home-moment-dot"></div>
                <div class="home-moment-text">{{ m.text }}</div>
                <div class="home-moment-time">{{ m.time }}</div>
              </div>
            </div>
            <div v-else class="home-empty">暂无说说</div>
            <NuxtLink class="home-more" to="/moments">更多说说 <i class="fa-solid fa-arrow-right"></i></NuxtLink>
          </div>
        </div>

        <!-- 照片墙 -->
        <div class="home-panel home-photo-panel">
          <div class="home-panel-title"><i class="fa-solid fa-camera"></i> 照片墙</div>
          <div id="homePhotosBody">
            <div v-if="photos.length" class="home-photo" @click="navigateTo('/gallery')" @mouseenter="stopPhotoTimer" @mouseleave="startPhotoTimer">
              <img :src="photoUrl" alt="">
            </div>
            <div v-else class="home-empty">暂无照片</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



