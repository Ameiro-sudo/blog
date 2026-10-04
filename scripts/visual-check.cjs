// Headless visual/typography check for the built blog output.
//
// Verifies that the scoped title elements really render in ZCOOL KuaiLe (not a
// fallback), captures screenshots for eyeballing, and reports the measured
// width of each title so a font swap cannot silently truncate a heading.
//
// It doubles as a CI gate: exit 0 = all good, 1 = something is BAD, 2 = the tool
// itself could not run (no browser). It was written long before it ran in CI and
// had never been run against the current CSS — the first CI run flagged six
// "OVERFLOW"s that were all the same element and all false positives, see
// inspect() below.
//
// Usage:
//   node scripts/serve-dist.cjs      # one terminal, serves .output/public on :4173
//   node scripts/visual-check.cjs    # another terminal
//
// Browser resolution, in order:
//   1. $CHROME_EXE
//   2. playwright-core's own registry (chromium.executablePath())
//   3. an installed Chrome / Edge / Brave
//   4. a scan of the ms-playwright browser cache
// The cache comes last on purpose: its `chromium_headless_shell-*` build is a
// stripped-down binary that crashes on launch when driven through a plain
// executablePath (it wants Playwright's own launch pipeline), while a full
// browser build is picked up by step 2 anyway.
const { chromium } = require('playwright-core')
const fs = require('fs')
const os = require('os')
const path = require('path')

const BASE = process.argv[2] || 'http://127.0.0.1:4173'
const OUT = path.join(process.cwd(), '.visual-check')

const PAGES = [
  ['home', '/'],
  ['posts', '/posts/'],
  ['post', '/posts/post8/'],
  ['gallery', '/gallery/'],
  ['moments', '/moments/'],
  ['archive', '/archive/'],
]

const TARGETS = '.site-name, .article-title, .page-header h1, .gallery-header h1, .module-header h1'

function systemBrowsers () {
  const home = process.env.LOCALAPPDATA || os.homedir()
  if (process.platform === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files'
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
    return [
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(home, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    ]
  }
  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ]
  }
  return ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/microsoft-edge']
}

function cacheRoot () {
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || os.homedir(), 'ms-playwright')
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'ms-playwright')
}

function wantedBinaries () {
  if (process.platform === 'win32') return ['chrome.exe', 'chrome-headless-shell.exe', 'headless_shell.exe']
  if (process.platform === 'darwin') {
    return ['Chromium', 'chrome-headless-shell', 'headless_shell', 'Google Chrome for Testing']
  }
  return ['chrome', 'chrome-headless-shell', 'headless_shell']
}

function walk (dir, names, depth = 0) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch (e) { return null }
  for (const name of names) {
    const hit = path.join(dir, name)
    if (fs.existsSync(hit) && fs.statSync(hit).isFile()) return hit
  }
  if (depth >= 3) return null
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const found = walk(path.join(dir, entry.name), names, depth + 1)
    if (found) return found
  }
  return null
}

function findBrowser () {
  if (process.env.CHROME_EXE && fs.existsSync(process.env.CHROME_EXE)) return process.env.CHROME_EXE

  try {
    const registered = chromium.executablePath()
    if (registered && fs.existsSync(registered)) return registered
  } catch (e) { /* registry not populated yet */ }

  for (const candidate of systemBrowsers()) {
    if (fs.existsSync(candidate)) return candidate
  }

  const root = cacheRoot()
  let builds = []
  try { builds = fs.readdirSync(root, { withFileTypes: true }) } catch (e) { return null }
  // `chromium-*` (full build) before `chromium_headless_shell-*`
  const dirs = builds
    .filter((e) => e.isDirectory() && e.name.startsWith('chromium'))
    .sort((a, b) => Number(a.name.startsWith('chromium_headless_shell')) - Number(b.name.startsWith('chromium_headless_shell')))
  for (const dir of dirs) {
    const found = walk(path.join(root, dir.name), wantedBinaries())
    if (found) return found
  }
  return null
}

const EXE = findBrowser()

async function settle (page) {
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => !document.querySelector('#loader'), null, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(400)
}

async function inspect (page) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((el) => {
      const cs = getComputedStyle(el)
      const box = el.getBoundingClientRect()
      // 用 Range 量文字真正占了多宽。scrollWidth 量的是内容盒 + 内边距，
      // 它超了不等于文字被吃掉——实测 .site-name：文字宽 149.13 == 盒子宽
      // 149.13、overflow-x 是 visible，scrollWidth 却报 159（多的 10px 是内边距）。
      // 按 scrollWidth 判会对着一个根本没被裁的元素报 OVERFLOW，gate 天天红，
      // 而红惯了的 gate 等于没有 gate。
      const range = document.createRange()
      range.selectNodeContents(el)
      const textW = Math.round(range.getBoundingClientRect().width * 100) / 100
      // 能不能裁剪：overflow-x 是 visible 且没有 text-overflow:ellipsis 时，
      // 这个元素在物理上就不可能把标题切掉。
      const canClip = cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis'
      const style = getComputedStyle(el)
      const padL = parseFloat(style.paddingLeft) || 0
      const padR = parseFloat(style.paddingRight) || 0
      const contentW = el.clientWidth - padL - padR
      return {
        cls: String(el.className || el.tagName.toLowerCase()),
        text: (el.textContent || '').trim().slice(0, 40),
        family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
        fontSize: cs.fontSize,
        w: Math.round(box.width),
        h: Math.round(box.height),
        textW,
        contentW,
        canClip,
        // 只有「能裁 + 文字确实比内容盒宽」才算被吃掉
        overflowX: canClip && textW > contentW + 1
      }
    })
  }, TARGETS)
}

;(async () => {
  if (!EXE) {
    console.error('[visual-check] no Chromium build found (looked in ' + cacheRoot() + ')\n' +
      '[visual-check] install one with:  npx playwright-core install chromium\n' +
      '[visual-check] or point CHROME_EXE at an existing Chrome/Chromium executable')
    process.exit(2)
  }
  console.log('[visual-check] browser: ' + EXE)

  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: EXE, headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const report = []

  for (const [name, url] of PAGES) {
    const page = await context.newPage()
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded' })
    await settle(page)
    const rows = await inspect(page)
    report.push({ page: name, url, rows })
    await page.screenshot({ path: path.join(OUT, name + '-light.png') })

    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await page.waitForTimeout(250)
    await page.screenshot({ path: path.join(OUT, name + '-dark.png') })
    await page.close()
  }

  await browser.close()

  let bad = 0
  for (const { page, url, rows } of report) {
    console.log('== ' + page + '  ' + url)
    if (!rows.length) { console.log('   (no title element found)'); bad++; continue }
    for (const r of rows) {
      const ok = r.family === 'ZCOOL KuaiLe' && !r.overflowX
      if (!ok) bad++
      console.log('   ' + (ok ? 'OK  ' : 'BAD ') + r.cls.slice(0, 16).padEnd(17) +
        JSON.stringify(r.text).padEnd(30) + ' ' + r.family + ' ' + r.fontSize +
        ' w=' + r.w + ' h=' + r.h + ' text=' + r.textW + '/' + r.contentW +
        (r.overflowX ? '  TRUNCATED' : ''))
    }
  }
  console.log('')
  console.log('screenshots: ' + OUT)
  console.log(bad ? 'RESULT: FAIL (' + bad + ')' : 'RESULT: PASS')
  process.exit(bad ? 1 : 0)
})().catch((err) => { console.error(err); process.exit(2) })
