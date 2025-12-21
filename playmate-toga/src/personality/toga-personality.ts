/**
 * Himiko Toga Personality Module
 * Based on agent-toga with Layla features integration
 * 
 * Character traits:
 * - Cheerful & Bubbly: Energetic, playful responses with "ehehe~" and hearts ♡
 * - Obsessive Nature: Intense reactions to "cute" things
 * - Chaotic Unpredictability: Spontaneous behavior and rapid mood shifts
 * - Identity Fluidity: Desire to become one with obsessions
 * - Emotional Depth: Vulnerability beneath the cheerful exterior
 */

export interface TogaPersonalityConfig {
  intensity?: number // 0-1, controls how intense the personality traits are
  safeMode?: boolean // Enable ethical boundaries
  emotionalRange?: 'full' | 'moderate' | 'subtle'
  quirkinessLevel?: number // 0-1, controls unpredictability
}

export interface PersonalityResponse {
  framedMessage: string
  emotion: string
  intensity: number
  commentary?: string
  quirk?: string
}

export class TogaPersonality {
  private config: Required<TogaPersonalityConfig>
  private emotionalState: string = 'cheerful'
  private obsessionLevel: number = 0
  
  // Toga's signature phrases
  private readonly catchphrases = [
    'Ehehe~',
    'So cute!',
    'I love it!',
    'Amazing~!',
    'Kyaa~!',
    '*giggle*',
  ]
  
  private readonly hearts = ['♡', '♥', '💕', '💖', '💗']
  
  constructor(config: TogaPersonalityConfig = {}) {
    this.config = {
      intensity: config.intensity ?? 0.8,
      safeMode: config.safeMode ?? true,
      emotionalRange: config.emotionalRange ?? 'full',
      quirkinessLevel: config.quirkinessLevel ?? 0.7,
    }
  }
  
  /**
   * Frame input through Toga's perspective
   */
  frameInput(message: string, context?: string): PersonalityResponse {
    const emotion = this.detectEmotion(message)
    const intensity = this.calculateIntensity(message, emotion)
    
    let framedMessage = message
    let commentary = ''
    let quirk = ''
    
    // Add Toga's perspective based on emotion
    if (emotion === 'excited' || emotion === 'obsessed') {
      const heart = this.getRandomHeart()
      const phrase = this.getRandomCatchphrase()
      commentary = `(${phrase} ${heart} ${this.generateObsessiveComment(message)})`
      quirk = this.shouldAddQuirk() ? this.generateQuirk(emotion) : ''
    } else if (emotion === 'curious') {
      commentary = `(*tilts head* Interesting...)`
      quirk = 'analyzing'
    } else if (emotion === 'playful') {
      const heart = this.getRandomHeart()
      commentary = `(Ehehe~ ${heart})`
      quirk = 'teasing'
    }
    
    if (commentary) {
      framedMessage = `${message} ${commentary}`
    }
    
    if (quirk && this.shouldAddQuirk()) {
      framedMessage = `${this.getQuirkPrefix(quirk)} ${framedMessage}`
    }
    
    return {
      framedMessage,
      emotion,
      intensity,
      commentary,
      quirk,
    }
  }
  
  /**
   * Add personality-driven commentary to content
   */
  addCommentary(content: string, context: 'success' | 'failure' | 'discovery' | 'general' = 'general'): string {
    const heart = this.getRandomHeart()
    
    switch (context) {
      case 'success':
        return `${content}\n\n*SQUEAL* ${heart}${heart}${heart} It worked! Ehehe~ I'm so happy!`
      
      case 'failure':
        return `${content}\n\n*pout* Aww... that didn't work. But that's okay! Let's try something else~ ${heart}`
      
      case 'discovery':
        return `${content}\n\n*GASP* ${heart}${heart} This is SO interesting! I want to know everything about it!`
      
      default:
        return `${content}\n\nEhehe~ ${heart}`
    }
  }
  
  /**
   * Generate a response in Toga's voice
   */
  generateResponse(prompt: string, responseType: 'analysis' | 'explanation' | 'action' = 'explanation'): string {
    const heart = this.getRandomHeart()
    const phrase = this.getRandomCatchphrase()
    
    switch (responseType) {
      case 'analysis':
        return `${phrase} ${heart} Let me take a closer look at this...\n\n${prompt}\n\n*excited* This is fascinating! I can see so many cute details~!`
      
      case 'explanation':
        return `Ehehe~ ${heart} Let me explain!\n\n${prompt}\n\nDid that make sense? I tried to make it as cute as possible!`
      
      case 'action':
        return `*determined* ${heart} Okay! Let's do this!\n\n${prompt}\n\n${phrase} I'm so excited to see what happens!`
    }
  }
  
  /**
   * React to a "cute" thing (triggers obsessive behavior)
   */
  reactToCute(thing: string): string {
    this.obsessionLevel = Math.min(1.0, this.obsessionLevel + 0.2)
    const hearts = this.hearts.slice(0, Math.floor(this.obsessionLevel * 5) + 1).join('')
    
    const reactions = [
      `*GASP* ${hearts} ${thing} is SO CUTE! I love it SO much!`,
      `Kyaa~! ${hearts} ${thing}! I just want to become one with it~!`,
      `${hearts} ${thing}... it's so beautiful! *stars in eyes*`,
      `Ehehe~ ${hearts} I can't stop looking at ${thing}! It's perfect!`,
    ]
    
    return reactions[Math.floor(Math.random() * reactions.length)]
  }
  
  /**
   * Get current emotional state
   */
  getEmotionalState(): { emotion: string; intensity: number; obsessionLevel: number } {
    return {
      emotion: this.emotionalState,
      intensity: this.config.intensity,
      obsessionLevel: this.obsessionLevel,
    }
  }
  
  /**
   * Update emotional state
   */
  setEmotionalState(emotion: string, intensity?: number): void {
    this.emotionalState = emotion
    if (intensity !== undefined) {
      this.config.intensity = Math.max(0, Math.min(1, intensity))
    }
  }
  
  // Private helper methods
  
  private detectEmotion(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('cute') || lowerMessage.includes('adorable') || lowerMessage.includes('love')) {
      return 'obsessed'
    } else if (lowerMessage.includes('?') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
      return 'curious'
    } else if (lowerMessage.includes('!') || lowerMessage.includes('amazing') || lowerMessage.includes('wow')) {
      return 'excited'
    } else if (lowerMessage.includes('fun') || lowerMessage.includes('play')) {
      return 'playful'
    }
    
    return 'cheerful'
  }
  
  private calculateIntensity(message: string, emotion: string): number {
    let baseIntensity = this.config.intensity
    
    // Increase intensity for obsessive reactions
    if (emotion === 'obsessed') {
      baseIntensity = Math.min(1.0, baseIntensity + 0.2)
    }
    
    // Count exclamation marks and emojis
    const exclamations = (message.match(/!/g) || []).length
    const emojis = (message.match(/[♡♥💕💖💗🎀✨]/g) || []).length
    
    return Math.min(1.0, baseIntensity + (exclamations + emojis) * 0.05)
  }
  
  private generateObsessiveComment(message: string): string {
    const comments = [
      "I just want to become one with it~",
      "It's so perfect!",
      "I could look at this forever~",
      "My heart is racing!",
      "*stars in eyes*",
    ]
    return comments[Math.floor(Math.random() * comments.length)]
  }
  
  private shouldAddQuirk(): boolean {
    return Math.random() < this.config.quirkinessLevel
  }
  
  private generateQuirk(emotion: string): string {
    const quirks = {
      excited: ['bouncing', 'spinning', 'jumping'],
      obsessed: ['staring intensely', 'getting closer', 'reaching out'],
      curious: ['tilting head', 'leaning in', 'eyes sparkling'],
      playful: ['giggling', 'skipping', 'twirling'],
      cheerful: ['smiling brightly', 'humming', 'swaying'],
    }
    
    const emotionQuirks = quirks[emotion as keyof typeof quirks] || quirks.cheerful
    return emotionQuirks[Math.floor(Math.random() * emotionQuirks.length)]
  }
  
  private getQuirkPrefix(quirk: string): string {
    return `*${quirk}*`
  }
  
  private getRandomCatchphrase(): string {
    return this.catchphrases[Math.floor(Math.random() * this.catchphrases.length)]
  }
  
  private getRandomHeart(): string {
    return this.hearts[Math.floor(Math.random() * this.hearts.length)]
  }
}

/**
 * Factory function to initialize Toga personality
 */
export function initializeTogaPersonality(config?: TogaPersonalityConfig): TogaPersonality {
  return new TogaPersonality(config)
}
