app.router = {
  searchTimer: null,

  navigateTo: function(id) {
    location.hash = '#/' + id
  },

  handleHash: function() {
    var raw = location.hash.replace(/^#\/?/, '')
    if (!raw) { app.views.switchTo('list'); this.setActiveNav('blog'); app.utils.resetOG(); window.scrollTo({ top: 0 }); return }
    if (raw === 'archive') { app.archive.show(); this.setActiveNav('archive'); return }
    if (raw === 'gallery') { app.gallery.show(); this.setActiveNav('gallery'); return }
    if (raw === 'moments') { app.modules.show('moments'); this.setActiveNav('moments'); return }
    if (raw === 'friends') { app.modules.show('friends'); this.setActiveNav('friends'); return }
    if (raw === 'music') { app.modules.show('music'); this.setActiveNav('music'); return }
    if (raw === 'random') {
      if (app.state.postsMeta.length) this.navigateTo(app.state.postsMeta[Math.floor(Math.random() * app.state.postsMeta.length)].id)
      return
    }
    if (raw === 'about') { app.article.showAbout(); this.setActiveNav('about'); return }
    if (raw.indexOf('gallery/') === 0) {
      var albumId = decodeURIComponent(raw.replace('gallery/', ''))
      app.gallery.show()
      app.gallery.showAlbum(albumId)
      this.setActiveNav('gallery')
      return
    }
    var found = app.state.postsMeta.some(function (p) { return p.id === raw })
    if (found) { app.article.load(raw); this.setActiveNav(null); return }
    app.views.switchTo('list'); this.setActiveNav('blog'); app.utils.resetOG(); window.scrollTo({ top: 0 })
  },

  setActiveNav: function(which) {
    app.dom.navBlog.className = which === 'blog' ? 'active' : ''
    app.dom.navArchive.className = which === 'archive' ? 'active' : ''
    app.dom.navGallery.className = which === 'gallery' ? 'active' : ''
    app.dom.navMoments.className = which === 'moments' ? 'active' : ''
    app.dom.navFriends.className = which === 'friends' ? 'active' : ''
    app.dom.navMusic.className = which === 'music' ? 'active' : ''
    app.dom.navAbout.className = which === 'about' ? 'active' : ''
  }
}

app.dom.backLink.addEventListener('click', function (e) {
  e.preventDefault()
  location.hash = '#/'
})

app.dom.navBlog.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/' })
app.dom.navArchive.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/archive' })
app.dom.navGallery.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/gallery' })
app.dom.navMoments.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/moments' })
app.dom.navFriends.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/friends' })
app.dom.navMusic.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/music' })
app.dom.navAbout.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/about' })

window.addEventListener('scroll', function () {
  if (window.scrollY > 300) app.dom.backToTop.classList.add('show')
  else app.dom.backToTop.classList.remove('show')
})
app.dom.backToTop.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

window.addEventListener('hashchange', function () { app.router.handleHash() })

app.dom.searchInput.addEventListener('input', function () {
  clearTimeout(app.router.searchTimer)
  app.router.searchTimer = setTimeout(function () { app.state.currentPage = 1; app.posts.applyFilters() }, 250)
})

document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    app.dom.searchInput.focus()
  }
})
