const app = {}

// ============================================
// CONFIG
// ============================================
app.config = {
  CDN_BASE: 'https://raw.githubusercontent.com/ninasukiwww-png/my-images/main/',
  SITE_URL: 'https://blog.snowblock.top',
  profile: {
    avatar: 'https://raw.githubusercontent.com/ninasukiwww-png/my-images/main/profile.webp',
    name: 'ninasukiwww',
    bio: '世界は大きい、君は行かなければならない',
    links: [
      { name: 'GitHub', icon: 'fa7-brands/github', url: 'https://github.com/ninasukiwww-png' },
      { name: 'Shizukuレモン', icon: 'fa7-brands/bilibili', url: 'https://space.bilibili.com/3493084421687360' },
      { name: '博客', icon: 'material-symbols/article-outline', url: 'https://blog.snowblock.top' }
    ]
  },
  ogDefaults: {
    title: 'SnowBlock · 博客',
    description: '雪地笔记 — 技术、游戏、日常与碎片思考',
    image: 'https://raw.githubusercontent.com/ninasukiwww-png/my-images/main/bg.webp',
    url: 'https://blog.snowblock.top'
  }
}

// ============================================
// SHARED STATE
// ============================================
app.state = {
  md: null,
  purifyConfig: null,
  postsMeta: [],
  allExcerpts: {},
  currentPage: 1,
  activeTag: null,
  PER_PAGE: 5,
  currentHeatmapYear: null,
  heatmapDayPosts: {},
  albums: [],
  tocSpy: null
}

// ============================================
// DOM REFERENCES
// ============================================
app.dom = {
  toast: document.getElementById('toast'),
  postContainer: document.getElementById('dynamicPostList'),
  paginationEl: document.getElementById('pagination'),
  listView: document.getElementById('postList'),
  articleViewEl: document.getElementById('articleView'),
  archiveViewEl: document.getElementById('archiveView'),
  articleTitle: document.getElementById('articleTitle'),
  articleMeta: document.getElementById('articleMeta'),
  articleContent: document.getElementById('articleContent'),
  relatedPosts: document.getElementById('relatedPosts'),
  backLink: document.getElementById('backToList'),
  searchInput: document.getElementById('searchInput'),
  tagFilters: document.getElementById('tagFilters'),
  profileCard: document.getElementById('profileCard'),
  archiveContent: document.getElementById('archiveContent'),
  galleryView: document.getElementById('galleryView'),
  albumGrid: document.getElementById('albumGrid'),
  albumDetail: document.getElementById('albumDetail'),
  navBlog: document.getElementById('navBlog'),
  navArchive: document.getElementById('navArchive'),
  navGallery: document.getElementById('navGallery'),
  navAbout: document.getElementById('navAbout'),
  navDocs: document.getElementById('navDocs'),
  backToTop: document.getElementById('backToTop'),
  tocToggle: document.getElementById('tocToggle'),
  tocPanel: document.getElementById('tocPanel'),
  pageHeader: document.getElementById('pageHeader'),
  lightbox: document.getElementById('lightbox'),
  lightboxImg: document.getElementById('lightboxImg'),
  lightboxExif: document.getElementById('lightboxExif'),
  docsView: document.getElementById('docsView'),
  docsSidebar: document.getElementById('docsSidebar'),
  docsContent: document.getElementById('docsContent'),
  docsContainer: document.getElementById('docsContainer')
}

app.toastTimer = null

// ============================================
// TOAST
// ============================================
app.toast = {
  show: function(msg, dur) {
    if (!app.dom.toast) return
    if (dur === undefined) dur = 2000
    app.dom.toast.textContent = msg
    app.dom.toast.classList.add('show')
    clearTimeout(app.toastTimer)
    app.toastTimer = setTimeout(function() {
      app.dom.toast.classList.remove('show')
    }, dur)
  }
}

// ============================================
// LIGHTBOX
// ============================================
app.lightbox = {
  zoomLevel: 1,
  zoomPanX: 0,
  zoomPanY: 0,
  zoomPanning: false,
  zoomStartX: 0,
  zoomStartY: 0,
  zoomLastTap: 0,
  exif: null,

  open: function(src, alt, exif) {
    app.dom.lightboxImg.src = src
    app.dom.lightboxImg.alt = alt || ''
    this.exif = exif || null
    this.updateExif()
    this.zoomLevel = 1; this.zoomPanX = 0; this.zoomPanY = 0
    app.dom.lightboxImg.style.transform = ''
    app.dom.lightboxImg.style.cursor = 'zoom-out'
    app.dom.lightbox.classList.add('show')
  },

  close: function() {
    this.exif = null
    this.updateExif()
    app.dom.lightbox.classList.remove('show')
  },

  applyZoom: function() {
    app.dom.lightboxImg.style.transform = 'translate(' + this.zoomPanX + 'px,' + this.zoomPanY + 'px) scale(' + this.zoomLevel + ')'
  },

  updateExif: function() {
    var el = app.dom.lightboxExif
    if (!el) return
    if (!this.exif) { el.style.display = 'none'; return }
    el.style.display = 'block'
    var parts = []
    if (this.exif.Make || this.exif.Model) {
      parts.push([this.exif.Make, this.exif.Model].filter(Boolean).join(' '))
    }
    if (this.exif.FNumber) parts.push('f/' + parseFloat(this.exif.FNumber).toFixed(2))
    if (this.exif.ExposureTime) {
      var t = this.exif.ExposureTime
      if (t >= 1) parts.push(t + 's')
      else parts.push('1/' + Math.round(1 / t) + 's')
    }
    if (this.exif.ISO) parts.push('ISO' + this.exif.ISO)
    if (this.exif.FocalLength) parts.push(Math.round(this.exif.FocalLength) + 'mm')
    if (this.exif.ImageWidth && this.exif.ImageHeight) {
      parts.push(this.exif.ImageWidth + 'x' + this.exif.ImageHeight)
    }
    el.textContent = parts.join('  ·  ')
  }
}

document.getElementById('lightbox-close').addEventListener('click', function () {
  app.lightbox.close()
})
app.dom.lightbox.addEventListener('click', function () {
  app.lightbox.close()
})
app.dom.lightboxImg.addEventListener('click', function (e) {
  e.stopPropagation()
})
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') app.lightbox.close()
})

app.dom.lightboxImg.addEventListener('wheel', function (e) {
  e.preventDefault()
  var dir = e.deltaY > 0 ? -1 : 1
  app.lightbox.zoomLevel = Math.max(1, Math.min(5, app.lightbox.zoomLevel + dir * 0.25))
  app.dom.lightboxImg.style.cursor = app.lightbox.zoomLevel > 1 ? 'grab' : 'zoom-out'
  app.lightbox.applyZoom()
}, { passive: false })

app.dom.lightboxImg.addEventListener('mousedown', function (e) {
  if (app.lightbox.zoomLevel <= 1) return
  app.lightbox.zoomPanning = true
  app.lightbox.zoomStartX = e.clientX - app.lightbox.zoomPanX
  app.lightbox.zoomStartY = e.clientY - app.lightbox.zoomPanY
  app.dom.lightboxImg.style.cursor = 'grabbing'
})

document.addEventListener('mousemove', function (e) {
  if (!app.lightbox.zoomPanning) return
  app.lightbox.zoomPanX = e.clientX - app.lightbox.zoomStartX
  app.lightbox.zoomPanY = e.clientY - app.lightbox.zoomStartY
  app.lightbox.applyZoom()
})

document.addEventListener('mouseup', function () {
  app.lightbox.zoomPanning = false
  if (app.lightbox.zoomLevel > 1) app.dom.lightboxImg.style.cursor = 'grab'
})

app.dom.lightboxImg.addEventListener('touchend', function (e) {
  var now = Date.now()
  if (now - app.lightbox.zoomLastTap < 300 && e.changedTouches.length === 1) {
    if (app.lightbox.zoomLevel > 1) { app.lightbox.zoomLevel = 1; app.lightbox.zoomPanX = 0; app.lightbox.zoomPanY = 0 }
    else app.lightbox.zoomLevel = 2.5
    app.lightbox.applyZoom()
    e.preventDefault()
  }
  app.lightbox.zoomLastTap = now
})

app.dom.lightboxImg.addEventListener('dblclick', function (e) {
  e.stopPropagation()
  if (app.lightbox.zoomLevel > 1) { app.lightbox.zoomLevel = 1; app.lightbox.zoomPanX = 0; app.lightbox.zoomPanY = 0 }
  else app.lightbox.zoomLevel = 2.5
  app.lightbox.applyZoom()
})

// ============================================
// VIEW SWITCHING
// ============================================
app.views = {
  switchTo: function(name) {
    app.dom.listView.style.display = name === 'list' ? 'block' : 'none'
    app.dom.articleViewEl.style.display = (name === 'article' || name === 'about') ? 'block' : 'none'
    app.dom.archiveViewEl.style.display = name === 'archive' ? 'block' : 'none'
    app.dom.galleryView.style.display = name === 'gallery' ? 'block' : 'none'
    app.dom.docsView.style.display = name === 'docs' ? 'block' : 'none'
    app.dom.pageHeader.style.display = name === 'list' ? 'block' : 'none'
    app.dom.tocToggle.classList.remove('show')
    app.dom.tocPanel.classList.remove('show')
  }
}

// ============================================
// UTILITIES
// ============================================
app.utils = {
  safeRender: function(text) {
    return DOMPurify.sanitize(app.state.md.render(text), app.state.purifyConfig)
  },

  getExcerpt: function(text, max) {
    max = max || 110
    var div = document.createElement('div')
    div.innerHTML = this.safeRender(text)
    var s = (div.textContent || '').replace(/\s+/g, ' ').trim()
    return s.length > max ? s.slice(0, max) + '...' : s
  },

  stripFrontMatter: function(text) {
    // remove "# Title\n...yaml metadata...\n---\n" from markdown posts
    return text.replace(/^# .+\n[\s\S]*?\n---\n?/, '')
  },

  escapeRegex: function(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  },

  setOGTag: function(prop, val) {
    var el = document.querySelector('meta[property="' + prop + '"]')
    if (el) el.setAttribute('content', val)
  },

  resetOG: function() {
    document.title = 'SnowBlock · 雪地笔记'
    this.setOGTag('og:title', app.config.ogDefaults.title)
    this.setOGTag('og:description', app.config.ogDefaults.description)
    this.setOGTag('og:image', app.config.ogDefaults.image)
    this.setOGTag('og:url', app.config.ogDefaults.url)
  }
}
