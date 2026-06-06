import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const POSTS_DIR = join(ROOT, 'content', 'posts')
const ALBUMS_DIR = join(ROOT, 'content', 'albums')
const CDN_BASE = 'https://raw.githubusercontent.com/ninasukiwww-png/my-images/main/blog'

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

  return {
    id: stem,
    title,
    date: meta.date || '',
    time: meta.time || '',
    readTime: meta.readTime || '',
    tags,
    pinned,
    file: stem + '.md',
  }
}

function parseAlbum(filepath) {
  const text = readFileSync(filepath, 'utf-8')
  const { meta, body } = parseFrontmatter(text)
  const stem = filepath.split('/').pop().replace(/\.md$/, '')

  const photos = body.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(f => ({ url: `${CDN_BASE}/${f}` }))

  return {
    id: stem,
    title: meta.title || stem,
    description: meta.description || '',
    cover: meta.cover ? `${CDN_BASE}/${meta.cover}` : photos[0]?.url || '',
    date: meta.date || '',
    photos,
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
  const files = readdirSync(ALBUMS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'index.json' && !f.startsWith('_'))
    .sort()

  const albums = files.map(f => parseAlbum(join(ALBUMS_DIR, f)))

  writeFileSync(
    join(ALBUMS_DIR, 'index.json'),
    JSON.stringify(albums, null, 2) + '\n',
    'utf-8'
  )
  console.log(`  albums: ${albums.length} albums`)
}

console.log('Building indexes...')
buildPosts()
buildAlbums()
console.log('Done.')
