/**
 * Transcription Session Manager
 * 
 * Manages realtime transcription sessions with VAD-driven silence detection.
 * Handles session lifecycle, audio buffering, and automatic pause/resume.
 */

import type { SilenceDetector, SilenceDetectorConfig, SilenceDetectorEvents } from './silence-detector'
import type { EnergyVAD, EnergyVADConfig } from './energy-vad'
import type { BaseVAD } from './vad'

import { createSilenceDetector, SilenceState } from './silence-detector'
import { createEnergyVAD } from './energy-vad'

/**
 * Session state
 */
export enum SessionState {
  /** Session not started */
  IDLE = 'idle',
  /** Session starting up */
  STARTING = 'starting',
  /** Session active and processing */
  ACTIVE = 'active',
  /** Session paused due to silence */
  PAUSED = 'paused',
  /** Session stopping */
  STOPPING = 'stopping',
  /** Session stopped */
  STOPPED = 'stopped',
  /** Session error */
  ERROR = 'error',
}

/**
 * Session configuration
 */
export interface SessionConfig {
  /** Unique session ID */
  sessionId?: string
  /** Silence detection configuration */
  silenceConfig?: Partial<SilenceDetectorConfig>
  /** Energy VAD configuration (for fallback) */
  energyVADConfig?: Partial<EnergyVADConfig>
  /** Maximum session duration (ms) */
  maxSessionDurationMs?: number
  /** Buffer audio during pause */
  bufferDuringPause?: boolean
  /** Maximum buffer size during pause (bytes) */
  maxPauseBufferSize?: number
  /** Auto-restart after stop */
  autoRestartOnSpeech?: boolean
  /** Use energy VAD as fallback */
  useEnergyVADFallback?: boolean
}

/**
 * Session events
 */
export interface SessionEvents {
  /** Session state changed */
  'state-change': { from: SessionState; to: SessionState; timestamp: number }
  /** Session started */
  'session-start': { sessionId: string; timestamp: number }
  /** Session paused */
  'session-pause': { sessionId: string; reason: string; timestamp: number }
  /** Session resumed */
  'session-resume': { sessionId: string; timestamp: number }
  /** Session stopped */
  'session-stop': { sessionId: string; reason: string; timestamp: number }
  /** Audio chunk ready for transcription */
  'audio-ready': { buffer: Float32Array; duration: number; timestamp: number }
  /** Buffered audio flushed on resume */
  'buffer-flush': { buffer: Float32Array; duration: number; timestamp: number }
  /** Error occurred */
  'error': { error: Error; timestamp: number }
  /** Debug information */
  'debug': { message: string; data?: unknown }
}

export type SessionEventCallback<K extends keyof SessionEvents> = (event: SessionEvents[K]) => void

/**
 * Session statistics
 */
export interface SessionStatistics {
  /** Session ID */
  sessionId: string
  /** Session state */
  state: SessionState
  /** Session start time */
  startTime: number | null
  /** Total duration (ms) */
  totalDuration: number
  /** Active duration (ms) */
  activeDuration: number
  /** Paused duration (ms) */
  pausedDuration: number
  /** Number of pause events */
  pauseCount: number
  /** Total audio processed (samples) */
  totalAudioSamples: number
  /** Buffered audio during pause (samples) */
  bufferedSamples: number
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Transcription Session Manager
 */
export class TranscriptionSessionManager {
  private config: Required<SessionConfig>
  private state: SessionState = SessionState.IDLE
  private sessionId: string
  private eventListeners: Partial<Record<keyof SessionEvents, SessionEventCallback<any>[]>> = {}
  
  // Components
  private silenceDetector: SilenceDetector
  private energyVAD: EnergyVAD | null = null
  private connectedVAD: BaseVAD | null = null
  private vadDisconnect: (() => void) | null = null
  
  // Timing
  private sessionStartTime: number | null = null
  private pauseStartTime: number | null = null
  private totalPausedDuration: number = 0
  private pauseCount: number = 0
  
  // Audio buffering
  private pauseBuffer: Float32Array[] = []
  private pauseBufferSize: number = 0
  private totalAudioSamples: number = 0
  
  // Session timeout
  private sessionTimeoutTimer: ReturnType<typeof setTimeout> | null = null
  
  constructor(userConfig: Partial<SessionConfig> = {}) {
    const defaultConfig: Required<SessionConfig> = {
      sessionId: generateSessionId(),
      silenceConfig: {},
      energyVADConfig: {},
      maxSessionDurationMs: 30 * 60 * 1000, // 30 minutes
      bufferDuringPause: true,
      maxPauseBufferSize: 16000 * 60, // ~60 seconds at 16kHz
      autoRestartOnSpeech: true,
      useEnergyVADFallback: true,
    }
    
    this.config = { ...defaultConfig, ...userConfig } as Required<SessionConfig>
    this.sessionId = this.config.sessionId
    
    // Create silence detector
    this.silenceDetector = createSilenceDetector(this.config.silenceConfig)
    this.setupSilenceDetectorEvents()
    
    // Create energy VAD if fallback enabled
    if (this.config.useEnergyVADFallback) {
      this.energyVAD = createEnergyVAD(this.config.energyVADConfig)
    }
  }
  
  /**
   * Setup silence detector event handlers
   */
  private setupSilenceDetectorEvents(): void {
    this.silenceDetector.on('session-pause', (event) => {
      this.handlePause(event.reason)
    })
    
    this.silenceDetector.on('session-resume', (event) => {
      this.handleResume(event.reason)
    })
    
    this.silenceDetector.on('session-stop', (event) => {
      this.handleStop(event.reason)
    })
    
    this.silenceDetector.on('state-change', (event) => {
      this.emit('debug', {
        message: `Silence detector state: ${event.from} -> ${event.to}`,
        data: event,
      })
    })
  }
  
  /**
   * Add event listener
   */
  public on<K extends keyof SessionEvents>(
    event: K, 
    callback: SessionEventCallback<K>
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
  public off<K extends keyof SessionEvents>(
    event: K, 
    callback: SessionEventCallback<K>
  ): void {
    if (!this.eventListeners[event]) return
    this.eventListeners[event] = this.eventListeners[event]!.filter(cb => cb !== callback)
  }
  
  /**
   * Emit event
   */
  private emit<K extends keyof SessionEvents>(event: K, data: SessionEvents[K]): void {
    if (!this.eventListeners[event]) return
    for (const callback of this.eventListeners[event]!) {
      try {
        callback(data)
      }
      catch (err) {
        console.error(`[SessionManager] Error in event listener for ${event}:`, err)
      }
    }
  }
  
  /**
   * Transition to a new state
   */
  private transitionTo(newState: SessionState): void {
    if (this.state === newState) return
    
    const oldState = this.state
    this.state = newState
    
    this.emit('state-change', {
      from: oldState,
      to: newState,
      timestamp: Date.now(),
    })
  }
  
  /**
   * Connect to a VAD instance
   */
  public connectVAD(vad: BaseVAD): void {
    // Disconnect existing VAD
    if (this.vadDisconnect) {
      this.vadDisconnect()
    }
    
    this.connectedVAD = vad
    this.vadDisconnect = this.silenceDetector.connectVAD(vad)
    
    // Also connect speech-ready for audio processing
    vad.on('speech-ready', ({ buffer, duration }) => {
      this.processAudioChunk(buffer, duration)
    })
  }
  
  /**
   * Start the session
   */
  public async start(): Promise<void> {
    if (this.state !== SessionState.IDLE && this.state !== SessionState.STOPPED) {
      throw new Error(`Cannot start session in state: ${this.state}`)
    }
    
    this.transitionTo(SessionState.STARTING)
    
    try {
      this.sessionStartTime = Date.now()
      this.totalPausedDuration = 0
      this.pauseCount = 0
      this.totalAudioSamples = 0
      this.pauseBuffer = []
      this.pauseBufferSize = 0
      
      // Start session timeout timer
      if (this.config.maxSessionDurationMs > 0) {
        this.sessionTimeoutTimer = setTimeout(() => {
          this.handleStop('max_duration_exceeded')
        }, this.config.maxSessionDurationMs)
      }
      
      this.transitionTo(SessionState.ACTIVE)
      
      this.emit('session-start', {
        sessionId: this.sessionId,
        timestamp: Date.now(),
      })
    }
    catch (err) {
      this.transitionTo(SessionState.ERROR)
      this.emit('error', {
        error: err instanceof Error ? err : new Error(String(err)),
        timestamp: Date.now(),
      })
      throw err
    }
  }
  
  /**
   * Handle pause event
   */
  private handlePause(reason: string): void {
    if (this.state !== SessionState.ACTIVE) return
    
    this.pauseStartTime = Date.now()
    this.pauseCount++
    
    this.transitionTo(SessionState.PAUSED)
    
    this.emit('session-pause', {
      sessionId: this.sessionId,
      reason,
      timestamp: Date.now(),
    })
  }
  
  /**
   * Handle resume event
   */
  private handleResume(reason: string): void {
    if (this.state !== SessionState.PAUSED) return
    
    // Calculate paused duration
    if (this.pauseStartTime) {
      this.totalPausedDuration += Date.now() - this.pauseStartTime
      this.pauseStartTime = null
    }
    
    this.transitionTo(SessionState.ACTIVE)
    
    // Flush buffered audio
    if (this.pauseBuffer.length > 0) {
      const totalLength = this.pauseBuffer.reduce((sum, buf) => sum + buf.length, 0)
      const flushedBuffer = new Float32Array(totalLength)
      let offset = 0
      for (const buf of this.pauseBuffer) {
        flushedBuffer.set(buf, offset)
        offset += buf.length
      }
      
      const duration = (totalLength / 16000) * 1000 // Assuming 16kHz
      
      this.emit('buffer-flush', {
        buffer: flushedBuffer,
        duration,
        timestamp: Date.now(),
      })
      
      this.pauseBuffer = []
      this.pauseBufferSize = 0
    }
    
    this.emit('session-resume', {
      sessionId: this.sessionId,
      timestamp: Date.now(),
    })
  }
  
  /**
   * Handle stop event
   */
  private handleStop(reason: string): void {
    if (this.state === SessionState.STOPPED || this.state === SessionState.IDLE) return
    
    this.transitionTo(SessionState.STOPPING)
    
    // Clear timeout timer
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer)
      this.sessionTimeoutTimer = null
    }
    
    // Calculate final paused duration
    if (this.pauseStartTime) {
      this.totalPausedDuration += Date.now() - this.pauseStartTime
      this.pauseStartTime = null
    }
    
    this.transitionTo(SessionState.STOPPED)
    
    this.emit('session-stop', {
      sessionId: this.sessionId,
      reason,
      timestamp: Date.now(),
    })
  }
  
  /**
   * Process an audio chunk
   */
  public processAudioChunk(buffer: Float32Array, duration: number): void {
    this.totalAudioSamples += buffer.length
    
    // If using energy VAD fallback, process through it
    if (this.energyVAD && !this.connectedVAD) {
      this.energyVAD.processBuffer(buffer)
    }
    
    // Handle based on state
    switch (this.state) {
      case SessionState.ACTIVE:
        this.emit('audio-ready', {
          buffer,
          duration,
          timestamp: Date.now(),
        })
        break
        
      case SessionState.PAUSED:
        if (this.config.bufferDuringPause) {
          // Buffer audio during pause
          if (this.pauseBufferSize + buffer.length <= this.config.maxPauseBufferSize) {
            this.pauseBuffer.push(buffer.slice())
            this.pauseBufferSize += buffer.length
          }
          else {
            // Buffer full, drop oldest
            while (this.pauseBufferSize + buffer.length > this.config.maxPauseBufferSize && 
                   this.pauseBuffer.length > 0) {
              const dropped = this.pauseBuffer.shift()!
              this.pauseBufferSize -= dropped.length
            }
            this.pauseBuffer.push(buffer.slice())
            this.pauseBufferSize += buffer.length
          }
        }
        break
        
      case SessionState.IDLE:
      case SessionState.STOPPED:
        // If auto-restart enabled and speech detected, restart
        if (this.config.autoRestartOnSpeech) {
          this.start().catch(err => {
            this.emit('error', {
              error: err instanceof Error ? err : new Error(String(err)),
              timestamp: Date.now(),
            })
          })
        }
        break
    }
  }
  
  /**
   * Manually trigger speech start (for external VAD)
   */
  public onSpeechStart(): void {
    this.silenceDetector.onSpeechStart()
  }
  
  /**
   * Manually trigger speech end (for external VAD)
   */
  public onSpeechEnd(): void {
    this.silenceDetector.onSpeechEnd()
  }
  
  /**
   * Stop the session
   */
  public stop(reason: string = 'manual_stop'): void {
    this.handleStop(reason)
  }
  
  /**
   * Pause the session manually
   */
  public pause(): void {
    this.handlePause('manual_pause')
  }
  
  /**
   * Resume the session manually
   */
  public resume(): void {
    this.handleResume('manual_resume')
  }
  
  /**
   * Get session statistics
   */
  public getStatistics(): SessionStatistics {
    const now = Date.now()
    const totalDuration = this.sessionStartTime ? now - this.sessionStartTime : 0
    
    let currentPauseDuration = 0
    if (this.pauseStartTime) {
      currentPauseDuration = now - this.pauseStartTime
    }
    
    const pausedDuration = this.totalPausedDuration + currentPauseDuration
    const activeDuration = totalDuration - pausedDuration
    
    return {
      sessionId: this.sessionId,
      state: this.state,
      startTime: this.sessionStartTime,
      totalDuration,
      activeDuration,
      pausedDuration,
      pauseCount: this.pauseCount,
      totalAudioSamples: this.totalAudioSamples,
      bufferedSamples: this.pauseBufferSize,
    }
  }
  
  /**
   * Get current state
   */
  public getState(): SessionState {
    return this.state
  }
  
  /**
   * Get session ID
   */
  public getSessionId(): string {
    return this.sessionId
  }
  
  /**
   * Get silence detector
   */
  public getSilenceDetector(): SilenceDetector {
    return this.silenceDetector
  }
  
  /**
   * Get energy VAD (if available)
   */
  public getEnergyVAD(): EnergyVAD | null {
    return this.energyVAD
  }
  
  /**
   * Dispose and clean up
   */
  public dispose(): void {
    if (this.sessionTimeoutTimer) {
      clearTimeout(this.sessionTimeoutTimer)
      this.sessionTimeoutTimer = null
    }
    
    if (this.vadDisconnect) {
      this.vadDisconnect()
      this.vadDisconnect = null
    }
    
    this.silenceDetector.dispose()
    this.eventListeners = {}
    this.pauseBuffer = []
    this.pauseBufferSize = 0
  }
}

/**
 * Create a transcription session manager
 */
export function createSessionManager(config?: Partial<SessionConfig>): TranscriptionSessionManager {
  return new TranscriptionSessionManager(config)
}
