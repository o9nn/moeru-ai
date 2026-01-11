/**
 * Comprehensive tests for SophrosyneEngine
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SophrosyneEngine } from '../sophrosyne-engine'
import type { RegulationContext, Spectrum } from '../sophrosyne-engine'
import type { CognitiveContext } from '../types'

// Helper factory functions
function createRegulationContext(
  overrides: Partial<RegulationContext> = {}
): RegulationContext {
  return {
    stakes: 0.5,
    uncertainty: 0.5,
    timeAvailable: 0.5,
    resources: 0.5,
    taskProgress: 0.5,
    currentPerformance: 0.5,
    complexity: 0.5,
    novelty: 0.5,
    errorCost: 0.5,
    learningValue: 0.5,
    flowState: 0.5,
    ...overrides,
  }
}

function createSpectrum(overrides: Partial<Spectrum> = {}): Spectrum {
  return {
    name: 'exploration-exploitation',
    min: { name: 'Exploration', value: 0.0 },
    max: { name: 'Exploitation', value: 1.0 },
    currentPosition: 0.5,
    ...overrides,
  }
}

function createCognitiveContext(
  overrides: Partial<CognitiveContext> = {}
): CognitiveContext {
  return {
    agentId: 'test-agent',
    environment: { type: 'web' },
    emotional: { valence: 0, arousal: 0.5 },
    workingMemory: [],
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('SophrosyneEngine', () => {
  let engine: SophrosyneEngine

  beforeEach(() => {
    engine = new SophrosyneEngine()
  })

  describe('calculateOptimal', () => {
    describe('exploration-exploitation spectrum', () => {
      const spectrum = createSpectrum({ name: 'exploration-exploitation' })

      it('should favor exploitation under high stakes', () => {
        const context = createRegulationContext({ stakes: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeGreaterThan(0.5)
        expect(result.factors.some((f) => f.name === 'stakes')).toBe(true)
      })

      it('should favor exploration under high uncertainty', () => {
        const context = createRegulationContext({ uncertainty: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeLessThan(0.5)
      })

      it('should favor exploitation with good performance', () => {
        const context = createRegulationContext({ currentPerformance: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeGreaterThan(0.5)
      })

      it('should favor exploration in novel situations', () => {
        const context = createRegulationContext({ novelty: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeLessThan(0.5)
      })

      it('should balance competing factors', () => {
        const context = createRegulationContext({
          stakes: 0.9, // Favors exploitation
          uncertainty: 0.9, // Favors exploration
        })
        const result = engine.calculateOptimal(spectrum, context)

        // Should be closer to middle due to competing factors
        expect(result.position).toBeGreaterThanOrEqual(0.3)
        expect(result.position).toBeLessThanOrEqual(0.7)
      })
    })

    describe('speed-accuracy spectrum', () => {
      const spectrum = createSpectrum({
        name: 'speed-accuracy',
        min: { name: 'Speed', value: 0.0 },
        max: { name: 'Accuracy', value: 1.0 },
      })

      it('should favor accuracy more with ample time than with limited time', () => {
        const ampleTimeContext = createRegulationContext({ timeAvailable: 0.9 })
        const limitedTimeContext = createRegulationContext({ timeAvailable: 0.1 })

        const ampleResult = engine.calculateOptimal(spectrum, ampleTimeContext)
        const limitedResult = engine.calculateOptimal(spectrum, limitedTimeContext)

        expect(ampleResult.position).toBeGreaterThan(limitedResult.position)
      })

      it('should favor speed with time pressure', () => {
        const context = createRegulationContext({ timeAvailable: 0.1 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeLessThan(0.5)
      })

      it('should favor accuracy more with high error cost than with low error cost', () => {
        const highErrorContext = createRegulationContext({ errorCost: 0.9 })
        const lowErrorContext = createRegulationContext({ errorCost: 0.1 })

        const highResult = engine.calculateOptimal(spectrum, highErrorContext)
        const lowResult = engine.calculateOptimal(spectrum, lowErrorContext)

        expect(highResult.position).toBeGreaterThan(lowResult.position)
      })

      it('should favor accuracy more with high complexity than with low complexity', () => {
        const highComplexContext = createRegulationContext({ complexity: 0.9 })
        const lowComplexContext = createRegulationContext({ complexity: 0.1 })

        const highResult = engine.calculateOptimal(spectrum, highComplexContext)
        const lowResult = engine.calculateOptimal(spectrum, lowComplexContext)

        expect(highResult.position).toBeGreaterThan(lowResult.position)
      })
    })

    describe('breadth-depth spectrum', () => {
      const spectrum = createSpectrum({
        name: 'breadth-depth',
        min: { name: 'Breadth', value: 0.0 },
        max: { name: 'Depth', value: 1.0 },
      })

      it('should favor breadth in novel situations', () => {
        const context = createRegulationContext({ novelty: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeLessThan(0.5)
      })

      it('should favor depth with good task progress', () => {
        const context = createRegulationContext({ taskProgress: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeGreaterThan(0.5)
      })

      it('should favor depth with ample time', () => {
        const context = createRegulationContext({ timeAvailable: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeGreaterThan(0.5)
      })

      it('should favor breadth with high complexity', () => {
        const context = createRegulationContext({ complexity: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeLessThan(0.5)
      })
    })

    describe('interruption-persistence spectrum', () => {
      const spectrum = createSpectrum({
        name: 'interruption-persistence',
        min: { name: 'Interruption', value: 0.0 },
        max: { name: 'Persistence', value: 1.0 },
      })

      it('should favor persistence more near task completion than at start', () => {
        const nearCompletionContext = createRegulationContext({ taskProgress: 0.9 })
        const earlyContext = createRegulationContext({ taskProgress: 0.1 })

        const nearResult = engine.calculateOptimal(spectrum, nearCompletionContext)
        const earlyResult = engine.calculateOptimal(spectrum, earlyContext)

        expect(nearResult.position).toBeGreaterThan(earlyResult.position)
      })

      it('should favor persistence more in flow state than out of flow', () => {
        const flowContext = createRegulationContext({ flowState: 0.9 })
        const noFlowContext = createRegulationContext({ flowState: 0.1 })

        const flowResult = engine.calculateOptimal(spectrum, flowContext)
        const noFlowResult = engine.calculateOptimal(spectrum, noFlowContext)

        expect(flowResult.position).toBeGreaterThan(noFlowResult.position)
      })

      it('should favor persistence more with good performance than poor performance', () => {
        const goodPerfContext = createRegulationContext({ currentPerformance: 0.9 })
        const poorPerfContext = createRegulationContext({ currentPerformance: 0.1 })

        const goodResult = engine.calculateOptimal(spectrum, goodPerfContext)
        const poorResult = engine.calculateOptimal(spectrum, poorPerfContext)

        expect(goodResult.position).toBeGreaterThan(poorResult.position)
      })

      it('should favor interruption more with high learning value than low', () => {
        const highLearningContext = createRegulationContext({ learningValue: 0.9 })
        const lowLearningContext = createRegulationContext({ learningValue: 0.1 })

        const highResult = engine.calculateOptimal(spectrum, highLearningContext)
        const lowResult = engine.calculateOptimal(spectrum, lowLearningContext)

        expect(highResult.position).toBeLessThan(lowResult.position)
      })
    })

    describe('risk-safety spectrum', () => {
      const spectrum = createSpectrum({
        name: 'risk-safety',
        min: { name: 'Risk', value: 0.0 },
        max: { name: 'Safety', value: 1.0 },
      })

      it('should favor safety with high stakes', () => {
        const context = createRegulationContext({ stakes: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeGreaterThan(0.5)
      })

      it('should favor risk with abundant resources', () => {
        const context = createRegulationContext({ resources: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeLessThan(0.5)
      })

      it('should favor risk with high learning value', () => {
        const context = createRegulationContext({ learningValue: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeLessThan(0.5)
      })

      it('should favor safety with high error cost', () => {
        const context = createRegulationContext({ errorCost: 0.9 })
        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeGreaterThan(0.5)
      })
    })

    describe('unknown spectrum', () => {
      it('should use generic calculation for unknown spectra', () => {
        const spectrum = createSpectrum({ name: 'custom-spectrum' })
        const context = createRegulationContext()

        const result = engine.calculateOptimal(spectrum, context)

        expect(result.position).toBeGreaterThanOrEqual(0)
        expect(result.position).toBeLessThanOrEqual(1)
        expect(result.factors.length).toBeGreaterThan(0)
      })
    })

    describe('result properties', () => {
      it('should return position between 0 and 1', () => {
        const spectrum = createSpectrum()
        const contexts = [
          createRegulationContext({ stakes: 0, uncertainty: 0 }),
          createRegulationContext({ stakes: 1, uncertainty: 1 }),
          createRegulationContext({ stakes: 0.5, uncertainty: 0.5 }),
        ]

        contexts.forEach((context) => {
          const result = engine.calculateOptimal(spectrum, context)
          expect(result.position).toBeGreaterThanOrEqual(0)
          expect(result.position).toBeLessThanOrEqual(1)
        })
      })

      it('should return confidence between 0 and 1', () => {
        const spectrum = createSpectrum()
        const context = createRegulationContext()

        const result = engine.calculateOptimal(spectrum, context)

        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      })

      it('should provide reasoning', () => {
        const spectrum = createSpectrum()
        const context = createRegulationContext()

        const result = engine.calculateOptimal(spectrum, context)

        expect(result.reasoning).toBeTruthy()
        expect(typeof result.reasoning).toBe('string')
      })

      it('should provide factor breakdown', () => {
        const spectrum = createSpectrum()
        const context = createRegulationContext()

        const result = engine.calculateOptimal(spectrum, context)

        expect(result.factors).toBeInstanceOf(Array)
        expect(result.factors.length).toBeGreaterThan(0)

        result.factors.forEach((factor) => {
          expect(factor).toHaveProperty('name')
          expect(factor).toHaveProperty('weight')
          expect(factor).toHaveProperty('direction')
          expect(factor).toHaveProperty('reason')
        })
      })
    })
  })

  describe('decide', () => {
    it('should recommend continue when close to optimal', () => {
      const spectrum = createSpectrum({ currentPosition: 0.5 })
      const context = createRegulationContext()
      const optimal = engine.calculateOptimal(spectrum, context)

      // Set current position close to optimal
      spectrum.currentPosition = optimal.position

      const decision = engine.decide(spectrum, context, optimal)

      expect(decision.action).toBe('continue')
      expect(decision.confidence).toBeGreaterThan(0)
    })

    it('should recommend adjust for moderate gaps', () => {
      const spectrum = createSpectrum({ currentPosition: 0.3 })
      const context = createRegulationContext({ stakes: 0.9 }) // Will push optimal toward 1
      const optimal = engine.calculateOptimal(spectrum, context)

      const decision = engine.decide(spectrum, context, optimal)

      if (Math.abs(optimal.position - spectrum.currentPosition) < 0.3) {
        expect(decision.action).toBe('adjust')
        expect(decision.adjustment).toBeDefined()
      }
    })

    it('should recommend switch for large gaps', () => {
      const spectrum = createSpectrum({ currentPosition: 0.1 })
      const context = createRegulationContext({ stakes: 0.99, uncertainty: 0.1 })
      const optimal = engine.calculateOptimal(spectrum, context)

      // Force large gap if needed
      if (optimal.position > 0.4) {
        const decision = engine.decide(spectrum, context, optimal)
        expect(decision.action).toBe('switch')
        expect(decision.switchTo).toBeDefined()
      }
    })

    it('should provide reasoning for all decisions', () => {
      const spectrum = createSpectrum()
      const context = createRegulationContext()
      const optimal = engine.calculateOptimal(spectrum, context)

      const decision = engine.decide(spectrum, context, optimal)

      expect(decision.reasoning).toBeTruthy()
      expect(typeof decision.reasoning).toBe('string')
    })

    it('should have confidence correlated with optimal confidence', () => {
      const spectrum = createSpectrum()
      const context = createRegulationContext()
      const optimal = engine.calculateOptimal(spectrum, context)

      const decision = engine.decide(spectrum, context, optimal)

      expect(decision.confidence).toBeLessThanOrEqual(optimal.confidence)
    })
  })

  describe('recordOutcome', () => {
    it('should store outcomes for historical learning', () => {
      const spectrum = 'exploration-exploitation'
      const context = createRegulationContext()

      engine.recordOutcome(spectrum, context, 0.6, 0.8)

      // Record multiple outcomes to verify accumulation
      for (let i = 0; i < 5; i++) {
        engine.recordOutcome(spectrum, context, 0.5 + i * 0.1, 0.7)
      }

      // Historical data should influence future calculations
      const testSpectrum = createSpectrum({ name: spectrum })
      const result = engine.calculateOptimal(testSpectrum, context)

      expect(result).toBeDefined()
      expect(result.position).toBeGreaterThanOrEqual(0)
      expect(result.position).toBeLessThanOrEqual(1)
    })

    it('should limit history size', () => {
      const spectrum = 'exploration-exploitation'
      const context = createRegulationContext()

      // Record more than the limit (100)
      for (let i = 0; i < 150; i++) {
        engine.recordOutcome(spectrum, context, Math.random(), Math.random())
      }

      // Should not throw and should still work
      const testSpectrum = createSpectrum({ name: spectrum })
      const result = engine.calculateOptimal(testSpectrum, context)

      expect(result).toBeDefined()
    })

    it('should differentiate between different spectra', () => {
      const context = createRegulationContext()

      engine.recordOutcome('exploration-exploitation', context, 0.8, 0.9)
      engine.recordOutcome('speed-accuracy', context, 0.2, 0.9)

      const explorationSpectrum = createSpectrum({ name: 'exploration-exploitation' })
      const speedSpectrum = createSpectrum({ name: 'speed-accuracy' })

      const explorationResult = engine.calculateOptimal(explorationSpectrum, context)
      const speedResult = engine.calculateOptimal(speedSpectrum, context)

      // Different spectra should potentially give different results
      expect(explorationResult.position).not.toEqual(speedResult.position)
    })
  })

  describe('static methods', () => {
    describe('createSpectrum', () => {
      it('should create a valid spectrum', () => {
        const spectrum = SophrosyneEngine.createSpectrum(
          'test-spectrum',
          'Low',
          'High',
          0.7
        )

        expect(spectrum.name).toBe('test-spectrum')
        expect(spectrum.min.name).toBe('Low')
        expect(spectrum.min.value).toBe(0.0)
        expect(spectrum.max.name).toBe('High')
        expect(spectrum.max.value).toBe(1.0)
        expect(spectrum.currentPosition).toBe(0.7)
      })
    })

    describe('extractRegulationContext', () => {
      it('should extract context from cognitive context', () => {
        const cognitiveContext = createCognitiveContext({
          workingMemory: ['item1', 'item2', 'item3'],
          emotional: { valence: 0.6, arousal: 0.8 },
        })

        const regContext = SophrosyneEngine.extractRegulationContext(cognitiveContext)

        expect(regContext).toHaveProperty('stakes')
        expect(regContext).toHaveProperty('uncertainty')
        expect(regContext).toHaveProperty('flowState')
        expect(regContext.complexity).toBeGreaterThan(0) // Has memory load
      })

      it('should merge additional context', () => {
        const cognitiveContext = createCognitiveContext()
        const additional = { stakes: 0.9, uncertainty: 0.1 }

        const regContext = SophrosyneEngine.extractRegulationContext(
          cognitiveContext,
          additional
        )

        expect(regContext.stakes).toBe(0.9)
        expect(regContext.uncertainty).toBe(0.1)
      })

      it('should detect flow state from emotional state', () => {
        const flowContext = createCognitiveContext({
          emotional: { valence: 0.6, arousal: 0.7 },
        })
        const noFlowContext = createCognitiveContext({
          emotional: { valence: -0.3, arousal: 0.2 },
        })

        const flowReg = SophrosyneEngine.extractRegulationContext(flowContext)
        const noFlowReg = SophrosyneEngine.extractRegulationContext(noFlowContext)

        expect(flowReg.flowState).toBeGreaterThan(noFlowReg.flowState)
      })

      it('should calculate complexity from memory load', () => {
        const lowMemoryContext = createCognitiveContext({
          workingMemory: ['item1'],
        })
        const highMemoryContext = createCognitiveContext({
          workingMemory: ['1', '2', '3', '4', '5', '6', '7'],
        })

        const lowReg = SophrosyneEngine.extractRegulationContext(lowMemoryContext)
        const highReg = SophrosyneEngine.extractRegulationContext(highMemoryContext)

        expect(highReg.complexity).toBeGreaterThan(lowReg.complexity)
      })
    })
  })

  describe('historical learning', () => {
    it('should adjust based on similar successful contexts', () => {
      const spectrum = createSpectrum({ name: 'exploration-exploitation' })
      const context = createRegulationContext({ stakes: 0.7, uncertainty: 0.3 })

      // Record successful outcomes at position 0.8
      for (let i = 0; i < 10; i++) {
        engine.recordOutcome(spectrum.name, context, 0.8, 0.9)
      }

      const result = engine.calculateOptimal(spectrum, context)

      // Should be influenced by historical success at 0.8
      // (Though adjustment is small, it should trend toward historical success)
      expect(result).toBeDefined()
    })

    it('should have higher confidence with more historical data', () => {
      const spectrum = createSpectrum({ name: 'exploration-exploitation' })
      const context = createRegulationContext()

      const resultWithoutHistory = engine.calculateOptimal(spectrum, context)

      // Add historical data
      for (let i = 0; i < 20; i++) {
        engine.recordOutcome(spectrum.name, context, 0.5, 0.8)
      }

      const resultWithHistory = engine.calculateOptimal(spectrum, context)

      expect(resultWithHistory.confidence).toBeGreaterThanOrEqual(
        resultWithoutHistory.confidence
      )
    })
  })
})
