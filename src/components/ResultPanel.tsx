import { Check, Copy, TriangleAlert } from 'lucide-react'
import type { ModelProfile, RoutingInput, RoutingResult } from '../types'
import { normalizePriorities } from '../lib/priorities'
import { ParetoChart } from './ParetoChart'
import { PortfolioBar } from './PortfolioBar'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function ResultPanel({ input, result, models, copied, onCopy }: { input: RoutingInput; result: RoutingResult; models: ModelProfile[]; copied: boolean; onCopy: () => void }) {
  const feasible = result.status === 'feasible'
  const priorities = normalizePriorities(input.priorities)
  return (
    <main className="result-panel" id="results">
      <section className="result-section portfolio-section">
        <div className="section-title-row">
          <div><h2>Recommended portfolio</h2><p>Weighted model allocation for routing</p></div>
          <span className={`status-label ${feasible ? 'ok' : 'warn'}`}>{feasible ? 'Constraints satisfied' : 'Closest available route'}</span>
        </div>
        <PortfolioBar allocations={result.allocations} models={models} />
      </section>

      <section className="metric-strip" aria-label="Forecast summary">
        <Metric label="Projected monthly cost" value={usd.format(result.forecast.monthlyCost)} note={`${usd.format(input.monthlyBudget)} budget`} />
        <Metric label="Expected pass rate" value={`${(result.forecast.passRate * 100).toFixed(1)}%`} note={`${Math.round(input.passRateFloor * 100)}% minimum`} />
        <Metric label="Savings vs. frontier" value={`${result.forecast.savingsPercent.toFixed(1)}%`} note={`${usd.format(result.baseline.monthlyCost)} baseline`} />
        <Metric label="Expected latency" value={`${(result.forecast.latencyMs / 1000).toFixed(2)} s`} note="Weighted average" />
      </section>

      <section className="constraint-strip">
        <h3>Constraint status</h3>
        <div className="constraint-items">
          <Constraint ok={result.violations.budget === 0} text={`Budget: ${usd.format(result.forecast.monthlyCost)} ≤ ${usd.format(input.monthlyBudget)}`} />
          <Constraint ok={result.violations.quality === 0} text={`Pass rate: ${(result.forecast.passRate * 100).toFixed(1)}% ≥ ${Math.round(input.passRateFloor * 100)}%`} />
          <Constraint ok={feasible} text={feasible ? 'All constraints satisfied' : `Shortfall: ${usd.format(result.violations.budget)} / ${(result.violations.quality * 100).toFixed(1)} pp`} />
        </div>
      </section>

      <section className="analysis-grid">
        <div>
          <h3>Decision frontier <span>(cost vs. pass rate)</span></h3>
          <p className="subcopy">The frontier shows available trade-offs. Priorities rerank the alternatives in real time.</p>
          <output className="optimization-state" aria-live="polite">
            Input Q/C/L {input.priorities.quality}/{input.priorities.cost}/{input.priorities.speed} · normalized to {Math.round(priorities.quality * 100)}%/{Math.round(priorities.cost * 100)}%/{Math.round(priorities.speed * 100)}%
          </output>
          <ParetoChart points={result.paretoFrontier} priorities={input.priorities} />
        </div>
        <div className="frontier-summary">
          <h3>Frontier summary</h3>
          <Summary label="Lowest frontier cost" value={usd.format(Math.min(...result.paretoFrontier.map((point) => point.monthlyCost)))} />
          <Summary label="Highest frontier quality" value={`${(Math.max(...result.paretoFrontier.map((point) => point.passRate)) * 100).toFixed(1)}%`} />
          <Summary label="Selected utility" value={result.utility.toFixed(3)} />
          <Summary label="Monthly calls" value={input.monthlyCalls.toLocaleString()} />
        </div>
      </section>

      <section className="evidence-section">
        <div className="section-title-row">
          <div><h3>Decision evidence</h3><p>Evidence ledger for every selected model</p></div>
          <button className="copy-button" onClick={onCopy}><Copy size={14} /> {copied ? 'Copied' : 'Copy decision JSON'}</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Model</th><th>Weight</th><th>Pass rate</th><th>Why it is in the route</th><th>Evidence source</th></tr></thead>
            <tbody>
              {result.evidence.map((row) => (
                <tr key={row.modelId}>
                  <td><strong>{row.modelName}</strong></td>
                  <td>{Math.round(row.decisionWeight * 100)}%</td>
                  <td>{(row.benchmarkPassRate * 100).toFixed(1)}%</td>
                  <td>{row.rationale}</td>
                  <td>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fixture-note">All prices, latency, and pass rates are synthetic fixtures for demonstrating the optimizer—not live provider claims.</p>
      </section>
    </main>
  )
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
}

function Constraint({ ok, text }: { ok: boolean; text: string }) {
  const Icon = ok ? Check : TriangleAlert
  return <div className={ok ? 'constraint ok' : 'constraint warn'}><Icon size={17} /><span>{text}</span></div>
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summary-row"><span>{label}</span><strong>{value}</strong></div>
}
