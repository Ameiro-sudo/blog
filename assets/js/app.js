const app = {}

// ============================================
// CONFIG
// ============================================
app.config = {
  CDN_BASE: 'assets/vendor/images/',
  SITE_URL: 'https://blog.snowblock.top',
  profile: {
    avatar: 'https://github.com/ninasukiwww-png.png',
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
    image: 'assets/vendor/images/bg.webp',
    url: 'https://blog.snowblock.top'
  }
}

// ============================================
// SHARED STATE
// ============================================
app.theme = {
  init: function() {
    this.syncIcon()
    this.bindToggle()
  },
  bindToggle: function() {
    var btn = document.getElementById('themeToggle')
    if (btn) btn.addEventListener('click', function() { app.theme.toggle() })
  },
  toggle: function() {
    var dark = document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', !dark)
    try { localStorage.setItem('theme', dark ? 'light' : 'dark') } catch (e) {}
    this.syncIcon()
  },
  syncIcon: function() {
    var icon = document.getElementById('themeIcon')
    if (icon) {
      var dark = document.documentElement.classList.contains('dark')
      icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'
    }
  }
}

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
  moduleView: document.getElementById('moduleView'),
  albumGrid: document.getElementById('albumGrid'),
  albumDetail: document.getElementById('albumDetail'),
  navBlog: document.getElementById('navBlog'),
  navArchive: document.getElementById('navArchive'),
  navGallery: document.getElementById('navGallery'),
  navMoments: document.getElementById('navMoments'),
  navFriends: document.getElementById('navFriends'),
  navMusic: document.getElementById('navMusic'),
  navAbout: document.getElementById('navAbout'),
  backToTop: document.getElementById('backToTop'),
  tocToggle: document.getElementById('tocToggle'),
  tocPanel: document.getElementById('tocPanel'),
  pageHeader: document.getElementById('pageHeader'),
  lightbox: document.getElementById('lightbox'),
  lightboxImg: document.getElementById('lightboxImg'),
  lightboxExif: document.getElementById('lightboxExif'),
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
    app.dom.moduleView.style.display = name === 'module' ? 'block' : 'none'
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

app.profile = {
  render: function() {
    var cfg = app.config.profile
    if (!cfg.name) { app.dom.profileCard.style.display = 'none'; return }
    app.dom.profileCard.style.display = 'block'
    var links = (cfg.links || []).map(function (l) {
      var iconSrc = l.icon ? 'assets/vendor/iconify/' + l.icon.replace('/', '-') + '.svg' : ''
      var icon = iconSrc ? '<img src="' + iconSrc + '" alt="' + l.name + '" class="profile-icon">' : l.name
      return '<a href="' + l.url + '" target="_blank" rel="noopener" title="' + l.name + '">' + icon + '</a>'
    }).join('')
    app.dom.profileCard.innerHTML =
      '<div class="profile-wrap">' +
      (cfg.avatar ? '<span class="profile-avatar-ring"><img class="profile-avatar" src="' + cfg.avatar + '" alt="avatar"></span>' : '') +
      '<a href="https://snowblock.top" class="profile-name">' + (cfg.name || '') + '</a>' +
      '<div class="profile-divider"></div>' +
      (cfg.bio ? '<div class="profile-bio">' + cfg.bio + '</div>' : '') +
      '<div class="profile-stats">' +
        '<div class="stat-item"><div class="stat-num" id="statPosts">-</div><div class="stat-label">文章</div></div>' +
        '<div class="stat-divider"></div>' +
        '<div class="stat-item"><div class="stat-num" id="statAlbums">-</div><div class="stat-label">相册</div></div>' +
        '<div class="stat-divider"></div>' +
        '<div class="stat-item"><div class="stat-num" id="statTags">-</div><div class="stat-label">标签</div></div>' +
      '</div>' +
      (links ? '<div class="profile-links">' + links + '</div>' : '') +
      '</div>'
    this.updateStats()
  },
  updateStats: function() {
    var posts = (app.state.postsMeta || []).length
    var albums = (app.state.albums || []).length
    var tagSet = {}
    ;(app.state.postsMeta || []).forEach(function (p) {
      ;(p.tags || []).forEach(function (t) { tagSet[t] = true })
    })
    var tags = Object.keys(tagSet).length
    var setNum = function (id, n) {
      var el = document.getElementById(id)
      if (el) el.textContent = n
    }
    setNum('statPosts', posts)
    setNum('statAlbums', albums)
    setNum('statTags', tags)
  }
}

app.posts = {
  renderTagFilters: function() {
    var allTags = []
    var tagCounts = {}
    app.state.postsMeta.forEach(function (p) {
      p.tags.forEach(function (t) {
        tagCounts[t] = (tagCounts[t] || 0) + 1
        if (allTags.indexOf(t) === -1) allTags.push(t)
      })
    })
    allTags.sort()
    var counts = allTags.map(function (t) { return tagCounts[t] }).sort(function (a, b) { return a - b })
    var q1 = counts[Math.floor(counts.length * 0.25)] || 1
    var q3 = counts[Math.floor(counts.length * 0.75)] || 1
    function getSize(c) {
      if (c >= q3) return 'size-3'
      if (c >= q1) return 'size-2'
      return 'size-1'
    }
    var html = ''
    allTags.forEach(function (t) {
      var active = t === app.state.activeTag ? 'active' : ''
      var size = getSize(tagCounts[t])
      html += '<span class="tag-filter ' + size + ' ' + active + '" data-tag="' + t + '">' + t + '</span>'
    })
    if (app.state.activeTag) {
      html += '<span class="tag-filter size-2 active" data-tag="">x 清除筛选</span>'
    }
    app.dom.tagFilters.innerHTML = html
    app.dom.tagFilters.querySelectorAll('.tag-filter').forEach(function (el) {
      el.addEventListener('click', function () {
        var tag = el.dataset.tag
        app.state.activeTag = tag || null
        app.state.currentPage = 1
        app.posts.renderTagFilters()
        app.posts.applyFilters()
      })
    })
  },

  applyFilters: function() {
    var q = (app.dom.searchInput.value || '').toLowerCase()
    var filtered = app.state.postsMeta.filter(function (p) {
      if (app.state.activeTag && p.tags.indexOf(app.state.activeTag) === -1) return false
      if (!q) return true
      if (p.title.toLowerCase().indexOf(q) !== -1) return true
      if (p.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1 })) return true
      if (p.date.toLowerCase().indexOf(q) !== -1) return true
      if ((app.state.allExcerpts[p.id] || '').toLowerCase().indexOf(q) !== -1) return true
      return false
    })
    this.renderFiltered(filtered)
  },

  getPageCount: function(filtered) { return Math.ceil(filtered.length / app.state.PER_PAGE) || 1 },

  getPagePosts: function(filtered, page) {
    var start = (page - 1) * app.state.PER_PAGE
    return filtered.slice(start, start + app.state.PER_PAGE)
  },

  renderPagination: function(filtered, current) {
    var total = this.getPageCount(filtered)
    if (total <= 1) { app.dom.paginationEl.innerHTML = ''; return }
    var prevDisabled = current <= 1 ? 'disabled' : ''
    var nextDisabled = current >= total ? 'disabled' : ''
    var html = '<button class="page-btn" data-page="' + (current - 1) + '" ' + prevDisabled + '>上一页</button>'
    var range = 2
    var startPage = Math.max(1, current - range)
    var endPage = Math.min(total, current + range)
    if (startPage > 1) {
      html += '<button class="page-btn" data-page="1">1</button>'
      if (startPage > 2) html += '<span class="page-info">...</span>'
    }
    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="page-btn' + (i === current ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>'
    }
    if (endPage < total) {
      if (endPage < total - 1) html += '<span class="page-info">...</span>'
      html += '<button class="page-btn" data-page="' + total + '">' + total + '</button>'
    }
    html += '<button class="page-btn" data-page="' + (current + 1) + '" ' + nextDisabled + '>下一页</button>'
    app.dom.paginationEl.innerHTML = html
    app.dom.paginationEl.querySelectorAll('.page-btn:not([disabled])').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var page = parseInt(btn.dataset.page)
        if (page && page !== current) { app.state.currentPage = page; app.posts.applyFilters() }
      })
    })
  },

  renderFiltered: function(filtered) {
    var page = Math.min(app.state.currentPage, this.getPageCount(filtered))
    app.state.currentPage = page
    var posts = this.getPagePosts(filtered, page)
    var html = ''
    var self = this
    posts.forEach(function (p) {
      var tags = p.tags.map(function (t) {
        var cls = 'tag'
        if (t === 'Bash' || t === '终端') cls += ' bash'
        else if (['表格', '数据'].indexOf(t) !== -1) cls += ' test'
        else cls += ' tech'
        var active = t === app.state.activeTag ? ' active-tag' : ''
        return '<span class="' + cls + active + '" data-tag="' + t + '">' + t + '</span>'
      }).join('')
      var title = p.title
      var excerpt = app.state.allExcerpts[p.id] || ''
      var sq = (app.dom.searchInput.value || '').trim()
      if (sq) {
        var regex = new RegExp('(' + app.utils.escapeRegex(sq) + ')', 'gi')
        title = title.replace(regex, '<mark class="search-highlight">$1</mark>')
        excerpt = excerpt.replace(regex, '<mark class="search-highlight">$1</mark>')
      }
      html += '<div class="post-card" data-post-id="' + p.id + '" tabindex="0" role="button">' +
        '<div class="post-body">' +
         '<div class="post-meta"><span>' + p.date + '</span> ' + (p.pinned ? '<span class="pinned-badge">[置顶]</span>' : '') + tags + ' <span>' + p.readTime + '</span></div>' +
        '<h2 class="post-title">' + title + '</h2>' +
        '<p class="post-excerpt">' + excerpt + '</p>' +
         '<div class="post-footer"><span class="post-date">' + p.date + ' . ' + p.time + '</span></div>' +
        '</div></div>'
    })
    if (!html) html = '<div class="state-empty">没有匹配的文章</div>'
    app.dom.postContainer.innerHTML = html
    self.renderPagination(filtered, page)

    app.dom.postContainer.querySelectorAll('.tag').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation()
        var tag = el.dataset.tag
        if (tag) { app.state.activeTag = tag; app.state.currentPage = 1; app.posts.renderTagFilters(); app.posts.applyFilters() }
      })
    })
    app.dom.postContainer.querySelectorAll('.post-card').forEach(function (el) {
      el.addEventListener('click', function () { app.router.navigateTo(el.dataset.postId) })
    })
  }
}

app.article = {
  load: function(id) {
    var meta = app.state.postsMeta.find(function (p) { return p.id === id })
    if (!meta) { app.views.switchTo('list'); return }
    fetch('content/posts/' + meta.file).then(function (r) { return r.text() }).then(function (mdText) {
      var content = app.utils.stripFrontMatter(mdText)
      app.dom.articleTitle.textContent = meta.title
      document.title = meta.title + ' · SnowBlock'
      app.utils.setOGTag('og:title', meta.title)
      app.utils.setOGTag('og:description', meta.description || (app.utils.getExcerpt ? app.utils.getExcerpt(content, 200) : ''))
      app.utils.setOGTag('og:image', meta.image || app.config.ogDefaults.image)
      app.utils.setOGTag('og:url', app.config.SITE_URL + '/#/' + id)
      var tags = meta.tags.map(function (t) {
        return '<span class="tag ' + (t === 'Bash' ? 'bash' : 'tech') + '">' + t + '</span>'
      }).join(' ')
      var clean = content.replace(/\s+/g, '')
      var wc = clean.length
      var wcLabel = wc > 999 ? (wc / 1000).toFixed(1) + 'k' : wc
      app.dom.articleMeta.innerHTML = meta.date + ' . ' + meta.time + ' . ' + meta.readTime + ' . ' + wcLabel + '字 ' + tags
      app.dom.articleContent.innerHTML = app.utils.safeRender(content)
      app.article.enhance(app.dom.articleContent)
      app.dom.articleContent.querySelectorAll('pre').forEach(function (pre) {
        var wrapper = pre.parentElement
        if (!wrapper || !wrapper.classList.contains('code-block-wrapper')) return
        var code = pre.querySelector('code')
        if (!code) return
        var lang = ''
        code.className.replace(/language-(\w+)/, function (_, m) { lang = m })
        if (lang && wrapper.querySelector('.code-lang')) return
        if (lang) {
          var lbl = document.createElement('span')
          lbl.className = 'code-lang'
          lbl.textContent = lang
          wrapper.appendChild(lbl)
        }
      })
      app.dom.articleContent.querySelectorAll('img').forEach(function (img) {
        if (img.closest('.profile-avatar') || img.closest('.profile-links')) return
        img.style.cursor = 'zoom-in'
        img.addEventListener('click', function () {
          app.lightbox.open(img.src, img.alt, null)
        })
      })
      app.article.renderTOC()
      app.article.renderRelated(id)
      app.views.switchTo('article')
      app.dom.tocToggle.classList.add('show')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }).catch(function (e) {
      console.error('Article load failed:', id, e)
      app.toast.show('文章加载失败', 3000)
      app.views.switchTo('list')
    })
  },

  showAbout: function() {
    app.views.switchTo('about')
    app.utils.resetOG()
    document.title = '关于 · SnowBlock'
    app.utils.setOGTag('og:title', '关于 · SnowBlock')
    fetch('content/pages/about.md').then(function (r) { return r.text() }).then(function (mdText) {
      app.dom.articleTitle.textContent = '关于'
      app.dom.articleMeta.innerHTML = ''
      app.dom.articleContent.innerHTML = app.utils.safeRender(mdText)
      app.article.enhance(app.dom.articleContent)
      app.dom.relatedPosts.innerHTML = ''
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }).catch(function (e) {
      console.error('About page load failed:', e)
      app.toast.show('关于页加载失败', 3000)
      app.views.switchTo('list')
    })
  },

  enhance: function(container) {
    container.querySelectorAll('pre').forEach(function (pre) {
      if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) return
      var wrapper = document.createElement('div')
      wrapper.className = 'code-block-wrapper'
      pre.parentNode.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)
      var btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.textContent = '复制'
      btn.onclick = function (e) {
        e.stopPropagation()
        try {
          navigator.clipboard.writeText(pre.innerText).then(function () {
            btn.textContent = '已复制 V'
            btn.classList.add('copied')
            setTimeout(function () { btn.textContent = '复制'; btn.classList.remove('copied') }, 2000)
          }).catch(function () {
            btn.textContent = '失败'
            setTimeout(function () { btn.textContent = '复制' }, 1500)
          })
        } catch (e) {
          btn.textContent = '失败'
          setTimeout(function () { btn.textContent = '复制' }, 1500)
        }
      }
      wrapper.appendChild(btn)
    })
    container.querySelectorAll('table').forEach(function (table) {
      if (table.closest && table.closest('.table-responsive')) return
      var wrap = document.createElement('div')
      wrap.className = 'table-responsive'
      table.parentNode.insertBefore(wrap, table)
      wrap.appendChild(table)
    })
  },

  renderRelated: function(currentId) {
    var current = app.state.postsMeta.find(function (p) { return p.id === currentId })
    if (!current) { app.dom.relatedPosts.innerHTML = ''; return }
    var scored = app.state.postsMeta.filter(function (p) {
      return p.id !== currentId
    }).map(function (p) {
      var common = p.tags.filter(function (t) { return current.tags.indexOf(t) !== -1 }).length
      return { post: p, score: common }
    }).filter(function (s) { return s.score > 0 })
    scored.sort(function (a, b) { return b.score - a.score })
    var top = scored.slice(0, 3)
    if (!top.length) { app.dom.relatedPosts.innerHTML = ''; return }
    var html = '<div class="related-title">相关文章</div><div class="related-grid">'
    top.forEach(function (s) {
      html += '<div class="related-card" data-id="' + s.post.id + '">' +
        '<div class="related-card-title">' + s.post.title + '</div>' +
        '<div class="related-card-date">' + s.post.date + '</div></div>'
    })
    html += '</div>'
    app.dom.relatedPosts.innerHTML = html
    app.dom.relatedPosts.querySelectorAll('.related-card').forEach(function (el) {
      el.addEventListener('click', function () { app.router.navigateTo(el.dataset.id) })
    })
  },

  renderTOC: function(container) {
    app.dom.tocPanel.innerHTML = ''
    if (container === undefined) container = app.dom.articleContent
    var headings = container.querySelectorAll('h2, h3')
    if (headings.length < 2) { app.dom.tocPanel.classList.remove('show'); return }
    var html = ''
    var seenIds = {}
    headings.forEach(function (h) {
      var baseId = h.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '')
      var id = baseId
      var n = 2
      while (seenIds[id]) { id = baseId + '-' + n++ }
      seenIds[id] = true
      h.id = id
      var tag = h.tagName.toLowerCase()
      html += '<a class="toc-link ' + tag + '" href="#' + id + '">' + h.textContent + '</a>'
    })
    app.dom.tocPanel.innerHTML = html
    app.dom.tocPanel.querySelectorAll('.toc-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault()
        var target = document.getElementById(a.getAttribute('href').slice(1))
        if (target) target.scrollIntoView({ behavior: 'smooth' })
      })
    })
    if (app.state.tocSpy) app.state.tocSpy.disconnect()
    app.state.tocSpy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return
        app.dom.tocPanel.querySelectorAll('.toc-link').forEach(function (l) { l.classList.remove('active') })
        var link = app.dom.tocPanel.querySelector('.toc-link[href="#' + entry.target.id + '"]')
        if (link) link.classList.add('active')
      })
    }, { rootMargin: '-80px 0px -60% 0px' })
    headings.forEach(function (h) { app.state.tocSpy.observe(h) })
  }
}

app.dom.tocToggle.addEventListener('click', function () {
  app.dom.tocPanel.classList.toggle('show')
})

app.archive = {
  getHeatmapYear: function () {
    if (!app.state.currentHeatmapYear) {
      var years = {}
      app.state.postsMeta.forEach(function (p) {
        if (p.date) years[p.date.substring(0, 4)] = true
      })
      var keys = Object.keys(years).sort()
      app.state.currentHeatmapYear = parseInt(keys[keys.length - 1]) || new Date().getFullYear()
    }
    return app.state.currentHeatmapYear
  },

  renderHeatmap: function () {
    var year = this.getHeatmapYear()
    var dayCounts = {}
    var dayPosts = {}
    app.state.postsMeta.forEach(function (p) {
      if (p.date && p.date.indexOf(year) === 0) {
        dayCounts[p.date] = (dayCounts[p.date] || 0) + 1
        if (!dayPosts[p.date]) dayPosts[p.date] = []
        dayPosts[p.date].push(p)
      }
    })
    app.state.heatmapDayPosts = dayPosts
    var startDate = new Date(year, 0, 1)
    var startDay = startDate.getDay()
    var firstCell = new Date(startDate)
    firstCell.setDate(firstCell.getDate() - startDay)
    var endDate = new Date(year, 11, 31)
    var endDay = endDate.getDay()
    var lastCell = new Date(endDate)
    lastCell.setDate(lastCell.getDate() + (6 - endDay))
    var weeks = []
    var cursor = new Date(firstCell)
    while (cursor <= lastCell) {
      var week = []
      for (var d = 0; d < 7; d++) {
        week.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(week)
    }
    var maxCount = 0
    Object.keys(dayCounts).forEach(function (k) {
      if (dayCounts[k] > maxCount) maxCount = dayCounts[k]
    })
    function getColor(count) {
      if (count === 0) return 'var(--heatmap-empty)'
      var level = count / (maxCount || 1)
      if (level < 0.25) return 'var(--heatmap-l1)'
      if (level < 0.5) return 'var(--heatmap-l2)'
      if (level < 0.75) return 'var(--heatmap-l3)'
      return 'var(--heatmap-l4)'
    }
    var monthPositions = []
    var seenMonths = {}
    weeks.forEach(function (week, wi) {
      for (var d = 0; d < 7; d++) {
        var m = week[d].getMonth()
        var y = week[d].getFullYear()
        var key = y + '-' + m
        if (!seenMonths[key]) {
          seenMonths[key] = true
          if (y === year) {
            monthPositions.push({ col: wi, label: (m + 1) + '月' })
          }
          break
        }
      }
    })
    var activeYears = {}
    app.state.postsMeta.forEach(function (p) {
      if (p.date) activeYears[p.date.substring(0, 4)] = true
    })
    var yearList = Object.keys(activeYears).sort()
    var monthLabels = Array(weeks.length).fill('')
    monthPositions.forEach(function (mp) {
      monthLabels[mp.col] = mp.label
    })
    var html = '<div class="heatmap-wrap">'
    html += '<div class="heatmap-header">'
    yearList.forEach(function (y) {
      var cls = parseInt(y) === year ? ' active' : ''
      html += '<button class="heatmap-year-btn' + cls + '" data-year="' + y + '">' + y + '</button>'
    })
    html += '</div>'
    html += '<div class="heatmap-body"><div class="heatmap-body-inner">'
    html += '<div class="heatmap-labels">'
    var dayLabels = ['', '一', '', '三', '', '五', '']
    dayLabels.forEach(function (l) {
      html += '<span class="heatmap-label">' + l + '</span>'
    })
    html += '</div><div class="heatmap-grid"><div class="heatmap-months">'
    monthLabels.forEach(function (label) {
      html += '<span class="heatmap-month">' + (label || '') + '</span>'
    })
    html += '</div><div class="heatmap-cells">'
    weeks.forEach(function (week) {
      html += '<div class="hm-week">'
      week.forEach(function (day) {
        var ds = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0')
        var count = dayCounts[ds] || 0
        html += '<span class="heatmap-cell" style="background:' + getColor(count) + '" data-date="' + ds + '"></span>'
      })
      html += '</div>'
    })
    html += '</div></div></div></div>'
    html += '<div class="heatmap-detail" id="heatmapDetail" style="display:none">'
    html += '<div class="heatmap-detail-header">'
    html += '<span class="heatmap-detail-date" id="heatmapDetailDate"></span>'
    html += '<span class="heatmap-detail-close" id="heatmapDetailClose">x</span>'
    html += '</div>'
    html += '<div class="heatmap-detail-list" id="heatmapDetailList"></div>'
    html += '</div></div>'
    return html
  },

  render: function () {
    var groups = {}
    var pinnedPosts = []
    app.state.postsMeta.forEach(function (p) {
      if (p.pinned) { pinnedPosts.push(p); return }
      var year = p.date ? p.date.substring(0, 4) : '未知'
      if (!groups[year]) groups[year] = {}
      var month = p.date ? p.date.substring(5, 7) : '??'
      if (!groups[year][month]) groups[year][month] = { posts: [], albums: [] }
      groups[year][month].posts.push(p)
    })
    app.state.albums.forEach(function (a) {
      var parts = a.date ? a.date.split('.') : []
      var year = parts[0] || '未知'
      var month = parts[1] || '??'
      if (!groups[year]) groups[year] = {}
      if (!groups[year][month]) groups[year][month] = { posts: [], albums: [] }
      groups[year][month].albums.push(a)
    })
    var html = ''
    if (pinnedPosts.length) {
      html += '<div class="archive-year"><div class="archive-year-header">[置顶]</div><div class="archive-month"><ul class="archive-list">'
      pinnedPosts.forEach(function (p) {
        html += '<li class="archive-item" data-id="' + p.id + '">' +
          '<span class="archive-item-date">' + (p.date ? p.date.substring(8, 10) : '') + '</span>' +
          '<span class="archive-item-title">' + p.title + '</span></li>'
      })
      html += '</ul></div></div>'
    }
    var years = Object.keys(groups).sort().reverse()
    years.forEach(function (year) {
      html += '<div class="archive-year"><div class="archive-year-header">' + year + '</div>'
      var months = Object.keys(groups[year]).sort().reverse()
      months.forEach(function (month) {
        var block = groups[year][month]
        html += '<div class="archive-month"><div class="archive-month-header">' + month + '月</div><ul class="archive-list">'
        block.posts.sort(function (a, b) {
          var dc = (b.date || '').localeCompare(a.date || '')
          if (dc !== 0) return dc
          return (b.time || '').localeCompare(a.time || '')
        })
        block.posts.forEach(function (p) {
          var day = p.date ? p.date.substring(8, 10) : ''
          html += '<li class="archive-item" data-id="' + p.id + '">' +
            '<span class="archive-item-date">' + day + '</span>' +
            '<span class="archive-item-title">' + p.title + '</span></li>'
        })
        block.albums.forEach(function (a) {
          html += '<li class="archive-item archive-album" data-album="' + a.id + '">' +
            '<span class="archive-item-date">[相册]</span>' +
            '<span class="archive-item-title">' + a.title + '</span></li>'
        })
        html += '</ul></div>'
      })
      html += '</div>'
    })
    app.dom.archiveContent.innerHTML = this.renderHeatmap() + html
    app.dom.archiveContent.querySelectorAll('.archive-item[data-id]').forEach(function (el) {
      el.addEventListener('click', function () { app.router.navigateTo(el.dataset.id) })
    })
    app.dom.archiveContent.querySelectorAll('.archive-item[data-album]').forEach(function (el) {
      el.addEventListener('click', function () { location.hash = '#/gallery/' + el.dataset.album })
    })
    app.dom.archiveContent.querySelectorAll('.heatmap-year-btn').forEach(function (el) {
      el.addEventListener('click', function () {
        app.state.currentHeatmapYear = parseInt(el.dataset.year)
        app.archive.render()
      })
    })
    app.dom.archiveContent.querySelectorAll('.heatmap-cell').forEach(function (el) {
      el.addEventListener('click', function () {
        var date = el.dataset.date
        var posts = (app.state.heatmapDayPosts[date] || [])
        var detail = document.getElementById('heatmapDetail')
        var detailDate = document.getElementById('heatmapDetailDate')
        var detailList = document.getElementById('heatmapDetailList')
        if (!detail) return
        detailDate.textContent = date + (posts.length ? ' . ' + posts.length + ' 篇' : ' . 无文章')
        if (posts.length) {
          var listHtml = ''
          posts.forEach(function (p) {
            listHtml += '<div class="heatmap-detail-item" data-id="' + p.id + '">' + p.title + '</div>'
          })
          detailList.innerHTML = listHtml
          detailList.querySelectorAll('.heatmap-detail-item').forEach(function (item) {
            item.addEventListener('click', function () { app.router.navigateTo(item.dataset.id) })
          })
        } else {
          detailList.innerHTML = ''
        }
        detail.style.display = 'block'
      })
    })
    var closeBtn = document.getElementById('heatmapDetailClose')
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        document.getElementById('heatmapDetail').style.display = 'none'
      })
    }
  },

  show: function () {
    app.views.switchTo('archive')
    app.utils.resetOG()
    document.title = '归档 · SnowBlock'
    app.utils.setOGTag('og:title', '归档 · SnowBlock')
    this.render()
    window.scrollTo({ top: 0 })
  }
}

app.gallery = {
  albumObserver: null,
  albumData: null,
  batchSize: 12,
  loaded: 0,

  renderList: function() {
    var grid = app.dom.albumGrid.querySelector('.album-grid')
    if (!grid) return
    var html = ''
    app.state.albums.forEach(function (a) {
      var layers = ''
      for (var i = 0; i < 3; i++) {
        var imgUrl
        if (i === 2) {
          imgUrl = a.cover
        } else if (a.photos[i]) {
          imgUrl = a.photos[i].url
        } else {
          imgUrl = a.cover
        }
        layers += '<div class="album-layer album-layer-' + i + '"><img src="' + imgUrl + '" alt="" loading="lazy"></div>'
      }
      html += '<div class="album-card" data-album="' + a.id + '">' +
        '<div class="album-stack">' + layers + '</div>' +
        '<div class="album-info">' +
        '<div class="album-title">' + a.title + '</div>' +
        '<div class="album-date">' + a.date + '</div>' +
        (a.description ? '<div class="album-desc">' + a.description + '</div>' : '') +
        '</div></div>'
    })
    grid.innerHTML = html
    grid.querySelectorAll('.album-card').forEach(function (el, idx) {
      el.style.animationDelay = Math.min(idx * 0.08, 0.8) + 's'
      el.addEventListener('click', function () { location.hash = '#/gallery/' + el.dataset.album })
    })
  },

  renderBatch: function() {
    var grid = app.dom.albumDetail.querySelector('.photo-grid')
    if (!grid || !this.albumData) return
    var end = Math.min(this.loaded + this.batchSize, this.albumData.photos.length)
    var html = ''
    for (var i = this.loaded; i < end; i++) {
      var p = this.albumData.photos[i]
      html += '<div class="photo-item">' +
        '<img src="' + p.url + '" alt="" decoding="async">' +
        '</div>'
    }
    grid.insertAdjacentHTML('beforeend', html)
    var items = grid.querySelectorAll('.photo-item')
    for (var i = this.loaded; i < end; i++) {
      (function (img, exif) {
        img.addEventListener('click', function () {
          app.lightbox.open(img.src, '', exif)
        })
      })(items[i].querySelector('img'), this.albumData.photos[i].exif)
    }
    this.loaded = end
    var nextEnd = Math.min(end + this.batchSize, this.albumData.photos.length)
    for (var i = end; i < nextEnd; i++) {
      var p = this.albumData.photos[i]
      var pre = new Image()
      pre.src = p.url
    }
    var sentinel = grid.querySelector('.album-sentinel')
    if (end >= this.albumData.photos.length) {
      if (sentinel) sentinel.style.display = 'none'
      return
    }
    if (!sentinel) {
      sentinel = document.createElement('div')
      sentinel.className = 'album-sentinel'
      sentinel.style.cssText = 'height:1px'
      grid.appendChild(sentinel)
    }
    if (this.albumObserver) this.albumObserver.disconnect()
    var self = this
    this.albumObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) self.renderBatch()
    }, { rootMargin: '200px' })
    this.albumObserver.observe(sentinel)
  },

  showAlbum: function(id) {
    var a = app.state.albums.find(function (x) { return x.id === id })
    if (!a) { console.error('Album not found:', id); return }
    this.albumData = a
    this.loaded = 0
    if (this.albumObserver) { this.albumObserver.disconnect(); this.albumObserver = null }
    app.dom.albumGrid.style.display = 'none'
    app.dom.albumDetail.style.display = 'block'
    var html = '<div class="album-detail-wrap">' +
      '<div class="album-detail-top">' +
      '<button class="album-back" id="albumBack">&larr; 返回</button>' +
      '</div>' +
      '<div class="album-detail-header">' +
      '<div class="album-detail-title">' + a.title + '</div>' +
      '<div class="album-detail-meta">' + a.date + ' . ' + a.photos.length + ' 个瞬间</div>' +
      (a.description ? '<div class="album-detail-desc">' + a.description + '</div>' : '') +
      '</div><div class="photo-grid"></div></div>'
    app.dom.albumDetail.innerHTML = html
    document.getElementById('albumBack').addEventListener('click', function () {
      location.hash = '#/gallery'
    })
    this.renderBatch()
  },

  show: function() {
    app.views.switchTo('gallery')
    app.utils.resetOG()
    document.title = '画廊 · SnowBlock'
    app.utils.setOGTag('og:title', '画廊 · SnowBlock')
    app.dom.albumGrid.style.display = ''
    app.dom.albumDetail.style.display = 'none'
    app.dom.albumGrid.innerHTML = '<div class="gallery-wrap"><div class="gallery-header"><h1>照片墙</h1></div><div class="album-grid" id="albumGridInner"></div></div>'
    this.renderList()
    window.scrollTo({ top: 0 })
  }
}

app.modules = {
  current: null,
  data: {},
  player: { index: -1, audio: null },

  titles: { moments: '说说', friends: '友链', music: '音乐' },

  show: function(name) {
    var self = this
    this.current = name
    app.views.switchTo('module')
    app.utils.resetOG()
    document.title = this.titles[name] + ' · SnowBlock'
    var title = this.titles[name]
    app.dom.moduleView.innerHTML =
      '<div class="module-wrap">' +
        '<div class="module-header"><h1>' + title + '</h1></div>' +
        '<div class="module-body">加载中...</div>' +
      '</div>'
    window.scrollTo({ top: 0 })
    if (this.data[name]) { this.render(name); return }
    fetch('content/' + name + '/index.json?v=' + (document.querySelector('meta[name="build-ts"]')?.getAttribute('content') || Date.now()))
      .then(function(r) { return r.json() })
      .then(function(data) {
        self.data[name] = data
        if (self.current === name) self.render(name)
      })
      .catch(function() {
        if (self.current === name) {
          app.dom.moduleView.querySelector('.module-body').innerHTML = '<div class="state-error">' + title + '数据加载失败</div>'
        }
      })
  },

  render: function(name) {
    var body = app.dom.moduleView.querySelector('.module-body')
    if (!body) return
    if (name === 'moments') this.renderMoments(body)
    else if (name === 'friends') this.renderFriends(body)
    else if (name === 'music') this.renderMusic(body)
  },

  esc: function(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  },

  /* ===== 说说 ===== */
  renderMoments: function(body) {
    var self = this
    var html = '<div class="moments-list">'
    ;(this.data.moments || []).forEach(function(m) {
      html += '<div class="moment-item">' +
        '<span class="moment-dot"></span>' +
        '<div class="moment-content">' +
          '<div class="moment-text">' + self.esc(m.text) + '</div>' +
          '<div class="moment-time"><i class="fa-solid fa-clock"></i> ' + self.esc(m.time) + '</div>' +
        '</div>' +
      '</div>'
    })
    html += '</div>'
    body.innerHTML = html
  },

  /* ===== 友链 ===== */
  renderFriends: function(body) {
    var self = this
    var html = '<div class="friends-grid">'
    ;(this.data.friends || []).forEach(function(f) {
      html += '<a class="friend-card" href="' + self.esc(f.url) + '" target="_blank" rel="noopener">' +
        '<div class="friend-name">' + self.esc(f.name) + '</div>' +
        '<div class="friend-desc">' + self.esc(f.desc || '') + '</div>' +
        '<div class="friend-url">' + self.esc(f.url) + '</div>' +
      '</a>'
    })
    html += '</div>'
    body.innerHTML = html
  },

  /* ===== 音乐 ===== */
  renderMusic: function(body) {
    var self = this
    var html = '<div class="music-panel">' +
      '<div class="music-now"><i class="fa-solid fa-music"></i> <span id="musicNow">点击下方曲目开始播放</span></div>' +
      '<div class="music-list">'
    ;(this.data.music || []).forEach(function(s, i) {
      html += '<div class="music-item" data-i="' + i + '">' +
        '<span class="music-idx">' + (i + 1) + '</span>' +
        '<span class="music-title">' + self.esc(s.title) + '</span>' +
        '<span class="music-artist">' + self.esc(s.artist) + '</span>' +
      '</div>'
    })
    html += '</div></div>'
    body.innerHTML = html
    body.querySelectorAll('.music-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var i = parseInt(el.dataset.i, 10)
        self.play(i)
      })
    })
    if (this.player.index >= 0) this.syncPlayerUI()
  },

  play: function(i) {
    var s = this.data.music[i]
    if (!s) return
    this.player.index = i
    var audio = document.getElementById('musicAudio')
    if (!audio) return
    audio.src = s.url
    audio.play()
    document.getElementById('musicBar').style.display = 'flex'
    this.syncPlayerUI()
  },

  toggle: function() {
    var audio = document.getElementById('musicAudio')
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  },

  stop: function() {
    var audio = document.getElementById('musicAudio')
    if (audio) { audio.pause(); audio.src = '' }
    document.getElementById('musicBar').style.display = 'none'
    var now = document.getElementById('musicNow')
    if (now) now.textContent = '点击下方曲目开始播放'
    var playing = document.querySelector('.music-item.playing')
    if (playing) playing.classList.remove('playing')
    this.player.index = -1
  },

  syncPlayerUI: function() {
    var s = this.data.music[this.player.index]
    var bar = document.getElementById('musicBar')
    var titleEl = document.getElementById('musicBarTitle')
    var now = document.getElementById('musicNow')
    if (s) {
      if (titleEl) titleEl.textContent = s.title + ' - ' + s.artist
      if (now) now.textContent = s.title + ' - ' + s.artist
    }
    document.querySelectorAll('.music-item').forEach(function(el) {
      el.classList.toggle('playing', parseInt(el.dataset.i, 10) === app.modules.player.index)
    })
    var btn = document.getElementById('musicPlayBtn')
    var audio = document.getElementById('musicAudio')
    if (btn && audio) {
      btn.innerHTML = audio.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>'
    }
  }
}

document.addEventListener('click', function(e) {
  if (e.target.closest && e.target.closest('#musicPlayBtn')) app.modules.toggle()
})
document.addEventListener('click', function(e) {
  if (e.target.closest && e.target.closest('#musicCloseBtn')) app.modules.stop()
})
document.getElementById('musicAudio').addEventListener('play', function() { app.modules.syncPlayerUI() })
document.getElementById('musicAudio').addEventListener('pause', function() { app.modules.syncPlayerUI() })

app.home = {
  render: function() {
    this.renderMoments()
    this.renderPosts()
    this.renderPhotos()
  },

  renderMoments: function() {
    var body = document.getElementById('homeMomentsBody')
    if (!body) return
    var self = this
    if (!app.modules.data.moments) {
      app.modules.show('moments')
      var check = setInterval(function() {
        if (app.modules.data.moments) { clearInterval(check); self.renderMoments() }
      }, 200)
      setTimeout(function() { clearInterval(check) }, 3000)
      return
    }
    var list = (app.modules.data.moments || []).slice(0, 3)
    if (!list.length) { body.innerHTML = '<div class="home-empty">暂无说说</div>'; return }
    var html = '<div class="home-moments">'
    list.forEach(function(m) {
      html += '<div class="home-moment"><div class="home-moment-dot"></div><div class="home-moment-text">' + app.modules.esc(m.text) + '</div><div class="home-moment-time">' + app.modules.esc(m.time) + '</div></div>'
    })
    html += '</div><a class="home-more" href="#/moments">更多说说 <i class="fa-solid fa-arrow-right"></i></a>'
    body.innerHTML = html
  },

  renderPosts: function() {
    var body = document.getElementById('homePostsBody')
    if (!body) return
    var posts = app.state.postsMeta || []
    if (!posts.length) { body.innerHTML = '<div class="home-empty">暂无文章</div>'; return }
    var hero = posts[0]
    var rest = posts.slice(1, 4)
    var heroStyle = hero.image
      ? 'background-image:url(' + hero.image + ');background-size:cover;background-position:center;'
      : 'background:linear-gradient(135deg,var(--color-accent),var(--color-accent-warm));'
    var html = '<a class="home-hero" href="#/' + hero.id + '" style="' + heroStyle + '">' +
      '<div class="home-hero-mask"></div>' +
      '<div class="home-hero-info">' +
        '<h3 class="home-hero-title">' + app.modules.esc(hero.title) + '</h3>' +
        '<div class="home-hero-meta">' + hero.date + (hero.readTime ? ' · ' + hero.readTime : '') + '</div>' +
      '</div></a>'
    if (rest.length) {
      html += '<div class="home-post-row">'
      rest.forEach(function(p) {
        var style = p.image
          ? 'background-image:url(' + p.image + ');background-size:cover;background-position:center;'
          : 'background:linear-gradient(135deg,var(--color-accent-glow),var(--color-accent-warm));'
        html += '<a class="home-post-card" href="#/' + p.id + '" style="' + style + '">' +
          '<div class="home-post-card-mask"></div>' +
          '<div class="home-post-card-info"><div class="home-post-card-title">' + app.modules.esc(p.title) + '</div><div class="home-post-card-date">' + p.date + '</div></div>' +
        '</a>'
      })
      html += '</div>'
    }
    html += '<a class="home-more" href="#/">全部文章 <i class="fa-solid fa-arrow-right"></i></a>'
    body.innerHTML = html
  },

  renderPhotos: function() {
    var body = document.getElementById('homePhotosBody')
    if (!body) return
    var albums = app.state.albums || []
    if (!albums.length) { body.innerHTML = '<div class="home-empty">暂无照片</div>'; return }
    var photos = []
    albums.forEach(function(a) {
      if (a.cover) photos.push({ url: a.cover, album: a.id })
      else if (a.photos && a.photos.length) photos.push({ url: a.photos[0].url, album: a.id })
    })
    if (!photos.length) { body.innerHTML = '<div class="home-empty">暂无照片</div>'; return }
    var html = '<div class="home-photo" id="homePhoto">' +
      '<img src="" alt="" id="homePhotoImg">' +
      '<div class="home-photo-dots" id="homePhotoDots"></div>' +
    '</div>'
    body.innerHTML = html
    var idx = 0
    var timer = null
    var img = document.getElementById('homePhotoImg')
    var dotsWrap = document.getElementById('homePhotoDots')
    var box = document.getElementById('homePhoto')
    function show(i) {
      idx = (i + photos.length) % photos.length
      img.style.opacity = 0
      setTimeout(function() {
        img.src = photos[idx].url
        img.style.opacity = 1
      }, 200)
      var dots = ''
      photos.forEach(function(p, j) {
        dots += '<span class="home-photo-dot' + (j === idx ? ' active' : '') + '" data-i="' + j + '"></span>'
      })
      dotsWrap.innerHTML = dots
    }
    function startTimer() { stopTimer(); timer = setInterval(function() { show(idx + 1) }, 4000) }
    function stopTimer() { if (timer) clearInterval(timer) }
    show(0)
    startTimer()
    dotsWrap.addEventListener('click', function(e) {
      var dot = e.target.closest('.home-photo-dot')
      if (dot) show(parseInt(dot.dataset.i, 10))
    })
    box.addEventListener('click', function() { location.hash = '#/gallery' })
    box.addEventListener('mouseenter', stopTimer)
    box.addEventListener('mouseleave', startTimer)
  }
}

app.router = {
  searchTimer: null,

  navigateTo: function(id) {
    location.hash = '#/' + id
  },

  handleHash: function() {
    var raw = location.hash.replace(/^#\/?/, '')
    if (!raw) { app.views.switchTo('list'); this.setActiveNav('blog'); app.utils.resetOG(); window.scrollTo({ top: 0 }); if (app.home) app.home.render(); return }
    if (raw === 'archive') { app.archive.show(); this.setActiveNav('archive'); return }
    if (raw === 'gallery') { app.gallery.show(); this.setActiveNav('gallery'); return }
    if (raw === 'moments') { app.modules.show('moments'); this.setActiveNav('moments'); return }
    if (raw === 'friends') { app.modules.show('friends'); this.setActiveNav('friends'); return }
    if (raw === 'music') { app.modules.show('music'); this.setActiveNav('music'); return }
    if (raw === 'random') {
      if (app.state.postsMeta.length) this.navigateTo(app.state.postsMeta[Math.floor(Math.random() * app.state.postsMeta.length)].id)
      return
    }
    if (raw === 'about') { app.article.showAbout(); this.setActiveNav('about'); return }
    if (raw.indexOf('gallery/') === 0) {
      var albumId = decodeURIComponent(raw.replace('gallery/', ''))
      app.gallery.show()
      app.gallery.showAlbum(albumId)
      this.setActiveNav('gallery')
      return
    }
    var found = app.state.postsMeta.some(function (p) { return p.id === raw })
    if (found) { app.article.load(raw); this.setActiveNav(null); return }
    app.views.switchTo('list'); this.setActiveNav('blog'); app.utils.resetOG(); window.scrollTo({ top: 0 })
  },

  setActiveNav: function(which) {
    app.dom.navBlog.className = which === 'blog' ? 'active' : ''
    app.dom.navArchive.className = which === 'archive' ? 'active' : ''
    app.dom.navGallery.className = which === 'gallery' ? 'active' : ''
    app.dom.navMoments.className = which === 'moments' ? 'active' : ''
    app.dom.navFriends.className = which === 'friends' ? 'active' : ''
    app.dom.navMusic.className = which === 'music' ? 'active' : ''
    app.dom.navAbout.className = which === 'about' ? 'active' : ''
  }
}

app.dom.backLink.addEventListener('click', function (e) {
  e.preventDefault()
  location.hash = '#/'
})

app.dom.navBlog.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/' })
app.dom.navArchive.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/archive' })
app.dom.navGallery.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/gallery' })
app.dom.navMoments.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/moments' })
app.dom.navFriends.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/friends' })
app.dom.navMusic.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/music' })
app.dom.navAbout.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/about' })

window.addEventListener('scroll', function () {
  if (window.scrollY > 300) app.dom.backToTop.classList.add('show')
  else app.dom.backToTop.classList.remove('show')
})
app.dom.backToTop.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

window.addEventListener('hashchange', function () { app.router.handleHash() })

app.dom.searchInput.addEventListener('input', function () {
  clearTimeout(app.router.searchTimer)
  app.router.searchTimer = setTimeout(function () { app.state.currentPage = 1; app.posts.applyFilters() }, 250)
})

document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    app.dom.searchInput.focus()
  }
})

﻿app.init = function () {
  if (!window.markdownit || !window.hljs || !window.DOMPurify) {
    document.body.innerHTML += '<div class="state-error">依赖加载失败，请刷新</div>'
    return
  }

  app.theme.init()

  var menuBtn = document.getElementById('menuToggle')
  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      var nav = document.getElementById('navLinks')
      if (nav) nav.classList.toggle('open')
    })
  }
  document.addEventListener('click', function(e) {
    var nav = document.getElementById('navLinks')
    var btn = document.getElementById('menuToggle')
    if (nav && nav.classList.contains('open') && !nav.contains(e.target) && (!btn || !btn.contains(e.target))) {
      nav.classList.remove('open')
    }
  })

  app.state.md = window.markdownit({
    html: true, linkify: true, typographer: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try { return '<pre class="hljs"><code>' + hljs.highlight(str, { language: lang, ignoreIllegals: true }).value + '</code></pre>' } catch (e) { }
      }
      return '<pre class="hljs"><code>' + app.state.md.utils.escapeHtml(str) + '</code></pre>'
    }
  })
  var mdImage = app.state.md.renderer.rules.image
  app.state.md.renderer.rules.image = function (tokens, idx, options, env, self) {
    var token = tokens[idx]
    var src = token.attrs[token.attrIndex('src')][1]
    var alt = token.content || ''
    if (src.indexOf('../my-images/') !== -1 || src.indexOf('assets/vendor/') !== -1) {
      return '<img src="' + app.state.md.utils.escapeHtml(src) + '" alt="' + app.state.md.utils.escapeHtml(alt) + '" loading="lazy">'
    }
    return mdImage(tokens, idx, options, env, self)
  }

  app.state.purifyConfig = {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'code', 'pre', 'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'button', 'progress'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'loading', 'style', 'type', 'value', 'max']
  }

  app.profile.render()

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
  }

  fetch('content/albums/index.json?v=' + (document.querySelector('meta[name="build-ts"]')?.getAttribute('content') || Date.now())).then(function (r) { return r.json() }).then(function (data) {
    app.state.albums = data
    if (app.profile && app.profile.updateStats) app.profile.updateStats()
    if (app.home) app.home.renderPhotos()
  }).catch(function (e) { console.error('Albums load failed:', e) })

  fetch('content/posts/index.json?v=' + (document.querySelector('meta[name="build-ts"]')?.getAttribute('content') || Date.now())).then(function (r) { return r.json() }).then(function (data) {
    app.state.postsMeta = data
    app.state.postsMeta.sort(function (a, b) {
      var pa = a.pinned ? 1 : 0
      var pb = b.pinned ? 1 : 0
      if (pa !== pb) return pb - pa
      var dc = (b.date || '').localeCompare(a.date || '')
      if (dc !== 0) return dc
      return (b.time || '').localeCompare(a.time || '')
    })
    app.posts.renderTagFilters()
    if (app.profile && app.profile.updateStats) app.profile.updateStats()
    if (app.home) { app.home.renderPosts(); app.home.renderMoments() }
    var loaded = 0
    var total = app.state.postsMeta.length
    app.state.postsMeta.forEach(function (p) {
      fetch('content/posts/' + p.file).then(function (r) { return r.text() }).then(function (mdText) {
        app.state.allExcerpts[p.id] = app.utils.getExcerpt(app.utils.stripFrontMatter(mdText))
        loaded++
        if (loaded === total) { app.posts.applyFilters(); app.router.handleHash() }
      }).catch(function (e) {
        console.error('Excerpt load failed:', p.id, e)
        loaded++
        if (loaded === total) { app.posts.applyFilters(); app.router.handleHash() }
      })
    })
    if (total === 0) { app.posts.applyFilters(); app.router.handleHash() }
  }).catch(function (e) {
    console.error('Posts index load failed:', e)
    app.dom.postContainer.innerHTML = '<div class="state-error">文章加载失败</div>'
  })
}

window.addEventListener('load', app.init)
