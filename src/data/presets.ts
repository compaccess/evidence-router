import type { RoutingInput } from '../types'

export interface RoutingPreset {
  id: string
  label: string
  input: RoutingInput
}

export const PRESETS: RoutingPreset[] = [
  {
    id: 'support',
    label: 'Customer support',
    input: {
      useCase: 'Answer product questions, retrieve account context, and escalate uncertain cases.',
      workflow: 'support',
      monthlyCalls: 100_000,
      inputTokensPerCall: 1_000,
      outputTokensPerCall: 250,
      monthlyBudget: 500,
      passRateFloor: 0.8,
      priorities: { quality: 50, cost: 30, speed: 20 },
    },
  },
  {
    id: 'research',
    label: 'Research agent',
    input: {
      useCase: 'Search evidence, synthesize sources, and draft a cited technical memo.',
      workflow: 'research',
      monthlyCalls: 24_000,
      inputTokensPerCall: 8_000,
      outputTokensPerCall: 1_500,
      monthlyBudget: 1_200,
      passRateFloor: 0.88,
      priorities: { quality: 70, cost: 20, speed: 10 },
    },
  },
  {
    id: 'coding',
    label: 'Coding workflow',
    input: {
      useCase: 'Triage an issue, propose a patch, run tests, and review the final diff.',
      workflow: 'coding',
      monthlyCalls: 40_000,
      inputTokensPerCall: 5_000,
      outputTokensPerCall: 1_200,
      monthlyBudget: 1_600,
      passRateFloor: 0.87,
      priorities: { quality: 65, cost: 20, speed: 15 },
    },
  },
]
