function handleHash() {
  var raw = location.hash.replace(/^#\/?/, '')
  if (!raw) { showListView(); setActiveNav('blog'); return }
  if (raw === 'archive') { showArchive(); setActiveNav('archive'); return }
  if (raw === 'gallery') { showGallery(); setActiveNav('gallery'); return }
  if (raw === 'random') {
    if (postsMeta.length) navigateTo(postsMeta[Math.floor(Math.random() * postsMeta.length)].id)
    return
  }
  if (raw === 'about') { showAbout(); setActiveNav('about'); return }
  if (raw.indexOf('gallery/') === 0) {
    var albumId = decodeURIComponent(raw.replace('gallery/', ''))
    showGallery()
    showAlbum(albumId)
    return
  }
  var found = postsMeta.some(function (p) { return p.id === raw })
  if (found) { loadArticle(raw); setActiveNav(null); return }
  showListView(); setActiveNav('blog')
}

function setActiveNav(which) {
  navBlog.className = which === 'blog' ? 'active' : ''
  navArchive.className = which === 'archive' ? 'active' : ''
  navGallery.className = which === 'gallery' ? 'active' : ''
  navAbout.className = which === 'about' ? 'active' : ''
}

backLink.addEventListener('click', function (e) {
  e.preventDefault()
  location.hash = '#/'
})

navBlog.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/' })
navArchive.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/archive' })
navGallery.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/gallery' })
navAbout.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/about' })

window.addEventListener('scroll', function () {
  if (window.scrollY > 300) backToTop.classList.add('show')
  else backToTop.classList.remove('show')
})
backToTop.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

window.addEventListener('hashchange', handleHash)

var searchTimer = null
searchInput.addEventListener('input', function () {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(function () { currentPage = 1; applyFilters() }, 250)
})

document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    searchInput.focus()
  }
})
