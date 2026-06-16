var CACHE = 'v1'
var CDN = 'raw.githubusercontent.com/ninasukiwww-png/my-images'

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (e) {
  e.waitUntil(
    Promise.all([
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k)
        }))
      }),
      self.clients.claim()
    ])
  )
})

self.addEventListener('fetch', function (e) {
  var url = e.request.url
  if (url.indexOf(CDN) === -1) return

  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit
      return fetch(e.request).then(function (res) {
        if (res.ok) {
          var clone = res.clone()
          caches.open(CACHE).then(function (cache) { cache.put(e.request, clone) })
        }
        return res
      })
    })
  )
})