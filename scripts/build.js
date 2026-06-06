import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const POSTS_DIR = join(ROOT, 'content', 'posts')
const ALBUMS_DIR = join(ROOT, 'content', 'albums')
const CDN_BASE = 'https://raw.githubusercontent.com/ninasukiwww-png/my-images/main/blog'
const SITE_URL = 'https://blog.snowblock.top'

function parseFrontmatter(text) {
  const lines = text.split('\n')
  const meta = {}
  let bodyStart = 0

  if (lines[0]?.trim() === '---') {
    let i = 1
    while (i < lines.length) {
      const line = lines[i].trim()
      if (line === '---') { bodyStart = i + 1; break }
      const m = line.match(/^(\w+)\s*:\s*(.+)$/)
      if (m) meta[m[1]] = m[2].trim()
      i++
    }
  }

  const body = lines.slice(bodyStart).join('\n').trim()
  return { meta, body }
}

function parsePost(filepath) {
  const text = readFileSync(filepath, 'utf-8')
  const lines = text.split('\n')
  const meta = {}
  let title = ''
  let bodyStart = 0

  if (lines[0]?.startsWith('# ')) {
    title = lines[0].slice(2).trim()
    bodyStart = 1
  }

  if (lines[0]?.trim() === '---') {
    bodyStart = 1
  }

  let i = bodyStart
  let inMeta = bodyStart === 1
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line === '---' && inMeta) {
      bodyStart = i + 1
      break
    }
    const m = line.match(/^(\w+)\s*:\s*(.+)$/)
    if (m && inMeta) meta[m[1]] = m[2].trim()
    i++
  }

  const stem = filepath.split('/').pop().replace(/\.md$/, '')
  if (!title) title = meta.title || stem
  const tags = (meta.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  const pinned = meta.pinned === 'true'

  const bodyLines = lines.slice(bodyStart)
  const rawBody = bodyLines.join('\n').trim()
  const cleanBody = rawBody.replace(/[#*`\[\]()>_~]/g, '').replace(/\s+/g, ' ').trim()
  const excerpt = (meta.description || cleanBody).slice(0, 200)

  return {
    id: stem,
    title,
    date: meta.date || '',
    time: meta.time || '',
    readTime: meta.readTime || '',
    tags,
    pinned,
    file: stem + '.md',
    description: meta.description || '',
    image: meta.image || '',
    excerpt,
  }
}

function buildPosts() {
  const files = readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'index.json' && !f.startsWith('_'))
    .sort()

  const posts = files.map(f => parsePost(join(POSTS_DIR, f)))

  writeFileSync(
    join(POSTS_DIR, 'index.json'),
    JSON.stringify(posts, null, 2) + '\n',
    'utf-8'
  )
  console.log(`  posts: ${posts.length} articles`)
}

function buildAlbums() {
  const IMAGES_DIR = join(ROOT, '..', 'my-images', 'blog')
  let dirs = []
  try {
    dirs = readdirSync(IMAGES_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort()
  } catch (e) {
    console.log('  albums: 0 (my-images/blog not found)')
    writeFileSync(join(ALBUMS_DIR, 'index.json'), '[]\n', 'utf-8')
    return
  }

  const albums = dirs.map(function(dir) {
    const dirPath = join(IMAGES_DIR, dir)
    const files = readdirSync(dirPath)
      .filter(f => /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(f))
      .sort()

    let meta = {}
    try {
      meta = JSON.parse(readFileSync(join(dirPath, 'meta.json'), 'utf-8'))
    } catch (e) {}

    const photos = files.map(function(f) {
      const caption = (meta.photos && meta.photos[f]) || ''
      return { url: CDN_BASE + '/' + dir + '/' + f, caption: caption }
    })

    return {
      id: dir,
      title: meta.title || dir,
      description: meta.description || '',
      cover: meta.cover ? CDN_BASE + '/' + dir + '/' + meta.cover : (photos[0]?.url || ''),
      date: meta.date || '',
      photos,
    }
  })

  writeFileSync(join(ALBUMS_DIR, 'index.json'), JSON.stringify(albums, null, 2) + '\n', 'utf-8')
  console.log('  albums: ' + albums.length + ' (auto)')
}

function buildFeed() {
  const posts = JSON.parse(readFileSync(join(POSTS_DIR, 'index.json'), 'utf-8'))
  const now = new Date().toUTCString()
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
  xml += '  <channel>\n'
  xml += '    <title>SnowBlock</title>\n'
  xml += '    <link>' + SITE_URL + '</link>\n'
  xml += '    <description>雪地笔记</description>\n'
  xml += '    <language>zh-CN</language>\n'
  xml += '    <lastBuildDate>' + now + '</lastBuildDate>\n'
  xml += '    <atom:link href="' + SITE_URL + '/feed.xml" rel="self" type="application/rss+xml"/>\n'
  posts.forEach(function (p) {
    if (!p.date) return
    const d = new Date(p.date)
    const pubDate = d.toUTCString()
    xml += '    <item>\n'
    xml += '      <title>' + escXml(p.title) + '</title>\n'
    xml += '      <link>' + SITE_URL + '/#/' + p.id + '</link>\n'
    xml += '      <guid>' + SITE_URL + '/#/' + p.id + '</guid>\n'
    xml += '      <pubDate>' + pubDate + '</pubDate>\n'
    xml += '      <description>' + escXml(p.excerpt || '') + '</description>\n'
    xml += '    </item>\n'
  })
  xml += '  </channel>\n</rss>\n'
  writeFileSync(join(ROOT, 'feed.xml'), xml, 'utf-8')
  console.log('  feed: ok')
}

function buildSitemap() {
  const posts = JSON.parse(readFileSync(join(POSTS_DIR, 'index.json'), 'utf-8'))
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  xml += '  <url><loc>' + SITE_URL + '/</loc></url>\n'
  xml += '  <url><loc>' + SITE_URL + '/#/archive</loc></url>\n'
  xml += '  <url><loc>' + SITE_URL + '/#/gallery</loc></url>\n'
  xml += '  <url><loc>' + SITE_URL + '/#/about</loc></url>\n'
  posts.forEach(function (p) {
    if (!p.date) return
    xml += '  <url><loc>' + SITE_URL + '/#/' + p.id + '</loc></url>\n'
  })
  xml += '</urlset>\n'
  writeFileSync(join(ROOT, 'sitemap.xml'), xml, 'utf-8')
  console.log('  sitemap: ok')
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function versionAssets() {
  const css = readFileSync(join(ROOT, 'assets', 'css', 'style.css'), 'utf-8')
  const js = readFileSync(join(ROOT, 'assets', 'js', 'app.js'), 'utf-8')
  const cssHash = createHash('md5').update(css).digest('hex').slice(0, 8)
  const jsHash = createHash('md5').update(js).digest('hex').slice(0, 8)
  let html = readFileSync(join(ROOT, 'index.html'), 'utf-8')
  html = html.replace(/(href="assets\/css\/style\.css)(?:\?v=[^"]*)?(")/, '$1?v=' + cssHash + '"')
  html = html.replace(/(src="assets\/js\/app\.js)(?:\?v=[^"]*)?(")/, '$1?v=' + jsHash + '"')
  writeFileSync(join(ROOT, 'index.html'), html, 'utf-8')
  console.log('  version: ok (' + cssHash + ', ' + jsHash + ')')
}

console.log('Building indexes...')
buildPosts()
buildAlbums()
buildFeed()
buildSitemap()
versionAssets()
console.log('Done.')
