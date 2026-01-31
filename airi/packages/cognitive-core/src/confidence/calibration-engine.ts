/**
 * Calibration Engine
 * 
 * Implements calibration algorithms: Platt scaling, isotonic regression,
 * temperature scaling, and ensemble methods.
 */

import type {
  OutcomeRecord,
  PlattParameters,
  IsotonicCurve,
  TemperatureParameter,
  EnsembleWeights,
  CalibrationMethod,
} from './types'

/**
 * Platt Scaling
 * 
 * Fits a logistic regression: P(y=1|f) = 1 / (1 + exp(A*f + B))
 * Uses gradient descent to find optimal A and B.
 */
export class PlattScaler {
  private A: number = 0
  private B: number = 0
  private fitQuality: number = 0
  private fitted: boolean = false
  
  /**
   * Fit Platt scaling parameters from outcome data
   */
  fit(records: OutcomeRecord[], maxIterations: number = 100, learningRate: number = 0.1): void {
    const validRecords = records.filter(r => r.outcome !== 'neutral')
    
    if (validRecords.length < 10) {
      console.warn('[PlattScaler] Not enough data for fitting')
      return
    }
    
    // Initialize parameters
    this.A = 0
    this.B = 0
    
    // Gradient descent
    for (let iter = 0; iter < maxIterations; iter++) {
      let gradA = 0
      let gradB = 0
      let totalLoss = 0
      
      for (const record of validRecords) {
        const f = record.rawConfidence
        const y = record.binaryOutcome
        
        // Predicted probability
        const p = this.predict(f)
        
        // Gradient of cross-entropy loss
        const error = p - y
        gradA += error * f
        gradB += error
        
        // Loss for monitoring
        const epsilon = 1e-15
        const pClipped = Math.max(epsilon, Math.min(1 - epsilon, p))
        totalLoss -= y * Math.log(pClipped) + (1 - y) * Math.log(1 - pClipped)
      }
      
      // Update parameters
      this.A -= learningRate * gradA / validRecords.length
      this.B -= learningRate * gradB / validRecords.length
      
      // Early stopping if loss is very low
      if (totalLoss / validRecords.length < 0.01) break
    }
    
    // Calculate fit quality (pseudo R²)
    this.fitQuality = this.calculateFitQuality(validRecords)
    this.fitted = true
  }
  
  /**
   * Predict calibrated probability
   */
  predict(rawConfidence: number): number {
    return 1 / (1 + Math.exp(this.A * rawConfidence + this.B))
  }
  
  /**
   * Calculate fit quality (McFadden's pseudo R²)
   */
  private calculateFitQuality(records: OutcomeRecord[]): number {
    const epsilon = 1e-15
    
    // Null model log-likelihood (predict base rate)
    const baseRate = records.filter(r => r.binaryOutcome === 1).length / records.length
    const nullLL = records.reduce((acc, r) => {
      const p = Math.max(epsilon, Math.min(1 - epsilon, baseRate))
      return acc + r.binaryOutcome * Math.log(p) + (1 - r.binaryOutcome) * Math.log(1 - p)
    }, 0)
    
    // Model log-likelihood
    const modelLL = records.reduce((acc, r) => {
      const p = Math.max(epsilon, Math.min(1 - epsilon, this.predict(r.rawConfidence)))
      return acc + r.binaryOutcome * Math.log(p) + (1 - r.binaryOutcome) * Math.log(1 - p)
    }, 0)
    
    return 1 - (modelLL / nullLL)
  }
  
  /**
   * Get parameters
   */
  getParameters(): PlattParameters {
    return {
      A: this.A,
      B: this.B,
      fitQuality: this.fitQuality,
    }
  }
  
  /**
   * Set parameters (for loading saved state)
   */
  setParameters(params: PlattParameters): void {
    this.A = params.A
    this.B = params.B
    this.fitQuality = params.fitQuality
    this.fitted = true
  }
  
  /**
   * Check if fitted
   */
  isFitted(): boolean {
    return this.fitted
  }
}

/**
 * Isotonic Regression
 * 
 * Non-parametric calibration that preserves ordering.
 * Uses Pool Adjacent Violators (PAV) algorithm.
 */
export class IsotonicCalibrator {
  private inputs: number[] = []
  private outputs: number[] = []
  private fitted: boolean = false
  
  /**
   * Fit isotonic regression from outcome data
   */
  fit(records: OutcomeRecord[]): void {
    const validRecords = records
      .filter(r => r.outcome !== 'neutral')
      .sort((a, b) => a.rawConfidence - b.rawConfidence)
    
    if (validRecords.length < 10) {
      console.warn('[IsotonicCalibrator] Not enough data for fitting')
      return
    }
    
    // Group by similar raw confidence values
    const groups = this.groupByConfidence(validRecords)
    
    // Apply PAV algorithm
    const isotonic = this.pavAlgorithm(groups)
    
    this.inputs = isotonic.map(g => g.confidence)
    this.outputs = isotonic.map(g => g.accuracy)
    this.fitted = true
  }
  
  /**
   * Group records by similar confidence values
   */
  private groupByConfidence(records: OutcomeRecord[]): Array<{
    confidence: number
    accuracy: number
    count: number
  }> {
    const numGroups = Math.min(50, Math.ceil(records.length / 5))
    const groupSize = Math.ceil(records.length / numGroups)
    const groups: Array<{ confidence: number; accuracy: number; count: number }> = []
    
    for (let i = 0; i < records.length; i += groupSize) {
      const group = records.slice(i, Math.min(i + groupSize, records.length))
      const avgConf = group.reduce((s, r) => s + r.rawConfidence, 0) / group.length
      const accuracy = group.filter(r => r.binaryOutcome === 1).length / group.length
      
      groups.push({
        confidence: avgConf,
        accuracy,
        count: group.length,
      })
    }
    
    return groups
  }
  
  /**
   * Pool Adjacent Violators algorithm
   */
  private pavAlgorithm(groups: Array<{
    confidence: number
    accuracy: number
    count: number
  }>): Array<{ confidence: number; accuracy: number }> {
    if (groups.length === 0) return []
    
    // Initialize with original values
    const result = groups.map(g => ({
      confidence: g.confidence,
      accuracy: g.accuracy,
      count: g.count,
    }))
    
    // Iterate until monotonic
    let changed = true
    while (changed) {
      changed = false
      
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i].accuracy > result[i + 1].accuracy) {
          // Pool adjacent violators
          const totalCount = result[i].count + result[i + 1].count
          const pooledAccuracy = (
            result[i].accuracy * result[i].count +
            result[i + 1].accuracy * result[i + 1].count
          ) / totalCount
          const pooledConf = (
            result[i].confidence * result[i].count +
            result[i + 1].confidence * result[i + 1].count
          ) / totalCount
          
          result[i] = {
            confidence: pooledConf,
            accuracy: pooledAccuracy,
            count: totalCount,
          }
          result.splice(i + 1, 1)
          changed = true
          break
        }
      }
    }
    
    return result.map(r => ({ confidence: r.confidence, accuracy: r.accuracy }))
  }
  
  /**
   * Predict calibrated probability using linear interpolation
   */
  predict(rawConfidence: number): number {
    if (!this.fitted || this.inputs.length === 0) {
      return rawConfidence
    }
    
    // Handle edge cases
    if (rawConfidence <= this.inputs[0]) {
      return this.outputs[0]
    }
    if (rawConfidence >= this.inputs[this.inputs.length - 1]) {
      return this.outputs[this.outputs.length - 1]
    }
    
    // Binary search for interpolation points
    let left = 0
    let right = this.inputs.length - 1
    
    while (left < right - 1) {
      const mid = Math.floor((left + right) / 2)
      if (this.inputs[mid] <= rawConfidence) {
        left = mid
      }
      else {
        right = mid
      }
    }
    
    // Linear interpolation
    const x0 = this.inputs[left]
    const x1 = this.inputs[right]
    const y0 = this.outputs[left]
    const y1 = this.outputs[right]
    
    const t = (rawConfidence - x0) / (x1 - x0)
    return y0 + t * (y1 - y0)
  }
  
  /**
   * Get calibration curve
   */
  getCurve(): IsotonicCurve {
    return {
      inputs: [...this.inputs],
      outputs: [...this.outputs],
      isMonotonic: this.checkMonotonicity(),
    }
  }
  
  /**
   * Set curve (for loading saved state)
   */
  setCurve(curve: IsotonicCurve): void {
    this.inputs = [...curve.inputs]
    this.outputs = [...curve.outputs]
    this.fitted = true
  }
  
  /**
   * Check if curve is monotonic
   */
  private checkMonotonicity(): boolean {
    for (let i = 1; i < this.outputs.length; i++) {
      if (this.outputs[i] < this.outputs[i - 1]) {
        return false
      }
    }
    return true
  }
  
  /**
   * Check if fitted
   */
  isFitted(): boolean {
    return this.fitted
  }
}

/**
 * Temperature Scaling
 * 
 * Simple but effective calibration: softmax(z/T)
 * Finds optimal temperature T to minimize NLL.
 */
export class TemperatureScaler {
  private temperature: number = 1.0
  private converged: boolean = false
  private fitted: boolean = false
  
  /**
   * Fit temperature parameter from outcome data
   */
  fit(records: OutcomeRecord[], maxIterations: number = 50): void {
    const validRecords = records.filter(r => r.outcome !== 'neutral')
    
    if (validRecords.length < 10) {
      console.warn('[TemperatureScaler] Not enough data for fitting')
      return
    }
    
    // Grid search for optimal temperature
    let bestT = 1.0
    let bestLoss = Infinity
    
    // Coarse search
    for (let t = 0.1; t <= 5.0; t += 0.1) {
      const loss = this.calculateNLL(validRecords, t)
      if (loss < bestLoss) {
        bestLoss = loss
        bestT = t
      }
    }
    
    // Fine search around best
    for (let t = bestT - 0.1; t <= bestT + 0.1; t += 0.01) {
      if (t <= 0) continue
      const loss = this.calculateNLL(validRecords, t)
      if (loss < bestLoss) {
        bestLoss = loss
        bestT = t
      }
    }
    
    this.temperature = bestT
    this.converged = true
    this.fitted = true
  }
  
  /**
   * Calculate negative log-likelihood for a temperature
   */
  private calculateNLL(records: OutcomeRecord[], temperature: number): number {
    const epsilon = 1e-15
    
    return records.reduce((acc, record) => {
      const p = this.predictWithTemp(record.rawConfidence, temperature)
      const pClipped = Math.max(epsilon, Math.min(1 - epsilon, p))
      const y = record.binaryOutcome
      
      return acc - (y * Math.log(pClipped) + (1 - y) * Math.log(1 - pClipped))
    }, 0) / records.length
  }
  
  /**
   * Predict with specific temperature
   */
  private predictWithTemp(rawConfidence: number, temperature: number): number {
    // Convert to logit, scale, convert back
    const epsilon = 1e-15
    const clipped = Math.max(epsilon, Math.min(1 - epsilon, rawConfidence))
    const logit = Math.log(clipped / (1 - clipped))
    const scaledLogit = logit / temperature
    return 1 / (1 + Math.exp(-scaledLogit))
  }
  
  /**
   * Predict calibrated probability
   */
  predict(rawConfidence: number): number {
    return this.predictWithTemp(rawConfidence, this.temperature)
  }
  
  /**
   * Get parameter
   */
  getParameter(): TemperatureParameter {
    return {
      temperature: this.temperature,
      converged: this.converged,
    }
  }
  
  /**
   * Set parameter (for loading saved state)
   */
  setParameter(param: TemperatureParameter): void {
    this.temperature = param.temperature
    this.converged = param.converged
    this.fitted = true
  }
  
  /**
   * Check if fitted
   */
  isFitted(): boolean {
    return this.fitted
  }
}

/**
 * Ensemble Calibrator
 * 
 * Combines multiple calibration methods with learned weights.
 */
export class EnsembleCalibrator {
  private platt: PlattScaler
  private isotonic: IsotonicCalibrator
  private temperature: TemperatureScaler
  private weights: EnsembleWeights = { platt: 0.33, isotonic: 0.34, temperature: 0.33 }
  private fitted: boolean = false
  
  constructor() {
    this.platt = new PlattScaler()
    this.isotonic = new IsotonicCalibrator()
    this.temperature = new TemperatureScaler()
  }
  
  /**
   * Fit all calibrators and learn optimal weights
   */
  fit(records: OutcomeRecord[]): void {
    const validRecords = records.filter(r => r.outcome !== 'neutral')
    
    if (validRecords.length < 30) {
      console.warn('[EnsembleCalibrator] Not enough data for fitting')
      return
    }
    
    // Split data for training and weight optimization
    const splitIdx = Math.floor(validRecords.length * 0.7)
    const trainRecords = validRecords.slice(0, splitIdx)
    const valRecords = validRecords.slice(splitIdx)
    
    // Fit individual calibrators
    this.platt.fit(trainRecords)
    this.isotonic.fit(trainRecords)
    this.temperature.fit(trainRecords)
    
    // Optimize weights on validation set
    this.optimizeWeights(valRecords)
    this.fitted = true
  }
  
  /**
   * Optimize ensemble weights using grid search
   */
  private optimizeWeights(records: OutcomeRecord[]): void {
    let bestWeights = { platt: 0.33, isotonic: 0.34, temperature: 0.33 }
    let bestLoss = Infinity
    
    // Grid search over weight combinations
    for (let wp = 0; wp <= 1; wp += 0.1) {
      for (let wi = 0; wi <= 1 - wp; wi += 0.1) {
        const wt = 1 - wp - wi
        
        const loss = this.calculateEnsembleLoss(records, { platt: wp, isotonic: wi, temperature: wt })
        
        if (loss < bestLoss) {
          bestLoss = loss
          bestWeights = { platt: wp, isotonic: wi, temperature: wt }
        }
      }
    }
    
    this.weights = bestWeights
  }
  
  /**
   * Calculate ensemble loss for given weights
   */
  private calculateEnsembleLoss(records: OutcomeRecord[], weights: EnsembleWeights): number {
    const epsilon = 1e-15
    
    return records.reduce((acc, record) => {
      const p = this.predictWithWeights(record.rawConfidence, weights)
      const pClipped = Math.max(epsilon, Math.min(1 - epsilon, p))
      const y = record.binaryOutcome
      
      return acc - (y * Math.log(pClipped) + (1 - y) * Math.log(1 - pClipped))
    }, 0) / records.length
  }
  
  /**
   * Predict with specific weights
   */
  private predictWithWeights(rawConfidence: number, weights: EnsembleWeights): number {
    const pPlatt = this.platt.isFitted() ? this.platt.predict(rawConfidence) : rawConfidence
    const pIsotonic = this.isotonic.isFitted() ? this.isotonic.predict(rawConfidence) : rawConfidence
    const pTemp = this.temperature.isFitted() ? this.temperature.predict(rawConfidence) : rawConfidence
    
    return weights.platt * pPlatt + weights.isotonic * pIsotonic + weights.temperature * pTemp
  }
  
  /**
   * Predict calibrated probability
   */
  predict(rawConfidence: number): number {
    return this.predictWithWeights(rawConfidence, this.weights)
  }
  
  /**
   * Get weights
   */
  getWeights(): EnsembleWeights {
    return { ...this.weights }
  }
  
  /**
   * Set weights (for loading saved state)
   */
  setWeights(weights: EnsembleWeights): void {
    this.weights = { ...weights }
  }
  
  /**
   * Get individual calibrators
   */
  getCalibrators(): {
    platt: PlattScaler
    isotonic: IsotonicCalibrator
    temperature: TemperatureScaler
  } {
    return {
      platt: this.platt,
      isotonic: this.isotonic,
      temperature: this.temperature,
    }
  }
  
  /**
   * Check if fitted
   */
  isFitted(): boolean {
    return this.fitted
  }
}

/**
 * Create a calibrator by method type
 */
export function createCalibrator(method: CalibrationMethod): 
  PlattScaler | IsotonicCalibrator | TemperatureScaler | EnsembleCalibrator {
  switch (method) {
    case 'platt':
      return new PlattScaler()
    case 'isotonic':
      return new IsotonicCalibrator()
    case 'temperature':
      return new TemperatureScaler()
    case 'ensemble':
      return new EnsembleCalibrator()
    default:
      return new EnsembleCalibrator()
  }
}
