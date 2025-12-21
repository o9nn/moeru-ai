/**
 * Live2D Avatar Integration for Toga
 * Integrates with @proj-airi/live2d-core and Layla features
 */

import type { Application } from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'

export interface AvatarConfig {
  modelPath: string
  canvasElement?: HTMLCanvasElement
  width?: number
  height?: number
  position?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  scale?: number
  autoInteract?: boolean
}

export interface EmotionMapping {
  emotion: string
  parameters: Record<string, number>
  motion?: string
}

export interface AvatarState {
  currentEmotion: string
  intensity: number
  isAnimating: boolean
  isSpeaking: boolean
}

export class Live2DAvatar {
  private app: Application | null = null
  private model: Live2DModel | null = null
  private config: Required<AvatarConfig>
  private state: AvatarState
  private emotionMappings: Map<string, EmotionMapping>
  
  constructor(config: AvatarConfig) {
    this.config = {
      modelPath: config.modelPath,
      canvasElement: config.canvasElement,
      width: config.width ?? 800,
      height: config.height ?? 600,
      position: config.position ?? 'bottom-right',
      scale: config.scale ?? 1.0,
      autoInteract: config.autoInteract ?? true,
    }
    
    this.state = {
      currentEmotion: 'cheerful',
      intensity: 0.8,
      isAnimating: false,
      isSpeaking: false,
    }
    
    this.emotionMappings = this.initializeEmotionMappings()
  }
  
  /**
   * Initialize the Live2D model and renderer
   */
  async initialize(): Promise<void> {
    try {
      // Initialize PixiJS application
      const { Application } = await import('pixi.js')
      
      this.app = new Application()
      await this.app.init({
        width: this.config.width,
        height: this.config.height,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
      })
      
      // Append canvas to DOM
      if (this.config.canvasElement) {
        this.config.canvasElement.appendChild(this.app.canvas as HTMLCanvasElement)
      }
      
      // Load Live2D model
      this.model = await Live2DModel.from(this.config.modelPath)
      
      if (this.model) {
        // Scale and position the model
        this.model.scale.set(this.config.scale)
        this.positionModel()
        
        // Add model to stage
        this.app.stage.addChild(this.model)
        
        // Enable auto interaction if configured
        if (this.config.autoInteract) {
          this.enableAutoInteraction()
        }
        
        console.log('Live2D Avatar initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize Live2D Avatar:', error)
      throw error
    }
  }
  
  /**
   * Update avatar emotion
   */
  updateEmotion(emotion: string, intensity: number = 0.8): void {
    if (!this.model) {
      console.warn('Model not initialized')
      return
    }
    
    const mapping = this.emotionMappings.get(emotion)
    if (!mapping) {
      console.warn(`Unknown emotion: ${emotion}`)
      return
    }
    
    this.state.currentEmotion = emotion
    this.state.intensity = intensity
    
    // Apply parameter changes
    Object.entries(mapping.parameters).forEach(([param, value]) => {
      const adjustedValue = value * intensity
      this.model?.internalModel.coreModel.setParameterValueById(param, adjustedValue)
    })
    
    // Play motion if specified
    if (mapping.motion) {
      this.playMotion(mapping.motion)
    }
  }
  
  /**
   * Play a specific motion/animation
   */
  async playMotion(motionName: string, priority: number = 2): Promise<void> {
    if (!this.model) {
      console.warn('Model not initialized')
      return
    }
    
    try {
      this.state.isAnimating = true
      await this.model.motion(motionName, priority)
      this.state.isAnimating = false
    } catch (error) {
      console.error(`Failed to play motion: ${motionName}`, error)
      this.state.isAnimating = false
    }
  }
  
  /**
   * Start lip sync animation
   */
  startSpeaking(): void {
    if (!this.model) return
    
    this.state.isSpeaking = true
    // Implement lip sync logic here
    // This would typically be driven by audio analysis
  }
  
  /**
   * Stop lip sync animation
   */
  stopSpeaking(): void {
    if (!this.model) return
    
    this.state.isSpeaking = false
  }
  
  /**
   * Look at a specific point
   */
  lookAt(x: number, y: number): void {
    if (!this.model) return
    
    // Convert screen coordinates to model space
    const modelX = (x / this.config.width) * 2 - 1
    const modelY = -((y / this.config.height) * 2 - 1)
    
    // Update eye parameters
    this.model.internalModel.coreModel.setParameterValueById('ParamEyeBallX', modelX)
    this.model.internalModel.coreModel.setParameterValueById('ParamEyeBallY', modelY)
  }
  
  /**
   * Get current avatar state
   */
  getState(): AvatarState {
    return { ...this.state }
  }
  
  /**
   * Destroy the avatar and clean up resources
   */
  destroy(): void {
    if (this.model) {
      this.model.destroy()
      this.model = null
    }
    
    if (this.app) {
      this.app.destroy(true, { children: true })
      this.app = null
    }
  }
  
  // Private helper methods
  
  private initializeEmotionMappings(): Map<string, EmotionMapping> {
    const mappings = new Map<string, EmotionMapping>()
    
    // Cheerful (default)
    mappings.set('cheerful', {
      emotion: 'cheerful',
      parameters: {
        ParamMouthForm: 0.5,
        ParamEyeSmile: 0.3,
        ParamBrowLY: 0.2,
        ParamBrowRY: 0.2,
      },
      motion: 'idle',
    })
    
    // Excited
    mappings.set('excited', {
      emotion: 'excited',
      parameters: {
        ParamMouthForm: 1.0,
        ParamEyeSmile: 0.8,
        ParamBrowLY: 0.5,
        ParamBrowRY: 0.5,
        ParamBodyAngleX: 5,
      },
      motion: 'excited',
    })
    
    // Obsessed
    mappings.set('obsessed', {
      emotion: 'obsessed',
      parameters: {
        ParamMouthForm: 0.8,
        ParamEyeSmile: 0.6,
        ParamBrowLY: 0.4,
        ParamBrowRY: 0.4,
        ParamEyeLOpen: 1.2,
        ParamEyeROpen: 1.2,
      },
      motion: 'love',
    })
    
    // Curious
    mappings.set('curious', {
      emotion: 'curious',
      parameters: {
        ParamMouthForm: 0.2,
        ParamEyeSmile: 0.0,
        ParamBrowLY: 0.3,
        ParamBrowRY: 0.3,
        ParamBodyAngleZ: 10,
      },
      motion: 'think',
    })
    
    // Playful
    mappings.set('playful', {
      emotion: 'playful',
      parameters: {
        ParamMouthForm: 0.7,
        ParamEyeSmile: 0.5,
        ParamBrowLY: 0.2,
        ParamBrowRY: 0.2,
      },
      motion: 'playful',
    })
    
    // Sad (for contrast)
    mappings.set('sad', {
      emotion: 'sad',
      parameters: {
        ParamMouthForm: -0.5,
        ParamEyeSmile: -0.3,
        ParamBrowLY: -0.4,
        ParamBrowRY: -0.4,
      },
      motion: 'sad',
    })
    
    return mappings
  }
  
  private positionModel(): void {
    if (!this.model) return
    
    const { width, height } = this.config
    
    switch (this.config.position) {
      case 'center':
        this.model.x = width / 2
        this.model.y = height / 2
        break
      
      case 'bottom-right':
        this.model.x = width - (this.model.width / 2)
        this.model.y = height - (this.model.height / 2)
        break
      
      case 'bottom-left':
        this.model.x = this.model.width / 2
        this.model.y = height - (this.model.height / 2)
        break
      
      case 'top-right':
        this.model.x = width - (this.model.width / 2)
        this.model.y = this.model.height / 2
        break
      
      case 'top-left':
        this.model.x = this.model.width / 2
        this.model.y = this.model.height / 2
        break
    }
  }
  
  private enableAutoInteraction(): void {
    if (!this.model || !this.app) return
    
    // Add mouse/touch interaction
    this.app.canvas.addEventListener('mousemove', (event) => {
      const rect = (this.app!.canvas as HTMLCanvasElement).getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      this.lookAt(x, y)
    })
    
    // Add tap/click interaction
    this.app.canvas.addEventListener('click', () => {
      const motions = ['tap_head', 'tap_body', 'shake']
      const randomMotion = motions[Math.floor(Math.random() * motions.length)]
      this.playMotion(randomMotion, 3)
    })
  }
}

/**
 * Factory function to create and initialize Live2D avatar
 */
export async function createLive2DAvatar(config: AvatarConfig): Promise<Live2DAvatar> {
  const avatar = new Live2DAvatar(config)
  await avatar.initialize()
  return avatar
}
