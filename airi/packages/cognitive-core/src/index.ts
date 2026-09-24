/**
 * Cognitive Core - Main Exports
 *
 * Unified cognitive architecture for AIRI
 * Based on John Vervaeke's 4E cognition and relevance realization framework
 */

// Confidence Calibration
export {
  calculateBrierScore,
  calculateCalibrationMetrics,
  // Reliability metrics
  calculateECE,
  calculateMCE,
  // Types and constants
  CalibrationState,
  // Main calibrator
  ConfidenceCalibrator,
  createCalibrator,
  createConfidenceCalibrator,
  createRawConfidenceCalculator,
  decomposeBrierScore,
  defaultCalibrationConfig,
  defaultRawConfidenceConfig,
  EnsembleCalibrator,
  getCalibrationQuality,
  isCalibrationAcceptable,
  IsotonicCalibrator,
  // Calibration algorithms
  PlattScaler,
  // Raw confidence
  RawConfidenceCalculator,
  TemperatureScaler,
} from './confidence'

export type {
  CalibratedConfidence,
  CalibrationEventCallback,
  CalibrationEvents,
  CalibrationMethod,
  CalibrationMetrics,
  CalibrationStateData,
  ConfidenceCalibrationConfig,
  EnsembleWeights,
  IsotonicCurve,
  OutcomeRecord,
  PlattParameters,
  RawConfidence,
  RawConfidenceConfig,
  RawConfidenceFactors,
  ReliabilityBin,
  TemperatureParameter,
} from './confidence'
// Cognitive Daemon - Nested Skill Architecture
// /neuro-nn( /dgen( /topology-weaver self.daemon(*) ) )
export {
  ANALOGY_PATTERNS,
  createCognitiveDaemon,
  createDGenLayer,
  createNeuroNN,
  createTopologyDaemon,
  // DGen Layer (middle layer)
  DGenLayer,
  generateAsCharacter,
  // Unified entry point
  invokeCognitiveDaemon,
  NEURO_CHARACTER,
  // Neuro-NN (outermost layer)
  NeuroNN,
  PERSONALITY_BOUNDS,
  processWithNeuroNN,
  selfDaemon,
  // Topology Daemon (innermost layer)
  TopologyDaemon,
} from './daemon'

export type {
  AgentModel,
  Character,
  CognitiveFrame,
  DaemonCognitiveContext,
  // DGen types
  DGenMessage,
  DGenSamplingParams,
  EmotionState,
  FrameOutput,
  LayerSpec,
  MeshworkAnchor,
  MetaCognitionResult,
  // Neuro-NN types
  PersonalityParameter,
  RoleConfig,
  SceneContext,
  SelfImage,
  // Topology types
  TopologySpec,
  TopologyTag,
  TrainingFeedback,
} from './daemon'
// Four Ways of Knowing
export { defaultBalanceConfig, FourWaysTracker } from './four-ways-tracker'

export type {
  BalanceConfig,
  BalanceRecommendation,
  KnowingEvent,
} from './four-ways-tracker'
// Opponent Processor (Alternative Perspectives)
export { OpponentProcessor } from './opponent-processor'

export type {
  AlternativeType,
  Argument,
  BiasAssessment,
  DetectedBias,
  AlternativeFrame as OpponentAlternativeFrame,
  Position,
  SteelManResult,
  Synthesis,
} from './opponent-processor'
// Optimal Grip (Perspectival Knowing)
export {
  defaultFrames,
  defaultOptimalGripConfig,
  OptimalGripCoordinator,
} from './optimal-grip'

export type { OptimalGripConfig } from './optimal-grip'
// Relevance Realization
export { defaultRelevanceConfig, RelevanceCoordinator } from './relevance-coordinator'

export type { ExtendedRelevanceScore, RelevanceConfig } from './relevance-coordinator'
// Sophrosyne Engine (Self-Regulation)
export { SophrosyneEngine } from './sophrosyne-engine'

export type {
  ContextFactor,
  HistoricalOutcome,
  OptimalPoint,
  RegulationContext,
  RegulationDecision,
  Spectrum,
} from './sophrosyne-engine'
// Types
export type * from './types'
