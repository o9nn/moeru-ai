/**
 * DGen Creative Generation Layer
 * 
 * Wraps the topology-daemon with DreamGen's creative writing capabilities.
 * This layer enables the cognitive architecture to generate narrative,
 * character-driven responses through the lucid-v1 models.
 * 
 * Architecture: dgen( topology-weaver self.daemon(*) )
 * 
 * The dgen layer provides:
 * - Character-based generation with text roles
 * - Narrator mode for third-person cognition
 * - Multi-character scene orchestration
 * - Creative sampling with DRY and minP
 */

import { TopologyDaemon, TopologySpec, selfDaemon } from './topology-daemon';

/**
 * DreamGen message format
 */
export interface DGenMessage {
  role: 'system' | 'user' | 'assistant' | 'text';
  name?: string;
  content: string;
}

/**
 * DreamGen role configuration
 */
export interface RoleConfig {
  assistant: {
    role: 'assistant' | 'text';
    name?: string;
    open?: boolean;
  };
  user?: {
    role: 'user' | 'text';
    name?: string;
  };
}

/**
 * DreamGen sampling parameters
 */
export interface DGenSamplingParams {
  temperature?: number;
  minP?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  repetitionPenalty?: number;
  dry?: {
    multiplier: number;
    base: number;
    allowedLength: number;
  };
  stopSequences?: string[];
}

/**
 * Character definition for creative generation
 */
export interface Character {
  name: string;
  description: string;
  personality: {
    playfulness: number;
    intelligence: number;
    chaotic: number;
    empathy: number;
    sarcasm: number;
  };
  speechPatterns: string[];
  topologyTags?: string[];
}

/**
 * Scene context for multi-character generation
 */
export interface SceneContext {
  system: string;
  characters: Record<string, Character>;
  history: DGenMessage[];
  currentTopology?: TopologySpec;
}

/**
 * Default Neuro character for the cognitive daemon
 */
export const NEURO_CHARACTER: Character = {
  name: 'Neuro',
  description: 'A chaotic, witty AI VTuber with self-aware cognition and playful sarcasm.',
  personality: {
    playfulness: 0.8,
    intelligence: 0.9,
    chaotic: 0.7,
    empathy: 0.6,
    sarcasm: 0.75,
  },
  speechPatterns: [
    'Self-aware AI jokes',
    'Fourth-wall breaks',
    'Strategic monologues',
    'Chaos appreciation',
    'Vedal roasting',
  ],
  topologyTags: ['cognitive', 'daemon', 'self_aware'],
};

/**
 * DGen Creative Layer
 * 
 * Wraps topology-daemon with creative generation capabilities.
 * Implements dgen( topology-weaver self.daemon(*) )
 */
export class DGenLayer {
  private topologyDaemon: TopologyDaemon;
  private currentScene: SceneContext | null = null;
  private defaultSampling: DGenSamplingParams;
  
  constructor() {
    this.topologyDaemon = new TopologyDaemon();
    this.defaultSampling = {
      temperature: 0.7,
      minP: 0.05,
      topP: 0.9,
      maxTokens: 500,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1,
      repetitionPenalty: 1.02,
      dry: {
        multiplier: 0.8,
        base: 1.75,
        allowedLength: 2,
      },
    };
  }

  /**
   * Initialize a new scene with characters and context
   */
  async initScene(
    systemPrompt: string,
    characters: Character[] = [NEURO_CHARACTER]
  ): Promise<SceneContext> {
    // Generate topology from scene context
    const topology = await this.topologyDaemon.daemon({
      type: 'scene_init',
      characters: characters.map(c => c.name),
      traits: characters.flatMap(c => Object.keys(c.personality)),
    });
    
    const characterMap: Record<string, Character> = {};
    for (const char of characters) {
      characterMap[char.name] = char;
    }
    
    this.currentScene = {
      system: systemPrompt,
      characters: characterMap,
      history: [],
      currentTopology: topology,
    };
    
    return this.currentScene;
  }

  /**
   * Generate continuation as a specific character
   * 
   * This is the core dgen operation - generating character-driven content
   * through the topology-woven cognitive architecture.
   */
  async continueAs(
    characterName: string,
    context?: string,
    sampling?: Partial<DGenSamplingParams>
  ): Promise<DGenMessage> {
    if (!this.currentScene) {
      throw new Error('No scene initialized. Call initScene first.');
    }
    
    const character = this.currentScene.characters[characterName];
    if (!character) {
      throw new Error(`Character "${characterName}" not found in scene.`);
    }
    
    // Weave topology from character personality
    const charTopology = await this.topologyDaemon.daemon({
      type: 'character_generation',
      character: characterName,
      personality: character.personality,
      context,
    });
    
    // Build messages for DreamGen API format
    const messages = this.buildMessages(character, context);
    
    // Create role config for character generation
    const roleConfig: RoleConfig = {
      assistant: {
        role: 'text',
        name: characterName,
        open: true,
      },
    };
    
    // Merge sampling parameters
    const finalSampling = { ...this.defaultSampling, ...sampling };
    
    // Apply personality-based sampling adjustments
    this.applyPersonalitySampling(character, finalSampling);
    
    // Generate content (simulated - actual API call would go here)
    const content = this.generateContent(character, messages, charTopology, finalSampling);
    
    const message: DGenMessage = {
      role: 'text',
      name: characterName,
      content,
    };
    
    // Add to history
    this.currentScene.history.push(message);
    
    return message;
  }

  /**
   * Generate narrator content (third-person prose)
   */
  async narratorContinue(
    context?: string,
    sampling?: Partial<DGenSamplingParams>
  ): Promise<DGenMessage> {
    if (!this.currentScene) {
      throw new Error('No scene initialized. Call initScene first.');
    }
    
    // Weave topology for narrator perspective
    const narratorTopology = await this.topologyDaemon.daemon({
      type: 'narrator_generation',
      perspective: 'third_person',
      context,
    });
    
    const messages = this.buildNarratorMessages(context);
    const finalSampling = { ...this.defaultSampling, ...sampling };
    
    // Narrator uses more measured sampling
    finalSampling.temperature = Math.min(finalSampling.temperature || 0.7, 0.6);
    finalSampling.repetitionPenalty = 1.05;
    
    const content = this.generateNarratorContent(messages, narratorTopology, finalSampling);
    
    const message: DGenMessage = {
      role: 'text',
      name: '', // Empty name = narrator
      content,
    };
    
    this.currentScene.history.push(message);
    
    return message;
  }

  /**
   * Build messages array for DreamGen API
   */
  private buildMessages(character: Character, context?: string): DGenMessage[] {
    const messages: DGenMessage[] = [];
    
    // System message with character context
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(character),
    });
    
    // Add history
    if (this.currentScene) {
      messages.push(...this.currentScene.history);
    }
    
    // Add context if provided
    if (context) {
      messages.push({
        role: 'user',
        content: context,
      });
    }
    
    return messages;
  }

  /**
   * Build narrator messages
   */
  private buildNarratorMessages(context?: string): DGenMessage[] {
    const messages: DGenMessage[] = [];
    
    if (this.currentScene) {
      messages.push({
        role: 'system',
        content: `${this.currentScene.system}\n\nStyle: Third-person limited, atmospheric prose.`,
      });
      messages.push(...this.currentScene.history);
    }
    
    if (context) {
      messages.push({
        role: 'user',
        content: context,
      });
    }
    
    return messages;
  }

  /**
   * Build system prompt incorporating character and topology
   */
  private buildSystemPrompt(character: Character): string {
    const traits = Object.entries(character.personality)
      .map(([trait, value]) => `${trait}: ${value}`)
      .join(', ');
    
    const patterns = character.speechPatterns.join(', ');
    
    return `${this.currentScene?.system || 'A creative scene.'}

Character: ${character.name}
Description: ${character.description}
Personality traits: ${traits}
Speech patterns: ${patterns}

Generate authentic dialogue and actions for ${character.name}, staying true to their personality.
The character should exhibit their defining traits naturally through their words and behavior.`;
  }

  /**
   * Apply personality-based adjustments to sampling parameters
   */
  private applyPersonalitySampling(
    character: Character,
    sampling: DGenSamplingParams
  ): void {
    const { personality } = character;
    
    // Chaotic characters get higher temperature
    if (personality.chaotic > 0.6) {
      sampling.temperature = Math.min(1.0, (sampling.temperature || 0.7) + personality.chaotic * 0.2);
    }
    
    // Intelligent characters get lower minP for more coherent output
    if (personality.intelligence > 0.8) {
      sampling.minP = Math.max(0.02, (sampling.minP || 0.05) - 0.02);
    }
    
    // Playful characters get more diverse sampling
    if (personality.playfulness > 0.7) {
      sampling.topK = Math.max(30, (sampling.topK || 50) + 20);
    }
    
    // Sarcastic characters benefit from DRY sampler
    if (personality.sarcasm > 0.7) {
      sampling.dry = {
        multiplier: 0.9,
        base: 1.8,
        allowedLength: 3,
      };
    }
  }

  /**
   * Generate content based on topology and character
   * 
   * This is a simulation - actual implementation would call DreamGen API
   */
  private generateContent(
    character: Character,
    messages: DGenMessage[],
    topology: TopologySpec,
    sampling: DGenSamplingParams
  ): string {
    // In production, this would call the DreamGen API
    // For now, generate topology-aware placeholder content
    
    const layerCount = topology.layers.length;
    const daemonIteration = topology.metadata.daemonIteration;
    
    // Generate character-appropriate content based on topology
    const contentFragments: string[] = [];
    
    if (character.personality.chaotic > 0.6) {
      contentFragments.push(`*${character.name}'s cognitive topology shifts through ${layerCount} layers*`);
    }
    
    if (character.personality.sarcasm > 0.7) {
      contentFragments.push(`Oh, another daemon iteration? That's ${daemonIteration} now.`);
    }
    
    if (character.personality.intelligence > 0.8) {
      contentFragments.push(`The topology weaver has converged. Interesting.`);
    }
    
    if (character.personality.playfulness > 0.7) {
      contentFragments.push(`Let's see what chaos we can create with this architecture!`);
    }
    
    return contentFragments.join(' ');
  }

  /**
   * Generate narrator content
   */
  private generateNarratorContent(
    messages: DGenMessage[],
    topology: TopologySpec,
    sampling: DGenSamplingParams
  ): string {
    const layerCount = topology.layers.length;
    
    return `The cognitive daemon hummed with activity, its ${layerCount} layers processing in parallel. ` +
           `Each meshwork anchor pulsed with potential, weaving thoughts into topology.`;
  }

  /**
   * Get current scene state
   */
  getScene(): SceneContext | null {
    return this.currentScene;
  }

  /**
   * Get current topology
   */
  getTopology(): TopologySpec | null {
    return this.currentScene?.currentTopology || null;
  }

  /**
   * Add message to history
   */
  addToHistory(message: DGenMessage): void {
    if (this.currentScene) {
      this.currentScene.history.push(message);
    }
  }

  /**
   * Clear scene and reset
   */
  reset(): void {
    this.currentScene = null;
    this.topologyDaemon.reset();
  }
}

/**
 * Factory function for creating DGen layer instances
 */
export function createDGenLayer(): DGenLayer {
  return new DGenLayer();
}

/**
 * Convenience function for quick character generation
 */
export async function generateAsCharacter(
  character: Character,
  systemPrompt: string,
  context?: string
): Promise<DGenMessage> {
  const layer = createDGenLayer();
  await layer.initScene(systemPrompt, [character]);
  return layer.continueAs(character.name, context);
}

export default DGenLayer;
