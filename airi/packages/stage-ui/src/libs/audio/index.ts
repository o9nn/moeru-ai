/**
 * Audio Processing Library
 * 
 * Provides VAD, silence detection, and transcription session management.
 */

// Base VAD types and utilities
export {
  type BaseVADConfig,
  type VADEvents,
  type VADEventCallback,
  type BaseVAD,
  type VADAudioOptions,
  createVADStates,
} from './vad'

// Energy-based VAD
export {
  EnergyVAD,
  createEnergyVAD,
  type EnergyVADConfig,
  type VADFrameResult,
  type EnergyVADEvents,
  type EnergyVADEventCallback,
} from './energy-vad'

// Silence detection
export {
  SilenceDetector,
  createSilenceDetector,
  useSilenceDetector,
  SilenceState,
  type SilenceDetectorConfig,
  type SilenceDetectorEvents,
  type SilenceDetectorEventCallback,
  type SessionStats,
} from './silence-detector'

// Session management
export {
  TranscriptionSessionManager,
  createSessionManager,
  SessionState,
  type SessionConfig,
  type SessionEvents,
  type SessionEventCallback,
  type SessionStatistics,
} from './session-manager'
