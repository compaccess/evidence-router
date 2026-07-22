import type { ParetoPoint, Priorities } from '../types'
import { normalizePriorities } from '../lib/priorities'

export function ParetoChart({ points, priorities }: { points: ParetoPoint[]; priorities: Priorities }) {
  const width = 620
  const height = 260
  const pad = { left: 52, right: 18, top: 64, bottom: 40 }
  const normalized = normalizePriorities(priorities)
  const percentages = {
    quality: Math.round(normalized.quality * 100),
    cost: Math.round(normalized.cost * 100),
    speed: Math.round(normalized.speed * 100),
  }
  const prioritySignature = `${priorities.quality}-${priorities.cost}-${priorities.speed}`
  const frontier = points.filter((point) => point.onFrontier)
  const selected = points.find((point) => point.selected)
  const costs = points.map((point) => point.monthlyCost)
  const rates = points.map((point) => point.passRate)
  const utilities = points.map((point) => point.utility)
  const minUtility = Math.min(...utilities)
  const maxUtility = Math.max(...utilities)
  const minCost = Math.min(...costs) * 0.9
  const maxCost = Math.max(...costs) * 1.05
  const minRate = Math.max(0.6, Math.min(...rates) - 0.03)
  const maxRate = Math.min(1, Math.max(...rates) + 0.02)
  const x = (cost: number) => pad.left + ((cost - minCost) / (maxCost - minCost || 1)) * (width - pad.left - pad.right)
  const y = (rate: number) => pad.top + (1 - (rate - minRate) / (maxRate - minRate || 1)) * (height - pad.top - pad.bottom)
  const path = frontier.map((point) => `${x(point.monthlyCost)},${y(point.passRate)}`).join(' ')
  const utilityStrength = (utility: number) => 0.3 + ((utility - minUtility) / (maxUtility - minUtility || 1)) * 0.7
  const mixWidth = 214
  const mixX = pad.left
  const qualityWidth = mixWidth * normalized.quality
  const costWidth = mixWidth * normalized.cost
  const selectedX = selected ? x(selected.monthlyCost) : 0
  const selectedY = selected ? y(selected.passRate) : 0
  const selectedLabelX = Math.min(selectedX + 10, width - pad.right - 42)
  const selectedLabelY = Math.max(selectedY - 10, pad.top + 12)

  return (
    <svg
      className="pareto-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Cost versus pass-rate decision frontier. Input weights: Quality ${priorities.quality}, Cost ${priorities.cost}, Latency ${priorities.speed}. Normalized priorities: Quality ${percentages.quality}%, Cost ${percentages.cost}%, Latency ${percentages.speed}%.`}
      data-priority-signature={prioritySignature}
    >
      <g className="priority-mix" aria-label="Normalized decision priorities">
        <text x={mixX} y="13" className="chart-label priority-title">LIVE DECISION MIX</text>
        <rect x={mixX} y="22" width={mixWidth} height="10" rx="2" className="priority-track" />
        <rect x={mixX} y="22" width={qualityWidth} height="10" rx="2" className="priority-quality" />
        <rect x={mixX + qualityWidth} y="22" width={costWidth} height="10" className="priority-cost" />
        <rect x={mixX + qualityWidth + costWidth} y="22" width={mixWidth * normalized.speed} height="10" rx="2" className="priority-speed" />
        <text x={mixX} y="46" className="chart-label priority-values">
          INPUT {priorities.quality}/{priorities.cost}/{priorities.speed} · MIX Q {percentages.quality}% · C {percentages.cost}% · L {percentages.speed}%
        </text>
        <g transform={`translate(${width - pad.right - 160} 22)`} className="chart-legend">
          <circle cx="4" cy="5" r="4" className="frontier-point" />
          <text x="13" y="8" className="chart-label">ranked route</text>
          <circle cx="92" cy="5" r="6" className="selected-point" />
          <text x="104" y="8" className="chart-label">selected</text>
        </g>
      </g>
      {[0, 0.5, 1].map((fraction) => {
        const lineY = pad.top + fraction * (height - pad.top - pad.bottom)
        const label = maxRate - fraction * (maxRate - minRate)
        return (
          <g key={fraction}>
            <line x1={pad.left} x2={width - pad.right} y1={lineY} y2={lineY} className="chart-grid" />
            <text x={pad.left - 10} y={lineY + 4} textAnchor="end" className="chart-label">{Math.round(label * 100)}%</text>
          </g>
        )
      })}
      <line x1={pad.left} x2={pad.left} y1={pad.top} y2={height - pad.bottom} className="chart-axis" />
      <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className="chart-axis" />
      <polyline points={path} fill="none" className="frontier-line" />
      {frontier.filter((point) => !point.selected).map((point, index) => (
        <circle
          key={`${point.monthlyCost}-${point.passRate}-${index}`}
          cx={x(point.monthlyCost)}
          cy={y(point.passRate)}
          r={3 + utilityStrength(point.utility) * 2}
          opacity={utilityStrength(point.utility)}
          className="frontier-point"
          data-utility={point.utility.toFixed(6)}
        />
      ))}
      {selected ? (
        <g className="selected-route" data-on-frontier={selected.onFrontier ? 'true' : 'false'}>
          <circle cx={selectedX} cy={selectedY} r="8" className="selected-halo" />
          <circle cx={selectedX} cy={selectedY} r="5" className="selected-point" data-utility={selected.utility.toFixed(6)} />
          <text x={selectedLabelX} y={selectedLabelY} className="selected-label">SELECTED</text>
        </g>
      ) : null}
      <text x={(pad.left + width - pad.right) / 2} y={height - 8} textAnchor="middle" className="chart-label">Monthly cost (USD)</text>
      <text transform={`translate(14 ${(pad.top + height - pad.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="chart-label">Pass rate</text>
      <text x={pad.left} y={height - pad.bottom + 20} className="chart-label">${Math.round(minCost)}</text>
      <text x={width - pad.right} y={height - pad.bottom + 20} textAnchor="end" className="chart-label">${Math.round(maxCost)}</text>
    </svg>
  )
}
