app.profile = {
  render: function() {
    var cfg = app.config.profile
    if (!cfg.name) { app.dom.profileCard.style.display = 'none'; return }
    app.dom.profileCard.style.display = 'block'
    var links = (cfg.links || []).map(function (l) {
      var iconSrc = l.icon ? 'assets/vendor/iconify/' + l.icon.replace('/', '-') + '.svg' : ''
      var icon = iconSrc ? '<img src="' + iconSrc + '" alt="' + l.name + '" class="profile-icon">' : l.name
      return '<a href="' + l.url + '" target="_blank" rel="noopener" title="' + l.name + '">' + icon + '</a>'
    }).join('')
    app.dom.profileCard.innerHTML =
      '<div class="profile-wrap">' +
      (cfg.avatar ? '<span class="profile-avatar-ring"><img class="profile-avatar" src="' + cfg.avatar + '" alt="avatar"></span>' : '') +
      '<a href="https://snowblock.top" class="profile-name">' + (cfg.name || '') + '</a>' +
      '<div class="profile-divider"></div>' +
      (cfg.bio ? '<div class="profile-bio">' + cfg.bio + '</div>' : '') +
      '<div class="profile-stats">' +
        '<div class="stat-item"><div class="stat-num" id="statPosts">-</div><div class="stat-label">文章</div></div>' +
        '<div class="stat-divider"></div>' +
        '<div class="stat-item"><div class="stat-num" id="statAlbums">-</div><div class="stat-label">相册</div></div>' +
        '<div class="stat-divider"></div>' +
        '<div class="stat-item"><div class="stat-num" id="statTags">-</div><div class="stat-label">标签</div></div>' +
      '</div>' +
      (links ? '<div class="profile-links">' + links + '</div>' : '') +
      '</div>'
    this.updateStats()
  },
  updateStats: function() {
    var posts = (app.state.postsMeta || []).length
    var albums = (app.state.albums || []).length
    var tagSet = {}
    ;(app.state.postsMeta || []).forEach(function (p) {
      ;(p.tags || []).forEach(function (t) { tagSet[t] = true })
    })
    var tags = Object.keys(tagSet).length
    var setNum = function (id, n) {
      var el = document.getElementById(id)
      if (el) el.textContent = n
    }
    setNum('statPosts', posts)
    setNum('statAlbums', albums)
    setNum('statTags', tags)
  }
}
