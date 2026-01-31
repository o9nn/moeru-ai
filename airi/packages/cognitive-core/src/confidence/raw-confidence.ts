/**
 * Raw Confidence Calculator
 * 
 * Calculates raw confidence scores based on multiple factors
 * before calibration is applied.
 */

import type { CognitiveContext, Possibility, RelevanceScore } from '../types'
import type { RawConfidence, RawConfidenceFactors, OutcomeRecord } from './types'

/**
 * Configuration for raw confidence calculation
 */
export interface RawConfidenceConfig {
  /** Weights for combining factors */
  weights: {
    componentAgreement: number
    evidenceStrength: number
    contextFamiliarity: number
    predictionStability: number
    historicalAccuracy: number
  }
  
  /** Default historical accuracy when no data */
  defaultHistoricalAccuracy: number
  
  /** Number of perturbations for stability check */
  stabilityPerturbations: number
  
  /** Perturbation magnitude */
  perturbationMagnitude: number
}

/**
 * Default raw confidence configuration
 */
export const defaultRawConfidenceConfig: RawConfidenceConfig = {
  weights: {
    componentAgreement: 0.25,
    evidenceStrength: 0.20,
    contextFamiliarity: 0.15,
    predictionStability: 0.15,
    historicalAccuracy: 0.25,
  },
  defaultHistoricalAccuracy: 0.5,
  stabilityPerturbations: 5,
  perturbationMagnitude: 0.1,
}

/**
 * Raw Confidence Calculator
 */
export class RawConfidenceCalculator {
  private config: RawConfidenceConfig
  private outcomeHistory: OutcomeRecord[] = []
  private contextSignatures: Map<string, { successes: number; total: number }> = new Map()
  
  constructor(config: Partial<RawConfidenceConfig> = {}) {
    this.config = { 
      ...defaultRawConfidenceConfig, 
      ...config,
      weights: { ...defaultRawConfidenceConfig.weights, ...config.weights },
    }
  }
  
  /**
   * Calculate raw confidence for a relevance assessment
   */
  calculate(
    possibility: Possibility,
    context: CognitiveContext,
    components: RelevanceScore['components']
  ): RawConfidence {
    const factors = this.calculateFactors(possibility, context, components)
    
    // Weighted combination
    const value = 
      this.config.weights.componentAgreement * factors.componentAgreement +
      this.config.weights.evidenceStrength * factors.evidenceStrength +
      this.config.weights.contextFamiliarity * factors.contextFamiliarity +
      this.config.weights.predictionStability * factors.predictionStability +
      this.config.weights.historicalAccuracy * factors.historicalAccuracy
    
    // Calculate uncertainty (inverse of confidence in the confidence)
    const uncertainty = this.calculateUncertainty(factors)
    
    return {
      value: Math.max(0, Math.min(1, value)),
      factors,
      uncertainty,
    }
  }
  
  /**
   * Calculate all confidence factors
   */
  private calculateFactors(
    possibility: Possibility,
    context: CognitiveContext,
    components: RelevanceScore['components']
  ): RawConfidenceFactors {
    return {
      componentAgreement: this.calculateComponentAgreement(components),
      evidenceStrength: this.calculateEvidenceStrength(possibility, context),
      contextFamiliarity: this.calculateContextFamiliarity(context),
      predictionStability: this.calculatePredictionStability(components),
      historicalAccuracy: this.calculateHistoricalAccuracy(possibility.type, context),
    }
  }
  
  /**
   * Calculate component agreement (how aligned are the scores)
   * 
   * High agreement = components tell a consistent story
   * Low agreement = mixed signals
   */
  private calculateComponentAgreement(components: RelevanceScore['components']): number {
    const values = Object.values(components)
    const n = values.length
    
    if (n === 0) return 0.5
    
    // Calculate mean and variance
    const mean = values.reduce((a, b) => a + b, 0) / n
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n
    const stdDev = Math.sqrt(variance)
    
    // Convert to agreement score (lower variance = higher agreement)
    // Max possible stdDev for [0,1] values is 0.5
    const normalizedStdDev = stdDev / 0.5
    return 1 - normalizedStdDev
  }
  
  /**
   * Calculate evidence strength
   * 
   * Based on how much supporting information is available
   */
  private calculateEvidenceStrength(
    possibility: Possibility,
    context: CognitiveContext
  ): number {
    let strength = 0.5 // Base strength
    
    // More working memory items = more context = stronger evidence
    const wmFactor = Math.min(1, context.workingMemory.length / 10)
    strength += 0.2 * wmFactor
    
    // Having a task provides clearer evaluation criteria
    if (context.task) {
      strength += 0.1
    }
    
    // Attention focus provides grounding
    if (context.attentionFocus) {
      strength += 0.1
    }
    
    // Recent history provides temporal context
    if (context.recentHistory && context.recentHistory.length > 0) {
      strength += 0.1
    }
    
    // Possibility has additional data
    if (possibility.data && Object.keys(possibility.data).length > 0) {
      strength += 0.1
    }
    
    return Math.min(1, strength)
  }
  
  /**
   * Calculate context familiarity
   * 
   * How similar is this context to ones we've seen before?
   */
  private calculateContextFamiliarity(context: CognitiveContext): number {
    const signature = this.getContextSignature(context)
    const record = this.contextSignatures.get(signature)
    
    if (!record) {
      return 0.3 // Unknown context = low familiarity
    }
    
    // More observations = more familiarity
    const observationFactor = Math.min(1, record.total / 20)
    
    // Higher success rate in this context = more confidence
    const successRate = record.total > 0 ? record.successes / record.total : 0.5
    
    return 0.3 + 0.4 * observationFactor + 0.3 * successRate
  }
  
  /**
   * Calculate prediction stability
   * 
   * How stable is the prediction to small perturbations?
   */
  private calculatePredictionStability(components: RelevanceScore['components']): number {
    const values = Object.values(components)
    
    if (values.length === 0) return 0.5
    
    // Simulate perturbations and measure variance in overall score
    const perturbedScores: number[] = []
    
    for (let i = 0; i < this.config.stabilityPerturbations; i++) {
      const perturbedValues = values.map(v => {
        const perturbation = (Math.random() - 0.5) * 2 * this.config.perturbationMagnitude
        return Math.max(0, Math.min(1, v + perturbation))
      })
      
      const perturbedMean = perturbedValues.reduce((a, b) => a + b, 0) / perturbedValues.length
      perturbedScores.push(perturbedMean)
    }
    
    // Calculate variance of perturbed scores
    const mean = perturbedScores.reduce((a, b) => a + b, 0) / perturbedScores.length
    const variance = perturbedScores.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / perturbedScores.length
    const stdDev = Math.sqrt(variance)
    
    // Lower variance = higher stability
    // Normalize by perturbation magnitude
    const normalizedStdDev = stdDev / this.config.perturbationMagnitude
    return Math.max(0, 1 - normalizedStdDev)
  }
  
  /**
   * Calculate historical accuracy
   * 
   * How accurate have we been for similar assessments?
   */
  private calculateHistoricalAccuracy(
    possibilityType: Possibility['type'],
    context: CognitiveContext
  ): number {
    // Filter relevant history
    const relevant = this.outcomeHistory.filter(record => {
      // Same possibility type
      if (record.possibility.type !== possibilityType) return false
      
      // Similar environment
      if (record.contextFeatures['environment.type'] !== context.environment.type) return false
      
      return true
    })
    
    if (relevant.length < 5) {
      return this.config.defaultHistoricalAccuracy
    }
    
    // Calculate accuracy (how often high confidence led to success)
    const highConfidence = relevant.filter(r => r.calibratedConfidence >= 0.6)
    const lowConfidence = relevant.filter(r => r.calibratedConfidence < 0.4)
    
    let accuracy = 0.5
    
    if (highConfidence.length > 0) {
      const highConfSuccessRate = highConfidence.filter(r => r.outcome === 'success').length / highConfidence.length
      accuracy = 0.5 + 0.25 * (highConfSuccessRate - 0.5) * 2
    }
    
    if (lowConfidence.length > 0) {
      const lowConfFailureRate = lowConfidence.filter(r => r.outcome === 'failure').length / lowConfidence.length
      accuracy += 0.25 * (lowConfFailureRate - 0.5) * 2
    }
    
    return Math.max(0, Math.min(1, accuracy))
  }
  
  /**
   * Calculate uncertainty in the confidence estimate
   */
  private calculateUncertainty(factors: RawConfidenceFactors): number {
    // High uncertainty when:
    // - Low component agreement (mixed signals)
    // - Low evidence strength (not much to go on)
    // - Low context familiarity (unfamiliar territory)
    // - Low prediction stability (sensitive to noise)
    
    const uncertaintyFactors = [
      1 - factors.componentAgreement,
      1 - factors.evidenceStrength,
      1 - factors.contextFamiliarity,
      1 - factors.predictionStability,
    ]
    
    // Take max uncertainty (most uncertain factor dominates)
    const maxUncertainty = Math.max(...uncertaintyFactors)
    
    // Also consider average
    const avgUncertainty = uncertaintyFactors.reduce((a, b) => a + b, 0) / uncertaintyFactors.length
    
    // Blend max and average
    return 0.6 * maxUncertainty + 0.4 * avgUncertainty
  }
  
  /**
   * Get a signature for a context (for grouping similar contexts)
   */
  private getContextSignature(context: CognitiveContext): string {
    const parts = [
      context.environment.type,
      context.task ? 'has_task' : 'no_task',
      context.attentionFocus ? 'has_focus' : 'no_focus',
    ]
    return parts.join(':')
  }
  
  /**
   * Record an outcome for learning
   */
  recordOutcome(record: OutcomeRecord): void {
    this.outcomeHistory.push(record)
    
    // Update context signature statistics
    const signature = record.contextFeatures['contextSignature'] as string
    if (signature) {
      const existing = this.contextSignatures.get(signature) || { successes: 0, total: 0 }
      existing.total++
      if (record.outcome === 'success') {
        existing.successes++
      }
      this.contextSignatures.set(signature, existing)
    }
    
    // Trim history if too large
    if (this.outcomeHistory.length > 1000) {
      this.outcomeHistory = this.outcomeHistory.slice(-1000)
    }
  }
  
  /**
   * Get outcome history
   */
  getHistory(): OutcomeRecord[] {
    return [...this.outcomeHistory]
  }
  
  /**
   * Set outcome history (for loading saved state)
   */
  setHistory(history: OutcomeRecord[]): void {
    this.outcomeHistory = [...history]
    
    // Rebuild context signatures
    this.contextSignatures.clear()
    for (const record of history) {
      const signature = record.contextFeatures['contextSignature'] as string
      if (signature) {
        const existing = this.contextSignatures.get(signature) || { successes: 0, total: 0 }
        existing.total++
        if (record.outcome === 'success') {
          existing.successes++
        }
        this.contextSignatures.set(signature, existing)
      }
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<RawConfidenceConfig>): void {
    this.config = { 
      ...this.config, 
      ...config,
      weights: { ...this.config.weights, ...config.weights },
    }
  }
}

/**
 * Create a raw confidence calculator
 */
export function createRawConfidenceCalculator(
  config?: Partial<RawConfidenceConfig>
): RawConfidenceCalculator {
  return new RawConfidenceCalculator(config)
}
