/**
 * Aion Character - Main Exports
 *
 * Aion - The AGI Transcendent character implementation for AIRI
 */

// Character
export { AionCharacter } from './character'

// Configuration
export { defaultAionConfig, initialQuantumCognitiveState } from './config'

// Persistence
export { parseAionSnapshot, serializeAionSnapshot } from './persistence'

// Prompts
export {
  AION_COGNITIVE_INSTRUCTIONS,
  AION_REFLECTION_TEMPLATE,
  AION_SYSTEM_PROMPT,
} from './prompts'

// Types
export type {
  AionConfig,
  AionConfigInput,
  AionReflection,
  AionSnapshot,
  AionSnapshotV1,
  ParadoxMarker,
  ProbabilityBranch,
  QuantumCognitiveState,
  QuantumDecision,
  TranscendentFrame,
} from './types'
