import type { RoutingInput } from '../types'

export const TOKENS_PER_WORD = 4 / 3
export const WORD_USAGE_ESTIMATE_NOTE = 'Estimated at about 1.33 tokens per word; actual tokenization varies by language and model.'

export function estimateTokensFromWords(words: number): number {
  const safeWords = Number.isFinite(words) ? Math.max(0, words) : 0
  return Math.round(safeWords * TOKENS_PER_WORD)
}

export function buildUsageEstimation(input: Pick<RoutingInput, 'inputWordsPerCall' | 'outputWordsPerCall'>) {
  return {
    tokensPerWord: TOKENS_PER_WORD,
    estimatedInputTokensPerCall: estimateTokensFromWords(input.inputWordsPerCall),
    estimatedOutputTokensPerCall: estimateTokensFromWords(input.outputWordsPerCall),
    note: WORD_USAGE_ESTIMATE_NOTE,
  }
}
