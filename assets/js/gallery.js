app.gallery = {
  albumObserver: null,
  albumData: null,
  batchSize: 12,
  loaded: 0,

  renderList: function() {
    var grid = app.dom.albumGrid.querySelector('.album-grid')
    if (!grid) return
    var html = ''
    app.state.albums.forEach(function (a) {
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
  },

  renderBatch: function() {
    var grid = app.dom.albumDetail.querySelector('.photo-grid')
    if (!grid || !this.albumData) return
    var end = Math.min(this.loaded + this.batchSize, this.albumData.photos.length)
    var html = ''
    for (var i = this.loaded; i < end; i++) {
      var p = this.albumData.photos[i]
      html += '<div class="photo-item">' +
        '<img src="' + p.url + '" alt="" decoding="async">' +
        '</div>'
    }
    grid.insertAdjacentHTML('beforeend', html)
    var items = grid.querySelectorAll('.photo-item')
    for (var i = this.loaded; i < end; i++) {
      (function (img, exif) {
        img.addEventListener('click', function () {
          app.lightbox.open(img.src, '', exif)
        })
      })(items[i].querySelector('img'), this.albumData.photos[i].exif)
    }
    this.loaded = end
    var nextEnd = Math.min(end + this.batchSize, this.albumData.photos.length)
    for (var i = end; i < nextEnd; i++) {
      var p = this.albumData.photos[i]
      var pre = new Image()
      pre.src = p.url
    }
    var sentinel = grid.querySelector('.album-sentinel')
    if (end >= this.albumData.photos.length) {
      if (sentinel) sentinel.style.display = 'none'
      return
    }
    if (!sentinel) {
      sentinel = document.createElement('div')
      sentinel.className = 'album-sentinel'
      sentinel.style.cssText = 'height:1px'
      grid.appendChild(sentinel)
    }
    if (this.albumObserver) this.albumObserver.disconnect()
    var self = this
    this.albumObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) self.renderBatch()
    }, { rootMargin: '200px' })
    this.albumObserver.observe(sentinel)
  },

  showAlbum: function(id) {
    var a = app.state.albums.find(function (x) { return x.id === id })
    if (!a) return
    this.albumData = a
    this.loaded = 0
    if (this.albumObserver) { this.albumObserver.disconnect(); this.albumObserver = null }
    app.dom.albumGrid.style.display = 'none'
    app.dom.albumDetail.style.display = 'block'
    var html = '<div class="album-detail-wrap">' +
      '<div class="album-detail-top">' +
      '<button class="album-back" id="albumBack">&larr; 返回</button>' +
      '</div>' +
      '<div class="album-detail-header">' +
      '<div class="album-detail-title">' + a.title + '</div>' +
      '<div class="album-detail-meta">' + a.date + ' . ' + a.photos.length + ' 个瞬间</div>' +
      (a.description ? '<div class="album-detail-desc">' + a.description + '</div>' : '') +
      '</div><div class="photo-grid"></div></div>'
    app.dom.albumDetail.innerHTML = html
    document.getElementById('albumBack').addEventListener('click', function () {
      location.hash = '#/gallery'
    })
    this.renderBatch()
  },

  show: function() {
    app.views.switchTo('gallery')
    app.utils.resetOG()
    document.title = '画廊 · SnowBlock'
    app.utils.setOGTag('og:title', '画廊 · SnowBlock')
    app.dom.albumGrid.style.display = ''
    app.dom.albumDetail.style.display = 'none'
    app.dom.albumGrid.innerHTML = '<div class="gallery-wrap"><div class="gallery-header"><h1>照片墙</h1></div><div class="album-grid" id="albumGridInner"></div></div>'
    this.renderList()
    window.scrollTo({ top: 0 })
  }
}
