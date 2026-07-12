/**
 * Group Manager - Emergent Group Formation & Lifecycle
 *
 * Groups are emergent, not assigned. Formation arises from agent behavior:
 * - Sustained spatial proximity
 * - Shared goal detection
 * - Social affinity threshold
 * - External event co-location
 *
 * Groups follow Tuckman's stages: forming → storming → norming → performing → adjourning
 */

import type {
  AgentId,
  AgentProfile,
  Group,
  GroupRole,
  GroupNorm,
  GroupStage,
  ProtoGroup,
  GroupFormationTrigger,
  Goal,
  GroupMemoryNode,
  GroupDynamicsConfig,
} from './types'
import { DEFAULT_GROUP_DYNAMICS_CONFIG } from './types'
import type { SocialNetwork } from './social-network'

let groupIdCounter = 0
function generateGroupId(): string {
  return `grp_${Date.now()}_${++groupIdCounter}`
}

export class GroupManager {
  private groups: Map<string, Group> = new Map()
  private agentGroups: Map<AgentId, Set<string>> = new Map()
  private proximityTracker: Map<string, { members: Set<AgentId>; since: number }> = new Map()
  private config: GroupDynamicsConfig

  constructor(
    private network: SocialNetwork,
    config?: Partial<GroupDynamicsConfig>,
  ) {
    this.config = { ...DEFAULT_GROUP_DYNAMICS_CONFIG, ...config }
  }

  /**
   * Detect potential groups based on current agent states
   */
  detectPotentialGroups(
    agents: AgentProfile[],
    currentTick: number,
  ): ProtoGroup[] {
    const protoGroups: ProtoGroup[] = []

    // Strategy 1: Spatial proximity clustering
    const proximityClusters = this.detectProximityClusters(agents, currentTick)
    protoGroups.push(...proximityClusters)

    // Strategy 2: Shared goal detection
    const goalClusters = this.detectSharedGoals(agents)
    protoGroups.push(...goalClusters)

    // Strategy 3: Social affinity from network
    const affinityClusters = this.detectAffinityClusters(agents)
    protoGroups.push(...affinityClusters)

    return protoGroups
  }

  /**
   * Form a group from a proto-group when conditions are met
   */
  formGroup(protoGroup: ProtoGroup, currentTick: number): Group {
    const group: Group = {
      id: generateGroupId(),
      members: new Set(protoGroup.members),
      formationTime: currentTick,
      cohesion: protoGroup.affinity,
      sharedGoals: [],
      collectiveMemory: [],
      roles: new Map(),
      norms: [],
      stage: 'forming',
      lastInteractionTick: currentTick,
    }

    // Register group membership
    for (const member of group.members) {
      if (!this.agentGroups.has(member)) {
        this.agentGroups.set(member, new Set())
      }
      this.agentGroups.get(member)!.add(group.id)
    }

    // Assign initial roles based on personality and network position
    this.assignInitialRoles(group, currentTick)

    this.groups.set(group.id, group)

    // Create formation memory
    const memory: GroupMemoryNode = {
      id: `mem_${group.id}_formation`,
      description: `Group formed via ${protoGroup.trigger.type}`,
      timestamp: currentTick,
      participants: [...group.members],
      emotionalValence: 0.5,
      importance: 0.8,
      tags: ['formation', protoGroup.trigger.type],
    }
    group.collectiveMemory.push(memory)

    return group
  }

  /**
   * Dissolve a group
   */
  dissolveGroup(groupId: string, reason: string, currentTick: number): void {
    const group = this.groups.get(groupId)
    if (!group) return

    // Add dissolution memory
    group.collectiveMemory.push({
      id: `mem_${groupId}_dissolution`,
      description: `Group dissolved: ${reason}`,
      timestamp: currentTick,
      participants: [...group.members],
      emotionalValence: -0.3,
      importance: 0.7,
      tags: ['dissolution', reason],
    })

    // Remove group membership
    for (const member of group.members) {
      this.agentGroups.get(member)?.delete(groupId)
    }

    group.stage = 'adjourning'
    this.groups.delete(groupId)
  }

  /**
   * Merge two groups into one
   */
  mergeGroups(groupAId: string, groupBId: string, currentTick: number): Group | null {
    const groupA = this.groups.get(groupAId)
    const groupB = this.groups.get(groupBId)
    if (!groupA || !groupB) return null

    // Create merged group
    const mergedMembers = new Set([...groupA.members, ...groupB.members])
    const protoGroup: ProtoGroup = {
      members: mergedMembers,
      trigger: { type: 'social_affinity', score: (groupA.cohesion + groupB.cohesion) / 2 },
      affinity: (groupA.cohesion + groupB.cohesion) / 2,
      detectedAt: currentTick,
    }

    // Dissolve originals
    this.dissolveGroup(groupAId, 'merged', currentTick)
    this.dissolveGroup(groupBId, 'merged', currentTick)

    // Form new group
    const merged = this.formGroup(protoGroup, currentTick)

    // Inherit shared goals and memories
    merged.sharedGoals = [...groupA.sharedGoals, ...groupB.sharedGoals]
    merged.collectiveMemory = [
      ...groupA.collectiveMemory,
      ...groupB.collectiveMemory,
      ...merged.collectiveMemory,
    ]

    return merged
  }

  /**
   * Split a group into two factions
   */
  splitGroup(
    groupId: string,
    factionA: Set<AgentId>,
    factionB: Set<AgentId>,
    currentTick: number,
  ): [Group, Group] | null {
    const group = this.groups.get(groupId)
    if (!group) return null

    this.dissolveGroup(groupId, 'split', currentTick)

    const protoA: ProtoGroup = {
      members: factionA,
      trigger: { type: 'social_affinity', score: 0.6 },
      affinity: 0.6,
      detectedAt: currentTick,
    }
    const protoB: ProtoGroup = {
      members: factionB,
      trigger: { type: 'social_affinity', score: 0.6 },
      affinity: 0.6,
      detectedAt: currentTick,
    }

    const newA = this.formGroup(protoA, currentTick)
    const newB = this.formGroup(protoB, currentTick)

    return [newA, newB]
  }

  /**
   * Update cohesion for all groups (called each tick)
   */
  updateAllCohesion(currentTick: number): void {
    for (const [groupId, group] of this.groups) {
      const ticksSinceInteraction = currentTick - group.lastInteractionTick
      const decay = this.config.cohesionDecayRate * ticksSinceInteraction

      group.cohesion = Math.max(0, group.cohesion - decay)

      // Dissolve if below threshold
      if (group.cohesion < this.config.dissolutionThreshold) {
        this.dissolveGroup(groupId, 'cohesion_decay', currentTick)
      }

      // Update stage based on cohesion and time
      this.updateGroupStage(group, currentTick)
    }
  }

  /**
   * Record an interaction within a group (boosts cohesion)
   */
  recordGroupInteraction(groupId: string, currentTick: number, valence: number = 0.5): void {
    const group = this.groups.get(groupId)
    if (!group) return

    group.lastInteractionTick = currentTick
    group.cohesion = Math.min(1, group.cohesion + 0.05 * valence)
  }

  /**
   * Add a member to an existing group
   */
  addMember(groupId: string, agentId: AgentId, currentTick: number): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false
    if (group.members.size >= this.config.maxGroupSize) return false

    group.members.add(agentId)
    if (!this.agentGroups.has(agentId)) {
      this.agentGroups.set(agentId, new Set())
    }
    this.agentGroups.get(agentId)!.add(groupId)

    // Assign observer role initially
    group.roles.set(agentId, {
      type: 'observer',
      fitness: 0.5,
      assignedAt: currentTick,
    })

    group.collectiveMemory.push({
      id: `mem_${groupId}_join_${agentId}`,
      description: `${agentId} joined the group`,
      timestamp: currentTick,
      participants: [...group.members],
      emotionalValence: 0.3,
      importance: 0.5,
      tags: ['member_joined'],
    })

    return true
  }

  /**
   * Remove a member from a group (voluntary departure)
   */
  removeMember(groupId: string, agentId: AgentId, currentTick: number): void {
    const group = this.groups.get(groupId)
    if (!group) return

    group.members.delete(agentId)
    group.roles.delete(agentId)
    this.agentGroups.get(agentId)?.delete(groupId)

    group.collectiveMemory.push({
      id: `mem_${groupId}_leave_${agentId}`,
      description: `${agentId} left the group`,
      timestamp: currentTick,
      participants: [...group.members],
      emotionalValence: -0.2,
      importance: 0.4,
      tags: ['member_left'],
    })

    // Dissolve if too few members
    if (group.members.size < 2) {
      this.dissolveGroup(groupId, 'insufficient_members', currentTick)
    }
  }

  /**
   * Get a group by ID
   */
  getGroup(groupId: string): Group | undefined {
    return this.groups.get(groupId)
  }

  /**
   * Get all groups an agent belongs to
   */
  getAgentGroups(agentId: AgentId): Group[] {
    const groupIds = this.agentGroups.get(agentId)
    if (!groupIds) return []
    return [...groupIds]
      .map(id => this.groups.get(id))
      .filter((g): g is Group => g !== undefined)
  }

  /**
   * Get all active groups
   */
  getAllGroups(): Group[] {
    return [...this.groups.values()]
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private detectProximityClusters(
    agents: AgentProfile[],
    currentTick: number,
  ): ProtoGroup[] {
    const protoGroups: ProtoGroup[] = []
    const agentsWithPosition = agents.filter(a => a.position)

    // Simple zone-based clustering
    const zoneGroups = new Map<string, AgentProfile[]>()
    for (const agent of agentsWithPosition) {
      const zone = agent.position!.zone || `${Math.floor(agent.position!.x / 10)}_${Math.floor(agent.position!.y / 10)}`
      if (!zoneGroups.has(zone)) {
        zoneGroups.set(zone, [])
      }
      zoneGroups.get(zone)!.push(agent)
    }

    for (const [zone, zoneAgents] of zoneGroups) {
      if (zoneAgents.length < 2) continue

      const key = zoneAgents.map(a => a.id).sort().join(',')
      let tracker = this.proximityTracker.get(key)
      if (!tracker) {
        tracker = { members: new Set(zoneAgents.map(a => a.id)), since: currentTick }
        this.proximityTracker.set(key, tracker)
      }

      const duration = currentTick - tracker.since
      if (duration >= this.config.proximityThreshold) {
        protoGroups.push({
          members: new Set(zoneAgents.map(a => a.id)),
          trigger: { type: 'proximity', duration, zone },
          affinity: Math.min(1, 0.5 + duration * 0.02),
          detectedAt: currentTick,
        })
      }
    }

    return protoGroups
  }

  private detectSharedGoals(agents: AgentProfile[]): ProtoGroup[] {
    const protoGroups: ProtoGroup[] = []
    const goalAgents = new Map<string, AgentId[]>()

    // Group agents by their active goals
    for (const agent of agents) {
      for (const goal of agent.activeGoals) {
        if (!goalAgents.has(goal.id)) {
          goalAgents.set(goal.id, [])
        }
        goalAgents.get(goal.id)!.push(agent.id)
      }
    }

    for (const [goalId, agentIds] of goalAgents) {
      if (agentIds.length < 2) continue

      // Check if these agents aren't already in a group together
      const members = new Set(agentIds)
      const overlap = agentIds.length / agents.length

      if (overlap > 0.1) {
        protoGroups.push({
          members,
          trigger: { type: 'shared_goal', goalId, overlap },
          affinity: 0.5 + overlap * 0.3,
          detectedAt: Date.now(),
        })
      }
    }

    return protoGroups
  }

  private detectAffinityClusters(agents: AgentProfile[]): ProtoGroup[] {
    const protoGroups: ProtoGroup[] = []
    const communities = this.network.detectCommunities()

    for (const community of communities) {
      if (community.size < 2) continue

      // Calculate average affinity within community
      let totalAffinity = 0
      let pairCount = 0
      const members = [...community]

      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const rel = this.network.getRelationship(members[i], members[j])
          totalAffinity += (rel.trust + 1) / 2 * rel.familiarity
          pairCount++
        }
      }

      const avgAffinity = pairCount > 0 ? totalAffinity / pairCount : 0

      if (avgAffinity >= this.config.affinityThreshold) {
        protoGroups.push({
          members: community,
          trigger: { type: 'social_affinity', score: avgAffinity },
          affinity: avgAffinity,
          detectedAt: Date.now(),
        })
      }
    }

    return protoGroups
  }

  private assignInitialRoles(group: Group, currentTick: number): void {
    // Assign leader to the most central agent
    let maxCentrality = -1
    let leader: AgentId | null = null

    for (const member of group.members) {
      const centrality = this.network.calculateCentrality(member)
      if (centrality > maxCentrality) {
        maxCentrality = centrality
        leader = member
      }
    }

    for (const member of group.members) {
      const role: GroupRole = {
        type: member === leader ? 'leader' : 'contributor',
        fitness: member === leader ? maxCentrality : 0.5,
        assignedAt: currentTick,
      }
      group.roles.set(member, role)
    }
  }

  private updateGroupStage(group: Group, currentTick: number): void {
    const age = currentTick - group.formationTime

    if (group.stage === 'forming' && age > 10) {
      group.stage = 'storming'
    }
    else if (group.stage === 'storming' && group.cohesion > 0.6 && group.norms.length > 0) {
      group.stage = 'norming'
    }
    else if (group.stage === 'norming' && group.cohesion > 0.8 && group.sharedGoals.length > 0) {
      group.stage = 'performing'
    }
  }
}
