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

function renderProfile() {
  if (!profileConfig.name) { profileCard.style.display = 'none'; return }
  profileCard.style.display = 'block'
  var links = (profileConfig.links || []).map(function (l) {
    var iconSrc = l.icon ? 'https://api.iconify.design/' + l.icon + '.svg' : ''
    var icon = iconSrc ? '<img src="' + iconSrc + '" alt="' + l.name + '" style="width:0.9rem;height:0.9rem;filter:brightness(0) invert(0.7);">' : l.name
    return '<a href="' + l.url + '" target="_blank" rel="noopener" title="' + l.name + '">' + icon + '</a>'
  }).join('')
  profileCard.innerHTML =
    '<div class="profile-wrap">' +
    (profileConfig.avatar ? '<img class="profile-avatar" src="' + profileConfig.avatar + '" alt="avatar">' : '') +
    '<a href="https://snowblock.top" class="profile-name">' + (profileConfig.name || '') + '</a>' +
    '<div class="profile-divider"></div>' +
    (profileConfig.bio ? '<div class="profile-bio">' + profileConfig.bio + '</div>' : '') +
    (links ? '<div class="profile-links">' + links + '</div>' : '') +
    '</div>'
}

function renderTagFilters() {
  var allTags = []
  var tagCounts = {}
  postsMeta.forEach(function (p) {
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
    var active = t === activeTag ? 'active' : ''
    var size = getSize(tagCounts[t])
    html += '<span class="tag-filter ' + size + ' ' + active + '" data-tag="' + t + '">' + t + '</span>'
  })
  if (activeTag) {
    html += '<span class="tag-filter size-2 active" data-tag="">x 清除筛选</span>'
  }
  tagFilters.innerHTML = html
  tagFilters.querySelectorAll('.tag-filter').forEach(function (el) {
    el.addEventListener('click', function () {
      var tag = el.dataset.tag
      activeTag = tag || null
      currentPage = 1
      renderTagFilters()
      applyFilters()
    })
  })
}

function applyFilters() {
  var q = (searchInput.value || '').toLowerCase()
  var filtered = postsMeta.filter(function (p) {
    if (activeTag && p.tags.indexOf(activeTag) === -1) return false
    if (!q) return true
    if (p.title.toLowerCase().indexOf(q) !== -1) return true
    if (p.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1 })) return true
    if (p.date.toLowerCase().indexOf(q) !== -1) return true
    if ((allExcerpts[p.id] || '').toLowerCase().indexOf(q) !== -1) return true
    return false
  })
  renderFiltered(filtered)
}

function getPageCount(filtered) { return Math.ceil(filtered.length / PER_PAGE) || 1 }

function getPagePosts(filtered, page) {
  var start = (page - 1) * PER_PAGE
  return filtered.slice(start, start + PER_PAGE)
}

function renderPagination(filtered, current) {
  var total = getPageCount(filtered)
  if (total <= 1) { paginationEl.innerHTML = ''; return }
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
  paginationEl.innerHTML = html
  paginationEl.querySelectorAll('.page-btn:not([disabled])').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var page = parseInt(btn.dataset.page)
      if (page && page !== current) { currentPage = page; applyFilters() }
    })
  })
}

function renderFiltered(filtered) {
  var page = Math.min(currentPage, getPageCount(filtered))
  currentPage = page
  var posts = getPagePosts(filtered, page)
  var html = ''
  posts.forEach(function (p) {
    var tags = p.tags.map(function (t) {
      var cls = 'tag'
      if (t === 'Bash' || t === '终端') cls += ' bash'
      else if (['表格', '数据'].indexOf(t) !== -1) cls += ' test'
      else cls += ' tech'
      var active = t === activeTag ? ' active-tag' : ''
      return '<span class="' + cls + active + '" data-tag="' + t + '">' + t + '</span>'
    }).join('')
    var title = p.title
    var excerpt = allExcerpts[p.id] || ''
    var sq = (searchInput.value || '').trim()
    if (sq) {
      var regex = new RegExp('(' + escapeRegex(sq) + ')', 'gi')
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
  if (!html) html = '<div style="color:rgba(200,235,250,0.6);text-align:center;padding:2rem;">没有匹配的文章</div>'
  postContainer.innerHTML = html
  renderPagination(filtered, page)

  postContainer.querySelectorAll('.tag').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.stopPropagation()
      var tag = el.dataset.tag
      if (tag) { activeTag = tag; currentPage = 1; renderTagFilters(); applyFilters() }
    })
  })
  postContainer.querySelectorAll('.post-card').forEach(function (el) {
    el.addEventListener('click', function () { navigateTo(el.dataset.postId) })
  })
}

function navigateTo(id) { location.hash = '#/' + id }

function loadArticle(id) {
  var meta = postsMeta.find(function (p) { return p.id === id })
  if (!meta) { showListView(); return }
  fetch('content/posts/' + meta.file).then(function (r) { return r.text() }).then(function (mdText) {
    var content = stripMeta(mdText)
    articleTitle.textContent = meta.title
    document.title = meta.title + ' · SnowBlock'
    setOGTag('og:title', meta.title)
    setOGTag('og:description', meta.description || (getExcerpt ? getExcerpt(content, 200) : ''))
    setOGTag('og:image', meta.image || 'https://vps.snowblock.top:9443/raw/ninasukiwww-png/my-images/main/blog/bg.webp')
    setOGTag('og:url', 'https://blog.snowblock.top/#' + id)
    var tags = meta.tags.map(function (t) {
      return '<span class="tag ' + (t === 'Bash' ? 'bash' : 'tech') + '">' + t + '</span>'
    }).join(' ')
    var clean = content.replace(/\s+/g, '')
    var wc = clean.length
    var wcLabel = wc > 999 ? (wc / 1000).toFixed(1) + 'k' : wc
    articleMeta.innerHTML = meta.date + ' . ' + meta.time + ' . ' + meta.readTime + ' . ' + wcLabel + '字 ' + tags
    articleContent.innerHTML = safeRender(content)
    enhance(articleContent)
    articleContent.querySelectorAll('pre').forEach(function (pre) {
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
    articleContent.querySelectorAll('img').forEach(function (img) {
      if (img.closest('.profile-avatar') || img.closest('.profile-links')) return
      img.style.cursor = 'zoom-in'
      img.addEventListener('click', function () {
        lightboxImg.src = img.src
        lightboxImg.alt = img.alt || ''
        currentExif = null
        updateLightboxExif()
        lightbox.classList.add('show')
      })
    })
    renderTOC()
    renderRelated(id)
    listView.style.display = 'none'
    archiveViewEl.style.display = 'none'
    articleViewEl.style.display = 'block'
    pageHeader.style.display = 'none'
    tocToggle.classList.add('show')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }).catch(function () { showListView() })
}

function showListView() {
  listView.style.display = 'block'
  articleViewEl.style.display = 'none'
  archiveViewEl.style.display = 'none'
  galleryView.style.display = 'none'
  pageHeader.style.display = 'block'
  tocToggle.classList.remove('show')
  tocPanel.classList.remove('show')
  resetOG()
  window.scrollTo({ top: 0 })
}

function showAbout() {
  listView.style.display = 'none'
  articleViewEl.style.display = 'block'
  archiveViewEl.style.display = 'none'
  galleryView.style.display = 'none'
  pageHeader.style.display = 'none'
  tocToggle.classList.remove('show')
  tocPanel.classList.remove('show')
  resetOG()
  document.title = '关于 · SnowBlock'
  setOGTag('og:title', '关于 · SnowBlock')
  fetch('content/pages/about.md').then(function (r) { return r.text() }).then(function (mdText) {
    articleTitle.textContent = '关于'
    articleMeta.innerHTML = ''
    articleContent.innerHTML = safeRender(mdText)
    enhance(articleContent)
    relatedPosts.innerHTML = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }).catch(function () { showListView() })
}

function enhance(container) {
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
}

function renderRelated(currentId) {
  var current = postsMeta.find(function (p) { return p.id === currentId })
  if (!current) { relatedPosts.innerHTML = ''; return }
  var scored = postsMeta.filter(function (p) {
    return p.id !== currentId
  }).map(function (p) {
    var common = p.tags.filter(function (t) { return current.tags.indexOf(t) !== -1 }).length
    return { post: p, score: common }
  }).filter(function (s) { return s.score > 0 })
  scored.sort(function (a, b) { return b.score - a.score })
  var top = scored.slice(0, 3)
  if (!top.length) { relatedPosts.innerHTML = ''; return }
  var html = '<div class="related-title">相关文章</div><div class="related-grid">'
  top.forEach(function (s) {
    html += '<div class="related-card" data-id="' + s.post.id + '">' +
      '<div class="related-card-title">' + s.post.title + '</div>' +
      '<div class="related-card-date">' + s.post.date + '</div></div>'
  })
  html += '</div>'
  relatedPosts.innerHTML = html
  relatedPosts.querySelectorAll('.related-card').forEach(function (el) {
    el.addEventListener('click', function () { navigateTo(el.dataset.id) })
  })
}

function renderTOC() {
  tocPanel.innerHTML = ''
  var headings = articleContent.querySelectorAll('h2, h3')
  if (headings.length < 2) { tocPanel.classList.remove('show'); return }
  var html = ''
  headings.forEach(function (h) {
    var id = h.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '')
    h.id = id
    var tag = h.tagName.toLowerCase()
    html += '<a class="toc-link ' + tag + '" href="#' + id + '">' + h.textContent + '</a>'
  })
  tocPanel.innerHTML = html
  tocPanel.querySelectorAll('.toc-link').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault()
      var target = document.getElementById(a.getAttribute('href').slice(1))
      if (target) target.scrollIntoView({ behavior: 'smooth' })
    })
  })
  if (tocSpy) tocSpy.disconnect()
  tocSpy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return
      tocPanel.querySelectorAll('.toc-link').forEach(function (l) { l.classList.remove('active') })
      var link = tocPanel.querySelector('.toc-link[href="#' + entry.target.id + '"]')
      if (link) link.classList.add('active')
    })
  }, { rootMargin: '-80px 0px -60% 0px' })
  headings.forEach(function (h) { tocSpy.observe(h) })
}

tocToggle.addEventListener('click', function () {
  tocPanel.classList.toggle('show')
})

function getHeatmapYear() {
  if (!currentHeatmapYear) {
    var years = {}
    postsMeta.forEach(function (p) {
      if (p.date) years[p.date.substring(0, 4)] = true
    })
    var keys = Object.keys(years).sort()
    currentHeatmapYear = parseInt(keys[keys.length - 1]) || new Date().getFullYear()
  }
  return currentHeatmapYear
}

function renderHeatmap() {
  var year = getHeatmapYear()
  var dayCounts = {}
  var dayPosts = {}
  postsMeta.forEach(function (p) {
    if (p.date && p.date.indexOf(year) === 0) {
      dayCounts[p.date] = (dayCounts[p.date] || 0) + 1
      if (!dayPosts[p.date]) dayPosts[p.date] = []
      dayPosts[p.date].push(p)
    }
  })
  heatmapDayPosts = dayPosts
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
  postsMeta.forEach(function (p) {
    if (p.date) activeYears[p.date.substring(0, 4)] = true
  })
  var yearList = Object.keys(activeYears).sort()
  var cellsWidth = weeks.length * 12 - 2
  var html = '<div class="heatmap-wrap">'
  html += '<div class="heatmap-header">'
  yearList.forEach(function (y) {
    var cls = parseInt(y) === year ? ' active' : ''
    html += '<button class="heatmap-year-btn' + cls + '" data-year="' + y + '">' + y + '</button>'
  })
  html += '</div>'
  html += '<div class="heatmap-months" style="width:' + cellsWidth + 'px;position:relative;height:16px;margin:0 auto;overflow:visible">'
  monthPositions.forEach(function (mp) {
    html += '<span class="heatmap-month" style="left:' + (mp.col * 12) + 'px">' + mp.label + '</span>'
  })
  html += '</div>'
  html += '<div class="heatmap-body"><div class="heatmap-labels">'
  var dayLabels = ['', '一', '', '三', '', '五', '']
  dayLabels.forEach(function (l) {
    html += '<span class="heatmap-label">' + l + '</span>'
  })
  html += '</div><div class="heatmap-cells" style="width:' + cellsWidth + 'px">'
  weeks.forEach(function (week) {
    html += '<div class="hm-week">'
    week.forEach(function (day) {
      var ds = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0')
      var count = dayCounts[ds] || 0
      html += '<span class="heatmap-cell" style="background:' + getColor(count) + '" data-date="' + ds + '"></span>'
    })
    html += '</div>'
  })
  html += '</div></div>'
  html += '<div class="heatmap-detail" id="heatmapDetail" style="display:none">'
  html += '<div class="heatmap-detail-header">'
  html += '<span class="heatmap-detail-date" id="heatmapDetailDate"></span>'
  html += '<span class="heatmap-detail-close" id="heatmapDetailClose">x</span>'
  html += '</div>'
  html += '<div class="heatmap-detail-list" id="heatmapDetailList"></div>'
  html += '</div></div>'
  return html
}

function renderArchive() {
  var groups = {}
  var pinnedPosts = []
  postsMeta.forEach(function (p) {
    if (p.pinned) { pinnedPosts.push(p); return }
    var year = p.date ? p.date.substring(0, 4) : '未知'
    if (!groups[year]) groups[year] = {}
    var month = p.date ? p.date.substring(5, 7) : '??'
    if (!groups[year][month]) groups[year][month] = { posts: [], albums: [] }
    groups[year][month].posts.push(p)
  })
  albums.forEach(function (a) {
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
      block.posts.sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') })
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
  archiveContent.innerHTML = renderHeatmap() + html
  archiveContent.querySelectorAll('.archive-item[data-id]').forEach(function (el) {
    el.addEventListener('click', function () { navigateTo(el.dataset.id) })
  })
  archiveContent.querySelectorAll('.archive-item[data-album]').forEach(function (el) {
    el.addEventListener('click', function () { location.hash = '#/gallery/' + el.dataset.album })
  })
  archiveContent.querySelectorAll('.heatmap-year-btn').forEach(function (el) {
    el.addEventListener('click', function () {
      currentHeatmapYear = parseInt(el.dataset.year)
      renderArchive()
    })
  })
  archiveContent.querySelectorAll('.heatmap-cell').forEach(function (el) {
    el.addEventListener('click', function () {
      var date = el.dataset.date
      var posts = (heatmapDayPosts[date] || [])
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
          item.addEventListener('click', function () { navigateTo(item.dataset.id) })
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
}

function showArchive() {
  listView.style.display = 'none'
  articleViewEl.style.display = 'none'
  galleryView.style.display = 'none'
  archiveViewEl.style.display = 'block'
  pageHeader.style.display = 'none'
  tocToggle.classList.remove('show')
  tocPanel.classList.remove('show')
  resetOG()
  document.title = '归档 · SnowBlock'
  setOGTag('og:title', '归档 · SnowBlock')
  renderArchive()
  window.scrollTo({ top: 0 })
}

var _albumObserver = null
var _albumData = null
var _albumBatchSize = 12
var _albumLoaded = 0

function renderAlbums() {
  var grid = albumGrid.querySelector('.album-grid')
  if (!grid) return
  var html = ''
  albums.forEach(function (a) {
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
  grid.querySelectorAll('.album-card').forEach(function (el) {
    el.addEventListener('click', function () { location.hash = '#/gallery/' + el.dataset.album })
  })
}

function renderAlbumBatch() {
  var grid = albumDetail.querySelector('.photo-grid')
  if (!grid || !_albumData) return
  var end = Math.min(_albumLoaded + _albumBatchSize, _albumData.photos.length)
  var html = ''
  for (var i = _albumLoaded; i < end; i++) {
    var p = _albumData.photos[i]
    html += '<div class="photo-item">' +
      '<img src="' + p.url + '" alt="" decoding="async">' +
      '</div>'
  }
  grid.insertAdjacentHTML('beforeend', html)
  var items = grid.querySelectorAll('.photo-item')
  for (var i = _albumLoaded; i < end; i++) {
    (function (img, exif) {
      img.addEventListener('click', function () {
        lightboxImg.src = img.src
        lightboxImg.alt = ''
        currentExif = exif || null
        updateLightboxExif()
        lightbox.classList.add('show')
      })
    })(items[i].querySelector('img'), _albumData.photos[i].exif)
  }
  _albumLoaded = end
  var nextEnd = Math.min(end + _albumBatchSize, _albumData.photos.length)
  for (var i = end; i < nextEnd; i++) {
    var p = _albumData.photos[i]
    var pre = new Image()
    pre.src = p.url
  }
  var sentinel = grid.querySelector('.album-sentinel')
  if (end >= _albumData.photos.length) {
    if (sentinel) sentinel.style.display = 'none'
    return
  }
  if (!sentinel) {
    sentinel = document.createElement('div')
    sentinel.className = 'album-sentinel'
    sentinel.style.cssText = 'height:1px'
    grid.appendChild(sentinel)
  }
  if (_albumObserver) _albumObserver.disconnect()
  _albumObserver = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) renderAlbumBatch()
  }, { rootMargin: '200px' })
  _albumObserver.observe(sentinel)
}

function showAlbum(id) {
  var a = albums.find(function (x) { return x.id === id })
  if (!a) return
  _albumData = a
  _albumLoaded = 0
  if (_albumObserver) { _albumObserver.disconnect(); _albumObserver = null }
  albumGrid.style.display = 'none'
  albumDetail.style.display = 'block'
  var html = '<div class="album-detail-wrap">' +
    '<div class="album-detail-top">' +
    '<button class="album-back" id="albumBack">&larr; 返回</button>' +
    '</div>' +
    '<div class="album-detail-header">' +
    '<div class="album-detail-title">' + a.title + '</div>' +
    '<div class="album-detail-meta">' + a.date + ' . ' + a.photos.length + ' 个瞬间</div>' +
    (a.description ? '<div class="album-detail-desc">' + a.description + '</div>' : '') +
    '</div><div class="photo-grid"></div></div>'
  albumDetail.innerHTML = html
  document.getElementById('albumBack').addEventListener('click', function () {
    location.hash = '#/gallery'
  })
  renderAlbumBatch()
}

function showGallery() {
  listView.style.display = 'none'
  articleViewEl.style.display = 'none'
  archiveViewEl.style.display = 'none'
  galleryView.style.display = 'block'
  pageHeader.style.display = 'none'
  tocToggle.classList.remove('show')
  tocPanel.classList.remove('show')
  resetOG()
  document.title = '画廊 · SnowBlock'
  setOGTag('og:title', '画廊 · SnowBlock')
  albumGrid.style.display = ''
  albumDetail.style.display = 'none'
  albumGrid.innerHTML = '<div class="gallery-wrap"><div class="gallery-header"><h1>照片墙</h1></div><div class="album-grid" id="albumGridInner"></div></div>'
  renderAlbums()
  window.scrollTo({ top: 0 })
}

function handleHash() {
  var raw = location.hash.replace(/^#\/?/, '')
  if (!raw) { showListView(); setActiveNav('blog'); return }
  if (raw === 'archive') { showArchive(); setActiveNav('archive'); return }
  if (raw === 'gallery') { showGallery(); setActiveNav('gallery'); return }
  if (raw === 'random') {
    if (postsMeta.length) navigateTo(postsMeta[Math.floor(Math.random() * postsMeta.length)].id)
    return
  }
  if (raw === 'about') { showAbout(); setActiveNav('about'); return }
  if (raw.indexOf('gallery/') === 0) {
    var albumId = decodeURIComponent(raw.replace('gallery/', ''))
    showGallery()
    showAlbum(albumId)
    return
  }
  var found = postsMeta.some(function (p) { return p.id === raw })
  if (found) { loadArticle(raw); setActiveNav(null); return }
  showListView(); setActiveNav('blog')
}

function setActiveNav(which) {
  navBlog.className = which === 'blog' ? 'active' : ''
  navArchive.className = which === 'archive' ? 'active' : ''
  navGallery.className = which === 'gallery' ? 'active' : ''
  navAbout.className = which === 'about' ? 'active' : ''
}

backLink.addEventListener('click', function (e) {
  e.preventDefault()
  location.hash = '#/'
})

navBlog.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/' })
navArchive.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/archive' })
navGallery.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/gallery' })
navAbout.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/about' })

window.addEventListener('scroll', function () {
  if (window.scrollY > 300) backToTop.classList.add('show')
  else backToTop.classList.remove('show')
})
backToTop.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

window.addEventListener('hashchange', handleHash)

var searchTimer = null
searchInput.addEventListener('input', function () {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(function () { currentPage = 1; applyFilters() }, 250)
})

document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    searchInput.focus()
  }
})

window.addEventListener('load', function () {
  if (!window.markdownit || !window.hljs || !window.DOMPurify) {
    document.body.innerHTML += '<div style="color:white;text-align:center;padding:2rem;">依赖加载失败，请刷新</div>'
    return
  }

  md = window.markdownit({
    html: true, linkify: true, typographer: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try { return '<pre class="hljs"><code>' + hljs.highlight(str, { language: lang, ignoreIllegals: true }).value + '</code></pre>' } catch (e) { }
      }
      return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
    }
  })
  var mdImage = md.renderer.rules.image
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    var token = tokens[idx]
    var src = token.attrs[token.attrIndex('src')][1]
    var alt = token.content || ''
    if (src.match(/^https?:\/\//) && src.indexOf('raw.githubusercontent.com') !== -1) {
      return '<img src="' + md.utils.escapeHtml(src) + '" alt="' + md.utils.escapeHtml(alt) + '" loading="lazy">'
    }
    return mdImage(tokens, idx, options, env, self)
  }

  purifyConfig = {
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'code', 'pre', 'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'button', 'progress'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'loading', 'style', 'type', 'value', 'max', 'onclick']
  }

  renderProfile()

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
  }

  fetch('content/albums/index.json?v=' + (document.querySelector('meta[name="build-ts"]')?.getAttribute('content') || Date.now())).then(function (r) { return r.json() }).then(function (data) {
    albums = data
  }).catch(function () {})

  fetch('content/posts/index.json').then(function (r) { return r.json() }).then(function (data) {
    postsMeta = data
    postsMeta.sort(function (a, b) {
      var pa = a.pinned ? 1 : 0
      var pb = b.pinned ? 1 : 0
      if (pa !== pb) return pb - pa
      return (b.date || '').localeCompare(a.date || '')
    })
    renderTagFilters()
    var loaded = 0
    var total = postsMeta.length
    postsMeta.forEach(function (p) {
      fetch('content/posts/' + p.file).then(function (r) { return r.text() }).then(function (mdText) {
        allExcerpts[p.id] = getExcerpt(stripMeta(mdText))
        loaded++
        if (loaded === total) { applyFilters(); handleHash() }
      }).catch(function () {
        loaded++
        if (loaded === total) { applyFilters(); handleHash() }
      })
    })
    if (total === 0) { applyFilters(); handleHash() }
  }).catch(function () {
    postContainer.innerHTML = '<div style="color:white;text-align:center;padding:2rem;">文章加载失败</div>'
  })
})
