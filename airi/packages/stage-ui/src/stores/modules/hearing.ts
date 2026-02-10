import type { TranscriptionProviderWithExtraOptions } from '@xsai-ext/shared-providers'

import type { StreamTranscriptionResult } from '../providers/aliyun'
import type { BaseVAD } from '../../libs/audio/vad'
import type { SilenceDetectorConfig } from '../../libs/audio/silence-detector'
import type { SessionConfig, SessionEvents } from '../../libs/audio/session-manager'

import { useLocalStorage } from '@vueuse/core'
import { generateTranscription } from '@xsai/generate-transcription'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import { useProvidersStore } from '../providers'
import { streamTranscription as streamAliyunTranscription } from '../providers/aliyun'
import { createSessionManager, SessionState, TranscriptionSessionManager } from '../../libs/audio/session-manager'

type GenerateTranscriptionResponse = Awaited<ReturnType<typeof generateTranscription>>
type HearingTranscriptionGenerateResult = GenerateTranscriptionResponse & { mode: 'generate' }
type HearingTranscriptionStreamResult = StreamTranscriptionResult & { mode: 'stream' }
export type HearingTranscriptionResult = HearingTranscriptionGenerateResult | HearingTranscriptionStreamResult

type HearingTranscriptionInput = File | {
  file?: File
  inputAudioStream?: ReadableStream<ArrayBuffer>
}

/**
 * VAD-driven silence detection configuration
 */
export interface VADSilenceDetectionConfig {
  /** Enable VAD-driven silence detection */
  enabled: boolean
  /** Silence detection configuration */
  silenceConfig?: Partial<SilenceDetectorConfig>
  /** Session management configuration */
  sessionConfig?: Partial<SessionConfig>
  /** Callback when session is paused */
  onSessionPause?: (event: SessionEvents['session-pause']) => void
  /** Callback when session is resumed */
  onSessionResume?: (event: SessionEvents['session-resume']) => void
  /** Callback when session is stopped */
  onSessionStop?: (event: SessionEvents['session-stop']) => void
  /** External VAD instance to connect */
  vad?: BaseVAD
}

interface HearingTranscriptionInvokeOptions {
  providerOptions?: Record<string, unknown>
  /** VAD-driven silence detection options */
  vadSilenceDetection?: VADSilenceDetectionConfig
}

const STREAM_TRANSCRIPTION_EXECUTORS: Record<string, typeof streamAliyunTranscription> = {
  'aliyun-nls-transcription': streamAliyunTranscription,
}

export const useHearingStore = defineStore('hearing-store', () => {
  const providersStore = useProvidersStore()
  const { allAudioTranscriptionProvidersMetadata } = storeToRefs(providersStore)

  // State
  const activeTranscriptionProvider = useLocalStorage('settings/hearing/active-provider', '')
  const activeTranscriptionModel = useLocalStorage('settings/hearing/active-model', '')
  const activeCustomModelName = useLocalStorage('settings/hearing/active-custom-model', '')
  const transcriptionModelSearchQuery = ref('')
  
  // VAD Silence Detection State
  const vadSilenceDetectionEnabled = useLocalStorage('settings/hearing/vad-silence-detection-enabled', true)
  const vadPauseThresholdMs = useLocalStorage('settings/hearing/vad-pause-threshold-ms', 2000)
  const vadStopThresholdMs = useLocalStorage('settings/hearing/vad-stop-threshold-ms', 10000)
  const vadAdaptiveEnabled = useLocalStorage('settings/hearing/vad-adaptive-enabled', true)
  
  // Active session manager
  const activeSessionManager = shallowRef<TranscriptionSessionManager | null>(null)

  // Computed properties
  const availableProvidersMetadata = computed(() => allAudioTranscriptionProvidersMetadata.value)

  // Computed properties
  const supportsModelListing = computed(() => {
    return providersStore.getProviderMetadata(activeTranscriptionProvider.value)?.capabilities.listModels !== undefined
  })

  const providerModels = computed(() => {
    return providersStore.getModelsForProvider(activeTranscriptionProvider.value)
  })

  const isLoadingActiveProviderModels = computed(() => {
    return providersStore.isLoadingModels[activeTranscriptionProvider.value] || false
  })

  const activeProviderModelError = computed(() => {
    return providersStore.modelLoadError[activeTranscriptionProvider.value] || null
  })
  
  // VAD session state
  const vadSessionState = computed(() => {
    return activeSessionManager.value?.getState() ?? SessionState.IDLE
  })
  
  const vadSessionStats = computed(() => {
    return activeSessionManager.value?.getStatistics() ?? null
  })

  async function loadModelsForProvider(provider: string) {
    if (provider && providersStore.getProviderMetadata(provider)?.capabilities.listModels !== undefined) {
      await providersStore.fetchModelsForProvider(provider)
    }
  }

  async function getModelsForProvider(provider: string) {
    if (provider && providersStore.getProviderMetadata(provider)?.capabilities.listModels !== undefined) {
      return providersStore.getModelsForProvider(provider)
    }

    return []
  }

  const configured = computed(() => {
    return !!activeTranscriptionProvider.value && !!activeTranscriptionModel.value
  })
  
  /**
   * Create a session manager with VAD-driven silence detection
   */
  function createVADSessionManager(
    vadConfig?: VADSilenceDetectionConfig
  ): TranscriptionSessionManager {
    const sessionManager = createSessionManager({
      silenceConfig: {
        pauseThresholdMs: vadConfig?.silenceConfig?.pauseThresholdMs ?? vadPauseThresholdMs.value,
        stopThresholdMs: vadConfig?.silenceConfig?.stopThresholdMs ?? vadStopThresholdMs.value,
        adaptiveEnabled: vadConfig?.silenceConfig?.adaptiveEnabled ?? vadAdaptiveEnabled.value,
        ...vadConfig?.silenceConfig,
      },
      ...vadConfig?.sessionConfig,
    })
    
    // Setup event handlers
    if (vadConfig?.onSessionPause) {
      sessionManager.on('session-pause', vadConfig.onSessionPause)
    }
    if (vadConfig?.onSessionResume) {
      sessionManager.on('session-resume', vadConfig.onSessionResume)
    }
    if (vadConfig?.onSessionStop) {
      sessionManager.on('session-stop', vadConfig.onSessionStop)
    }
    
    // Connect external VAD if provided
    if (vadConfig?.vad) {
      sessionManager.connectVAD(vadConfig.vad)
    }
    
    return sessionManager
  }

  async function transcription(
    providerId: string,
    provider: TranscriptionProviderWithExtraOptions<string, any>,
    model: string,
    input: HearingTranscriptionInput,
    format?: 'json' | 'verbose_json',
    options?: HearingTranscriptionInvokeOptions,
  ): Promise<HearingTranscriptionResult> {
    const normalizedInput = (input instanceof File ? { file: input } : input ?? {}) as {
      file?: File
      inputAudioStream?: ReadableStream<ArrayBuffer>
    }
    const features = providersStore.getTranscriptionFeatures(providerId)
    const streamExecutor = STREAM_TRANSCRIPTION_EXECUTORS[providerId]
    
    // Determine if VAD silence detection should be used
    const useVADSilenceDetection = options?.vadSilenceDetection?.enabled ?? 
      (vadSilenceDetectionEnabled.value && normalizedInput.inputAudioStream)

    if (features.supportsStreamOutput && streamExecutor) {
      const request = provider.transcription(model, options?.providerOptions)

      if (features.supportsStreamInput && normalizedInput.inputAudioStream) {
        const streamResult = streamExecutor({
          ...request,
          inputAudioStream: normalizedInput.inputAudioStream,
        } as Parameters<typeof streamExecutor>[0])
        
        // VAD-driven silence detection integration
        if (useVADSilenceDetection) {
          // Clean up previous session manager
          if (activeSessionManager.value) {
            activeSessionManager.value.dispose()
          }
          
          // Create new session manager
          const sessionManager = createVADSessionManager(options?.vadSilenceDetection)
          activeSessionManager.value = sessionManager
          
          // Start the session
          await sessionManager.start()
          
          // Setup session event handlers for stream control
          sessionManager.on('session-pause', () => {
            console.log('[Hearing] VAD detected extended silence, session paused')
            // The stream can continue but we track the pause state
          })
          
          sessionManager.on('session-resume', () => {
            console.log('[Hearing] VAD detected speech resume, session resumed')
          })
          
          sessionManager.on('session-stop', ({ reason }) => {
            console.log(`[Hearing] VAD session stopped: ${reason}`)
            // Clean up when session stops
            activeSessionManager.value = null
          })
          
          // Return enhanced stream result with session manager
          return {
            mode: 'stream',
            ...streamResult,
            // Expose session manager for external control
            sessionManager,
          } as HearingTranscriptionStreamResult & { sessionManager: TranscriptionSessionManager }
        }
        
        return {
          mode: 'stream',
          ...streamResult,
        }
      }

      if (!features.supportsStreamInput && normalizedInput.file) {
        const streamResult = streamExecutor({
          ...request,
          file: normalizedInput.file,
        } as Parameters<typeof streamExecutor>[0])
        
        // VAD-driven silence detection for file-based streaming
        if (useVADSilenceDetection && options?.vadSilenceDetection?.vad) {
          const sessionManager = createVADSessionManager(options.vadSilenceDetection)
          activeSessionManager.value = sessionManager
          await sessionManager.start()
          
          return {
            mode: 'stream',
            ...streamResult,
            sessionManager,
          } as HearingTranscriptionStreamResult & { sessionManager: TranscriptionSessionManager }
        }
        
        return {
          mode: 'stream',
          ...streamResult,
        }
      }

      if (features.supportsStreamInput && !normalizedInput.inputAudioStream && normalizedInput.file) {
        const streamResult = streamExecutor({
          ...request,
          file: normalizedInput.file,
        } as Parameters<typeof streamExecutor>[0])
        
        // VAD-driven silence detection for file-based streaming
        if (useVADSilenceDetection && options?.vadSilenceDetection?.vad) {
          const sessionManager = createVADSessionManager(options.vadSilenceDetection)
          activeSessionManager.value = sessionManager
          await sessionManager.start()
          
          return {
            mode: 'stream',
            ...streamResult,
            sessionManager,
          } as HearingTranscriptionStreamResult & { sessionManager: TranscriptionSessionManager }
        }
        
        return {
          mode: 'stream',
          ...streamResult,
        }
      }

      if (!features.supportsGenerate || !normalizedInput.file) {
        throw new Error('No compatible input provided for streaming transcription.')
      }
    }

    if (!normalizedInput.file) {
      throw new Error('File input is required for transcription.')
    }

    const response = await generateTranscription({
      ...provider.transcription(model, options?.providerOptions),
      file: normalizedInput.file,
      responseFormat: format,
    })

    return {
      mode: 'generate',
      ...response,
    }
  }
  
  /**
   * Get the active session manager
   */
  function getActiveSessionManager(): TranscriptionSessionManager | null {
    return activeSessionManager.value
  }
  
  /**
   * Stop the active VAD session
   */
  function stopVADSession(reason: string = 'manual_stop'): void {
    if (activeSessionManager.value) {
      activeSessionManager.value.stop(reason)
      activeSessionManager.value.dispose()
      activeSessionManager.value = null
    }
  }
  
  /**
   * Pause the active VAD session
   */
  function pauseVADSession(): void {
    activeSessionManager.value?.pause()
  }
  
  /**
   * Resume the active VAD session
   */
  function resumeVADSession(): void {
    activeSessionManager.value?.resume()
  }

  return {
    activeTranscriptionProvider,
    activeTranscriptionModel,
    availableProvidersMetadata,
    activeCustomModelName,
    transcriptionModelSearchQuery,

    supportsModelListing,
    providerModels,
    isLoadingActiveProviderModels,
    activeProviderModelError,
    configured,
    
    // VAD Silence Detection
    vadSilenceDetectionEnabled,
    vadPauseThresholdMs,
    vadStopThresholdMs,
    vadAdaptiveEnabled,
    vadSessionState,
    vadSessionStats,

    transcription,
    loadModelsForProvider,
    getModelsForProvider,
    
    // VAD Session Management
    getActiveSessionManager,
    stopVADSession,
    pauseVADSession,
    resumeVADSession,
    createVADSessionManager,
  }
})

export const useHearingSpeechInputPipeline = defineStore('modules:hearing:speech:audio-input-pipeline', () => {
  const error = ref<string>()

  const hearingStore = useHearingStore()
  const { activeTranscriptionProvider, activeTranscriptionModel } = storeToRefs(hearingStore)
  const providersStore = useProvidersStore()

  async function transcribeForRecording(recording: Blob | null | undefined) {
    if (!recording)
      return

    try {
      if (recording && recording.size > 0) {
        const providerId = activeTranscriptionProvider.value
        const provider = await providersStore.getProviderInstance<TranscriptionProviderWithExtraOptions<string, any>>(providerId)
        if (!provider) {
          throw new Error('Failed to initialize speech provider')
        }

        // Get model from configuration or use default
        const model = activeTranscriptionModel.value
        const result = await hearingStore.transcription(
          providerId,
          provider,
          model,
          new File([recording], 'recording.wav'),
        )
        return result.mode === 'stream' ? await result.text : result.text
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('Error generating transcription:', error.value)
    }
  }

  return {
    error,

    transcribeForRecording,
  }
})
