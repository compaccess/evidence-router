import { useMemo, useState } from 'react'
import { InputPanel } from './components/InputPanel'
import { ResultPanel } from './components/ResultPanel'
import { MODEL_CATALOG } from './data/models'
import { PRESETS } from './data/presets'
import { optimizeRoute } from './lib/router'
import { buildUsageEstimation } from './lib/usage'
import type { RoutingInput } from './types'

export default function App() {
  const [input, setInput] = useState<RoutingInput>(PRESETS[0].input)
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].id)
  const [copied, setCopied] = useState(false)
  const result = useMemo(() => optimizeRoute(input, MODEL_CATALOG), [input])

  const usePreset = (id: string) => {
    const preset = PRESETS.find((item) => item.id === id)
    if (!preset) return
    setSelectedPreset(id)
    setInput(structuredClone(preset.input))
  }

  const copyDecision = async () => {
    await navigator.clipboard.writeText(JSON.stringify({ input, usageEstimation: buildUsageEstimation(input), recommendation: result }, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><strong>Evidence Router</strong><span>Route every call with evidence.</span></div>
        <nav>
          <a href="#method">Method</a>
          <a href="https://github.com/ktwu01/evidence-router" target="_blank" rel="noreferrer"><GitHubMark /> GitHub</a>
        </nav>
      </header>
      <div className="workspace">
        <InputPanel input={input} setInput={setInput} selectedPreset={selectedPreset} onPreset={usePreset} onOptimize={() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })} />
        <ResultPanel input={input} result={result} models={MODEL_CATALOG} copied={copied} onCopy={copyDecision} />
      </div>
      <footer id="method">
        <strong>Method</strong>
        <span>Enumerates two-model portfolios in 10% increments, filters by hard budget and quality constraints, then ranks feasible routes by normalized quality, savings, and speed utility.</span>
      </footer>
    </div>
  )
}

function GitHubMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" role="img" aria-label="GitHub" fill="currentColor">
      <path d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.2c-3.22.7-3.9-1.36-3.9-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.41-1.26.74-1.55-2.57-.29-5.28-1.28-5.28-5.72 0-1.26.45-2.3 1.2-3.1-.12-.3-.52-1.47.11-3.06 0 0 .98-.31 3.16 1.18a10.96 10.96 0 0 1 5.76 0c2.18-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.06.74.8 1.2 1.84 1.2 3.1 0 4.45-2.72 5.42-5.3 5.71.42.36.79 1.07.79 2.16v3.21c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  )
}
