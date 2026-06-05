(function () {
  if (location.search.includes('_gl=')) {
    history.replaceState(null, '', location.pathname + location.hash)
  }

  const profileConfig = {
    avatar: 'https://snowblock.top/138936740_p0.webp',
    name: 'ninasukiwww',
    bio: '❄️ 在雪地里写代码',
    links: [
      { name: 'GitHub', url: 'https://github.com/ninasukiwww-png' },
      { name: '博客', url: 'https://blog.snowblock.top' }
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
    var navBlog = document.getElementById('navBlog')
    var navArchive = document.getElementById('navArchive')
    var pageHeader = document.getElementById('pageHeader')

    // === 简介卡片 ===
    function renderProfile() {
      if (!profileConfig.name) { profileCard.style.display = 'none'; return }
      profileCard.style.display = 'block'
      var links = (profileConfig.links || []).map(function (l) {
        return '<a href="' + l.url + '" target="_blank" rel="noopener">' + l.name + '</a>'
      }).join('')
      profileCard.innerHTML =
        '<div class="profile-wrap">' +
        (profileConfig.avatar ? '<img class="profile-avatar" src="' + profileConfig.avatar + '" alt="avatar">' : '') +
        '<div class="profile-info">' +
        '<div class="profile-name">' + (profileConfig.name || '') + '</div>' +
        (profileConfig.bio ? '<div class="profile-bio">' + profileConfig.bio + '</div>' : '') +
        (links ? '<div class="profile-links">' + links + '</div>' : '') +
        '</div></div>'
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
        html += '<span class="tag-filter active" data-tag="">✕ 清除筛选</span>'
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
          '<div class="post-meta"><span>' + p.date + '</span> ' + tags + ' <span>📖 ' + p.readTime + '</span></div>' +
          '<h2 class="post-title">' + p.title + '</h2>' +
          '<p class="post-excerpt">' + excerpt + '</p>' +
          '<div class="post-footer"><a href="#/' + p.id + '" class="read-more">阅读全文 →</a><span class="post-date">' + p.time + '</span></div>' +
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
              btn.textContent = '已复制 ✓'
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
      var html = '<div class="related-title">📎 相关文章</div><div class="related-grid">'
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
        articleTitle.textContent = meta.title
        var tags = meta.tags.map(function (t) {
          return '<span class="tag ' + (t === 'Bash' ? 'bash' : 'tech') + '">' + t + '</span>'
        }).join(' ')
        articleMeta.innerHTML = meta.date + ' · ' + meta.time + ' · ' + meta.readTime + ' ' + tags
        articleContent.innerHTML = safeRender(mdText)
        enhance(articleContent)
        renderRelated(id)
        listView.style.display = 'none'
        archiveView.style.display = 'none'
        articleView.style.display = 'block'
        pageHeader.style.display = 'none'
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }).catch(function () { showListView() })
    }

    function showListView() {
      listView.style.display = 'block'
      articleView.style.display = 'none'
      archiveView.style.display = 'none'
      pageHeader.style.display = 'block'
      window.scrollTo({ top: 0 })
    }

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
      archiveView.style.display = 'block'
      pageHeader.style.display = 'none'
      renderArchive()
      window.scrollTo({ top: 0 })
    }

    // === Hash 路由 ===
    function handleHash() {
      var raw = location.hash.replace(/^#\/?/, '')
      if (!raw) { showListView(); setActiveNav('blog'); return }
      if (raw === 'archive') { showArchive(); setActiveNav('archive'); return }
      var found = postsMeta.some(function (p) { return p.id === raw })
      if (found) { loadArticle(raw); setActiveNav(null); return }
      showListView()
      setActiveNav('blog')
    }

    function setActiveNav(which) {
      navBlog.className = which === 'blog' ? 'active' : ''
      navArchive.className = which === 'archive' ? 'active' : ''
    }

    backLink.addEventListener('click', function (e) {
      e.preventDefault()
      location.hash = '#/'
    })

    navBlog.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/' })
    navArchive.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/archive' })

    window.addEventListener('hashchange', handleHash)

    // === 搜索 ===
    var searchTimer = null
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(function () { currentPage = 1; applyFilters() }, 250)
    })

    // === 初始化 ===
    renderProfile()

    fetch('posts/index.json').then(function (r) { return r.json() }).then(function (data) {
      postsMeta = data
      renderTagFilters()
      var loaded = 0
      var total = postsMeta.length
      postsMeta.forEach(function (p) {
        fetch('posts/' + p.file).then(function (r) { return r.text() }).then(function (mdText) {
          allExcerpts[p.id] = getExcerpt(mdText)
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
