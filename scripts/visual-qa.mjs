import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 })
const targetUrl = process.argv[2] ?? 'http://127.0.0.1:5173/evidence-router/'

await page.goto(targetUrl, { waitUntil: 'networkidle' })
const title = await page.title()
const desktopPath = 'docs/design/evidence-router-render.png'
await page.screenshot({ path: desktopPath, fullPage: true })
const initialCost = await page.locator('.metric strong').first().textContent()

await page.getByRole('button', { name: 'Research agent' }).click()
const researchCost = await page.locator('.metric strong').first().textContent()
await page.getByRole('button', { name: /Copy decision JSON/ }).click()
const copiedText = await page.getByRole('button', { name: /Copied/ }).textContent()

await page.setViewportSize({ width: 390, height: 844 })
const mobilePath = 'docs/design/evidence-router-mobile.png'
await page.screenshot({ path: mobilePath, fullPage: true })
const horizontalOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
)

await browser.close()

if (title !== 'Evidence Router') throw new Error(`Unexpected title: ${title}`)
if (initialCost === researchCost) throw new Error('Preset did not change the forecast')
if (!copiedText?.includes('Copied')) throw new Error('JSON copy did not reach its success state')
if (horizontalOverflow) throw new Error('Mobile viewport has horizontal overflow')

console.log(JSON.stringify({ targetUrl, title, initialCost, researchCost, copiedText, horizontalOverflow, desktopPath, mobilePath }, null, 2))
