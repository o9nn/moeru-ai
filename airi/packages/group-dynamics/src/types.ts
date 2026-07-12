/**
 * Group Dynamics - Type Definitions
 *
 * Types for emergent group formation, social networks, collective planning,
 * and consensus mechanisms in multi-agent environments.
 */

// ─── Agent Identity ──────────────────────────────────────────────────────────

export type AgentId = string

export interface AgentProfile {
  id: AgentId
  name: string
  /** Big Five personality traits (0-1 scale) */
  personality: PersonalityVector
  /** Current spatial position in the environment */
  position?: SpatialPosition
  /** Current goals the agent is pursuing */
  activeGoals: Goal[]
  /** Agent's current cognitive load (0-1) */
  cognitiveLoad: number
}

export interface PersonalityVector {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

export interface SpatialPosition {
  x: number
  y: number
  z?: number
  /** Environment zone identifier */
  zone?: string
}

// ─── Group Formation ─────────────────────────────────────────────────────────

export interface ProtoGroup {
  /** Candidate members detected by proximity/affinity */
  members: Set<AgentId>
  /** What triggered the detection */
  trigger: GroupFormationTrigger
  /** Affinity score of the proto-group (0-1) */
  affinity: number
  /** When the proto-group was first detected */
  detectedAt: number
}

export type GroupFormationTrigger =
  | { type: 'proximity'; duration: number; zone: string }
  | { type: 'shared_goal'; goalId: string; overlap: number }
  | { type: 'social_affinity'; score: number }
  | { type: 'event_invitation'; eventId: string }

export interface Group {
  id: string
  members: Set<AgentId>
  formationTime: number
  /** Cohesion decays without interaction (0-1) */
  cohesion: number
  /** Shared goals adopted by the group */
  sharedGoals: Goal[]
  /** Collective memory of shared experiences */
  collectiveMemory: GroupMemoryNode[]
  /** Emergent role assignments */
  roles: Map<AgentId, GroupRole>
  /** Behavioral norms established by the group */
  norms: GroupNorm[]
  /** Group lifecycle stage */
  stage: GroupStage
  /** Last interaction tick */
  lastInteractionTick: number
}

export type GroupStage =
  | 'forming'    // Initial gathering
  | 'storming'   // Role negotiation, conflict
  | 'norming'    // Establishing norms
  | 'performing' // Productive collaboration
  | 'adjourning' // Dissolving

export interface GroupRole {
  type: 'leader' | 'facilitator' | 'contributor' | 'observer' | 'specialist'
  /** How well the agent fits this role (0-1) */
  fitness: number
  /** When the role was assigned */
  assignedAt: number
}

export interface GroupNorm {
  id: string
  description: string
  /** How strongly enforced (0-1) */
  strength: number
  /** How many members comply (0-1) */
  compliance: number
  establishedAt: number
}

// ─── Goals & Planning ────────────────────────────────────────────────────────

export interface Goal {
  id: string
  description: string
  priority: number
  /** Decomposed subtasks */
  subtasks?: SubTask[]
  /** Progress toward completion (0-1) */
  progress: number
  /** Deadline tick, if any */
  deadline?: number
}

export interface SubTask {
  id: string
  description: string
  assignee?: AgentId
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  dependencies: string[]
}

export interface GroupPlan {
  id: string
  groupId: string
  goal: Goal
  subtasks: SubTask[]
  schedule: ScheduleEntry[]
  checkpoints: Checkpoint[]
  status: 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'abandoned'
}

export interface ScheduleEntry {
  subtaskId: string
  assignee: AgentId
  startTick: number
  endTick: number
}

export interface Checkpoint {
  tick: number
  description: string
  criteria: string
  met: boolean
}

// ─── Social Network ──────────────────────────────────────────────────────────

export interface Relationship {
  /** Trust level (-1 to 1) */
  trust: number
  /** Interaction frequency (0-1) */
  familiarity: number
  /** Personality compatibility (-1 to 1) */
  affinity: number
  /** Asymmetric influence/power (0-1) */
  influence: number
  /** Interaction history */
  history: InteractionRecord[]
}

export interface InteractionRecord {
  timestamp: number
  type: InteractionType
  /** Emotional valence of the interaction (-1 to 1) */
  valence: number
  /** Brief description */
  description: string
}

export type InteractionType =
  | 'conversation'
  | 'collaboration'
  | 'conflict'
  | 'help_given'
  | 'help_received'
  | 'shared_experience'
  | 'gossip'

// ─── Conversation ────────────────────────────────────────────────────────────

export interface GroupConversation {
  id: string
  groupId: string
  participants: Set<AgentId>
  topic: string
  turns: ConversationTurn[]
  startedAt: number
  /** Whether the conversation is still active */
  active: boolean
  /** Side-channel whispers */
  whispers: Whisper[]
}

export interface ConversationTurn {
  speaker: AgentId
  /** Who is being addressed (undefined = everyone) */
  addressee?: AgentId
  content: string
  timestamp: number
  /** Emotional tone */
  tone: 'neutral' | 'positive' | 'negative' | 'questioning' | 'assertive' | 'humorous'
}

export interface Whisper {
  sender: AgentId
  recipients: Set<AgentId>
  content: string
  timestamp: number
}

// ─── Group Events ────────────────────────────────────────────────────────────

export interface GroupEvent {
  id: string
  type: GroupEventType
  participants: Set<AgentId>
  timestamp: number
  description: string
  outcome: string
  /** Emotional valence of the event (-1 to 1) */
  emotionalValence: number
}

export type GroupEventType =
  | 'meeting'
  | 'celebration'
  | 'conflict'
  | 'task_completion'
  | 'member_joined'
  | 'member_left'
  | 'norm_established'
  | 'role_change'
  | 'collective_reflection'

export interface GroupMemoryNode {
  id: string
  description: string
  timestamp: number
  participants: AgentId[]
  emotionalValence: number
  importance: number
  /** Tags for retrieval */
  tags: string[]
}

// ─── Consensus & Propagation ─────────────────────────────────────────────────

export interface Proposal {
  id: string
  proposer: AgentId
  description: string
  type: 'goal' | 'norm' | 'action' | 'role_change' | 'membership'
  timestamp: number
}

export interface ConsensusResult {
  reached: boolean
  /** Final consensus position (0-1, where 1 = full agreement) */
  position?: number
  /** If consensus not reached, the detected factions */
  factions?: Faction[]
  /** Number of rounds taken */
  rounds: number
}

export interface Faction {
  members: Set<AgentId>
  position: number
  strength: number
}

export interface Information {
  id: string
  content: string
  source: AgentId
  /** Original credibility (0-1) */
  credibility: number
  timestamp: number
  /** How many hops from source */
  hops: number
}

// ─── Configuration ───────────────────────────────────────────────────────────

export interface GroupDynamicsConfig {
  /** Minimum proximity duration (ticks) before group detection */
  proximityThreshold: number
  /** Minimum affinity score for group formation */
  affinityThreshold: number
  /** Cohesion decay rate per tick without interaction */
  cohesionDecayRate: number
  /** Cohesion level below which group dissolves */
  dissolutionThreshold: number
  /** Maximum hops for information propagation */
  maxPropagationHops: number
  /** Conformity pressure in consensus (0-1) */
  conformityPressure: number
  /** Convergence threshold for consensus */
  convergenceThreshold: number
  /** Maximum rounds for consensus */
  maxConsensusRounds: number
  /** Maximum group size before splitting pressure */
  maxGroupSize: number
}

export const DEFAULT_GROUP_DYNAMICS_CONFIG: GroupDynamicsConfig = {
  proximityThreshold: 5,
  affinityThreshold: 0.6,
  cohesionDecayRate: 0.02,
  dissolutionThreshold: 0.2,
  maxPropagationHops: 3,
  conformityPressure: 0.3,
  convergenceThreshold: 0.1,
  maxConsensusRounds: 10,
  maxGroupSize: 8,
}
