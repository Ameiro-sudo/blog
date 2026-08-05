app.modules = {
  current: null,
  data: {},

  titles: { moments: '说说', friends: '友链' },

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
}

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
    var cardGradients = [
      'linear-gradient(135deg,#16334d,#2a6b94)',
      'linear-gradient(135deg,#232a4d,#4a5f9e)',
      'linear-gradient(135deg,#123f44,#2e7f86)',
      'linear-gradient(135deg,#3d2f55,#6a4f9e)'
    ]
    var heroStyle = hero.image
      ? 'background-image:url(' + hero.image + ');background-size:cover;background-position:center;'
      : 'background:#2a6390;'
    var html = '<a class="home-hero" href="#/' + hero.id + '" style="' + heroStyle + '">' +
      '<div class="home-hero-mask"></div>' +
      '<div class="home-hero-info">' +
        '<h3 class="home-hero-title">' + app.modules.esc(hero.title) + '</h3>' +
        '<div class="home-hero-meta">' + hero.date + (hero.readTime ? ' · ' + hero.readTime : '') + '</div>' +
      '</div></a>'
    if (rest.length) {
      html += '<div class="home-post-row">'
      rest.forEach(function(p, i) {
        var style = p.image
          ? 'background-image:url(' + p.image + ');background-size:cover;background-position:center;'
          : 'background:' + cardGradients[i % cardGradients.length] + ';'
        html += '<a class="home-post-card" href="#/' + p.id + '" style="' + style + '">' +
          '<div class="home-post-card-mask"></div>' +
          '<div class="home-post-card-info"><div class="home-post-card-title">' + app.modules.esc(p.title) + '</div><div class="home-post-card-date">' + p.date + '</div></div>' +
        '</a>'
      })
      html += '</div>'
    }
    html += '<a class="home-more" href="#/posts">全部文章 <i class="fa-solid fa-arrow-right"></i></a>'
    body.innerHTML = html
  },

  renderPhotos: function() {
    var body = document.getElementById('homePhotosBody')
    if (!body) return
    var albums = app.state.albums || []
    if (!albums.length) { body.innerHTML = '<div class="home-empty">暂无照片</div>'; return }
    var photos = []
    albums.forEach(function(a) {
      var list = (a.photos && a.photos.length) ? a.photos : (a.cover ? [{ url: a.cover }] : [])
      list.forEach(function(p) {
        photos.push({ url: p.url, album: a.id })
      })
    })
    if (!photos.length) { body.innerHTML = '<div class="home-empty">暂无照片</div>'; return }
    var html = '<div class="home-photo" id="homePhoto">' +
      '<img src="" alt="" id="homePhotoImg">' +
    '</div>'
    body.innerHTML = html
    var idx = 0
    var timer = null
    var swapTimer = null
    var img = document.getElementById('homePhotoImg')
    var box = document.getElementById('homePhoto')
    function show(i, restart) {
      idx = (i + photos.length) % photos.length
      img.style.opacity = 0
      if (swapTimer) clearTimeout(swapTimer)
      swapTimer = setTimeout(function() {
        img.src = photos[idx].url
        img.style.opacity = 1
      }, 200)
      if (restart) startTimer()
    }
    function startTimer() { stopTimer(); timer = setInterval(function() { show(idx + 1) }, 4000) }
    function stopTimer() { if (timer) clearInterval(timer) }
    show(0, true)
    box.addEventListener('click', function() { location.hash = '#/gallery' })
    box.addEventListener('mouseenter', stopTimer)
    box.addEventListener('mouseleave', startTimer)
  }
}
