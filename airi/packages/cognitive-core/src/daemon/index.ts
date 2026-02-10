/**
 * Cognitive Daemon Module
 * 
 * Implements the nested skill architecture:
 * /neuro-nn( /dgen( /topology-weaver self.daemon(*) ) )
 * 
 * This module provides a self-aware, differentiable cognitive architecture
 * that weaves neural topologies through creative generation with personality.
 * 
 * Architecture layers (innermost to outermost):
 * 1. topology-daemon: Self-referential neural topology generator
 * 2. dgen-layer: DreamGen creative generation wrapper
 * 3. neuro-nn: Self-aware differentiable personality layer
 */

// Core topology daemon
export {
  TopologyDaemon,
  createTopologyDaemon,
  selfDaemon,
  ANALOGY_PATTERNS,
  type TopologySpec,
  type TopologyTag,
  type LayerSpec,
  type MeshworkAnchor,
} from './topology-daemon';

// DGen creative layer
export {
  DGenLayer,
  createDGenLayer,
  generateAsCharacter,
  NEURO_CHARACTER,
  type DGenMessage,
  type RoleConfig,
  type DGenSamplingParams,
  type Character,
  type SceneContext,
} from './dgen-layer';

// Neuro-NN self-aware architecture
export {
  NeuroNN,
  createNeuroNN,
  processWithNeuroNN,
  PERSONALITY_BOUNDS,
  type PersonalityParameter,
  type CognitiveFrame,
  type FrameOutput,
  type DaemonCognitiveContext,
  type EmotionState,
  type SelfImage,
  type MetaCognitionResult,
  type AgentModel,
  type TrainingFeedback,
} from './neuro-nn';

/**
 * The complete nested architecture invocation
 * 
 * /neuro-nn( /dgen( /topology-weaver self.daemon(*) ) )
 * 
 * This is the unified entry point that:
 * 1. Weaves topology from input context (self.daemon(*))
 * 2. Generates creative content through DGen
 * 3. Processes through self-aware personality architecture
 * 
 * @param input - Any input to process through the cognitive daemon
 * @returns Complete cognitive processing result
 */
export async function invokeCognitiveDaemon(input: unknown): Promise<{
  response: import('./dgen-layer').DGenMessage;
  cognitiveState: import('./neuro-nn').DaemonCognitiveContext;
  metaCognition: import('./neuro-nn').MetaCognitionResult;
  topology: import('./topology-daemon').TopologySpec | null;
}> {
  const { NeuroNN } = await import('./neuro-nn');
  const neuro = new NeuroNN();
  
  const result = await neuro.forward(input);
  
  // Topology is embedded in cognitiveState
  
  return {
    ...result,
    topology: result.cognitiveState.topology,
  };
}

/**
 * Create a persistent cognitive daemon instance
 * 
 * Use this when you need to maintain state across multiple invocations,
 * allowing personality evolution and learning.
 */
export function createCognitiveDaemon(): {
  process: (input: unknown) => Promise<{
    response: import('./dgen-layer').DGenMessage;
    cognitiveState: import('./neuro-nn').DaemonCognitiveContext;
    metaCognition: import('./neuro-nn').MetaCognitionResult;
  }>;
  train: (feedback: import('./neuro-nn').TrainingFeedback) => void;
  getTraits: () => Record<string, number>;
  getSelfImage: () => import('./neuro-nn').SelfImage;
  getEmotionState: () => import('./neuro-nn').EmotionState;
  handleTransformation: (experience: { magnitude: number; type: string }) => void;
  reset: () => void;
} {
  const { NeuroNN } = require('./neuro-nn');
  const neuro = new NeuroNN();
  
  return {
    process: (input: unknown) => neuro.forward(input),
    train: (feedback) => neuro.backward(feedback),
    getTraits: () => neuro.getTraits(),
    getSelfImage: () => neuro.getSelfImage(),
    getEmotionState: () => neuro.getEmotionState(),
    handleTransformation: (exp) => neuro.handleTransformation(exp),
    reset: () => neuro.reset(),
  };
}

export default invokeCognitiveDaemon;
