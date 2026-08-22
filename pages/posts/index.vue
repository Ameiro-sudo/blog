<script setup>
import postsAll from '~/content/posts/index.json'

const PER_PAGE = 5

// 文章索引为构建管线产物，构建期静态导入（SSG 零运行时请求）
const posts = ref(postsAll)

useHead({
  title: '文章 · SnowBlock',
  meta: [{ property: 'og:title', content: '文章 · SnowBlock' }]
})

const q = ref('')
const activeTag = ref(null)
const currentPage = ref(1)
let searchTimer = null

// 与旧版一致：标签按出现次数分三档字号（四分位）
const tagCloud = computed(() => {
  const counts = {}
  for (const p of posts.value) for (const t of (p.tags || [])) counts[t] = (counts[t] || 0) + 1
  const all = Object.keys(counts).sort()
  const sizes = all.map(t => counts[t]).sort((a, b) => a - b)
  const q1 = sizes[Math.floor(sizes.length * 0.25)] || 1
  const q3 = sizes[Math.floor(sizes.length * 0.75)] || 1
  const sizeOf = c => (c >= q3 ? 'size-3' : c >= q1 ? 'size-2' : 'size-1')
  return all.map(t => ({ tag: t, count: counts[t], size: sizeOf(counts[t]) }))
})

function esc (s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function escapeRegex (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function tagCls (t) {
  let cls = 'tag'
  if (t === 'Bash' || t === '终端') cls += ' bash'
  else if (['表格', '数据'].includes(t)) cls += ' test'
  else cls += ' tech'
  return cls
}

const filtered = computed(() => {
  const kw = q.value.trim().toLowerCase()
  return posts.value.filter(p => {
    if (activeTag.value && !(p.tags || []).includes(activeTag.value)) return false
    if (!kw) return true
    return (p.title || '').toLowerCase().includes(kw)
      || (p.tags || []).some(t => t.toLowerCase().includes(kw))
      || (p.date || '').toLowerCase().includes(kw)
      || (p.excerpt || '').toLowerCase().includes(kw)
  })
})
const pageCount = computed(() => Math.ceil(filtered.value.length / PER_PAGE) || 1)
const pagePosts = computed(() => {
  const page = Math.min(currentPage.value, pageCount.value)
  return filtered.value.slice((page - 1) * PER_PAGE, page * PER_PAGE)
})
const pageShown = computed(() => Math.min(currentPage.value, pageCount.value))

// 分页按钮序列：首末固定，当前页±2，间隙以省略号占位（对应旧 renderPagination）
const pageItems = computed(() => {
  const total = pageCount.value
  const cur = pageShown.value
  if (total <= 7) return Array.from({ length: total }, (_, k) => k + 1)
  const set = new Set([1, total])
  for (let i = cur - 2; i <= cur + 2; i++) if (i > 1 && i < total) set.add(i)
  const nums = [...set].sort((a, b) => a - b)
  const out = []
  let prev = 0
  for (const n of nums) {
    if (n - prev > 1) out.push('...')
    out.push(n)
    prev = n
  }
  return out
})

function highlight (text) {
  const safe = esc(text)
  const kw = q.value.trim()
  if (!kw) return safe
  return safe.replace(new RegExp('(' + escapeRegex(esc(kw)) + ')', 'gi'), '<mark class="search-highlight">$1</mark>')
}

function pickTag (t) {
  activeTag.value = t || null
  currentPage.value = 1
}
</script>

<template>
  <div>
    <div class="page-header" id="pageHeader">
      <h1>雪地笔记</h1>
      <p class="sub"><a href="https://snowblock.top"><i class="fa-solid fa-snowflake"></i> SnowBlock</a></p>
      <div class="search-bar">
        <input v-model="q" type="text" class="search-input" placeholder="搜索文章..." aria-label="搜索">
        <a href="/feed.xml" class="rss-link" target="_blank" title="RSS 订阅">RSS</a>
      </div>
      <div class="tag-filters" id="tagFilters">
        <span
          v-for="item in tagCloud"
          :key="item.tag"
          class="tag-filter"
          :class="[item.size, { active: item.tag === activeTag }]"
          @click="pickTag(item.tag)"
        >{{ item.tag }}</span>
        <span v-if="activeTag" class="tag-filter size-2 active" @click="pickTag('')">x 清除筛选</span>
      </div>
    </div>

    <div id="postList">
      <div id="dynamicPostList" class="post-list">
        <div
          v-for="p in pagePosts"
          :key="p.id"
          class="post-card"
          tabindex="0"
          role="button"
          @click="navigateTo(`/posts/${p.id}`)"
          @keydown.enter="navigateTo(`/posts/${p.id}`)"
        >
          <div class="post-body">
            <div class="post-meta">
              <span>{{ p.date }}</span>
              <span v-if="p.pinned" class="pinned-badge">[置顶]</span>
              <span
                v-for="t in p.tags"
                :key="t"
                :class="tagCls(t)"
                @click.stop="pickTag(t)"
              >{{ t }}</span>
              <span>{{ p.readTime }}</span>
            </div>
            <h2 class="post-title" v-html="highlight(p.title)"></h2>
            <p class="post-excerpt" v-html="highlight(p.excerpt)"></p>
            <div class="post-footer"><span class="post-date">{{ p.date }} . {{ p.time }}</span></div>
          </div>
        </div>
        <div v-if="!pagePosts.length" class="state-empty">没有匹配的文章</div>
      </div>

      <div class="pagination" id="pagination" v-if="pageCount > 1">
        <button class="page-btn" :disabled="pageShown <= 1" @click="currentPage = pageShown - 1">上一页</button>
        <template v-for="(it, idx) in pageItems" :key="String(idx) + String(it)">
          <button
            v-if="it !== '...'"
            class="page-btn"
            :class="{ active: it === pageShown }"
            @click="currentPage = it"
          >{{ it }}</button>
          <span v-else class="page-info">...</span>
        </template>
        <button class="page-btn" :disabled="pageShown >= pageCount" @click="currentPage = pageShown + 1">下一页</button>
      </div>
    </div>
  </div>
</template>


