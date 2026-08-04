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
