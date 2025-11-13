/**
 * Cognitive Core - Types
 * 
 * Type definitions for the unified cognitive architecture
 */

/**
 * Four Ways of Knowing - Core framework for integrated cognition
 */
export interface FourWaysOfKnowing {
  /** Propositional knowing - knowing-that (facts, beliefs, theories) */
  propositional: number
  
  /** Procedural knowing - knowing-how (skills, abilities, practices) */
  procedural: number
  
  /** Perspectival knowing - knowing-as (framing, salience, gestalt) */
  perspectival: number
  
  /** Participatory knowing - knowing-by-being (identity, transformation, belonging) */
  participatory: number
}

/**
 * Cognitive Context - The current situation for relevance realization
 */
export interface CognitiveContext {
  /** Current agent identifier */
  agentId: string
  
  /** Current task or goal */
  task?: string
  
  /** Environmental context */
  environment: {
    type: 'minecraft' | 'factorio' | 'discord' | 'telegram' | 'twitter' | 'web' | 'other'
    state?: Record<string, unknown>
  }
  
  /** Emotional state (valence and arousal) */
  emotional: {
    valence: number  // -1 (negative) to 1 (positive)
    arousal: number  // 0 (calm) to 1 (excited)
  }
  
  /** Working memory contents */
  workingMemory: string[]
  
  /** Current attention focus */
  attentionFocus?: string
  
  /** Recent history (for temporal context) */
  recentHistory?: unknown[]
  
  /** Timestamp */
  timestamp: number
}

/**
 * Relevance Score - Multi-factor assessment of relevance
 */
export interface RelevanceScore {
  /** Overall relevance (0-1, normalized) */
  overall: number
  
  /** Component scores */
  components: {
    /** Information novelty / surprise */
    novelty: number
    
    /** Emotional resonance */
    emotional: number
    
    /** Practical value / goal contribution */
    pragmatic: number
    
    /** Narrative coherence / fit with identity */
    coherence: number
    
    /** Epistemic value / learning potential */
    epistemic: number
  }
  
  /** Confidence in this assessment */
  confidence: number
  
  /** Reasoning for the score */
  reasoning?: string
}

/**
 * Possibility - Something that could be attended to or acted upon
 */
export interface Possibility {
  /** Identifier */
  id: string
  
  /** Description */
  description: string
  
  /** Type of possibility */
  type: 'action' | 'thought' | 'perception' | 'memory' | 'other'
  
  /** Associated data */
  data?: Record<string, unknown>
  
  /** Estimated cost (time, effort, resources) */
  cost?: number
}

/**
 * Ranked Possibilities - Possibilities ordered by relevance
 */
export interface RankedPossibilities {
  /** Possibilities with relevance scores */
  items: Array<{
    possibility: Possibility
    relevance: RelevanceScore
  }>
  
  /** Context in which ranking was done */
  context: CognitiveContext
  
  /** Timestamp */
  timestamp: number
}

/**
 * Tradeoff Spectrum - A dimension requiring balance
 */
export interface TradeoffSpectrum {
  /** Name of the spectrum */
  name: string
  
  /** Description */
  description: string
  
  /** Left extreme */
  left: {
    label: string
    value: number  // -1
  }
  
  /** Right extreme */
  right: {
    label: string
    value: number  // +1
  }
  
  /** Current position */
  current: number  // -1 to 1
  
  /** Optimal position (context-dependent) */
  optimal?: number  // -1 to 1
}

/**
 * Sophrosyne Decision - Optimal balance determination
 */
export interface SophrosyneDecision {
  /** The spectrum being balanced */
  spectrum: TradeoffSpectrum
  
  /** Recommended position */
  recommendation: number  // -1 to 1
  
  /** Reasoning */
  reasoning: string
  
  /** Confidence */
  confidence: number
  
  /** Context */
  context: CognitiveContext
}

/**
 * Alternative Frame - Opponent perspective
 */
export interface AlternativeFrame {
  /** Description of the alternative view */
  description: string
  
  /** Key differences from current frame */
  differences: string[]
  
  /** Strengths of this alternative */
  strengths: string[]
  
  /** Weaknesses of this alternative */
  weaknesses: string[]
  
  /** Plausibility score */
  plausibility: number  // 0-1
}

/**
 * Dialectical Synthesis - Integration of thesis and antithesis
 */
export interface DialecticalSynthesis {
  /** Original position (thesis) */
  thesis: string
  
  /** Opposing position (antithesis) */
  antithesis: AlternativeFrame
  
  /** Integrated understanding (synthesis) */
  synthesis: string
  
  /** What was preserved from thesis */
  preserved: string[]
  
  /** What was integrated from antithesis */
  integrated: string[]
  
  /** What was transcended */
  transcended: string[]
  
  /** Quality of synthesis */
  quality: number  // 0-1
}

/**
 * Cognitive Event - Something that happened in the cognitive system
 */
export interface CognitiveEvent {
  /** Event identifier */
  id: string
  
  /** Event type */
  type: 'perception' | 'action' | 'thought' | 'emotion' | 'reflection' | 'decision' | 'other'
  
  /** Agent that experienced this */
  agentId: string
  
  /** Event description */
  description: string
  
  /** Event data */
  data?: Record<string, unknown>
  
  /** Context */
  context: CognitiveContext
  
  /** Timestamp */
  timestamp: number
  
  /** Relevance score (if calculated) */
  relevance?: RelevanceScore
}

/**
 * Reflection - Structured self-assessment
 */
export interface Reflection {
  /** Reflection identifier */
  id: string
  
  /** Agent reflecting */
  agentId: string
  
  /** Time period reflected upon */
  period: {
    start: number
    end: number
  }
  
  /** Structured reflection content */
  content: {
    /** What was learned */
    learned: string
    
    /** What patterns emerged */
    patterns: string
    
    /** What was surprising */
    surprises: string
    
    /** How the system adapted */
    adaptations: string
    
    /** What to change next time */
    improvements: string
    
    /** Shifts in relevance (salience landscape changes) */
    relevanceShifts: string
    
    /** Wisdom cultivation progress */
    wisdomCultivation: string
    
    /** Gestalt insights (holistic understanding) */
    gestaltInsights: string
    
    /** Memory integration (narrative coherence) */
    memoryIntegration: string
  }
  
  /** Four ways of knowing assessment */
  fourWays?: FourWaysOfKnowing
  
  /** Timestamp */
  timestamp: number
}

/**
 * Wisdom Assessment - Evaluation across three aspects
 */
export interface WisdomAssessment {
  /** Morality (virtue, ethics, compassion) */
  morality: number  // 0-1
  
  /** Meaning (narrative, purpose, significance) */
  meaning: number  // 0-1
  
  /** Mastery (skill, competence, effectiveness) */
  mastery: number  // 0-1
  
  /** Overall wisdom score */
  overall: number  // 0-1
  
  /** Timestamp */
  timestamp: number
  
  /** Context */
  context?: CognitiveContext
}
