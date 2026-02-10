/**
 * Confidence Calibrator
 * 
 * Main class that orchestrates confidence calculation, calibration,
 * and learning from outcomes.
 */

import type { CognitiveContext, Possibility, RelevanceScore } from '../types'
import type {
  ConfidenceCalibrationConfig,
  CalibrationStateData,
  CalibrationMetrics,
  OutcomeRecord,
  CalibratedConfidence,
  CalibrationEvents,
  CalibrationEventCallback,
} from './types'
import { defaultCalibrationConfig, CalibrationState as State } from './types'
import { RawConfidenceCalculator } from './raw-confidence'
import { 
  PlattScaler, 
  IsotonicCalibrator, 
  TemperatureScaler, 
  EnsembleCalibrator,
  createCalibrator,
} from './calibration-engine'
import { calculateCalibrationMetrics, isCalibrationAcceptable } from './reliability-metrics'

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Confidence Calibrator
 * 
 * Manages the full confidence calibration pipeline:
 * 1. Raw confidence calculation
 * 2. Calibration via Platt/isotonic/temperature/ensemble
 * 3. Outcome tracking and learning
 * 4. State machine for calibration lifecycle
 */
export class ConfidenceCalibrator {
  private config: ConfidenceCalibrationConfig
  private state: State = State.INITIAL
  private stateReason: string = 'Initial state'
  private lastTransition: number = Date.now()
  
  // Components
  private rawCalculator: RawConfidenceCalculator
  private calibrator: PlattScaler | IsotonicCalibrator | TemperatureScaler | EnsembleCalibrator
  
  // History
  private outcomeHistory: OutcomeRecord[] = []
  private metrics: CalibrationMetrics | null = null
  
  // Events
  private eventListeners: Partial<Record<keyof CalibrationEvents, CalibrationEventCallback<any>[]>> = {}
  
  constructor(config: Partial<ConfidenceCalibrationConfig> = {}) {
    this.config = { ...defaultCalibrationConfig, ...config }
    this.rawCalculator = new RawConfidenceCalculator()
    this.calibrator = createCalibrator(this.config.method)
  }
  
  /**
   * Add event listener
   */
  on<K extends keyof CalibrationEvents>(
    event: K,
    callback: CalibrationEventCallback<K>
  ): () => void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event]!.push(callback as any)
    
    return () => this.off(event, callback)
  }
  
  /**
   * Remove event listener
   */
  off<K extends keyof CalibrationEvents>(
    event: K,
    callback: CalibrationEventCallback<K>
  ): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event] = this.eventListeners[event]!.filter(cb => cb !== callback)
  }
  
  /**
   * Emit event
   */
  private emit<K extends keyof CalibrationEvents>(event: K, data: CalibrationEvents[K]): void {
    if (!this.eventListeners[event]) return
    for (const callback of this.eventListeners[event]!) {
      try {
        callback(data)
      }
      catch (err) {
        console.error(`[ConfidenceCalibrator] Error in event listener for ${event}:`, err)
      }
    }
  }
  
  /**
   * Transition to a new state
   */
  private transitionTo(newState: State, reason: string): void {
    if (this.state === newState) return
    
    const oldState = this.state
    this.state = newState
    this.stateReason = reason
    this.lastTransition = Date.now()
    
    this.emit('state-change', {
      from: oldState,
      to: newState,
      reason,
      timestamp: Date.now(),
    })
    
    this.emit('debug', {
      message: `State transition: ${oldState} -> ${newState}`,
      data: { reason },
    })
  }
  
  /**
   * Calculate calibrated confidence for a relevance assessment
   */
  calculate(
    possibility: Possibility,
    context: CognitiveContext,
    components: RelevanceScore['components']
  ): CalibratedConfidence {
    // Calculate raw confidence
    const raw = this.rawCalculator.calculate(possibility, context, components)
    
    // Apply calibration based on state
    let calibratedValue: number
    let method: CalibratedConfidence['method']
    
    switch (this.state) {
      case State.INITIAL:
        // Use prior confidence
        calibratedValue = this.config.priorConfidence
        method = 'prior'
        break
        
      case State.LEARNING:
        // Use basic calibration (Platt scaling if available)
        if (this.calibrator instanceof PlattScaler && this.calibrator.isFitted()) {
          calibratedValue = this.calibrator.predict(raw.value)
          method = 'platt'
        }
        else {
          calibratedValue = raw.value
          method = 'prior'
        }
        break
        
      case State.CALIBRATED:
      case State.ADAPTIVE:
        // Use full calibration
        calibratedValue = this.applyCalibration(raw.value)
        method = this.config.method
        break
        
      case State.DEGRADED:
        // Use raw value while recalibrating
        calibratedValue = raw.value
        method = 'prior'
        break
        
      default:
        calibratedValue = this.config.priorConfidence
        method = 'prior'
    }
    
    return {
      value: Math.max(0, Math.min(1, calibratedValue)),
      rawConfidence: raw.value,
      factors: raw.factors,
      uncertainty: raw.uncertainty,
      method,
      calibrationState: this.state,
    }
  }
  
  /**
   * Apply calibration to raw confidence
   */
  private applyCalibration(rawConfidence: number): number {
    if (this.calibrator instanceof EnsembleCalibrator) {
      return this.calibrator.predict(rawConfidence)
    }
    else if (this.calibrator instanceof PlattScaler) {
      return this.calibrator.predict(rawConfidence)
    }
    else if (this.calibrator instanceof IsotonicCalibrator) {
      return this.calibrator.predict(rawConfidence)
    }
    else if (this.calibrator instanceof TemperatureScaler) {
      return this.calibrator.predict(rawConfidence)
    }
    
    return rawConfidence
  }
  
  /**
   * Record an outcome and update calibration
   */
  recordOutcome(
    possibility: Possibility,
    relevanceScore: RelevanceScore,
    rawConfidence: number,
    calibratedConfidence: number,
    outcome: 'success' | 'failure' | 'neutral',
    context: CognitiveContext
  ): void {
    // Create outcome record
    const record: OutcomeRecord = {
      id: generateId(),
      possibility,
      relevanceScore,
      rawConfidence,
      calibratedConfidence,
      outcome,
      binaryOutcome: outcome === 'success' ? 1 : outcome === 'failure' ? 0 : 0.5,
      contextFeatures: this.extractContextFeatures(context),
      timestamp: Date.now(),
    }
    
    // Add to history
    this.outcomeHistory.push(record)
    
    // Trim history if needed
    if (this.outcomeHistory.length > this.config.maxHistorySize) {
      this.outcomeHistory = this.outcomeHistory.slice(-this.config.maxHistorySize)
    }
    
    // Update raw calculator
    this.rawCalculator.recordOutcome(record)
    
    // Emit event
    this.emit('outcome-recorded', {
      record,
      timestamp: Date.now(),
    })
    
    // Update state machine
    this.updateStateMachine()
  }
  
  /**
   * Extract context features for stratified calibration
   */
  private extractContextFeatures(context: CognitiveContext): Record<string, unknown> {
    const features: Record<string, unknown> = {}
    
    for (const feature of this.config.stratificationFeatures) {
      const parts = feature.split('.')
      let value: unknown = context
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part]
        }
        else {
          value = undefined
          break
        }
      }
      
      features[feature] = value
    }
    
    // Add context signature
    features['contextSignature'] = [
      context.environment.type,
      context.task ? 'has_task' : 'no_task',
      context.attentionFocus ? 'has_focus' : 'no_focus',
    ].join(':')
    
    return features
  }
  
  /**
   * Update state machine based on current data
   */
  private updateStateMachine(): void {
    const validRecords = this.outcomeHistory.filter(r => r.outcome !== 'neutral')
    const sampleCount = validRecords.length
    
    switch (this.state) {
      case State.INITIAL:
        if (sampleCount >= this.config.minSamples) {
          this.transitionTo(State.LEARNING, `Reached ${sampleCount} samples`)
          this.fitCalibration()
        }
        break
        
      case State.LEARNING:
        this.fitCalibration()
        this.updateMetrics()
        
        if (this.metrics && isCalibrationAcceptable(this.metrics, this.config.eceThreshold)) {
          this.transitionTo(State.CALIBRATED, `ECE ${this.metrics.ece.toFixed(3)} below threshold`)
        }
        break
        
      case State.CALIBRATED:
        this.updateMetrics()
        
        if (this.metrics) {
          if (!isCalibrationAcceptable(this.metrics, this.config.eceThreshold * 1.5)) {
            this.transitionTo(State.DEGRADED, `ECE ${this.metrics.ece.toFixed(3)} above threshold`)
            this.emit('calibration-degraded', {
              ece: this.metrics.ece,
              threshold: this.config.eceThreshold,
              timestamp: Date.now(),
            })
          }
          else {
            // Move to adaptive if stable
            this.transitionTo(State.ADAPTIVE, 'Calibration stable, entering adaptive mode')
          }
        }
        break
        
      case State.ADAPTIVE:
        // Periodically refit and check quality
        if (sampleCount % 10 === 0) {
          this.fitCalibration()
          this.updateMetrics()
          
          if (this.metrics && !isCalibrationAcceptable(this.metrics, this.config.eceThreshold * 1.5)) {
            this.transitionTo(State.DEGRADED, `ECE ${this.metrics.ece.toFixed(3)} degraded`)
            this.emit('calibration-degraded', {
              ece: this.metrics.ece,
              threshold: this.config.eceThreshold,
              timestamp: Date.now(),
            })
          }
        }
        break
        
      case State.DEGRADED:
        // Attempt recalibration
        this.fitCalibration()
        this.updateMetrics()
        
        if (this.metrics && isCalibrationAcceptable(this.metrics, this.config.eceThreshold)) {
          this.transitionTo(State.CALIBRATED, `Recalibration successful, ECE ${this.metrics.ece.toFixed(3)}`)
          this.emit('recalibration-complete', {
            newECE: this.metrics.ece,
            samplesUsed: sampleCount,
            timestamp: Date.now(),
          })
        }
        break
    }
  }
  
  /**
   * Fit calibration model
   */
  private fitCalibration(): void {
    const validRecords = this.outcomeHistory.filter(r => r.outcome !== 'neutral')
    
    if (validRecords.length < this.config.minSamples) {
      return
    }
    
    try {
      if (this.calibrator instanceof EnsembleCalibrator) {
        this.calibrator.fit(validRecords)
      }
      else if (this.calibrator instanceof PlattScaler) {
        this.calibrator.fit(validRecords)
      }
      else if (this.calibrator instanceof IsotonicCalibrator) {
        this.calibrator.fit(validRecords)
      }
      else if (this.calibrator instanceof TemperatureScaler) {
        this.calibrator.fit(validRecords)
      }
    }
    catch (err) {
      console.error('[ConfidenceCalibrator] Error fitting calibration:', err)
    }
  }
  
  /**
   * Update calibration metrics
   */
  private updateMetrics(): void {
    const validRecords = this.outcomeHistory.filter(r => r.outcome !== 'neutral')
    
    if (validRecords.length < 10) {
      return
    }
    
    this.metrics = calculateCalibrationMetrics(validRecords, this.config.numBins)
    
    this.emit('metrics-updated', {
      metrics: this.metrics,
      timestamp: Date.now(),
    })
  }
  
  /**
   * Get current state
   */
  getState(): CalibrationStateData {
    let plattParams: CalibrationStateData['plattParams'] = null
    let isotonicCurve: CalibrationStateData['isotonicCurve'] = null
    let temperatureParam: CalibrationStateData['temperatureParam'] = null
    let ensembleWeights: CalibrationStateData['ensembleWeights'] = null
    
    if (this.calibrator instanceof EnsembleCalibrator) {
      const calibrators = this.calibrator.getCalibrators()
      plattParams = calibrators.platt.getParameters()
      isotonicCurve = calibrators.isotonic.getCurve()
      temperatureParam = calibrators.temperature.getParameter()
      ensembleWeights = this.calibrator.getWeights()
    }
    else if (this.calibrator instanceof PlattScaler) {
      plattParams = this.calibrator.getParameters()
    }
    else if (this.calibrator instanceof IsotonicCalibrator) {
      isotonicCurve = this.calibrator.getCurve()
    }
    else if (this.calibrator instanceof TemperatureScaler) {
      temperatureParam = this.calibrator.getParameter()
    }
    
    return {
      state: this.state,
      metrics: this.metrics || {
        ece: 0,
        mce: 0,
        brierScore: 0,
        logLoss: 0,
        auroc: 0.5,
        reliabilityBins: [],
        sampleCount: 0,
        lastUpdated: Date.now(),
      },
      plattParams,
      isotonicCurve,
      temperatureParam,
      ensembleWeights,
      lastTransition: this.lastTransition,
      stateReason: this.stateReason,
    }
  }
  
  /**
   * Get calibration metrics
   */
  getMetrics(): CalibrationMetrics | null {
    return this.metrics
  }
  
  /**
   * Get outcome history
   */
  getHistory(): OutcomeRecord[] {
    return [...this.outcomeHistory]
  }
  
  /**
   * Get configuration
   */
  getConfig(): ConfidenceCalibrationConfig {
    return { ...this.config }
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConfidenceCalibrationConfig>): void {
    this.config = { ...this.config, ...config }
    
    // Recreate calibrator if method changed
    if (config.method && config.method !== this.config.method) {
      this.calibrator = createCalibrator(config.method)
      this.fitCalibration()
    }
  }
  
  /**
   * Force recalibration
   */
  forceRecalibration(): void {
    this.fitCalibration()
    this.updateMetrics()
    
    if (this.metrics) {
      this.emit('recalibration-complete', {
        newECE: this.metrics.ece,
        samplesUsed: this.outcomeHistory.filter(r => r.outcome !== 'neutral').length,
        timestamp: Date.now(),
      })
    }
  }
  
  /**
   * Reset calibration state
   */
  reset(): void {
    this.state = State.INITIAL
    this.stateReason = 'Reset'
    this.lastTransition = Date.now()
    this.outcomeHistory = []
    this.metrics = null
    this.calibrator = createCalibrator(this.config.method)
    this.rawCalculator = new RawConfidenceCalculator()
  }
  
  /**
   * Dispose and clean up
   */
  dispose(): void {
    this.eventListeners = {}
    this.outcomeHistory = []
    this.metrics = null
  }
}

/**
 * Create a confidence calibrator
 */
export function createConfidenceCalibrator(
  config?: Partial<ConfidenceCalibrationConfig>
): ConfidenceCalibrator {
  return new ConfidenceCalibrator(config)
}
