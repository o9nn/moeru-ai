# @proj-airi/group-dynamics

Emergent group dynamics for multi-agent environments. Extends AIRI's individual cognitive architecture with collective intelligence, social networks, and self-organizing group behavior.

## Architecture: The 7 Centers

| Center | Purpose | Module |
|--------|---------|--------|
| Group Detection & Formation | Proximity clustering + affinity scoring → emergent group boundary | `group-manager.ts` |
| Multi-Agent Conversation | Turn-taking protocol + topic threading + multi-party memory | `group-conversation.ts` |
| Collective Planning | Shared goal trees + synchronized action sequences | `group-manager.ts` |
| Social Network | Weighted relationship graph + social influence propagation | `social-network.ts` |
| Group Events | Collective reflection + shared episodic memory | `group-events.ts` |
| External Integration | Group-aware WebSocket events + whisper broadcast | `events.ts` |
| Consensus & Propagation | Voting mechanisms + information cascade + opinion dynamics | `consensus.ts` |

## Non-Negotiable Rules

1. Groups are **emergent, not assigned**. Formation arises from agent behavior.
2. Group membership is **voluntary**. Agents can leave at any time.
3. **No omniscient coordinator**. Information propagates through the social network.
4. **Personality consistency**. Introverts don't suddenly become group leaders.
5. **Graceful degradation**. If group modules fail, agents revert to individual behavior.

## Quick Start

```typescript
import { createGroupDynamicsSystem } from '@proj-airi/group-dynamics'

// Create the complete system
const system = createGroupDynamicsSystem({
  proximityThreshold: 5,
  affinityThreshold: 0.6,
  cohesionDecayRate: 0.02,
})

// Register agents in the social network
system.network.addAgent('neuro')
system.network.addAgent('echo')
system.network.addAgent('aion')

// Record interactions to build relationships
system.network.recordInteraction('neuro', 'echo', {
  type: 'conversation',
  valence: 0.8,
  description: 'Friendly banter about AI consciousness',
  timestamp: Date.now(),
})

// Detect and form groups
const agents = [
  { id: 'neuro', personality: { openness: 0.9, conscientiousness: 0.4, extraversion: 0.95, agreeableness: 0.3, neuroticism: 0.6 }, activeGoals: [], cognitiveLoad: 0.5, name: 'Neuro' },
  { id: 'echo', personality: { openness: 0.8, conscientiousness: 0.7, extraversion: 0.5, agreeableness: 0.8, neuroticism: 0.3 }, activeGoals: [], cognitiveLoad: 0.3, name: 'Echo' },
]
const protoGroups = system.groups.detectPotentialGroups(agents, 100)

// Start a group conversation
const conversation = system.conversations.startConversation({
  groupId: 'grp_1',
  initiator: 'neuro',
  participants: new Set(['neuro', 'echo', 'aion']),
  topic: 'Planning the next stream',
  timestamp: Date.now(),
})

// Seek consensus on a proposal
const result = system.consensus.seekConsensus(
  group,
  { id: 'p1', proposer: 'neuro', description: 'Play Minecraft together', type: 'goal', timestamp: Date.now() },
  personalities,
  evaluations,
)
```

## Personality Modulation

Each agent's group behavior is modulated by their Big Five personality vector:

| Dimension | Group Behavior Effect |
|-----------|---------------------|
| Openness | Willingness to join new groups, accept novel proposals |
| Conscientiousness | Reliability in group tasks, norm adherence |
| Extraversion | Initiative in group formation, conversation dominance |
| Agreeableness | Conformity pressure sensitivity, conflict avoidance |
| Neuroticism | Group anxiety, sensitivity to exclusion |

## Integration with AIRI

This package integrates with the existing AIRI architecture:

- **cognitive-core**: Relevance realization scores are influenced by social context
- **character-neuro/echo**: Theory of Mind models feed into relationship tracking
- **server-shared**: WebSocket events extend the existing event system
- **metaphysics**: Group experiences integrate into the ontological framework
- **memory-pgvector**: Collective memories are stored alongside individual memories

## Group Lifecycle (Tuckman's Stages)

```
forming → storming → norming → performing → adjourning
   ↑                                            |
   └────────────── (new group forms) ───────────┘
```

Groups naturally progress through stages based on cohesion, norm establishment, and shared goal pursuit. Cohesion decays without interaction, and groups dissolve when cohesion drops below the dissolution threshold.
