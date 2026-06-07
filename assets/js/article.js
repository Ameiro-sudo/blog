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
      app.utils.setOGTag('og:url', app.config.SITE_URL + '/#' + id)
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
    }).catch(function () { app.views.switchTo('list') })
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
    }).catch(function () { app.views.switchTo('list') })
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

  renderTOC: function() {
    app.dom.tocPanel.innerHTML = ''
    var headings = app.dom.articleContent.querySelectorAll('h2, h3')
    if (headings.length < 2) { app.dom.tocPanel.classList.remove('show'); return }
    var html = ''
    headings.forEach(function (h) {
      var id = h.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '')
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
