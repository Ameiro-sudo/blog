// Copy large static directories into the Nuxt output (runs after `nuxt generate`).
//
// Why a filter: the repo still carries the pre-Nuxt (vanilla SPA) runtime in
// assets/js/*, plus vendored copies of libraries that the Nuxt build imports
// from node_modules instead (markdown-it / DOMPurify / highlight.js), plus an
// avatar file replaced by images/avatar.jpg. All of it was being published to
// gh-pages even though no page, payload or stylesheet references it.
//
// Guard: an entry is only pruned when the generated output really does not
// mention it. The scan deliberately skips the assets copy itself (assets refer
// to each other), so only pages / payloads / stylesheets can veto a prune.
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'fs'
import { join, dirname, relative, sep } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '.output', 'public')
const ASSETS = join(ROOT, 'assets')

const DROP = [
  'js',                                          // legacy vanilla-SPA runtime
  'vendor/dompurify@3.1.3',                      // npm dep of the Nuxt build
  'vendor/markdown-it@14.1.0',                   // npm dep of the Nuxt build
  'vendor/highlight.js@11.9.0/highlight.min.js', // npm dep of the Nuxt build
  'vendor/images/profile.webp',                  // superseded by avatar.jpg
]

const SCAN_EXT = /\.(html|json|js|css|xml|txt)$/i

if (!existsSync(OUT)) {
  console.error('[copy-static] .output/public missing - run `nuxt generate` first')
  process.exit(1)
}

function walk (dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

// Everything the generated site could legitimately use to reference an asset,
// excluding the asset tree itself.
function outputReferences (needle) {
  const hits = []
  for (const file of walk(OUT)) {
    const rel = relative(OUT, file).split(sep).join('/')
    if (rel.startsWith('assets/') || rel.startsWith('_nuxt/')) continue
    if (!SCAN_EXT.test(file)) continue
    if (readFileSync(file, 'utf-8').includes(needle)) hits.push(rel)
  }
  return hits
}

const sourceFiles = walk(ASSETS)
const dropped = []
const kept = []

for (const entry of DROP) {
  const abs = join(ASSETS, entry)
  if (!existsSync(abs)) continue

  const isDir = statSync(abs).isDirectory()
  const members = isDir
    ? sourceFiles.filter(f => {
        const rel = relative(ASSETS, f).split(sep).join('/')
        return rel === entry || rel.startsWith(entry + '/')
      })
    : [abs]

  const needles = isDir ? ['/assets/' + entry + '/'] : ['/assets/' + entry]
  const users = []
  for (const needle of needles) users.push(...outputReferences(needle))

  if (users.length) {
    kept.push('%s  <- referenced by %s' % (entry, users.slice(0, 3).join(', ')))
    continue
  }
  dropped.push({ entry, members })
}

// copy everything, then remove the dead members from the copy only
cpSync(ASSETS, join(OUT, 'assets'), { recursive: true })

let prunedFiles = 0
let prunedBytes = 0
for (const { entry, members } of dropped) {
  rmSync(join(OUT, 'assets', entry), { recursive: true, force: true })
  prunedFiles += members.length
  for (const file of members) prunedBytes += statSync(file).size
}

console.log('[copy-static] copied assets/')
if (prunedFiles) {
  const kb = (prunedBytes / 1024).toFixed(1)
  console.log('[copy-static] pruned %d dead file(s), %s KB not published: %s',
    prunedFiles, kb, dropped.map(d => d.entry).join(', '))
}
if (kept.length) {
  console.warn('[copy-static] WARNING: drop list entry still referenced, kept instead:')
  for (const line of kept) console.warn('  ' + line)
}
console.log('[copy-static] done')