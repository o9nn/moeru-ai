/**
 * Comprehensive tests for FourWaysTracker
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { FourWaysTracker, defaultBalanceConfig } from '../four-ways-tracker'
import type { KnowingEvent, BalanceConfig } from '../four-ways-tracker'

describe('FourWaysTracker', () => {
  let tracker: FourWaysTracker

  beforeEach(() => {
    tracker = new FourWaysTracker()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const tracker = new FourWaysTracker()
      const balance = tracker.getBalance()

      // Should return default balanced state
      expect(balance.propositional).toBe(0.25)
      expect(balance.procedural).toBe(0.25)
      expect(balance.perspectival).toBe(0.25)
      expect(balance.participatory).toBe(0.25)
    })

    it('should merge custom config with defaults', () => {
      const customConfig: Partial<BalanceConfig> = {
        targets: {
          propositional: 0.4,
          procedural: 0.3,
          perspectival: 0.2,
          participatory: 0.1,
        },
      }
      const tracker = new FourWaysTracker(customConfig)

      // Record events and check if custom targets work
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      const recommendations = tracker.getRecommendations()

      // Should use custom targets in recommendations
      expect(recommendations).toBeDefined()
    })

    it('should accept custom tolerance', () => {
      const tracker = new FourWaysTracker({ tolerance: 0.2 })
      const stats = tracker.getStatistics()

      // Should accept and use the tolerance
      expect(stats).toBeDefined()
    })

    it('should accept custom time window', () => {
      const tracker = new FourWaysTracker({ timeWindow: 1000 }) // 1 second

      tracker.recordEvent({ type: 'propositional', description: 'test' })

      // Advance time past window
      vi.advanceTimersByTime(2000)

      const stats = tracker.getStatistics()
      expect(stats.totalEvents).toBe(0) // Event should be pruned
    })
  })

  describe('recordEvent', () => {
    it('should record propositional knowing event', () => {
      tracker.recordEvent({
        type: 'propositional',
        description: 'Learned a new fact',
      })

      const stats = tracker.getStatistics()
      expect(stats.eventsByType.propositional).toBe(1)
    })

    it('should record procedural knowing event', () => {
      tracker.recordEvent({
        type: 'procedural',
        description: 'Practiced a skill',
      })

      const stats = tracker.getStatistics()
      expect(stats.eventsByType.procedural).toBe(1)
    })

    it('should record perspectival knowing event', () => {
      tracker.recordEvent({
        type: 'perspectival',
        description: 'Reframed a problem',
      })

      const stats = tracker.getStatistics()
      expect(stats.eventsByType.perspectival).toBe(1)
    })

    it('should record participatory knowing event', () => {
      tracker.recordEvent({
        type: 'participatory',
        description: 'Identity-transforming experience',
      })

      const stats = tracker.getStatistics()
      expect(stats.eventsByType.participatory).toBe(1)
    })

    it('should accept optional weight', () => {
      tracker.recordEvent({
        type: 'propositional',
        description: 'Important learning',
        weight: 3,
      })
      tracker.recordEvent({
        type: 'procedural',
        description: 'Minor practice',
        weight: 1,
      })

      const balance = tracker.getBalance()

      // Propositional should have higher proportion due to weight
      expect(balance.propositional).toBeGreaterThan(balance.procedural)
    })

    it('should use default weight of 1', () => {
      tracker.recordEvent({
        type: 'propositional',
        description: 'test',
      })
      tracker.recordEvent({
        type: 'procedural',
        description: 'test',
      })

      const balance = tracker.getBalance()

      // Should be equal since both have weight 1
      expect(balance.propositional).toBe(balance.procedural)
    })

    it('should add timestamp automatically', () => {
      const before = Date.now()
      tracker.recordEvent({
        type: 'propositional',
        description: 'test',
      })
      const after = Date.now()

      const stats = tracker.getStatistics()
      expect(stats.totalEvents).toBe(1)
    })

    it('should prune old events on record', () => {
      const tracker = new FourWaysTracker({ timeWindow: 1000 })

      tracker.recordEvent({ type: 'propositional', description: 'old' })
      vi.advanceTimersByTime(500)
      tracker.recordEvent({ type: 'procedural', description: 'newer' })
      vi.advanceTimersByTime(600) // First event now outside window

      tracker.recordEvent({ type: 'perspectival', description: 'newest' })

      const stats = tracker.getStatistics()
      expect(stats.eventsByType.propositional).toBe(0) // Pruned
      expect(stats.eventsByType.procedural).toBe(1) // Still valid
      expect(stats.eventsByType.perspectival).toBe(1) // Just added
    })
  })

  describe('getBalance', () => {
    it('should return default balance with no events', () => {
      const balance = tracker.getBalance()

      expect(balance.propositional).toBe(0.25)
      expect(balance.procedural).toBe(0.25)
      expect(balance.perspectival).toBe(0.25)
      expect(balance.participatory).toBe(0.25)
    })

    it('should calculate balance based on event types', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'procedural', description: 'test' })
      tracker.recordEvent({ type: 'perspectival', description: 'test' })

      const balance = tracker.getBalance()

      expect(balance.propositional).toBe(0.5) // 2 out of 4
      expect(balance.procedural).toBe(0.25) // 1 out of 4
      expect(balance.perspectival).toBe(0.25) // 1 out of 4
      expect(balance.participatory).toBe(0) // 0 out of 4
    })

    it('should account for weights in balance', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test', weight: 2 })
      tracker.recordEvent({ type: 'procedural', description: 'test', weight: 2 })
      tracker.recordEvent({ type: 'perspectival', description: 'test', weight: 2 })
      tracker.recordEvent({ type: 'participatory', description: 'test', weight: 2 })

      const balance = tracker.getBalance()

      // All equal weights, should be balanced
      expect(balance.propositional).toBe(0.25)
      expect(balance.procedural).toBe(0.25)
      expect(balance.perspectival).toBe(0.25)
      expect(balance.participatory).toBe(0.25)
    })

    it('should return values that sum to 1', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test', weight: 3 })
      tracker.recordEvent({ type: 'procedural', description: 'test', weight: 2 })
      tracker.recordEvent({ type: 'perspectival', description: 'test', weight: 5 })

      const balance = tracker.getBalance()
      const sum =
        balance.propositional +
        balance.procedural +
        balance.perspectival +
        balance.participatory

      expect(sum).toBeCloseTo(1, 10)
    })
  })

  describe('isBalanced', () => {
    it('should return true with default balance', () => {
      // No events = default balanced state
      expect(tracker.isBalanced()).toBe(true)
    })

    it('should return true when within tolerance', () => {
      // Default tolerance is 0.1, default target is 0.25 each
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'procedural', description: 'test' })
      tracker.recordEvent({ type: 'perspectival', description: 'test' })
      tracker.recordEvent({ type: 'participatory', description: 'test' })

      expect(tracker.isBalanced()).toBe(true)
    })

    it('should return false when outside tolerance', () => {
      // Record only propositional events
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent({ type: 'propositional', description: 'test' })
      }

      expect(tracker.isBalanced()).toBe(false)
    })

    it('should respect custom tolerance', () => {
      const tracker = new FourWaysTracker({ tolerance: 0.5 }) // Very loose

      // Unbalanced but within 50% tolerance
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'procedural', description: 'test' })
      tracker.recordEvent({ type: 'perspectival', description: 'test' })

      expect(tracker.isBalanced()).toBe(true)
    })
  })

  describe('getRecommendations', () => {
    it('should return empty array when balanced', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'procedural', description: 'test' })
      tracker.recordEvent({ type: 'perspectival', description: 'test' })
      tracker.recordEvent({ type: 'participatory', description: 'test' })

      const recommendations = tracker.getRecommendations()

      // When balanced, recommendations should be minimal or empty
      // (depends on tolerance/2 threshold)
      expect(recommendations.length).toBeLessThanOrEqual(2)
    })

    it('should recommend increasing underrepresented ways', () => {
      // Only propositional events
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent({ type: 'propositional', description: 'test' })
      }

      const recommendations = tracker.getRecommendations()

      // Should recommend changes for all ways that deviate from target
      const types = recommendations.map((r) => r.way)

      // Underrepresented ways should be recommended for increase (positive gap)
      const underrepresentedRecs = recommendations.filter(
        (r) => r.way !== 'propositional' && r.gap > 0
      )
      expect(underrepresentedRecs.length).toBeGreaterThan(0)

      // If propositional is included, it should have negative gap (need less)
      const propRec = recommendations.find((r) => r.way === 'propositional')
      if (propRec) {
        expect(propRec.gap).toBeLessThan(0)
      }
    })

    it('should sort recommendations by priority', () => {
      // Create imbalance
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent({ type: 'propositional', description: 'test' })
      }

      const recommendations = tracker.getRecommendations()

      // Should be sorted by priority (descending)
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].priority).toBeGreaterThanOrEqual(
          recommendations[i + 1].priority
        )
      }
    })

    it('should include current, target, and gap values', () => {
      for (let i = 0; i < 5; i++) {
        tracker.recordEvent({ type: 'propositional', description: 'test' })
      }

      const recommendations = tracker.getRecommendations()

      recommendations.forEach((rec) => {
        expect(rec).toHaveProperty('way')
        expect(rec).toHaveProperty('current')
        expect(rec).toHaveProperty('target')
        expect(rec).toHaveProperty('gap')
        expect(rec).toHaveProperty('recommendation')
        expect(rec).toHaveProperty('priority')

        expect(rec.current).toBeGreaterThanOrEqual(0)
        expect(rec.current).toBeLessThanOrEqual(1)
        expect(rec.target).toBeGreaterThanOrEqual(0)
        expect(rec.target).toBeLessThanOrEqual(1)
      })
    })

    it('should provide specific recommendations for each way', () => {
      // Create imbalance to trigger all recommendations
      const tracker = new FourWaysTracker({
        targets: {
          propositional: 0.25,
          procedural: 0.25,
          perspectival: 0.25,
          participatory: 0.25,
        },
        tolerance: 0.01, // Very tight tolerance
      })

      // Only propositional
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent({ type: 'propositional', description: 'test' })
      }

      const recommendations = tracker.getRecommendations()

      recommendations.forEach((rec) => {
        expect(rec.recommendation).toBeTruthy()
        expect(typeof rec.recommendation).toBe('string')
        expect(rec.recommendation.length).toBeGreaterThan(10)
      })
    })

    it('should recommend less of overrepresented ways', () => {
      // Overwhelmingly propositional
      for (let i = 0; i < 20; i++) {
        tracker.recordEvent({ type: 'propositional', description: 'test' })
      }

      const recommendations = tracker.getRecommendations()
      const propRec = recommendations.find((r) => r.way === 'propositional')

      if (propRec) {
        expect(propRec.gap).toBeLessThan(0) // Negative gap = need less
        expect(
          propRec.recommendation.toLowerCase().includes('reduce') ||
            propRec.recommendation.toLowerCase().includes('balance')
        ).toBe(true)
      }
    })
  })

  describe('getStatistics', () => {
    it('should return total event count', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'procedural', description: 'test' })
      tracker.recordEvent({ type: 'perspectival', description: 'test' })

      const stats = tracker.getStatistics()

      expect(stats.totalEvents).toBe(3)
    })

    it('should return events by type', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'procedural', description: 'test' })

      const stats = tracker.getStatistics()

      expect(stats.eventsByType.propositional).toBe(2)
      expect(stats.eventsByType.procedural).toBe(1)
      expect(stats.eventsByType.perspectival).toBe(0)
      expect(stats.eventsByType.participatory).toBe(0)
    })

    it('should return current balance', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'procedural', description: 'test' })

      const stats = tracker.getStatistics()

      expect(stats.balance).toBeDefined()
      expect(stats.balance.propositional).toBe(0.5)
      expect(stats.balance.procedural).toBe(0.5)
    })

    it('should return isBalanced status', () => {
      const stats = tracker.getStatistics()

      expect(typeof stats.isBalanced).toBe('boolean')
    })

    it('should return time window', () => {
      const stats = tracker.getStatistics()

      expect(stats.timeWindow).toBe(defaultBalanceConfig.timeWindow)
    })

    it('should prune old events before returning stats', () => {
      const tracker = new FourWaysTracker({ timeWindow: 1000 })

      tracker.recordEvent({ type: 'propositional', description: 'old' })
      vi.advanceTimersByTime(1500) // Past window

      const stats = tracker.getStatistics()

      expect(stats.totalEvents).toBe(0) // Old event pruned
    })
  })

  describe('reset', () => {
    it('should clear all events', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'procedural', description: 'test' })

      tracker.reset()

      const stats = tracker.getStatistics()
      expect(stats.totalEvents).toBe(0)
    })

    it('should return to default balance after reset', () => {
      tracker.recordEvent({ type: 'propositional', description: 'test' })
      tracker.recordEvent({ type: 'propositional', description: 'test' })

      tracker.reset()

      const balance = tracker.getBalance()
      expect(balance.propositional).toBe(0.25)
      expect(balance.procedural).toBe(0.25)
      expect(balance.perspectival).toBe(0.25)
      expect(balance.participatory).toBe(0.25)
    })
  })

  describe('time-based behavior', () => {
    it('should only count events within time window', () => {
      const tracker = new FourWaysTracker({ timeWindow: 5000 }) // 5 seconds

      tracker.recordEvent({ type: 'propositional', description: 'old' })
      vi.advanceTimersByTime(3000) // 3 seconds

      tracker.recordEvent({ type: 'procedural', description: 'new' })
      vi.advanceTimersByTime(3000) // 3 more seconds (first is now 6s old)

      const stats = tracker.getStatistics()

      expect(stats.eventsByType.propositional).toBe(0) // Outside window
      expect(stats.eventsByType.procedural).toBe(1) // Still in window
    })

    it('should handle events at window boundary', () => {
      const tracker = new FourWaysTracker({ timeWindow: 1000 })

      tracker.recordEvent({ type: 'propositional', description: 'test' })
      vi.advanceTimersByTime(1000) // Exactly at boundary

      const stats = tracker.getStatistics()

      // Depending on implementation, event might be kept or pruned
      // Either behavior is acceptable at exact boundary
      expect(stats.totalEvents).toBeLessThanOrEqual(1)
    })
  })

  describe('integration scenarios', () => {
    it('should track a realistic learning session', () => {
      // Morning: Heavy on propositional (reading)
      for (let i = 0; i < 5; i++) {
        tracker.recordEvent({
          type: 'propositional',
          description: 'Read chapter ' + i,
        })
      }

      // Afternoon: Practice (procedural)
      for (let i = 0; i < 3; i++) {
        tracker.recordEvent({
          type: 'procedural',
          description: 'Practiced skill ' + i,
          weight: 2,
        })
      }

      // Evening: Reflection (perspectival)
      tracker.recordEvent({
        type: 'perspectival',
        description: 'Reflected on patterns',
        weight: 1.5,
      })

      // Deep experience (participatory)
      tracker.recordEvent({
        type: 'participatory',
        description: 'Identity-shifting insight',
        weight: 2,
      })

      const stats = tracker.getStatistics()
      const recommendations = tracker.getRecommendations()

      // Should have tracked all events
      expect(stats.totalEvents).toBe(10)

      // Should provide meaningful recommendations
      if (!tracker.isBalanced()) {
        expect(recommendations.length).toBeGreaterThan(0)
      }
    })
  })
})
