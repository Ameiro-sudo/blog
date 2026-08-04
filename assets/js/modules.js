app.modules = {
  current: null,
  data: {},
  player: { index: -1, audio: null },

  titles: { moments: '说说', friends: '友链', messages: '留言板', music: '音乐' },

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
    else if (name === 'messages') this.renderMessages(body)
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

  /* ===== 留言板 ===== */
  renderMessages: function(body) {
    var self = this
    var local = []
    try { local = JSON.parse(localStorage.getItem('localMessages') || '[]') } catch (e) {}
    var all = (this.data.messages || []).concat(local)
    var html = '<div class="msg-list">'
    all.forEach(function(m) {
      html += '<div class="msg-item">' +
        '<div class="msg-head"><span class="msg-name">' + self.esc(m.name) + '</span><span class="msg-time">' + self.esc(m.time) + '</span></div>' +
        '<div class="msg-content">' + self.esc(m.content) + '</div>' +
      '</div>'
    })
    html += '</div>'
    html += '<div class="msg-form">' +
      '<input id="msgName" class="msg-input" placeholder="昵称" maxlength="20">' +
      '<textarea id="msgContent" class="msg-textarea" placeholder="说点什么..." rows="3"></textarea>' +
      '<button id="msgSend" class="msg-send">发送</button>' +
      '<p class="msg-note"><i class="fa-solid fa-circle-info"></i> 静态站留言仅保存在本机浏览器，不会同步到服务器</p>' +
    '</div>'
    body.innerHTML = html
    document.getElementById('msgSend').addEventListener('click', function() {
      var n = document.getElementById('msgName').value.trim() || '匿名'
      var c = document.getElementById('msgContent').value.trim()
      if (!c) return
      var list = []
      try { list = JSON.parse(localStorage.getItem('localMessages') || '[]') } catch (e) {}
      list.unshift({ name: n, time: new Date().toLocaleDateString(), content: c })
      try { localStorage.setItem('localMessages', JSON.stringify(list)) } catch (e) {}
      self.renderMessages(body)
    })
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
