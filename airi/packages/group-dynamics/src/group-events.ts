/**
 * Group Events & Collective Reflection
 *
 * Manages group-level events (meetings, celebrations, conflicts, completions)
 * and collective reflection cycles. Events experienced together form shared
 * episodic memories that strengthen group cohesion.
 */

import type {
  AgentId,
  Group,
  GroupEvent,
  GroupEventType,
  GroupMemoryNode,
} from './types'

let eventIdCounter = 0
function generateEventId(): string {
  return `evt_${Date.now()}_${++eventIdCounter}`
}

export class GroupEventManager {
  private events: Map<string, GroupEvent> = new Map()
  private groupEvents: Map<string, string[]> = new Map()

  /**
   * Create and record a group event
   */
  createEvent(params: {
    type: GroupEventType
    participants: Set<AgentId>
    description: string
    outcome: string
    emotionalValence: number
    timestamp: number
  }): GroupEvent {
    const event: GroupEvent = {
      id: generateEventId(),
      type: params.type,
      participants: new Set(params.participants),
      timestamp: params.timestamp,
      description: params.description,
      outcome: params.outcome,
      emotionalValence: params.emotionalValence,
    }

    this.events.set(event.id, event)
    return event
  }

  /**
   * Generate a shared memory node from an event
   * This memory is added to all participants' memory streams
   */
  generateSharedMemory(event: GroupEvent): GroupMemoryNode {
    return {
      id: `mem_${event.id}`,
      description: `${event.type}: ${event.description}. Outcome: ${event.outcome}`,
      timestamp: event.timestamp,
      participants: [...event.participants],
      emotionalValence: event.emotionalValence,
      importance: this.calculateImportance(event),
      tags: [event.type, ...this.generateTags(event)],
    }
  }

  /**
   * Trigger a collective reflection for a group
   * Returns reflection prompts for each member
   */
  triggerCollectiveReflection(
    group: Group,
    currentTick: number,
  ): Map<AgentId, string> {
    const reflectionPrompts = new Map<AgentId, string>()

    // Gather recent group memories
    const recentMemories = group.collectiveMemory
      .filter(m => currentTick - m.timestamp < 50)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)

    const memoryContext = recentMemories
      .map(m => `- ${m.description} (importance: ${m.importance.toFixed(2)})`)
      .join('\n')

    for (const member of group.members) {
      const role = group.roles.get(member)
      const roleContext = role ? `Your role: ${role.type}` : 'You have no assigned role yet'

      reflectionPrompts.set(member, `
You are reflecting on your group experience.
Group stage: ${group.stage}
Group cohesion: ${group.cohesion.toFixed(2)}
${roleContext}
Members: ${[...group.members].join(', ')}

Recent shared experiences:
${memoryContext}

Reflect on:
1. How is our group doing?
2. What patterns have emerged in our interactions?
3. What could we do differently?
4. How do I feel about my role?
5. What shared goals should we pursue next?
`.trim())
    }

    // Record the reflection event
    this.createEvent({
      type: 'collective_reflection',
      participants: group.members,
      description: 'Group conducted collective reflection',
      outcome: 'Reflection prompts generated',
      emotionalValence: 0.2,
      timestamp: currentTick,
    })

    return reflectionPrompts
  }

  /**
   * Create a meeting event with agenda
   */
  scheduleMeeting(
    group: Group,
    agenda: string,
    timestamp: number,
  ): GroupEvent {
    return this.createEvent({
      type: 'meeting',
      participants: group.members,
      description: `Group meeting: ${agenda}`,
      outcome: 'pending',
      emotionalValence: 0.1,
      timestamp,
    })
  }

  /**
   * Record a conflict event between group members
   */
  recordConflict(
    participants: Set<AgentId>,
    description: string,
    resolution: string,
    timestamp: number,
  ): GroupEvent {
    return this.createEvent({
      type: 'conflict',
      participants,
      description,
      outcome: resolution,
      emotionalValence: -0.5,
      timestamp,
    })
  }

  /**
   * Record a celebration event
   */
  recordCelebration(
    group: Group,
    reason: string,
    timestamp: number,
  ): GroupEvent {
    return this.createEvent({
      type: 'celebration',
      participants: group.members,
      description: `Celebration: ${reason}`,
      outcome: 'Group morale boosted',
      emotionalValence: 0.8,
      timestamp,
    })
  }

  /**
   * Get all events for a group
   */
  getGroupEvents(groupId: string): GroupEvent[] {
    const eventIds = this.groupEvents.get(groupId) || []
    return eventIds
      .map(id => this.events.get(id))
      .filter((e): e is GroupEvent => e !== undefined)
  }

  /**
   * Get events involving a specific agent
   */
  getAgentEvents(agentId: AgentId): GroupEvent[] {
    return [...this.events.values()]
      .filter(e => e.participants.has(agentId))
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get recent events (within a time window)
   */
  getRecentEvents(since: number): GroupEvent[] {
    return [...this.events.values()]
      .filter(e => e.timestamp >= since)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private calculateImportance(event: GroupEvent): number {
    const typeWeights: Record<GroupEventType, number> = {
      meeting: 0.5,
      celebration: 0.7,
      conflict: 0.8,
      task_completion: 0.9,
      member_joined: 0.6,
      member_left: 0.7,
      norm_established: 0.6,
      role_change: 0.5,
      collective_reflection: 0.4,
    }

    const baseImportance = typeWeights[event.type] || 0.5
    const participantBonus = Math.min(0.2, event.participants.size * 0.03)
    const emotionalBonus = Math.abs(event.emotionalValence) * 0.2

    return Math.min(1, baseImportance + participantBonus + emotionalBonus)
  }

  private generateTags(event: GroupEvent): string[] {
    const tags: string[] = []

    if (event.emotionalValence > 0.5) tags.push('positive')
    else if (event.emotionalValence < -0.3) tags.push('negative')

    if (event.participants.size > 4) tags.push('large_group')
    if (event.type === 'task_completion') tags.push('achievement')
    if (event.type === 'conflict') tags.push('tension')

    return tags
  }
}
