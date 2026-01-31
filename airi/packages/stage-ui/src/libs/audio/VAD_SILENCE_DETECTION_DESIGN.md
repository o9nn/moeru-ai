# VAD-Driven Silence Detection - Architecture Design

## Overview

This document outlines the architecture for implementing VAD-driven silence detection in the moeru-ai hearing module. The system enables intelligent management of realtime transcription sessions based on voice activity and silence thresholds.

## Current State

The TODO at `packages/stage-ui/src/stores/modules/hearing.ts:102` states:
> "integrate VAD-driven silence detection to stop and restart realtime sessions based on silence thresholds"

Currently:
1. VAD exists in `apps/stage-web/src/workers/vad/vad.ts` using Silero VAD model
2. Base VAD types are in `packages/stage-ui/src/libs/audio/vad.ts`
3. Transcription happens via streaming (Aliyun NLS) or batch (generateTranscription)
4. No integration between VAD and transcription session management

## Problem Statement

Realtime transcription sessions:
- Consume resources continuously even during silence
- May timeout or accumulate costs during long pauses
- Don't adapt to natural speech patterns (pauses, thinking, etc.)

## Proposed Architecture

### 1. Silence Detection State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    Silence Detection FSM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐    speech     ┌──────────┐    silence    ┌──────────┐
│   │  IDLE    │──────────────▶│ SPEAKING │──────────────▶│ SILENCE  │
│   └──────────┘               └──────────┘               └──────────┘
│        ▲                          │                          │
│        │                          │                          │
│        │      timeout/end         │      speech              │
│        └──────────────────────────┴──────────────────────────┘
│                                                                  │
│   States:                                                        │
│   - IDLE: No active session, waiting for speech                  │
│   - SPEAKING: Active session, speech detected                    │
│   - SILENCE: Active session, monitoring silence duration         │
│                                                                  │
│   Transitions:                                                   │
│   - IDLE → SPEAKING: VAD detects speech start                    │
│   - SPEAKING → SILENCE: VAD detects speech end                   │
│   - SILENCE → SPEAKING: VAD detects speech resume                │
│   - SILENCE → IDLE: Silence exceeds threshold                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Core Components

#### 2.1 SilenceDetector Class

```typescript
interface SilenceDetectorConfig {
  // Minimum silence duration to trigger session pause (ms)
  minSilenceForPause: number;
  // Maximum silence duration before session stop (ms)
  maxSilenceForStop: number;
  // Grace period after speech ends before considering silence (ms)
  silenceGracePeriod: number;
  // Whether to auto-restart session on new speech
  autoRestart: boolean;
  // Adaptive threshold based on speech patterns
  adaptiveThreshold: boolean;
}

interface SilenceDetectorEvents {
  'silence-start': { timestamp: number; duration: number };
  'silence-end': { timestamp: number; duration: number };
  'session-pause': { reason: string; silenceDuration: number };
  'session-resume': { reason: string };
  'session-stop': { reason: string; totalSilence: number };
  'state-change': { from: State; to: State; timestamp: number };
}
```

#### 2.2 TranscriptionSessionManager

```typescript
interface SessionManagerConfig {
  // Silence detector configuration
  silenceConfig: SilenceDetectorConfig;
  // Maximum session duration (ms)
  maxSessionDuration: number;
  // Minimum speech duration to keep session (ms)
  minSpeechDuration: number;
  // Buffer size for audio chunks
  audioBufferSize: number;
}

interface TranscriptionSession {
  id: string;
  state: 'active' | 'paused' | 'stopped';
  startTime: number;
  lastSpeechTime: number;
  totalSpeechDuration: number;
  totalSilenceDuration: number;
  transcriptionResult: string;
}
```

### 3. Integration Points

#### 3.1 With Existing VAD

```typescript
// Connect to existing VAD events
vad.on('speech-start', () => {
  silenceDetector.onSpeechStart();
  sessionManager.ensureSessionActive();
});

vad.on('speech-end', () => {
  silenceDetector.onSpeechEnd();
});

vad.on('speech-ready', ({ buffer, duration }) => {
  sessionManager.processAudioChunk(buffer, duration);
});
```

#### 3.2 With Hearing Store

```typescript
// In hearing.ts transcription function
if (features.supportsStreamOutput && streamExecutor) {
  // Create session with silence detection
  const session = await sessionManager.createSession({
    provider: providerId,
    model,
    silenceConfig: {
      minSilenceForPause: 2000,  // 2 seconds
      maxSilenceForStop: 10000, // 10 seconds
      autoRestart: true,
    },
  });
  
  // Connect VAD to session
  session.connectVAD(vad);
  
  return {
    mode: 'stream',
    ...session.getStreamResult(),
  };
}
```

### 4. Adaptive Silence Thresholds

The system learns from user speech patterns:

```typescript
interface AdaptiveThresholds {
  // Running average of pause durations
  averagePauseDuration: number;
  // Standard deviation of pauses
  pauseStdDev: number;
  // Speech-to-silence ratio
  speechRatio: number;
  // Confidence in current thresholds
  confidence: number;
}

// Adaptive threshold calculation
function calculateAdaptiveThreshold(history: PauseHistory): number {
  const mean = history.averagePauseDuration;
  const std = history.pauseStdDev;
  
  // Use 2 standard deviations above mean as threshold
  // This captures ~95% of natural pauses
  return mean + (2 * std);
}
```

### 5. Energy-Based Fallback

For environments where Silero VAD isn't available:

```typescript
interface EnergyVADConfig {
  // RMS energy threshold for speech
  energyThreshold: number;
  // Zero-crossing rate threshold
  zcrThreshold: number;
  // Smoothing factor for energy calculation
  smoothingFactor: number;
  // Frame size for analysis (samples)
  frameSize: number;
}

function calculateEnergy(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

function calculateZCR(buffer: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < buffer.length; i++) {
    if ((buffer[i] >= 0) !== (buffer[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / buffer.length;
}
```

### 6. Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    Session Lifecycle                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATION                                                     │
│     └─▶ Initialize session with config                           │
│     └─▶ Connect to VAD events                                    │
│     └─▶ Start silence monitoring                                 │
│                                                                  │
│  2. ACTIVE                                                       │
│     └─▶ Process audio chunks                                     │
│     └─▶ Track speech/silence durations                           │
│     └─▶ Update adaptive thresholds                               │
│                                                                  │
│  3. PAUSED (optional)                                            │
│     └─▶ Pause transcription stream                               │
│     └─▶ Buffer incoming audio                                    │
│     └─▶ Wait for speech resume or timeout                        │
│                                                                  │
│  4. STOPPED                                                      │
│     └─▶ Finalize transcription                                   │
│     └─▶ Emit final result                                        │
│     └─▶ Clean up resources                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7. File Structure

```
packages/stage-ui/src/libs/audio/
├── vad.ts                          # Existing VAD types
├── silence-detector.ts             # Silence detection state machine
├── energy-vad.ts                   # Energy-based VAD fallback
├── adaptive-threshold.ts           # Adaptive threshold calculator
└── session-manager.ts              # Transcription session manager

packages/stage-ui/src/stores/modules/
├── hearing.ts                      # Updated with VAD integration
└── hearing-vad.ts                  # VAD-specific store
```

### 8. Configuration Options

```typescript
interface VADSilenceConfig {
  // Detection mode
  mode: 'silero' | 'energy' | 'hybrid';
  
  // Silence thresholds
  silence: {
    minDurationMs: number;      // Min silence to detect (default: 300)
    pauseThresholdMs: number;   // Silence for session pause (default: 2000)
    stopThresholdMs: number;    // Silence for session stop (default: 10000)
    gracePeriodMs: number;      // Grace period after speech (default: 500)
  };
  
  // Speech thresholds
  speech: {
    minDurationMs: number;      // Min speech to keep session (default: 250)
    energyThreshold: number;    // RMS energy threshold (default: 0.01)
    probabilityThreshold: number; // Silero probability (default: 0.3)
  };
  
  // Adaptive behavior
  adaptive: {
    enabled: boolean;           // Enable adaptive thresholds
    learningRate: number;       // How fast to adapt (default: 0.1)
    historySize: number;        // Pause history to keep (default: 20)
  };
  
  // Session behavior
  session: {
    autoRestart: boolean;       // Auto-restart on new speech
    maxDurationMs: number;      // Max session duration
    bufferDuringPause: boolean; // Buffer audio during pause
  };
}
```

### 9. Events and Callbacks

```typescript
interface VADSilenceEvents {
  // Silence detection events
  'silence:detected': { duration: number; timestamp: number };
  'silence:ended': { duration: number; timestamp: number };
  
  // Session management events
  'session:created': { sessionId: string; config: SessionConfig };
  'session:paused': { sessionId: string; reason: string };
  'session:resumed': { sessionId: string };
  'session:stopped': { sessionId: string; result: TranscriptionResult };
  
  // Adaptive threshold events
  'threshold:updated': { old: number; new: number; confidence: number };
  
  // Debug events
  'vad:probability': { value: number; isSpeech: boolean };
  'energy:level': { rms: number; zcr: number };
}
```

## Implementation Plan

### Phase 1: Core Silence Detector
1. Create `SilenceDetector` class with state machine
2. Implement basic silence duration tracking
3. Add event emission for state changes

### Phase 2: Energy-Based VAD
1. Implement `EnergyVAD` for fallback detection
2. Add RMS energy and ZCR calculation
3. Create hybrid mode combining Silero + Energy

### Phase 3: Session Manager
1. Create `TranscriptionSessionManager` class
2. Implement session lifecycle (create, pause, resume, stop)
3. Add audio buffering during pause

### Phase 4: Integration
1. Update `hearing.ts` to use session manager
2. Connect VAD events to silence detector
3. Add configuration options to hearing store

### Phase 5: Adaptive Thresholds
1. Implement pause history tracking
2. Add adaptive threshold calculation
3. Create learning rate and confidence metrics

### Phase 6: Testing & Polish
1. Add unit tests for state machine
2. Test with various speech patterns
3. Tune default thresholds

## Usage Example

```typescript
import { useHearingStore } from '../stores/modules/hearing';
import { useVADSilenceDetection } from '../libs/audio/silence-detector';

const hearingStore = useHearingStore();
const silenceDetection = useVADSilenceDetection({
  silence: {
    pauseThresholdMs: 3000,
    stopThresholdMs: 15000,
  },
  adaptive: {
    enabled: true,
  },
});

// Start transcription with VAD-driven silence detection
const result = await hearingStore.transcription(
  providerId,
  provider,
  model,
  { inputAudioStream: audioStream },
  'json',
  {
    vadSilenceDetection: silenceDetection,
  }
);

// Listen for session events
silenceDetection.on('session:paused', ({ reason }) => {
  console.log('Session paused:', reason);
});

silenceDetection.on('session:stopped', ({ result }) => {
  console.log('Final transcription:', result.text);
});
```
