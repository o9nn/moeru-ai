/**
 * Cognitive Core - Main Exports
 *
 * Unified cognitive architecture for AIRI
 * Based on John Vervaeke's 4E cognition and relevance realization framework
 */

// Types
export type * from './types'

// Relevance Realization
export { RelevanceCoordinator, defaultRelevanceConfig } from './relevance-coordinator'
export type { RelevanceConfig, ExtendedRelevanceScore } from './relevance-coordinator'

// Confidence Calibration
export {
  // Main calibrator
  ConfidenceCalibrator,
  createConfidenceCalibrator,
  // Calibration algorithms
  PlattScaler,
  IsotonicCalibrator,
  TemperatureScaler,
  EnsembleCalibrator,
  createCalibrator,
  // Raw confidence
  RawConfidenceCalculator,
  createRawConfidenceCalculator,
  // Reliability metrics
  calculateECE,
  calculateMCE,
  calculateBrierScore,
  calculateCalibrationMetrics,
  isCalibrationAcceptable,
  getCalibrationQuality,
  decomposeBrierScore,
  // Types and constants
  CalibrationState,
  defaultCalibrationConfig,
  defaultRawConfidenceConfig,
} from './confidence'
export type {
  RawConfidenceFactors,
  RawConfidence,
  CalibrationMethod,
  ConfidenceCalibrationConfig,
  ReliabilityBin,
  CalibrationMetrics,
  PlattParameters,
  IsotonicCurve,
  TemperatureParameter,
  EnsembleWeights,
  CalibrationStateData,
  OutcomeRecord,
  CalibratedConfidence,
  CalibrationEvents,
  CalibrationEventCallback,
  RawConfidenceConfig,
} from './confidence'

// Four Ways of Knowing
export { FourWaysTracker, defaultBalanceConfig } from './four-ways-tracker'
export type {
  KnowingEvent,
  BalanceConfig,
  BalanceRecommendation,
} from './four-ways-tracker'

// Optimal Grip (Perspectival Knowing)
export {
  OptimalGripCoordinator,
  defaultOptimalGripConfig,
  defaultFrames,
} from './optimal-grip'
export type { OptimalGripConfig } from './optimal-grip'

// Sophrosyne Engine (Self-Regulation)
export { SophrosyneEngine } from './sophrosyne-engine'
export type {
  RegulationContext,
  Spectrum,
  ContextFactor,
  OptimalPoint,
  RegulationDecision,
  HistoricalOutcome,
} from './sophrosyne-engine'

// Opponent Processor (Alternative Perspectives)
export { OpponentProcessor } from './opponent-processor'
export type {
  Position,
  Argument,
  AlternativeFrame as OpponentAlternativeFrame,
  SteelManResult,
  Synthesis,
  DetectedBias,
  BiasAssessment,
  AlternativeType,
} from './opponent-processor'

// Cognitive Daemon - Nested Skill Architecture
// /neuro-nn( /dgen( /topology-weaver self.daemon(*) ) )
export {
  // Topology Daemon (innermost layer)
  TopologyDaemon,
  createTopologyDaemon,
  selfDaemon,
  ANALOGY_PATTERNS,
  // DGen Layer (middle layer)
  DGenLayer,
  createDGenLayer,
  generateAsCharacter,
  NEURO_CHARACTER,
  // Neuro-NN (outermost layer)
  NeuroNN,
  createNeuroNN,
  processWithNeuroNN,
  PERSONALITY_BOUNDS,
  // Unified entry point
  invokeCognitiveDaemon,
  createCognitiveDaemon,
} from './daemon'
export type {
  // Topology types
  TopologySpec,
  TopologyTag,
  LayerSpec,
  MeshworkAnchor,
  // DGen types
  DGenMessage,
  RoleConfig,
  DGenSamplingParams,
  Character,
  SceneContext,
  // Neuro-NN types
  PersonalityParameter,
  CognitiveFrame,
  FrameOutput,
  DaemonCognitiveContext,
  EmotionState,
  SelfImage,
  MetaCognitionResult,
  AgentModel,
  TrainingFeedback,
} from './daemon'
