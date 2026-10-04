import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs'
import { readFile } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
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
// FRONTMATTER（唯一实现）
// ============================
/** 取一段元数据行的 YAML 结果。解析失败只警告，不静默当成空——
 *  「元数据整个丢了但构建照样成功」是最难查的一类问题。 */
function loadYaml(metaLines, source) {
  if (!metaLines.length || !metaLines.join('\n').trim()) return {}
  try {
    return yaml.load(metaLines.join('\n')) || {}
  } catch (e) {
    console.log(`  yaml parse warning (${source}): ${e.message}`)
    return {}
  }
}

/**
 * 解析 content/ 下任意一个 .md，返回 `{ title, meta, body }`。
 *
 * 这里原来有**三个**解析器，而它们对同一种格式的理解并不一致：
 *
 *   parsePost()     认两种（`---` 围栏 / `# 标题` + 元数据行 + `---` 收尾），
 *                   但收尾用「无条件扫到 `---` 为止」——`content/pages/about.md`
 *                   （`# 关于` 后面直接就是正文，全文没有 `---`）会被整篇正文
 *                   当成元数据去 YAML 解析，只是碰巧解析失败被 catch 掉、
 *                   bodyStart 又恰好停在第 1 行，结果**碰巧**是对的。
 *   parseMd()       只认 `---` 围栏，遇到旧格式的 meta 全丢。
 *   extractBody()   认两种，但它判断「元数据结束」的依据是行形状
 *                   （`/^[A-Za-z_-]+:\s/`），上面那种碰巧靠的正是它。
 *
 * 三份各自的「凑巧对」，改成一份把行为写死：
 *   A  首行是 `---`            → 围栏式，找到收尾的 `---` 为止
 *   B  首行是 `# 标题`          → 旧格式。元数据是「`key: value` 行」与空行，
 *                               遇到**任何别的行**就认为正文开始了——
 *                               不再往下扫到 `---`，因为正文里本来就可能有 `---`
 *   C  都没有                   → 整篇都是正文
 */
function parseFrontmatter(text, source) {
  const lines = text.split('\n')
  let title = ''
  let bodyStart = 0

  if (lines[0]?.startsWith('# ')) {
    title = lines[0].slice(2).trim()
    bodyStart = 1
  }

  if (lines[0]?.trim() === '---') {
    let i = 1
    while (i < lines.length && lines[i].trim() !== '---') i++
    if (i < lines.length) {
      return { title, meta: loadYaml(lines.slice(1, i), source), body: lines.slice(i + 1).join('\n').trim() }
    }
    bodyStart = 0   // 只有开头的 --- 没有收尾：当作没有 frontmatter
  } else if (bodyStart === 1) {
    for (let i = 1; i < lines.length; i++) {
      const t = lines[i].trim()
      if (t === '---') {
        return { title, meta: loadYaml(lines.slice(1, i), source), body: lines.slice(i + 1).join('\n').trim() }
      }
      if (t === '' || /^[A-Za-z_][A-Za-z0-9_-]*:/.test(lines[i])) continue
      break
    }
  }

  return { title, meta: {}, body: lines.slice(bodyStart).join('\n').trim() }
}

// ============================
// PARSE POST
// ============================
function parsePost(filepath) {
  const { title: parsedTitle, meta, body } = parseFrontmatter(readFileSync(filepath, 'utf-8'), filepath)

  const stem = basename(filepath).replace(/\.md$/, '')
  const title = parsedTitle || meta.title || stem
  const tags = (meta.tags || '').toString().split(',').map(t => t.trim()).filter(Boolean)
  const pinned = meta.pinned === true || meta.pinned === 'true'

  const cleanBody = body
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
    const { meta, body } = parseFrontmatter(readFileSync(join(dir, f), 'utf-8'), join(dir, f))
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
    const { meta } = parseFrontmatter(readFileSync(join(dir, f), 'utf-8'), join(dir, f))
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

    // id 决定公开 URL（/gallery/<id>/），一旦发出去就是对外地址，而改名之后旧地址
    // 只能靠 301 站住——静态站没地方发 301。所以它必须**显式写出来**：
    // 目录名是文件名，相册 id 是网址，两者没有理由相同。
    //
    // 这里原来 fallback 到字面量 'test'，而 assets/vendor/images/albums/ 是平铺的
    // （没有子目录），于是每个走这条路的相册都会拿到同一个 id，并且因为
    // nuxt.config 的 crawlLinks 已经把它爬过一遍，https://blog.snowblock.top/gallery/test/
    // 就是一个真的已经被索引的公开地址。占位符不该固化进对外 URL。
    const id = dirName || meta.id
    if (!id) {
      throw new Error(
        '相册缺少 id。给 ' + (dirName ? join('assets/vendor/images/albums/', dirName) : 'assets/vendor/images/albums/') +
        '/meta.json 加一个 "id" 字段（它会成为 /gallery/<id>/ 这个公开地址）'
      )
    }

    return {
      id,
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
  return parseFrontmatter(readFileSync(filepath, 'utf-8'), filepath).body
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
  const albums = JSON.parse(readFileSync(join(ALBUMS_DIR, 'index.json'), 'utf-8'))
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
  // 相册详情页原来完全不在 sitemap 里：上面那七条固定页里有 /gallery/（列表页），
  // 却没有 /gallery/<id>/。而这些页面是 crawlLinks 能爬到的公开地址——爬到了却
  // 没告诉搜索引擎它存在，替代关系（将来改名）就无从建立，只能靠 301，而静态站
  // 没有地方发 301。
  albums.forEach(function (a) {
    if (!a || !a.id) return
    xml += '  <url><loc>' + SITE_URL + '/gallery/' + a.id + '/</loc></url>\n'
  })
  xml += '</urlset>\n'
  writeIfChanged(join(ROOT, 'public', 'sitemap.xml'), xml)
  console.log('  sitemap: ok')
}

// ============================
// BUILD: ROBOTS.TXT
// ============================
// sitemap 地址跟着 SITE_URL 走：换域名时不必再手工改这一份
function buildRobots() {
  const txt = 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n'
  writeIfChanged(join(ROOT, 'public', 'robots.txt'), txt)
  console.log('  robots: ok')
}

// ============================
// HELPERS
// ============================
function writeIfChanged(file, content) {
  try {
    const old = readFileSync(file, 'utf-8')
    if (old === content) return false
  } catch (e) {}
  writeFileSync(file, content, 'utf-8')
  return true
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
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
buildRobots()
console.log('Done.')
