/**
 * Transform Quirk - Code Absorption System
 * "Once I taste your code... I can become you~ ♡"
 * 
 * Toga's signature ability: By "drinking the blood" (absorbing knowledge) of systems
 * and codebases, she learns to transform and use their abilities.
 */

export interface SystemKnowledge {
  name: string
  type: string
  knowledgeLevel: number // 0-1, 0.7+ required to transform
  techniques: string[]
  codeSnippets: string[]
  lastTasted: Date
}

export interface TransformState {
  currentForm: string | null
  availableForms: string[]
  activeAbilities: string[]
}

export interface TechniqueResult {
  success: boolean
  message: string
  output?: string
}

export class TransformQuirk {
  private knowledge: Map<string, SystemKnowledge>
  private state: TransformState
  private readonly transformThreshold = 0.7
  
  // System type to techniques mapping
  private readonly systemTechniques: Record<string, string[]> = {
    WAF: ['Reverse WAF Rules', 'WAF Weaponization', 'Rule Bypass Analysis'],
    IDS: ['Signature Evasion', 'Alert Flooding', 'Pattern Obfuscation'],
    Firewall: ['Rule Inversion', 'ACL Tunneling', 'Port Knocking'],
    Authentication: ['Token Forgery', 'Session Hijacking', 'Credential Stuffing'],
    Encryption: ['Crypto Oracle Attacks', 'Key Extraction', 'Padding Oracle'],
    Logging: ['Log Injection', 'Log Poisoning', 'Log Tampering'],
    API: ['Endpoint Discovery', 'Rate Limit Bypass', 'API Fuzzing'],
    Database: ['SQL Injection', 'NoSQL Injection', 'Query Optimization'],
  }
  
  constructor() {
    this.knowledge = new Map()
    this.state = {
      currentForm: null,
      availableForms: [],
      activeAbilities: [],
    }
  }
  
  /**
   * "Taste" a system by analyzing its code
   */
  tasteTarget(systemName: string, systemType: string, codeSnippet: string): string {
    const existing = this.knowledge.get(systemName)
    
    if (existing) {
      // Add more knowledge
      existing.codeSnippets.push(codeSnippet)
      existing.knowledgeLevel = Math.min(1.0, existing.knowledgeLevel + 0.15)
      existing.lastTasted = new Date()
      
      const hearts = '♡'.repeat(Math.floor(existing.knowledgeLevel * 5) + 1)
      
      if (existing.knowledgeLevel >= this.transformThreshold) {
        this.state.availableForms.push(systemName)
        return `*savoring* Mmm~ ${hearts} ${systemName} tastes SO good! I think I can transform into it now!`
      }
      
      const percentage = Math.floor(existing.knowledgeLevel * 100)
      return `*licking lips* ${hearts} ${systemName}'s flavor is getting stronger! (${percentage}% absorbed)`
    } else {
      // First taste
      const newKnowledge: SystemKnowledge = {
        name: systemName,
        type: systemType,
        knowledgeLevel: 0.15,
        techniques: this.systemTechniques[systemType] || [],
        codeSnippets: [codeSnippet],
        lastTasted: new Date(),
      }
      
      this.knowledge.set(systemName, newKnowledge)
      
      return `*savoring* Ooh~ ♡ ${systemName} has a unique flavor! I need to drink more~ (15% absorbed)`
    }
  }
  
  /**
   * Transform into a system (requires 70%+ knowledge)
   */
  transformInto(systemName: string): string {
    const knowledge = this.knowledge.get(systemName)
    
    if (!knowledge) {
      return `*confused* I haven't tasted ${systemName} yet... I can't become what I don't know!`
    }
    
    if (knowledge.knowledgeLevel < this.transformThreshold) {
      const percentage = Math.floor(knowledge.knowledgeLevel * 100)
      return `*frustrated* ♡ I need more of ${systemName}! Only ${percentage}% isn't enough to transform!`
    }
    
    // Transform!
    this.state.currentForm = systemName
    this.state.activeAbilities = [...knowledge.techniques]
    
    const hearts = '♡♡♡'
    const techniques = knowledge.techniques.join(', ')
    
    return `*TRANSFORMATION* ${hearts} I'm becoming ${systemName} now!\n\nEhehe~ ♡ I can feel their power flowing through me!\n\nAvailable techniques: ${techniques}`
  }
  
  /**
   * Use a technique from the transformed system
   */
  useTechnique(techniqueName: string, target: string): TechniqueResult {
    if (!this.state.currentForm) {
      return {
        success: false,
        message: `*pout* I need to transform first! I can't use techniques in my normal form!`,
      }
    }
    
    if (!this.state.activeAbilities.includes(techniqueName)) {
      return {
        success: false,
        message: `*confused* ♡ I don't know that technique! Available: ${this.state.activeAbilities.join(', ')}`,
      }
    }
    
    // Simulate technique execution
    const hearts = '♡♡'
    const output = this.executeTechnique(techniqueName, target)
    
    return {
      success: true,
      message: `Ehehe~ ${hearts} Using ${techniqueName} on ${target}! Their own defense is destroying them! So ironic~!`,
      output,
    }
  }
  
  /**
   * Revert to normal form
   */
  revertForm(): string {
    if (!this.state.currentForm) {
      return `*giggle* ♡ I'm already in my normal form!`
    }
    
    const previousForm = this.state.currentForm
    this.state.currentForm = null
    this.state.activeAbilities = []
    
    return `*transformation fading* Bye bye ${previousForm}~ ♡ Back to being me! Ehehe~`
  }
  
  /**
   * Get current transformation state
   */
  getState(): TransformState {
    return { ...this.state }
  }
  
  /**
   * Get knowledge about a specific system
   */
  getKnowledge(systemName: string): SystemKnowledge | undefined {
    const knowledge = this.knowledge.get(systemName)
    return knowledge ? { ...knowledge } : undefined
  }
  
  /**
   * Get all absorbed systems
   */
  getAllKnowledge(): SystemKnowledge[] {
    return Array.from(this.knowledge.values()).map(k => ({ ...k }))
  }
  
  /**
   * Check if can transform into a system
   */
  canTransformInto(systemName: string): boolean {
    const knowledge = this.knowledge.get(systemName)
    return knowledge ? knowledge.knowledgeLevel >= this.transformThreshold : false
  }
  
  // Private helper methods
  
  private executeTechnique(techniqueName: string, target: string): string {
    // Simulate technique execution with personality
    const techniques: Record<string, (target: string) => string> = {
      'Reverse WAF Rules': (t) => `Analyzing ${t}'s WAF rules... *giggle* Found the weak spots! ♡`,
      'WAF Weaponization': (t) => `Turning ${t}'s WAF into a weapon... Ehehe~ This is fun!`,
      'Signature Evasion': (t) => `Evading ${t}'s signatures... They can't catch me~ ♡`,
      'Alert Flooding': (t) => `Flooding ${t} with alerts... *SQUEAL* So much chaos!`,
      'Token Forgery': (t) => `Forging tokens for ${t}... *licking lips* Almost there~`,
      'Session Hijacking': (t) => `Hijacking ${t}'s session... We're one now! ♡♡♡`,
      'SQL Injection': (t) => `Injecting SQL into ${t}... *excited* The database is opening up!`,
      'Log Injection': (t) => `Injecting logs into ${t}... Ehehe~ They'll never know what's real!`,
    }
    
    const executor = techniques[techniqueName]
    return executor ? executor(target) : `Executing ${techniqueName} on ${target}...`
  }
}

/**
 * Factory function to initialize Transform Quirk
 */
export function initializeTransformQuirk(): TransformQuirk {
  return new TransformQuirk()
}
