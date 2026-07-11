import { readFileSync, readdirSync, writeFileSync, existsSync, statSync, cpSync } from 'fs'
import { readFile, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import exifr from 'exifr'
import * as yaml from 'js-yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const POSTS_DIR = join(ROOT, 'content', 'posts')
const ALBUMS_DIR = join(ROOT, 'content', 'albums')
const CDN_BASE = 'https://raw.githubusercontent.com/ninasukiwww-png/my-images/main/blog'
const SITE_URL = 'https://blog.snowblock.top'

// ============================
// BUILD CACHE (mtime tracking)
// ============================
const CACHE_FILE = join(ROOT, '.build-cache.json')
let buildCache = {}
try {
  buildCache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
} catch (e) {
  if (e.code !== 'ENOENT') console.warn('  build cache load failed:', e.message)
}

function saveCache() {
  writeFileSync(CACHE_FILE, JSON.stringify(buildCache, null, 2) + '\n', 'utf-8')
}

function isStale(key, filePath) {
  try {
    const mtime = statSync(filePath).mtimeMs
    const cached = buildCache[key]
    if (cached === mtime) return false
    buildCache[key] = mtime
    return true
  } catch (e) {
    return true
  }
}

// ============================
// DESIGN TOKENS
// ============================
const DESIGN_TOKENS_DIR = join(__dirname, '..', '..', 'design-tokens')
const CSS_OUT_DIR = join(ROOT, 'assets', 'css')

function copyDesignTokens() {
  const files = ['tokens.css', 'toast.css']
  const outDir = CSS_OUT_DIR
  let copied = 0
  for (const f of files) {
    const src = join(DESIGN_TOKENS_DIR, f)
    const dst = join(outDir, f)
    if (!existsSync(src)) { console.warn('  design token not found:', f); continue }
    if (isStale('tokens:' + f, src)) {
      cpSync(src, dst)
      copied++
    }
  }
  if (copied) console.log(`  design tokens: ${copied} copied`)
}

// ============================
// PARSE POST (js-yaml)
// ============================
function parsePost(filepath) {
  const text = readFileSync(filepath, 'utf-8')
  const lines = text.split('\n')
  let meta = {}
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
  const metaLines = []

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '---' && inMeta) {
      bodyStart = i + 1
      break
    }
    if (inMeta) metaLines.push(line)
    i++
  }

  if (metaLines.length) {
    try {
      meta = yaml.load(metaLines.join('\n')) || {}
    } catch (e) {
      console.log(`  yaml parse warning (${filepath}): ${e.message}`)
    }
  }

  const stem = filepath.split('/').pop().replace(/\.md$/, '')
  if (!title) title = meta.title || stem
  const tags = (meta.tags || '').toString().split(',').map(t => t.trim()).filter(Boolean)
  const pinned = meta.pinned === true || meta.pinned === 'true'

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

// ============================
// BUILD: POSTS INDEX
// ============================
function buildPosts() {
  const files = readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'index.json' && !f.startsWith('_'))
    .sort()

  if (!files.length) {
    writeFileSync(join(POSTS_DIR, 'index.json'), '[]\n', 'utf-8')
    console.log('  posts: 0')
    return
  }

  const posts = files.map(f => parsePost(join(POSTS_DIR, f)))

  posts.sort(function (a, b) {
    const pa = a.pinned ? 1 : 0
    const pb = b.pinned ? 1 : 0
    if (pa !== pb) return pb - pa
    const dc = (b.date || '').localeCompare(a.date || '')
    if (dc !== 0) return dc
    return (b.time || '').localeCompare(a.time || '')
  })

  writeFileSync(
    join(POSTS_DIR, 'index.json'),
    JSON.stringify(posts, null, 2) + '\n',
    'utf-8'
  )
  console.log(`  posts: ${posts.length} articles`)
}

// ============================
// BUILD: ALBUMS INDEX
// ============================
async function buildAlbums() {
  const IMAGES_DIR = join(ROOT, '..', 'my-images', 'blog')
  let dirs = []
  try {
    dirs = readdirSync(IMAGES_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
  } catch (e) {
    console.log('  albums: 0 (my-images/blog not found)')
    writeFileSync(join(ALBUMS_DIR, 'index.json'), '[]\n', 'utf-8')
    return
  }

  const albums = await Promise.all(dirs.map(async function(dir) {
    const dirPath = join(IMAGES_DIR, dir)
    const extRe = /\.(jpg|jpeg|png|webp|gif|bmp)$/i
    const allFiles = readdirSync(dirPath).filter(f => extRe.test(f))
    const webpBasenames = new Set()
    allFiles.forEach(function(f) { if (f.toLowerCase().endsWith('.webp')) webpBasenames.add(f.replace(extRe, '')) })
    const files = allFiles.filter(function(f) {
      if (f.toLowerCase().endsWith('.webp')) return true
      return !webpBasenames.has(f.replace(extRe, ''))
    }).sort()

    let meta = {}
    try {
      meta = JSON.parse(readFileSync(join(dirPath, 'meta.json'), 'utf-8'))
    } catch (e) {
      if (e.code !== 'ENOENT') console.warn('  meta.json parse failed (' + dir + '/' + dirPath + '):', e.message)
    }

    const photos = await Promise.all(files.map(async function(f) {
      let exif = null
      try {
        const buf = await readFile(join(dirPath, f))
        const raw = await exifr.parse(buf, { pick: ['Make','Model','ISO','FNumber','FocalLength','ExposureTime','ImageWidth','ImageHeight'] })
        if (raw && Object.keys(raw).length) exif = raw
        else if (buf.length > 0) console.warn('  exif parse returned empty for:', f)
      } catch (e) {
        console.warn('  exif parse failed for', f, ':', e.message)
      }
      const st = await stat(join(dirPath, f))
      return {
        url: CDN_BASE + '/' + dir + '/' + f + '?t=' + st.mtimeMs,
        exif: exif || undefined,
      }
    }))

    let coverUrl = photos[0]?.url || ''
    if (meta.cover) {
      try {
        const st = await stat(join(dirPath, meta.cover))
        coverUrl = CDN_BASE + '/' + dir + '/' + meta.cover + '?t=' + st.mtimeMs
      } catch (e) {
        coverUrl = CDN_BASE + '/' + dir + '/' + meta.cover
      }
    }

    return {
      id: dir,
      title: meta.title || dir,
      description: meta.description || '',
      cover: coverUrl,
      date: meta.date || '',
      photos,
    }
  }))

  albums.sort(function(a, b) {
    return (b.date || '').localeCompare(a.date || '')
  })

  writeFileSync(join(ALBUMS_DIR, 'index.json'), JSON.stringify(albums, null, 2) + '\n', 'utf-8')
  console.log('  albums: ' + albums.length + ' (auto)')
}

// ============================
// BUILD: RSS FEED
// ============================
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

// ============================
// BUILD: SITEMAP
// ============================
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

// ============================
// HELPERS
// ============================
function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ============================
// BUILD: VERSION HASHING
// ============================
function versionAssets() {
  const CSS_SRC = ['style.css', 'tokens.css', 'toast.css']
  const cssDir = join(ROOT, 'assets', 'css')
  const cssContent = CSS_SRC.map(function(f) {
    return readFileSync(join(cssDir, f), 'utf-8')
  }).join('\n')
  const cssHash = createHash('md5').update(cssContent).digest('hex').slice(0, 8)

  const JS_SRC = ['snowblock.js', 'profile.js', 'posts.js', 'article.js', 'archive.js', 'gallery.js', 'router.js', 'init.js']
  const jsDir = join(ROOT, 'assets', 'js')
  const jsContent = JS_SRC.map(function(f) {
    return readFileSync(join(jsDir, f), 'utf-8')
  }).join('\n')

  const appJs = jsContent
  writeFileSync(join(jsDir, 'app.js'), appJs, 'utf-8')
  const jsHash = createHash('md5').update(appJs).digest('hex').slice(0, 8)

  let html = readFileSync(join(ROOT, 'index.html'), 'utf-8')
  html = html.replace(/(href="assets\/css\/tokens\.css)(?:\?v=[^"]*)?(")/, '$1?v=' + cssHash + '"')
  html = html.replace(/(href="assets\/css\/style\.css)(?:\?v=[^"]*)?(")/, '$1?v=' + cssHash + '"')
  html = html.replace(/(href="assets\/css\/toast\.css)(?:\?v=[^"]*)?(")/, '$1?v=' + cssHash + '"')
  html = html.replace(/(src="assets\/js\/app\.js)(?:\?v=[^"]*)?(")/, '$1?v=' + jsHash + '"')
  html = html.replace(/(<meta name="build-ts" content=")\d*(")/, '$1' + Date.now() + '"')
  writeFileSync(join(ROOT, 'index.html'), html, 'utf-8')
  console.log('  version: ok (css=' + cssHash + ', js=' + jsHash + ')')
}

// ============================
// MAIN
// ============================
console.log('Building indexes...')
copyDesignTokens()
buildPosts()
await buildAlbums()
buildFeed()
buildSitemap()
versionAssets()
saveCache()
console.log('Done.')
