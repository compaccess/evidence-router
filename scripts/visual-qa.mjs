import { chromium } from 'playwright'

const targetUrl = process.argv[2] ?? 'http://127.0.0.1:5173/evidence-router/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 })
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(targetUrl).origin })
const page = await context.newPage()

await page.goto(targetUrl, { waitUntil: 'networkidle' })
const title = await page.title()
const desktopPath = 'docs/design/evidence-router-render.png'
await page.screenshot({ path: desktopPath, fullPage: true })
const initialCost = await page.locator('.metric strong').first().textContent()
const wordsHeadingVisible = await page.getByText('4. Words per call', { exact: true }).isVisible()
const wordEstimateVisible = await page.getByText(/1\.33 tokens per word/).isVisible()
const inputWords = page.getByLabel('Input words')
const wordCostBefore = await page.locator('.metric strong').first().textContent()
await inputWords.fill('1500')
const wordCostAfter = await page.locator('.metric strong').first().textContent()
await inputWords.fill('750')
const priorityChart = page.locator('.pareto-chart')
const qualityPriority = page.locator('.priority-row').filter({ hasText: 'Quality' }).locator('input')
const costPriority = page.locator('.priority-row').filter({ hasText: 'Cost' }).locator('input')
const latencyPriority = page.locator('.priority-row').filter({ hasText: 'Latency' }).locator('input')
const initialPrioritySignature = await priorityChart.getAttribute('data-priority-signature')
const initialPriorityChart = await priorityChart.screenshot()

await qualityPriority.fill('60')
const qualityPrioritySignature = await priorityChart.getAttribute('data-priority-signature')
const qualityPriorityChart = await priorityChart.screenshot()
const adjustedQuality = await qualityPriority.inputValue()

await costPriority.fill('40')
const costPrioritySignature = await priorityChart.getAttribute('data-priority-signature')
const costPriorityChart = await priorityChart.screenshot()

await latencyPriority.fill('30')
const latencyPrioritySignature = await priorityChart.getAttribute('data-priority-signature')
const latencyPriorityChart = await priorityChart.screenshot()

await costPriority.fill('0')
await latencyPriority.fill('0')
await qualityPriority.fill('100')
const scaleInvariantChartBefore = await priorityChart.screenshot()
await qualityPriority.fill('50')
const scaleInvariantChartAfter = await priorityChart.screenshot()

const legendLabels = priorityChart.locator('.chart-legend text')
const alternativeLegendBox = await legendLabels.nth(0).boundingBox()
const selectedLegendDotBox = await priorityChart.locator('.chart-legend .selected-point').boundingBox()

await page.getByRole('button', { name: 'Research agent' }).click()
const researchCost = await page.locator('.metric strong').first().textContent()
await page.getByRole('button', { name: /Copy decision JSON/ }).click()
const copiedText = await page.getByRole('button', { name: /Copied/ }).textContent()
const copiedDecision = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))

await page.setViewportSize({ width: 390, height: 844 })
const mobilePath = 'docs/design/evidence-router-mobile.png'
await page.screenshot({ path: mobilePath, fullPage: true })
const horizontalOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
)

await browser.close()

if (title !== 'Evidence Router') throw new Error(`Unexpected title: ${title}`)
if (!wordsHeadingVisible) throw new Error('Words-per-call input is not visible')
if (!wordEstimateVisible) throw new Error('Word-to-token estimation note is not visible')
if (wordCostBefore === wordCostAfter) throw new Error('Changing input words did not update projected cost')
if (!('inputWordsPerCall' in copiedDecision.input) || 'inputTokensPerCall' in copiedDecision.input) throw new Error('Copied input does not use word-based fields')
if (copiedDecision.usageEstimation?.estimatedInputTokensPerCall !== 8000) throw new Error('Copied decision is missing the research preset token estimate')
if (!initialPrioritySignature) throw new Error('Priority visualization has no state signature')
if (initialPrioritySignature === qualityPrioritySignature) throw new Error('Priority visualization did not update after dragging Quality')
if (qualityPrioritySignature === costPrioritySignature) throw new Error('Priority visualization did not update after dragging Cost')
if (costPrioritySignature === latencyPrioritySignature) throw new Error('Priority visualization did not update after dragging Latency')
if (Buffer.compare(initialPriorityChart, qualityPriorityChart) === 0) throw new Error('Priority chart remained pixel-identical after dragging Quality')
if (Buffer.compare(qualityPriorityChart, costPriorityChart) === 0) throw new Error('Priority chart remained pixel-identical after dragging Cost')
if (Buffer.compare(costPriorityChart, latencyPriorityChart) === 0) throw new Error('Priority chart remained pixel-identical after dragging Latency')
if (Buffer.compare(scaleInvariantChartBefore, scaleInvariantChartAfter) === 0) throw new Error('Priority chart remained pixel-identical after a scale-invariant slider change')
if (adjustedQuality !== '60') throw new Error(`Quality slider did not reach 60: ${adjustedQuality}`)
if (!alternativeLegendBox || !selectedLegendDotBox) throw new Error('Priority chart legend is incomplete')
if (alternativeLegendBox.x + alternativeLegendBox.width + 4 > selectedLegendDotBox.x) throw new Error('Priority chart legend entries overlap')
if (initialCost === researchCost) throw new Error('Preset did not change the forecast')
if (!copiedText?.includes('Copied')) throw new Error('JSON copy did not reach its success state')
if (horizontalOverflow) throw new Error('Mobile viewport has horizontal overflow')

console.log(JSON.stringify({ targetUrl, title, initialCost, researchCost, wordsHeadingVisible, wordEstimateVisible, wordCostBefore, wordCostAfter, initialPrioritySignature, qualityPrioritySignature, costPrioritySignature, latencyPrioritySignature, adjustedQuality, copiedText, horizontalOverflow, desktopPath, mobilePath }, null, 2))
