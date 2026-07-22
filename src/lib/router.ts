import type {
  Allocation,
  EvidenceRow,
  Forecast,
  ModelProfile,
  ParetoPoint,
  RoutingInput,
  RoutingResult,
} from '../types'
import { normalizePriorities } from './priorities'

interface Candidate {
  allocations: Allocation[]
  forecast: Forecast
  utility: number
  violations: RoutingResult['violations']
}

const round = (value: number, digits = 4) => Number(value.toFixed(digits))

function modelMonthlyCost(input: RoutingInput, model: ModelProfile): number {
  const inputMillions = (input.monthlyCalls * input.inputTokensPerCall) / 1_000_000
  const outputMillions = (input.monthlyCalls * input.outputTokensPerCall) / 1_000_000
  return inputMillions * model.inputPricePerMillion + outputMillions * model.outputPricePerMillion
}

function baselineFor(input: RoutingInput, models: ModelProfile[]): { model: ModelProfile; forecast: Forecast } {
  const model = [...models].sort(
    (a, b) => b.passRates[input.workflow] - a.passRates[input.workflow] || a.id.localeCompare(b.id),
  )[0]
  const monthlyCost = modelMonthlyCost(input, model)
  return {
    model,
    forecast: {
      monthlyCost: round(monthlyCost, 2),
      passRate: model.passRates[input.workflow],
      latencyMs: model.latencyMs,
      savingsPercent: 0,
    },
  }
}

export function forecastPortfolio(
  input: RoutingInput,
  allocations: Allocation[],
  models: ModelProfile[],
): Forecast {
  const catalog = new Map(models.map((model) => [model.id, model]))
  const totalWeight = allocations.reduce((sum, allocation) => sum + allocation.weight, 0)
  if (Math.abs(totalWeight - 1) > 0.0001) throw new Error('Allocation weights must sum to 1')

  const metrics = allocations.reduce(
    (acc, allocation) => {
      const model = catalog.get(allocation.modelId)
      if (!model) throw new Error(`Unknown model: ${allocation.modelId}`)
      acc.monthlyCost += modelMonthlyCost(input, model) * allocation.weight
      acc.passRate += model.passRates[input.workflow] * allocation.weight
      acc.latencyMs += model.latencyMs * allocation.weight
      return acc
    },
    { monthlyCost: 0, passRate: 0, latencyMs: 0 },
  )
  const baselineCost = baselineFor(input, models).forecast.monthlyCost

  return {
    monthlyCost: round(metrics.monthlyCost, 2),
    passRate: round(metrics.passRate),
    latencyMs: round(metrics.latencyMs, 0),
    savingsPercent: round(Math.max(0, (1 - metrics.monthlyCost / baselineCost) * 100), 1),
  }
}

function enumerateAllocations(models: ModelProfile[]): Allocation[][] {
  const portfolios: Allocation[][] = models.map((model) => [{ modelId: model.id, weight: 1 }])
  for (let first = 0; first < models.length; first += 1) {
    for (let second = first + 1; second < models.length; second += 1) {
      for (let step = 1; step <= 9; step += 1) {
        portfolios.push([
          { modelId: models[first].id, weight: step / 10 },
          { modelId: models[second].id, weight: (10 - step) / 10 },
        ])
      }
    }
  }
  return portfolios
}

function scoreCandidate(input: RoutingInput, forecast: Forecast, maxLatency: number): number {
  const priorities = normalizePriorities(input.priorities)
  const quality = forecast.passRate
  const cost = forecast.savingsPercent / 100
  const speed = Math.max(0, 1 - forecast.latencyMs / maxLatency)
  return round(
    priorities.quality * quality + priorities.cost * cost + priorities.speed * speed,
    6,
  )
}

function getParetoFrontier(candidates: Candidate[], selected: Candidate): ParetoPoint[] {
  const frontier = candidates.filter(
    (point) =>
      !candidates.some(
        (other) =>
          other !== point &&
          other.forecast.monthlyCost <= point.forecast.monthlyCost &&
          other.forecast.passRate >= point.forecast.passRate &&
          (other.forecast.monthlyCost < point.forecast.monthlyCost ||
            other.forecast.passRate > point.forecast.passRate),
      ),
  )

  const sortedFrontier = frontier.sort((a, b) => a.forecast.monthlyCost - b.forecast.monthlyCost)
  const visibleFrontier = sortedFrontier.filter(
    (candidate, index, all) => candidate === selected || index === 0 || index === all.length - 1 || index % 2 === 0,
  )
  const toPoint = (candidate: Candidate, onFrontier: boolean): ParetoPoint => ({
    monthlyCost: candidate.forecast.monthlyCost,
    passRate: candidate.forecast.passRate,
    latencyMs: candidate.forecast.latencyMs,
    utility: candidate.utility,
    selected: candidate.allocations === selected.allocations,
    onFrontier,
  })
  const points = visibleFrontier.map((candidate) => toPoint(candidate, true))

  if (!frontier.includes(selected)) points.push(toPoint(selected, false))
  return points
}

function buildEvidence(
  input: RoutingInput,
  allocations: Allocation[],
  models: ModelProfile[],
): EvidenceRow[] {
  const catalog = new Map(models.map((model) => [model.id, model]))
  return allocations
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .map((allocation) => {
      const model = catalog.get(allocation.modelId)!
      return {
        modelId: model.id,
        modelName: model.name,
        decisionWeight: allocation.weight,
        benchmarkPassRate: model.passRates[input.workflow],
        source: `${model.evidence} · ${model.measuredAt}`,
        rationale: `${model.tier} tier contributes ${Math.round(allocation.weight * 100)}% of traffic at $${model.inputPricePerMillion.toFixed(2)}/$${model.outputPricePerMillion.toFixed(2)} per 1M input/output tokens.`,
      }
    })
}

export function optimizeRoute(input: RoutingInput, models: ModelProfile[]): RoutingResult {
  if (!models.length) throw new Error('At least one model is required')
  const baseline = baselineFor(input, models).forecast
  const maxLatency = Math.max(...models.map((model) => model.latencyMs))
  const candidates: Candidate[] = enumerateAllocations(models).map((allocations) => {
    const forecast = forecastPortfolio(input, allocations, models)
    const violations = {
      budget: round(Math.max(0, forecast.monthlyCost - input.monthlyBudget), 2),
      quality: round(Math.max(0, input.passRateFloor - forecast.passRate)),
    }
    return {
      allocations,
      forecast,
      utility: scoreCandidate(input, forecast, maxLatency),
      violations,
    }
  })

  const feasible = candidates.filter(
    (candidate) => candidate.violations.budget === 0 && candidate.violations.quality === 0,
  )
  const ranked = (feasible.length ? feasible : candidates).sort((a, b) => {
    if (!feasible.length) {
      const aPenalty = a.violations.budget / Math.max(input.monthlyBudget, 1) + a.violations.quality * 10
      const bPenalty = b.violations.budget / Math.max(input.monthlyBudget, 1) + b.violations.quality * 10
      if (aPenalty !== bPenalty) return aPenalty - bPenalty
    }
    return b.utility - a.utility || a.forecast.monthlyCost - b.forecast.monthlyCost ||
      JSON.stringify(a.allocations).localeCompare(JSON.stringify(b.allocations))
  })
  const selected = ranked[0]

  return {
    status: feasible.length ? 'feasible' : 'near-feasible',
    allocations: selected.allocations,
    forecast: selected.forecast,
    baseline,
    violations: selected.violations,
    evidence: buildEvidence(input, selected.allocations, models),
    paretoFrontier: getParetoFrontier(candidates, selected),
    utility: selected.utility,
  }
}
