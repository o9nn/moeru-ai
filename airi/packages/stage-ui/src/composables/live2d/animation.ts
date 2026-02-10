import type { InternalModel } from 'pixi-live2d-display/cubism4'

import { lerp, randFloat } from 'three/src/math/MathUtils.js'

import { randomSaccadeInterval } from '../../utils'

/**
 * Idle Eye Saccade and Focus Controller
 * 
 * Simulates idle eye saccades and focus (head) movements.
 * Eye ball parameters are now dynamically controlled rather than hardcoded,
 * integrating with the emotion bridge system for context-aware behavior.
 */
export function useLive2DIdleEyeFocus() {
  let nextSaccadeAfter = -1
  let focusTarget: [number, number] | undefined
  let lastSaccadeAt = -1

  // Saccade parameters that can be influenced by emotion state
  let saccadeRangeX: [number, number] = [-1, 1]
  let saccadeRangeY: [number, number] = [-1, 0.7]
  let saccadeFocusScale = 0.5
  let saccadeLerpSpeed = 0.3

  /**
   * Update saccade behavior based on emotional context
   * Called by the emotion bridge to adjust eye movement patterns
   */
  function setEmotionContext(context: {
    rangeX?: [number, number]
    rangeY?: [number, number]
    focusScale?: number
    lerpSpeed?: number
  }): void {
    if (context.rangeX) saccadeRangeX = context.rangeX
    if (context.rangeY) saccadeRangeY = context.rangeY
    if (context.focusScale !== undefined) saccadeFocusScale = context.focusScale
    if (context.lerpSpeed !== undefined) saccadeLerpSpeed = context.lerpSpeed
  }

  /**
   * Reset to default saccade parameters
   */
  function resetContext(): void {
    saccadeRangeX = [-1, 1]
    saccadeRangeY = [-1, 0.7]
    saccadeFocusScale = 0.5
    saccadeLerpSpeed = 0.3
  }

  /**
   * Update eye saccade and focus - dynamically parameterized
   */
  function update(model: InternalModel, now: number) {
    if (now >= nextSaccadeAfter || now < lastSaccadeAt) {
      focusTarget = [
        randFloat(saccadeRangeX[0], saccadeRangeX[1]),
        randFloat(saccadeRangeY[0], saccadeRangeY[1]),
      ]
      lastSaccadeAt = now
      nextSaccadeAfter = now + (randomSaccadeInterval() / 1000)
      model.focusController.focus(
        focusTarget![0] * saccadeFocusScale,
        focusTarget![1] * saccadeFocusScale,
        false,
      )
    }

    model.focusController.update(now - lastSaccadeAt)
    const coreModel = model.coreModel as any
    
    // Dynamic eye ball parameters (no longer hardcoded)
    coreModel.setParameterValueById(
      'ParamEyeBallX',
      lerp(
        coreModel.getParameterValueById('ParamEyeBallX'),
        focusTarget![0],
        saccadeLerpSpeed,
      ),
    )
    coreModel.setParameterValueById(
      'ParamEyeBallY',
      lerp(
        coreModel.getParameterValueById('ParamEyeBallY'),
        focusTarget![1],
        saccadeLerpSpeed,
      ),
    )
  }

  return {
    update,
    setEmotionContext,
    resetContext,
  }
}
