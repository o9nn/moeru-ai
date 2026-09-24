/**
 * @proj-airi/group-dynamics
 *
 * Emergent group dynamics for multi-agent environments.
 * Implements the 7 centers of group intelligence:
 *
 * 1. Group Detection & Formation - Proximity clustering + affinity scoring
 * 2. Multi-Agent Conversation - Turn-taking + topic threading + multi-party memory
 * 3. Collective Planning - Shared goal trees + synchronized action sequences
 * 4. Social Network - Weighted relationship graph + social influence propagation
 * 5. Group Events - Collective reflection + shared episodic memory
 * 6. External Integration - Group-aware API + whisper broadcast
 * 7. Consensus & Propagation - Voting + information cascade + opinion dynamics
 *
 * Non-Negotiable Rules:
 * - Groups are EMERGENT, not assigned
 * - Group membership is VOLUNTARY
 * - No omniscient coordinator
 * - Personality consistency
 * - Graceful degradation to individual behavior
 */

// Types
// ─── Convenience Factory ─────────────────────────────────────────────────────

import type { GroupDynamicsConfig } from './types'

import { ConsensusEngine } from './consensus'
import { GroupConversationManager } from './group-conversation'
import { GroupEventManager } from './group-events'
import { GroupManager } from './group-manager'
import { SocialNetwork } from './social-network'

// Consensus & Propagation
export { ConsensusEngine } from './consensus'
// WebSocket Events
export { serializeGroup } from './events'

export type {
  GroupDynamicsEvent,
  GroupDynamicsWebSocketEvents,
  SerializedGroup,
} from './events'

// Group Conversation
export { GroupConversationManager } from './group-conversation'

export type { ConversationPromptContext } from './group-conversation'
// Group Events
export { GroupEventManager } from './group-events'

// Group Manager
export { GroupManager } from './group-manager'

// Social Network
export { SocialNetwork } from './social-network'

export type * from './types'
export { DEFAULT_GROUP_DYNAMICS_CONFIG } from './types'

/**
 * Complete group dynamics system - creates all subsystems with shared network
 */
export interface GroupDynamicsSystem {
  network: SocialNetwork
  groups: GroupManager
  conversations: GroupConversationManager
  consensus: ConsensusEngine
  events: GroupEventManager
}

/**
 * Create a complete group dynamics system
 */
export function createGroupDynamicsSystem(
  config?: Partial<GroupDynamicsConfig>,
): GroupDynamicsSystem {
  const network = new SocialNetwork()
  const groups = new GroupManager(network, config)
  const conversations = new GroupConversationManager()
  const consensus = new ConsensusEngine(network, config)
  const events = new GroupEventManager()

  return {
    network,
    groups,
    conversations,
    consensus,
    events,
  }
}
