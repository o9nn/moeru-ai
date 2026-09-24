import type { AgentProfile, Proposal, ProtoGroup } from './types'

import { describe, expect, it } from 'vitest'

import { createGroupDynamicsSystem } from './index'

const personality = {
  openness: 0.5,
  conscientiousness: 0.5,
  extraversion: 0.5,
  agreeableness: 0.5,
  neuroticism: 0.5,
}

function agent(id: string): AgentProfile {
  return {
    id,
    name: id,
    personality,
    position: { x: 1, y: 1, zone: 'commons' },
    activeGoals: [],
    cognitiveLoad: 0,
  }
}

describe('group dynamics system', () => {
  it('forms, votes, and dissolves a voluntary group', () => {
    const system = createGroupDynamicsSystem()
    const protoGroup: ProtoGroup = {
      members: new Set(['a', 'b']),
      trigger: { type: 'social_affinity', score: 0.8 },
      affinity: 0.8,
      detectedAt: 10,
    }

    const group = system.groups.formGroup(protoGroup, 10)

    expect(system.groups.getGroup(group.id)).toBe(group)
    expect(system.groups.getAgentGroups('a')).toEqual([group])
    expect([...group.roles.values()].filter(role => role.type === 'leader')).toHaveLength(1)
    expect(group.collectiveMemory[0]?.tags).toContain('formation')

    const proposal: Proposal = {
      id: 'proposal-1',
      proposer: 'a',
      description: 'Explore the commons',
      type: 'action',
      timestamp: 11,
    }
    expect(system.consensus.quickVote(group, proposal, new Map([
      ['a', true],
      ['b', false],
    ]))).toEqual({
      approved: false,
      forCount: 1,
      againstCount: 1,
      abstainCount: 0,
    })

    system.groups.removeMember(group.id, 'b', 12)

    expect(group.stage).toBe('adjourning')
    expect(system.groups.getGroup(group.id)).toBeUndefined()
    expect(system.groups.getAgentGroups('a')).toEqual([])
  })

  it('detects a proximity group only after the configured duration', () => {
    const system = createGroupDynamicsSystem({ proximityThreshold: 2 })
    const agents = [agent('a'), agent('b')]

    expect(system.groups.detectPotentialGroups(agents, 5)).toEqual([])

    const detected = system.groups.detectPotentialGroups(agents, 7)
    const proximityGroup = detected.find(group => group.trigger.type === 'proximity')

    expect(proximityGroup).toBeDefined()
    expect(proximityGroup?.members).toEqual(new Set(['a', 'b']))
    expect(proximityGroup?.detectedAt).toBe(7)
  })
})
