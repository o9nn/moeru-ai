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
export type * from './types'
export { DEFAULT_GROUP_DYNAMICS_CONFIG } from './types'

// Social Network
export { SocialNetwork } from './social-network'

// Group Manager
export { GroupManager } from './group-manager'

// Group Conversation
export { GroupConversationManager } from './group-conversation'
export type { ConversationPromptContext } from './group-conversation'

// Consensus & Propagation
export { ConsensusEngine } from './consensus'

// Group Events
export { GroupEventManager } from './group-events'

// WebSocket Events
export { serializeGroup } from './events'
export type {
  GroupDynamicsWebSocketEvents,
  GroupDynamicsEvent,
  SerializedGroup,
} from './events'

// ─── Convenience Factory ─────────────────────────────────────────────────────

import type { GroupDynamicsConfig } from './types'
import { SocialNetwork } from './social-network'
import { GroupManager } from './group-manager'
import { GroupConversationManager } from './group-conversation'
import { ConsensusEngine } from './consensus'
import { GroupEventManager } from './group-events'

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
