<script setup>
import friendsAll from '~/content/friends/index.json'

useHead({
  title: '友链 · SnowBlock',
  meta: [{ property: 'og:title', content: '友链 · SnowBlock' }]
})
</script>

<template>
  <div>
    <div class="module-wrap">
      <div class="module-header"><h1>友链</h1></div>
      <div class="module-body">
        <div v-if="friendsAll.length" class="friends-grid">
          <a
            v-for="f in friendsAll"
            :key="f.url"
            class="friend-card"
            :href="f.url"
            target="_blank"
            rel="noopener"
          >
            <div class="friend-name">{{ f.name }}</div>
            <div class="friend-desc">{{ f.desc }}</div>
            <div class="friend-url">{{ f.url }}</div>
          </a>
        </div>
        <div v-else class="state-empty">暂无友链</div>
      </div>
    </div>
  </div>
</template>