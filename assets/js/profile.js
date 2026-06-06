function renderProfile() {
  if (!profileConfig.name) { profileCard.style.display = 'none'; return }
  profileCard.style.display = 'block'
  var links = (profileConfig.links || []).map(function (l) {
    var iconSrc = l.icon ? 'https://api.iconify.design/' + l.icon + '.svg' : ''
    var icon = iconSrc ? '<img src="' + iconSrc + '" alt="' + l.name + '" style="width:0.9rem;height:0.9rem;filter:brightness(0) invert(0.7);">' : l.name
    return '<a href="' + l.url + '" target="_blank" rel="noopener" title="' + l.name + '">' + icon + '</a>'
  }).join('')
  profileCard.innerHTML =
    '<div class="profile-wrap">' +
    (profileConfig.avatar ? '<img class="profile-avatar" src="' + profileConfig.avatar + '" alt="avatar">' : '') +
    '<a href="https://snowblock.top" class="profile-name">' + (profileConfig.name || '') + '</a>' +
    '<div class="profile-divider"></div>' +
    (profileConfig.bio ? '<div class="profile-bio">' + profileConfig.bio + '</div>' : '') +
    (links ? '<div class="profile-links">' + links + '</div>' : '') +
    '</div>'
}
