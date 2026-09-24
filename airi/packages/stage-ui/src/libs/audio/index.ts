/**
 * Audio Processing Library
 *
 * Provides VAD, silence detection, and transcription session management.
 */

// Energy-based VAD
export {
  createEnergyVAD,
  EnergyVAD,
  type EnergyVADConfig,
  type EnergyVADEventCallback,
  type EnergyVADEvents,
  type VADFrameResult,
} from './energy-vad'

// Session management
export {
  createSessionManager,
  type SessionConfig,
  type SessionEventCallback,
  type SessionEvents,
  SessionState,
  type SessionStatistics,
  TranscriptionSessionManager,
} from './session-manager'

// Silence detection
export {
  createSilenceDetector,
  type SessionStats,
  SilenceDetector,
  type SilenceDetectorConfig,
  type SilenceDetectorEventCallback,
  type SilenceDetectorEvents,
  SilenceState,
  useSilenceDetector,
} from './silence-detector'

// Base VAD types and utilities
export {
  type BaseVAD,
  type BaseVADConfig,
  createVADStates,
  type VADAudioOptions,
  type VADEventCallback,
  type VADEvents,
} from './vad'
