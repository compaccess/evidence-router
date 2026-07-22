export type Workflow = 'support' | 'research' | 'coding' | 'extraction'

export interface Priorities {
  quality: number
  cost: number
  speed: number
}

export interface RoutingInput {
  useCase: string
  workflow: Workflow
  monthlyCalls: number
  inputTokensPerCall: number
  outputTokensPerCall: number
  monthlyBudget: number
  passRateFloor: number
  priorities: Priorities
}

export interface ModelProfile {
  id: string
  name: string
  provider: string
  tier: 'frontier' | 'balanced' | 'fast'
  inputPricePerMillion: number
  outputPricePerMillion: number
  latencyMs: number
  passRates: Record<Workflow, number>
  evidence: string
  measuredAt: string
}

export interface Allocation {
  modelId: string
  weight: number
}

export interface Forecast {
  monthlyCost: number
  passRate: number
  latencyMs: number
  savingsPercent: number
}

export interface EvidenceRow {
  modelId: string
  modelName: string
  decisionWeight: number
  benchmarkPassRate: number
  source: string
  rationale: string
}

export interface ParetoPoint {
  monthlyCost: number
  passRate: number
  latencyMs: number
  utility: number
  selected: boolean
  onFrontier: boolean
}

export interface RoutingResult {
  status: 'feasible' | 'near-feasible'
  allocations: Allocation[]
  forecast: Forecast
  baseline: Forecast
  violations: { budget: number; quality: number }
  evidence: EvidenceRow[]
  paretoFrontier: ParetoPoint[]
  utility: number
}
