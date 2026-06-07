if (location.search.includes('_gl=')) {
  history.replaceState(null, '', location.pathname + location.hash)
}

// ============================================
// CONFIG
// ============================================
var profileConfig = {
  avatar: 'https://vps.snowblock.top:9443/raw/ninasukiwww-png/my-images/main/blog/profile.webp',
  name: 'ninasukiwww',
  bio: '世界は大きい、君は行かなければならない',
  links: [
    { name: 'GitHub', icon: 'fa7-brands/github', url: 'https://github.com/ninasukiwww-png' },
    { name: 'Shizukuレモン', icon: 'fa7-brands/bilibili', url: 'https://space.bilibili.com/3493084421687360' },
    { name: '博客', icon: 'material-symbols/article-outline', url: 'https://blog.snowblock.top' }
  ]
}

// ============================================
// SHARED STATE
// ============================================
var md = null
var purifyConfig = null
var postsMeta = []
var allExcerpts = {}
var currentPage = 1
var activeTag = null
var PER_PAGE = 5
var currentHeatmapYear = null
var heatmapDayPosts = {}
var albums = []
var tocSpy = null

// ============================================
// DOM REFERENCES
// ============================================
var toast = document.getElementById('toast')
var toastTimer = null
var postContainer = document.getElementById('dynamicPostList')
var paginationEl = document.getElementById('pagination')
var listView = document.getElementById('postList')
var articleViewEl = document.getElementById('articleView')
var archiveViewEl = document.getElementById('archiveView')
var articleTitle = document.getElementById('articleTitle')
var articleMeta = document.getElementById('articleMeta')
var articleContent = document.getElementById('articleContent')
var relatedPosts = document.getElementById('relatedPosts')
var backLink = document.getElementById('backToList')
var searchInput = document.getElementById('searchInput')
var tagFilters = document.getElementById('tagFilters')
var profileCard = document.getElementById('profileCard')
var archiveContent = document.getElementById('archiveContent')
var galleryView = document.getElementById('galleryView')
var albumGrid = document.getElementById('albumGrid')
var albumDetail = document.getElementById('albumDetail')
var navBlog = document.getElementById('navBlog')
var navArchive = document.getElementById('navArchive')
var navGallery = document.getElementById('navGallery')
var navAbout = document.getElementById('navAbout')
var backToTop = document.getElementById('backToTop')
var tocToggle = document.getElementById('tocToggle')
var tocPanel = document.getElementById('tocPanel')
var pageHeader = document.getElementById('pageHeader')

// ============================================
// TOAST
// ============================================
function showToast(msg, dur) {
  if (!toast) return
  if (dur === undefined) dur = 2000
  toast.textContent = msg
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(function() {
    toast.classList.remove('show')
  }, dur)
}

// ============================================
// LIGHTBOX
// ============================================
var lightbox = document.getElementById('lightbox')
var lightboxImg = document.getElementById('lightboxImg')
var zoomLevel = 1
var zoomPanX = 0
var zoomPanY = 0
var zoomPanning = false
var zoomStartX, zoomStartY
var zoomLastTap = 0
var currentExif = null

document.getElementById('lightbox-close').addEventListener('click', function () {
  lightbox.classList.remove('show')
})
lightbox.addEventListener('click', function () {
  this.classList.remove('show')
})
lightboxImg.addEventListener('click', function (e) {
  e.stopPropagation()
})
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') lightbox.classList.remove('show')
})

lightboxImg.addEventListener('wheel', function (e) {
  e.preventDefault()
  var dir = e.deltaY > 0 ? -1 : 1
  zoomLevel = Math.max(1, Math.min(5, zoomLevel + dir * 0.25))
  lightboxImg.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-out'
  applyZoomTransform()
}, { passive: false })

lightboxImg.addEventListener('mousedown', function (e) {
  if (zoomLevel <= 1) return
  zoomPanning = true
  zoomStartX = e.clientX - zoomPanX
  zoomStartY = e.clientY - zoomPanY
  lightboxImg.style.cursor = 'grabbing'
})

document.addEventListener('mousemove', function (e) {
  if (!zoomPanning) return
  zoomPanX = e.clientX - zoomStartX
  zoomPanY = e.clientY - zoomStartY
  applyZoomTransform()
})

document.addEventListener('mouseup', function () {
  zoomPanning = false
  if (zoomLevel > 1) lightboxImg.style.cursor = 'grab'
})

lightboxImg.addEventListener('touchend', function (e) {
  var now = Date.now()
  if (now - zoomLastTap < 300 && e.changedTouches.length === 1) {
    if (zoomLevel > 1) { zoomLevel = 1; zoomPanX = 0; zoomPanY = 0 }
    else zoomLevel = 2.5
    applyZoomTransform()
    e.preventDefault()
  }
  zoomLastTap = now
})

lightboxImg.addEventListener('dblclick', function (e) {
  e.stopPropagation()
  if (zoomLevel > 1) { zoomLevel = 1; zoomPanX = 0; zoomPanY = 0 }
  else zoomLevel = 2.5
  applyZoomTransform()
})

function applyZoomTransform() {
  lightboxImg.style.transform = 'translate(' + zoomPanX + 'px,' + zoomPanY + 'px) scale(' + zoomLevel + ')'
}

function updateLightboxExif() {
  var el = document.getElementById('lightboxExif')
  if (!el) return
  if (!currentExif) { el.style.display = 'none'; return }
  el.style.display = 'block'
  var parts = []
  if (currentExif.Make || currentExif.Model) {
    parts.push([currentExif.Make, currentExif.Model].filter(Boolean).join(' '))
  }
  if (currentExif.FNumber) parts.push('f/' + parseFloat(currentExif.FNumber).toFixed(2))
  if (currentExif.ExposureTime) {
    var t = currentExif.ExposureTime
    if (t >= 1) parts.push(t + 's')
    else parts.push('1/' + Math.round(1 / t) + 's')
  }
  if (currentExif.ISO) parts.push('ISO' + currentExif.ISO)
  if (currentExif.FocalLength) parts.push(Math.round(currentExif.FocalLength) + 'mm')
  if (currentExif.ImageWidth && currentExif.ImageHeight) {
    parts.push(currentExif.ImageWidth + 'x' + currentExif.ImageHeight)
  }
  el.textContent = parts.join('  ·  ')
}

;(function () {
  var obs = new MutationObserver(function () {
    if (lightbox.classList.contains('show')) {
      zoomLevel = 1; zoomPanX = 0; zoomPanY = 0
      lightboxImg.style.transform = ''
      lightboxImg.style.cursor = 'zoom-out'
    } else {
      currentExif = null
      updateLightboxExif()
    }
  })
  obs.observe(lightbox, { attributes: true, attributeFilter: ['class'] })
})()

// ============================================
// UTILITIES
// ============================================
function safeRender(text) {
  return DOMPurify.sanitize(md.render(text), purifyConfig)
}

function getExcerpt(text, max) {
  max = max || 110
  var div = document.createElement('div')
  div.innerHTML = safeRender(text)
  var s = (div.textContent || '').replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max) + '...' : s
}

function stripMeta(text) {
  return text.replace(/^# .+\n[\s\S]*?\n---\n?/, '')
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function setOGTag(prop, val) {
  var el = document.querySelector('meta[property="' + prop + '"]')
  if (el) el.setAttribute('content', val)
}

function resetOG() {
  document.title = 'SnowBlock · 雪地笔记'
  setOGTag('og:title', 'SnowBlock · 博客')
  setOGTag('og:description', '雪地笔记 — 技术、游戏、日常与碎片思考')
  setOGTag('og:image', 'https://vps.snowblock.top:9443/raw/ninasukiwww-png/my-images/main/blog/bg.webp')
  setOGTag('og:url', 'https://blog.snowblock.top')
}
