// 本地 / CI 预览用的静态服务器。
//
// 它多做了 gzip 与 Cache-Control，不是为了好看：Lighthouse 的「用文本压缩」
// 和「用长缓存 TTL」两条，量的是服务器有没有这两样能力。GitHub Pages 两样都有，
// 而这个脚本原先两样都没有，于是本地和 CI 量出来的性能分是在量「本地服务器缺
// 什么」，不是在量「站点慢在哪」。门禁要是有意义，被量的东西得先站得住。
const http = require('http')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const ROOT = path.join(__dirname, '..', '.output', 'public')
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2' }

// 已经压过的格式再 gzip 只是白烧 CPU（实测：对 webp/woff2 gzip 反而变大）
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.xml', '.svg'])
// 带内容哈希的构建产物可以永久缓存；其余与 GitHub Pages 一样回源校验
const HASHED = /\.[0-9a-f]{8,}\.(js|css|woff2|png|jpg|jpeg|webp|svg|json)$/i

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.endsWith('/')) p += 'index.html'
  const candidates = [p, path.join(p, 'index.html'), p + '.html']
  let file = null
  for (const c of candidates) {
    const f = path.join(ROOT, c)
    if (f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile()) { file = f; break }
  }
  if (!file) { res.writeHead(404); return res.end('nf') }

  const ext = path.extname(file).toLowerCase()
  const headers = {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': HASHED.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache'
  }

  if (COMPRESSIBLE.has(ext) && String(req.headers['accept-encoding'] || '').includes('gzip')) {
    headers['content-encoding'] = 'gzip'
    headers.vary = 'Accept-Encoding'
    res.writeHead(200, headers)
    fs.createReadStream(file).pipe(zlib.createGzip({ level: 6 })).pipe(res)
    return
  }
  res.writeHead(200, headers)
  fs.createReadStream(file).pipe(res)
}).listen(4173, () => console.log('dist served at :4173 (gzip + cache-control on)'))