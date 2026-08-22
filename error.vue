<script setup>
const props = defineProps({ error: Object })
function goHome () { clearError({ redirect: '/' }) }
</script>

<template>
  <div class="container" id="app">
    <div class="article-card">
      <div class="article-body" style="text-align:center;">
        <h1 class="article-title">{{ error?.statusCode === 404 ? '404' : '出错了' }}</h1>
        <p style="margin:0.6rem 0 1.4rem;">
          {{ error?.statusCode === 404 ? '页面不存在或已被移动。' : '发生了一点意外，请稍后再试。' }}
        </p>
        <a href="#" class="back-link" @click.prevent="goHome">返回首页</a>
      </div>
    </div>
  </div>
</template>
