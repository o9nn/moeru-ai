/**
 * Emotion Bridge
 * 
 * Bridges the gap between stage-ui's emotion tokens (from LLM output)
 * and live2d-core's parameter-level emotion mapping.
 * 
 * This resolves the TODO: "After emotion mapper, stage editor, eye related
 * parameters should be taken care of to be dynamic instead of hardcoding"
 * 
 * Architecture:
 *   LLM output → stage-ui Emotion tokens → EmotionBridge → Live2D parameters
 *                                                        → Motion triggers
 */

import type { InternalModel } from 'pixi-live2d-display/cubism4'
import type { PartialLive2DParameters } from '@proj-airi/live2d-core'

import { lerp } from 'three/src/math/MathUtils.js'

import {
  Emotion as Live2DEmotion,
  EmotionIntensity,
  createEmotionMapper,
  Easing,
} from '@proj-airi/live2d-core'

import { Emotion as StageEmotion } from '../../constants/emotions'

/**
 * Mapping from stage-ui emotion tokens to live2d-core emotion enum
 */
const STAGE_TO_LIVE2D_EMOTION_MAP: Record<StageEmotion, Live2DEmotion> = {
  [StageEmotion.Idle]: Live2DEmotion.Neutral,
  [StageEmotion.Happy]: Live2DEmotion.Happy,
  [StageEmotion.Sad]: Live2DEmotion.Sad,
  [StageEmotion.Angry]: Live2DEmotion.Angry,
  [StageEmotion.Think]: Live2DEmotion.Thoughtful,
  [StageEmotion.Surprise]: Live2DEmotion.Surprised,
  [StageEmotion.Awkward]: Live2DEmotion.Embarrassed,
  [StageEmotion.Question]: Live2DEmotion.Confused,
}

/**
 * Cubism parameter IDs for direct model access
 */
const PARAM_IDS = {
  // Eyes
  eyeLOpen: 'ParamEyeLOpen',
  eyeROpen: 'ParamEyeROpen',
  eyeLSmile: 'ParamEyeLSmile',
  eyeRSmile: 'ParamEyeRSmile',
  eyeBallX: 'ParamEyeBallX',
  eyeBallY: 'ParamEyeBallY',
  
  // Eyebrows
  browLY: 'ParamBrowLY',
  browRY: 'ParamBrowRY',
  browLAngle: 'ParamBrowLAngle',
  browRAngle: 'ParamBrowRAngle',
  
  // Mouth
  mouthOpenY: 'ParamMouthOpenY',
  mouthForm: 'ParamMouthForm',
  
  // Face
  cheek: 'ParamCheek',
  
  // Body
  bodyAngleX: 'ParamBodyAngleX',
  bodyAngleY: 'ParamBodyAngleY',
  bodyAngleZ: 'ParamBodyAngleZ',
} as const

/**
 * Configuration for the emotion bridge
 */
export interface EmotionBridgeConfig {
  /** Transition speed for parameter lerping (0-1, higher = faster) */
  transitionSpeed: number
  
  /** Intensity multiplier for emotions */
  intensityMultiplier: number
  
  /** Default emotion intensity level */
  defaultIntensity: number
  
  /** Enable micro-expressions (subtle random variations) */
  enableMicroExpressions: boolean
  
  /** Micro-expression intensity (0-1) */
  microExpressionIntensity: number
  
  /** Micro-expression interval range in ms [min, max] */
  microExpressionInterval: [number, number]
  
  /** Enable emotion decay (return to neutral over time) */
  enableEmotionDecay: boolean
  
  /** Time in ms before emotion starts decaying */
  emotionDecayDelay: number
  
  /** Decay speed (0-1, higher = faster decay) */
  emotionDecaySpeed: number
  
  /** Enable body sway based on emotion */
  enableBodySway: boolean
  
  /** Body sway intensity (0-1) */
  bodySwayIntensity: number
}

/**
 * Default configuration
 */
export const defaultEmotionBridgeConfig: EmotionBridgeConfig = {
  transitionSpeed: 0.08,
  intensityMultiplier: 1.0,
  defaultIntensity: EmotionIntensity.Strong,
  enableMicroExpressions: true,
  microExpressionIntensity: 0.15,
  microExpressionInterval: [2000, 5000],
  enableEmotionDecay: true,
  emotionDecayDelay: 8000,
  emotionDecaySpeed: 0.02,
  enableBodySway: true,
  bodySwayIntensity: 0.3,
}

/**
 * Internal state for parameter tracking
 */
interface ParameterState {
  current: number
  target: number
}

/**
 * Emotion Bridge Composable
 * 
 * Creates a bridge between stage-ui emotions and Live2D model parameters.
 * Handles smooth transitions, micro-expressions, emotion decay, and body sway.
 */
export function useEmotionBridge(config: Partial<EmotionBridgeConfig> = {}) {
  const cfg: EmotionBridgeConfig = { ...defaultEmotionBridgeConfig, ...config }
  
  const emotionMapper = createEmotionMapper()
  
  // Current emotion state
  let currentStageEmotion: StageEmotion = StageEmotion.Idle
  let currentLive2DEmotion: Live2DEmotion = Live2DEmotion.Neutral
  let emotionSetAt: number = 0
  let emotionIntensity: number = cfg.defaultIntensity
  
  // Parameter states for smooth interpolation
  const paramStates: Map<string, ParameterState> = new Map()
  
  // Micro-expression state
  let nextMicroExpressionAt: number = 0
  let microExpressionActive: boolean = false
  let microExpressionParams: PartialLive2DParameters = {}
  
  // Body sway state
  let bodySwayPhase: number = 0
  
  /**
   * Initialize parameter state
   */
  function initParamState(paramId: string, initialValue: number = 0): ParameterState {
    const state = { current: initialValue, target: initialValue }
    paramStates.set(paramId, state)
    return state
  }
  
  /**
   * Get or create parameter state
   */
  function getParamState(paramId: string): ParameterState {
    return paramStates.get(paramId) || initParamState(paramId)
  }
  
  /**
   * Set the current emotion from a stage-ui emotion token
   */
  function setEmotion(stageEmotion: StageEmotion, intensity?: number): void {
    currentStageEmotion = stageEmotion
    currentLive2DEmotion = STAGE_TO_LIVE2D_EMOTION_MAP[stageEmotion] || Live2DEmotion.Neutral
    emotionSetAt = performance.now()
    emotionIntensity = intensity ?? cfg.defaultIntensity
    
    // Get target parameters from emotion mapper
    const targetParams = emotionMapper.getParametersForEmotion(
      currentLive2DEmotion,
      emotionIntensity * cfg.intensityMultiplier
    )
    
    // Update target values for all emotion parameters
    applyTargetParams(targetParams)
  }
  
  /**
   * Blend between two stage-ui emotions
   */
  function blendEmotions(
    emotion1: StageEmotion,
    emotion2: StageEmotion,
    blendFactor: number
  ): void {
    const live2d1 = STAGE_TO_LIVE2D_EMOTION_MAP[emotion1] || Live2DEmotion.Neutral
    const live2d2 = STAGE_TO_LIVE2D_EMOTION_MAP[emotion2] || Live2DEmotion.Neutral
    
    const blendedParams = emotionMapper.blendEmotions(live2d1, live2d2, blendFactor)
    applyTargetParams(blendedParams)
    
    emotionSetAt = performance.now()
  }
  
  /**
   * Apply target parameters from emotion mapping
   */
  function applyTargetParams(params: PartialLive2DParameters): void {
    // Map live2d-core parameter names to Cubism parameter IDs
    const paramMapping: Record<string, string> = {
      leftEyeOpen: PARAM_IDS.eyeLOpen,
      rightEyeOpen: PARAM_IDS.eyeROpen,
      leftEyeSmile: PARAM_IDS.eyeLSmile,
      rightEyeSmile: PARAM_IDS.eyeRSmile,
      leftEyebrowY: PARAM_IDS.browLY,
      rightEyebrowY: PARAM_IDS.browRY,
      leftEyebrowAngle: PARAM_IDS.browLAngle,
      rightEyebrowAngle: PARAM_IDS.browRAngle,
      mouthOpen: PARAM_IDS.mouthOpenY,
      mouthForm: PARAM_IDS.mouthForm,
      cheek: PARAM_IDS.cheek,
    }
    
    for (const [key, value] of Object.entries(params)) {
      const paramId = paramMapping[key]
      if (paramId && typeof value === 'number') {
        const state = getParamState(paramId)
        state.target = value
      }
    }
  }
  
  /**
   * Generate micro-expression variations
   */
  function updateMicroExpressions(now: number): void {
    if (!cfg.enableMicroExpressions) return
    
    if (now >= nextMicroExpressionAt) {
      // Schedule next micro-expression
      const [minInterval, maxInterval] = cfg.microExpressionInterval
      nextMicroExpressionAt = now + minInterval + Math.random() * (maxInterval - minInterval)
      
      // Generate subtle random variations based on current emotion
      const intensity = cfg.microExpressionIntensity
      microExpressionActive = true
      
      microExpressionParams = {
        leftEyeOpen: (Math.random() - 0.5) * intensity * 0.3,
        rightEyeOpen: (Math.random() - 0.5) * intensity * 0.3,
        leftEyebrowY: (Math.random() - 0.5) * intensity * 0.2,
        rightEyebrowY: (Math.random() - 0.5) * intensity * 0.2,
        mouthForm: (Math.random() - 0.5) * intensity * 0.1,
      }
      
      // Micro-expressions are brief
      setTimeout(() => {
        microExpressionActive = false
        microExpressionParams = {}
      }, 200 + Math.random() * 300)
    }
  }
  
  /**
   * Handle emotion decay (gradual return to neutral)
   */
  function updateEmotionDecay(now: number): void {
    if (!cfg.enableEmotionDecay) return
    if (currentLive2DEmotion === Live2DEmotion.Neutral) return
    
    const elapsed = now - emotionSetAt
    if (elapsed < cfg.emotionDecayDelay) return
    
    // Gradually reduce intensity
    emotionIntensity = Math.max(0, emotionIntensity - cfg.emotionDecaySpeed * 0.016)
    
    if (emotionIntensity <= 0.05) {
      // Fully decayed, return to neutral
      currentLive2DEmotion = Live2DEmotion.Neutral
      currentStageEmotion = StageEmotion.Idle
      emotionIntensity = 0
      
      const neutralParams = emotionMapper.getParametersForEmotion(Live2DEmotion.Neutral, 1.0)
      applyTargetParams(neutralParams)
    }
    else {
      // Update targets with reduced intensity
      const targetParams = emotionMapper.getParametersForEmotion(
        currentLive2DEmotion,
        emotionIntensity * cfg.intensityMultiplier
      )
      applyTargetParams(targetParams)
    }
  }
  
  /**
   * Update body sway based on emotion
   */
  function updateBodySway(now: number): void {
    if (!cfg.enableBodySway) return
    
    bodySwayPhase += 0.001 // Slow phase advance
    
    // Different emotions have different sway patterns
    let swayX = 0
    let swayZ = 0
    
    switch (currentLive2DEmotion) {
      case Live2DEmotion.Happy:
      case Live2DEmotion.Excited:
        // Bouncy, energetic sway
        swayX = Math.sin(bodySwayPhase * 3) * 2 * cfg.bodySwayIntensity
        swayZ = Math.sin(bodySwayPhase * 2.5) * 1.5 * cfg.bodySwayIntensity
        break
        
      case Live2DEmotion.Sad:
        // Slow, droopy sway
        swayX = Math.sin(bodySwayPhase * 0.5) * 0.5 * cfg.bodySwayIntensity
        swayZ = -1 * cfg.bodySwayIntensity // Slight downward tilt
        break
        
      case Live2DEmotion.Angry:
        // Tense, minimal sway with occasional sharp movements
        swayX = Math.sin(bodySwayPhase * 4) * 0.3 * cfg.bodySwayIntensity
        break
        
      case Live2DEmotion.Thoughtful:
        // Gentle, contemplative sway
        swayX = Math.sin(bodySwayPhase * 0.8) * 1 * cfg.bodySwayIntensity
        swayZ = Math.sin(bodySwayPhase * 0.6) * 0.5 * cfg.bodySwayIntensity
        break
        
      default:
        // Subtle idle sway
        swayX = Math.sin(bodySwayPhase) * 0.5 * cfg.bodySwayIntensity
        swayZ = Math.sin(bodySwayPhase * 0.7) * 0.3 * cfg.bodySwayIntensity
        break
    }
    
    const bodyXState = getParamState(PARAM_IDS.bodyAngleX)
    const bodyZState = getParamState(PARAM_IDS.bodyAngleZ)
    bodyXState.target = swayX
    bodyZState.target = swayZ
  }
  
  /**
   * Main update function - call in animation loop
   * 
   * Applies smooth parameter transitions to the Live2D model.
   * This replaces the hardcoded eye parameter setting in animation.ts
   */
  function update(model: InternalModel, now: number): void {
    const coreModel = model.coreModel as any
    
    // Update subsystems
    updateMicroExpressions(now)
    updateEmotionDecay(now)
    updateBodySway(now)
    
    // Smoothly interpolate all tracked parameters
    for (const [paramId, state] of paramStates) {
      // Add micro-expression offset if active
      let targetWithMicro = state.target
      if (microExpressionActive) {
        const microKey = Object.entries({
          [PARAM_IDS.eyeLOpen]: 'leftEyeOpen',
          [PARAM_IDS.eyeROpen]: 'rightEyeOpen',
          [PARAM_IDS.browLY]: 'leftEyebrowY',
          [PARAM_IDS.browRY]: 'rightEyebrowY',
          [PARAM_IDS.mouthForm]: 'mouthForm',
        }).find(([pid]) => pid === paramId)?.[1]
        
        if (microKey && microKey in microExpressionParams) {
          targetWithMicro += (microExpressionParams as any)[microKey] || 0
        }
      }
      
      // Smooth interpolation
      state.current = lerp(state.current, targetWithMicro, cfg.transitionSpeed)
      
      // Snap if very close
      if (Math.abs(state.current - targetWithMicro) < 0.001) {
        state.current = targetWithMicro
      }
      
      // Apply to model (skip eye ball X/Y as those are handled by saccade system)
      if (paramId !== PARAM_IDS.eyeBallX && paramId !== PARAM_IDS.eyeBallY) {
        coreModel.setParameterValueById(paramId, state.current)
      }
    }
  }
  
  /**
   * Get current emotion state for debugging/UI
   */
  function getState() {
    return {
      stageEmotion: currentStageEmotion,
      live2dEmotion: currentLive2DEmotion,
      intensity: emotionIntensity,
      parameterCount: paramStates.size,
      microExpressionActive,
      timeSinceEmotionSet: performance.now() - emotionSetAt,
    }
  }
  
  /**
   * Update configuration at runtime
   */
  function updateConfig(newConfig: Partial<EmotionBridgeConfig>): void {
    Object.assign(cfg, newConfig)
  }
  
  /**
   * Reset to neutral state
   */
  function reset(): void {
    setEmotion(StageEmotion.Idle, 1.0)
    microExpressionActive = false
    microExpressionParams = {}
    bodySwayPhase = 0
  }
  
  /**
   * Get the live2d-core emotion mapper for direct access
   */
  function getEmotionMapper() {
    return emotionMapper
  }
  
  // Initialize with neutral state
  setEmotion(StageEmotion.Idle, 1.0)
  
  return {
    setEmotion,
    blendEmotions,
    update,
    reset,
    getState,
    updateConfig,
    getEmotionMapper,
    
    // Expose mapping for external use
    STAGE_TO_LIVE2D_EMOTION_MAP,
  }
}
