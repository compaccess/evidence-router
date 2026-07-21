import type { ParetoPoint } from '../types'

export function ParetoChart({ points }: { points: ParetoPoint[] }) {
  const width = 620
  const height = 230
  const pad = { left: 52, right: 18, top: 20, bottom: 40 }
  const costs = points.map((point) => point.monthlyCost)
  const rates = points.map((point) => point.passRate)
  const minCost = Math.min(...costs) * 0.9
  const maxCost = Math.max(...costs) * 1.05
  const minRate = Math.max(0.6, Math.min(...rates) - 0.03)
  const maxRate = Math.min(1, Math.max(...rates) + 0.02)
  const x = (cost: number) => pad.left + ((cost - minCost) / (maxCost - minCost || 1)) * (width - pad.left - pad.right)
  const y = (rate: number) => pad.top + (1 - (rate - minRate) / (maxRate - minRate || 1)) * (height - pad.top - pad.bottom)
  const path = points.map((point) => `${x(point.monthlyCost)},${y(point.passRate)}`).join(' ')

  return (
    <svg className="pareto-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cost versus pass-rate Pareto frontier">
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
      {points.map((point, index) => (
        <circle
          key={`${point.monthlyCost}-${point.passRate}-${index}`}
          cx={x(point.monthlyCost)}
          cy={y(point.passRate)}
          r={point.selected ? 7 : 4}
          className={point.selected ? 'selected-point' : 'frontier-point'}
        />
      ))}
      <text x={(pad.left + width - pad.right) / 2} y={height - 8} textAnchor="middle" className="chart-label">Monthly cost (USD)</text>
      <text transform={`translate(14 ${(pad.top + height - pad.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="chart-label">Pass rate</text>
      <text x={pad.left} y={height - pad.bottom + 20} className="chart-label">${Math.round(minCost)}</text>
      <text x={width - pad.right} y={height - pad.bottom + 20} textAnchor="end" className="chart-label">${Math.round(maxCost)}</text>
    </svg>
  )
}
