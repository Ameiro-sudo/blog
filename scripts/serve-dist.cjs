const http = require('http')
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..', '.output', 'public')
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2' }
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
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}).listen(4173, () => console.log('dist served at :4173'))
