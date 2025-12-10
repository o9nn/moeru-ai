/**
 * Cognitive Core - Main Exports
 *
 * Unified cognitive architecture for AIRI
 * Based on John Vervaeke's 4E cognition and relevance realization framework
 */

// Types
export type * from './types'

// Relevance Realization
export { RelevanceCoordinator, defaultRelevanceConfig } from './relevance-coordinator'
export type { RelevanceConfig } from './relevance-coordinator'

// Four Ways of Knowing
export { FourWaysTracker, defaultBalanceConfig } from './four-ways-tracker'
export type {
  KnowingEvent,
  BalanceConfig,
  BalanceRecommendation,
} from './four-ways-tracker'

// Optimal Grip (Perspectival Knowing)
export {
  OptimalGripCoordinator,
  defaultOptimalGripConfig,
  defaultFrames,
} from './optimal-grip'
export type { OptimalGripConfig } from './optimal-grip'
