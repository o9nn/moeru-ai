/**
 * Consensus & Information Propagation
 *
 * Two mechanisms operating at different timescales:
 * - Fast: Information propagation (gossip model with network decay)
 * - Slow: Consensus formation (opinion dynamics with conformity pressure)
 *
 * No omniscient coordinator - information propagates through the social network.
 * Personality consistency - introverts don't suddenly become leaders.
 */

import type {
  AgentId,
  Group,
  Proposal,
  ConsensusResult,
  Faction,
  Information,
  PersonalityVector,
  GroupDynamicsConfig,
} from './types'
import { DEFAULT_GROUP_DYNAMICS_CONFIG } from './types'
import type { SocialNetwork } from './social-network'

export class ConsensusEngine {
  private config: GroupDynamicsConfig

  constructor(
    private network: SocialNetwork,
    config?: Partial<GroupDynamicsConfig>,
  ) {
    this.config = { ...DEFAULT_GROUP_DYNAMICS_CONFIG, ...config }
  }

  /**
   * Seek consensus on a proposal within a group
   *
   * Uses iterative opinion update (DeGroot model with bounded confidence):
   * Each round, agents update their opinion based on social pressure from
   * discussion partners, weighted by influence and conformity.
   */
  seekConsensus(
    group: Group,
    proposal: Proposal,
    personalities: Map<AgentId, PersonalityVector>,
    evaluations: Map<AgentId, number>,
  ): ConsensusResult {
    // Initialize opinions from agent evaluations (0-1 scale)
    const opinions = new Map<AgentId, number>(evaluations)

    // Ensure all members have an opinion
    for (const member of group.members) {
      if (!opinions.has(member)) {
        opinions.set(member, 0.5) // Neutral default
      }
    }

    const members = [...group.members]

    for (let round = 0; round < this.config.maxConsensusRounds; round++) {
      const newOpinions = new Map<AgentId, number>()

      for (const member of members) {
        const personality = personalities.get(member)
        const currentOpinion = opinions.get(member) || 0.5

        // Get discussion partners (group members with relationships)
        const partners = members.filter(m =>
          m !== member && this.network.hasRelationship(m, member),
        )

        if (partners.length === 0) {
          newOpinions.set(member, currentOpinion)
          continue
        }

        // Calculate social pressure
        let weightedSum = 0
        let totalWeight = 0

        for (const partner of partners) {
          const influence = this.network.getInfluenceWeight(partner, member)
          const partnerOpinion = opinions.get(partner) || 0.5
          weightedSum += partnerOpinion * influence
          totalWeight += influence
        }

        const socialPressure = totalWeight > 0 ? weightedSum / totalWeight : currentOpinion

        // Conformity is modulated by agreeableness
        const baseConformity = this.config.conformityPressure
        const personalConformity = personality
          ? baseConformity * (0.5 + personality.agreeableness * 0.5)
          : baseConformity

        // Update opinion: blend own opinion with social pressure
        const newOpinion = (1 - personalConformity) * currentOpinion + personalConformity * socialPressure
        newOpinions.set(member, Math.max(0, Math.min(1, newOpinion)))
      }

      // Update all opinions simultaneously
      for (const [member, opinion] of newOpinions) {
        opinions.set(member, opinion)
      }

      // Check convergence
      const values = [...opinions.values()]
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
      const std = Math.sqrt(variance)

      if (std < this.config.convergenceThreshold) {
        return {
          reached: true,
          position: mean,
          rounds: round + 1,
        }
      }
    }

    // Consensus not reached - detect factions
    const factions = this.detectFactions(opinions)

    return {
      reached: false,
      factions,
      rounds: this.config.maxConsensusRounds,
    }
  }

  /**
   * Quick vote on a proposal (majority rules)
   */
  quickVote(
    group: Group,
    proposal: Proposal,
    votes: Map<AgentId, boolean>,
  ): { approved: boolean; forCount: number; againstCount: number; abstainCount: number } {
    let forCount = 0
    let againstCount = 0
    let abstainCount = 0

    for (const member of group.members) {
      const vote = votes.get(member)
      if (vote === true) forCount++
      else if (vote === false) againstCount++
      else abstainCount++
    }

    return {
      approved: forCount > againstCount,
      forCount,
      againstCount,
      abstainCount,
    }
  }

  /**
   * Propagate information through the network (gossip model)
   *
   * Breadth-first spread with influence-weighted probability and credibility decay.
   */
  propagateInformation(
    source: AgentId,
    info: Information,
  ): Map<AgentId, Information> {
    return this.network.propagateInformation(source, info, this.config.maxPropagationHops)
  }

  /**
   * Simulate opinion dynamics over multiple rounds without seeking full consensus
   * Useful for tracking how opinions evolve naturally
   */
  simulateOpinionDynamics(
    agents: AgentId[],
    initialOpinions: Map<AgentId, number>,
    personalities: Map<AgentId, PersonalityVector>,
    rounds: number,
  ): Map<AgentId, number[]> {
    const history = new Map<AgentId, number[]>()
    const opinions = new Map(initialOpinions)

    // Initialize history
    for (const agent of agents) {
      history.set(agent, [opinions.get(agent) || 0.5])
    }

    for (let round = 0; round < rounds; round++) {
      const newOpinions = new Map<AgentId, number>()

      for (const agent of agents) {
        const personality = personalities.get(agent)
        const currentOpinion = opinions.get(agent) || 0.5
        const neighbors = this.network.getNeighbors(agent)

        if (neighbors.size === 0) {
          newOpinions.set(agent, currentOpinion)
          continue
        }

        // Bounded confidence: only consider opinions within a threshold
        const confidenceBound = personality
          ? 0.3 + personality.openness * 0.4 // Open agents consider wider range
          : 0.5

        let weightedSum = 0
        let totalWeight = 0

        for (const neighbor of neighbors) {
          if (!agents.includes(neighbor)) continue
          const neighborOpinion = opinions.get(neighbor) || 0.5

          // Bounded confidence check
          if (Math.abs(neighborOpinion - currentOpinion) <= confidenceBound) {
            const influence = this.network.getInfluenceWeight(neighbor, agent)
            weightedSum += neighborOpinion * influence
            totalWeight += influence
          }
        }

        const socialPressure = totalWeight > 0 ? weightedSum / totalWeight : currentOpinion
        const conformity = personality
          ? this.config.conformityPressure * (0.5 + personality.agreeableness * 0.5)
          : this.config.conformityPressure

        const newOpinion = (1 - conformity) * currentOpinion + conformity * socialPressure
        newOpinions.set(agent, Math.max(0, Math.min(1, newOpinion)))
      }

      for (const [agent, opinion] of newOpinions) {
        opinions.set(agent, opinion)
        history.get(agent)!.push(opinion)
      }
    }

    return history
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private detectFactions(opinions: Map<AgentId, number>): Faction[] {
    // Simple k-means-like clustering into 2-3 factions
    const entries = [...opinions.entries()]
    if (entries.length < 2) return []

    // Sort by opinion
    entries.sort((a, b) => a[1] - b[1])

    // Find the largest gap to split into factions
    let maxGap = 0
    let splitIndex = Math.floor(entries.length / 2)

    for (let i = 1; i < entries.length; i++) {
      const gap = entries[i][1] - entries[i - 1][1]
      if (gap > maxGap) {
        maxGap = gap
        splitIndex = i
      }
    }

    const factionA = entries.slice(0, splitIndex)
    const factionB = entries.slice(splitIndex)

    const factions: Faction[] = []

    if (factionA.length > 0) {
      const members = new Set(factionA.map(([id]) => id))
      const position = factionA.reduce((sum, [, v]) => sum + v, 0) / factionA.length
      factions.push({ members, position, strength: factionA.length / entries.length })
    }

    if (factionB.length > 0) {
      const members = new Set(factionB.map(([id]) => id))
      const position = factionB.reduce((sum, [, v]) => sum + v, 0) / factionB.length
      factions.push({ members, position, strength: factionB.length / entries.length })
    }

    return factions
  }
}
