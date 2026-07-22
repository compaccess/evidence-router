import { describe, expect, it } from 'vitest'
import { MODEL_CATALOG } from '../data/models'
import { normalizePriorities } from './priorities'
import { forecastPortfolio, optimizeRoute } from './router'
import * as routing from './router'
import type { RoutingInput } from '../types'

const baseInput: RoutingInput = {
  useCase: 'Customer-support agent',
  workflow: 'support',
  monthlyCalls: 100_000,
  inputWordsPerCall: 750,
  outputWordsPerCall: 188,
  monthlyBudget: 500,
  passRateFloor: 0.8,
  priorities: { quality: 50, cost: 30, speed: 20 },
}

describe('normalizePriorities', () => {
  it('returns the effective mix used by the optimizer', () => {
    expect(normalizePriorities({ quality: 60, cost: 30, speed: 20 })).toEqual({
      quality: 60 / 110,
      cost: 30 / 110,
      speed: 20 / 110,
    })
    expect(normalizePriorities({ quality: 0, cost: 0, speed: 0 })).toEqual({
      quality: 0,
      cost: 0,
      speed: 0,
    })
  })
})

describe('forecastPortfolio', () => {
  it('estimates token-priced cost from user-entered words', () => {
    const forecast = forecastPortfolio(
      baseInput,
      [
        { modelId: 'atlas-pro', weight: 0.5 },
        { modelId: 'swift-mini', weight: 0.5 },
      ],
      MODEL_CATALOG,
    )

    expect(forecast.monthlyCost).toBeCloseTo(337.85, 1)
    expect(forecast.passRate).toBeCloseTo(0.84, 3)
    expect(forecast.latencyMs).toBeCloseTo(830, 0)
  })
})

describe('word usage estimation', () => {
  const estimateTokensFromWords = (routing as unknown as {
    estimateTokensFromWords?: (words: number) => number
  }).estimateTokensFromWords

  it('converts words with the shared planning estimate', () => {
    expect(estimateTokensFromWords?.(0)).toBe(0)
    expect(estimateTokensFromWords?.(750)).toBe(1_000)
    expect(estimateTokensFromWords?.(188)).toBe(251)
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

  it('changes the recommendation when only the decision priorities change', () => {
    const balanced = optimizeRoute(baseInput, MODEL_CATALOG)
    const qualityFirst = optimizeRoute(
      {
        ...baseInput,
        priorities: { quality: 100, cost: 0, speed: 0 },
      },
      MODEL_CATALOG,
    )

    expect(qualityFirst.forecast.passRate).toBeGreaterThanOrEqual(balanced.forecast.passRate)
    expect(qualityFirst.allocations).not.toEqual(balanced.allocations)
  })

  it('plots a latency-first selected route even when it is off the cost-quality frontier', () => {
    const passRates = { support: 0.9, research: 0.9, coding: 0.9, extraction: 0.9 }
    const result = optimizeRoute(
      {
        ...baseInput,
        monthlyBudget: 10_000,
        passRateFloor: 0.7,
        priorities: { quality: 0, cost: 0, speed: 100 },
      },
      [
        {
          id: 'slow-efficient',
          name: 'Slow Efficient',
          provider: 'Provider A',
          tier: 'balanced',
          inputPricePerMillion: 1,
          outputPricePerMillion: 1,
          latencyMs: 1_000,
          passRates,
          evidence: 'Synthetic test fixture',
          measuredAt: '2026-07-22',
        },
        {
          id: 'fast-dominated',
          name: 'Fast Dominated',
          provider: 'Provider B',
          tier: 'fast',
          inputPricePerMillion: 2,
          outputPricePerMillion: 2,
          latencyMs: 100,
          passRates: { ...passRates, support: 0.8 },
          evidence: 'Synthetic test fixture',
          measuredAt: '2026-07-22',
        },
      ],
    )

    expect(result.allocations).toEqual([{ modelId: 'fast-dominated', weight: 1 }])
    expect(result.paretoFrontier.filter((point) => point.selected)).toHaveLength(1)
    expect(result.paretoFrontier.find((point) => point.selected)?.onFrontier).toBe(false)
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
