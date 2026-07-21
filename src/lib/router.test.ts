import { describe, expect, it } from 'vitest'
import { MODEL_CATALOG } from '../data/models'
import { forecastPortfolio, optimizeRoute } from './router'
import type { RoutingInput } from '../types'

const baseInput: RoutingInput = {
  useCase: 'Customer-support agent',
  workflow: 'support',
  monthlyCalls: 100_000,
  inputTokensPerCall: 1_000,
  outputTokensPerCall: 250,
  monthlyBudget: 500,
  passRateFloor: 0.8,
  priorities: { quality: 50, cost: 30, speed: 20 },
}

describe('forecastPortfolio', () => {
  it('calculates token cost and weighted operating metrics', () => {
    const forecast = forecastPortfolio(
      baseInput,
      [
        { modelId: 'atlas-pro', weight: 0.5 },
        { modelId: 'swift-mini', weight: 0.5 },
      ],
      MODEL_CATALOG,
    )

    expect(forecast.monthlyCost).toBeCloseTo(337.5, 1)
    expect(forecast.passRate).toBeCloseTo(0.84, 3)
    expect(forecast.latencyMs).toBeCloseTo(830, 0)
  })
})

describe('optimizeRoute', () => {
  it('returns a feasible deterministic portfolio within budget and quality constraints', () => {
    const first = optimizeRoute(baseInput, MODEL_CATALOG)
    const second = optimizeRoute(baseInput, MODEL_CATALOG)

    expect(first).toEqual(second)
    expect(first.status).toBe('feasible')
    expect(first.forecast.monthlyCost).toBeLessThanOrEqual(baseInput.monthlyBudget)
    expect(first.forecast.passRate).toBeGreaterThanOrEqual(baseInput.passRateFloor)
    expect(first.allocations.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1)
    expect(first.evidence.length).toBeGreaterThanOrEqual(first.allocations.length)
  })

  it('changes the recommendation when quality dominates the decision', () => {
    const balanced = optimizeRoute(baseInput, MODEL_CATALOG)
    const qualityFirst = optimizeRoute(
      {
        ...baseInput,
        monthlyBudget: 2_000,
        priorities: { quality: 90, cost: 5, speed: 5 },
      },
      MODEL_CATALOG,
    )

    expect(qualityFirst.forecast.passRate).toBeGreaterThanOrEqual(balanced.forecast.passRate)
    expect(qualityFirst.allocations).not.toEqual(balanced.allocations)
  })

  it('returns the closest portfolio and quantified violations for impossible constraints', () => {
    const result = optimizeRoute(
      { ...baseInput, monthlyBudget: 20, passRateFloor: 0.99 },
      MODEL_CATALOG,
    )

    expect(result.status).toBe('near-feasible')
    expect(result.violations.budget).toBeGreaterThan(0)
    expect(result.violations.quality).toBeGreaterThan(0)
  })

  it('returns non-dominated comparison points for the Pareto frontier', () => {
    const result = optimizeRoute(baseInput, MODEL_CATALOG)

    expect(result.paretoFrontier.length).toBeGreaterThan(1)
    for (const point of result.paretoFrontier) {
      const dominatesPoint = result.paretoFrontier.some(
        (candidate) =>
          candidate.monthlyCost < point.monthlyCost && candidate.passRate > point.passRate,
      )
      expect(dominatesPoint).toBe(false)
    }
  })
})
