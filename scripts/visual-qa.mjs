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
const monthlyVolume = page.getByLabel('Monthly volume, calls per month', { exact: true })
const inputWords = page.getByLabel('Input words per call', { exact: true })
const outputWords = page.getByLabel('Output words per call', { exact: true })
const monthlyBudget = page.getByLabel('Monthly budget, US dollars per month', { exact: true })
const minimumPassRate = page.getByLabel('Minimum pass rate, percent', { exact: true })
const accessibleUnitLabels = await Promise.all(
  [monthlyVolume, inputWords, outputWords, monthlyBudget, minimumPassRate]
    .map((locator) => locator.getAttribute('aria-label')),
)
const inputWordsMin = await inputWords.getAttribute('min')
const outputWordsMin = await outputWords.getAttribute('min')
const wordUnitsVisible = await page.getByText('words / call', { exact: true }).count()
const callsUnitVisible = await page.getByText('calls / month', { exact: true }).isVisible()
const percentUnitVisible = await page.getByText('%', { exact: true }).isVisible()
const headingStyles = await page.locator('.field-index').evaluateAll((headings) =>
  headings
    .filter((heading) => /^(4|5|6)\./.test(heading.textContent ?? ''))
    .map((heading) => {
      const style = getComputedStyle(heading)
      return { text: heading.textContent, color: style.color, fontWeight: style.fontWeight }
    }),
)
const wordCostBefore = await page.locator('.metric strong').first().textContent()
await inputWords.fill('0')
const invalidWordState = await inputWords.getAttribute('aria-invalid')
const wordCostWhileInvalid = await page.locator('.metric strong').first().textContent()
const invalidWordMessage = await page.getByText('Use 1 or more.', { exact: true }).textContent()
await inputWords.blur()
const restoredInputWords = await inputWords.inputValue()
await inputWords.fill('15000')
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
if (accessibleUnitLabels.some((label) => !label)) throw new Error(`Numeric input units are missing from accessible labels: ${JSON.stringify(accessibleUnitLabels)}`)
if (inputWordsMin !== '1' || outputWordsMin !== '1') throw new Error('Word inputs no longer preserve the positive-value constraint')
if (wordUnitsVisible !== 2 || !callsUnitVisible || !percentUnitVisible) throw new Error('Numeric input units are not visible')
if (headingStyles.length !== 3 || headingStyles.some((style) => style.color !== headingStyles[0].color || style.fontWeight !== headingStyles[0].fontWeight)) throw new Error(`Constraint input headings have inconsistent hierarchy: ${JSON.stringify(headingStyles)}`)
if (invalidWordState !== 'true') throw new Error('Out-of-range word input is not marked invalid')
if (wordCostBefore !== wordCostWhileInvalid) throw new Error('Invalid word input changed the route forecast')
if (invalidWordMessage !== 'Use 1 or more.') throw new Error('Out-of-range word input has no actionable error')
if (restoredInputWords !== '750') throw new Error(`Invalid word input did not restore the last valid value: ${restoredInputWords}`)
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

console.log(JSON.stringify({ targetUrl, title, initialCost, researchCost, wordsHeadingVisible, wordEstimateVisible, accessibleUnitLabels, wordUnitsVisible, callsUnitVisible, percentUnitVisible, headingStyles, invalidWordState, invalidWordMessage, restoredInputWords, wordCostBefore, wordCostWhileInvalid, wordCostAfter, initialPrioritySignature, qualityPrioritySignature, costPrioritySignature, latencyPrioritySignature, adjustedQuality, copiedText, horizontalOverflow, desktopPath, mobilePath }, null, 2))
