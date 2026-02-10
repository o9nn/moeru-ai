# Emotion Mapper Integration

## Overview

This document describes the integration of the emotion mapper system, resolving the TODO:
> "After emotion mapper, stage editor, eye related parameters should be taken care of to be dynamic instead of hardcoding"

## Architecture

```
LLM Output → Stage.vue → EmotionStore → EmotionBridge → Live2D Parameters
                ↓                ↓                           ↓
          Text Parsing    Motion Triggers          Smooth Interpolation
          (EMOTE tokens)  (existing system)        Micro-expressions
                                                   Emotion Decay
                                                   Body Sway
                                                   Saccade Context
```

## Components

### 1. Emotion Bridge (`emotion-bridge.ts`)

The core integration layer that maps stage-ui emotion tokens to Live2D model parameters.

**Key Features:**
- Maps 8 stage-ui emotions to 14 live2d-core emotion presets
- Smooth parameter interpolation via lerp
- Micro-expressions (subtle random facial variations)
- Emotion decay (gradual return to neutral)
- Body sway patterns per emotion
- Configurable at runtime

### 2. Emotion Store (`stores/emotion.ts`)

Centralized Pinia store for emotion state management.

**Key Features:**
- Single source of truth for character emotion
- Emotion history tracking (last 50 entries)
- Dominant emotion calculation over time window
- Persistent configuration via localStorage
- Routes to both motion triggers and parameter mapping

### 3. Updated Animation (`animation.ts`)

The idle eye saccade system is now parameterized instead of hardcoded.

**Key Changes:**
- Saccade range, focus scale, and lerp speed are configurable
- `setEmotionContext()` adjusts eye behavior per emotion
- Sad: eyes look down with slow movement
- Happy: wider range with faster movement
- Angry: focused, intense gaze
- Thinking: eyes drift to upper-right

### 4. Model.vue Integration

The Live2D model component now:
- Initializes the emotion bridge
- Watches emotion store for changes
- Applies parameter-level expressions in the render loop
- Syncs saccade behavior with emotion state

## Emotion Mapping

| Stage-UI Token | Live2D-Core Emotion | Key Parameters |
|----------------|---------------------|----------------|
| `<\|EMOTE_NEUTRAL\|>` | Neutral | Default pose |
| `<\|EMOTE_HAPPY\|>` | Happy | Eye smile, mouth smile, cheek |
| `<\|EMOTE_SAD\|>` | Sad | Droopy eyebrows, frown |
| `<\|EMOTE_ANGRY\|>` | Angry | Furrowed brows, tense mouth |
| `<\|EMOTE_THINK\|>` | Thoughtful | Raised brows, slight squint |
| `<\|EMOTE_SURPRISE\|>` | Surprised | Wide eyes, raised brows, open mouth |
| `<\|EMOTE_AWKWARD\|>` | Embarrassed | Averted eyes, cheek blush |
| `<\|EMOTE_QUESTION\|>` | Confused | Asymmetric brows, tilted head |

## Configuration

All settings are persisted in localStorage under `settings/emotion/config`:

```typescript
interface EmotionConfig {
  enableParameterMapping: boolean    // Toggle parameter-level expressions
  enableMotionTriggers: boolean      // Toggle motion triggers
  enableDecay: boolean               // Toggle emotion decay
  decayDelay: number                 // Ms before decay starts
  enableMicroExpressions: boolean    // Toggle micro-expressions
  enableBodySway: boolean            // Toggle body sway
  transitionSpeed: number            // Parameter lerp speed (0-1)
  defaultIntensity: number           // Default emotion intensity (0-1)
}
```

## Data Flow

1. LLM generates text with `<|EMOTE_HAPPY|>` tokens
2. `useEmotionsMessageQueue` in `queues.ts` detects and extracts emotion
3. `Stage.vue` routes emotion to `EmotionStore.setEmotion()`
4. `EmotionStore` triggers motion via `live2dStore.currentMotion`
5. `Model.vue` watches `emotionStore.currentEmotion` and calls `emotionBridge.setEmotion()`
6. `emotionBridge.update()` smoothly interpolates parameters in the render loop
7. Eye saccade behavior adjusts via `idleEyeFocus.setEmotionContext()`
