var _albumObserver = null
var _albumData = null
var _albumBatchSize = 12
var _albumLoaded = 0

function renderAlbums() {
  var grid = albumGrid.querySelector('.album-grid')
  if (!grid) return
  var html = ''
  albums.forEach(function (a) {
    var layers = ''
    for (var i = 0; i < 3; i++) {
      var imgUrl
      if (i === 2) {
        imgUrl = a.cover
      } else if (a.photos[i]) {
        imgUrl = a.photos[i].url
      } else {
        imgUrl = a.cover
      }
      layers += '<div class="album-layer album-layer-' + i + '"><img src="' + imgUrl + '" alt="" loading="lazy"></div>'
    }
    html += '<div class="album-card" data-album="' + a.id + '">' +
      '<div class="album-stack">' + layers + '</div>' +
      '<div class="album-info">' +
      '<div class="album-title">' + a.title + '</div>' +
      '<div class="album-date">' + a.date + '</div>' +
      (a.description ? '<div class="album-desc">' + a.description + '</div>' : '') +
      '</div></div>'
  })
  grid.innerHTML = html
  grid.querySelectorAll('.album-card').forEach(function (el) {
    el.addEventListener('click', function () { location.hash = '#/gallery/' + el.dataset.album })
  })
}

function renderAlbumBatch() {
  var grid = albumDetail.querySelector('.photo-grid')
  if (!grid || !_albumData) return
  var end = Math.min(_albumLoaded + _albumBatchSize, _albumData.photos.length)
  var html = ''
  for (var i = _albumLoaded; i < end; i++) {
    var p = _albumData.photos[i]
    html += '<div class="photo-item">' +
      '<img src="' + p.url + '" alt="" decoding="async">' +
      '</div>'
  }
  grid.insertAdjacentHTML('beforeend', html)
  var items = grid.querySelectorAll('.photo-item')
  for (var i = _albumLoaded; i < end; i++) {
    (function (img, exif) {
      img.addEventListener('click', function () {
        lightboxImg.src = img.src
        lightboxImg.alt = ''
        currentExif = exif || null
        updateLightboxExif()
        lightbox.classList.add('show')
      })
    })(items[i].querySelector('img'), _albumData.photos[i].exif)
  }
  _albumLoaded = end
  var nextEnd = Math.min(end + _albumBatchSize, _albumData.photos.length)
  for (var i = end; i < nextEnd; i++) {
    var p = _albumData.photos[i]
    var pre = new Image()
    pre.src = p.url
  }
  var sentinel = grid.querySelector('.album-sentinel')
  if (end >= _albumData.photos.length) {
    if (sentinel) sentinel.style.display = 'none'
    return
  }
  if (!sentinel) {
    sentinel = document.createElement('div')
    sentinel.className = 'album-sentinel'
    sentinel.style.cssText = 'height:1px'
    grid.appendChild(sentinel)
  }
  if (_albumObserver) _albumObserver.disconnect()
  _albumObserver = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) renderAlbumBatch()
  }, { rootMargin: '200px' })
  _albumObserver.observe(sentinel)
}

function showAlbum(id) {
  var a = albums.find(function (x) { return x.id === id })
  if (!a) return
  _albumData = a
  _albumLoaded = 0
  if (_albumObserver) { _albumObserver.disconnect(); _albumObserver = null }
  albumGrid.style.display = 'none'
  albumDetail.style.display = 'block'
  var html = '<div class="album-detail-wrap">' +
    '<div class="album-detail-top">' +
    '<button class="album-back" id="albumBack">&larr; 返回</button>' +
    '</div>' +
    '<div class="album-detail-header">' +
    '<div class="album-detail-title">' + a.title + '</div>' +
    '<div class="album-detail-meta">' + a.date + ' . ' + a.photos.length + ' 个瞬间</div>' +
    (a.description ? '<div class="album-detail-desc">' + a.description + '</div>' : '') +
    '</div><div class="photo-grid"></div></div>'
  albumDetail.innerHTML = html
  document.getElementById('albumBack').addEventListener('click', function () {
    location.hash = '#/gallery'
  })
  renderAlbumBatch()
}

function showGallery() {
  listView.style.display = 'none'
  articleViewEl.style.display = 'none'
  archiveViewEl.style.display = 'none'
  galleryView.style.display = 'block'
  pageHeader.style.display = 'none'
  tocToggle.classList.remove('show')
  tocPanel.classList.remove('show')
  albumGrid.style.display = ''
  albumDetail.style.display = 'none'
  albumGrid.innerHTML = '<div class="gallery-wrap"><div class="gallery-header"><h1>照片墙</h1></div><div class="album-grid" id="albumGridInner"></div></div>'
  renderAlbums()
  window.scrollTo({ top: 0 })
}
