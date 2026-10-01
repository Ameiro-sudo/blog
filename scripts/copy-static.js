// Copy the static asset tree into the Nuxt output (runs after `nuxt generate`).
//
// Nuxt serves CSS / fonts / images under their original /assets/... URL, so they
// bypass Vite entirely and are copied verbatim. That keeps the published CSS
// byte-identical to the source, which is what made the Nuxt migration a visual
// no-op.
//
// Until 2026-10-01 this script also carried a DROP list that pruned the
// pre-Nuxt runtime (assets/js/*, the vendored markdown-it / DOMPurify /
// highlight.min.js copies, and the superseded profile.webp) out of the published
// output. Those files are now deleted from the source tree as well, so both the
// list and its reference scan have nothing left to act on.
import { cpSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '.output', 'public')

if (!existsSync(OUT)) {
  console.error('[copy-static] .output/public missing - run `nuxt generate` first')
  process.exit(1)
}

const assets = join(ROOT, 'assets')
if (existsSync(assets)) {
  cpSync(assets, join(OUT, 'assets'), { recursive: true })
  console.log('[copy-static] copied assets/')
}
console.log('[copy-static] done')
