app.docs = {
  sections: [],
  currentIndex: 0,

  show: function(index) {
    app.views.switchTo('docs')
    app.utils.resetOG()
    document.title = '文档 · SnowBlock'
    app.utils.setOGTag('og:title', '文档 · SnowBlock')

    if (!this.sections.length) {
      this.load(index)
    } else {
      this.renderSidebar()
      if (index !== undefined && !isNaN(index)) {
        this.navigateTo(index)
      } else {
        this.renderSection(this.currentIndex)
      }
    }
  },

  load: function(targetIndex) {
    var self = this
    fetch('content/pages/docs.md').then(function(r) { return r.text() }).then(function(mdText) {
      self.parseSections(mdText)
      self.renderSidebar()
      var idx = (targetIndex !== undefined && !isNaN(targetIndex)) ? targetIndex : 0
      self.currentIndex = Math.max(0, Math.min(idx, self.sections.length - 1))
      self.renderSection(self.currentIndex)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }).catch(function() {
      app.dom.docsContent.innerHTML = '<p>文档加载失败</p>'
    })
  },

  parseSections: function(text) {
    this.sections = []
    var lines = text.split('\n')
    var current = null

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i]
      if (/^# /.test(line)) {
        if (current) this.sections.push(current)
        var title = line.replace(/^# /, '').trim()
        var id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '')
        current = { id: id, title: title, lines: [], raw: [] }
      } else if (current) {
        current.lines.push(line)
        current.raw.push(line)
      }
    }
    if (current) this.sections.push(current)
  },

  renderSidebar: function() {
    var html = ''
    for (var i = 0; i < this.sections.length; i++) {
      var s = this.sections[i]
      var active = i === this.currentIndex ? ' class="active"' : ''
      html += '<a href="#/docs/' + i + '"' + active + ' data-docs-index="' + i + '">' + s.title + '</a>'
    }
    app.dom.docsSidebar.innerHTML = html

    app.dom.docsSidebar.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault()
        location.hash = '#/docs/' + this.dataset.docsIndex
      })
    })
  },

  updateSidebarActive: function() {
    app.dom.docsSidebar.querySelectorAll('a').forEach(function(a, i) {
      a.className = i === app.docs.currentIndex ? 'active' : ''
    })
  },

  renderSection: function(index) {
    if (index < 0 || index >= this.sections.length) return
    var section = this.sections[index]

    var titleHtml = '<h1 class="docs-section-title">' + section.title + '</h1>'
    var contentHtml = app.utils.safeRender(section.lines.join('\n'))
    app.dom.docsContent.innerHTML = titleHtml + contentHtml

    app.article.enhance(app.dom.docsContent)
    app.article.renderTOC(app.dom.docsContent)
    app.dom.tocToggle.classList.add('show')
    this.renderNav()

    document.title = section.title + ' · 文档 · SnowBlock'
    app.utils.setOGTag('og:title', section.title + ' · 文档')
    this.updateSidebarActive()
  },

  renderNav: function() {
    var html = '<div class="docs-nav">'
    if (this.currentIndex > 0) {
      html += '<a href="#/docs/' + (this.currentIndex - 1) + '" class="docs-nav-link prev" data-docs-index="' + (this.currentIndex - 1) + '">← ' + this.sections[this.currentIndex - 1].title + '</a>'
    } else {
      html += '<span></span>'
    }
    if (this.currentIndex < this.sections.length - 1) {
      html += '<a href="#/docs/' + (this.currentIndex + 1) + '" class="docs-nav-link next" data-docs-index="' + (this.currentIndex + 1) + '">' + this.sections[this.currentIndex + 1].title + ' →</a>'
    } else {
      html += '<span></span>'
    }
    html += '</div>'
    var existingNav = app.dom.docsContainer.querySelector('.docs-nav')
    if (existingNav) {
      existingNav.outerHTML = html
    } else {
      app.dom.docsContent.insertAdjacentHTML('afterend', html)
    }

    app.dom.docsContainer.querySelectorAll('.docs-nav-link').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault()
        location.hash = '#/docs/' + this.dataset.docsIndex
      })
    })
  },

  navigateTo: function(index) {
    if (index < 0) index = 0
    if (index >= this.sections.length) index = this.sections.length - 1
    this.currentIndex = index
    this.renderSection(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
