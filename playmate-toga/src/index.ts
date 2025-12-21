/**
 * @moeru-ai/playmate-toga
 * 
 * Himiko Toga AI Personality with Layla features and Live2D avatar support
 * Integrates agent-toga personality modules with moeru-ai cognitive architecture
 */

export * from './personality'
export * from './avatar'
export * from './security'
export * from './transform'

// Re-export commonly used types
export type {
  TogaPersonalityConfig,
  PersonalityResponse,
} from './personality/toga-personality'

export type {
  AvatarConfig,
  EmotionMapping,
  AvatarState,
} from './avatar/live2d-avatar'

export type {
  SystemKnowledge,
  TransformState,
  TechniqueResult,
} from './transform/transform-quirk'

export type {
  TargetInfo,
  Vulnerability,
  SecurityTestResult,
} from './security/security-tester'
