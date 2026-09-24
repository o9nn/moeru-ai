/**
 * Confidence Calibration Module
 *
 * Provides confidence estimation, calibration, and learning from outcomes.
 */

// Calibration algorithms
export {
  createCalibrator,
  EnsembleCalibrator,
  IsotonicCalibrator,
  PlattScaler,
  TemperatureScaler,
} from './calibration-engine'

// Main calibrator
export {
  ConfidenceCalibrator,
  createConfidenceCalibrator,
} from './confidence-calibrator'

// Raw confidence calculation
export {
  createRawConfidenceCalculator,
  defaultRawConfidenceConfig,
  RawConfidenceCalculator,
  type RawConfidenceConfig,
} from './raw-confidence'

// Reliability metrics
export {
  calculateAUROC,
  calculateBrierScore,
  calculateCalibrationMetrics,
  calculateECE,
  calculateLogLoss,
  calculateMCE,
  calculateResolution,
  calculateSharpness,
  createReliabilityBins,
  decomposeBrierScore,
  getCalibrationQuality,
  isCalibrationAcceptable,
  populateReliabilityBins,
} from './reliability-metrics'

// Types
export {
  type CalibratedConfidence,
  type CalibrationEventCallback,
  type CalibrationEvents,
  type CalibrationMethod,
  type CalibrationMetrics,
  CalibrationState,
  type CalibrationStateData,
  type ConfidenceCalibrationConfig,
  defaultCalibrationConfig,
  type EnsembleWeights,
  type IsotonicCurve,
  type OutcomeRecord,
  type PlattParameters,
  type RawConfidence,
  type RawConfidenceFactors,
  type ReliabilityBin,
  type TemperatureParameter,
} from './types'
