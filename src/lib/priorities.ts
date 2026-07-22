import type { Priorities } from '../types'

export function normalizePriorities(priorities: Priorities): Priorities {
  const total = priorities.quality + priorities.cost + priorities.speed
  if (total === 0) return { quality: 0, cost: 0, speed: 0 }
  return {
    quality: priorities.quality / total,
    cost: priorities.cost / total,
    speed: priorities.speed / total,
  }
}
