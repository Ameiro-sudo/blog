import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs'
import { readFile } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import exifr from 'exifr'
import * as yaml from 'js-yaml'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import sanitizeHtml from 'sanitize-html'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const POSTS_DIR = join(ROOT, 'content', 'posts')
const ALBUMS_DIR = join(ROOT, 'content', 'albums')
const siteConfig = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf-8'))
const SITE_URL = siteConfig.SITE_URL

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

  const stem = basename(filepath).replace(/\.md$/, '')
  if (!title) title = meta.title || stem
  const tags = (meta.tags || '').toString().split(',').map(t => t.trim()).filter(Boolean)
  const pinned = meta.pinned === true || meta.pinned === 'true'

  const bodyLines = lines.slice(bodyStart)
  const rawBody = bodyLines.join('\n').trim()
  const cleanBody = rawBody
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1 ')
    .replace(/[#*`\[\]()>_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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
    writeIfChanged(join(POSTS_DIR, 'index.json'), '[]\n')
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

  writeIfChanged(
    join(POSTS_DIR, 'index.json'),
    JSON.stringify(posts, null, 2) + '\n'
  )
  console.log(`  posts: ${posts.length} articles`)
}

// ============================
// SHARED: FRONTMATTER PARSER
// ============================
function parseMd(text) {
  let meta = {}
  let body = text
  const lines = text.split('\n')
  if (lines[0] && lines[0].trim() === '---') {
    const metaLines = []
    let i = 1
    while (i < lines.length && lines[i].trim() !== '---') { metaLines.push(lines[i]); i++ }
    if (i < lines.length) {
      try { meta = yaml.load(metaLines.join('\n')) || {} } catch (e) { /* 忽略解析警告 */ }
      body = lines.slice(i + 1).join('\n')
    }
  }
  return { meta, body: body.trim() }
}

// ============================
// BUILD: MOMENTS INDEX
// content/moments/*.md —— 每条 = 一条说说
// frontmatter: time(必填) ; 正文 = 说说内容
// ============================
function buildMoments() {
  const dir = join(ROOT, 'content', 'moments')
  let files = []
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_')).sort()
  } catch (e) { return }

  if (!files.length) return // 无源文件时保留已提交的 index.json

  const moments = files.map(function (f) {
    const { meta, body } = parseMd(readFileSync(join(dir, f), 'utf-8'))
    return { time: meta.time || '', text: body || meta.text || '' }
  }).filter(m => m.text && m.time)

  moments.sort((a, b) => b.time.localeCompare(a.time))

  writeIfChanged(
    join(dir, 'index.json'),
    JSON.stringify(moments, null, 2) + '\n'
  )
  console.log(`  moments: ${moments.length} items`)
}

// ============================
// BUILD: FRIENDS INDEX
// content/friends/*.md —— 每条 = 一个友链
// frontmatter: name / url / desc
// ============================
function buildFriends() {
  const dir = join(ROOT, 'content', 'friends')
  let files = []
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_')).sort()
  } catch (e) { return }

  if (!files.length) return

  const friends = files.map(function (f) {
    const { meta } = parseMd(readFileSync(join(dir, f), 'utf-8'))
    return { name: meta.name || '', url: meta.url || '', desc: meta.desc || '' }
  }).filter(f => f.name && f.url)

  friends.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))

  writeIfChanged(
    join(dir, 'index.json'),
    JSON.stringify(friends, null, 2) + '\n'
  )
  console.log(`  friends: ${friends.length} items`)
}

// ============================
// BUILD: ALBUMS INDEX
// ============================
// 自动扫描 assets/vendor/images/albums/：
//  - 子目录 = 一个相册（目录内 meta.json 提供 title/description/date）
//  - 平铺图片 = 视为单个相册（兼容旧结构）
// 预留 albumsSource 远程接入接口（site.config.json 配置后优先拉取）
// ============================
async function buildAlbums() {
  const idxFile = join(ALBUMS_DIR, 'index.json')
  const source = siteConfig.albumsSource || ''

  if (source) {
    // 预留接入接口：配置 albumsSource 后从这里拉取相册数据
    try {
      const res = await fetch(source)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const albums = await res.json()
      writeIfChanged(idxFile, JSON.stringify(albums, null, 2) + '\n')
      console.log('  albums: ' + albums.length + ' (remote: ' + source + ')')
      return
    } catch (e) {
      console.log('  albums: 远程拉取失败（' + source + '），改用本地目录')
    }
  }

  // 本地目录扫描：assets/vendor/images/albums/
  // 子目录 = 独立相册；无子目录时平铺图片视为单个相册
  const ALBUMS_LOCAL = join(ROOT, 'assets', 'vendor', 'images', 'albums')
  const extRe = /\.(jpg|jpeg|png|webp|gif|bmp)$/i
  let entries = []
  try {
    entries = readdirSync(ALBUMS_LOCAL, { withFileTypes: true })
  } catch (e) {
    console.log('  albums: 本地目录缺失（' + ALBUMS_LOCAL + '），保留已提交数据')
    return
  }

  const subdirs = entries.filter(d => d.isDirectory()).map(d => d.name).sort()
  const flatFiles = entries.filter(e => !e.isDirectory() && extRe.test(e.name)).map(e => e.name).sort()

  async function scanAlbum(dirName, fallbackTitle) {
    const albumDir = dirName ? join(ALBUMS_LOCAL, dirName) : ALBUMS_LOCAL
    let names = []
    try {
      names = readdirSync(albumDir).filter(f => extRe.test(f)).sort()
    } catch (e) { return null }
    if (!names.length) return null

    const prefix = dirName ? dirName + '/' : ''
    const cover = 'assets/vendor/images/albums/' + prefix + names[0]

    let meta = {}
    try {
      meta = JSON.parse(readFileSync(join(albumDir, 'meta.json'), 'utf-8'))
    } catch (e) {
      if (e.code !== 'ENOENT') console.warn('  albums meta.json parse failed:', e.message)
    }

    const photos = []
    for (const f of names) {
      const url = 'assets/vendor/images/albums/' + prefix + f
      let exif = null
      try {
        const buf = await readFile(join(albumDir, f))
        const raw = await exifr.parse(buf, { pick: ['Make', 'Model', 'ISO', 'FNumber', 'FocalLength', 'ExposureTime', 'ImageWidth', 'ImageHeight'] })
        if (raw && Object.keys(raw).length) exif = raw
      } catch (e) {
        // 无 EXIF 或解析失败则跳过
      }
      photos.push({ url, ...(exif ? { exif } : {}) })
    }

    return {
      id: dirName || 'test',
      title: meta.title || fallbackTitle,
      description: meta.description || '',
      cover,
      date: meta.date || '',
      photos,
    }
  }

  const albums = []
  if (subdirs.length) {
    for (const dirName of subdirs) {
      const album = await scanAlbum(dirName, dirName)
      if (album) albums.push(album)
    }
    if (!albums.length) {
      writeIfChanged(join(ALBUMS_DIR, 'index.json'), '[]\n')
      console.log('  albums: 0 (子目录相册均为空)')
      return
    }
  } else if (flatFiles.length) {
    const album = await scanAlbum(null, '照片墙')
    if (album) albums.push(album)
  }

  if (!albums.length) {
    writeIfChanged(join(ALBUMS_DIR, 'index.json'), '[]\n')
    console.log('  albums: 0 (本地目录为空)')
    return
  }

  albums.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))

  writeIfChanged(join(ALBUMS_DIR, 'index.json'), JSON.stringify(albums, null, 2) + '\n')
  console.log('  albums: ' + albums.length + ' (' + albums.map(a => a.photos.length).join('/') + ' photos)')
}

// ============================
// BUILD-TIME MARKDOWN RENDERING (Nuxt SSG)
// 与旧运行时链路对齐：markdown-it 配置 / hljs 高亮 / 代码块包装 / 表格包装
// 全部在构建期完成，产物为 content/posts/<id>.json（元数据 + 消毒后的 HTML）
// ============================
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>` } catch (e) { /* fallthrough */ }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  },
})

// vendor 图片懒加载规则（与旧 app.js 的 image 规则一致）
const defaultImage = md.renderer.rules.image.bind(md.renderer.rules)
md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  const srcIdx = token.attrIndex('src')
  const src = srcIdx >= 0 ? token.attrs[srcIdx][1] : ''
  const alt = token.content || ''
  if (src.includes('../my-images/') || src.includes('assets/vendor/')) {
    return `<img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(alt)}" loading="lazy">`
  }
  return defaultImage(tokens, idx, options, env, self)
}

// 代码块：构建期直接产出 code-block-wrapper / code-lang / copy-btn 结构，
// 替代旧 article.enhance 的运行时 DOM 改写
md.renderer.rules.fence = function (tokens, idx) {
  const token = tokens[idx]
  const lang = (token.info || '').trim().split(/\s+/)[0]
  let inner
  if (lang && hljs.getLanguage(lang)) {
    try {
      inner = `<pre class="hljs"><code>${hljs.highlight(token.content, { language: lang, ignoreIllegals: true }).value}</code></pre>`
    } catch (e) { /* fallthrough */ }
  }
  if (!inner) inner = `<pre class="hljs"><code>${md.utils.escapeHtml(token.content)}</code></pre>`
  const lbl = lang ? `<span class="code-lang">${md.utils.escapeHtml(lang)}</span>` : ''
  return `<div class="code-block-wrapper">${lbl}${inner}<button class="copy-btn" type="button">复制</button></div>\n`
}

function enhanceArticleHtml (html) {
  // h2/h3 注入 TOC 锚点 id（与旧 renderTOC 同一 slug 规则）
  const seenIds = {}
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, function (_, lvl, inner) {
    const text = inner.replace(/<[^>]+>/g, '')
    const baseId = text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '')
    let id = baseId
    let n = 2
    while (seenIds[id]) { id = baseId + '-' + n++ }
    seenIds[id] = true
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`
  })
  // 表格响应式包装
  html = html.replace(/<table>/g, '<div class="table-responsive"><table>').replace(/<\/table>/g, '</table></div>')
  return html
}

function sanitizeArticleHtml (html) {
  return sanitizeHtml(html, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'code', 'pre', 'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'button', 'progress'],
    allowedAttributes: {
      '*': ['href', 'src', 'alt', 'class', 'id', 'loading', 'style', 'type', 'value', 'max'],
    },
  })
}

function extractBody(filepath) {
  const text = readFileSync(filepath, 'utf-8')
  const lines = text.split('\n')

  // 标准围栏式 frontmatter：--- ... --- 在最前
  if (lines[0]?.trim() === '---') {
    let i = 1
    while (i < lines.length && lines[i].trim() !== '---') i++
    return lines.slice(i + 1).join('\n').trim()
  }

  // 本站旧格式：# 标题 + 元数据行，直到独立的一行 ---（post1~post8 均如此）
  if (lines[0]?.startsWith('# ')) {
    for (let j = 1; j < lines.length; j++) {
      if (lines[j].trim() === '---') return lines.slice(j + 1).join('\n').trim()
      // 空行后仍是元数据也继续扫；一旦出现普通正文段落则视为无 frontmatter
      if (j > 1 && lines[j].trim() !== '' && !/^[A-Za-z_-]+:\s/.test(lines[j]) && !lines[j].startsWith('# ')) break
    }
    // 无 --- 收尾：仅剥掉标题行
    return lines.slice(1).join('\n').trim()
  }

  return lines.join('\n').trim()
}

function buildArticlePayloads() {
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md') && f !== 'index.json' && !f.startsWith('_'))
  const postsIndex = JSON.parse(readFileSync(join(POSTS_DIR, 'index.json'), 'utf-8'))
  const byId = Object.fromEntries(postsIndex.map(p => [p.id, p]))
  let count = 0
  for (const f of files) {
    const id = basename(f).replace(/\.md$/, '')
    const meta = byId[id]
    if (!meta) continue
    const rawBody = extractBody(join(POSTS_DIR, f))
    const wc = rawBody.replace(/\s+/g, '').length
    const html = sanitizeArticleHtml(enhanceArticleHtml(md.render(rawBody)))
    writeIfChanged(
      join(POSTS_DIR, id + '.json'),
      JSON.stringify({ ...meta, wc, html })
    )
    count++
  }
  console.log(`  article payloads: ${count}`)
}

function buildAboutPayload() {
  const aboutFile = join(ROOT, 'content', 'pages', 'about.md')
  try {
    // about.md 为纯 Markdown（无 frontmatter），剥掉首个 h1 —— 页面模板已单独渲染标题
    const body = extractBody(aboutFile).replace(/^# .+\r?\n/, '')
    const html = sanitizeArticleHtml(enhanceArticleHtml(md.render(body)))
    writeIfChanged(
      join(ROOT, 'content', 'pages', 'about.json'),
      JSON.stringify({ title: '关于', html })
    )
    console.log('  about payload: ok')
  } catch (e) {
    console.log('  about payload skipped (' + e.message + ')')
  }
}

// ============================
// BUILD: RSS FEED
// ============================
function buildFeed() {
  const posts = JSON.parse(readFileSync(join(POSTS_DIR, 'index.json'), 'utf-8'))
  const dated = posts.filter(function (p) { return p.date }).map(function (p) { return new Date(p.date).getTime() })
  const lastBuild = dated.length ? new Date(Math.max.apply(null, dated)).toUTCString() : new Date(0).toUTCString()
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
  xml += '  <channel>\n'
  xml += '    <title>SnowBlock</title>\n'
  xml += '    <link>' + SITE_URL + '</link>\n'
  xml += '    <description>雪地笔记</description>\n'
  xml += '    <language>zh-CN</language>\n'
  xml += '    <lastBuildDate>' + lastBuild + '</lastBuildDate>\n'
  xml += '    <atom:link href="' + SITE_URL + '/feed.xml" rel="self" type="application/rss+xml"/>\n'
  posts.forEach(function (p) {
    if (!p.date) return
    const d = new Date(p.date)
    const pubDate = d.toUTCString()
    xml += '    <item>\n'
    xml += '      <title>' + escXml(p.title) + '</title>\n'
    xml += '      <link>' + SITE_URL + '/posts/' + p.id + '/</link>\n'
    xml += '      <guid>' + SITE_URL + '/posts/' + p.id + '/</guid>\n'
    xml += '      <pubDate>' + pubDate + '</pubDate>\n'
    xml += '      <description>' + escXml(p.excerpt || '') + '</description>\n'
    xml += '    </item>\n'
  })
  xml += '  </channel>\n</rss>\n'
  writeIfChanged(join(ROOT, 'public', 'feed.xml'), xml)
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
  xml += '  <url><loc>' + SITE_URL + '/posts/</loc></url>\n'
  xml += '  <url><loc>' + SITE_URL + '/archive/</loc></url>\n'
  xml += '  <url><loc>' + SITE_URL + '/gallery/</loc></url>\n'
  xml += '  <url><loc>' + SITE_URL + '/moments/</loc></url>\n'
  xml += '  <url><loc>' + SITE_URL + '/friends/</loc></url>\n'
  xml += '  <url><loc>' + SITE_URL + '/about/</loc></url>\n'
  posts.forEach(function (p) {
    if (!p.date) return
    xml += '  <url><loc>' + SITE_URL + '/posts/' + p.id + '/</loc></url>\n'
  })
  xml += '</urlset>\n'
  writeIfChanged(join(ROOT, 'public', 'sitemap.xml'), xml)
  console.log('  sitemap: ok')
}

// ============================
// HELPERS
// ============================
let changedAny = false

function writeIfChanged(file, content) {
  try {
    const old = readFileSync(file, 'utf-8')
    if (old === content) return false
  } catch (e) {}
  writeFileSync(file, content, 'utf-8')
  changedAny = true
  return true
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ============================
// BUILD: VERSION HASHING
// ============================
function versionAssets() {
  const CSS_SRC = ['style.css', 'tokens.css', 'toast.css']
  const cssDir = join(ROOT, 'assets', 'css')
  const cssContent = CSS_SRC.map(function (f) {
    return readFileSync(join(cssDir, f), 'utf-8')
  }).join('\n')
  const cssHash = createHash('md5').update(cssContent).digest('hex').slice(0, 8)

  const JS_SRC = ['snowblock.js', 'profile.js', 'posts.js', 'article.js', 'archive.js', 'gallery.js', 'modules.js', 'router.js', 'init.js']
  const jsDir = join(ROOT, 'assets', 'js')
  const jsContent = JS_SRC.map(function (f) {
    return readFileSync(join(jsDir, f), 'utf-8')
  }).join('\n')

  const appConfig = {
    CDN_BASE: siteConfig.CDN_BASE,
    SITE_URL: siteConfig.SITE_URL,
    profile: siteConfig.profile,
    ogDefaults: siteConfig.ogDefaults,
  }
  const appJs = jsContent.replace(
    'app.config = {} // 构建时由 build.js 注入 JSON 内容',
    'app.config = ' + JSON.stringify(appConfig, null, 2)
  )
  writeIfChanged(join(jsDir, 'app.js'), appJs)
  const jsHash = createHash('md5').update(appJs).digest('hex').slice(0, 8)

  let html = readFileSync(join(ROOT, 'index.html'), 'utf-8')
  html = html.replace(/(href="assets\/css\/tokens\.css)(?:\?v=[^"]*)?(")/, '$1?v=' + cssHash + '"')
  html = html.replace(/(href="assets\/css\/style\.css)(?:\?v=[^"]*)?(")/, '$1?v=' + cssHash + '"')
  html = html.replace(/(href="assets\/css\/toast\.css)(?:\?v=[^"]*)?(")/, '$1?v=' + cssHash + '"')
  html = html.replace(/(src="assets\/js\/app\.js)(?:\?v=[^"]*)?(")/, '$1?v=' + jsHash + '"')
  if (changedAny) {
    html = html.replace(/(<meta name="build-ts" content=")\d*(")/, '$1' + Date.now() + '"')
  }
  writeIfChanged(join(ROOT, 'index.html'), html)
  console.log('  version: ok (css=' + cssHash + ', js=' + jsHash + (changedAny ? ', build-ts bumped' : ', no changes') + ')')
}

// ============================
// MAIN
// ============================
mkdirSync(join(ROOT, 'public'), { recursive: true })
console.log('Building indexes...')
buildPosts()
await buildAlbums()
buildMoments()
buildFriends()
buildArticlePayloads()
buildAboutPayload()
buildFeed()
buildSitemap()
versionAssets()
console.log('Done.')
