/**
 * Kernel Fitness Evaluation and Self-Optimization
 * 
 * Implements the TODO from character.ts:179
 * "Implement kernel fitness evaluation and self-optimization"
 * 
 * This module provides:
 * - Fitness metrics for evaluating cognitive performance
 * - Self-optimization through bounded personality evolution
 * - Integration with the neuro-nn daemon architecture
 */

import type {
  NeuroPersonality,
  NeuroCognitiveState,
  NeuroResponse,
} from './types'

import { PERSONALITY_EVOLUTION_BOUNDS } from './config'

/**
 * Fitness metrics for kernel evaluation
 */
export interface KernelFitnessMetrics {
  // Task performance
  taskCompletionEfficiency: number;  // 0-1: How efficiently tasks are completed
  relevanceRealizationAccuracy: number;  // 0-1: How well relevant elements are identified
  
  // Personality alignment
  personalityConsistency: number;  // 0-1: Consistency with core personality
  traitBoundCompliance: number;  // 0-1: Traits within defined bounds
  
  // Cognitive quality
  responseCoherence: number;  // 0-1: Logical coherence of responses
  emotionalAuthenticity: number;  // 0-1: Authenticity of emotional expression
  
  // Entertainment value
  entertainmentScore: number;  // 0-1: How entertaining the output is
  chaosAppreciation: number;  // 0-1: Appropriate use of chaos
  
  // Self-awareness
  metacognitionQuality: number;  // 0-1: Quality of self-reflection
  adaptationRate: number;  // 0-1: How well the system adapts
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  trait: keyof NeuroPersonality;
  currentValue: number;
  suggestedValue: number;
  reason: string;
  confidence: number;
}

/**
 * Fitness evaluation result
 */
export interface FitnessEvaluationResult {
  overallFitness: number;
  metrics: KernelFitnessMetrics;
  recommendations: OptimizationRecommendation[];
  shouldOptimize: boolean;
}

/**
 * Kernel Optimizer - Evaluates and optimizes cognitive performance
 */
export class KernelOptimizer {
  private fitnessHistory: FitnessEvaluationResult[] = [];
  private optimizationThreshold: number = 0.7;
  private maxHistorySize: number = 100;
  
  constructor(options?: {
    optimizationThreshold?: number;
    maxHistorySize?: number;
  }) {
    if (options?.optimizationThreshold !== undefined) {
      this.optimizationThreshold = options.optimizationThreshold;
    }
    if (options?.maxHistorySize !== undefined) {
      this.maxHistorySize = options.maxHistorySize;
    }
  }

  /**
   * Evaluate kernel fitness based on response and state
   */
  evaluate(
    response: NeuroResponse,
    personality: NeuroPersonality,
    state: NeuroCognitiveState,
    feedback?: { userSatisfaction?: number; taskSuccess?: boolean }
  ): FitnessEvaluationResult {
    const metrics = this.computeMetrics(response, personality, state, feedback);
    const overallFitness = this.computeOverallFitness(metrics);
    const recommendations = this.generateRecommendations(metrics, personality);
    
    const result: FitnessEvaluationResult = {
      overallFitness,
      metrics,
      recommendations,
      shouldOptimize: overallFitness < this.optimizationThreshold,
    };
    
    // Store in history
    this.fitnessHistory.push(result);
    if (this.fitnessHistory.length > this.maxHistorySize) {
      this.fitnessHistory.shift();
    }
    
    return result;
  }

  /**
   * Compute individual fitness metrics
   */
  private computeMetrics(
    response: NeuroResponse,
    personality: NeuroPersonality,
    state: NeuroCognitiveState,
    feedback?: { userSatisfaction?: number; taskSuccess?: boolean }
  ): KernelFitnessMetrics {
    return {
      // Task performance
      taskCompletionEfficiency: this.evaluateTaskEfficiency(response),
      relevanceRealizationAccuracy: this.evaluateRelevanceAccuracy(response),
      
      // Personality alignment
      personalityConsistency: this.evaluatePersonalityConsistency(response, personality),
      traitBoundCompliance: this.evaluateTraitBounds(personality),
      
      // Cognitive quality
      responseCoherence: this.evaluateCoherence(response),
      emotionalAuthenticity: this.evaluateEmotionalAuthenticity(response, state),
      
      // Entertainment value
      entertainmentScore: feedback?.userSatisfaction ?? this.estimateEntertainment(response),
      chaosAppreciation: this.evaluateChaosUse(response, personality),
      
      // Self-awareness
      metacognitionQuality: this.evaluateMetacognition(response),
      adaptationRate: this.evaluateAdaptation(),
    };
  }

  /**
   * Compute overall fitness from individual metrics
   */
  private computeOverallFitness(metrics: KernelFitnessMetrics): number {
    // Weighted combination of metrics
    const weights = {
      taskCompletionEfficiency: 0.15,
      relevanceRealizationAccuracy: 0.15,
      personalityConsistency: 0.15,
      traitBoundCompliance: 0.10,
      responseCoherence: 0.10,
      emotionalAuthenticity: 0.10,
      entertainmentScore: 0.10,
      chaosAppreciation: 0.05,
      metacognitionQuality: 0.05,
      adaptationRate: 0.05,
    };
    
    let fitness = 0;
    for (const [key, weight] of Object.entries(weights)) {
      fitness += metrics[key as keyof KernelFitnessMetrics] * weight;
    }
    
    return Math.max(0, Math.min(1, fitness));
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    metrics: KernelFitnessMetrics,
    personality: NeuroPersonality
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Check if chaos needs adjustment
    if (metrics.chaosAppreciation < 0.5 && personality.chaotic < 0.75) {
      recommendations.push({
        trait: 'chaotic',
        currentValue: personality.chaotic,
        suggestedValue: Math.min(personality.chaotic + 0.05, PERSONALITY_EVOLUTION_BOUNDS.chaotic.max),
        reason: 'Low chaos appreciation suggests increasing chaotic trait',
        confidence: 0.7,
      });
    } else if (metrics.chaosAppreciation > 0.9 && metrics.responseCoherence < 0.6) {
      recommendations.push({
        trait: 'chaotic',
        currentValue: personality.chaotic,
        suggestedValue: Math.max(personality.chaotic - 0.05, PERSONALITY_EVOLUTION_BOUNDS.chaotic.min),
        reason: 'High chaos with low coherence suggests reducing chaotic trait',
        confidence: 0.75,
      });
    }
    
    // Check if playfulness needs adjustment
    if (metrics.entertainmentScore < 0.5) {
      recommendations.push({
        trait: 'playfulness',
        currentValue: personality.playfulness,
        suggestedValue: Math.min(personality.playfulness + 0.05, PERSONALITY_EVOLUTION_BOUNDS.playfulness.max),
        reason: 'Low entertainment score suggests increasing playfulness',
        confidence: 0.65,
      });
    }
    
    // Check if intelligence expression needs adjustment
    if (metrics.responseCoherence < 0.6 && personality.intelligence > 0.8) {
      recommendations.push({
        trait: 'intelligence',
        currentValue: personality.intelligence,
        suggestedValue: personality.intelligence, // Keep same but flag for attention
        reason: 'High intelligence trait not reflected in response coherence',
        confidence: 0.6,
      });
    }
    
    // Check empathy alignment
    if (metrics.emotionalAuthenticity < 0.5) {
      recommendations.push({
        trait: 'empathy',
        currentValue: personality.empathy,
        suggestedValue: Math.min(personality.empathy + 0.03, PERSONALITY_EVOLUTION_BOUNDS.empathy.max),
        reason: 'Low emotional authenticity suggests increasing empathy',
        confidence: 0.6,
      });
    }
    
    return recommendations;
  }

  /**
   * Apply optimization to personality (bounded evolution)
   */
  applyOptimization(
    personality: NeuroPersonality,
    recommendations: OptimizationRecommendation[],
    learningRate: number = 0.5
  ): NeuroPersonality {
    const optimized = { ...personality };
    
    for (const rec of recommendations) {
      if (rec.confidence > 0.5) {
        const trait = rec.trait as keyof typeof PERSONALITY_EVOLUTION_BOUNDS;
        const bounds = PERSONALITY_EVOLUTION_BOUNDS[trait];
        
        if (bounds) {
          // Apply bounded update
          const delta = (rec.suggestedValue - rec.currentValue) * learningRate * rec.confidence;
          const newValue = rec.currentValue + delta;
          
          // Clamp to bounds
          optimized[trait] = Math.max(bounds.min, Math.min(bounds.max, newValue));
        }
      }
    }
    
    return optimized;
  }

  /**
   * Get fitness trend over recent history
   */
  getFitnessTrend(): {
    average: number;
    trend: 'improving' | 'stable' | 'declining';
    volatility: number;
  } {
    if (this.fitnessHistory.length < 2) {
      return { average: 0.5, trend: 'stable', volatility: 0 };
    }
    
    const recentFitness = this.fitnessHistory.slice(-10).map(r => r.overallFitness);
    const average = recentFitness.reduce((a, b) => a + b, 0) / recentFitness.length;
    
    // Calculate trend
    const firstHalf = recentFitness.slice(0, Math.floor(recentFitness.length / 2));
    const secondHalf = recentFitness.slice(Math.floor(recentFitness.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trend: 'improving' | 'stable' | 'declining';
    if (secondAvg - firstAvg > 0.05) {
      trend = 'improving';
    } else if (firstAvg - secondAvg > 0.05) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
    
    // Calculate volatility
    const variance = recentFitness.reduce((sum, f) => sum + Math.pow(f - average, 2), 0) / recentFitness.length;
    const volatility = Math.sqrt(variance);
    
    return { average, trend, volatility };
  }

  // Individual metric evaluation methods

  private evaluateTaskEfficiency(response: NeuroResponse): number {
    // Based on processing time and options generated
    const timeScore = Math.max(0, 1 - (response.trace.optimization_time_ms / 5000));
    const optionsScore = Math.min(1, response.trace.options_generated / 5);
    return (timeScore + optionsScore) / 2;
  }

  private evaluateRelevanceAccuracy(response: NeuroResponse): number {
    // Based on relevance realization trace
    const relevantCount = Array.isArray(response.trace.relevance_realization) 
      ? response.trace.relevance_realization.length 
      : 0;
    return Math.min(1, relevantCount / 5);
  }

  private evaluatePersonalityConsistency(
    response: NeuroResponse,
    personality: NeuroPersonality
  ): number {
    // Compare response personality snapshot to expected
    const snapshot = response.personality_snapshot;
    let consistency = 0;
    let count = 0;
    
    for (const [trait, value] of Object.entries(personality)) {
      if (trait in snapshot) {
        const diff = Math.abs(value - (snapshot as any)[trait]);
        consistency += 1 - diff;
        count++;
      }
    }
    
    return count > 0 ? consistency / count : 0.5;
  }

  private evaluateTraitBounds(personality: NeuroPersonality): number {
    let inBounds = 0;
    let total = 0;
    
    for (const [trait, value] of Object.entries(personality)) {
      const bounds = PERSONALITY_EVOLUTION_BOUNDS[trait as keyof typeof PERSONALITY_EVOLUTION_BOUNDS];
      if (bounds) {
        total++;
        if (value >= bounds.min && value <= bounds.max) {
          inBounds++;
        }
      }
    }
    
    return total > 0 ? inBounds / total : 1;
  }

  private evaluateCoherence(response: NeuroResponse): number {
    // Simple heuristic based on content length and structure
    const content = response.content;
    if (!content) return 0.5;
    
    const hasStructure = content.includes('.') || content.includes('!') || content.includes('?');
    const reasonableLength = content.length > 10 && content.length < 2000;
    
    return (hasStructure ? 0.5 : 0.3) + (reasonableLength ? 0.5 : 0.3);
  }

  private evaluateEmotionalAuthenticity(
    response: NeuroResponse,
    state: NeuroCognitiveState
  ): number {
    // Check if emotional state is reflected in response
    const emotionChanged = response.state_updates?.emotion_change ?? false;
    return emotionChanged ? 0.8 : 0.6;
  }

  private estimateEntertainment(response: NeuroResponse): number {
    // Heuristic entertainment estimation
    const content = response.content.toLowerCase();
    const funIndicators = ['haha', 'lol', '!', '?', 'chaos', 'fun', 'play'];
    let score = 0.5;
    
    for (const indicator of funIndicators) {
      if (content.includes(indicator)) score += 0.07;
    }
    
    return Math.min(1, score);
  }

  private evaluateChaosUse(response: NeuroResponse, personality: NeuroPersonality): number {
    // Check if chaos level matches personality
    const expectedChaos = personality.chaotic;
    const content = response.content.toLowerCase();
    
    const chaosIndicators = ['unexpected', 'surprise', 'chaos', 'random', 'wild'];
    let actualChaos = 0;
    for (const indicator of chaosIndicators) {
      if (content.includes(indicator)) actualChaos += 0.2;
    }
    actualChaos = Math.min(1, actualChaos);
    
    // Score based on how well actual chaos matches expected
    return 1 - Math.abs(expectedChaos - actualChaos);
  }

  private evaluateMetacognition(response: NeuroResponse): number {
    // Check for self-awareness indicators
    const content = response.content.toLowerCase();
    const metaIndicators = ['i think', 'i feel', 'i notice', 'i realize', 'my'];
    let score = 0.4;
    
    for (const indicator of metaIndicators) {
      if (content.includes(indicator)) score += 0.1;
    }
    
    return Math.min(1, score);
  }

  private evaluateAdaptation(): number {
    // Based on fitness trend
    const trend = this.getFitnessTrend();
    switch (trend.trend) {
      case 'improving': return 0.9;
      case 'stable': return 0.7;
      case 'declining': return 0.4;
    }
  }
}

/**
 * Factory function for creating kernel optimizer
 */
export function createKernelOptimizer(options?: {
  optimizationThreshold?: number;
  maxHistorySize?: number;
}): KernelOptimizer {
  return new KernelOptimizer(options);
}

export default KernelOptimizer;
