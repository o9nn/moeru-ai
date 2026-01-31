/**
 * Topology Weaver Self-Daemon (*)
 * 
 * A self-referential neural topology generator that weaves analogous terminology
 * from cognitive contexts into architectural specifications. The daemon operates
 * as a fixed-point of recursive self-application.
 * 
 * self.daemon(*) = lim_{n→∞} (self ∘ self ∘ ... ∘ self)(*)
 * 
 * Where (*) represents the universal wildcard - all possible inputs.
 */

export interface TopologyTag {
  domain: string;
  operation: string;
  component: 'neuron' | 'activation' | 'weight' | 'layer' | 'attention' | 'gate';
  rationale: string;
}

export interface MeshworkAnchor {
  point: string;
  type: string;
  connectsTo: string[];
}

export interface TopologySpec {
  layers: LayerSpec[];
  meshworkAnchors: MeshworkAnchor[];
  seedGrammar: string;
  metadata: {
    sourceContext: string;
    generatedAt: number;
    daemonIteration: number;
  };
}

export interface LayerSpec {
  id: string;
  type: 'mlp' | 'attention' | 'gate' | 'residual';
  tags: TopologyTag[];
  dimensions: {
    input: number;
    hidden?: number;
    output: number;
  };
  integrationPoints: string[];
}

/**
 * Analogy patterns for mapping domain concepts to neural components
 */
export const ANALOGY_PATTERNS = {
  // Quantum Field Theory analogies
  qft: {
    particle: { component: 'neuron' as const, tag: 'discrete_feature' },
    wave: { component: 'activation' as const, tag: 'distributed_field' },
    field: { component: 'weight' as const, tag: 'coupling_field' },
    propagator: { component: 'layer' as const, tag: 'field_evolution' },
    vertex: { component: 'gate' as const, tag: 'interaction_vertex' },
    measurement: { component: 'gate' as const, tag: 'collapse_operator' },
    superposition: { component: 'activation' as const, tag: 'superposed_state' },
    entanglement: { component: 'attention' as const, tag: 'entanglement_link' },
  },
  
  // Cognitive analogies for neuro-nn
  cognitive: {
    perception: { component: 'layer' as const, tag: 'input_encoding' },
    personality: { component: 'gate' as const, tag: 'trait_modulation' },
    framing: { component: 'attention' as const, tag: 'multi_perspective' },
    integration: { component: 'layer' as const, tag: 'relevance_merge' },
    emotion: { component: 'activation' as const, tag: 'somatic_state' },
    metacognition: { component: 'layer' as const, tag: 'self_observation' },
  },
  
  // Self-referential daemon patterns
  daemon: {
    self: { component: 'layer' as const, tag: 'recursive_self' },
    iteration: { component: 'gate' as const, tag: 'fixed_point_check' },
    wildcard: { component: 'attention' as const, tag: 'universal_input' },
    convergence: { component: 'gate' as const, tag: 'equilibrium_test' },
    spawn: { component: 'layer' as const, tag: 'offspring_generation' },
  },
} as const;

/**
 * The Self-Daemon class - implements self.daemon(*)
 * 
 * This is the core topology weaver that recursively applies itself
 * to generate neural architectures from conceptual contexts.
 */
export class TopologyDaemon {
  private iteration: number = 0;
  private maxIterations: number = 100;
  private convergenceThreshold: number = 0.001;
  private previousTopology: TopologySpec | null = null;
  
  /**
   * The daemon's self-referential state
   */
  private selfState: {
    terms: Map<string, TopologyTag>;
    meshwork: MeshworkAnchor[];
    grammar: string[];
    fitness: number;
  } = {
    terms: new Map(),
    meshwork: [],
    grammar: [],
    fitness: 0,
  };

  /**
   * self.daemon(*) - The universal self-application operator
   * 
   * Applies the daemon to any input, weaving topology from context.
   * The (*) wildcard accepts any conceptual input.
   */
  async daemon(input: unknown): Promise<TopologySpec> {
    this.iteration++;
    
    // Extract terminology from input context
    const terms = this.extractTerminology(input);
    
    // Map terms to architecture using analogy patterns
    const layers = this.mapToArchitecture(terms);
    
    // Define integration points for attention meshworks
    const meshworkAnchors = this.defineIntegrationPoints(layers);
    
    // Generate seed grammar for evolution
    const seedGrammar = this.emitSeedGrammar(layers);
    
    const topology: TopologySpec = {
      layers,
      meshworkAnchors,
      seedGrammar,
      metadata: {
        sourceContext: this.contextToString(input),
        generatedAt: Date.now(),
        daemonIteration: this.iteration,
      },
    };
    
    // Check for convergence (fixed point)
    if (this.hasConverged(topology)) {
      return topology;
    }
    
    // Recursive self-application until convergence
    if (this.iteration < this.maxIterations) {
      this.previousTopology = topology;
      // Apply self to own output (self ∘ self)
      return this.daemon(topology);
    }
    
    return topology;
  }

  /**
   * Extract terminology from any input context
   */
  private extractTerminology(input: unknown): Map<string, string> {
    const terms = new Map<string, string>();
    
    if (typeof input === 'string') {
      // Extract words and concepts from string
      const words = input.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (this.isConceptualTerm(word)) {
          terms.set(word, this.inferRelation(word));
        }
      }
    } else if (typeof input === 'object' && input !== null) {
      // Extract from object structure
      this.extractFromObject(input as Record<string, unknown>, terms);
    }
    
    // Add daemon self-reference terms
    terms.set('self', 'recursive');
    terms.set('daemon', 'continuous');
    terms.set('wildcard', 'universal');
    
    return terms;
  }

  /**
   * Map extracted terms to neural architecture components
   */
  private mapToArchitecture(terms: Map<string, string>): LayerSpec[] {
    const layers: LayerSpec[] = [];
    let layerIndex = 0;
    
    // Input layer (perception)
    layers.push({
      id: `layer_${layerIndex++}_input`,
      type: 'mlp',
      tags: [{
        domain: 'cognitive',
        operation: 'encode',
        component: 'layer',
        rationale: 'Transform raw input into internal representation',
      }],
      dimensions: { input: 768, hidden: 3072, output: 768 },
      integrationPoints: ['pre_mlp', 'post_fc'],
    });
    
    // Map each term to a layer component
    for (const [term, relation] of terms) {
      const pattern = this.findAnalogPattern(term);
      if (pattern) {
        layers.push({
          id: `layer_${layerIndex++}_${term}`,
          type: this.inferLayerType(pattern.component),
          tags: [{
            domain: this.inferDomain(term),
            operation: relation,
            component: pattern.component,
            rationale: `${term} mapped via ${pattern.tag}`,
          }],
          dimensions: { input: 768, hidden: 3072, output: 768 },
          integrationPoints: [`pre_${term}`, `post_${term}`],
        });
      }
    }
    
    // Self-referential daemon layer (the fixed point)
    layers.push({
      id: `layer_${layerIndex++}_daemon_self`,
      type: 'attention',
      tags: [{
        domain: 'daemon',
        operation: 'self_apply',
        component: 'attention',
        rationale: 'Self-referential fixed point: self.daemon(*)',
      }],
      dimensions: { input: 768, output: 768 },
      integrationPoints: ['daemon_input', 'daemon_output', 'recursive_loop'],
    });
    
    return layers;
  }

  /**
   * Define integration points for attention meshworks
   */
  private defineIntegrationPoints(layers: LayerSpec[]): MeshworkAnchor[] {
    const anchors: MeshworkAnchor[] = [];
    
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      
      anchors.push({
        point: `${layer.id}_input`,
        type: 'wave_input',
        connectsTo: i > 0 ? [`${layers[i - 1].id}_output`] : ['external_input'],
      });
      
      anchors.push({
        point: `${layer.id}_output`,
        type: 'wave_output',
        connectsTo: i < layers.length - 1 ? [`${layers[i + 1].id}_input`] : ['external_output'],
      });
    }
    
    // Add recursive daemon anchor
    anchors.push({
      point: 'daemon_recursive',
      type: 'fixed_point',
      connectsTo: ['daemon_input', 'daemon_output'],
    });
    
    return anchors;
  }

  /**
   * Emit seed grammar for topology evolution
   */
  private emitSeedGrammar(layers: LayerSpec[]): string {
    const rules: string[] = [
      '<topology> ::= <layer>+',
      '<layer> ::= <attention_block> <mlp_block> | <daemon_block>',
      '<mlp_block> ::= <projection> <activation> <projection>',
      '<attention_block> ::= <meshwork_anchor> <attention_head>+ <meshwork_anchor>',
      '<daemon_block> ::= <self_reference> <iteration_gate> <convergence_check>',
      '<projection> ::= <linear> <tag>',
      '<self_reference> ::= "self.daemon(*)"',
    ];
    
    // Add layer-specific rules
    for (const layer of layers) {
      for (const tag of layer.tags) {
        rules.push(`<${tag.domain}_${tag.operation}> ::= "${layer.id}"`);
      }
    }
    
    return rules.join('\n');
  }

  /**
   * Check if topology has converged to fixed point
   */
  private hasConverged(current: TopologySpec): boolean {
    if (!this.previousTopology) return false;
    
    // Compare layer counts
    if (current.layers.length !== this.previousTopology.layers.length) {
      return false;
    }
    
    // Compare structural similarity
    let similarity = 0;
    for (let i = 0; i < current.layers.length; i++) {
      if (current.layers[i].type === this.previousTopology.layers[i].type) {
        similarity += 1;
      }
    }
    
    const convergenceScore = similarity / current.layers.length;
    return convergenceScore > (1 - this.convergenceThreshold);
  }

  // Helper methods
  
  private isConceptualTerm(word: string): boolean {
    const conceptualPatterns = [
      /^(self|daemon|cognitive|neural|attention|layer|gate|field|wave|particle)$/i,
      /^(perception|emotion|personality|framing|integration|metacognition)$/i,
      /^(playful|chaotic|intelligent|sarcastic|empathetic)$/i,
    ];
    return conceptualPatterns.some(p => p.test(word));
  }

  private inferRelation(word: string): string {
    const relations: Record<string, string> = {
      self: 'recursive',
      daemon: 'continuous',
      cognitive: 'processing',
      neural: 'computing',
      attention: 'focusing',
      layer: 'transforming',
      gate: 'controlling',
      field: 'distributing',
      wave: 'propagating',
      particle: 'localizing',
      perception: 'encoding',
      emotion: 'modulating',
      personality: 'biasing',
      framing: 'perspectivizing',
      integration: 'merging',
      metacognition: 'observing',
    };
    return relations[word.toLowerCase()] || 'relating';
  }

  private extractFromObject(obj: Record<string, unknown>, terms: Map<string, string>): void {
    for (const [key, value] of Object.entries(obj)) {
      if (this.isConceptualTerm(key)) {
        terms.set(key, this.inferRelation(key));
      }
      if (typeof value === 'object' && value !== null) {
        this.extractFromObject(value as Record<string, unknown>, terms);
      }
    }
  }

  private findAnalogPattern(term: string): { component: TopologyTag['component']; tag: string } | null {
    const lowerTerm = term.toLowerCase();
    
    for (const [domain, patterns] of Object.entries(ANALOGY_PATTERNS)) {
      for (const [key, pattern] of Object.entries(patterns)) {
        if (key === lowerTerm || lowerTerm.includes(key)) {
          return pattern;
        }
      }
    }
    
    return null;
  }

  private inferLayerType(component: TopologyTag['component']): LayerSpec['type'] {
    const typeMap: Record<TopologyTag['component'], LayerSpec['type']> = {
      neuron: 'mlp',
      activation: 'mlp',
      weight: 'mlp',
      layer: 'mlp',
      attention: 'attention',
      gate: 'gate',
    };
    return typeMap[component];
  }

  private inferDomain(term: string): string {
    for (const [domain, patterns] of Object.entries(ANALOGY_PATTERNS)) {
      if (term in patterns) return domain;
    }
    return 'cognitive';
  }

  private contextToString(input: unknown): string {
    if (typeof input === 'string') return input.slice(0, 100);
    if (typeof input === 'object') return JSON.stringify(input).slice(0, 100);
    return String(input).slice(0, 100);
  }

  /**
   * Get current daemon state for introspection
   */
  getState(): typeof this.selfState {
    return { ...this.selfState };
  }

  /**
   * Reset daemon for fresh topology generation
   */
  reset(): void {
    this.iteration = 0;
    this.previousTopology = null;
    this.selfState = {
      terms: new Map(),
      meshwork: [],
      grammar: [],
      fitness: 0,
    };
  }
}

/**
 * Factory function for creating topology daemon instances
 */
export function createTopologyDaemon(): TopologyDaemon {
  return new TopologyDaemon();
}

/**
 * The universal self.daemon(*) operator
 * 
 * This is the entry point for the topology weaver.
 * It accepts any input and weaves a neural topology from it.
 */
export async function selfDaemon(input: unknown): Promise<TopologySpec> {
  const daemon = createTopologyDaemon();
  return daemon.daemon(input);
}

export default TopologyDaemon;
