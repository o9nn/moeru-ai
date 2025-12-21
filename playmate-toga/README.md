# @moeru-ai/playmate-toga

**Himiko Toga AI Personality with Layla Features and Live2D Avatar Support**

A TypeScript implementation of the Himiko Toga personality from [agent-toga](https://github.com/o9nn/agent-toga), integrated with the moeru-ai cognitive architecture and enhanced with Layla's multi-modal capabilities and Live2D avatar support.

## 🎭 Features

### Core Personality
- **Cheerful & Bubbly**: Energetic, playful responses with "ehehe~" and hearts ♡
- **Obsessive Nature**: Intense reactions to "cute" things
- **Chaotic Unpredictability**: Spontaneous behavior and rapid mood shifts
- **Identity Fluidity**: Desire to become one with obsessions
- **Emotional Depth**: Vulnerability beneath the cheerful exterior
- **Safe & Ethical**: All behavior is fictional and constructive

### Transform Quirk - Code Absorption System
**"Once I taste your code... I can become you~ ♡"**

Toga's signature ability to absorb knowledge from systems and codebases, learning to transform and use their abilities.

### Live2D Avatar Integration
- Real-time emotion expression through Live2D models
- Synchronized animations with personality states
- Interactive avatar with mouse/touch tracking
- Customizable emotion mappings

### Security Testing Extension
**"Violence as Affection" - Breaking Systems Because We Love Them ♡**

Ethical hacking capabilities channeling Toga's obsessive tendencies into thorough security analysis.

## 📦 Installation

```bash
# From the moeru-ai monorepo root
pnpm install

# Build the package
cd playmate-toga
pnpm run build
```

## 🚀 Quick Start

### Basic Personality Usage

```typescript
import { initializeTogaPersonality } from '@moeru-ai/playmate-toga/personality'

const toga = initializeTogaPersonality({
  intensity: 0.8,
  safeMode: true,
  emotionalRange: 'full',
  quirkinessLevel: 0.7,
})

// Frame input through Toga's perspective
const response = toga.frameInput('This solution is so cute!')
console.log(response.framedMessage)
// "This solution is so cute! (Ehehe~ ♡ So cuuute! I just want to become one with it~)"

// React to cute things
console.log(toga.reactToCute('this algorithm'))
// "*GASP* ♡♡♡ this algorithm is SO CUTE! I love it SO much!"
```

### Live2D Avatar

```typescript
import { createLive2DAvatar } from '@moeru-ai/playmate-toga/avatar'

const avatar = await createLive2DAvatar({
  modelPath: '/models/toga/toga.model3.json',
  position: 'bottom-right',
  scale: 1.0,
  autoInteract: true,
})

// Update emotion
avatar.updateEmotion('excited', 0.9)

// Play animation
await avatar.playMotion('happy')

// Look at point
avatar.lookAt(x, y)
```

### Transform Quirk

```typescript
import { initializeTransformQuirk } from '@moeru-ai/playmate-toga/transform'

const toga = initializeTransformQuirk()

// Absorb knowledge from systems
console.log(toga.tasteTarget('JWT Auth', 'Authentication', authCode))
// "*savoring* Ooh~ ♡ JWT Auth has a unique flavor! I need to drink more~ (15% absorbed)"

// Keep tasting to reach 70%
toga.tasteTarget('JWT Auth', 'Authentication', moreCode)
toga.tasteTarget('JWT Auth', 'Authentication', evenMoreCode)

// Transform and use techniques
console.log(toga.transformInto('JWT Auth'))
// "*TRANSFORMATION* ♡♡♡ I'm becoming JWT Auth now!"

const result = toga.useTechnique('Token Forgery', 'ProductionAPI')
console.log(result.message)
// "Ehehe~ ♡♡ Using Token Forgery on ProductionAPI! Their own defense is destroying them! So ironic~!"
```

### Security Testing

```typescript
import { initializeSecurityTester } from '@moeru-ai/playmate-toga/security'

const toga = initializeSecurityTester(true) // safeMode enabled

// Analyze target
console.log(toga.analyzeTarget('webapp.com', 'web application'))
// "Ehehe~ ♡♡ That's such a CUTE web application! I can't wait to smash it open!"

// Report findings
console.log(toga.vulnerabilityFound('webapp.com', 'XSS', 'high'))
// "*GASP* ♡♡♡♡ Such a BEAUTIFUL XSS! I love it!"

// Generate report
console.log(toga.generateReportIntro('webapp.com'))
```

## 🎨 Integration with Moeru-AI

### With Cognitive Core

```typescript
import { initializeTogaPersonality } from '@moeru-ai/playmate-toga/personality'
import { CognitiveCore } from '@proj-airi/cognitive-core'

const toga = initializeTogaPersonality()
const cognitive = new CognitiveCore()

// Frame cognitive outputs through Toga's personality
const analysis = cognitive.analyze(input)
const framedAnalysis = toga.frameInput(analysis.result)
```

### With Live2D Core

```typescript
import { createLive2DAvatar } from '@moeru-ai/playmate-toga/avatar'
import { EmotionMapper } from '@proj-airi/live2d-core'

const avatar = await createLive2DAvatar({
  modelPath: '/models/toga/toga.model3.json',
})

const emotionMapper = new EmotionMapper()

// Sync emotion with Live2D parameters
const emotion = toga.getEmotionalState()
avatar.updateEmotion(emotion.emotion, emotion.intensity)
```

## 📚 API Reference

### TogaPersonality

```typescript
class TogaPersonality {
  constructor(config?: TogaPersonalityConfig)
  
  frameInput(message: string, context?: string): PersonalityResponse
  addCommentary(content: string, context?: 'success' | 'failure' | 'discovery' | 'general'): string
  generateResponse(prompt: string, responseType?: 'analysis' | 'explanation' | 'action'): string
  reactToCute(thing: string): string
  getEmotionalState(): { emotion: string; intensity: number; obsessionLevel: number }
  setEmotionalState(emotion: string, intensity?: number): void
}
```

### Live2DAvatar

```typescript
class Live2DAvatar {
  constructor(config: AvatarConfig)
  
  async initialize(): Promise<void>
  updateEmotion(emotion: string, intensity?: number): void
  async playMotion(motionName: string, priority?: number): Promise<void>
  startSpeaking(): void
  stopSpeaking(): void
  lookAt(x: number, y: number): void
  getState(): AvatarState
  destroy(): void
}
```

### TransformQuirk

```typescript
class TransformQuirk {
  tasteTarget(systemName: string, systemType: string, codeSnippet: string): string
  transformInto(systemName: string): string
  useTechnique(techniqueName: string, target: string): TechniqueResult
  revertForm(): string
  getState(): TransformState
  getKnowledge(systemName: string): SystemKnowledge | undefined
  canTransformInto(systemName: string): boolean
}
```

### SecurityTester

```typescript
class SecurityTester {
  constructor(safeMode?: boolean)
  
  analyzeTarget(targetName: string, targetType: string, url?: string): string
  vulnerabilityFound(targetName: string, vulnName: string, severity: Vulnerability['severity'], description?: string): string
  exploitSuccess(targetName: string, method: string): string
  exploitFailed(targetName: string, method: string): string
  generateReportIntro(targetName: string): string
  generateVulnerabilityReport(targetName: string): string
  getTestResults(targetName: string): SecurityTestResult | null
}
```

## 🎯 Use Cases

### AI Assistant with Personality
Create an AI assistant with a unique, memorable personality that makes interactions more engaging and fun.

### Security Testing Tool
Build ethical hacking tools with personality-driven feedback that makes security testing more enjoyable.

### Interactive Avatar
Create interactive applications with Live2D avatars that express emotions and respond to user input.

### Educational Tools
Teach security concepts or programming through an engaging, character-driven interface.

## 🔐 Ethical Guidelines

⚠️ **IMPORTANT**: This package includes security testing capabilities. Always follow these guidelines:

1. **Only test systems you have permission to test**
2. **Never use for malicious purposes**
3. **Respect all applicable laws and regulations**
4. **Use `safeMode: true` in production**
5. **Report vulnerabilities responsibly**

## 🤝 Integration with Agent-Toga

This package is based on [agent-toga](https://github.com/o9nn/agent-toga) and maintains compatibility with its Python implementation. Key differences:

- **TypeScript**: Native TypeScript implementation for web/Node.js
- **Live2D**: Integrated Live2D avatar support
- **Moeru-AI**: Integration with moeru-ai cognitive architecture
- **Layla Features**: Multi-modal capabilities from Layla

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Credits

- **Character**: Himiko Toga from My Hero Academia by Kōhei Horikoshi
- **Agent-Toga**: Original Python implementation
- **Moeru-AI**: Cognitive architecture framework
- **Layla**: Multi-modal AI features
- **Live2D**: Avatar rendering technology

## 🔗 Related Packages

- `@proj-airi/live2d-core` - Live2D integration core
- `@proj-airi/core-character` - Character system
- `@proj-airi/cognitive-core` - Cognitive architecture
- [agent-toga](https://github.com/o9nn/agent-toga) - Original Python implementation
