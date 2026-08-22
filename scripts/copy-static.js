// 将大体积静态目录并入 Nuxt 产物（nuxt generate 之后执行）
import { cpSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '.output', 'public')

if (!existsSync(OUT)) {
  console.error('[copy-static] .output/public 不存在 —— 请先运行 nuxt generate')
  process.exit(1)
}

for (const dir of ['assets']) {
  const src = join(ROOT, dir)
  if (existsSync(src)) {
    cpSync(src, join(OUT, dir), { recursive: true })
    console.log('[copy-static] copied ' + dir + '/')
  }
}
console.log('[copy-static] done')
