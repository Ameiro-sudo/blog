app.init = function () {
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
  document.addEventListener('click', function(e) {
    var link = e.target.closest('#navLinks a')
    if (link) {
      var nav = document.getElementById('navLinks')
      if (nav) nav.classList.remove('open')
    }
  })

  app.state.purifyConfig = {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'code', 'pre', 'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'button', 'progress'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'loading', 'style', 'type', 'value', 'max']
  }

  // markdown 渲染器等文章依赖(markdown-it/hljs)就绪后再构建 — 首页用不到它们
  ;(window.__depsReady || Promise.resolve()).then(function () {
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
    // 依赖晚到时重渲染当前路由(直链文章的兜底)
    if (app.router && app.router.handleHash) app.router.handleHash()
  })

  app.profile.render()

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
  }

  // 立即激活路由视图(不依赖数据加载),数据到达后再 handleHash 刷新
  app.router.handleHash()

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
    // 构建期摘要已在 index.json 中 — 先渲染首屏,不等全文下载
    app.state.postsMeta.forEach(function (p) {
      if (!app.state.allExcerpts[p.id]) app.state.allExcerpts[p.id] = p.excerpt || ''
    })
    app.posts.renderTagFilters()
    if (app.profile && app.profile.updateStats) app.profile.updateStats()
    if (app.home) { app.home.renderPosts(); app.home.renderMoments() }
    app.posts.applyFilters()
    app.router.handleHash()
    // 全文后台续传: 完整摘要 + 搜索数据就绪后再刷新一次
    var loaded = 0
    var total = app.state.postsMeta.length
    function oneDone() {
      loaded++
      if (loaded === total) { app.posts.applyFilters(); app.router.handleHash() }
    }
    app.state.postsMeta.forEach(function (p) {
      fetch('content/posts/' + p.file).then(function (r) { return r.text() }).then(function (mdText) {
        // 摘要提取依赖 markdown 渲染器 — 等文章依赖就绪
        ;(window.__depsReady || Promise.resolve()).then(function () {
          app.state.allExcerpts[p.id] = app.utils.getExcerpt(app.utils.stripFrontMatter(mdText))
          oneDone()
        })
      }).catch(function (e) {
        console.error('Excerpt load failed:', p.id, e)
        oneDone()
      })
    })
  }).catch(function (e) {
    console.error('Posts index load failed:', e)
    app.dom.postContainer.innerHTML = '<div class="state-error">文章加载失败</div>'
    app.router.handleHash()
  })
}

// 脚本为 defer 加载,DOM 已就绪 — 不必再等 window.load(否则被图片等子资源拖住)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', app.init)
} else {
  app.init()
}
