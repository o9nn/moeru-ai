/**
 * @proj-airi/character-neuro
 *
 * Neuro-Sama character implementation - chaotic cognitive VTuber with multi-agent orchestration
 */

export { NeuroCharacter } from './character'

export {
  ATOMSPACE_CONFIG,
  DEFAULT_CONSTRAINT_WEIGHTS,
  DEFAULT_NEURO_PERSONALITY,
  FRAME_CONSTRAINT_WEIGHTS,
  FRAME_SELECTION_RULES,
  INITIAL_NEURO_STATE,
  METACOGNITION_THRESHOLDS,
  PERSONALITY_EVOLUTION_BOUNDS,
  REFLECTION_CONFIG,
  ROASTING_GUIDELINES,
  SAFETY_CONFIG,
  SUBORDINATE_CONFIG,
  TOM_CONFIG,
} from './config'

// Kernel Fitness Evaluation and Self-Optimization
export {
  createKernelOptimizer,
  KernelOptimizer,
} from './kernel-fitness'

export type {
  FitnessEvaluationResult,
  KernelFitnessMetrics,
  OptimizationRecommendation,
} from './kernel-fitness'

export {
  NEURO_COGNITIVE_INSTRUCTIONS,
  NEURO_REFLECTION_TEMPLATE,
  NEURO_SYSTEM_PROMPT,
} from './prompts'
export type {
  ActionOption,
  CognitiveFrame,
  ConstraintWeights,
  NeuroCognitiveState,
  NeuroPersonality,
  NeuroReflection,
  NeuroResponse,
  SubordinateAgentConfig,
  TheoryOfMindModel,
} from './types'
