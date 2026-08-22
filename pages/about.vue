<script setup>
import aboutPage from '~/content/pages/about.json'

// about.json 由构建管线生成（Markdown 构建期渲染 + 消毒），此处直接静态导入
const page = ref(aboutPage)

useHead({
  title: '关于 · SnowBlock',
  meta: [{ property: 'og:title', content: '关于 · SnowBlock' }]
})
</script>

<template>
  <div>
    <div class="article-card">
      <div class="article-body">
        <h1 class="article-title">关于</h1>
        <div class="article-meta"></div>
        <!-- eslint-disable-next-line vue/no-v-html —— 内容为构建期 sanitize-html 白名单消毒产物 -->
        <div class="article-content" v-html="page.html"></div>
        <NuxtLink to="/" class="back-link">&lt; 返回首页</NuxtLink>
      </div>
    </div>
  </div>
</template>

