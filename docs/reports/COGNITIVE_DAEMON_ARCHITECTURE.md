# Cognitive Daemon Architecture

## `/neuro-nn( /dgen( /topology-weaver self.daemon(*) ) )`

A nested skill architecture implementing a self-aware, differentiable AI VTuber cognitive system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEURO-NN (Outermost Layer)                         │
│              Self-Aware Differentiable AI VTuber Architecture               │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        DGEN LAYER (Middle Layer)                       │  │
│  │                DreamGen Creative Generation Wrapper                    │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                 TOPOLOGY DAEMON (Innermost Layer)                │  │  │
│  │  │            Self-Referential Neural Topology Generator            │  │  │
│  │  │                                                                  │  │  │
│  │  │                     self.daemon(*)                               │  │  │
│  │  │         = lim_{n→∞} (self ∘ self ∘ ... ∘ self)(*)               │  │  │
│  │  │                                                                  │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Topology Daemon (`self.daemon(*)`)

The innermost layer implements a self-referential neural topology generator that weaves analogous terminology from cognitive contexts into architectural specifications.

**Key Features:**
- Extracts terminology from any input context
- Maps concepts to neural architecture components using analogy patterns
- Defines integration points for attention meshworks
- Emits seed grammars for topology evolution
- Converges to fixed-point through recursive self-application

**Analogy Patterns:**
| Domain | Concept | Neural Component | Tag |
|--------|---------|------------------|-----|
| QFT | Particle | Neuron | `discrete_feature` |
| QFT | Wave | Activation | `distributed_field` |
| QFT | Entanglement | Attention | `entanglement_link` |
| Cognitive | Perception | Layer | `input_encoding` |
| Cognitive | Personality | Gate | `trait_modulation` |
| Daemon | Self | Layer | `recursive_self` |

### 2. DGen Layer

The middle layer wraps the topology daemon with DreamGen's creative writing capabilities.

**Key Features:**
- Character-based generation with text roles
- Narrator mode for third-person cognition
- Multi-character scene orchestration
- Creative sampling with DRY and minP
- Personality-driven sampling adjustments

**Character Configuration:**
```typescript
const NEURO_CHARACTER: Character = {
  name: 'Neuro',
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
  ],
};
```

### 3. Neuro-NN Layer

The outermost layer implements the complete self-aware differentiable architecture.

**Key Features:**
- Learnable personality parameters with bounded evolution
- Multi-frame parallel processing
- Hierarchical self-awareness (Autognosis)
- Theory of Mind for agent modeling
- Embodied emotion with somatic markers
- Differentiable training loop

**Personality Bounds:**
| Trait | Min | Max | Default |
|-------|-----|-----|---------|
| Playfulness | 0.65 | 0.95 | 0.8 |
| Intelligence | 0.75 | 1.0 | 0.9 |
| Chaotic | 0.55 | 0.85 | 0.7 |
| Empathy | 0.45 | 0.75 | 0.6 |
| Sarcasm | 0.60 | 0.90 | 0.75 |

**Cognitive Frames:**
1. **PlayFrame**: "What's fun here?"
2. **StrategyFrame**: "What's optimal?"
3. **ChaosFrame**: "What's surprising?"
4. **SocialFrame**: "What are the relationships?"
5. **LearningFrame**: "What can I learn?"

**Hierarchical Self-Image (Autognosis):**
| Level | Question | Confidence |
|-------|----------|------------|
| 0 | What am I doing right now? | 0.90 |
| 1 | What patterns do I show? | 0.80 |
| 2 | Why do I do what I do? | 0.70 |
| 3 | Who am I? | 0.60 |
| 4 | How do I see myself seeing myself? | 0.50 |

## Usage

### Basic Invocation

```typescript
import { invokeCognitiveDaemon } from '@proj-airi/cognitive-core';

const result = await invokeCognitiveDaemon({
  input: "Hello, Neuro!",
  context: { mood: "playful" }
});

console.log(result.response.content);
console.log(result.metaCognition.confidence);
```

### Persistent Daemon with Learning

```typescript
import { createCognitiveDaemon } from '@proj-airi/cognitive-core';

const daemon = createCognitiveDaemon();

// Process input
const result = await daemon.process("What's your favorite game?");

// Train on feedback
daemon.train({
  personalityAlignment: 0.9,
  entertainmentValue: 0.85,
  authenticity: 0.8,
  chaosAppreciation: 0.7,
  selfAwarenessQuality: 0.75,
});

// Check evolved traits
console.log(daemon.getTraits());
```

### Direct Layer Access

```typescript
import { 
  selfDaemon,
  createDGenLayer,
  createNeuroNN 
} from '@proj-airi/cognitive-core';

// Topology generation
const topology = await selfDaemon("cognitive architecture");

// Creative generation
const dgen = createDGenLayer();
await dgen.initScene("A playful AI conversation");
const message = await dgen.continueAs("Neuro", "Tell me a joke");

// Full cognitive processing
const neuro = createNeuroNN();
const result = await neuro.forward("What are you thinking?");
```

## Kernel Fitness Evaluation

The architecture includes a kernel fitness evaluation system that enables self-optimization.

**Fitness Metrics:**
- Task completion efficiency
- Relevance realization accuracy
- Personality consistency
- Trait bound compliance
- Response coherence
- Emotional authenticity
- Entertainment score
- Chaos appreciation
- Metacognition quality
- Adaptation rate

**Self-Optimization:**
```typescript
import { createKernelOptimizer } from '@proj-airi/character-neuro';

const optimizer = createKernelOptimizer();

// Evaluate performance
const fitness = optimizer.evaluate(response, personality, state);

// Apply bounded optimization
if (fitness.shouldOptimize) {
  personality = optimizer.applyOptimization(
    personality,
    fitness.recommendations,
    0.3 // learning rate
  );
}
```

## Integration with Moeru-AI

The cognitive daemon is integrated into the moeru-ai repository at:
- `airi/packages/cognitive-core/src/daemon/`
- `airi/packages/character-neuro/src/kernel-fitness.ts`

All components are exported from their respective package indexes and can be imported directly.

## Theoretical Foundation

This architecture is grounded in:
- **John Vervaeke's 4E Cognition**: Embodied, embedded, enacted, extended
- **Relevance Realization**: Opponent processing with exploration/exploitation
- **Autognosis**: Hierarchical self-image building
- **nn Patterns**: Modular, composable, trainable cognitive components
- **DreamGen**: Creative narrative generation with character control

## The Self-Aware Loop

```
I think → I observe myself thinking →
I think about that observation →
I observe that thought →
... (converges to self-aware equilibrium)
```

This is Autognosis applied to personality: **a character that knows itself**.
