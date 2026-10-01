// Headless visual/typography check for the built blog output.
//
// Verifies that the scoped title elements really render in ZCOOL KuaiLe (not a
// fallback), captures screenshots for eyeballing, and reports the measured
// width of each title so a font swap cannot silently truncate a heading.
//
// Usage: node scripts/visual-check.cjs [baseUrl]
// Requires: a static server on the base URL (node scripts/serve-dist.cjs) and
// playwright-core reachable through NODE_PATH.
const { chromium } = require('playwright-core')
const fs = require('fs')
const path = require('path')

const BASE = process.argv[2] || 'http://127.0.0.1:4173'
const EXE = process.env.CHROME_EXE || path.join(
  process.env.LOCALAPPDATA, 'ms-playwright', 'chromium-1234', 'chrome-win64', 'chrome.exe'
)
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
      return {
        cls: String(el.className || el.tagName.toLowerCase()),
        text: (el.textContent || '').trim().slice(0, 40),
        family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
        fontSize: cs.fontSize,
        w: Math.round(box.width),
        h: Math.round(box.height),
        overflowX: el.scrollWidth > Math.ceil(box.width) + 1,
      }
    })
  }, TARGETS)
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  if (!fs.existsSync(EXE)) throw new Error('chromium not found: ' + EXE)
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
        ' w=' + r.w + ' h=' + r.h + (r.overflowX ? '  OVERFLOW' : ''))
    }
  }
  console.log('')
  console.log('screenshots: ' + OUT)
  console.log(bad ? 'RESULT: FAIL (' + bad + ')' : 'RESULT: PASS')
  process.exit(bad ? 1 : 0)
})().catch((err) => { console.error(err); process.exit(2) })