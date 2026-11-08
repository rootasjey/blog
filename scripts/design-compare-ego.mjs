import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { Jimp, diff as diffImages } from 'jimp'

const options = new URL(import.meta.url).searchParams
const comparisonName = options.get('comparison')
const configPath = options.get('config')
const localUrl = options.get('localUrl')
const outputDir = options.get('outputDir')
const config = JSON.parse(await readFile(configPath, 'utf8'))
const comparison = config[comparisonName]
const task = await taskSpace(`corpinot-design-compare-${comparisonName}-${Date.now()}`)

const properties = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'color',
  'backgroundColor',
  'borderColor',
  'borderRadius',
  'transform',
  'width',
  'height',
  'gap',
  'margin',
  'padding',
]

try {
  await mkdir(outputDir, { recursive: true })
  const localPage = task.page('p1')
  await setViewport(localPage, comparison.viewport)
  await localPage.goto(localUrl)
  await waitForPage(localPage)
  await waitForMappedContent(localPage, comparison.elements, 'local')

  const referencePage = await task.newPage()
  await setViewport(referencePage, comparison.viewport)
  await referencePage.goto(comparison.referenceUrl)
  await waitForPage(referencePage)
  await waitForMappedContent(referencePage, comparison.elements, 'reference')

  const states = [await captureState({
    name: 'default',
    label: 'Default view',
    referencePage,
    localPage,
    comparison,
    outputDir,
  })]

  for (const hover of comparison.hoverStates || []) {
    states.push(await captureState({
      name: `hover-${slugify(hover.name)}`,
      label: hover.name,
      referencePage,
      localPage,
      comparison,
      hover,
      outputDir,
    }))
  }

  const reportData = {
    comparison: comparisonName,
    description: comparison.description,
    localUrl,
    referenceUrl: comparison.referenceUrl,
    viewport: comparison.viewport,
    generatedAt: new Date().toISOString(),
    states,
  }

  await writeFile(`${outputDir}/report.json`, JSON.stringify(reportData, null, 2))
  await writeFile(`${outputDir}/index.html`, renderReport(reportData))
  console.log(`Comparison report: ${outputDir}/index.html`)
  console.log(`Screenshots and metrics: ${outputDir}`)
} catch (error) {
  console.error(`Design comparison failed: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await task.finish({ keep: [] })
}

async function setViewport(page, viewport) {
  await page.cdp('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  })
}

async function waitForPage(page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(image => {
      if (image.complete) return Promise.resolve()
      return new Promise(resolve => {
        const timeout = setTimeout(resolve, 5_000)
        const done = () => {
          clearTimeout(timeout)
          resolve()
        }
        image.addEventListener('load', done, { once: true })
        image.addEventListener('error', done, { once: true })
      })
    }))
  })
}

async function waitForMappedContent(page, elements, side) {
  const selector = elements.find(element => element[side])?.[side]
  if (selector) await page.waitForSelector(selector, { state: 'visible', timeout: 10_000 })
  await page.evaluate(async () => {
    const transitions = document.getAnimations().filter((animation) => {
      const timing = animation.effect?.getComputedTiming()
      return animation.playState === 'running' && Number.isFinite(timing?.endTime)
    })
    let timeoutId
    await Promise.race([
      Promise.allSettled(transitions.map(animation => animation.finished)),
      new Promise(resolve => { timeoutId = setTimeout(resolve, 2_000) }),
    ])
    if (timeoutId) clearTimeout(timeoutId)
  })
}

async function captureState({ name, label, referencePage, localPage, comparison, hover, outputDir }) {
  if (hover) {
    await Promise.all([
      hoverTarget(referencePage, hover.reference),
      hoverTarget(localPage, hover.local),
    ])
    await Promise.all([
      referencePage.waitForTimeout(400),
      localPage.waitForTimeout(400),
    ])
  }

  const [referenceMetrics, localMetrics] = await Promise.all([
    inspectElements(referencePage, comparison.elements, 'reference'),
    inspectElements(localPage, comparison.elements, 'local'),
  ])
  const referenceImage = `${name}-core.png`
  const localImage = `${name}-local.png`
  const diffImage = `${name}-diff.png`
  const [referencePath, localPath] = [
    `${outputDir}/${referenceImage}`,
    `${outputDir}/${localImage}`,
  ]

  await Promise.all([
    referencePage.screenshot({ path: referencePath, fullPage: true }),
    localPage.screenshot({ path: localPath, fullPage: true }),
  ])
  const pixelDifference = await createDiff(referencePath, localPath, `${outputDir}/${diffImage}`)

  return {
    name,
    label,
    referenceImage,
    localImage,
    diffImage,
    pixelDifference,
    metrics: comparison.elements.map((element, index) => ({
      name: element.name,
      reference: referenceMetrics[index],
      local: localMetrics[index],
    })),
  }
}

async function hoverTarget(page, selector) {
  await page.waitForSelector(selector, { state: 'visible', timeout: 3_000 })
  await page.hover(selector)
}

async function inspectElements(page, elements, pageKey) {
  return page.evaluate(({ elements, properties, pageKey }) => elements.map(({ name, [pageKey]: selector }) => {
    const element = document.querySelector(selector)
    if (!element) return { name, selector, found: false }

    const style = getComputedStyle(element)
    const before = getComputedStyle(element, '::before')
    const rect = element.getBoundingClientRect()
    return {
      name,
      selector,
      found: true,
      text: element.textContent?.trim().slice(0, 100) || '',
      styles: Object.fromEntries(properties.map(property => [property, style[property]])),
      before: {
        content: before.content,
        backgroundColor: before.backgroundColor,
        borderColor: before.borderColor,
        borderRadius: before.borderRadius,
        transform: before.transform,
      },
      bounds: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    }
  }), { elements, properties, pageKey })
}

async function createDiff(referencePath, localPath, outputPath) {
  const [reference, local] = await Promise.all([Jimp.read(referencePath), Jimp.read(localPath)])
  const result = diffImages(reference, local, 0.1)
  await result.image.write(outputPath)
  return {
    percentage: Number((result.percent * 100).toFixed(2)),
    note: 'Pixel differences include copy and image mismatches; use this as a visual aid, not a pass/fail score.',
  }
}

function renderReport(data) {
  const states = data.states.map(state => `
    <section>
      <h2>${escapeHtml(state.label)}</h2>
      <p>Pixel difference: ${state.pixelDifference.percentage}% — ${escapeHtml(state.pixelDifference.note)}</p>
      <div class="screenshots">
        <figure><figcaption>Core</figcaption><img src="${state.referenceImage}" alt="Core ${escapeHtml(state.label)}"></figure>
        <figure><figcaption>Local</figcaption><img src="${state.localImage}" alt="Local ${escapeHtml(state.label)}"></figure>
        <figure><figcaption>Difference</figcaption><img src="${state.diffImage}" alt="Pixel difference ${escapeHtml(state.label)}"></figure>
      </div>
      ${renderMetrics(state.metrics)}
    </section>`).join('\n')

  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design comparison: ${escapeHtml(data.comparison)}</title>
<style>
  body{max-width:1440px;margin:40px auto;padding:0 24px;color:#202124;font:15px/1.5 system-ui,sans-serif}
  h1{font-size:24px}h2{margin-top:40px;font-size:19px}
  .screenshots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
  figure{min-width:0;margin:0}figcaption{margin-bottom:6px;font-weight:600}
  img{display:block;max-width:100%;height:auto;border:1px solid #ddd}
  table{width:100%;margin-top:16px;border-collapse:collapse}
  th,td{padding:8px;border:1px solid #ddd;text-align:left;vertical-align:top}
  th{background:#f5f5f5}code{overflow-wrap:anywhere}
  @media(max-width:800px){.screenshots{grid-template-columns:1fr}}
</style>
<h1>Design comparison: ${escapeHtml(data.comparison)}</h1>
<p>${escapeHtml(data.description || '')}</p>
<p>Viewport ${data.viewport.width} × ${data.viewport.height} · <a href="${escapeHtml(data.referenceUrl)}">Core reference</a> · <a href="${escapeHtml(data.localUrl)}">Local page</a></p>
${states}`
}

function renderMetrics(metrics) {
  const rows = metrics.flatMap(metric => [
    ...properties.map(property => ({ property, read: side => side.styles[property] })),
    ...['content', 'backgroundColor', 'borderColor', 'borderRadius', 'transform'].map(property => ({
      property: `::before ${property}`,
      read: side => side.before[property],
    })),
  ].map(({ property, read }) => {
    const referenceValue = metric.reference.found ? read(metric.reference) : 'Selector not found'
    const localValue = metric.local.found ? read(metric.local) : 'Selector not found'
    const equal = referenceValue === localValue
    return `<tr><th>${escapeHtml(metric.name)}<br><code>${escapeHtml(property)}</code></th><td>${escapeHtml(referenceValue)}</td><td>${escapeHtml(localValue)}</td><td>${equal ? 'Match' : 'Differs'}</td></tr>`
  }))
  return `<table><thead><tr><th>Element / property</th><th>Core</th><th>Local</th><th>Comparison</th></tr></thead><tbody>${rows.join('')}</tbody></table>`
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}
