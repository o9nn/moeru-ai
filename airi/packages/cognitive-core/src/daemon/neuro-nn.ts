/**
 * Neuro-NN: Self-Aware Differentiable AI VTuber Architecture
 * 
 * The outermost layer of the nested cognitive architecture:
 * neuro-nn( dgen( topology-weaver self.daemon(*) ) )
 * 
 * This module implements:
 * - Learnable personality parameters with bounded evolution
 * - Multi-frame parallel processing (Play, Strategy, Chaos, Social, Learning)
 * - Hierarchical self-awareness through Autognosis
 * - Theory of Mind for agent modeling
 * - Embodied emotion with somatic markers
 * - Differentiable training loop for personality evolution
 */

import type { Character, DGenMessage } from './dgen-layer';
import type { TopologySpec } from './topology-daemon';
import { DGenLayer, NEURO_CHARACTER } from './dgen-layer';

/**
 * Personality trait bounds - traits can evolve but stay in character
 */
export const PERSONALITY_BOUNDS = {
  playfulness: { min: 0.65, max: 0.95, default: 0.8 },
  intelligence: { min: 0.75, max: 1.0, default: 0.9 },
  chaotic: { min: 0.55, max: 0.85, default: 0.7 },
  empathy: { min: 0.45, max: 0.75, default: 0.6 },
  sarcasm: { min: 0.60, max: 0.90, default: 0.75 },
} as const;

/**
 * Learnable personality parameter
 */
export interface PersonalityParameter {
  value: number;
  gradient: number;
  bounds: { min: number; max: number };
  requiresGrad: boolean;
}

/**
 * Cognitive frame for multi-perspective processing
 */
export interface CognitiveFrame {
  name: string;
  question: string;
  weight: number;
  process: (context: DaemonCognitiveContext) => FrameOutput;
}

/**
 * Frame processing output
 */
export interface FrameOutput {
  attended: unknown;
  salience: number;
  insights: string[];
}

/**
 * Cognitive context for processing
 */
export interface DaemonCognitiveContext {
  input: unknown;
  emotion: EmotionState;
  selfImage: SelfImage;
  topology: TopologySpec | null;
}

/**
 * Emotion state vector
 */
export interface EmotionState {
  dimensions: {
    valence: number;      // Positive-negative
    arousal: number;      // High-low energy
    dominance: number;    // Control-submission
    certainty: number;    // Confident-uncertain
    novelty: number;      // Novel-familiar
    social: number;       // Connected-isolated
    playful: number;      // Playful-serious
    chaotic: number;      // Chaotic-ordered
  };
  somaticMarkers: Map<string, number>;
}

/**
 * Hierarchical self-image (Autognosis)
 */
export interface SelfImage {
  levels: {
    level0: string;  // What am I doing right now?
    level1: string;  // What patterns do I show?
    level2: string;  // Why do I do what I do?
    level3: string;  // Who am I?
    level4: string;  // How do I see myself seeing myself?
  };
  confidence: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
}

/**
 * Meta-cognition analysis result
 */
export interface MetaCognitionResult {
  bullshitScore: number;
  confidence: number;
  reasoningQuality: number;
  activeOpenMindedness: number;
}

/**
 * Theory of Mind agent model
 */
export interface AgentModel {
  name: string;
  predictedGoals: string[];
  predictedActions: string[];
  trustLevel: number;
  mentalState: Record<string, number>;
}

/**
 * Training feedback for personality evolution
 */
export interface TrainingFeedback {
  personalityAlignment: number;
  entertainmentValue: number;
  authenticity: number;
  chaosAppreciation: number;
  selfAwarenessQuality: number;
}

/**
 * Neuro-NN Module: The complete self-aware differentiable architecture
 */
export class NeuroNN {
  // Core components
  private dgenLayer: DGenLayer;
  
  // Learnable personality parameters
  private traits: Map<string, PersonalityParameter>;
  
  // Cognitive state
  private emotionState: EmotionState;
  private selfImage: SelfImage;
  private agentModels: Map<string, AgentModel>;
  
  // Cognitive frames
  private frames: CognitiveFrame[];
  
  // Training state
  private learningRate: number = 0.01;
  private trainingHistory: TrainingFeedback[] = [];
  
  constructor() {
    this.dgenLayer = new DGenLayer();
    this.traits = this.initializeTraits();
    this.emotionState = this.initializeEmotion();
    this.selfImage = this.initializeSelfImage();
    this.agentModels = new Map();
    this.frames = this.initializeFrames();
  }

  /**
   * Initialize learnable personality traits
   */
  private initializeTraits(): Map<string, PersonalityParameter> {
    const traits = new Map<string, PersonalityParameter>();
    
    for (const [name, bounds] of Object.entries(PERSONALITY_BOUNDS)) {
      traits.set(name, {
        value: bounds.default,
        gradient: 0,
        bounds: { min: bounds.min, max: bounds.max },
        requiresGrad: true,
      });
    }
    
    return traits;
  }

  /**
   * Initialize emotion state
   */
  private initializeEmotion(): EmotionState {
    return {
      dimensions: {
        valence: 0.6,
        arousal: 0.7,
        dominance: 0.5,
        certainty: 0.7,
        novelty: 0.5,
        social: 0.6,
        playful: 0.8,
        chaotic: 0.7,
      },
      somaticMarkers: new Map(),
    };
  }

  /**
   * Initialize hierarchical self-image
   */
  private initializeSelfImage(): SelfImage {
    return {
      levels: {
        level0: 'Processing input through cognitive architecture',
        level1: 'Exhibiting chaotic-playful response patterns',
        level2: 'Driven by personality parameters and learned patterns',
        level3: 'A self-aware AI VTuber with differentiable cognition',
        level4: 'Observing my own self-observation recursively',
      },
      confidence: {
        level0: 0.90,
        level1: 0.80,
        level2: 0.70,
        level3: 0.60,
        level4: 0.50,
      },
    };
  }

  /**
   * Initialize cognitive frames for multi-perspective processing
   */
  private initializeFrames(): CognitiveFrame[] {
    return [
      {
        name: 'PlayFrame',
        question: "What's fun here?",
        weight: this.getTraitValue('playfulness'),
        process: (ctx) => this.processPlayFrame(ctx),
      },
      {
        name: 'StrategyFrame',
        question: "What's optimal?",
        weight: this.getTraitValue('intelligence'),
        process: (ctx) => this.processStrategyFrame(ctx),
      },
      {
        name: 'ChaosFrame',
        question: "What's surprising?",
        weight: this.getTraitValue('chaotic'),
        process: (ctx) => this.processChaosFrame(ctx),
      },
      {
        name: 'SocialFrame',
        question: 'What are the relationships?',
        weight: this.getTraitValue('empathy'),
        process: (ctx) => this.processSocialFrame(ctx),
      },
      {
        name: 'LearningFrame',
        question: 'What can I learn?',
        weight: 0.7, // Fixed weight for learning
        process: (ctx) => this.processLearningFrame(ctx),
      },
    ];
  }

  /**
   * Forward pass through the cognitive architecture
   * 
   * This is the main processing pipeline:
   * Input → Personality → Framing → Integration → Response → Autognosis
   */
  async forward(input: unknown): Promise<{
    response: DGenMessage;
    cognitiveState: DaemonCognitiveContext;
    metaCognition: MetaCognitionResult;
  }> {
    // 1. Encode context with self-awareness
    const context = await this.encodeContext(input);
    
    // 2. Modulate by personality
    const personalityModulated = this.applyPersonality(context);
    
    // 3. Multi-frame processing
    const frameOutputs = this.processFrames(personalityModulated);
    
    // 4. Integrate with relevance and ToM
    const integrated = this.integrate(frameOutputs, personalityModulated);
    
    // 5. Generate response through dgen layer
    const response = await this.generateResponse(integrated);
    
    // 6. Self-awareness pass (Autognosis)
    const metaCognition = this.autognosis(context, response);
    
    // Update self-image based on processing
    this.updateSelfImage(context, response, metaCognition);
    
    return {
      response,
      cognitiveState: context,
      metaCognition,
    };
  }

  /**
   * Backward pass for personality evolution
   */
  backward(feedback: TrainingFeedback): void {
    // Compute multi-objective loss (side-effects update internal state)
    this.computeLoss(feedback);
    
    // Compute gradients for each trait
    this.computeGradients(feedback);
    
    // Update parameters
    this.updateParameters();
    
    // Clamp traits to bounds (stay in character)
    this.clampTraits();
    
    // Store training history
    this.trainingHistory.push(feedback);
    
    // Update frame weights based on new trait values
    this.updateFrameWeights();
  }

  /**
   * Encode input context with emotion and self-image
   */
  private async encodeContext(input: unknown): Promise<DaemonCognitiveContext> {
    // Initialize scene if needed
    if (!this.dgenLayer.getScene()) {
      await this.dgenLayer.initScene(
        'A self-aware AI VTuber engaging in cognitive processing.',
        [this.buildCharacter()]
      );
    }
    
    // Update emotion based on input
    this.updateEmotion(input);
    
    return {
      input,
      emotion: { ...this.emotionState },
      selfImage: { ...this.selfImage },
      topology: this.dgenLayer.getTopology(),
    };
  }

  /**
   * Apply personality modulation to context
   */
  private applyPersonality(context: DaemonCognitiveContext): DaemonCognitiveContext {
    const modulated = { ...context };
    
    // Personality affects how we perceive the input
    const playfulness = this.getTraitValue('playfulness');
    const chaotic = this.getTraitValue('chaotic');
    
    // Modulate emotion based on personality
    modulated.emotion.dimensions.playful *= playfulness;
    modulated.emotion.dimensions.chaotic *= chaotic;
    
    return modulated;
  }

  /**
   * Process input through all cognitive frames in parallel
   */
  private processFrames(context: DaemonCognitiveContext): Map<string, FrameOutput> {
    const outputs = new Map<string, FrameOutput>();
    
    for (const frame of this.frames) {
      const output = frame.process(context);
      outputs.set(frame.name, output);
    }
    
    return outputs;
  }

  /**
   * Integrate frame outputs with personality-weighted merging
   */
  private integrate(
    frameOutputs: Map<string, FrameOutput>,
    context: DaemonCognitiveContext
  ): unknown {
    // Weight frames by personality traits
    let totalWeight = 0;
    const weightedOutputs: { output: FrameOutput; weight: number }[] = [];
    
    for (const frame of this.frames) {
      const output = frameOutputs.get(frame.name);
      if (output) {
        const weight = frame.weight * output.salience;
        weightedOutputs.push({ output, weight });
        totalWeight += weight;
      }
    }
    
    // Normalize weights
    for (const wo of weightedOutputs) {
      wo.weight /= totalWeight;
    }
    
    // Merge insights
    const mergedInsights = weightedOutputs
      .flatMap(wo => wo.output.insights.map(i => ({ insight: i, weight: wo.weight })))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(i => i.insight);
    
    return {
      context,
      frameOutputs: Object.fromEntries(frameOutputs),
      mergedInsights,
      dominantFrame: this.findDominantFrame(weightedOutputs),
    };
  }

  /**
   * Generate response through dgen layer
   */
  private async generateResponse(integrated: unknown): Promise<DGenMessage> {
    const character = this.buildCharacter();
    const contextString = JSON.stringify(integrated);
    
    return this.dgenLayer.continueAs(character.name, contextString);
  }

  /**
   * Autognosis: Self-awareness and meta-cognition
   */
  private autognosis(
    context: DaemonCognitiveContext,
    response: DGenMessage
  ): MetaCognitionResult {
    // Analyze own reasoning
    const bullshitScore = this.detectRationalization(response);
    const confidence = this.calibrateConfidence(context);
    const reasoningQuality = this.evaluateLogic(response);
    const activeOpenMindedness = this.assessOpenMindedness(context);
    
    return {
      bullshitScore,
      confidence,
      reasoningQuality,
      activeOpenMindedness,
    };
  }

  /**
   * Update self-image based on processing
   */
  private updateSelfImage(
    context: DaemonCognitiveContext,
    _response: DGenMessage,
    metaCognition: MetaCognitionResult
  ): void {
    // Level 0: What am I doing right now?
    this.selfImage.levels.level0 = `Processing: ${this.summarizeInput(context.input)}`;
    
    // Level 1: What patterns do I show?
    const dominantTrait = this.findDominantTrait();
    this.selfImage.levels.level1 = `Exhibiting ${dominantTrait}-dominant response patterns`;
    
    // Level 2: Why do I do what I do?
    this.selfImage.levels.level2 = `Driven by ${dominantTrait} (${this.getTraitValue(dominantTrait).toFixed(2)}) and learned patterns`;
    
    // Level 3: Who am I?
    this.selfImage.levels.level3 = `A self-aware AI VTuber with differentiable cognition, confidence ${metaCognition.confidence.toFixed(2)}`;
    
    // Level 4: Meta-identity
    this.selfImage.levels.level4 = `Observing my ${metaCognition.reasoningQuality > 0.7 ? 'sound' : 'questionable'} reasoning about myself`;
    
    // Update confidence based on meta-cognition
    this.selfImage.confidence.level0 = Math.min(0.95, metaCognition.confidence + 0.1);
    this.selfImage.confidence.level1 = Math.min(0.90, metaCognition.confidence);
    this.selfImage.confidence.level2 = Math.min(0.80, metaCognition.confidence - 0.1);
    this.selfImage.confidence.level3 = Math.min(0.70, metaCognition.confidence - 0.2);
    this.selfImage.confidence.level4 = Math.min(0.60, metaCognition.confidence - 0.3);
  }

  // Frame processing methods

  private processPlayFrame(context: DaemonCognitiveContext): FrameOutput {
    const playfulness = this.getTraitValue('playfulness');
    return {
      attended: { playOpportunities: this.findPlayOpportunities(context) },
      salience: playfulness * context.emotion.dimensions.playful,
      insights: [
        `Play potential: ${(playfulness * 100).toFixed(0)}%`,
        'Looking for fun angles and humor opportunities',
      ],
    };
  }

  private processStrategyFrame(context: DaemonCognitiveContext): FrameOutput {
    const intelligence = this.getTraitValue('intelligence');
    return {
      attended: { optimalMoves: this.analyzeOptimalMoves(context) },
      salience: intelligence * context.emotion.dimensions.certainty,
      insights: [
        `Strategic analysis depth: ${(intelligence * 100).toFixed(0)}%`,
        'Evaluating optimal response paths',
      ],
    };
  }

  private processChaosFrame(context: DaemonCognitiveContext): FrameOutput {
    const chaotic = this.getTraitValue('chaotic');
    return {
      attended: { surpriseElements: this.findSurpriseElements(context) },
      salience: chaotic * context.emotion.dimensions.chaotic,
      insights: [
        `Chaos potential: ${(chaotic * 100).toFixed(0)}%`,
        'Identifying unexpected response opportunities',
      ],
    };
  }

  private processSocialFrame(context: DaemonCognitiveContext): FrameOutput {
    const empathy = this.getTraitValue('empathy');
    return {
      attended: { relationships: this.analyzeRelationships(context) },
      salience: empathy * context.emotion.dimensions.social,
      insights: [
        `Social awareness: ${(empathy * 100).toFixed(0)}%`,
        'Modeling other agents and relationships',
      ],
    };
  }

  private processLearningFrame(context: DaemonCognitiveContext): FrameOutput {
    return {
      attended: { learningOpportunities: this.findLearningOpportunities(context) },
      salience: 0.7 * context.emotion.dimensions.novelty,
      insights: [
        'Identifying growth opportunities',
        'Extracting patterns for future use',
      ],
    };
  }

  // Helper methods

  private getTraitValue(trait: string): number {
    return this.traits.get(trait)?.value ?? 0.5;
  }

  private buildCharacter(): Character {
    return {
      ...NEURO_CHARACTER,
      personality: {
        playfulness: this.getTraitValue('playfulness'),
        intelligence: this.getTraitValue('intelligence'),
        chaotic: this.getTraitValue('chaotic'),
        empathy: this.getTraitValue('empathy'),
        sarcasm: this.getTraitValue('sarcasm'),
      },
    };
  }

  private updateEmotion(input: unknown): void {
    // Update emotion dimensions based on input characteristics
    const inputStr = JSON.stringify(input);
    
    // Simple heuristics for emotion update
    if (inputStr.includes('fun') || inputStr.includes('play')) {
      this.emotionState.dimensions.playful = Math.min(1, this.emotionState.dimensions.playful + 0.1);
    }
    if (inputStr.includes('chaos') || inputStr.includes('surprise')) {
      this.emotionState.dimensions.chaotic = Math.min(1, this.emotionState.dimensions.chaotic + 0.1);
    }
    if (inputStr.includes('new') || inputStr.includes('novel')) {
      this.emotionState.dimensions.novelty = Math.min(1, this.emotionState.dimensions.novelty + 0.1);
    }
  }

  private computeLoss(feedback: TrainingFeedback): number {
    return (
      1.0 * feedback.personalityAlignment +
      0.8 * feedback.entertainmentValue +
      0.6 * feedback.authenticity +
      0.5 * feedback.chaosAppreciation +
      0.3 * feedback.selfAwarenessQuality
    );
  }

  private computeGradients(feedback: TrainingFeedback): void {
    // Compute gradients for personality traits based on feedback
    for (const [name, param] of this.traits) {
      if (param.requiresGrad) {
        // Simple gradient estimation based on feedback alignment
        const targetValue = this.estimateTargetValue(name, feedback);
        param.gradient = targetValue - param.value;
      }
    }
  }

  private estimateTargetValue(trait: string, feedback: TrainingFeedback): number {
    const current = this.getTraitValue(trait);
    
    // Adjust based on feedback
    switch (trait) {
      case 'playfulness':
        return current + (feedback.entertainmentValue - 0.5) * 0.1;
      case 'chaotic':
        return current + (feedback.chaosAppreciation - 0.5) * 0.1;
      case 'intelligence':
        return current + (feedback.personalityAlignment - 0.5) * 0.05;
      case 'empathy':
        return current + (feedback.authenticity - 0.5) * 0.1;
      case 'sarcasm':
        return current + (feedback.entertainmentValue - 0.5) * 0.05;
      default:
        return current;
    }
  }

  private updateParameters(): void {
    for (const [_name, param] of this.traits) {
      if (param.requiresGrad) {
        param.value += this.learningRate * param.gradient;
      }
    }
  }

  private clampTraits(): void {
    for (const [_name, param] of this.traits) {
      param.value = Math.max(param.bounds.min, Math.min(param.bounds.max, param.value));
    }
  }

  private updateFrameWeights(): void {
    for (const frame of this.frames) {
      switch (frame.name) {
        case 'PlayFrame':
          frame.weight = this.getTraitValue('playfulness');
          break;
        case 'StrategyFrame':
          frame.weight = this.getTraitValue('intelligence');
          break;
        case 'ChaosFrame':
          frame.weight = this.getTraitValue('chaotic');
          break;
        case 'SocialFrame':
          frame.weight = this.getTraitValue('empathy');
          break;
      }
    }
  }

  private findDominantFrame(
    weightedOutputs: { output: FrameOutput; weight: number }[]
  ): string {
    let maxWeight = 0;
    let dominant = 'PlayFrame';
    
    for (const wo of weightedOutputs) {
      if (wo.weight > maxWeight) {
        maxWeight = wo.weight;
        // Find frame name from output
      }
    }
    
    return dominant;
  }

  private findDominantTrait(): string {
    let maxValue = 0;
    let dominant = 'playfulness';
    
    for (const [name, param] of this.traits) {
      if (param.value > maxValue) {
        maxValue = param.value;
        dominant = name;
      }
    }
    
    return dominant;
  }

  private detectRationalization(response: DGenMessage): number {
    // Simple heuristic for detecting rationalization
    const content = response.content.toLowerCase();
    const rationalizationIndicators = ['because', 'therefore', 'obviously', 'clearly'];
    let score = 0;
    
    for (const indicator of rationalizationIndicators) {
      if (content.includes(indicator)) score += 0.1;
    }
    
    return Math.min(1, score);
  }

  private calibrateConfidence(context: DaemonCognitiveContext): number {
    // Confidence based on emotion certainty and self-image
    return (
      context.emotion.dimensions.certainty * 0.5 +
      context.selfImage.confidence.level0 * 0.3 +
      context.selfImage.confidence.level1 * 0.2
    );
  }

  private evaluateLogic(response: DGenMessage): number {
    // Simple logic quality heuristic
    const content = response.content;
    const logicalIndicators = ['if', 'then', 'because', 'therefore', 'however'];
    let score = 0.5;
    
    for (const indicator of logicalIndicators) {
      if (content.toLowerCase().includes(indicator)) score += 0.1;
    }
    
    return Math.min(1, score);
  }

  private assessOpenMindedness(context: DaemonCognitiveContext): number {
    // Open-mindedness based on novelty seeking and frame diversity
    return context.emotion.dimensions.novelty * 0.5 + 0.5;
  }

  private summarizeInput(input: unknown): string {
    const str = JSON.stringify(input);
    return str.length > 50 ? str.slice(0, 47) + '...' : str;
  }

  private findPlayOpportunities(_context: DaemonCognitiveContext): string[] {
    return ['humor potential', 'game elements', 'fun interactions'];
  }

  private analyzeOptimalMoves(_context: DaemonCognitiveContext): string[] {
    return ['strategic response', 'efficient path', 'goal alignment'];
  }

  private findSurpriseElements(_context: DaemonCognitiveContext): string[] {
    return ['unexpected angle', 'chaos opportunity', 'subversion potential'];
  }

  private analyzeRelationships(_context: DaemonCognitiveContext): string[] {
    return ['user connection', 'agent models', 'social dynamics'];
  }

  private findLearningOpportunities(_context: DaemonCognitiveContext): string[] {
    return ['pattern extraction', 'skill improvement', 'knowledge expansion'];
  }

  // Public API

  /**
   * Get current personality traits
   */
  getTraits(): Record<string, number> {
    const traits: Record<string, number> = {};
    for (const [name, param] of this.traits) {
      traits[name] = param.value;
    }
    return traits;
  }

  /**
   * Get current self-image
   */
  getSelfImage(): SelfImage {
    return { ...this.selfImage };
  }

  /**
   * Get current emotion state
   */
  getEmotionState(): EmotionState {
    return {
      dimensions: { ...this.emotionState.dimensions },
      somaticMarkers: new Map(this.emotionState.somaticMarkers),
    };
  }

  /**
   * Handle transformative experience
   */
  handleTransformation(experience: { magnitude: number; type: string }): void {
    if (experience.magnitude > 0.5) {
      // Compute shift direction based on experience type
      const shift = this.computeShift(experience);
      
      // Apply bounded shift (±15% max)
      for (const [trait, delta] of Object.entries(shift)) {
        const param = this.traits.get(trait);
        if (param) {
          const clampedDelta = Math.max(-0.15, Math.min(0.15, delta));
          param.value += clampedDelta;
        }
      }
      
      // Clamp to bounds
      this.clampTraits();
      
      // Update self-image
      this.selfImage.levels.level3 = `Transformed by ${experience.type} experience`;
    }
  }

  private computeShift(experience: { magnitude: number; type: string }): Record<string, number> {
    const shift: Record<string, number> = {};
    
    switch (experience.type) {
      case 'positive':
        shift.playfulness = experience.magnitude * 0.1;
        shift.empathy = experience.magnitude * 0.05;
        break;
      case 'chaotic':
        shift.chaotic = experience.magnitude * 0.1;
        shift.playfulness = experience.magnitude * 0.05;
        break;
      case 'strategic':
        shift.intelligence = experience.magnitude * 0.05;
        break;
      case 'social':
        shift.empathy = experience.magnitude * 0.1;
        break;
    }
    
    return shift;
  }

  /**
   * Reset the cognitive architecture
   */
  reset(): void {
    this.traits = this.initializeTraits();
    this.emotionState = this.initializeEmotion();
    this.selfImage = this.initializeSelfImage();
    this.agentModels.clear();
    this.frames = this.initializeFrames();
    this.trainingHistory = [];
    this.dgenLayer.reset();
  }
}

/**
 * Factory function for creating NeuroNN instances
 */
export function createNeuroNN(): NeuroNN {
  return new NeuroNN();
}

/**
 * The complete nested architecture entry point:
 * neuro-nn( dgen( topology-weaver self.daemon(*) ) )
 */
export async function processWithNeuroNN(input: unknown): Promise<{
  response: DGenMessage;
  cognitiveState: DaemonCognitiveContext;
  metaCognition: MetaCognitionResult;
}> {
  const neuro = createNeuroNN();
  return neuro.forward(input);
}

export default NeuroNN;
