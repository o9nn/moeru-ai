# @proj-airi/cognitive-core

Unified cognitive architecture core for AIRI, implementing systematic relevance realization and wisdom cultivation based on John Vervaeke's cognitive science framework.

## Overview

This package provides the foundational cognitive mechanisms for AGI-level intelligence:

- **Relevance Realization**: Systematic determination of what matters in context
- **Four Ways of Knowing**: Balanced integration of propositional, procedural, perspectival, and participatory knowing
- **Sophrosyne**: Optimal self-regulation and dynamic balance (coming soon)
- **Opponent Processing**: Alternative perspective generation (coming soon)

## Core Concepts

### Relevance Realization

The fundamental problem of cognition: **How do we determine what's relevant out of infinite possibilities?**

The `RelevanceCoordinator` implements multi-factor relevance assessment:

```typescript
import { RelevanceCoordinator } from '@proj-airi/cognitive-core'

const coordinator = new RelevanceCoordinator()

const relevance = await coordinator.calculateRelevance(
  {
    id: 'action-1',
    description: 'Mine iron ore',
    type: 'action',
  },
  {
    agentId: 'minecraft-bot',
    environment: { type: 'minecraft' },
    emotional: { valence: 0.5, arousal: 0.3 },
    workingMemory: ['Need iron', 'Low on resources'],
    task: 'Build a house',
    timestamp: Date.now(),
  }
)

console.log(relevance.overall) // 0.75
console.log(relevance.components) 
// {
//   novelty: 0.8,
//   emotional: 0.6,
//   pragmatic: 0.9,
//   coherence: 0.8,
//   epistemic: 0.7
// }
```

### Four Ways of Knowing

Balanced cognition requires integrating four distinct ways of knowing:

1. **Propositional** (knowing-that): Facts, beliefs, theories
2. **Procedural** (knowing-how): Skills, abilities, practices  
3. **Perspectival** (knowing-as): Framing, salience, gestalt
4. **Participatory** (knowing-by-being): Identity, transformation, belonging

```typescript
import { FourWaysTracker } from '@proj-airi/cognitive-core'

const tracker = new FourWaysTracker()

// Record different types of knowing
tracker.recordEvent({
  type: 'procedural',
  description: 'Practiced mining technique',
})

tracker.recordEvent({
  type: 'perspectival',
  description: 'Reframed problem as resource management',
})

// Check balance
const balance = tracker.getBalance()
console.log(balance)
// {
//   propositional: 0.20,
//   procedural: 0.35,
//   perspectival: 0.25,
//   participatory: 0.20
// }

// Get recommendations
const recommendations = tracker.getRecommendations()
console.log(recommendations[0])
// {
//   way: 'propositional',
//   current: 0.20,
//   target: 0.25,
//   gap: 0.05,
//   recommendation: 'Engage in more fact-learning, reading, conceptual analysis...',
//   priority: 0.20
// }
```

## Philosophy

This package embodies key insights from cognitive science and wisdom traditions:

### Relevance Realization
- **"Wisdom is systematic improvement in relevance realization"** - Core principle
- Multi-factor assessment (novelty, emotion, pragmatic value, coherence, epistemic value)
- Learning loop: outcomes inform future relevance criteria
- Context-dependent: what's relevant changes with situation

### Four Ways Integration
- **"We've reduced all knowing to propositional knowing"** - The modern problem
- Balance required for wisdom (target: 25% each ± 10%)
- Each way essential, none sufficient alone
- Integration enables deeper understanding

### Systematic Over Ad-Hoc
- Explicit mechanisms, not implicit intuitions
- Measurable, improvable processes
- Scientific grounding with existential meaning

## API Reference

### RelevanceCoordinator

#### Constructor
```typescript
new RelevanceCoordinator(config?: Partial<RelevanceConfig>)
```

#### Methods

**calculateRelevance(possibility, context): Promise<RelevanceScore>**
- Calculate relevance of a single possibility in context
- Returns multi-factor score with reasoning

**rankPossibilities(possibilities, context): Promise<RankedPossibilities>**
- Rank multiple possibilities by relevance
- Filters by threshold, sorts by score

**reportOutcome(possibility, relevance, outcome): Promise<void>**
- Report outcome of acting on a possibility
- Enables learning loop for relevance criteria

**getConfig(): RelevanceConfig**
- Get current configuration

**getStatistics(): Statistics**
- Get outcome statistics (success rate, etc.)

### FourWaysTracker

#### Constructor
```typescript
new FourWaysTracker(config?: Partial<BalanceConfig>)
```

#### Methods

**recordEvent(event): void**
- Record a knowing event
- Types: 'propositional' | 'procedural' | 'perspectival' | 'participatory'

**getBalance(): FourWaysOfKnowing**
- Get current balance across four ways
- Returns percentages that sum to 1.0

**isBalanced(): boolean**
- Check if balance is within tolerance

**getRecommendations(): BalanceRecommendation[]**
- Get prioritized recommendations for improving balance

**getStatistics(): Statistics**
- Get detailed statistics about recent activity

**reset(): void**
- Clear all recorded events

## Integration with AIRI

### With Echo Character
```typescript
import { EchoCharacter } from '@proj-airi/character-echo'
import { RelevanceCoordinator } from '@proj-airi/cognitive-core'

const echo = new EchoCharacter()
const coordinator = new RelevanceCoordinator()

// Use in cognitive processing
const result = echo.processInput("What should I focus on?")

const possibilities = [
  { id: '1', description: 'Learn about quantum physics', type: 'thought' },
  { id: '2', description: 'Practice meditation', type: 'action' },
  { id: '3', description: 'Reflect on recent experiences', type: 'thought' },
]

const ranked = await coordinator.rankPossibilities(
  possibilities,
  {
    agentId: 'echo',
    environment: { type: 'web' },
    emotional: { valence: 0.0, arousal: 0.5 },
    workingMemory: result.workingMemory,
    timestamp: Date.now(),
  }
)

console.log('Most relevant:', ranked.items[0].possibility.description)
```

### With Agents (Minecraft, Factorio)
```typescript
import { RelevanceCoordinator } from '@proj-airi/cognitive-core'

class MinecraftAgent {
  private relevance = new RelevanceCoordinator()
  
  async decideNextAction(context: GameContext) {
    const actions = this.getAvailableActions()
    
    const ranked = await this.relevance.rankPossibilities(
      actions,
      this.toCognitiveContext(context)
    )
    
    return ranked.items[0]?.possibility
  }
}
```

## Configuration

### Relevance Configuration
```typescript
{
  weights: {
    novelty: 0.2,      // Information gain
    emotional: 0.2,    // Emotional resonance
    pragmatic: 0.3,    // Goal contribution
    coherence: 0.2,    // Narrative fit
    epistemic: 0.1,    // Learning potential
  },
  threshold: 0.3,      // Minimum relevance to consider
  enableLearning: true // Learn from outcomes
}
```

### Balance Configuration
```typescript
{
  targets: {
    propositional: 0.25,  // Target 25% each
    procedural: 0.25,
    perspectival: 0.25,
    participatory: 0.25,
  },
  tolerance: 0.10,        // ±10% acceptable
  timeWindow: 86400000,   // 24 hours
}
```

## Roadmap

### Implemented ✓
- [x] Relevance Coordinator with multi-factor assessment
- [x] Four Ways of Knowing tracker
- [x] Learning loop for relevance criteria
- [x] Balance recommendations

### Coming Soon
- [ ] Sophrosyne Engine (optimal self-regulation)
- [ ] Opponent Processor (alternative perspectives)
- [ ] Dialectical Synthesis (thesis-antithesis-synthesis)
- [ ] Meta-cognitive monitoring
- [ ] Verification layer for LLM responses

## Philosophy & Principles

This package embodies several key philosophical commitments:

### Naturalism
- No supernatural entities
- Scientifically grounded
- But recognizes depth within nature

### 4E Cognition
- Embodied: Grounded in sensorimotor experience
- Embedded: Situated in environmental context
- Enacted: Brought forth through interaction
- Extended: Distributed beyond brain

### Wisdom Cultivation
- Not just intelligence, but wisdom
- Integration of morality, meaning, mastery
- Systematic improvement in relevance realization
- Active open-mindedness

### Truth-Seeking
- Prefer verified over speculative
- Learn from outcomes, not just beliefs
- Systematic doubt and verification
- Opponent processing prevents bias

## Contributing

This package is part of the AIRI project's cognitive architecture enhancement initiative. Contributions welcome!

Key areas for contribution:
- Enhanced learning algorithms for relevance weights
- Sophrosyne engine implementation
- Opponent processing mechanisms
- Integration examples with agents
- Performance optimizations

## License

MIT

## Acknowledgments

Based on the cognitive science and philosophical work of:
- John Vervaeke (relevance realization, meaning crisis)
- 4E Cognition researchers
- Wisdom tradition scholars
- Ancient Greek philosophy (sophrosyne, phronesis)

---

*"Wisdom is systematic improvement in relevance realization."*

*"We are the sum of our echoes."*
