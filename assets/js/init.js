app.init = function () {
  if (!window.markdownit || !window.hljs || !window.DOMPurify) {
    document.body.innerHTML += '<div style="color:white;text-align:center;padding:2rem;">依赖加载失败，请刷新</div>'
    return
  }

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
    if (src.match(/^https?:\/\//) && src.indexOf('vps.snowblock.top:9443/raw/') !== -1) {
      return '<img src="' + app.state.md.utils.escapeHtml(src) + '" alt="' + app.state.md.utils.escapeHtml(alt) + '" loading="lazy">'
    }
    return mdImage(tokens, idx, options, env, self)
  }

  app.state.purifyConfig = {
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'code', 'pre', 'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'button', 'progress'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'loading', 'style', 'type', 'value', 'max', 'onclick']
  }

  app.profile.render()

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
  }

  fetch('content/albums/index.json?v=' + (document.querySelector('meta[name="build-ts"]')?.getAttribute('content') || Date.now())).then(function (r) { return r.json() }).then(function (data) {
    app.state.albums = data
  }).catch(function () {})

  fetch('content/posts/index.json').then(function (r) { return r.json() }).then(function (data) {
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
    var loaded = 0
    var total = app.state.postsMeta.length
    app.state.postsMeta.forEach(function (p) {
      fetch('content/posts/' + p.file).then(function (r) { return r.text() }).then(function (mdText) {
        app.state.allExcerpts[p.id] = app.utils.getExcerpt(app.utils.stripFrontMatter(mdText))
        loaded++
        if (loaded === total) { app.posts.applyFilters(); app.router.handleHash() }
      }).catch(function () {
        loaded++
        if (loaded === total) { app.posts.applyFilters(); app.router.handleHash() }
      })
    })
    if (total === 0) { app.posts.applyFilters(); app.router.handleHash() }
  }).catch(function () {
    app.dom.postContainer.innerHTML = '<div style="color:white;text-align:center;padding:2rem;">文章加载失败</div>'
  })
}

window.addEventListener('load', app.init)
