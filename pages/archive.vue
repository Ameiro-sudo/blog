<script setup>
import postsAll from '~/content/posts/index.json'
import albumsAll from '~/content/albums/index.json'

useHead({
  title: '归档 · SnowBlock',
  meta: [{ property: 'og:title', content: '归档 · SnowBlock' }]
})

// ===== 热力图（对应旧 app.archive.renderHeatmap）=====
const activeYears = [...new Set(postsAll.filter(p => p.date).map(p => p.date.substring(0, 4)))].sort()
const heatYear = ref(Number(activeYears[activeYears.length - 1]) || new Date().getFullYear())

function pad2 (n) { return String(n).padStart(2, '0') }
function dsOf (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) }

const heatData = computed(() => {
  const year = heatYear.value
  const dayCounts = {}
  const dayPosts = {}
  for (const p of postsAll) {
    if (p.date && p.date.indexOf(String(year)) === 0) {
      dayCounts[p.date] = (dayCounts[p.date] || 0) + 1
      if (!dayPosts[p.date]) dayPosts[p.date] = []
      dayPosts[p.date].push(p)
    }
  }
  // 对齐到周边界（与旧逻辑一致：从当年首个周日往前补齐）
  const startDate = new Date(year, 0, 1)
  const firstCell = new Date(startDate)
  firstCell.setDate(firstCell.getDate() - startDate.getDay())
  const endDate = new Date(year, 11, 31)
  const lastCell = new Date(endDate)
  lastCell.setDate(lastCell.getDate() + (6 - endDate.getDay()))
  const weeks = []
  const cursor = new Date(firstCell)
  while (cursor <= lastCell) {
    const week = []
    for (let d = 0; d < 7; d++) { week.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1) }
    weeks.push(week)
  }
  let maxCount = 0
  Object.keys(dayCounts).forEach(k => { if (dayCounts[k] > maxCount) maxCount = dayCounts[k] })
  function getColor (count) {
    if (count === 0) return 'var(--heatmap-empty)'
    const level = count / (maxCount || 1)
    if (level < 0.25) return 'var(--heatmap-l1)'
    if (level < 0.5) return 'var(--heatmap-l2)'
    if (level < 0.75) return 'var(--heatmap-l3)'
    return 'var(--heatmap-l4)'
  }
  const seenMonths = {}
  const monthLabels = Array(weeks.length).fill('')
  weeks.forEach((week, wi) => {
    for (let d = 0; d < 7; d++) {
      const m = week[d].getMonth(); const y = week[d].getFullYear()
      const key = y + '-' + m
      if (!seenMonths[key]) {
        seenMonths[key] = true
        if (y === year) monthLabels[wi] = (m + 1) + '月'
        break
      }
    }
  })
  return { dayCounts, dayPosts, weeks, getColor, monthLabels }
})

const dayLabels = ['', '一', '', '三', '', '五', '']
const detail = ref(null) // { date, posts }

function showDetail (ds) {
  const posts = heatData.value.dayPosts[ds] || []
  detail.value = { date: ds, label: ds + (posts.length ? ' . ' + posts.length + ' 篇' : ' . 无文章'), posts }
}

// ===== 年月时间线（对应旧 app.archive.render）=====
const pinnedPosts = computed(() => postsAll.filter(p => p.pinned))
const yearGroups = computed(() => {
  const groups = {}
  for (const p of postsAll) {
    if (p.pinned) continue
    const year = p.date ? p.date.substring(0, 4) : '未知'
    const month = p.date ? p.date.substring(5, 7) : '??'
    if (!groups[year]) groups[year] = {}
    if (!groups[year][month]) groups[year][month] = { posts: [], albums: [] }
    groups[year][month].posts.push(p)
  }
  for (const a of albumsAll) {
    const parts = a.date ? String(a.date).split('.') : []
    const year = parts[0] || '未知'
    const month = parts[1] || '??'
    if (!groups[year]) groups[year] = {}
    if (!groups[year][month]) groups[year][month] = { posts: [], albums: [] }
    groups[year][month].albums.push(a)
  }
  return Object.keys(groups).sort().reverse().map(year => ({
    year,
    months: Object.keys(groups[year]).sort().reverse().map(month => {
      const block = groups[year][month]
      block.posts.sort((a, b) => {
        const dc = (b.date || '').localeCompare(a.date || '')
        if (dc !== 0) return dc
        return (b.time || '').localeCompare(a.time || '')
      })
      return { month, ...block }
    }),
  }))
})
</script>

<template>
  <div>
    <div class="archive-card">
      <div class="archive-body">
        <!-- 热力图 -->
        <div class="heatmap-wrap">
          <div class="heatmap-header">
            <button
              v-for="y in activeYears"
              :key="y"
              class="heatmap-year-btn"
              :class="{ active: Number(y) === heatYear }"
              @click="heatYear = Number(y); detail = null"
            >{{ y }}</button>
          </div>
          <div class="heatmap-body">
            <div class="heatmap-body-inner">
              <div class="heatmap-labels">
                <span v-for="(l, i) in dayLabels" :key="i" class="heatmap-label">{{ l }}</span>
              </div>
              <div class="heatmap-grid">
                <div class="heatmap-months">
                  <span v-for="(label, wi) in heatData.monthLabels" :key="wi" class="heatmap-month">{{ label }}</span>
                </div>
                <div class="heatmap-cells">
                  <div v-for="(week, wi) in heatData.weeks" :key="wi" class="hm-week">
                    <span
                      v-for="day in week"
                      :key="dsOf(day)"
                      class="heatmap-cell"
                      :style="{ background: heatData.getColor(heatData.dayCounts[dsOf(day)] || 0) }"
                      @click="showDetail(dsOf(day))"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="detail" class="heatmap-detail" style="display:block;">
            <div class="heatmap-detail-header">
              <span class="heatmap-detail-date">{{ detail.label }}</span>
              <span class="heatmap-detail-close" @click="detail = null">x</span>
            </div>
            <div class="heatmap-detail-list">
              <NuxtLink
                v-for="p in detail.posts"
                :key="p.id"
                class="heatmap-detail-item"
                :to="`/posts/${p.id}`"
              >{{ p.title }}</NuxtLink>
            </div>
          </div>
        </div>

        <!-- 置顶 -->
        <div v-if="pinnedPosts.length" class="archive-year">
          <div class="archive-year-header">[置顶]</div>
          <div class="archive-month">
            <ul class="archive-list">
              <li v-for="p in pinnedPosts" :key="'pin-' + p.id">
                <NuxtLink :to="`/posts/${p.id}`" class="archive-item">
                  <span class="archive-item-date">{{ p.date ? p.date.substring(8, 10) : '' }}</span>
                  <span class="archive-item-title">{{ p.title }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- 年月分组 -->
        <div v-for="yg in yearGroups" :key="yg.year" class="archive-year">
          <div class="archive-year-header">{{ yg.year }}</div>
          <div v-for="m in yg.months" :key="yg.year + m.month" class="archive-month">
            <div class="archive-month-header">{{ m.month }}月</div>
            <ul class="archive-list">
              <li v-for="p in m.posts" :key="p.id">
                <NuxtLink :to="`/posts/${p.id}`" class="archive-item">
                  <span class="archive-item-date">{{ p.date ? p.date.substring(8, 10) : '' }}</span>
                  <span class="archive-item-title">{{ p.title }}</span>
                </NuxtLink>
              </li>
              <li v-for="a in m.albums" :key="'al-' + a.id">
                <NuxtLink :to="`/gallery/${a.id}`" class="archive-item archive-album">
                  <span class="archive-item-date">[相册]</span>
                  <span class="archive-item-title">{{ a.title }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>