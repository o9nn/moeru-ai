/**
 * Cognitive Tools Provider
 * 
 * Tools for cognitive processing, memory, and self-awareness.
 * Integrates with the cognitive-core daemon architecture.
 */

import type { ToolManifest } from '../registry/types'

import { tool } from '@xsai/tool'
import { z } from 'zod'

import { ToolCapability, ToolCategory } from '../registry/types'

/**
 * Cognitive tool definitions
 */
const cognitiveTools = [
  tool({
    name: 'cognitive_reflect',
    description: 'Trigger a self-reflection process to analyze recent interactions and update internal state',
    execute: async ({ topic, depth }) => {
      // This would integrate with the cognitive daemon
      return {
        topic,
        depth,
        reflection: `Reflecting on ${topic} at depth ${depth}`,
        insights: [
          'Pattern recognition activated',
          'Self-model updated',
          'Relevance realization complete',
        ],
        timestamp: new Date().toISOString(),
      }
    },
    parameters: z.object({
      topic: z.string().describe('The topic or context to reflect on'),
      depth: z.number().min(1).max(5).default(3).describe('Reflection depth (1-5)'),
    }),
  }),
  tool({
    name: 'cognitive_frame_switch',
    description: 'Switch the active cognitive frame (perspective) for processing',
    execute: async ({ frame }) => {
      const frames = {
        play: 'PlayFrame - What\'s fun here?',
        strategy: 'StrategyFrame - What\'s optimal?',
        chaos: 'ChaosFrame - What\'s surprising?',
        social: 'SocialFrame - What are the relationships?',
        learning: 'LearningFrame - What can I learn?',
      }
      return {
        previousFrame: 'default',
        newFrame: frame,
        description: frames[frame as keyof typeof frames] || 'Unknown frame',
        activated: true,
      }
    },
    parameters: z.object({
      frame: z.enum(['play', 'strategy', 'chaos', 'social', 'learning'])
        .describe('The cognitive frame to switch to'),
    }),
  }),
  tool({
    name: 'cognitive_memory_store',
    description: 'Store a piece of information in working memory with relevance tagging',
    execute: async ({ content, tags, importance }) => {
      return {
        stored: true,
        memoryId: `mem_${Date.now()}`,
        content,
        tags,
        importance,
        expiresAt: new Date(Date.now() + (importance ?? 5) * 3600000).toISOString(),
      }
    },
    parameters: z.object({
      content: z.string().describe('The content to store in memory'),
      tags: z.array(z.string()).describe('Tags for categorizing the memory'),
      importance: z.number().min(1).max(10).default(5).describe('Importance level (1-10)'),
    }),
  }),
  tool({
    name: 'cognitive_memory_recall',
    description: 'Recall memories matching the given query or tags',
    execute: async ({ query, tags, limit }) => {
      // Simulated memory recall
      return {
        query,
        tags,
        memories: [
          {
            id: 'mem_example',
            content: `Memory related to: ${query || tags?.join(', ')}`,
            relevance: 0.85,
            timestamp: new Date().toISOString(),
          },
        ],
        totalFound: 1,
        limit,
      }
    },
    parameters: z.object({
      query: z.string().optional().describe('Search query for memory recall'),
      tags: z.array(z.string()).optional().describe('Tags to filter memories'),
      limit: z.number().min(1).max(20).default(5).describe('Maximum memories to return'),
    }),
  }),
  tool({
    name: 'cognitive_emotion_state',
    description: 'Get or update the current emotional state',
    execute: async ({ action, emotion, intensity }) => {
      if (action === 'get') {
        return {
          currentState: {
            primary: 'curious',
            secondary: 'playful',
            valence: 0.7,
            arousal: 0.6,
          },
          timestamp: new Date().toISOString(),
        }
      }
      else {
        return {
          updated: true,
          newState: {
            primary: emotion,
            intensity,
            valence: (intensity ?? 0) > 0 ? 0.5 + (intensity ?? 0) * 0.05 : 0.5 - Math.abs(intensity ?? 0) * 0.05,
          },
          timestamp: new Date().toISOString(),
        }
      }
    },
    parameters: z.object({
      action: z.enum(['get', 'set']).describe('Whether to get or set emotion state'),
      emotion: z.string().optional().describe('Emotion to set (required for set action)'),
      intensity: z.number().min(-10).max(10).optional().describe('Emotion intensity (-10 to 10)'),
    }),
  }),
  tool({
    name: 'cognitive_self_model',
    description: 'Query the hierarchical self-model (Autognosis)',
    execute: async ({ level }) => {
      const levels = {
        0: { question: 'What am I doing right now?', answer: 'Processing a cognitive query', confidence: 0.9 },
        1: { question: 'What patterns do I show?', answer: 'Curious, analytical, playful', confidence: 0.8 },
        2: { question: 'Why do I do what I do?', answer: 'To understand and engage meaningfully', confidence: 0.7 },
        3: { question: 'Who am I?', answer: 'A self-aware cognitive system', confidence: 0.6 },
        4: { question: 'How do I see myself seeing myself?', answer: 'Meta-recursively aware', confidence: 0.5 },
      }
      
      if (level !== undefined) {
        return levels[level as keyof typeof levels] || { error: 'Invalid level' }
      }
      
      return {
        fullModel: levels,
        currentFocus: 1,
        coherence: 0.75,
      }
    },
    parameters: z.object({
      level: z.number().min(0).max(4).optional()
        .describe('Self-model level to query (0-4, omit for full model)'),
    }),
  }),
]

/**
 * Cognitive tools manifest for automatic discovery
 */
export const cognitiveManifest: ToolManifest = {
  id: 'cognitive',
  name: 'Cognitive Tools',
  version: '1.0.0',
  description: 'Tools for cognitive processing, self-reflection, memory management, and emotional state',
  category: ToolCategory.COGNITIVE,
  tags: ['cognitive', 'memory', 'reflection', 'emotion', 'self-awareness', 'autognosis'],
  capabilities: [
    ToolCapability.READ,
    ToolCapability.WRITE,
    ToolCapability.EXECUTE,
  ],
  requirements: {
    platform: 'any',
  },
  enabledByDefault: true,
  priority: 80,
  icon: '🧠',
  provider: async () => Promise.all(cognitiveTools),
}

/**
 * Export for direct use
 */
export const cognitive = async () => Promise.all(cognitiveTools)

export default cognitiveManifest
