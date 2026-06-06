import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const albumsDir = join(__dirname, '..', 'content', 'albums')
const baseUrl = 'https://cdn.jsdelivr.net/gh/ninasukiwww-png/my-images/blog'
// 如果后续变更 PicGo 路径或 CDN 域名，只改上面这行即可

function parseAlbumMD(filepath) {
  const text = readFileSync(filepath, 'utf-8')
  const lines = text.split('\n')
  const meta = {}
  let bodyStart = 0

  if (lines[0]?.trim() === '---') {
    let i = 1
    while (i < lines.length) {
      const line = lines[i].trim()
      if (line === '---') {
        bodyStart = i + 1
        break
      }
      const m = line.match(/^(\w+)\s*:\s*(.+)$/)
      if (m) meta[m[1]] = m[2].trim()
      i++
    }
  }

  const photos = lines.slice(bodyStart)
    .map(l => l.trim())
    .filter(Boolean)
    .map(f => ({ url: `${baseUrl}/${f}` }))

  const stem = filepath.split('/').pop().replace(/\.md$/, '')

  return {
    id: stem,
    title: meta.title || stem,
    description: meta.description || '',
    cover: meta.cover ? `${baseUrl}/${meta.cover}` : photos[0]?.url || '',
    date: meta.date || '',
    photos
  }
}

const files = readdirSync(albumsDir)
  .filter(f => f.endsWith('.md') && f !== 'index.json')
  .sort()

const albums = files.map(f => parseAlbumMD(join(albumsDir, f)))

writeFileSync(
  join(albumsDir, 'index.json'),
  JSON.stringify(albums, null, 2) + '\n',
  'utf-8'
)

console.log(`Generated albums/index.json with ${albums.length} albums`)
