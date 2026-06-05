import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const postsDir = join(__dirname, 'posts')

function parseMD(filepath) {
  const text = readFileSync(filepath, 'utf-8')
  const lines = text.split('\n')
  const meta = {}
  let title = ''
  let contentStart = 0

  if (lines[0]?.startsWith('# ')) {
    title = lines[0].slice(2).trim()
    contentStart = 1
  }

  let i = 1
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line === '---') {
      contentStart = i + 1
      break
    }
    const m = line.match(/^(\w+)\s*:\s*(.+)$/)
    if (m) meta[m[1]] = m[2].trim()
    i++
  }

  const stem = filepath.split('/').pop().replace(/\.md$/, '')
  const tags = (meta.tags || '').split(',').map(t => t.trim()).filter(Boolean)

  return {
    id: stem,
    title: title || stem,
    date: meta.date || '',
    time: meta.time || '',
    readTime: meta.readTime || '',
    tags,
    file: stem + '.md'
  }
}

const files = readdirSync(postsDir)
  .filter(f => f.endsWith('.md') && f !== 'index.json')
  .sort()

const posts = files.map(f => parseMD(join(postsDir, f)))

writeFileSync(
  join(postsDir, 'index.json'),
  JSON.stringify(posts, null, 2) + '\n',
  'utf-8'
)

console.log(`Generated posts/index.json with ${posts.length} posts`)
