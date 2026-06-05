(function () {
  if (location.search.includes('_gl=')) {
    history.replaceState(null, '', location.pathname + location.hash)
  }

  var toast = document.getElementById('toast');
  var toastTimer = null;

  function showToast(msg, dur) {
    if (!toast) return;
    if (dur === undefined) dur = 2000;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      toast.classList.remove('show');
    }, dur);
  }

  // === 音乐播放器（嵌入主界面） ===
  try {
  (function() {
    var songIds = ['1809646618', '14164869977']
    var metingApis = [
      'https://api.injahow.cn/meting/?server=netease&type=song&id=',
      'https://meting.uu8.pro/?server=netease&type=song&id=',
      'https://meting.qjqq.cn/?server=netease&type=song&id='
    ]

    var cover = document.getElementById('mwCover')
    var title = document.getElementById('mwTitle')
    var artist = document.getElementById('mwArtist')
    var lyric = document.getElementById('mwLyric')
    var status = document.getElementById('mwStatus')
    var progressFill = document.getElementById('mwProgressFill')
    var playBtn = document.getElementById('mwPlayBtn')
    var prevBtn = document.getElementById('mwPrev')
    var nextBtn = document.getElementById('mwNext')
    var progressBar = document.querySelector('.mw-progress')

    var songs = []
    var currentIdx = 0
    var audio = new Audio()
    var lyrics = []
    var currentLyricIdx = -1
    var isPlaying = false

    function parseLrc(text) {
      var lines = text.split('\n')
      var result = []
      lines.forEach(function (line) {
        var m = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
        if (m) {
          var time = parseInt(m[1]) * 60 + parseFloat(m[2])
          result.push({ time: time, text: m[3].trim() })
        }
      })
      return result
    }

    function loadSong(idx) {
      var s = songs[idx]
      if (!s) return
      currentIdx = idx
      cover.src = s.pic || ''
      title.textContent = s.name || '未知'
      artist.textContent = s.author || ''
      progressFill.style.width = '0%'
      lyrics = []
      currentLyricIdx = -1
      lyric.textContent = ''
      lyric.className = 'mw-lyric'
      if (s.url) {
        audio.src = s.url
        audio.load()
        if (isPlaying) audio.play().catch(function () {})
      }
      if (s.lyric) {
        fetch(s.lyric).then(function (r) { return r.text() }).then(function (text) {
          lyrics = parseLrc(text)
          lyric.textContent = lyrics.length ? '' : '（纯音乐）'
        }).catch(function () { lyric.textContent = '' })
      }
    }

    function fetchSong(id, apiIdx) {
      if (apiIdx === undefined) apiIdx = 0
      if (apiIdx >= metingApis.length) return Promise.reject()
      return fetch(metingApis[apiIdx] + id).then(function (r) { return r.json() }).then(function (d) {
        if (d && d[0]) return d[0]
        throw new Error()
      }).catch(function () {
        return fetchSong(id, apiIdx + 1)
      })
    }

    function initPlayer() {
      var ids = ['1809646618']
      var fetched = 0
      ids.forEach(function (id) {
        fetchSong(id).then(function (song) {
          songs.push(song)
          fetched++
          if (fetched === ids.length && songs.length) {
            status.textContent = ''
            loadSong(0)
          }
        }).catch(function () {
          fetched++
          if (fetched === ids.length) {
            if (songs.length) { status.textContent = ''; loadSong(0) }
            else status.textContent = '音乐暂时不可用'
          }
        })
      })
    }

    playBtn.addEventListener('click', function () {
      if (!songs.length) return
      if (audio.paused) {
        audio.play()
      } else {
        audio.pause()
      }
    })

    audio.addEventListener('play', function () { isPlaying = true; playBtn.textContent = '❚❚' })
    audio.addEventListener('pause', function () { isPlaying = false; playBtn.textContent = '▶' })

    audio.addEventListener('timeupdate', function () {
      if (audio.duration) {
        var pct = (audio.currentTime / audio.duration) * 100
        progressFill.style.width = pct + '%'
        for (var i = lyrics.length - 1; i >= 0; i--) {
          if (audio.currentTime >= lyrics[i].time) {
            if (i !== currentLyricIdx) {
              currentLyricIdx = i
              lyric.textContent = lyrics[i].text
              lyric.className = 'mw-lyric active'
            }
            return
          }
        }
        if (currentLyricIdx !== -1 && audio.currentTime < lyrics[0].time) {
          currentLyricIdx = -1
          lyric.textContent = ''
          lyric.className = 'mw-lyric'
        }
      }
    })

    audio.addEventListener('ended', function () {
      var idx = (currentIdx + 1) % songs.length
      loadSong(idx)
    })

    prevBtn.addEventListener('click', function () {
      if (!songs.length) return
      var idx = (currentIdx - 1 + songs.length) % songs.length
      loadSong(idx)
    })

    nextBtn.addEventListener('click', function () {
      if (!songs.length) return
      var idx = (currentIdx + 1) % songs.length
      loadSong(idx)
    })

    progressBar.addEventListener('click', function (e) {
      if (!audio.duration) return
      var rect = progressBar.getBoundingClientRect()
      var pct = (e.clientX - rect.left) / rect.width
      audio.currentTime = pct * audio.duration
    })

    lyric.addEventListener('click', function () {
      if (!songs.length) return
      if (audio.paused) audio.play()
      else audio.pause()
    })

    initPlayer()
  })()
  } catch(e) {}

  // === 灯箱全局事件 ===
  document.getElementById('lightbox-close').addEventListener('click', function () {
    document.getElementById('lightbox').classList.remove('show')
  })
  document.getElementById('lightbox').addEventListener('click', function () {
    this.classList.remove('show')
  })
  document.getElementById('lightboxImg').addEventListener('click', function (e) {
    e.stopPropagation()
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.getElementById('lightbox').classList.remove('show')
  })


  const profileConfig = {
    avatar: 'avatar.webp',
    name: 'ninasukiwww',
    bio: '世界は大きい、君は行かなければならない',
    links: [
      { name: 'GitHub', icon: 'fa7-brands/github', url: 'https://github.com/ninasukiwww-png' },
      { name: 'Bilibili', icon: 'fa7-brands/bilibili', url: 'https://space.bilibili.com/3493084421687360' },
      { name: '博客', icon: 'material-symbols/article-outline', url: 'https://blog.snowblock.top' }
    ]
  }

  window.addEventListener('load', function () {
    if (!window.markdownit || !window.hljs || !window.DOMPurify) {
      document.body.innerHTML += '<div style="color:white;text-align:center;padding:2rem;">依赖加载失败，请刷新</div>'
      return
    }

    const md = window.markdownit({
      html: true, linkify: true, typographer: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try { return '<pre class="hljs"><code>' + hljs.highlight(str, { language: lang, ignoreIllegals: true }).value + '</code></pre>' } catch (e) { }
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
      }
    })

    const purifyConfig = {
      ALLOWED_TAGS: ['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'code', 'pre', 'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'button', 'progress'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'loading', 'style', 'type', 'value', 'max', 'onclick']
    }

    function safeRender(text) {
      return DOMPurify.sanitize(md.render(text), purifyConfig)
    }

    function getExcerpt(text, max) {
      max = max || 110
      var div = document.createElement('div')
      div.innerHTML = safeRender(text)
      var s = (div.textContent || '').replace(/\s+/g, ' ').trim()
      return s.length > max ? s.slice(0, max) + '…' : s
    }

    function stripMeta(text) {
      return text.replace(/^# .+\n[\s\S]*?\n---\n?/, '')
    }

    var postsMeta = []
    var allExcerpts = {}
    var currentPage = 1
    var activeTag = null
    var PER_PAGE = 5

    var postContainer = document.getElementById('dynamicPostList')
    var paginationEl = document.getElementById('pagination')
    var listView = document.getElementById('postList')
    var articleView = document.getElementById('articleView')
    var archiveView = document.getElementById('archiveView')
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
    var backToTop = document.getElementById('backToTop')
    var tocToggle = document.getElementById('tocToggle')
    var tocPanel = document.getElementById('tocPanel')
    var lightbox = document.getElementById('lightbox')
    var lightboxImg = document.getElementById('lightboxImg')
    var lightboxCaption = document.getElementById('lightboxCaption')
    var albums = []
    var pageHeader = document.getElementById('pageHeader')

    // === 简介卡片 ===
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

    // === 标签筛选 ===
    function renderTagFilters() {
      var allTags = []
      postsMeta.forEach(function (p) {
        p.tags.forEach(function (t) {
          if (allTags.indexOf(t) === -1) allTags.push(t)
        })
      })
      allTags.sort()
      var html = ''
      allTags.forEach(function (t) {
        var active = t === activeTag ? 'active' : ''
        html += '<span class="tag-filter ' + active + '" data-tag="' + t + '">' + t + '</span>'
      })
      if (activeTag) {
        html += '<span class="tag-filter active" data-tag="">x 清除筛选</span>'
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

    // === 过滤 + 搜索 ===
    function applyFilters() {
      var q = (searchInput.value || '').toLowerCase()
      var filtered = postsMeta.filter(function (p) {
        if (activeTag && p.tags.indexOf(activeTag) === -1) return false
        if (!q) return true
        if (p.title.toLowerCase().indexOf(q) !== -1) return true
        if (p.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1 })) return true
        if (p.date.toLowerCase().indexOf(q) !== -1) return true
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
      var html = '<button class="page-btn" data-page="' + (current - 1) + '" ' + prevDisabled + '>← 上一页</button>'
      var range = 2
      var startPage = Math.max(1, current - range)
      var endPage = Math.min(total, current + range)
      if (startPage > 1) {
        html += '<button class="page-btn" data-page="1">1</button>'
        if (startPage > 2) html += '<span class="page-info">…</span>'
      }
      for (var i = startPage; i <= endPage; i++) {
        html += '<button class="page-btn' + (i === current ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>'
      }
      if (endPage < total) {
        if (endPage < total - 1) html += '<span class="page-info">…</span>'
        html += '<button class="page-btn" data-page="' + total + '">' + total + '</button>'
      }
      html += '<button class="page-btn" data-page="' + (current + 1) + '" ' + nextDisabled + '>下一页 →</button>'
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
        var excerpt = allExcerpts[p.id] || ''
        html += '<div class="post-card" data-post-id="' + p.id + '" tabindex="0" role="button">' +
          '<div class="post-body">' +
           '<div class="post-meta"><span>' + p.date + '</span> ' + (p.pinned ? '<span class="pinned-badge">[置顶]</span>' : '') + tags + ' <span>' + p.readTime + '</span></div>' +
          '<h2 class="post-title">' + p.title + '</h2>' +
          '<p class="post-excerpt">' + excerpt + '</p>' +
           '<div class="post-footer"><span class="post-date">' + p.date + ' · ' + p.time + '</span></div>' +
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

    // === 增强（代码复制、表格） ===
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

    // === 相关文章 ===
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

    // === 文章导航 ===
    function navigateTo(id) { location.hash = '#/' + id }

    function loadArticle(id) {
      var meta = postsMeta.find(function (p) { return p.id === id })
      if (!meta) { showListView(); return }
      fetch('posts/' + meta.file).then(function (r) { return r.text() }).then(function (mdText) {
        var content = stripMeta(mdText)
        articleTitle.textContent = meta.title
        var tags = meta.tags.map(function (t) {
          return '<span class="tag ' + (t === 'Bash' ? 'bash' : 'tech') + '">' + t + '</span>'
        }).join(' ')
        // 字数统计
        var clean = content.replace(/\s+/g, '')
        var wc = clean.length
        var wcLabel = wc > 999 ? (wc / 1000).toFixed(1) + 'k' : wc
        articleMeta.innerHTML = meta.date + ' · ' + meta.time + ' · ' + meta.readTime + ' · ' + wcLabel + '字 ' + tags
        articleContent.innerHTML = safeRender(content)
        enhance(articleContent)
        // 代码语言标签
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
        // 图片灯箱
        articleContent.querySelectorAll('img').forEach(function (img) {
          if (img.closest('.profile-avatar') || img.closest('.profile-links')) return
          img.style.cursor = 'zoom-in'
          img.addEventListener('click', function () {
            lightboxImg.src = img.src
            lightboxImg.alt = img.alt || ''
            lightboxCaption.textContent = ''
            lightbox.classList.add('show')
          })
        })
        // 文章目录
        renderTOC()
        renderRelated(id)
        listView.style.display = 'none'
        archiveView.style.display = 'none'
        articleView.style.display = 'block'
        pageHeader.style.display = 'none'
        tocToggle.classList.add('show')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }).catch(function () { showListView() })
    }

    function showListView() {
      listView.style.display = 'block'
      articleView.style.display = 'none'
      archiveView.style.display = 'none'
      galleryView.style.display = 'none'
      pageHeader.style.display = 'block'
      tocToggle.classList.remove('show')
      tocPanel.classList.remove('show')
      window.scrollTo({ top: 0 })
    }

    // === 文章目录 TOC ===
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
    }

    tocToggle.addEventListener('click', function () {
      tocPanel.classList.toggle('show')
    })

    // === 归档 ===
    function renderArchive() {
      var groups = {}
      postsMeta.forEach(function (p) {
        var year = p.date ? p.date.substring(0, 4) : '未知'
        if (!groups[year]) groups[year] = {}
        var month = p.date ? p.date.substring(5, 7) : '??'
        if (!groups[year][month]) groups[year][month] = []
        groups[year][month].push(p)
      })
      var years = Object.keys(groups).sort().reverse()
      var html = ''
      years.forEach(function (year) {
        html += '<div class="archive-year"><div class="archive-year-header">' + year + '</div>'
        var months = Object.keys(groups[year]).sort().reverse()
        months.forEach(function (month) {
          html += '<div class="archive-month"><div class="archive-month-header">' + month + '月</div><ul class="archive-list">'
          groups[year][month].forEach(function (p) {
            var day = p.date ? p.date.substring(8, 10) : ''
            html += '<li class="archive-item" data-id="' + p.id + '">' +
              '<span class="archive-item-date">' + day + '</span>' +
              '<span class="archive-item-title">' + p.title + '</span></li>'
          })
          html += '</ul></div>'
        })
        html += '</div>'
      })
      archiveContent.innerHTML = html
      archiveContent.querySelectorAll('.archive-item').forEach(function (el) {
        el.addEventListener('click', function () { navigateTo(el.dataset.id) })
      })
    }

    function showArchive() {
      listView.style.display = 'none'
      articleView.style.display = 'none'
      galleryView.style.display = 'none'
      archiveView.style.display = 'block'
      pageHeader.style.display = 'none'
      tocToggle.classList.remove('show')
      tocPanel.classList.remove('show')
      renderArchive()
      window.scrollTo({ top: 0 })
    }

    // === 画廊 ===
    function showGallery() {
      listView.style.display = 'none'
      articleView.style.display = 'none'
      archiveView.style.display = 'none'
      galleryView.style.display = 'block'
      pageHeader.style.display = 'none'
      tocToggle.classList.remove('show')
      tocPanel.classList.remove('show')
      albumDetail.style.display = 'none'
      var wrap = '<div class="gallery-wrap"><div class="gallery-header"><h1>照片墙</h1></div><div class="album-grid"></div></div>'
      albumGrid.innerHTML = wrap
      renderAlbums()
      albumGrid.style.display = ''
      window.scrollTo({ top: 0 })
    }

    // === 画廊 ===
    function renderAlbums() {
      var grid = albumGrid.querySelector('.album-grid')
      if (!grid) return
      var html = ''
      albums.forEach(function (a) {
        var layers = ''
        for (var i = 0; i < 3; i++) {
          var imgUrl = a.photos[i] ? a.photos[i].url : a.cover
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
        el.addEventListener('click', function () { showAlbum(el.dataset.album) })
      })
    }

    function showAlbum(id) {
      var a = albums.find(function (x) { return x.id === id })
      if (!a) return
      albumGrid.style.display = 'none'
      albumDetail.style.display = 'block'
      var html = '<div class="album-detail-wrap">' +
        '<div class="album-detail-top">' +
        '<button class="album-back" id="albumBack">&larr; 返回</button>' +
        '</div>' +
        '<div class="album-detail-header">' +
        '<div class="album-detail-title">' + a.title + '</div>' +
        '<div class="album-detail-meta">' + a.date + ' \u00b7 ' + a.photos.length + ' \u4e2a\u77ac\u95f4</div>' +
        (a.description ? '<div class="album-detail-desc">' + a.description + '</div>' : '') +
        '</div><div class="photo-grid">'
      a.photos.forEach(function (p) {
        html += '<div class="photo-item">' +
          '<img src="' + p.url + '" alt="' + (p.caption || '') + '" loading="lazy">' +
          (p.caption ? '<div class="photo-hover"><div class="photo-hover-caption">' + p.caption + '</div></div>' : '') +
          '</div>'
      })
      html += '</div></div>'
      albumDetail.innerHTML = html
      document.getElementById('albumBack').addEventListener('click', function () {
        albumDetail.style.display = 'none'
        albumGrid.style.display = ''
      })
      albumDetail.querySelectorAll('.photo-item img').forEach(function (img) {
        img.addEventListener('click', function () {
          lightboxImg.src = img.src
          lightboxImg.alt = img.alt || ''
          var parent = img.closest('.photo-item')
          var cap = parent ? parent.querySelector('.photo-hover-caption') : null
          lightboxCaption.textContent = cap ? cap.textContent : ''
          lightbox.classList.add('show')
        })
      })
    }

    function showGallery() {
      listView.style.display = 'none'
      articleView.style.display = 'none'
      archiveView.style.display = 'none'
      galleryView.style.display = 'block'
      pageHeader.style.display = 'none'
      tocToggle.classList.remove('show')
      tocPanel.classList.remove('show')
      albumGrid.style.display = ''
      albumDetail.style.display = 'none'
      albumGrid.innerHTML = '<div class="gallery-wrap"><div class="gallery-header"><h1>照片墙</h1></div><div class="album-grid" id="albumGridInner"></div></div>'
      albumGrid.style.display = ''
      albumGrid.style.display = 'none'
      setTimeout(function () {
        albumGrid.style.display = ''
      })
      renderAlbums()
      window.scrollTo({ top: 0 })
    }

    // === Hash 路由 ===
    function handleHash() {
      var raw = location.hash.replace(/^#\/?/, '')
      if (!raw) { showListView(); setActiveNav('blog'); return }
      if (raw === 'archive') { showArchive(); setActiveNav('archive'); return }
      if (raw === 'gallery') { showGallery(); setActiveNav('gallery'); return }
      var found = postsMeta.some(function (p) { return p.id === raw })
      if (found) { loadArticle(raw); setActiveNav(null); return }
      showListView(); setActiveNav('blog')
    }

    function setActiveNav(which) {
      navBlog.className = which === 'blog' ? 'active' : ''
      navArchive.className = which === 'archive' ? 'active' : ''
      navGallery.className = which === 'gallery' ? 'active' : ''
    }

    backLink.addEventListener('click', function (e) {
      e.preventDefault()
      location.hash = '#/'
    })

    navBlog.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/' })
    navArchive.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/archive' })
    navGallery.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/gallery' })

    // === 回到顶部 ===
    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) backToTop.classList.add('show')
      else backToTop.classList.remove('show')
    })
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    window.addEventListener('hashchange', handleHash)

    // === 搜索 ===
    var searchTimer = null
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(function () { currentPage = 1; applyFilters() }, 250)
    })

    // === 初始化 ===
    renderProfile()

    fetch('albums/index.json').then(function (r) { return r.json() }).then(function (data) {
      albums = data
    }).catch(function () {})

    fetch('posts/index.json').then(function (r) { return r.json() }).then(function (data) {
      postsMeta = data
      // 置顶文章排前面
      postsMeta.sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) })
      renderTagFilters()
      var loaded = 0
      var total = postsMeta.length
      postsMeta.forEach(function (p) {
        fetch('posts/' + p.file).then(function (r) { return r.text() }).then(function (mdText) {
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
})()
