/**
 * Reliability Metrics
 * 
 * Implements calibration quality metrics including ECE, MCE, Brier score,
 * and reliability diagram computation.
 */

import type { OutcomeRecord, ReliabilityBin, CalibrationMetrics } from './types'

/**
 * Create empty reliability bins
 */
export function createReliabilityBins(numBins: number): ReliabilityBin[] {
  const bins: ReliabilityBin[] = []
  const binWidth = 1 / numBins
  
  for (let i = 0; i < numBins; i++) {
    bins.push({
      index: i,
      lowerBound: i * binWidth,
      upperBound: (i + 1) * binWidth,
      count: 0,
      averageConfidence: 0,
      accuracy: 0,
      gap: 0,
    })
  }
  
  return bins
}

/**
 * Assign a confidence value to a bin index
 */
export function getBinIndex(confidence: number, numBins: number): number {
  // Handle edge case where confidence === 1
  if (confidence >= 1) return numBins - 1
  return Math.floor(confidence * numBins)
}

/**
 * Populate reliability bins from outcome records
 */
export function populateReliabilityBins(
  records: OutcomeRecord[],
  numBins: number
): ReliabilityBin[] {
  const bins = createReliabilityBins(numBins)
  
  // Group records into bins
  const binRecords: OutcomeRecord[][] = Array.from({ length: numBins }, () => [])
  
  for (const record of records) {
    // Skip neutral outcomes for binary calibration
    if (record.outcome === 'neutral') continue
    
    const binIndex = getBinIndex(record.calibratedConfidence, numBins)
    binRecords[binIndex].push(record)
  }
  
  // Calculate statistics for each bin
  for (let i = 0; i < numBins; i++) {
    const binData = binRecords[i]
    bins[i].count = binData.length
    
    if (binData.length > 0) {
      // Average confidence in bin
      const confSum = binData.reduce((sum, r) => sum + r.calibratedConfidence, 0)
      bins[i].averageConfidence = confSum / binData.length
      
      // Accuracy (fraction of successes)
      const successCount = binData.filter(r => r.outcome === 'success').length
      bins[i].accuracy = successCount / binData.length
      
      // Calibration gap
      bins[i].gap = Math.abs(bins[i].accuracy - bins[i].averageConfidence)
    }
  }
  
  return bins
}

/**
 * Calculate Expected Calibration Error (ECE)
 * 
 * ECE = Σ (|B_m| / n) * |acc(B_m) - conf(B_m)|
 * 
 * Lower is better. Perfect calibration = 0.
 */
export function calculateECE(bins: ReliabilityBin[]): number {
  const totalSamples = bins.reduce((sum, bin) => sum + bin.count, 0)
  
  if (totalSamples === 0) return 0
  
  return bins.reduce((ece, bin) => {
    if (bin.count === 0) return ece
    const weight = bin.count / totalSamples
    return ece + weight * bin.gap
  }, 0)
}

/**
 * Calculate Maximum Calibration Error (MCE)
 * 
 * MCE = max_m |acc(B_m) - conf(B_m)|
 * 
 * Lower is better. Perfect calibration = 0.
 */
export function calculateMCE(bins: ReliabilityBin[]): number {
  return Math.max(...bins.filter(b => b.count > 0).map(b => b.gap), 0)
}

/**
 * Calculate Brier Score
 * 
 * Brier = (1/n) * Σ (f_i - o_i)²
 * 
 * Lower is better. Range: 0 (perfect) to 1 (worst).
 */
export function calculateBrierScore(records: OutcomeRecord[]): number {
  const validRecords = records.filter(r => r.outcome !== 'neutral')
  
  if (validRecords.length === 0) return 0
  
  const sum = validRecords.reduce((acc, record) => {
    const diff = record.calibratedConfidence - record.binaryOutcome
    return acc + diff * diff
  }, 0)
  
  return sum / validRecords.length
}

/**
 * Calculate Log Loss (Cross-Entropy)
 * 
 * LogLoss = -(1/n) * Σ [y_i * log(p_i) + (1-y_i) * log(1-p_i)]
 * 
 * Lower is better.
 */
export function calculateLogLoss(records: OutcomeRecord[]): number {
  const validRecords = records.filter(r => r.outcome !== 'neutral')
  
  if (validRecords.length === 0) return 0
  
  const epsilon = 1e-15 // Prevent log(0)
  
  const sum = validRecords.reduce((acc, record) => {
    const p = Math.max(epsilon, Math.min(1 - epsilon, record.calibratedConfidence))
    const y = record.binaryOutcome
    
    return acc - (y * Math.log(p) + (1 - y) * Math.log(1 - p))
  }, 0)
  
  return sum / validRecords.length
}

/**
 * Calculate Area Under ROC Curve (AUROC)
 * 
 * Uses the Wilcoxon-Mann-Whitney statistic.
 */
export function calculateAUROC(records: OutcomeRecord[]): number {
  const positives = records.filter(r => r.outcome === 'success')
  const negatives = records.filter(r => r.outcome === 'failure')
  
  if (positives.length === 0 || negatives.length === 0) return 0.5
  
  let concordant = 0
  let tied = 0
  
  for (const pos of positives) {
    for (const neg of negatives) {
      if (pos.calibratedConfidence > neg.calibratedConfidence) {
        concordant++
      }
      else if (pos.calibratedConfidence === neg.calibratedConfidence) {
        tied++
      }
    }
  }
  
  const total = positives.length * negatives.length
  return (concordant + 0.5 * tied) / total
}

/**
 * Calculate all calibration metrics
 */
export function calculateCalibrationMetrics(
  records: OutcomeRecord[],
  numBins: number = 10
): CalibrationMetrics {
  const bins = populateReliabilityBins(records, numBins)
  const validRecords = records.filter(r => r.outcome !== 'neutral')
  
  return {
    ece: calculateECE(bins),
    mce: calculateMCE(bins),
    brierScore: calculateBrierScore(records),
    logLoss: calculateLogLoss(records),
    auroc: calculateAUROC(records),
    reliabilityBins: bins,
    sampleCount: validRecords.length,
    lastUpdated: Date.now(),
  }
}

/**
 * Check if calibration quality is acceptable
 */
export function isCalibrationAcceptable(
  metrics: CalibrationMetrics,
  eceThreshold: number = 0.1
): boolean {
  return metrics.ece <= eceThreshold
}

/**
 * Get calibration quality description
 */
export function getCalibrationQuality(ece: number): string {
  if (ece <= 0.02) return 'excellent'
  if (ece <= 0.05) return 'good'
  if (ece <= 0.10) return 'acceptable'
  if (ece <= 0.15) return 'poor'
  return 'very_poor'
}

/**
 * Calculate sharpness (average confidence for positive predictions)
 * 
 * Higher sharpness with good calibration indicates better model.
 */
export function calculateSharpness(records: OutcomeRecord[]): number {
  const validRecords = records.filter(r => r.outcome !== 'neutral')
  
  if (validRecords.length === 0) return 0
  
  const sum = validRecords.reduce((acc, r) => acc + r.calibratedConfidence, 0)
  return sum / validRecords.length
}

/**
 * Calculate resolution (how much predictions vary)
 * 
 * Higher resolution indicates more informative predictions.
 */
export function calculateResolution(records: OutcomeRecord[]): number {
  const validRecords = records.filter(r => r.outcome !== 'neutral')
  
  if (validRecords.length === 0) return 0
  
  const mean = validRecords.reduce((acc, r) => acc + r.calibratedConfidence, 0) / validRecords.length
  const variance = validRecords.reduce((acc, r) => {
    const diff = r.calibratedConfidence - mean
    return acc + diff * diff
  }, 0) / validRecords.length
  
  return Math.sqrt(variance)
}

/**
 * Decompose Brier score into calibration, resolution, and uncertainty
 * 
 * Brier = Uncertainty - Resolution + Calibration
 */
export function decomposeBrierScore(
  records: OutcomeRecord[],
  numBins: number = 10
): {
  uncertainty: number
  resolution: number
  calibration: number
  total: number
} {
  const validRecords = records.filter(r => r.outcome !== 'neutral')
  
  if (validRecords.length === 0) {
    return { uncertainty: 0, resolution: 0, calibration: 0, total: 0 }
  }
  
  const n = validRecords.length
  
  // Base rate (overall fraction of positives)
  const baseRate = validRecords.filter(r => r.outcome === 'success').length / n
  
  // Uncertainty: baseRate * (1 - baseRate)
  const uncertainty = baseRate * (1 - baseRate)
  
  // Group by bins
  const bins = populateReliabilityBins(validRecords, numBins)
  
  // Resolution: (1/n) * Σ n_k * (o_k - baseRate)²
  const resolution = bins.reduce((acc, bin) => {
    if (bin.count === 0) return acc
    const diff = bin.accuracy - baseRate
    return acc + bin.count * diff * diff
  }, 0) / n
  
  // Calibration: (1/n) * Σ n_k * (o_k - f_k)²
  const calibration = bins.reduce((acc, bin) => {
    if (bin.count === 0) return acc
    const diff = bin.accuracy - bin.averageConfidence
    return acc + bin.count * diff * diff
  }, 0) / n
  
  return {
    uncertainty,
    resolution,
    calibration,
    total: uncertainty - resolution + calibration,
  }
}
