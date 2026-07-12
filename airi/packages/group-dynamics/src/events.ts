/**
 * Group Dynamics WebSocket Events
 *
 * Extends the AIRI WebSocket event system with group-aware events.
 * These events enable real-time group state synchronization across
 * connected clients and services.
 */

import type {
  AgentId,
  Group,
  GroupConversation,
  ConversationTurn,
  Whisper,
  GroupEvent,
  ConsensusResult,
  Proposal,
  Information,
} from './types'

/**
 * WebSocket events for group dynamics
 */
export interface GroupDynamicsWebSocketEvents {
  // ─── Group Lifecycle ─────────────────────────────────────────────────────

  /** A new group has formed */
  'group:formed': {
    group: SerializedGroup
    trigger: string
  }

  /** A group has been dissolved */
  'group:dissolved': {
    groupId: string
    reason: string
  }

  /** A member joined a group */
  'group:member-joined': {
    groupId: string
    agentId: AgentId
  }

  /** A member left a group */
  'group:member-left': {
    groupId: string
    agentId: AgentId
  }

  /** Group cohesion updated */
  'group:cohesion-updated': {
    groupId: string
    cohesion: number
    stage: string
  }

  /** Group roles changed */
  'group:roles-updated': {
    groupId: string
    roles: Array<{ agentId: AgentId; role: string; fitness: number }>
  }

  // ─── Conversation ──────────────────────────────────────────────────────

  /** A group conversation started */
  'group:conversation-started': {
    conversationId: string
    groupId: string
    topic: string
    participants: AgentId[]
  }

  /** A turn was added to a group conversation */
  'group:conversation-turn': {
    conversationId: string
    turn: ConversationTurn
  }

  /** A whisper was sent during a conversation */
  'group:whisper': {
    conversationId: string
    whisper: Whisper
  }

  /** A conversation ended */
  'group:conversation-ended': {
    conversationId: string
  }

  // ─── Events & Reflection ───────────────────────────────────────────────

  /** A group event occurred */
  'group:event': {
    event: GroupEvent
  }

  /** Collective reflection triggered */
  'group:reflection-triggered': {
    groupId: string
    prompts: Array<{ agentId: AgentId; prompt: string }>
  }

  // ─── Consensus & Propagation ───────────────────────────────────────────

  /** A proposal was made */
  'group:proposal': {
    groupId: string
    proposal: Proposal
  }

  /** Consensus result */
  'group:consensus-result': {
    groupId: string
    proposalId: string
    result: ConsensusResult
  }

  /** Information propagated through network */
  'group:info-propagated': {
    source: AgentId
    info: Information
    reached: AgentId[]
  }

  // ─── Social Network ────────────────────────────────────────────────────

  /** Relationship updated */
  'group:relationship-updated': {
    agentA: AgentId
    agentB: AgentId
    trust: number
    familiarity: number
  }

  /** Network state snapshot (periodic) */
  'group:network-snapshot': {
    agents: AgentId[]
    edges: Array<{
      source: AgentId
      target: AgentId
      trust: number
      familiarity: number
      influence: number
    }>
    communities: Array<AgentId[]>
  }
}

/**
 * Serialized group for transmission (Sets converted to arrays)
 */
export interface SerializedGroup {
  id: string
  members: AgentId[]
  formationTime: number
  cohesion: number
  sharedGoals: Array<{ id: string; description: string; progress: number }>
  roles: Array<{ agentId: AgentId; role: string; fitness: number }>
  norms: Array<{ id: string; description: string; strength: number }>
  stage: string
}

/**
 * Serialize a Group object for WebSocket transmission
 */
export function serializeGroup(group: Group): SerializedGroup {
  return {
    id: group.id,
    members: [...group.members],
    formationTime: group.formationTime,
    cohesion: group.cohesion,
    sharedGoals: group.sharedGoals.map(g => ({
      id: g.id,
      description: g.description,
      progress: g.progress,
    })),
    roles: [...group.roles.entries()].map(([agentId, role]) => ({
      agentId,
      role: role.type,
      fitness: role.fitness,
    })),
    norms: group.norms.map(n => ({
      id: n.id,
      description: n.description,
      strength: n.strength,
    })),
    stage: group.stage,
  }
}

export type GroupDynamicsEvent = keyof GroupDynamicsWebSocketEvents
