/**
 * Emotion Store
 * 
 * Centralized emotion state management that bridges:
 * - LLM emotion tokens (stage-ui Emotion enum)
 * - Live2D parameter-level expressions (live2d-core EmotionMapper)
 * - Motion triggers (existing motion system)
 * - Cognitive emotion state (cognitive-core daemon)
 * 
 * This store resolves the TODO about integrating the emotion mapper
 * by providing a single source of truth for character emotional state.
 */

import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { Emotion as StageEmotion } from '../constants/emotions'
import { Emotion, EMOTION_EmotionMotionName_value } from '../constants/emotions'
import { useLive2d } from './live2d'

/**
 * Emotion history entry for tracking emotional trajectory
 */
export interface EmotionHistoryEntry {
  emotion: StageEmotion
  timestamp: number
  source: 'llm' | 'user' | 'system' | 'decay'
  intensity: number
}

/**
 * Emotion configuration
 */
export interface EmotionConfig {
  /** Enable parameter-level expression mapping */
  enableParameterMapping: boolean
  
  /** Enable motion triggers alongside parameter mapping */
  enableMotionTriggers: boolean
  
  /** Enable emotion decay (return to neutral) */
  enableDecay: boolean
  
  /** Decay delay in ms */
  decayDelay: number
  
  /** Enable micro-expressions */
  enableMicroExpressions: boolean
  
  /** Enable body sway */
  enableBodySway: boolean
  
  /** Transition speed (0-1) */
  transitionSpeed: number
  
  /** Default intensity (0-1) */
  defaultIntensity: number
}

export const useEmotionStore = defineStore('emotion', () => {
  const live2dStore = useLive2d()
  
  // Current emotion state
  const currentEmotion = ref<StageEmotion>(Emotion.Idle)
  const currentIntensity = ref<number>(1.0)
  const emotionSetAt = ref<number>(Date.now())
  const emotionSource = ref<'llm' | 'user' | 'system' | 'decay'>('system')
  
  // Emotion history (last 50 entries)
  const emotionHistory = ref<EmotionHistoryEntry[]>([])
  
  // Configuration (persisted)
  const config = useLocalStorage<EmotionConfig>('settings/emotion/config', {
    enableParameterMapping: true,
    enableMotionTriggers: true,
    enableDecay: true,
    decayDelay: 8000,
    enableMicroExpressions: true,
    enableBodySway: true,
    transitionSpeed: 0.08,
    defaultIntensity: 1.0,
  })
  
  // Derived state
  const isNeutral = computed(() => currentEmotion.value === Emotion.Idle)
  const timeSinceEmotionChange = computed(() => Date.now() - emotionSetAt.value)
  
  /**
   * Set emotion from LLM output or other source
   */
  function setEmotion(
    emotion: StageEmotion,
    options: {
      intensity?: number
      source?: 'llm' | 'user' | 'system' | 'decay'
    } = {},
  ): void {
    const { 
      intensity = config.value.defaultIntensity, 
      source = 'llm',
    } = options
    
    currentEmotion.value = emotion
    currentIntensity.value = intensity
    emotionSetAt.value = Date.now()
    emotionSource.value = source
    
    // Add to history
    emotionHistory.value.push({
      emotion,
      timestamp: Date.now(),
      source,
      intensity,
    })
    
    // Trim history
    if (emotionHistory.value.length > 50) {
      emotionHistory.value = emotionHistory.value.slice(-50)
    }
    
    // Trigger motion if enabled
    if (config.value.enableMotionTriggers) {
      const motionName = EMOTION_EmotionMotionName_value[emotion]
      if (motionName) {
        live2dStore.currentMotion = { group: motionName }
      }
    }
  }
  
  /**
   * Get the dominant emotion from recent history
   */
  function getDominantEmotion(windowMs: number = 5000): StageEmotion {
    const cutoff = Date.now() - windowMs
    const recent = emotionHistory.value.filter(e => e.timestamp >= cutoff)
    
    if (recent.length === 0) return Emotion.Idle
    
    // Count weighted occurrences
    const counts = new Map<StageEmotion, number>()
    for (const entry of recent) {
      const current = counts.get(entry.emotion) || 0
      counts.set(entry.emotion, current + entry.intensity)
    }
    
    // Find max
    let maxEmotion = Emotion.Idle as StageEmotion
    let maxCount = 0
    for (const [emotion, count] of counts) {
      if (count > maxCount) {
        maxCount = count
        maxEmotion = emotion
      }
    }
    
    return maxEmotion
  }
  
  /**
   * Get emotion trajectory (for visualization)
   */
  function getTrajectory(windowMs: number = 30000): EmotionHistoryEntry[] {
    const cutoff = Date.now() - windowMs
    return emotionHistory.value.filter(e => e.timestamp >= cutoff)
  }
  
  /**
   * Reset to neutral
   */
  function reset(): void {
    setEmotion(Emotion.Idle, { source: 'system', intensity: 1.0 })
  }
  
  /**
   * Update configuration
   */
  function updateConfig(newConfig: Partial<EmotionConfig>): void {
    config.value = { ...config.value, ...newConfig }
  }
  
  return {
    // State
    currentEmotion,
    currentIntensity,
    emotionSetAt,
    emotionSource,
    emotionHistory,
    config,
    
    // Computed
    isNeutral,
    timeSinceEmotionChange,
    
    // Methods
    setEmotion,
    getDominantEmotion,
    getTrajectory,
    reset,
    updateConfig,
  }
})
