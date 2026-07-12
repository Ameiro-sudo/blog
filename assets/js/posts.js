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
