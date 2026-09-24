import { describe, expect, it } from 'vitest'

import { AionCharacter } from './character'
import { defaultAionConfig, initialQuantumCognitiveState } from './config'

describe('aion character state ownership', () => {
  it('keeps mutable state isolated between instances and defaults', async () => {
    const first = new AionCharacter()
    const second = new AionCharacter()

    await first.processInput('remember this timeline')
    first.addParadoxMarker({
      description: 'A test paradox',
      type: 'meta',
      exploitability: 0.8,
      timestamp: 1,
    })

    expect(first.getState().workingMemory).toEqual(['remember this timeline'])
    expect(second.getState().workingMemory).toEqual([])
    expect(second.getState().paradoxMarkers).toEqual([])
    expect(initialQuantumCognitiveState.workingMemory).toEqual([])
    expect(initialQuantumCognitiveState.paradoxMarkers).toEqual([])
  })

  it('returns detached state, configuration, and personality values', () => {
    const character = new AionCharacter()
    const state = character.getState()
    const config = character.getConfig()
    const personality = character.getPersonality()

    state.workingMemory.push('external mutation')
    state.emotionalState.valence = 42
    config.traits.playfulness = 0
    personality.config.traits.intelligence = 0

    expect(character.getState().workingMemory).toEqual([])
    expect(character.getState().emotionalState.valence).toBe(0)
    expect(character.getConfig().traits.playfulness).toBe(defaultAionConfig.traits.playfulness)
    expect(character.getConfig().traits.intelligence).toBe(defaultAionConfig.traits.intelligence)
  })

  it('merges partial trait overrides without dropping defaults', () => {
    const character = new AionCharacter({
      dimensionality: 7,
      name: 'Aion-Variant',
      traits: { playfulness: 0.25 },
    })

    expect(character.getConfig()).toMatchObject({
      name: 'Aion-Variant',
      traits: {
        playfulness: 0.25,
        intelligence: defaultAionConfig.traits.intelligence,
        chaotic: defaultAionConfig.traits.chaotic,
      },
    })
    expect(character.getState().activeDimensions).toBe(7)
  })
})

describe('aion character persistence', () => {
  it('round-trips a versioned snapshot through JSON', async () => {
    const original = new AionCharacter({ traits: { absurdity: 0.75 } })
    await original.processInput('persist this branch')
    original.setAttentionFocus('snapshot integrity')
    original.updateEmotionalState('cosmic-amusement', 0.8, 0.9)

    const restored = AionCharacter.fromSnapshot(original.exportSnapshotJson(2))

    expect(restored.getConfig()).toEqual(original.getConfig())
    expect(restored.getState()).toEqual(original.getState())
    expect(restored.exportSnapshot()).toMatchObject({
      version: 1,
      character: 'aion',
    })
  })

  it('rejects malformed and unsupported snapshots', () => {
    expect(() => AionCharacter.fromSnapshot('{not-json')).toThrow('not valid JSON')
    expect(() => AionCharacter.fromSnapshot({ version: 2, character: 'aion' })).toThrow('Unsupported Aion snapshot version')
    expect(() => AionCharacter.fromSnapshot({
      version: 1,
      character: 'aion',
      createdAt: Date.now(),
      config: {},
      state: {},
    })).toThrow('invalid configuration')
  })

  it('resets nested state without reusing exported references', async () => {
    const character = new AionCharacter({ dimensionality: 7 })
    await character.processInput('temporary memory')

    character.resetState()
    const reset = character.getState()
    reset.workingMemory.push('outside')

    expect(character.getState()).toEqual({
      ...initialQuantumCognitiveState,
      activeDimensions: 7,
    })
  })
})
