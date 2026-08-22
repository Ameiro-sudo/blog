<script setup>
import albumsAll from '~/content/albums/index.json'

const route = useRoute()
const albumId = String(route.params.album)

const album = albumsAll.find(a => a.id === albumId) || null

if (!album) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', message: '相册不存在', fatal: true })
}

useHead({
  title: `${album.title} · SnowBlock`,
  meta: [
    { property: 'og:title', content: `${album.title} · SnowBlock` },
    { property: 'og:url', content: `https://blog.snowblock.top/gallery/${albumId}/` }
  ],
  link: [{ rel: 'canonical', href: `https://blog.snowblock.top/gallery/${albumId}/` }]
})

function abs (u) {
  if (!u) return ''
  if (/^(https?:)?\/\//.test(u)) return u
  return u.startsWith('/') ? u : '/' + u
}

// —— 轻量灯箱（复用旧 #lightbox DOM/CSS；缩放平移等增强后续按需补）——
const lbShow = ref(false)
const lbSrc = ref('')
const lbExif = ref('')
function openLb (photo) {
  lbSrc.value = abs(photo.url)
  const e = photo.exif
  if (e && Object.keys(e).length) {
    const parts = []
    if (e.Make || e.Model) parts.push([e.Make, e.Model].filter(Boolean).join(' '))
    if (e.ISO) parts.push('ISO ' + e.ISO)
    if (e.FNumber) parts.push('f/' + e.FNumber)
    if (e.ExposureTime) parts.push(e.ExposureTime + 's')
    if (e.FocalLength) parts.push(e.FocalLength + 'mm')
    if (e.ImageWidth && e.ImageHeight) parts.push(e.ImageWidth + 'x' + e.ImageHeight)
    lbExif.value = parts.join(' · ')
  } else {
    lbExif.value = ''
  }
  lbShow.value = true
}
function closeLb () { lbShow.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
function onKey (e) { if (e.key === 'Escape') closeLb() }
</script>

<template>
  <div>
    <div class="album-detail-wrap">
      <div class="album-detail-top">
        <NuxtLink to="/gallery" class="album-back">&larr; 返回</NuxtLink>
      </div>
      <div class="album-detail-header">
        <div class="album-detail-title">{{ album.title }}</div>
        <div class="album-detail-meta">{{ album.date }} . {{ album.photos.length }} 个瞬间</div>
        <div v-if="album.description" class="album-detail-desc">{{ album.description }}</div>
      </div>
      <div class="photo-grid">
        <div v-for="(p, i) in album.photos" :key="i" class="photo-item">
          <img :src="abs(p.url)" alt="" loading="lazy" decoding="async" @click="openLb(p)">
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div id="lightbox" :class="{ show: lbShow }" @click.self="closeLb">
        <button id="lightbox-close" @click="closeLb">x</button>
        <img :src="lbSrc" alt="" id="lightboxImg">
        <div id="lightboxExif">{{ lbExif }}</div>
      </div>
    </Teleport>
  </div>
</template>