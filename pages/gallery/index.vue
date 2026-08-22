<script setup>
import albumsAll from '~/content/albums/index.json'

useHead({
  title: '画廊 · SnowBlock',
  meta: [{ property: 'og:title', content: '画廊 · SnowBlock' }]
})

function abs (u) {
  if (!u) return ''
  if (/^(https?:)?\/\//.test(u)) return u
  return u.startsWith('/') ? u : '/' + u
}
// 相册卡片的三层堆叠封面：底两层取前两张照片，顶层固定用 cover（与旧 renderList 一致）
function layerImg (a, i) {
  return abs(i === 2 || !a.photos[i] ? a.cover : a.photos[i].url)
}
</script>

<template>
  <div>
    <div class="gallery-wrap">
      <div class="gallery-header"><h1>照片墙</h1></div>
      <div v-if="albumsAll.length" class="album-grid">
        <NuxtLink
          v-for="(a, idx) in albumsAll"
          :key="a.id"
          :to="`/gallery/${a.id}`"
          class="album-card"
          :style="{ animationDelay: Math.min(idx * 0.08, 0.8) + 's' }"
        >
          <div class="album-stack">
            <div v-for="i in 3" :key="i" class="album-layer" :class="`album-layer-${i - 1}`">
              <img :src="layerImg(a, i - 1)" alt="" loading="lazy">
            </div>
          </div>
          <div class="album-info">
            <div class="album-title">{{ a.title }}</div>
            <div class="album-date">{{ a.date }}</div>
            <div v-if="a.description" class="album-desc">{{ a.description }}</div>
          </div>
        </NuxtLink>
      </div>
      <div v-else class="state-empty">暂无相册</div>
    </div>
  </div>
</template>