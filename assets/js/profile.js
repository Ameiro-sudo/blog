app.profile = {
  render: function() {
    var cfg = app.config.profile
    if (!cfg.name) { app.dom.profileCard.style.display = 'none'; return }
    app.dom.profileCard.style.display = 'block'
    var links = (cfg.links || []).map(function (l) {
      var iconSrc = l.icon ? 'https://api.iconify.design/' + l.icon + '.svg' : ''
      var icon = iconSrc ? '<img src="' + iconSrc + '" alt="' + l.name + '" style="width:0.9rem;height:0.9rem;filter:brightness(0) invert(0.7);">' : l.name
      return '<a href="' + l.url + '" target="_blank" rel="noopener" title="' + l.name + '">' + icon + '</a>'
    }).join('')
    app.dom.profileCard.innerHTML =
      '<div class="profile-wrap">' +
      (cfg.avatar ? '<img class="profile-avatar" src="' + cfg.avatar + '" alt="avatar">' : '') +
      '<a href="https://snowblock.top" class="profile-name">' + (cfg.name || '') + '</a>' +
      '<div class="profile-divider"></div>' +
      (cfg.bio ? '<div class="profile-bio">' + cfg.bio + '</div>' : '') +
      (links ? '<div class="profile-links">' + links + '</div>' : '') +
      '</div>'
  }
}
