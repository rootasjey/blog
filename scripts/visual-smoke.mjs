import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer'

const baseUrl = process.env.VISUAL_BASE_URL || 'http://localhost:3000'
const cookieHeader = process.env.VISUAL_COOKIE_HEADER
const outputDir = path.join(os.tmpdir(), `corpinot-visual-${Date.now()}`)

const routes = [
  { name: 'home', path: '/fr/', selector: '.site-intro' },
  { name: 'posts', path: '/fr/posts', selector: '.site-post-index' },
  { name: 'projects', path: '/fr/projects', selector: '.site-project-index' },
  { name: 'tags', path: '/fr/tags', selector: '.site-tags-directory' },
  { name: 'article', path: '/fr/posts/2025-in-review', selector: '.site-post.site-dynamic-post' },
]

const macChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const viewports = [
  { name: 'desktop', width: 1728, height: 980, theme: 'dark' },
  { name: 'desktop-light', width: 1728, height: 980, theme: 'light' },
  { name: 'mobile', width: 390, height: 844, theme: 'dark' },
]

function validateBaseUrl(value) {
  const url = new URL(value)
  const localHosts = ['localhost', '127.0.0.1', '[::1]']

  assert.ok(localHosts.includes(url.hostname), 'VISUAL_BASE_URL must point to localhost')
  return url.origin
}

async function inspectPage(page, selector) {
  return page.evaluate((rootSelector) => {
    const root = document.querySelector(rootSelector)
    const bodyStyle = getComputedStyle(document.body)
    const rootStyle = getComputedStyle(document.documentElement)
    const desktopHeader = document.querySelector('.site-header-desktop')
    const headerNavigation = document.querySelector('.site-header-nav')
    const rootRect = root?.getBoundingClientRect()
    const themeBackground = rootStyle.getPropertyValue('--site-color-background').trim()

    return {
      rootFound: Boolean(root),
      rootWidth: rootRect?.width || 0,
      rootHeight: rootRect?.height || 0,
      bodyBackground: bodyStyle.backgroundColor,
      bodyMargin: bodyStyle.margin,
      themeBackground,
      bodyFontSize: bodyStyle.fontSize,
      desktopHeaderDisplay: desktopHeader ? getComputedStyle(desktopHeader).display : null,
      navigationDisplay: headerNavigation ? getComputedStyle(headerNavigation).display : null,
      firstNavigationLinkDecoration: headerNavigation?.querySelector('a')
        ? getComputedStyle(headerNavigation.querySelector('a')).textDecorationLine
        : null,
      headingFontSize: root?.querySelector('h1')
        ? getComputedStyle(root.querySelector('h1')).fontSize
        : null,
    }
  }, selector)
}

async function checkRoute(page, route, viewport) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
  })

  const response = await page.goto(new URL(route.path, baseUrl), {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })

  assert.ok(response, `${route.name}: navigation returned no response`)
  assert.equal(response.status(), 200, `${route.name}: unexpected HTTP status`)

  await page.waitForSelector(route.selector, { timeout: 15_000 })
  await page.evaluate((theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, viewport.theme)

  const styles = await inspectPage(page, route.selector)
  assert.ok(styles.rootFound, `${route.name}: expected page content is missing`)
  assert.ok(styles.rootWidth > 0, `${route.name}: page content has no width`)
  assert.ok(styles.rootHeight > 0, `${route.name}: page content has no height`)
  assert.equal(styles.bodyFontSize, '16px', `${route.name}: global body typography changed`)
  assert.equal(styles.bodyMargin, '0px', `${route.name}: global stylesheet is missing or overridden`)
  assert.notEqual(styles.bodyBackground, 'rgba(0, 0, 0, 0)', `${route.name}: body background is transparent`)
  assert.ok(styles.themeBackground, `${route.name}: theme background token is missing`)

  if (viewport.width > 1023) {
    assert.equal(styles.desktopHeaderDisplay, 'grid', `${route.name}: desktop masthead layout is missing`)
    assert.equal(styles.navigationDisplay, 'flex', `${route.name}: header navigation layout is missing`)
    assert.equal(styles.firstNavigationLinkDecoration, 'none', `${route.name}: header link styling is missing`)
  }

  if (styles.headingFontSize) {
    assert.ok(
      Number.parseFloat(styles.headingFontSize) >= 18,
      `${route.name}: page heading is unexpectedly small (${styles.headingFontSize})`,
    )
  }

  const screenshotPath = path.join(outputDir, `${route.name}-${viewport.name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })

  return { route: route.path, viewport: viewport.name, styles, screenshotPath }
}

async function checkEditor(page, viewport) {
  if (!cookieHeader) {
    return { skipped: true, reason: 'Set VISUAL_COOKIE_HEADER to check authenticated editor routes.' }
  }

  await page.setExtraHTTPHeaders({ Cookie: cookieHeader })
  const route = { name: 'editor', path: '/fr/posts/edit/into-the-darkness' }
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 })
  const response = await page.goto(new URL(route.path, baseUrl), {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })

  assert.ok(response, 'editor: navigation returned no response')
  assert.equal(response.status(), 200, 'editor: unexpected HTTP status')

  const editor = await page.waitForSelector('.site-editor-canvas .ProseMirror', { timeout: 15_000 })
  assert.ok(editor, 'editor: authenticated editor is not available')

  const border = await page.$eval('.site-editor-canvas .ProseMirror', (element) => getComputedStyle(element).borderWidth)
  assert.equal(border, '0px', 'editor: text canvas border is visible')

  const screenshotPath = path.join(outputDir, 'editor-desktop-dark.png')
  await page.screenshot({ path: screenshotPath, fullPage: true })
  return { route: route.path, viewport: viewport.name, editorBorder: border, screenshotPath }
}

const origin = validateBaseUrl(baseUrl)
await mkdir(outputDir, { recursive: true })

const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  || (existsSync(macChromePath) ? macChromePath : puppeteer.executablePath())

assert.ok(existsSync(executablePath), 'Install Puppeteer Chrome or set PUPPETEER_EXECUTABLE_PATH')

const browser = await puppeteer.launch({ headless: true, executablePath })

try {
  const page = await browser.newPage()
  const results = []

  for (const viewport of viewports) {
    for (const route of routes) {
      results.push(await checkRoute(page, route, viewport))
    }
  }

  const editorResult = await checkEditor(page, viewports[0])
  results.push({ route: '/fr/posts/edit/into-the-darkness', ...editorResult })

  console.log(JSON.stringify({ origin, outputDir, results }, null, 2))
} finally {
  await browser.close()
}
