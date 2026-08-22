<script setup>
import postsAll from '~/content/posts/index.json'

const route = useRoute()
const id = String(route.params.id)

// 文章 payload（元数据 + 构建期渲染消毒后的 HTML）按需懒加载：
// import.meta.glob 生成动态导入映射，SSG 时所用数据会被内联进页面
if (!/^[\w-]+$/.test(id)) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', message: '文章不存在', fatal: true })
}
const payloadLoaders = import.meta.glob('../../content/posts/post*.json')
const loader = payloadLoaders[`../../content/posts/${id}.json`]
if (!loader) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', message: '文章不存在', fatal: true })
}
const mod = await loader()
const post = ref(mod.default)

const allPosts = ref(postsAll)

const SITE = 'https://blog.snowblock.top'
function abs (u) {
  if (!u) return ''
  if (/^(https?:)?\/\//.test(u)) return u
  return u.startsWith('/') ? u : '/' + u
}
function esc (s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function tagCls (t) {
  let cls = 'tag'
  if (t === 'Bash' || t === '终端') cls += ' bash'
  else if (['表格', '数据'].includes(t)) cls += ' test'
  else cls += ' tech'
  return cls
}

const wcLabel = computed(() => {
  const wc = post.value.wc || 0
  return wc > 999 ? (wc / 1000).toFixed(1) + 'k' : String(wc)
})

// —— 相关文章：共享标签数 Top3（对应旧 app.article.renderRelated）——
const related = computed(() => {
  const cur = post.value
  const scored = (allPosts.value || [])
    .filter(p => p.id !== cur.id)
    .map(p => ({ post: p, score: (p.tags || []).filter(t => (cur.tags || []).includes(t)).length }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  return scored.map(s => s.post)
})

useHead({
  title: `${post.value.title} · SnowBlock`,
  meta: [
    { property: 'og:title', content: post.value.title },
    { property: 'og:description', content: post.value.description || post.value.excerpt || '' },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `${SITE}/posts/${id}/` },
    { property: 'og:image', content: abs(post.value.image) || `${SITE}/assets/brand/og-image.png` },
    { name: 'description', content: post.value.description || post.value.excerpt || '' }
  ],
  link: [{ rel: 'canonical', href: `${SITE}/posts/${id}/` }]
})

// 代码块复制按钮（构建期已生成 DOM，这里只挂事件）
const bodyEl = ref(null)
function onCopyClick (e) {
  const btn = e.target.closest('.copy-btn')
  if (!btn) return
  const wrapper = btn.closest('.code-block-wrapper')
  const pre = wrapper && wrapper.querySelector('pre')
  if (!pre) return
  navigator.clipboard.writeText(pre.innerText).then(() => {
    btn.textContent = '已复制 V'
    btn.classList.add('copied')
    setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied') }, 2000)
  }).catch(() => {
    btn.textContent = '失败'
    setTimeout(() => { btn.textContent = '复制' }, 1500)
  })
}
onMounted(() => {
  bodyEl.value?.addEventListener('click', onCopyClick)
})
onBeforeUnmount(() => {
  bodyEl.value?.removeEventListener('click', onCopyClick)
})
</script>

<template>
  <div>
    <div class="article-card">
      <div class="article-body">
        <h1 class="article-title" id="articleTitle">{{ post.title }}</h1>
        <div class="article-meta" id="articleMeta">
          {{ post.date }} . {{ post.time }} . {{ post.readTime }} . {{ wcLabel }}字
          <span v-for="t in post.tags" :key="t" :class="tagCls(t)">{{ t }}</span>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html —— 内容为构建期 sanitize-html 白名单消毒产物 -->
        <div ref="bodyEl" class="article-content" id="articleContent" v-html="post.html"></div>

        <div v-if="related.length" class="related-wrap">
          <div class="related-title">相关文章</div>
          <div class="related-grid">
            <NuxtLink v-for="r in related" :key="r.id" class="related-card" :to="`/posts/${r.id}`">
              <div class="related-card-title">{{ r.title }}</div>
              <div class="related-card-date">{{ r.date }}</div>
            </NuxtLink>
          </div>
        </div>

        <NuxtLink to="/posts" class="back-link">&lt; 返回文章列表</NuxtLink>
      </div>
    </div>
  </div>
</template>


