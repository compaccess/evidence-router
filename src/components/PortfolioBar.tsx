import type { Allocation, ModelProfile } from '../types'

const COLORS = ['#155eef', '#21b8b5', '#39a852', '#7047eb']

export function PortfolioBar({ allocations, models }: { allocations: Allocation[]; models: ModelProfile[] }) {
  const catalog = new Map(models.map((model) => [model.id, model]))
  return (
    <div className="portfolio-wrap">
      <div className="portfolio-bar" aria-label="Recommended traffic allocation">
        {allocations.map((allocation, index) => (
          <div
            className="portfolio-segment"
            key={allocation.modelId}
            style={{ width: `${allocation.weight * 100}%`, background: COLORS[index] }}
          >
            {Math.round(allocation.weight * 100)}%
          </div>
        ))}
      </div>
      <div className="portfolio-legend">
        {allocations.map((allocation, index) => (
          <div className="legend-item" key={allocation.modelId}>
            <span className="legend-swatch" style={{ background: COLORS[index] }} />
            <span>{catalog.get(allocation.modelId)?.name}</span>
            <strong>{Math.round(allocation.weight * 100)}%</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
