/**
 * Silence Detection State Machine
 * 
 * Manages voice activity state and silence detection for controlling
 * realtime transcription sessions based on speech patterns.
 */

import type { BaseVAD, VADEvents } from './vad'
import type { EnergyVAD, VADFrameResult } from './energy-vad'

/**
 * Silence detector states
 */
export enum SilenceState {
  /** No active session, waiting for speech */
  IDLE = 'idle',
  /** Active session, speech detected */
  SPEAKING = 'speaking',
  /** Active session, monitoring silence duration */
  SILENCE = 'silence',
  /** Session paused due to extended silence */
  PAUSED = 'paused',
}

/**
 * Configuration for silence detection
 */
export interface SilenceDetectorConfig {
  /** Minimum silence duration to detect (ms) */
  minSilenceDurationMs: number
  /** Silence duration to trigger session pause (ms) */
  pauseThresholdMs: number
  /** Silence duration to trigger session stop (ms) */
  stopThresholdMs: number
  /** Grace period after speech ends before considering silence (ms) */
  gracePeriodMs: number
  /** Minimum speech duration to keep session (ms) */
  minSpeechDurationMs: number
  /** Whether to auto-restart session on new speech */
  autoRestart: boolean
  /** Enable adaptive threshold learning */
  adaptiveEnabled: boolean
  /** Learning rate for adaptive thresholds (0-1) */
  adaptiveLearningRate: number
  /** Number of pause samples to keep for adaptation */
  adaptiveHistorySize: number
}

/**
 * Events emitted by SilenceDetector
 */
export interface SilenceDetectorEvents {
  /** Silence period started */
  'silence-start': { timestamp: number }
  /** Silence period ended */
  'silence-end': { timestamp: number; duration: number }
  /** Session should be paused */
  'session-pause': { reason: string; silenceDuration: number; timestamp: number }
  /** Session should be resumed */
  'session-resume': { reason: string; timestamp: number }
  /** Session should be stopped */
  'session-stop': { reason: string; totalSilence: number; timestamp: number }
  /** State changed */
  'state-change': { from: SilenceState; to: SilenceState; timestamp: number }
  /** Adaptive threshold updated */
  'threshold-updated': { 
    pauseThreshold: number
    stopThreshold: number
    confidence: number 
  }
  /** Debug information */
  'debug': { message: string; data?: unknown }
}

export type SilenceDetectorEventCallback<K extends keyof SilenceDetectorEvents> = 
  (event: SilenceDetectorEvents[K]) => void

/**
 * Adaptive threshold calculator
 */
interface AdaptiveThresholds {
  /** History of pause durations */
  pauseHistory: number[]
  /** Running average of pause durations */
  averagePauseDuration: number
  /** Standard deviation of pauses */
  pauseStdDev: number
  /** Calculated pause threshold */
  calculatedPauseThreshold: number
  /** Calculated stop threshold */
  calculatedStopThreshold: number
  /** Confidence in current thresholds (0-1) */
  confidence: number
}

/**
 * Session statistics
 */
export interface SessionStats {
  /** Total speech duration in current session (ms) */
  totalSpeechDuration: number
  /** Total silence duration in current session (ms) */
  totalSilenceDuration: number
  /** Number of speech segments */
  speechSegments: number
  /** Number of silence segments */
  silenceSegments: number
  /** Average speech segment duration (ms) */
  avgSpeechDuration: number
  /** Average silence segment duration (ms) */
  avgSilenceDuration: number
  /** Speech-to-silence ratio */
  speechRatio: number
}

/**
 * Silence Detection State Machine
 */
export class SilenceDetector {
  private config: SilenceDetectorConfig
  private state: SilenceState = SilenceState.IDLE
  private eventListeners: Partial<Record<keyof SilenceDetectorEvents, SilenceDetectorEventCallback<any>[]>> = {}
  
  // Timing state
  private speechStartTime: number | null = null
  private silenceStartTime: number | null = null
  private lastSpeechTime: number | null = null
  private sessionStartTime: number | null = null
  
  // Statistics
  private stats: SessionStats = this.createEmptyStats()
  private currentSpeechDuration: number = 0
  private currentSilenceDuration: number = 0
  
  // Adaptive thresholds
  private adaptive: AdaptiveThresholds = {
    pauseHistory: [],
    averagePauseDuration: 0,
    pauseStdDev: 0,
    calculatedPauseThreshold: 0,
    calculatedStopThreshold: 0,
    confidence: 0,
  }
  
  // Timers
  private pauseTimer: ReturnType<typeof setTimeout> | null = null
  private stopTimer: ReturnType<typeof setTimeout> | null = null
  
  constructor(userConfig: Partial<SilenceDetectorConfig> = {}) {
    const defaultConfig: SilenceDetectorConfig = {
      minSilenceDurationMs: 300,
      pauseThresholdMs: 2000,
      stopThresholdMs: 10000,
      gracePeriodMs: 500,
      minSpeechDurationMs: 250,
      autoRestart: true,
      adaptiveEnabled: true,
      adaptiveLearningRate: 0.1,
      adaptiveHistorySize: 20,
    }
    
    this.config = { ...defaultConfig, ...userConfig }
    this.adaptive.calculatedPauseThreshold = this.config.pauseThresholdMs
    this.adaptive.calculatedStopThreshold = this.config.stopThresholdMs
  }
  
  /**
   * Create empty session statistics
   */
  private createEmptyStats(): SessionStats {
    return {
      totalSpeechDuration: 0,
      totalSilenceDuration: 0,
      speechSegments: 0,
      silenceSegments: 0,
      avgSpeechDuration: 0,
      avgSilenceDuration: 0,
      speechRatio: 0,
    }
  }
  
  /**
   * Add event listener
   */
  public on<K extends keyof SilenceDetectorEvents>(
    event: K, 
    callback: SilenceDetectorEventCallback<K>
  ): () => void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event]!.push(callback as any)
    
    return () => this.off(event, callback)
  }
  
  /**
   * Remove event listener
   */
  public off<K extends keyof SilenceDetectorEvents>(
    event: K, 
    callback: SilenceDetectorEventCallback<K>
  ): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event] = this.eventListeners[event]!.filter(cb => cb !== callback)
  }
  
  /**
   * Emit event
   */
  private emit<K extends keyof SilenceDetectorEvents>(event: K, data: SilenceDetectorEvents[K]): void {
    if (!this.eventListeners[event]) return
    for (const callback of this.eventListeners[event]!) {
      try {
        callback(data)
      }
      catch (err) {
        console.error(`[SilenceDetector] Error in event listener for ${event}:`, err)
      }
    }
  }
  
  /**
   * Transition to a new state
   */
  private transitionTo(newState: SilenceState): void {
    if (this.state === newState) return
    
    const oldState = this.state
    this.state = newState
    
    this.emit('state-change', {
      from: oldState,
      to: newState,
      timestamp: Date.now(),
    })
    
    this.emit('debug', {
      message: `State transition: ${oldState} -> ${newState}`,
      data: { oldState, newState },
    })
  }
  
  /**
   * Get effective pause threshold (adaptive or configured)
   */
  private getEffectivePauseThreshold(): number {
    if (this.config.adaptiveEnabled && this.adaptive.confidence > 0.5) {
      return this.adaptive.calculatedPauseThreshold
    }
    return this.config.pauseThresholdMs
  }
  
  /**
   * Get effective stop threshold (adaptive or configured)
   */
  private getEffectiveStopThreshold(): number {
    if (this.config.adaptiveEnabled && this.adaptive.confidence > 0.5) {
      return this.adaptive.calculatedStopThreshold
    }
    return this.config.stopThresholdMs
  }
  
  /**
   * Update adaptive thresholds based on pause history
   */
  private updateAdaptiveThresholds(pauseDuration: number): void {
    if (!this.config.adaptiveEnabled) return
    
    // Add to history
    this.adaptive.pauseHistory.push(pauseDuration)
    if (this.adaptive.pauseHistory.length > this.config.adaptiveHistorySize) {
      this.adaptive.pauseHistory.shift()
    }
    
    // Need minimum samples for adaptation
    if (this.adaptive.pauseHistory.length < 5) {
      this.adaptive.confidence = this.adaptive.pauseHistory.length / 10
      return
    }
    
    // Calculate statistics
    const n = this.adaptive.pauseHistory.length
    const sum = this.adaptive.pauseHistory.reduce((a, b) => a + b, 0)
    const mean = sum / n
    
    const squaredDiffs = this.adaptive.pauseHistory.map(x => Math.pow(x - mean, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n
    const stdDev = Math.sqrt(variance)
    
    // Update adaptive values
    this.adaptive.averagePauseDuration = mean
    this.adaptive.pauseStdDev = stdDev
    
    // Calculate thresholds: mean + 2*stdDev captures ~95% of natural pauses
    const newPauseThreshold = Math.max(
      this.config.minSilenceDurationMs * 2,
      mean + 2 * stdDev
    )
    
    // Stop threshold is 3x pause threshold or mean + 4*stdDev
    const newStopThreshold = Math.max(
      newPauseThreshold * 2,
      mean + 4 * stdDev
    )
    
    // Smooth transition using learning rate
    const lr = this.config.adaptiveLearningRate
    this.adaptive.calculatedPauseThreshold = 
      (1 - lr) * this.adaptive.calculatedPauseThreshold + lr * newPauseThreshold
    this.adaptive.calculatedStopThreshold = 
      (1 - lr) * this.adaptive.calculatedStopThreshold + lr * newStopThreshold
    
    // Update confidence based on sample size and consistency
    const cv = stdDev / mean // Coefficient of variation
    this.adaptive.confidence = Math.min(1, n / this.config.adaptiveHistorySize) * 
      Math.max(0, 1 - cv) // Lower confidence if high variation
    
    this.emit('threshold-updated', {
      pauseThreshold: this.adaptive.calculatedPauseThreshold,
      stopThreshold: this.adaptive.calculatedStopThreshold,
      confidence: this.adaptive.confidence,
    })
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer)
      this.pauseTimer = null
    }
    if (this.stopTimer) {
      clearTimeout(this.stopTimer)
      this.stopTimer = null
    }
  }
  
  /**
   * Start silence timers
   */
  private startSilenceTimers(): void {
    this.clearTimers()
    
    const pauseThreshold = this.getEffectivePauseThreshold()
    const stopThreshold = this.getEffectiveStopThreshold()
    
    // Pause timer
    this.pauseTimer = setTimeout(() => {
      if (this.state === SilenceState.SILENCE) {
        this.transitionTo(SilenceState.PAUSED)
        this.emit('session-pause', {
          reason: 'silence_threshold_exceeded',
          silenceDuration: this.currentSilenceDuration,
          timestamp: Date.now(),
        })
      }
    }, pauseThreshold - this.config.gracePeriodMs)
    
    // Stop timer
    this.stopTimer = setTimeout(() => {
      if (this.state === SilenceState.SILENCE || this.state === SilenceState.PAUSED) {
        this.transitionTo(SilenceState.IDLE)
        this.emit('session-stop', {
          reason: 'max_silence_exceeded',
          totalSilence: this.currentSilenceDuration,
          timestamp: Date.now(),
        })
        this.resetSession()
      }
    }, stopThreshold - this.config.gracePeriodMs)
  }
  
  /**
   * Called when speech is detected (from VAD)
   */
  public onSpeechStart(): void {
    const now = Date.now()
    
    this.clearTimers()
    
    // Handle silence end if we were in silence
    if (this.silenceStartTime) {
      const silenceDuration = now - this.silenceStartTime
      this.currentSilenceDuration = silenceDuration
      
      if (silenceDuration >= this.config.minSilenceDurationMs) {
        this.stats.totalSilenceDuration += silenceDuration
        this.stats.silenceSegments++
        this.updateAdaptiveThresholds(silenceDuration)
        
        this.emit('silence-end', {
          timestamp: now,
          duration: silenceDuration,
        })
      }
      
      this.silenceStartTime = null
    }
    
    // Start new speech segment
    this.speechStartTime = now
    this.lastSpeechTime = now
    
    // Handle state transitions
    switch (this.state) {
      case SilenceState.IDLE:
        this.sessionStartTime = now
        this.transitionTo(SilenceState.SPEAKING)
        break
        
      case SilenceState.SILENCE:
        this.transitionTo(SilenceState.SPEAKING)
        break
        
      case SilenceState.PAUSED:
        if (this.config.autoRestart) {
          this.transitionTo(SilenceState.SPEAKING)
          this.emit('session-resume', {
            reason: 'speech_detected',
            timestamp: now,
          })
        }
        break
    }
  }
  
  /**
   * Called when speech ends (from VAD)
   */
  public onSpeechEnd(): void {
    const now = Date.now()
    
    // Calculate speech duration
    if (this.speechStartTime) {
      const speechDuration = now - this.speechStartTime
      this.currentSpeechDuration = speechDuration
      
      if (speechDuration >= this.config.minSpeechDurationMs) {
        this.stats.totalSpeechDuration += speechDuration
        this.stats.speechSegments++
      }
      
      this.speechStartTime = null
    }
    
    this.lastSpeechTime = now
    
    // Start silence tracking after grace period
    setTimeout(() => {
      if (this.state === SilenceState.SPEAKING && !this.speechStartTime) {
        this.silenceStartTime = Date.now()
        this.transitionTo(SilenceState.SILENCE)
        
        this.emit('silence-start', {
          timestamp: this.silenceStartTime,
        })
        
        this.startSilenceTimers()
      }
    }, this.config.gracePeriodMs)
  }
  
  /**
   * Process VAD frame result (for continuous monitoring)
   */
  public processVADResult(result: VADFrameResult): void {
    if (result.isSpeech) {
      if (this.state !== SilenceState.SPEAKING) {
        this.onSpeechStart()
      }
    }
    else {
      if (this.state === SilenceState.SPEAKING) {
        this.onSpeechEnd()
      }
    }
  }
  
  /**
   * Connect to a BaseVAD instance
   */
  public connectVAD(vad: BaseVAD): () => void {
    const onSpeechStart = () => this.onSpeechStart()
    const onSpeechEnd = () => this.onSpeechEnd()
    
    vad.on('speech-start', onSpeechStart)
    vad.on('speech-end', onSpeechEnd)
    
    // Return cleanup function
    return () => {
      vad.off('speech-start', onSpeechStart)
      vad.off('speech-end', onSpeechEnd)
    }
  }
  
  /**
   * Connect to an EnergyVAD instance
   */
  public connectEnergyVAD(vad: EnergyVAD): () => void {
    const onSpeechStart = () => this.onSpeechStart()
    const onSpeechEnd = () => this.onSpeechEnd()
    
    vad.on('speech-start', onSpeechStart)
    vad.on('speech-end', onSpeechEnd)
    
    // Return cleanup function
    return () => {
      vad.off('speech-start', onSpeechStart)
      vad.off('speech-end', onSpeechEnd)
    }
  }
  
  /**
   * Reset session state
   */
  public resetSession(): void {
    this.clearTimers()
    this.speechStartTime = null
    this.silenceStartTime = null
    this.lastSpeechTime = null
    this.sessionStartTime = null
    this.currentSpeechDuration = 0
    this.currentSilenceDuration = 0
    this.stats = this.createEmptyStats()
  }
  
  /**
   * Get current state
   */
  public getState(): SilenceState {
    return this.state
  }
  
  /**
   * Get session statistics
   */
  public getStats(): SessionStats {
    // Calculate derived stats
    const stats = { ...this.stats }
    
    if (stats.speechSegments > 0) {
      stats.avgSpeechDuration = stats.totalSpeechDuration / stats.speechSegments
    }
    if (stats.silenceSegments > 0) {
      stats.avgSilenceDuration = stats.totalSilenceDuration / stats.silenceSegments
    }
    
    const total = stats.totalSpeechDuration + stats.totalSilenceDuration
    stats.speechRatio = total > 0 ? stats.totalSpeechDuration / total : 0
    
    return stats
  }
  
  /**
   * Get adaptive threshold info
   */
  public getAdaptiveInfo(): AdaptiveThresholds {
    return { ...this.adaptive }
  }
  
  /**
   * Get current silence duration (if in silence)
   */
  public getCurrentSilenceDuration(): number | null {
    if (this.silenceStartTime && 
        (this.state === SilenceState.SILENCE || this.state === SilenceState.PAUSED)) {
      return Date.now() - this.silenceStartTime
    }
    return null
  }
  
  /**
   * Get current speech duration (if speaking)
   */
  public getCurrentSpeechDuration(): number | null {
    if (this.speechStartTime && this.state === SilenceState.SPEAKING) {
      return Date.now() - this.speechStartTime
    }
    return null
  }
  
  /**
   * Force stop the session
   */
  public forceStop(): void {
    this.clearTimers()
    this.transitionTo(SilenceState.IDLE)
    this.emit('session-stop', {
      reason: 'forced_stop',
      totalSilence: this.stats.totalSilenceDuration,
      timestamp: Date.now(),
    })
    this.resetSession()
  }
  
  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SilenceDetectorConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
  
  /**
   * Dispose and clean up
   */
  public dispose(): void {
    this.clearTimers()
    this.eventListeners = {}
    this.resetSession()
  }
}

/**
 * Create a silence detector instance
 */
export function createSilenceDetector(config?: Partial<SilenceDetectorConfig>): SilenceDetector {
  return new SilenceDetector(config)
}

/**
 * Vue composable for silence detection
 */
export function useSilenceDetector(config?: Partial<SilenceDetectorConfig>) {
  const detector = createSilenceDetector(config)
  
  return {
    detector,
    onSpeechStart: () => detector.onSpeechStart(),
    onSpeechEnd: () => detector.onSpeechEnd(),
    getState: () => detector.getState(),
    getStats: () => detector.getStats(),
    forceStop: () => detector.forceStop(),
    dispose: () => detector.dispose(),
  }
}
