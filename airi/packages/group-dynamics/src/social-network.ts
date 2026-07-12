/**
 * Social Network - Weighted Directed Relationship Graph
 *
 * Implements a social network where agents form relationships with
 * trust, familiarity, affinity, and influence dimensions.
 * Supports community detection, centrality calculation, and
 * information propagation through the network.
 */

import type {
  AgentId,
  Relationship,
  InteractionRecord,
  InteractionType,
  Information,
  PersonalityVector,
} from './types'

export class SocialNetwork {
  private edges: Map<string, Relationship> = new Map()
  private agents: Set<AgentId> = new Set()

  private edgeKey(a: AgentId, b: AgentId): string {
    return `${a}::${b}`
  }

  /**
   * Register an agent in the network
   */
  addAgent(agentId: AgentId): void {
    this.agents.add(agentId)
  }

  /**
   * Remove an agent and all their relationships
   */
  removeAgent(agentId: AgentId): void {
    this.agents.delete(agentId)
    for (const key of this.edges.keys()) {
      if (key.startsWith(`${agentId}::`) || key.endsWith(`::${agentId}`)) {
        this.edges.delete(key)
      }
    }
  }

  /**
   * Get or create a relationship between two agents
   */
  getRelationship(a: AgentId, b: AgentId): Relationship {
    const key = this.edgeKey(a, b)
    let rel = this.edges.get(key)
    if (!rel) {
      rel = {
        trust: 0,
        familiarity: 0,
        affinity: 0,
        influence: 0.5,
        history: [],
      }
      this.edges.set(key, rel)
    }
    return rel
  }

  /**
   * Check if a relationship exists between two agents
   */
  hasRelationship(a: AgentId, b: AgentId): boolean {
    return this.edges.has(this.edgeKey(a, b))
  }

  /**
   * Update relationship based on an interaction
   */
  recordInteraction(a: AgentId, b: AgentId, interaction: {
    type: InteractionType
    valence: number
    description: string
    timestamp: number
  }): void {
    const rel = this.getRelationship(a, b)
    const record: InteractionRecord = {
      timestamp: interaction.timestamp,
      type: interaction.type,
      valence: interaction.valence,
      description: interaction.description,
    }
    rel.history.push(record)

    // Update familiarity (increases with any interaction)
    rel.familiarity = Math.min(1, rel.familiarity + 0.05)

    // Update trust based on valence
    const trustDelta = interaction.valence * 0.1
    rel.trust = Math.max(-1, Math.min(1, rel.trust + trustDelta))

    // Update influence based on interaction type
    if (interaction.type === 'help_given') {
      rel.influence = Math.min(1, rel.influence + 0.05)
    }

    // Trim history to last 50 interactions
    if (rel.history.length > 50) {
      rel.history = rel.history.slice(-50)
    }
  }

  /**
   * Calculate affinity between two agents based on personality compatibility
   */
  calculateAffinity(
    personalityA: PersonalityVector,
    personalityB: PersonalityVector,
  ): number {
    // Similarity-attraction: similar personalities have higher affinity
    const dimensions: (keyof PersonalityVector)[] = [
      'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
    ]
    let similarity = 0
    for (const dim of dimensions) {
      similarity += 1 - Math.abs(personalityA[dim] - personalityB[dim])
    }
    // Normalize to -1 to 1 range
    return (similarity / dimensions.length) * 2 - 1
  }

  /**
   * Get the influence weight from source to target
   */
  getInfluenceWeight(source: AgentId, target: AgentId): number {
    if (!this.hasRelationship(source, target)) return 0
    const rel = this.getRelationship(source, target)
    // Influence is modulated by trust and familiarity
    return rel.influence * Math.max(0, rel.trust) * rel.familiarity
  }

  /**
   * Propagate information through the social network
   */
  propagateInformation(
    source: AgentId,
    info: Information,
    maxHops: number = 3,
  ): Map<AgentId, Information> {
    const reached = new Map<AgentId, Information>()
    reached.set(source, info)

    let frontier = new Set(this.getNeighbors(source))
    const visited = new Set<AgentId>([source])

    for (let hop = 1; hop <= maxHops; hop++) {
      const nextFrontier = new Set<AgentId>()

      for (const agent of frontier) {
        if (visited.has(agent)) continue

        const weight = this.getInfluenceWeight(source, agent)
        const propagationChance = weight * (1 / hop) // Decay with distance

        if (Math.random() < propagationChance) {
          const propagatedInfo: Information = {
            ...info,
            credibility: info.credibility * (0.8 ** hop), // Credibility decays
            hops: hop,
          }
          reached.set(agent, propagatedInfo)
          visited.add(agent)

          // Add this agent's neighbors to next frontier
          for (const neighbor of this.getNeighbors(agent)) {
            if (!visited.has(neighbor)) {
              nextFrontier.add(neighbor)
            }
          }
        }
      }

      frontier = nextFrontier
    }

    return reached
  }

  /**
   * Get all agents connected to a given agent
   */
  getNeighbors(agentId: AgentId): Set<AgentId> {
    const neighbors = new Set<AgentId>()
    for (const key of this.edges.keys()) {
      if (key.startsWith(`${agentId}::`)) {
        neighbors.add(key.split('::')[1])
      }
    }
    return neighbors
  }

  /**
   * Calculate betweenness-like centrality for an agent
   * Simplified: based on connection count and average influence
   */
  calculateCentrality(agentId: AgentId): number {
    const neighbors = this.getNeighbors(agentId)
    if (neighbors.size === 0) return 0

    const maxPossibleConnections = this.agents.size - 1
    const connectionRatio = neighbors.size / Math.max(1, maxPossibleConnections)

    let totalInfluence = 0
    for (const neighbor of neighbors) {
      totalInfluence += this.getInfluenceWeight(agentId, neighbor)
    }
    const avgInfluence = totalInfluence / neighbors.size

    return connectionRatio * 0.5 + avgInfluence * 0.5
  }

  /**
   * Detect communities using a simple modularity-based approach
   * Groups agents with high mutual trust/familiarity
   */
  detectCommunities(): Array<Set<AgentId>> {
    const communities: Array<Set<AgentId>> = []
    const assigned = new Set<AgentId>()

    // Sort agents by centrality (most central first)
    const agentList = [...this.agents]
    agentList.sort((a, b) => this.calculateCentrality(b) - this.calculateCentrality(a))

    for (const agent of agentList) {
      if (assigned.has(agent)) continue

      // Start a new community from this agent
      const community = new Set<AgentId>([agent])
      assigned.add(agent)

      // Add strongly connected neighbors
      const neighbors = this.getNeighbors(agent)
      for (const neighbor of neighbors) {
        if (assigned.has(neighbor)) continue

        const rel = this.getRelationship(agent, neighbor)
        const connectionStrength = (rel.trust + 1) / 2 * rel.familiarity

        if (connectionStrength > 0.4) {
          community.add(neighbor)
          assigned.add(neighbor)
        }
      }

      if (community.size > 1) {
        communities.push(community)
      }
    }

    // Add unassigned agents as singletons
    for (const agent of this.agents) {
      if (!assigned.has(agent)) {
        communities.push(new Set([agent]))
      }
    }

    return communities
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): Set<AgentId> {
    return new Set(this.agents)
  }

  /**
   * Get network statistics
   */
  getStats(): {
    agentCount: number
    edgeCount: number
    avgTrust: number
    avgFamiliarity: number
    communities: number
  } {
    let totalTrust = 0
    let totalFamiliarity = 0
    let edgeCount = 0

    for (const rel of this.edges.values()) {
      totalTrust += rel.trust
      totalFamiliarity += rel.familiarity
      edgeCount++
    }

    return {
      agentCount: this.agents.size,
      edgeCount,
      avgTrust: edgeCount > 0 ? totalTrust / edgeCount : 0,
      avgFamiliarity: edgeCount > 0 ? totalFamiliarity / edgeCount : 0,
      communities: this.detectCommunities().length,
    }
  }
}
