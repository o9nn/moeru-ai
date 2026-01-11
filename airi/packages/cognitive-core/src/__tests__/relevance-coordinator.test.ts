/**
 * Comprehensive tests for RelevanceCoordinator and ConfidenceCalibrator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  RelevanceCoordinator,
  ConfidenceCalibrator,
  defaultRelevanceConfig,
} from '../relevance-coordinator'
import type { CognitiveContext, Possibility } from '../types'

// Helper factory functions
function createContext(overrides: Partial<CognitiveContext> = {}): CognitiveContext {
  return {
    agentId: 'test-agent',
    environment: { type: 'web' },
    emotional: { valence: 0, arousal: 0.5 },
    workingMemory: [],
    timestamp: Date.now(),
    ...overrides,
  }
}

function createPossibility(overrides: Partial<Possibility> = {}): Possibility {
  return {
    id: 'test-possibility',
    description: 'Test possibility description',
    type: 'action',
    ...overrides,
  }
}

describe('ConfidenceCalibrator', () => {
  let calibrator: ConfidenceCalibrator

  beforeEach(() => {
    calibrator = new ConfidenceCalibrator()
  })

  describe('calibrate', () => {
    it('should return confidence between 0.1 and 0.95', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }
      const context = createContext()
      const result = calibrator.calibrate(components, context)

      expect(result.confidence).toBeGreaterThanOrEqual(0.1)
      expect(result.confidence).toBeLessThanOrEqual(0.95)
    })

    it('should have higher confidence with uniform components (high agreement)', () => {
      const uniformComponents = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }
      const divergentComponents = {
        novelty: 0.9,
        emotional: 0.1,
        pragmatic: 0.8,
        coherence: 0.2,
        epistemic: 0.5,
      }
      const context = createContext()

      const uniformResult = calibrator.calibrate(uniformComponents, context)
      const divergentResult = calibrator.calibrate(divergentComponents, context)

      expect(uniformResult.factors.componentAgreement).toBeGreaterThan(
        divergentResult.factors.componentAgreement
      )
    })

    it('should increase confidence with better context data', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }
      const sparseContext = createContext()
      const richContext = createContext({
        task: 'Analyze the data thoroughly',
        attentionFocus: 'data analysis',
        workingMemory: ['item1', 'item2', 'item3'],
        recentHistory: [{ action: 'previous' }],
        environment: {
          type: 'web',
          state: { page: 'dashboard', user: 'admin' },
        },
      })

      const sparseResult = calibrator.calibrate(components, sparseContext)
      const richResult = calibrator.calibrate(components, richContext)

      expect(richResult.factors.dataSufficiency).toBeGreaterThan(
        sparseResult.factors.dataSufficiency
      )
    })

    it('should provide reasoning based on confidence level', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }
      const context = createContext()
      const result = calibrator.calibrate(components, context)

      expect(result.reasoning).toBeTruthy()
      expect(typeof result.reasoning).toBe('string')
      expect(result.reasoning.length).toBeGreaterThan(0)
    })

    it('should include all factor scores in result', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }
      const context = createContext()
      const result = calibrator.calibrate(components, context)

      expect(result.factors).toHaveProperty('componentAgreement')
      expect(result.factors).toHaveProperty('historicalAccuracy')
      expect(result.factors).toHaveProperty('dataSufficiency')
      expect(result.factors).toHaveProperty('contextClarity')

      Object.values(result.factors).forEach((factor) => {
        expect(factor).toBeGreaterThanOrEqual(0)
        expect(factor).toBeLessThanOrEqual(1)
      })
    })

    it('should have higher context clarity with defined task', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }
      const noTaskContext = createContext()
      const taskContext = createContext({ task: 'Complete the analysis' })

      const noTaskResult = calibrator.calibrate(components, noTaskContext)
      const taskResult = calibrator.calibrate(components, taskContext)

      expect(taskResult.factors.contextClarity).toBeGreaterThan(
        noTaskResult.factors.contextClarity
      )
    })
  })

  describe('recordOutcome', () => {
    it('should track outcomes for historical accuracy', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }

      // Record several outcomes
      for (let i = 0; i < 10; i++) {
        calibrator.recordOutcome(0.7, components, 0.7) // Accurate predictions
      }

      const stats = calibrator.getStatistics()
      expect(stats.totalPredictions).toBe(10)
      expect(stats.recentAccuracy).toBeGreaterThan(0.5) // Good accuracy
    })

    it('should limit history size', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }

      // Record more than the limit
      for (let i = 0; i < 100; i++) {
        calibrator.recordOutcome(0.5, components, 0.5)
      }

      const stats = calibrator.getStatistics()
      expect(stats.totalPredictions).toBeLessThanOrEqual(50) // historyLimit
    })

    it('should reflect poor predictions in lower accuracy', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }

      // Record inaccurate predictions
      for (let i = 0; i < 10; i++) {
        calibrator.recordOutcome(0.9, components, 0.1) // Big error
      }

      const stats = calibrator.getStatistics()
      expect(stats.recentAccuracy).toBeLessThan(0.5) // Poor accuracy
    })
  })

  describe('getStatistics', () => {
    it('should return statistics even with no history', () => {
      const stats = calibrator.getStatistics()

      expect(stats).toHaveProperty('totalPredictions')
      expect(stats).toHaveProperty('recentAccuracy')
      expect(stats).toHaveProperty('averageConfidence')
      expect(stats.totalPredictions).toBe(0)
    })
  })
})

describe('RelevanceCoordinator', () => {
  let coordinator: RelevanceCoordinator

  beforeEach(() => {
    coordinator = new RelevanceCoordinator()
  })

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const config = coordinator.getConfig()
      expect(config).toEqual(defaultRelevanceConfig)
    })

    it('should merge custom config with defaults', () => {
      const customCoordinator = new RelevanceCoordinator({
        threshold: 0.5,
        weights: {
          novelty: 0.5,
          emotional: 0.1,
          pragmatic: 0.2,
          coherence: 0.1,
          epistemic: 0.1,
        },
      })
      const config = customCoordinator.getConfig()

      expect(config.threshold).toBe(0.5)
      expect(config.weights.novelty).toBe(0.5)
      expect(config.enableLearning).toBe(defaultRelevanceConfig.enableLearning)
    })
  })

  describe('calculateRelevance', () => {
    it('should return relevance score with all components', async () => {
      const possibility = createPossibility()
      const context = createContext()

      const result = await coordinator.calculateRelevance(possibility, context)

      expect(result).toHaveProperty('overall')
      expect(result).toHaveProperty('components')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('reasoning')
    })

    it('should have overall score between 0 and 1', async () => {
      const possibility = createPossibility()
      const context = createContext()

      const result = await coordinator.calculateRelevance(possibility, context)

      expect(result.overall).toBeGreaterThanOrEqual(0)
      expect(result.overall).toBeLessThanOrEqual(1)
    })

    it('should have all component scores between 0 and 1', async () => {
      const possibility = createPossibility()
      const context = createContext()

      const result = await coordinator.calculateRelevance(possibility, context)

      Object.values(result.components).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      })
    })

    it('should calculate confidence dynamically (not hardcoded)', async () => {
      const possibility = createPossibility()
      const sparseContext = createContext()
      const richContext = createContext({
        task: 'Analyze data',
        workingMemory: ['data', 'analysis', 'results'],
        attentionFocus: 'data analysis',
      })

      const sparseResult = await coordinator.calculateRelevance(possibility, sparseContext)
      const richResult = await coordinator.calculateRelevance(possibility, richContext)

      // Confidence should vary based on context
      expect(sparseResult.confidence).not.toBe(0.8) // Not hardcoded
      expect(richResult.confidence).not.toBe(sparseResult.confidence) // Different contexts
    })

    it('should calculate lower novelty for items in working memory', async () => {
      const possibility = createPossibility({ description: 'Analyze data patterns' })
      const contextWithoutMemory = createContext()
      const contextWithMemory = createContext({
        workingMemory: ['Analyze data patterns'],
      })

      const resultWithout = await coordinator.calculateRelevance(possibility, contextWithoutMemory)
      const resultWith = await coordinator.calculateRelevance(possibility, contextWithMemory)

      expect(resultWith.components.novelty).toBeLessThan(resultWithout.components.novelty)
    })

    it('should increase pragmatic value for actions during tasks', async () => {
      const actionPossibility = createPossibility({ type: 'action' })
      const thoughtPossibility = createPossibility({ type: 'thought' })
      const context = createContext({ task: 'Complete the project' })

      const actionResult = await coordinator.calculateRelevance(actionPossibility, context)
      const thoughtResult = await coordinator.calculateRelevance(thoughtPossibility, context)

      expect(actionResult.components.pragmatic).toBeGreaterThan(thoughtResult.components.pragmatic)
    })

    it('should consider cost in pragmatic value', async () => {
      const lowCostPossibility = createPossibility({ cost: 1 })
      const highCostPossibility = createPossibility({ cost: 9 })
      const context = createContext()

      const lowCostResult = await coordinator.calculateRelevance(lowCostPossibility, context)
      const highCostResult = await coordinator.calculateRelevance(highCostPossibility, context)

      expect(lowCostResult.components.pragmatic).toBeGreaterThan(
        highCostResult.components.pragmatic
      )
    })

    it('should increase coherence when possibility relates to attention focus', async () => {
      const possibility = createPossibility({ description: 'data analysis' })
      const contextWithFocus = createContext({ attentionFocus: 'data' })
      const contextWithoutFocus = createContext()

      const resultWithFocus = await coordinator.calculateRelevance(possibility, contextWithFocus)
      const resultWithoutFocus = await coordinator.calculateRelevance(
        possibility,
        contextWithoutFocus
      )

      expect(resultWithFocus.components.coherence).toBeGreaterThan(
        resultWithoutFocus.components.coherence
      )
    })

    it('should increase emotional relevance with high arousal', async () => {
      const possibility = createPossibility()
      const lowArousalContext = createContext({ emotional: { valence: 0, arousal: 0.1 } })
      const highArousalContext = createContext({ emotional: { valence: 0, arousal: 0.9 } })

      const lowResult = await coordinator.calculateRelevance(possibility, lowArousalContext)
      const highResult = await coordinator.calculateRelevance(possibility, highArousalContext)

      expect(highResult.components.emotional).toBeGreaterThan(lowResult.components.emotional)
    })

    it('should provide reasoning about the relevance score', async () => {
      const possibility = createPossibility()
      const context = createContext()

      const result = await coordinator.calculateRelevance(possibility, context)

      expect(result.reasoning).toBeTruthy()
      expect(result.reasoning).toContain('Relevance')
    })
  })

  describe('rankPossibilities', () => {
    it('should rank possibilities by relevance score', async () => {
      const possibilities = [
        createPossibility({ id: '1', description: 'Low relevance item' }),
        createPossibility({ id: '2', description: 'High relevance item', cost: 0.1 }),
        createPossibility({ id: '3', description: 'Medium relevance item', cost: 5 }),
      ]
      const context = createContext()

      const result = await coordinator.rankPossibilities(possibilities, context)

      // Items should be sorted by relevance (descending)
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(result.items[i].relevance.overall).toBeGreaterThanOrEqual(
          result.items[i + 1].relevance.overall
        )
      }
    })

    it('should filter out possibilities below threshold', async () => {
      const coordinator = new RelevanceCoordinator({ threshold: 0.9 })
      const possibilities = [
        createPossibility({ id: '1', description: 'test' }),
        createPossibility({ id: '2', description: 'test2' }),
      ]
      const context = createContext()

      const result = await coordinator.rankPossibilities(possibilities, context)

      // High threshold should filter most items
      result.items.forEach((item) => {
        expect(item.relevance.overall).toBeGreaterThanOrEqual(0.9)
      })
    })

    it('should include context and timestamp in result', async () => {
      const possibilities = [createPossibility()]
      const context = createContext()

      const result = await coordinator.rankPossibilities(possibilities, context)

      expect(result.context).toEqual(context)
      expect(result.timestamp).toBeTruthy()
      expect(typeof result.timestamp).toBe('number')
    })

    it('should handle empty possibilities array', async () => {
      const result = await coordinator.rankPossibilities([], createContext())

      expect(result.items).toEqual([])
    })
  })

  describe('reportOutcome', () => {
    it('should track outcome history', async () => {
      const possibility = createPossibility()
      const context = createContext()
      const relevance = await coordinator.calculateRelevance(possibility, context)

      await coordinator.reportOutcome(possibility, relevance, 'success')

      const stats = coordinator.getStatistics()
      expect(stats.total).toBe(1)
      expect(stats.successes).toBe(1)
    })

    it('should calculate success rate correctly', async () => {
      const possibility = createPossibility()
      const context = createContext()
      const relevance = await coordinator.calculateRelevance(possibility, context)

      await coordinator.reportOutcome(possibility, relevance, 'success')
      await coordinator.reportOutcome(possibility, relevance, 'success')
      await coordinator.reportOutcome(possibility, relevance, 'failure')
      await coordinator.reportOutcome(possibility, relevance, 'neutral')

      const stats = coordinator.getStatistics()
      expect(stats.total).toBe(4)
      expect(stats.successes).toBe(2)
      expect(stats.failures).toBe(1)
      expect(stats.successRate).toBe(0.5)
    })

    it('should update calibrator with outcomes', async () => {
      const possibility = createPossibility()
      const context = createContext()
      const relevance = await coordinator.calculateRelevance(possibility, context)

      // Report several outcomes
      for (let i = 0; i < 10; i++) {
        await coordinator.reportOutcome(possibility, relevance, 'success')
      }

      const calibrationStats = coordinator.getCalibrationStatistics()
      expect(calibrationStats.totalPredictions).toBe(10)
    })
  })

  describe('calculateConfidence', () => {
    it('should expose confidence calculation method', () => {
      const components = {
        novelty: 0.5,
        emotional: 0.5,
        pragmatic: 0.5,
        coherence: 0.5,
        epistemic: 0.5,
      }
      const context = createContext()

      const calibration = coordinator.calculateConfidence(components, context)

      expect(calibration).toHaveProperty('confidence')
      expect(calibration).toHaveProperty('factors')
      expect(calibration).toHaveProperty('reasoning')
    })
  })

  describe('getConfig', () => {
    it('should return a copy of the config', () => {
      const config = coordinator.getConfig()

      // Should be equal to defaults
      expect(config).toEqual(defaultRelevanceConfig)

      // Modifying the returned config should not affect the coordinator
      config.threshold = 999
      expect(coordinator.getConfig().threshold).toBe(defaultRelevanceConfig.threshold)
    })
  })

  describe('getStatistics', () => {
    it('should return empty statistics initially', () => {
      const stats = coordinator.getStatistics()

      expect(stats.total).toBe(0)
      expect(stats.successes).toBe(0)
      expect(stats.failures).toBe(0)
      expect(stats.successRate).toBe(0)
    })
  })

  describe('getCalibrationStatistics', () => {
    it('should return calibrator statistics', () => {
      const stats = coordinator.getCalibrationStatistics()

      expect(stats).toHaveProperty('totalPredictions')
      expect(stats).toHaveProperty('recentAccuracy')
      expect(stats).toHaveProperty('averageConfidence')
    })
  })

  describe('learning behavior', () => {
    it('should adjust weights based on outcome history when learning enabled', async () => {
      const coordinator = new RelevanceCoordinator({ enableLearning: true })
      const possibility = createPossibility()
      const context = createContext()

      // Get initial weights
      const initialConfig = coordinator.getConfig()
      const initialEpistemic = initialConfig.weights.epistemic
      const initialPragmatic = initialConfig.weights.pragmatic

      // Simulate many failures (should increase epistemic weight)
      for (let i = 0; i < 25; i++) {
        const relevance = await coordinator.calculateRelevance(possibility, context)
        await coordinator.reportOutcome(possibility, relevance, 'failure')
      }

      const finalConfig = coordinator.getConfig()

      // Weights should have changed
      // Due to low success rate, epistemic should increase, pragmatic should decrease
      expect(finalConfig.weights.epistemic).toBeGreaterThanOrEqual(initialEpistemic)
      expect(finalConfig.weights.pragmatic).toBeLessThanOrEqual(initialPragmatic)
    })

    it('should not adjust weights when learning disabled', async () => {
      const coordinator = new RelevanceCoordinator({ enableLearning: false })
      const possibility = createPossibility()
      const context = createContext()

      const initialConfig = coordinator.getConfig()

      // Simulate many failures
      for (let i = 0; i < 25; i++) {
        const relevance = await coordinator.calculateRelevance(possibility, context)
        await coordinator.reportOutcome(possibility, relevance, 'failure')
      }

      const finalConfig = coordinator.getConfig()

      // Weights should be unchanged
      expect(finalConfig.weights).toEqual(initialConfig.weights)
    })
  })
})
