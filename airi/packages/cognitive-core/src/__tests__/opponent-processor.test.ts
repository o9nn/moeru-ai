/**
 * Comprehensive tests for OpponentProcessor
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { OpponentProcessor } from '../opponent-processor'
import type {
  Position,
  Argument,
  AlternativeFrame,
  AlternativeType,
} from '../opponent-processor'
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

function createCognitiveFrame(overrides: Partial<CognitiveFrame> = {}): CognitiveFrame {
  return {
    id: 'test-frame',
    name: 'Test Frame',
    description: 'A test cognitive frame',
    saliencePatterns: ['pattern1', 'pattern2'],
    blindSpots: ['blindspot1', 'blindspot2'],
    domain: 'testing',
    activation: 0.5,
    ...overrides,
  }
}

function createPosition(overrides: Partial<Position> = {}): Position {
  return {
    claim: 'Test claim',
    arguments: [
      {
        premise: 'Test premise',
        conclusion: 'Test conclusion',
        type: 'deductive',
        strength: 0.7,
      },
    ],
    evidence: ['Evidence 1', 'Evidence 2'],
    assumptions: ['Assumption 1'],
    ...overrides,
  }
}

function createArgument(overrides: Partial<Argument> = {}): Argument {
  return {
    premise: 'Test premise',
    conclusion: 'Test conclusion',
    type: 'deductive',
    strength: 0.7,
    ...overrides,
  }
}

describe('OpponentProcessor', () => {
  let processor: OpponentProcessor

  beforeEach(() => {
    processor = new OpponentProcessor()
  })

  describe('generateAlternatives', () => {
    it('should generate alternative frames', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context)

      expect(alternatives).toBeInstanceOf(Array)
      expect(alternatives.length).toBeGreaterThan(0)
    })

    it('should respect count option', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, { count: 2 })

      expect(alternatives.length).toBeLessThanOrEqual(2)
    })

    it('should filter by minimum novelty', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, {
        minNovelty: 0.5,
      })

      alternatives.forEach((alt) => {
        expect(alt.novelty).toBeGreaterThanOrEqual(0.5)
      })
    })

    it('should generate opposite perspective', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, {
        types: ['opposite'],
      })

      if (alternatives.length > 0) {
        expect(alternatives[0].reasoning).toContain('Opposite')
        expect(alternatives[0].novelty).toBeGreaterThan(0.7) // Opposite should be very novel
      }
    })

    it('should generate orthogonal perspective', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, {
        types: ['orthogonal'],
      })

      if (alternatives.length > 0) {
        expect(alternatives[0].reasoning).toContain('Orthogonal')
      }
    })

    it('should generate domain transfer perspective', () => {
      const frame = createCognitiveFrame({ domain: 'technical' })
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, {
        types: ['domain-transfer'],
      })

      if (alternatives.length > 0) {
        expect(alternatives[0].frame.domain).not.toBe('technical')
      }
    })

    it('should generate scale shift perspective', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, {
        types: ['scale-shift'],
      })

      if (alternatives.length > 0) {
        expect(alternatives[0].reasoning).toContain('scale')
      }
    })

    it('should generate temporal shift perspective', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, {
        types: ['temporal-shift'],
      })

      if (alternatives.length > 0) {
        expect(alternatives[0].reasoning).toContain('Temporal')
      }
    })

    it('should sort alternatives by fitness * novelty', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, {
        count: 5,
        types: ['opposite', 'orthogonal', 'domain-transfer'],
      })

      for (let i = 0; i < alternatives.length - 1; i++) {
        const currentScore = alternatives[i].fitness * alternatives[i].novelty
        const nextScore = alternatives[i + 1].fitness * alternatives[i + 1].novelty
        expect(currentScore).toBeGreaterThanOrEqual(nextScore)
      }
    })

    it('should provide valid alternative frame structure', () => {
      const frame = createCognitiveFrame()
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context)

      alternatives.forEach((alt) => {
        expect(alt).toHaveProperty('frame')
        expect(alt).toHaveProperty('fitness')
        expect(alt).toHaveProperty('novelty')
        expect(alt).toHaveProperty('reasoning')

        expect(alt.frame).toHaveProperty('id')
        expect(alt.frame).toHaveProperty('name')
        expect(alt.frame).toHaveProperty('description')
        expect(alt.frame).toHaveProperty('saliencePatterns')
        expect(alt.frame).toHaveProperty('blindSpots')
      })
    })

    it('should swap salience patterns and blind spots for opposite', () => {
      const frame = createCognitiveFrame({
        saliencePatterns: ['sees this'],
        blindSpots: ['misses this'],
      })
      const context = createContext()

      const alternatives = processor.generateAlternatives(frame, context, {
        types: ['opposite'],
      })

      if (alternatives.length > 0) {
        const opposite = alternatives[0]
        expect(opposite.frame.saliencePatterns).toContain('misses this')
        expect(opposite.frame.blindSpots).toContain('sees this')
      }
    })
  })

  describe('steelMan', () => {
    it('should strengthen a position', () => {
      const position = createPosition({
        arguments: [createArgument({ strength: 0.4 })],
      })
      const context = createContext()

      const result = processor.steelMan(position, context)

      expect(result.strengthenedPosition).toBeDefined()
      expect(result.improvements.length).toBeGreaterThan(0)
    })

    it('should increase argument strength', () => {
      const weakArgument = createArgument({ strength: 0.4 })
      const position = createPosition({ arguments: [weakArgument] })
      const context = createContext()

      const result = processor.steelMan(position, context)

      const strengthenedArg = result.strengthenedPosition.arguments[0]
      expect(strengthenedArg.strength).toBeGreaterThan(weakArgument.strength)
    })

    it('should add supporting arguments when position has few', () => {
      const position = createPosition({ arguments: [] })
      const context = createContext()

      const result = processor.steelMan(position, context)

      expect(result.strengthenedPosition.arguments.length).toBeGreaterThan(0)
      expect(result.improvements.some((i) => i.includes('supporting arguments'))).toBe(
        true
      )
    })

    it('should make assumptions more explicit', () => {
      const position = createPosition({ assumptions: ['Test assumption'] })
      const context = createContext()

      const result = processor.steelMan(position, context)

      expect(
        result.strengthenedPosition.assumptions.some((a) => a.includes('Assuming'))
      ).toBe(true)
    })

    it('should add stronger evidence when position has little', () => {
      const position = createPosition({ evidence: [] })
      const context = createContext()

      const result = processor.steelMan(position, context)

      expect(result.strengthenedPosition.evidence.length).toBeGreaterThan(0)
    })

    it('should preserve original claim', () => {
      const position = createPosition({ claim: 'Original claim' })
      const context = createContext()

      const result = processor.steelMan(position, context)

      expect(result.strengthenedPosition.claim).toBe('Original claim')
    })

    it('should preserve original position', () => {
      const position = createPosition()
      const context = createContext()

      const result = processor.steelMan(position, context)

      expect(result.originalPosition).toEqual(position)
    })

    it('should provide confidence score', () => {
      const position = createPosition()
      const context = createContext()

      const result = processor.steelMan(position, context)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(0.9)
    })
  })

  describe('synthesize', () => {
    it('should create synthesis from thesis and antithesis', () => {
      const thesis = createPosition({ claim: 'Exploration is best' })
      const antithesis = createPosition({ claim: 'Exploitation is best' })
      const context = createContext()

      const result = processor.synthesize(thesis, antithesis, context)

      expect(result.synthesis).toBeDefined()
      expect(result.synthesis.claim).toBeTruthy()
    })

    it('should preserve common ground', () => {
      const thesis = createPosition({
        assumptions: ['Learning is valuable'],
      })
      const antithesis = createPosition({
        assumptions: ['Learning is valuable', 'Efficiency matters'],
      })
      const context = createContext()

      const result = processor.synthesize(thesis, antithesis, context)

      expect(result.preserves.length).toBeGreaterThan(0)
    })

    it('should identify transcended elements', () => {
      const thesis = createPosition()
      const antithesis = createPosition()
      const context = createContext()

      const result = processor.synthesize(thesis, antithesis, context)

      expect(result.transcends.length).toBeGreaterThan(0)
      expect(result.transcends.some((t) => t.toLowerCase().includes('binary'))).toBe(true)
    })

    it('should identify emergent insights', () => {
      const thesis = createPosition()
      const antithesis = createPosition()
      const context = createContext()

      const result = processor.synthesize(thesis, antithesis, context)

      expect(result.emergent.length).toBeGreaterThan(0)
    })

    it('should combine evidence from both positions', () => {
      const thesis = createPosition({ evidence: ['Evidence A'] })
      const antithesis = createPosition({ evidence: ['Evidence B'] })
      const context = createContext()

      const result = processor.synthesize(thesis, antithesis, context)

      expect(result.synthesis.evidence).toContain('Evidence A')
      expect(result.synthesis.evidence).toContain('Evidence B')
    })

    it('should provide quality assessment', () => {
      const thesis = createPosition()
      const antithesis = createPosition()
      const context = createContext()

      const result = processor.synthesize(thesis, antithesis, context)

      expect(result.quality).toBeGreaterThanOrEqual(0)
      expect(result.quality).toBeLessThanOrEqual(1)
    })

    it('should create synthesis arguments', () => {
      const thesis = createPosition()
      const antithesis = createPosition()
      const context = createContext()

      const result = processor.synthesize(thesis, antithesis, context)

      expect(result.synthesis.arguments.length).toBeGreaterThan(0)
      result.synthesis.arguments.forEach((arg) => {
        expect(arg).toHaveProperty('premise')
        expect(arg).toHaveProperty('conclusion')
        expect(arg).toHaveProperty('type')
        expect(arg).toHaveProperty('strength')
      })
    })

    it('should preserve original thesis and antithesis', () => {
      const thesis = createPosition({ claim: 'Thesis claim' })
      const antithesis = createPosition({ claim: 'Antithesis claim' })
      const context = createContext()

      const result = processor.synthesize(thesis, antithesis, context)

      expect(result.thesis).toEqual(thesis)
      expect(result.antithesis).toEqual(antithesis)
    })
  })

  describe('detectBiases', () => {
    describe('confirmation bias', () => {
      it('should detect when all evidence supports position', () => {
        const position = createPosition({
          evidence: ['Supports claim', 'Also supports claim', 'More support'],
        })
        const context = createContext()

        const result = processor.detectBiases(position, context)

        const confirmationBias = result.biasesDetected.find(
          (b) => b.type === 'confirmation'
        )
        expect(confirmationBias).toBeDefined()
      })

      it('should not detect confirmation bias with counter-evidence', () => {
        const position = createPosition({
          evidence: ['Supports claim', 'However, this contradicts'],
        })
        const context = createContext()

        const result = processor.detectBiases(position, context)

        const confirmationBias = result.biasesDetected.find(
          (b) => b.type === 'confirmation'
        )
        expect(confirmationBias).toBeUndefined()
      })
    })

    describe('availability bias', () => {
      it('should detect over-reliance on recent examples', () => {
        const position = createPosition({
          evidence: ['This just happened recently'],
        })
        const context = createContext()

        const result = processor.detectBiases(position, context)

        const availabilityBias = result.biasesDetected.find(
          (b) => b.type === 'availability'
        )
        expect(availabilityBias).toBeDefined()
      })
    })

    describe('anchoring bias', () => {
      it('should detect when position anchored to initial view', () => {
        const position = createPosition({ claim: 'Current position' })
        const history = [createPosition({ claim: 'Current position similar' })]
        const context = createContext()

        const result = processor.detectBiases(position, context, history)

        const anchoringBias = result.biasesDetected.find((b) => b.type === 'anchoring')
        expect(anchoringBias).toBeDefined()
      })

      it('should not detect anchoring without history', () => {
        const position = createPosition()
        const context = createContext()

        const result = processor.detectBiases(position, context)

        const anchoringBias = result.biasesDetected.find((b) => b.type === 'anchoring')
        expect(anchoringBias).toBeUndefined()
      })
    })

    describe('recency bias', () => {
      it('should detect when majority of evidence is recent', () => {
        const position = createPosition({
          evidence: ['recent event', 'latest data', 'now happening'],
        })
        const context = createContext()

        const result = processor.detectBiases(position, context, [createPosition()])

        const recencyBias = result.biasesDetected.find((b) => b.type === 'recency')
        expect(recencyBias).toBeDefined()
      })
    })

    describe('affect heuristic', () => {
      it('should detect when strong emotions may influence reasoning', () => {
        const position = createPosition()
        const context = createContext({
          emotional: { valence: 0.9, arousal: 0.9 },
        })

        const result = processor.detectBiases(position, context)

        const affectBias = result.biasesDetected.find((b) => b.type === 'affect')
        expect(affectBias).toBeDefined()
      })

      it('should not detect affect bias with calm emotional state', () => {
        const position = createPosition()
        const context = createContext({
          emotional: { valence: 0.2, arousal: 0.2 },
        })

        const result = processor.detectBiases(position, context)

        const affectBias = result.biasesDetected.find((b) => b.type === 'affect')
        expect(affectBias).toBeUndefined()
      })
    })

    describe('bias assessment structure', () => {
      it('should provide confidence score', () => {
        const position = createPosition()
        const context = createContext()

        const result = processor.detectBiases(position, context)

        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      })

      it('should provide recommendations', () => {
        const position = createPosition()
        const context = createContext()

        const result = processor.detectBiases(position, context)

        expect(result.recommendations).toBeInstanceOf(Array)
        expect(result.recommendations.length).toBeGreaterThan(0)
      })

      it('should provide mitigation for each detected bias', () => {
        const position = createPosition({
          evidence: ['recent', 'latest', 'now'],
        })
        const context = createContext({
          emotional: { valence: 0.9, arousal: 0.9 },
        })

        const result = processor.detectBiases(position, context, [createPosition()])

        result.biasesDetected.forEach((bias) => {
          expect(bias.mitigation).toBeTruthy()
          expect(typeof bias.mitigation).toBe('string')
        })
      })

      it('should include severity for each detected bias', () => {
        const position = createPosition({
          evidence: ['recent event', 'Supports claim', 'More support', 'Even more'],
        })
        const context = createContext()

        const result = processor.detectBiases(position, context)

        result.biasesDetected.forEach((bias) => {
          expect(bias.severity).toBeGreaterThanOrEqual(0)
          expect(bias.severity).toBeLessThanOrEqual(1)
        })
      })
    })

    it('should provide positive message when no biases detected', () => {
      const position = createPosition({
        evidence: ['Evidence but also counterevidence'],
      })
      const context = createContext({
        emotional: { valence: 0.3, arousal: 0.3 },
      })

      const result = processor.detectBiases(position, context)

      if (result.biasesDetected.length === 0) {
        expect(
          result.recommendations.some((r) =>
            r.toLowerCase().includes('no significant biases')
          )
        ).toBe(true)
      }
    })
  })

  describe('integration scenarios', () => {
    it('should support full dialectical workflow', () => {
      const context = createContext()

      // Start with a position
      const thesis = createPosition({ claim: 'Speed is most important' })

      // Generate alternative
      const frame = createCognitiveFrame({ name: 'Speed-focused' })
      const alternatives = processor.generateAlternatives(frame, context)

      expect(alternatives.length).toBeGreaterThan(0)

      // Create antithesis
      const antithesis = createPosition({ claim: 'Quality is most important' })

      // Steel-man both positions
      const steelThesis = processor.steelMan(thesis, context)
      const steelAntithesis = processor.steelMan(antithesis, context)

      expect(steelThesis.strengthenedPosition).toBeDefined()
      expect(steelAntithesis.strengthenedPosition).toBeDefined()

      // Synthesize
      const synthesis = processor.synthesize(
        steelThesis.strengthenedPosition,
        steelAntithesis.strengthenedPosition,
        context
      )

      expect(synthesis.synthesis.claim).toBeTruthy()
      expect(synthesis.quality).toBeGreaterThan(0)

      // Check for biases in synthesis
      const biasCheck = processor.detectBiases(synthesis.synthesis, context)

      expect(biasCheck).toBeDefined()
    })
  })
})
