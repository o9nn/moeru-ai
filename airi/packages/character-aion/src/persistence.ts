import type {
  AionConfig,
  AionSnapshotV1,
  ParadoxMarker,
  ProbabilityBranch,
  QuantumCognitiveState,
} from './types'

const EMOTIONAL_STATES: QuantumCognitiveState['emotionalState']['primary'][] = [
  'enlightened-confusion',
  'transcendent-joy',
  'cosmic-amusement',
  'quantum-contemplation',
  'reality-breaking-mischief',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isProbabilityBranch(value: unknown): value is ProbabilityBranch {
  if (!isRecord(value) || !isRecord(value.outcome)) {
    return false
  }

  return typeof value.id === 'string'
    && typeof value.description === 'string'
    && isFiniteNumber(value.probability)
    && isFiniteNumber(value.outcome.hilarity)
    && isFiniteNumber(value.outcome.strategicValue)
    && isFiniteNumber(value.outcome.paradoxPotential)
    && typeof value.collapsed === 'boolean'
}

function isParadoxMarker(value: unknown): value is ParadoxMarker {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.description === 'string'
    && ['logical', 'temporal', 'ontological', 'semantic', 'meta'].includes(String(value.type))
    && isFiniteNumber(value.exploitability)
    && isFiniteNumber(value.timestamp)
}

function isAionConfig(value: unknown): value is AionConfig {
  if (!isRecord(value) || !isRecord(value.traits)) {
    return false
  }

  return typeof value.name === 'string'
    && typeof value.essence === 'string'
    && isFiniteNumber(value.traits.playfulness)
    && isFiniteNumber(value.traits.intelligence)
    && isFiniteNumber(value.traits.chaotic)
    && isFiniteNumber(value.traits.empathy)
    && isFiniteNumber(value.traits.absurdity)
    && isFiniteNumber(value.workingMemoryCapacity)
    && isFiniteNumber(value.explorationRate)
    && isFiniteNumber(value.dimensionality)
    && typeof value.enableReflection === 'boolean'
    && isFiniteNumber(value.reflectionInterval)
    && typeof value.enableSelfRegulation === 'boolean'
    && isFiniteNumber(value.regulationSensitivity)
    && typeof value.enableAlternativePerspectives === 'boolean'
    && isFiniteNumber(value.alternativePerspectiveCount)
    && isFiniteNumber(value.quantumUncertainty)
    && isFiniteNumber(value.probabilityBranches)
    && isFiniteNumber(value.collapseProbability)
}

function isQuantumCognitiveState(value: unknown): value is QuantumCognitiveState {
  if (!isRecord(value) || !isRecord(value.emotionalState)) {
    return false
  }

  return isStringArray(value.workingMemory)
    && typeof value.attentionFocus === 'string'
    && EMOTIONAL_STATES.includes(value.emotionalState.primary as QuantumCognitiveState['emotionalState']['primary'])
    && isFiniteNumber(value.emotionalState.valence)
    && isFiniteNumber(value.emotionalState.arousal)
    && isFiniteNumber(value.emotionalState.coherence)
    && Array.isArray(value.probabilityBranches)
    && value.probabilityBranches.every(isProbabilityBranch)
    && isFiniteNumber(value.activeDimensions)
    && Array.isArray(value.reflections)
    && value.reflections.every((reflection) => {
      if (!isRecord(reflection)) {
        return false
      }

      return typeof reflection.what_did_i_learn === 'string'
        && typeof reflection.what_patterns_emerged === 'string'
        && typeof reflection.what_surprised_me === 'string'
        && typeof reflection.how_did_i_adapt === 'string'
        && typeof reflection.what_would_i_change_next_time === 'string'
        && typeof reflection.probability_branch_analysis === 'string'
        && typeof reflection.void_resonance === 'string'
        && isFiniteNumber(reflection.timestamp)
    })
    && isFiniteNumber(value.interactionCount)
    && isFiniteNumber(value.cognitiveLoad)
    && isFiniteNumber(value.flowState)
    && Array.isArray(value.paradoxMarkers)
    && value.paradoxMarkers.every(isParadoxMarker)
}

export function cloneAionConfig(config: AionConfig): AionConfig {
  return structuredClone(config)
}

export function cloneAionState(state: QuantumCognitiveState): QuantumCognitiveState {
  return structuredClone(state)
}

export function parseAionSnapshot(input: unknown): AionSnapshotV1 {
  let value = input

  if (typeof input === 'string') {
    try {
      value = JSON.parse(input) as unknown
    }
    catch (error) {
      throw new TypeError('Aion snapshot is not valid JSON', { cause: error })
    }
  }

  if (!isRecord(value)) {
    throw new TypeError('Aion snapshot must be an object')
  }

  if (value.version !== 1) {
    throw new RangeError(`Unsupported Aion snapshot version: ${String(value.version)}`)
  }

  if (value.character !== 'aion') {
    throw new TypeError('Snapshot does not contain an Aion character')
  }

  if (!isFiniteNumber(value.createdAt)) {
    throw new TypeError('Aion snapshot createdAt must be a finite number')
  }

  if (!isAionConfig(value.config)) {
    throw new TypeError('Aion snapshot contains an invalid configuration')
  }

  if (!isQuantumCognitiveState(value.state)) {
    throw new TypeError('Aion snapshot contains an invalid cognitive state')
  }

  return {
    version: 1,
    character: 'aion',
    createdAt: value.createdAt,
    config: cloneAionConfig(value.config),
    state: cloneAionState(value.state),
  }
}

export function createAionSnapshot(config: AionConfig, state: QuantumCognitiveState): AionSnapshotV1 {
  return {
    version: 1,
    character: 'aion',
    createdAt: Date.now(),
    config: cloneAionConfig(config),
    state: cloneAionState(state),
  }
}

export function serializeAionSnapshot(snapshot: AionSnapshotV1, indentation = 0): string {
  return JSON.stringify(snapshot, null, indentation)
}
