<script setup>
import momentsAll from '~/content/moments/index.json'

useHead({
  title: '说说 · SnowBlock',
  meta: [{ property: 'og:title', content: '说说 · SnowBlock' }]
})
</script>

<template>
  <div>
    <div class="module-wrap">
      <div class="module-header"><h1>说说</h1></div>
      <div class="module-body">
        <div v-if="momentsAll.length" class="moments-list">
          <div v-for="(m, i) in momentsAll" :key="i" class="moment-item">
            <span class="moment-dot"></span>
            <div class="moment-content">
              <div class="moment-text">{{ m.text }}</div>
              <div class="moment-time"><i class="fa-solid fa-clock"></i> {{ m.time }}</div>
            </div>
          </div>
        </div>
        <div v-else class="state-empty">暂无说说</div>
      </div>
    </div>
  </div>
</template>