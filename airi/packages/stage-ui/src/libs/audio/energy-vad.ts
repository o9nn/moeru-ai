/**
 * Energy-Based Voice Activity Detection
 * 
 * A lightweight VAD implementation using signal energy and zero-crossing rate.
 * Used as a fallback when Silero VAD is not available or for hybrid detection.
 */

/**
 * Configuration for energy-based VAD
 */
export interface EnergyVADConfig {
  /** Sample rate of the audio (Hz) */
  sampleRate: number
  /** Frame size for analysis (samples) */
  frameSize: number
  /** RMS energy threshold for speech detection */
  energyThreshold: number
  /** Zero-crossing rate threshold */
  zcrThreshold: number
  /** Smoothing factor for energy calculation (0-1) */
  smoothingFactor: number
  /** Number of consecutive frames to confirm speech */
  hangoverFrames: number
  /** Minimum speech duration to consider valid (ms) */
  minSpeechDurationMs: number
  /** Minimum silence duration to consider valid (ms) */
  minSilenceDurationMs: number
}

/**
 * VAD analysis result for a single frame
 */
export interface VADFrameResult {
  /** Whether speech is detected */
  isSpeech: boolean
  /** RMS energy level (0-1) */
  energy: number
  /** Zero-crossing rate (0-1) */
  zcr: number
  /** Smoothed energy level */
  smoothedEnergy: number
  /** Confidence score (0-1) */
  confidence: number
  /** Timestamp of the frame */
  timestamp: number
}

/**
 * Events emitted by EnergyVAD
 */
export interface EnergyVADEvents {
  'speech-start': { timestamp: number; energy: number }
  'speech-end': { timestamp: number; duration: number }
  'frame-processed': VADFrameResult
  'threshold-adapted': { oldThreshold: number; newThreshold: number }
}

export type EnergyVADEventCallback<K extends keyof EnergyVADEvents> = (event: EnergyVADEvents[K]) => void

/**
 * Energy-based Voice Activity Detector
 */
export class EnergyVAD {
  private config: EnergyVADConfig
  private smoothedEnergy: number = 0
  private isSpeaking: boolean = false
  private speechStartTime: number | null = null
  private silenceStartTime: number | null = null
  private hangoverCounter: number = 0
  private frameCount: number = 0
  private eventListeners: Partial<Record<keyof EnergyVADEvents, EnergyVADEventCallback<any>[]>> = {}
  
  // Adaptive threshold state
  private energyHistory: number[] = []
  private noiseFloor: number = 0.001
  private adaptiveThreshold: number
  
  constructor(userConfig: Partial<EnergyVADConfig> = {}) {
    const defaultConfig: EnergyVADConfig = {
      sampleRate: 16000,
      frameSize: 512,
      energyThreshold: 0.01,
      zcrThreshold: 0.3,
      smoothingFactor: 0.95,
      hangoverFrames: 10,
      minSpeechDurationMs: 250,
      minSilenceDurationMs: 300,
    }
    
    this.config = { ...defaultConfig, ...userConfig }
    this.adaptiveThreshold = this.config.energyThreshold
  }
  
  /**
   * Add event listener
   */
  public on<K extends keyof EnergyVADEvents>(event: K, callback: EnergyVADEventCallback<K>): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event]!.push(callback as any)
  }
  
  /**
   * Remove event listener
   */
  public off<K extends keyof EnergyVADEvents>(event: K, callback: EnergyVADEventCallback<K>): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event] = this.eventListeners[event]!.filter(cb => cb !== callback)
  }
  
  /**
   * Emit event
   */
  private emit<K extends keyof EnergyVADEvents>(event: K, data: EnergyVADEvents[K]): void {
    if (!this.eventListeners[event]) return
    for (const callback of this.eventListeners[event]!) {
      callback(data)
    }
  }
  
  /**
   * Calculate RMS energy of a buffer
   */
  public calculateEnergy(buffer: Float32Array): number {
    let sum = 0
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i]
    }
    return Math.sqrt(sum / buffer.length)
  }
  
  /**
   * Calculate zero-crossing rate of a buffer
   */
  public calculateZCR(buffer: Float32Array): number {
    let crossings = 0
    for (let i = 1; i < buffer.length; i++) {
      if ((buffer[i] >= 0) !== (buffer[i - 1] >= 0)) {
        crossings++
      }
    }
    return crossings / (buffer.length - 1)
  }
  
  /**
   * Calculate spectral centroid (brightness indicator)
   */
  public calculateSpectralCentroid(buffer: Float32Array): number {
    // Simple approximation using weighted average of sample magnitudes
    let weightedSum = 0
    let magnitudeSum = 0
    
    for (let i = 0; i < buffer.length; i++) {
      const magnitude = Math.abs(buffer[i])
      weightedSum += i * magnitude
      magnitudeSum += magnitude
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum / buffer.length : 0
  }
  
  /**
   * Update adaptive threshold based on recent energy levels
   */
  private updateAdaptiveThreshold(energy: number): void {
    const historySize = 100
    
    this.energyHistory.push(energy)
    if (this.energyHistory.length > historySize) {
      this.energyHistory.shift()
    }
    
    // Calculate noise floor from lowest 20% of energy values
    const sorted = [...this.energyHistory].sort((a, b) => a - b)
    const noiseCount = Math.floor(sorted.length * 0.2)
    if (noiseCount > 0) {
      const noiseSum = sorted.slice(0, noiseCount).reduce((a, b) => a + b, 0)
      this.noiseFloor = noiseSum / noiseCount
    }
    
    // Adaptive threshold is noise floor + margin
    const oldThreshold = this.adaptiveThreshold
    this.adaptiveThreshold = Math.max(
      this.config.energyThreshold,
      this.noiseFloor * 3 // 3x noise floor
    )
    
    if (Math.abs(oldThreshold - this.adaptiveThreshold) > 0.001) {
      this.emit('threshold-adapted', {
        oldThreshold,
        newThreshold: this.adaptiveThreshold,
      })
    }
  }
  
  /**
   * Process an audio frame and detect voice activity
   */
  public processFrame(buffer: Float32Array): VADFrameResult {
    const timestamp = Date.now()
    this.frameCount++
    
    // Calculate features
    const energy = this.calculateEnergy(buffer)
    const zcr = this.calculateZCR(buffer)
    
    // Update adaptive threshold
    this.updateAdaptiveThreshold(energy)
    
    // Smooth energy
    this.smoothedEnergy = this.config.smoothingFactor * this.smoothedEnergy +
      (1 - this.config.smoothingFactor) * energy
    
    // Determine if current frame is speech
    const isFrameSpeech = this.smoothedEnergy > this.adaptiveThreshold &&
      zcr < this.config.zcrThreshold // Speech typically has lower ZCR than noise
    
    // Calculate confidence based on how far above/below threshold
    const energyRatio = this.smoothedEnergy / this.adaptiveThreshold
    const confidence = Math.min(1, Math.max(0, (energyRatio - 0.5) * 2))
    
    // Apply hangover logic for smoother transitions
    let isSpeech = isFrameSpeech
    if (isFrameSpeech) {
      this.hangoverCounter = this.config.hangoverFrames
    }
    else if (this.hangoverCounter > 0) {
      this.hangoverCounter--
      isSpeech = true // Keep speech active during hangover
    }
    
    // Handle state transitions
    const wasSpeak = this.isSpeaking
    this.isSpeaking = isSpeech
    
    if (!wasSpeak && isSpeech) {
      // Speech started
      this.speechStartTime = timestamp
      this.silenceStartTime = null
      this.emit('speech-start', { timestamp, energy: this.smoothedEnergy })
    }
    else if (wasSpeak && !isSpeech) {
      // Speech ended
      const duration = this.speechStartTime ? timestamp - this.speechStartTime : 0
      
      // Only emit if speech was long enough
      if (duration >= this.config.minSpeechDurationMs) {
        this.emit('speech-end', { timestamp, duration })
      }
      
      this.silenceStartTime = timestamp
      this.speechStartTime = null
    }
    
    const result: VADFrameResult = {
      isSpeech,
      energy,
      zcr,
      smoothedEnergy: this.smoothedEnergy,
      confidence,
      timestamp,
    }
    
    this.emit('frame-processed', result)
    
    return result
  }
  
  /**
   * Process a buffer that may contain multiple frames
   */
  public processBuffer(buffer: Float32Array): VADFrameResult[] {
    const results: VADFrameResult[] = []
    const frameSize = this.config.frameSize
    
    for (let i = 0; i < buffer.length; i += frameSize) {
      const frame = buffer.slice(i, Math.min(i + frameSize, buffer.length))
      if (frame.length >= frameSize / 2) { // Process if at least half frame
        results.push(this.processFrame(frame))
      }
    }
    
    return results
  }
  
  /**
   * Get current VAD state
   */
  public getState(): {
    isSpeaking: boolean
    smoothedEnergy: number
    adaptiveThreshold: number
    noiseFloor: number
    speechDuration: number | null
    silenceDuration: number | null
  } {
    const now = Date.now()
    return {
      isSpeaking: this.isSpeaking,
      smoothedEnergy: this.smoothedEnergy,
      adaptiveThreshold: this.adaptiveThreshold,
      noiseFloor: this.noiseFloor,
      speechDuration: this.speechStartTime ? now - this.speechStartTime : null,
      silenceDuration: this.silenceStartTime ? now - this.silenceStartTime : null,
    }
  }
  
  /**
   * Reset VAD state
   */
  public reset(): void {
    this.smoothedEnergy = 0
    this.isSpeaking = false
    this.speechStartTime = null
    this.silenceStartTime = null
    this.hangoverCounter = 0
    this.frameCount = 0
    this.energyHistory = []
    this.noiseFloor = 0.001
    this.adaptiveThreshold = this.config.energyThreshold
  }
  
  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<EnergyVADConfig>): void {
    this.config = { ...this.config, ...newConfig }
    if (newConfig.energyThreshold) {
      this.adaptiveThreshold = Math.max(this.adaptiveThreshold, newConfig.energyThreshold)
    }
  }
}

/**
 * Create an energy-based VAD instance
 */
export function createEnergyVAD(config?: Partial<EnergyVADConfig>): EnergyVAD {
  return new EnergyVAD(config)
}
