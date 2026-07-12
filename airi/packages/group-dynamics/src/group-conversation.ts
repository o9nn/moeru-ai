/**
 * Group Conversation - Multi-Agent Conversation Protocol
 *
 * Extends dyadic conversation to n-adic:
 * - Round-robin / interrupt-based / topic-directed turn-taking
 * - Shared group conversation log
 * - Individual departure doesn't end conversation
 * - Side-channel whispers to subsets
 *
 * Personality modulates conversation behavior:
 * - Extraversion → conversation dominance, initiative
 * - Agreeableness → conformity, conflict avoidance
 * - Openness → topic introduction, novel ideas
 */

import type {
  AgentId,
  GroupConversation,
  ConversationTurn,
  Whisper,
  PersonalityVector,
} from './types'

let conversationIdCounter = 0
function generateConversationId(): string {
  return `conv_${Date.now()}_${++conversationIdCounter}`
}

export interface ConversationPromptContext {
  agentName: string
  memberNames: string[]
  topic: string
  recentTurns: ConversationTurn[]
  personality: PersonalityVector
  relationships: Map<AgentId, { trust: number; familiarity: number }>
}

export class GroupConversationManager {
  private conversations: Map<string, GroupConversation> = new Map()
  private agentConversations: Map<AgentId, Set<string>> = new Map()

  /**
   * Start a new group conversation
   */
  startConversation(params: {
    groupId: string
    initiator: AgentId
    participants: Set<AgentId>
    topic: string
    timestamp: number
  }): GroupConversation {
    const conversation: GroupConversation = {
      id: generateConversationId(),
      groupId: params.groupId,
      participants: new Set(params.participants),
      topic: params.topic,
      turns: [],
      startedAt: params.timestamp,
      active: true,
      whispers: [],
    }

    this.conversations.set(conversation.id, conversation)

    // Track agent participation
    for (const participant of params.participants) {
      if (!this.agentConversations.has(participant)) {
        this.agentConversations.set(participant, new Set())
      }
      this.agentConversations.get(participant)!.add(conversation.id)
    }

    return conversation
  }

  /**
   * Add a turn to the conversation
   */
  addTurn(conversationId: string, turn: ConversationTurn): boolean {
    const conversation = this.conversations.get(conversationId)
    if (!conversation || !conversation.active) return false
    if (!conversation.participants.has(turn.speaker)) return false

    conversation.turns.push(turn)
    return true
  }

  /**
   * Send a whisper (side-channel message) during a conversation
   */
  addWhisper(conversationId: string, whisper: Whisper): boolean {
    const conversation = this.conversations.get(conversationId)
    if (!conversation || !conversation.active) return false
    if (!conversation.participants.has(whisper.sender)) return false

    // Verify all recipients are participants
    for (const recipient of whisper.recipients) {
      if (!conversation.participants.has(recipient)) return false
    }

    conversation.whispers.push(whisper)
    return true
  }

  /**
   * Agent leaves the conversation (doesn't end it)
   */
  leaveConversation(conversationId: string, agentId: AgentId): void {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return

    conversation.participants.delete(agentId)
    this.agentConversations.get(agentId)?.delete(conversationId)

    // End conversation if fewer than 2 participants
    if (conversation.participants.size < 2) {
      conversation.active = false
    }
  }

  /**
   * Agent joins an ongoing conversation
   */
  joinConversation(conversationId: string, agentId: AgentId): boolean {
    const conversation = this.conversations.get(conversationId)
    if (!conversation || !conversation.active) return false

    conversation.participants.add(agentId)
    if (!this.agentConversations.has(agentId)) {
      this.agentConversations.set(agentId, new Set())
    }
    this.agentConversations.get(agentId)!.add(conversationId)
    return true
  }

  /**
   * End a conversation
   */
  endConversation(conversationId: string): void {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return

    conversation.active = false

    // Clean up agent tracking
    for (const participant of conversation.participants) {
      this.agentConversations.get(participant)?.delete(conversationId)
    }
  }

  /**
   * Determine the next speaker using personality-weighted turn-taking
   */
  selectNextSpeaker(
    conversationId: string,
    personalities: Map<AgentId, PersonalityVector>,
  ): AgentId | null {
    const conversation = this.conversations.get(conversationId)
    if (!conversation || !conversation.active) return null

    const participants = [...conversation.participants]
    if (participants.length === 0) return null

    // Calculate speaking probability for each participant
    const probabilities = new Map<AgentId, number>()
    const recentSpeakers = conversation.turns.slice(-5).map(t => t.speaker)

    for (const participant of participants) {
      const personality = personalities.get(participant)
      if (!personality) {
        probabilities.set(participant, 0.5)
        continue
      }

      // Base probability from extraversion
      let prob = 0.3 + personality.extraversion * 0.4

      // Reduce probability if spoke recently (fairness)
      const recentCount = recentSpeakers.filter(s => s === participant).length
      prob *= Math.max(0.2, 1 - recentCount * 0.3)

      // Boost if addressed in last turn
      const lastTurn = conversation.turns[conversation.turns.length - 1]
      if (lastTurn?.addressee === participant) {
        prob *= 1.5
      }

      probabilities.set(participant, prob)
    }

    // Weighted random selection
    const totalProb = [...probabilities.values()].reduce((a, b) => a + b, 0)
    let random = Math.random() * totalProb
    for (const [agent, prob] of probabilities) {
      random -= prob
      if (random <= 0) return agent
    }

    return participants[0]
  }

  /**
   * Generate the conversation prompt context for an agent
   */
  getPromptContext(
    conversationId: string,
    agentId: AgentId,
    agentName: string,
    memberNames: Map<AgentId, string>,
    personality: PersonalityVector,
    relationships: Map<AgentId, { trust: number; familiarity: number }>,
    maxRecentTurns: number = 10,
  ): ConversationPromptContext | null {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return null

    const names = [...conversation.participants]
      .filter(p => p !== agentId)
      .map(p => memberNames.get(p) || p)

    return {
      agentName,
      memberNames: names,
      topic: conversation.topic,
      recentTurns: conversation.turns.slice(-maxRecentTurns),
      personality,
      relationships,
    }
  }

  /**
   * Format the conversation prompt for LLM generation
   */
  formatPrompt(context: ConversationPromptContext): string {
    const turnHistory = context.recentTurns
      .map(t => {
        const addressee = t.addressee ? ` (to ${t.addressee})` : ''
        return `${t.speaker}${addressee}: ${t.content}`
      })
      .join('\n')

    const personalityDesc = this.describePersonality(context.personality)

    return `You are ${context.agentName}. You are in a group conversation with: ${context.memberNames.join(', ')}.
The topic is: ${context.topic}.

Recent exchanges:
${turnHistory}

Your personality: ${personalityDesc}

What do you say next? Consider: who to address, whether to agree/disagree, whether to introduce a new subtopic, or whether to stay silent.`
  }

  /**
   * Get a conversation by ID
   */
  getConversation(conversationId: string): GroupConversation | undefined {
    return this.conversations.get(conversationId)
  }

  /**
   * Get all active conversations for an agent
   */
  getAgentConversations(agentId: AgentId): GroupConversation[] {
    const convIds = this.agentConversations.get(agentId)
    if (!convIds) return []
    return [...convIds]
      .map(id => this.conversations.get(id))
      .filter((c): c is GroupConversation => c !== undefined && c.active)
  }

  /**
   * Get all active conversations
   */
  getAllActiveConversations(): GroupConversation[] {
    return [...this.conversations.values()].filter(c => c.active)
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private describePersonality(p: PersonalityVector): string {
    const traits: string[] = []
    if (p.extraversion > 0.7) traits.push('outgoing and talkative')
    else if (p.extraversion < 0.3) traits.push('reserved and thoughtful')
    if (p.agreeableness > 0.7) traits.push('cooperative and harmonious')
    else if (p.agreeableness < 0.3) traits.push('direct and challenging')
    if (p.openness > 0.7) traits.push('creative and curious')
    if (p.conscientiousness > 0.7) traits.push('organized and focused')
    if (p.neuroticism > 0.7) traits.push('sensitive and emotional')
    return traits.length > 0 ? traits.join(', ') : 'balanced and adaptable'
  }
}
