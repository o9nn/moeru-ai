/**
 * Confidence Calibration - Type Definitions
 * 
 * Types for confidence estimation, calibration, and outcome tracking.
 */

import type { CognitiveContext, Possibility, RelevanceScore } from '../types'

/**
 * Factors contributing to raw confidence estimation
 */
export interface RawConfidenceFactors {
  /** How aligned are the component scores (0-1) */
  componentAgreement: number
  
  /** Strength of supporting evidence (0-1) */
  evidenceStrength: number
  
  /** Similarity to past successful contexts (0-1) */
  contextFamiliarity: number
  
  /** Stability of prediction across perturbations (0-1) */
  predictionStability: number
  
  /** Historical accuracy for similar assessments (0-1) */
  historicalAccuracy: number
}

/**
 * Raw confidence before calibration
 */
export interface RawConfidence {
  /** Raw confidence value (0-1) */
  value: number
  
  /** Contributing factors */
  factors: RawConfidenceFactors
  
  /** Epistemic uncertainty (0-1, higher = more uncertain) */
  uncertainty: number
}

/**
 * Calibration method types
 */
export type CalibrationMethod = 'platt' | 'isotonic' | 'temperature' | 'ensemble'

/**
 * Configuration for confidence calibration
 */
export interface ConfidenceCalibrationConfig {
  /** Calibration method to use */
  method: CalibrationMethod
  
  /** Minimum samples before calibration activates */
  minSamples: number
  
  /** Number of bins for reliability diagram */
  numBins: number
  
  /** Learning rate for online updates */
  learningRate: number
  
  /** Decay factor for old observations (0-1) */
  decayFactor: number
  
  /** ECE threshold for calibration quality */
  eceThreshold: number
  
  /** Enable stratified calibration by context */
  stratifiedByContext: boolean
  
  /** Context features for stratification */
  stratificationFeatures: string[]
  
  /** Prior confidence when uncalibrated */
  priorConfidence: number
  
  /** Enable uncertainty quantification */
  quantifyUncertainty: boolean
  
  /** Maximum history size to retain */
  maxHistorySize: number
}

/**
 * Default calibration configuration
 */
export const defaultCalibrationConfig: ConfidenceCalibrationConfig = {
  method: 'ensemble',
  minSamples: 30,
  numBins: 10,
  learningRate: 0.1,
  decayFactor: 0.99,
  eceThreshold: 0.1,
  stratifiedByContext: true,
  stratificationFeatures: ['environment.type', 'task'],
  priorConfidence: 0.5,
  quantifyUncertainty: true,
  maxHistorySize: 1000,
}

/**
 * Calibration state machine states
 */
export enum CalibrationState {
  /** Not enough data, using prior */
  INITIAL = 'initial',
  /** Collecting data, basic calibration */
  LEARNING = 'learning',
  /** Full calibration active */
  CALIBRATED = 'calibrated',
  /** Continuous recalibration */
  ADAPTIVE = 'adaptive',
  /** Calibration quality dropped, recalibrating */
  DEGRADED = 'degraded',
}

/**
 * A bin in the reliability diagram
 */
export interface ReliabilityBin {
  /** Bin index (0 to numBins-1) */
  index: number
  
  /** Lower bound of confidence range */
  lowerBound: number
  
  /** Upper bound of confidence range */
  upperBound: number
  
  /** Number of samples in this bin */
  count: number
  
  /** Average confidence of samples in bin */
  averageConfidence: number
  
  /** Actual accuracy (fraction of successes) */
  accuracy: number
  
  /** Calibration gap (|accuracy - averageConfidence|) */
  gap: number
}

/**
 * Calibration metrics
 */
export interface CalibrationMetrics {
  /** Expected Calibration Error */
  ece: number
  
  /** Maximum Calibration Error */
  mce: number
  
  /** Brier Score (proper scoring rule) */
  brierScore: number
  
  /** Log loss */
  logLoss: number
  
  /** Area under ROC curve */
  auroc: number
  
  /** Reliability diagram bins */
  reliabilityBins: ReliabilityBin[]
  
  /** Total samples used */
  sampleCount: number
  
  /** Timestamp of last update */
  lastUpdated: number
}

/**
 * Platt scaling parameters
 */
export interface PlattParameters {
  /** Slope parameter A */
  A: number
  
  /** Intercept parameter B */
  B: number
  
  /** Fitting quality (R²) */
  fitQuality: number
}

/**
 * Isotonic regression calibration curve
 */
export interface IsotonicCurve {
  /** Input points (raw confidence) */
  inputs: number[]
  
  /** Output points (calibrated confidence) */
  outputs: number[]
  
  /** Monotonicity preserved */
  isMonotonic: boolean
}

/**
 * Temperature scaling parameter
 */
export interface TemperatureParameter {
  /** Temperature value (>0) */
  temperature: number
  
  /** Optimization converged */
  converged: boolean
}

/**
 * Ensemble calibration weights
 */
export interface EnsembleWeights {
  /** Weight for Platt scaling */
  platt: number
  
  /** Weight for isotonic regression */
  isotonic: number
  
  /** Weight for temperature scaling */
  temperature: number
}

/**
 * Complete calibration state
 */
export interface CalibrationStateData {
  /** Current state machine state */
  state: CalibrationState
  
  /** Calibration metrics */
  metrics: CalibrationMetrics
  
  /** Platt scaling parameters */
  plattParams: PlattParameters | null
  
  /** Isotonic curve */
  isotonicCurve: IsotonicCurve | null
  
  /** Temperature parameter */
  temperatureParam: TemperatureParameter | null
  
  /** Ensemble weights */
  ensembleWeights: EnsembleWeights | null
  
  /** Last state transition timestamp */
  lastTransition: number
  
  /** Reason for current state */
  stateReason: string
}

/**
 * Outcome record for calibration learning
 */
export interface OutcomeRecord {
  /** Unique identifier */
  id: string
  
  /** The possibility that was assessed */
  possibility: Possibility
  
  /** The relevance score given */
  relevanceScore: RelevanceScore
  
  /** Raw confidence before calibration */
  rawConfidence: number
  
  /** Calibrated confidence */
  calibratedConfidence: number
  
  /** Actual outcome */
  outcome: 'success' | 'failure' | 'neutral'
  
  /** Binary outcome for calibration (1 for success, 0 for failure) */
  binaryOutcome: number
  
  /** Context features for stratified calibration */
  contextFeatures: Record<string, unknown>
  
  /** Timestamp */
  timestamp: number
}

/**
 * Calibrated confidence result
 */
export interface CalibratedConfidence {
  /** Calibrated confidence value (0-1) */
  value: number
  
  /** Raw confidence before calibration */
  rawConfidence: number
  
  /** Contributing factors */
  factors: RawConfidenceFactors
  
  /** Uncertainty in the calibration */
  uncertainty: number
  
  /** Calibration method used */
  method: CalibrationMethod | 'prior'
  
  /** Calibration state when computed */
  calibrationState: CalibrationState
}

/**
 * Events emitted by the calibration system
 */
export interface CalibrationEvents {
  /** Calibration state changed */
  'state-change': { 
    from: CalibrationState
    to: CalibrationState
    reason: string
    timestamp: number 
  }
  
  /** Calibration metrics updated */
  'metrics-updated': { 
    metrics: CalibrationMetrics
    timestamp: number 
  }
  
  /** Calibration quality degraded */
  'calibration-degraded': { 
    ece: number
    threshold: number
    timestamp: number 
  }
  
  /** Recalibration completed */
  'recalibration-complete': { 
    newECE: number
    samplesUsed: number
    timestamp: number 
  }
  
  /** Outcome recorded */
  'outcome-recorded': { 
    record: OutcomeRecord
    timestamp: number 
  }
  
  /** Debug information */
  'debug': { 
    message: string
    data?: unknown 
  }
}

export type CalibrationEventCallback<K extends keyof CalibrationEvents> = 
  (event: CalibrationEvents[K]) => void
