/**
 * Confidence Calibration Module
 * 
 * Provides confidence estimation, calibration, and learning from outcomes.
 */

// Types
export {
  type RawConfidenceFactors,
  type RawConfidence,
  type CalibrationMethod,
  type ConfidenceCalibrationConfig,
  type ReliabilityBin,
  type CalibrationMetrics,
  type PlattParameters,
  type IsotonicCurve,
  type TemperatureParameter,
  type EnsembleWeights,
  type CalibrationStateData,
  type OutcomeRecord,
  type CalibratedConfidence,
  type CalibrationEvents,
  type CalibrationEventCallback,
  CalibrationState,
  defaultCalibrationConfig,
} from './types'

// Raw confidence calculation
export {
  RawConfidenceCalculator,
  createRawConfidenceCalculator,
  type RawConfidenceConfig,
  defaultRawConfidenceConfig,
} from './raw-confidence'

// Calibration algorithms
export {
  PlattScaler,
  IsotonicCalibrator,
  TemperatureScaler,
  EnsembleCalibrator,
  createCalibrator,
} from './calibration-engine'

// Reliability metrics
export {
  createReliabilityBins,
  populateReliabilityBins,
  calculateECE,
  calculateMCE,
  calculateBrierScore,
  calculateLogLoss,
  calculateAUROC,
  calculateCalibrationMetrics,
  isCalibrationAcceptable,
  getCalibrationQuality,
  calculateSharpness,
  calculateResolution,
  decomposeBrierScore,
} from './reliability-metrics'

// Main calibrator
export {
  ConfidenceCalibrator,
  createConfidenceCalibrator,
} from './confidence-calibrator'
