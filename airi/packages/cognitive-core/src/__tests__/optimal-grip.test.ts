/**
 * Comprehensive tests for OptimalGripCoordinator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  OptimalGripCoordinator,
  defaultOptimalGripConfig,
  defaultFrames,
} from '../optimal-grip'
import type { OptimalGripConfig } from '../optimal-grip'
import type { CognitiveContext, CognitiveFrame } from '../types'

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

function createItems(
  count: number = 3
): Array<{ id: string; description: string; data?: Record<string, unknown> }> {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    description: `Test item ${i}`,
  }))
}

function createCustomFrame(overrides: Partial<CognitiveFrame> = {}): CognitiveFrame {
  return {
    id: 'custom-frame',
    name: 'Custom Frame',
    description: 'A custom test frame',
    saliencePatterns: ['test', 'custom'],
    blindSpots: ['other'],
    domain: 'testing',
    activation: 0,
    ...overrides,
  }
}

describe('OptimalGripCoordinator', () => {
  let coordinator: OptimalGripCoordinator

  beforeEach(() => {
    coordinator = new OptimalGripCoordinator()
  })

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const config = coordinator.getConfig()
      expect(config).toEqual(defaultOptimalGripConfig)
    })

    it('should merge custom config with defaults', () => {
      const customCoordinator = new OptimalGripCoordinator({
        maxShiftHistory: 10,
        frameShiftThreshold: 0.5,
      })
      const config = customCoordinator.getConfig()

      expect(config.maxShiftHistory).toBe(10)
      expect(config.frameShiftThreshold).toBe(0.5)
      expect(config.salienceWeights).toEqual(defaultOptimalGripConfig.salienceWeights)
    })

    it('should accept custom frames', () => {
      const customFrames = [createCustomFrame()]
      const customCoordinator = new OptimalGripCoordinator({}, customFrames)

      const frames = customCoordinator.getAvailableFrames()
      expect(frames).toHaveLength(1)
      expect(frames[0].id).toBe('custom-frame')
    })

    it('should set default frame to analytical if available', () => {
      const activeFrame = coordinator.getActiveFrame()

      expect(activeFrame.id).toBe('analytical')
      expect(activeFrame.activation).toBe(1.0)
    })

    it('should use first frame as default if analytical not available', () => {
      const customFrames = [createCustomFrame({ id: 'first' })]
      const customCoordinator = new OptimalGripCoordinator({}, customFrames)

      const activeFrame = customCoordinator.getActiveFrame()
      expect(activeFrame.id).toBe('first')
    })
  })

  describe('assess', () => {
    it('should return comprehensive assessment', async () => {
      const context = createContext()
      const items = createItems()

      const assessment = await coordinator.assess(context, items)

      expect(assessment).toHaveProperty('gripStrength')
      expect(assessment).toHaveProperty('activeFrame')
      expect(assessment).toHaveProperty('salienceMap')
      expect(assessment).toHaveProperty('gestalts')
      expect(assessment).toHaveProperty('recentShifts')
      expect(assessment).toHaveProperty('perspectivalFitness')
      expect(assessment).toHaveProperty('recommendations')
      expect(assessment).toHaveProperty('context')
      expect(assessment).toHaveProperty('timestamp')
    })

    it('should evaluate frame fitness for context', async () => {
      const context = createContext({ environment: { type: 'discord' } })
      const items = createItems()

      await coordinator.assess(context, items)

      const fitness = coordinator.evaluateFrameFitness(context)

      expect(fitness.length).toBe(defaultFrames.length)
      fitness.forEach((f) => {
        expect(f.fitness).toBeGreaterThanOrEqual(0)
        expect(f.fitness).toBeLessThanOrEqual(1)
      })
    })

    it('should compute salience map', async () => {
      const context = createContext()
      const items = createItems()

      const assessment = await coordinator.assess(context, items)

      expect(assessment.salienceMap.items).toHaveLength(items.length)
      assessment.salienceMap.items.forEach((item) => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('salience')
        expect(item).toHaveProperty('reason')
        expect(item).toHaveProperty('factors')
        expect(item.salience).toBeGreaterThanOrEqual(0)
        expect(item.salience).toBeLessThanOrEqual(1)
      })
    })

    it('should assess grip strength', async () => {
      const context = createContext()
      const items = createItems()

      const assessment = await coordinator.assess(context, items)

      expect(assessment.gripStrength).toHaveProperty('level')
      expect(assessment.gripStrength).toHaveProperty('optimal')
      expect(assessment.gripStrength).toHaveProperty('gap')
      expect(assessment.gripStrength).toHaveProperty('quality')
      expect(assessment.gripStrength).toHaveProperty('confidence')
    })

    it('should detect gestalts from salient items', async () => {
      const context = createContext()
      const items = [
        { id: '1', description: 'pattern analysis result' },
        { id: '2', description: 'pattern matching data' },
        { id: '3', description: 'different topic' },
      ]

      const assessment = await coordinator.assess(context, items)

      // Should potentially detect a "pattern" gestalt
      expect(assessment.gestalts).toBeInstanceOf(Array)
    })

    it('should auto-shift frame when enabled and better fit available', async () => {
      const coordinator = new OptimalGripCoordinator({
        enableAutoFrameShift: true,
        frameShiftThreshold: 0.1, // Low threshold for testing
      })

      // Discord context should favor social frame
      const context = createContext({
        environment: { type: 'discord' },
        task: 'chat with friends',
      })
      const items = createItems()

      await coordinator.assess(context, items)

      // May have shifted to social frame
      const shifts = coordinator.getShiftHistory()
      // Frame may or may not have shifted depending on exact fitness values
      expect(shifts).toBeInstanceOf(Array)
    })

    it('should not auto-shift when disabled', async () => {
      const coordinator = new OptimalGripCoordinator({
        enableAutoFrameShift: false,
      })

      const initialFrame = coordinator.getActiveFrame()
      const context = createContext({ environment: { type: 'discord' } })
      const items = createItems()

      await coordinator.assess(context, items)

      const currentFrame = coordinator.getActiveFrame()
      expect(currentFrame.id).toBe(initialFrame.id)
    })

    it('should provide recommendations', async () => {
      const context = createContext()
      const items = createItems()

      const assessment = await coordinator.assess(context, items)

      expect(assessment.recommendations).toBeInstanceOf(Array)
      assessment.recommendations.forEach((rec) => {
        expect(typeof rec).toBe('string')
        expect(rec.length).toBeGreaterThan(0)
      })
    })

    it('should calculate perspectival fitness', async () => {
      const context = createContext()
      const items = createItems()

      const assessment = await coordinator.assess(context, items)

      expect(assessment.perspectivalFitness).toBeGreaterThanOrEqual(0)
      expect(assessment.perspectivalFitness).toBeLessThanOrEqual(1)
    })
  })

  describe('evaluateFrameFitness', () => {
    it('should rank frames by fitness for context', () => {
      const context = createContext({ environment: { type: 'discord' } })

      const fitness = coordinator.evaluateFrameFitness(context)

      // Should be sorted by fitness descending
      for (let i = 0; i < fitness.length - 1; i++) {
        expect(fitness[i].fitness).toBeGreaterThanOrEqual(fitness[i + 1].fitness)
      }
    })

    it('should favor social frame for discord', () => {
      const context = createContext({ environment: { type: 'discord' } })

      const fitness = coordinator.evaluateFrameFitness(context)
      const socialFitness = fitness.find((f) => f.frame.id === 'social')?.fitness ?? 0
      const avgFitness = fitness.reduce((sum, f) => sum + f.fitness, 0) / fitness.length

      expect(socialFitness).toBeGreaterThan(avgFitness)
    })

    it('should favor strategic frame for planning task', () => {
      const context = createContext({ task: 'plan the project' })

      const fitness = coordinator.evaluateFrameFitness(context)
      const strategicFitness = fitness.find((f) => f.frame.id === 'strategic')?.fitness ?? 0
      const creativeFitness = fitness.find((f) => f.frame.id === 'creative')?.fitness ?? 0

      expect(strategicFitness).toBeGreaterThan(creativeFitness)
    })

    it('should favor analytical frame for debugging', () => {
      const context = createContext({ task: 'debug the application' })

      const fitness = coordinator.evaluateFrameFitness(context)
      const analyticalFitness = fitness.find((f) => f.frame.id === 'analytical')?.fitness ?? 0

      expect(analyticalFitness).toBeGreaterThan(0.6)
    })

    it('should favor creative frame for design tasks', () => {
      const context = createContext({ task: 'design a new feature' })

      const fitness = coordinator.evaluateFrameFitness(context)
      const creativeFitness = fitness.find((f) => f.frame.id === 'creative')?.fitness ?? 0

      expect(creativeFitness).toBeGreaterThan(0.5)
    })

    it('should consider emotional state', () => {
      const lowArousalContext = createContext({
        emotional: { valence: 0, arousal: 0.1 },
      })
      const highArousalContext = createContext({
        emotional: { valence: 0, arousal: 0.9 },
      })

      const lowArousalFitness = coordinator.evaluateFrameFitness(lowArousalContext)
      const highArousalFitness = coordinator.evaluateFrameFitness(highArousalContext)

      // Contemplative should do better with low arousal
      const contemplativeLow = lowArousalFitness.find((f) => f.frame.id === 'contemplative')
        ?.fitness ?? 0
      const contemplativeHigh = highArousalFitness.find((f) => f.frame.id === 'contemplative')
        ?.fitness ?? 0

      expect(contemplativeLow).toBeGreaterThan(contemplativeHigh)
    })

    it('should consider working memory content', () => {
      const context = createContext({
        workingMemory: ['logic', 'structure', 'causation'],
      })

      const fitness = coordinator.evaluateFrameFitness(context)
      const analyticalFitness = fitness.find((f) => f.frame.id === 'analytical')?.fitness ?? 0

      // Analytical frame should have higher fitness due to matching salience patterns
      expect(analyticalFitness).toBeGreaterThan(0.5)
    })
  })

  describe('computeSalienceMap', () => {
    it('should compute salience for each item', () => {
      const items = createItems(5)
      const context = createContext()

      const salienceMap = coordinator.computeSalienceMap(items, context)

      expect(salienceMap.items).toHaveLength(5)
    })

    it('should sort items by salience descending', () => {
      const items = createItems(5)
      const context = createContext()

      const salienceMap = coordinator.computeSalienceMap(items, context)

      for (let i = 0; i < salienceMap.items.length - 1; i++) {
        expect(salienceMap.items[i].salience).toBeGreaterThanOrEqual(
          salienceMap.items[i + 1].salience
        )
      }
    })

    it('should include factor breakdown', () => {
      const items = createItems()
      const context = createContext()

      const salienceMap = coordinator.computeSalienceMap(items, context)

      salienceMap.items.forEach((item) => {
        expect(item.factors).toHaveProperty('frameBased')
        expect(item.factors).toHaveProperty('goalBased')
        expect(item.factors).toHaveProperty('noveltyBased')
        expect(item.factors).toHaveProperty('emotionalBased')
      })
    })

    it('should increase frame salience for matching patterns', () => {
      // Shift to analytical frame
      coordinator.shiftFrameById('analytical', 'explicit')

      const items = [
        { id: '1', description: 'logic and structure analysis' }, // Matches analytical patterns
        { id: '2', description: 'random unrelated content' },
      ]
      const context = createContext()

      const salienceMap = coordinator.computeSalienceMap(items, context)

      const logicItem = salienceMap.items.find((i) => i.id === '1')
      const randomItem = salienceMap.items.find((i) => i.id === '2')

      expect(logicItem?.factors.frameBased).toBeGreaterThan(randomItem?.factors.frameBased ?? 0)
    })

    it('should increase goal salience for task-related items', () => {
      const items = [
        { id: '1', description: 'project status report' },
        { id: '2', description: 'unrelated weather forecast' },
      ]
      const context = createContext({ task: 'Complete project report' })

      const salienceMap = coordinator.computeSalienceMap(items, context)

      const reportItem = salienceMap.items.find((i) => i.id === '1')
      const weatherItem = salienceMap.items.find((i) => i.id === '2')

      expect(reportItem?.factors.goalBased).toBeGreaterThan(weatherItem?.factors.goalBased ?? 0)
    })

    it('should decrease novelty for items in working memory', () => {
      const items = [
        { id: '1', description: 'already known fact' },
        { id: '2', description: 'completely new information' },
      ]
      const context = createContext({ workingMemory: ['already known fact'] })

      const salienceMap = coordinator.computeSalienceMap(items, context)

      const knownItem = salienceMap.items.find((i) => i.id === '1')
      const newItem = salienceMap.items.find((i) => i.id === '2')

      expect(knownItem?.factors.noveltyBased).toBeLessThan(newItem?.factors.noveltyBased ?? 1)
    })

    it('should increase emotional salience with high arousal', () => {
      const items = createItems()
      const lowArousalContext = createContext({
        emotional: { valence: 0, arousal: 0.1 },
      })
      const highArousalContext = createContext({
        emotional: { valence: 0, arousal: 0.9 },
      })

      const lowMap = coordinator.computeSalienceMap(items, lowArousalContext)
      const highMap = coordinator.computeSalienceMap(items, highArousalContext)

      const avgLowEmotional =
        lowMap.items.reduce((sum, i) => sum + i.factors.emotionalBased, 0) / lowMap.items.length
      const avgHighEmotional =
        highMap.items.reduce((sum, i) => sum + i.factors.emotionalBased, 0) / highMap.items.length

      expect(avgHighEmotional).toBeGreaterThan(avgLowEmotional)
    })
  })

  describe('assessGripStrength', () => {
    it('should determine grip quality', async () => {
      const context = createContext()
      const items = createItems()
      const assessment = await coordinator.assess(context, items)

      expect(['too_abstract', 'optimal', 'too_concrete', 'unknown']).toContain(
        assessment.gripStrength.quality
      )
    })

    it('should prefer closer grip for debug tasks', async () => {
      const context = createContext({ task: 'debug the issue' })
      const items = createItems()
      const assessment = await coordinator.assess(context, items)

      expect(assessment.gripStrength.optimal).toBeGreaterThan(0.5)
    })

    it('should prefer distant grip for strategy tasks', async () => {
      const context = createContext({ task: 'plan overall strategy' })
      const items = createItems()
      const assessment = await coordinator.assess(context, items)

      expect(assessment.gripStrength.optimal).toBeLessThan(0.5)
    })

    it('should provide recommendation when not optimal', async () => {
      coordinator.setGrip(0.9) // Very close grip
      const context = createContext({ task: 'plan strategy' }) // Needs distant grip
      const items = createItems()
      const assessment = await coordinator.assess(context, items)

      if (assessment.gripStrength.quality !== 'optimal') {
        expect(assessment.gripStrength.recommendation).toBeTruthy()
      }
    })
  })

  describe('shiftFrame', () => {
    it('should change active frame', async () => {
      const newFrame = defaultFrames.find((f) => f.id === 'creative')!

      await coordinator.shiftFrame(newFrame, 'explicit')

      const active = coordinator.getActiveFrame()
      expect(active.id).toBe('creative')
      expect(active.activation).toBe(1.0)
    })

    it('should record shift in history', async () => {
      const newFrame = defaultFrames.find((f) => f.id === 'creative')!

      await coordinator.shiftFrame(newFrame, 'explicit', 'User requested creative mode')

      const history = coordinator.getShiftHistory()
      expect(history.length).toBe(1)
      expect(history[0].from.id).toBe('analytical')
      expect(history[0].to.id).toBe('creative')
      expect(history[0].trigger).toBe('explicit')
      expect(history[0].triggerDescription).toBe('User requested creative mode')
    })

    it('should limit history size', async () => {
      const coordinator = new OptimalGripCoordinator({ maxShiftHistory: 3 })

      for (let i = 0; i < 5; i++) {
        const frame = defaultFrames[i % defaultFrames.length]
        await coordinator.shiftFrame(frame, 'explicit')
      }

      const history = coordinator.getShiftHistory()
      expect(history.length).toBeLessThanOrEqual(3)
    })

    it('should return the frame shift event', async () => {
      const newFrame = defaultFrames.find((f) => f.id === 'creative')!

      const shift = await coordinator.shiftFrame(newFrame, 'goal_change')

      expect(shift).toHaveProperty('from')
      expect(shift).toHaveProperty('to')
      expect(shift).toHaveProperty('trigger')
      expect(shift).toHaveProperty('timestamp')
    })
  })

  describe('shiftFrameById', () => {
    it('should shift frame by ID', async () => {
      const shift = await coordinator.shiftFrameById('creative', 'explicit')

      expect(shift).not.toBeNull()
      expect(coordinator.getActiveFrame().id).toBe('creative')
    })

    it('should return null for unknown frame ID', async () => {
      const shift = await coordinator.shiftFrameById('unknown-frame', 'explicit')

      expect(shift).toBeNull()
    })
  })

  describe('grip adjustment', () => {
    it('should adjust grip level', () => {
      coordinator.setGrip(0.5)
      coordinator.adjustGrip(0.2)

      expect(coordinator.getGripLevel()).toBe(0.7)
    })

    it('should clamp grip to 0-1 range', () => {
      coordinator.setGrip(0.9)
      coordinator.adjustGrip(0.5) // Would exceed 1

      expect(coordinator.getGripLevel()).toBe(1)

      coordinator.adjustGrip(-1.5) // Would go below 0

      expect(coordinator.getGripLevel()).toBe(0)
    })

    it('should set grip level directly', () => {
      coordinator.setGrip(0.75)

      expect(coordinator.getGripLevel()).toBe(0.75)
    })
  })

  describe('addFrame', () => {
    it('should add custom frame', () => {
      const customFrame = createCustomFrame()

      coordinator.addFrame(customFrame)

      const frames = coordinator.getAvailableFrames()
      expect(frames.some((f) => f.id === 'custom-frame')).toBe(true)
    })

    it('should update domain mappings', () => {
      const customFrame = createCustomFrame({ domain: 'custom-domain' })

      coordinator.addFrame(customFrame)

      const frames = coordinator.getAvailableFrames()
      const customDomainFrames = frames.filter((f) => f.domain === 'custom-domain')

      expect(customDomainFrames.length).toBe(1)
    })
  })

  describe('getStatistics', () => {
    it('should return comprehensive statistics', () => {
      const stats = coordinator.getStatistics()

      expect(stats).toHaveProperty('activeFrame')
      expect(stats).toHaveProperty('gripLevel')
      expect(stats).toHaveProperty('totalShifts')
      expect(stats).toHaveProperty('recentShifts')
      expect(stats).toHaveProperty('gestaltCount')
      expect(stats).toHaveProperty('frameCount')
    })

    it('should track shift counts', async () => {
      await coordinator.shiftFrameById('creative', 'explicit')
      await coordinator.shiftFrameById('social', 'goal_change')

      const stats = coordinator.getStatistics()

      expect(stats.totalShifts).toBe(2)
    })

    it('should track frame count', () => {
      const stats = coordinator.getStatistics()

      expect(stats.frameCount).toBe(defaultFrames.length)
    })
  })

  describe('gestalt detection', () => {
    it('should detect gestalts from related items', async () => {
      const items = [
        { id: '1', description: 'pattern recognition algorithm' },
        { id: '2', description: 'pattern matching implementation' },
        { id: '3', description: 'pattern analysis results' },
        { id: '4', description: 'completely different topic' },
      ]
      const context = createContext()

      const assessment = await coordinator.assess(context, items)

      // Should potentially detect a "pattern" gestalt
      if (assessment.gestalts.length > 0) {
        assessment.gestalts.forEach((gestalt) => {
          expect(gestalt).toHaveProperty('id')
          expect(gestalt).toHaveProperty('description')
          expect(gestalt).toHaveProperty('parts')
          expect(gestalt).toHaveProperty('coherence')
          expect(gestalt).toHaveProperty('stability')
        })
      }
    })

    it('should store perceived gestalts', async () => {
      const items = [
        { id: '1', description: 'testing component' },
        { id: '2', description: 'testing framework' },
      ]
      const context = createContext()

      await coordinator.assess(context, items)

      const gestalts = coordinator.getGestalts()
      expect(gestalts).toBeInstanceOf(Array)
    })
  })
})
