/**
 * Debug Tools Provider
 * 
 * Development and debugging tools with automatic discovery support.
 */

import type { ToolManifest } from '../registry/types'

import { tool } from '@xsai/tool'
import { z } from 'zod'

import { ToolCapability, ToolCategory } from '../registry/types'

/**
 * Debug tool definitions
 */
const debugTools = [
  tool({
    name: 'debug_random_number',
    description: 'Generate a random number between 0 and 1',
    execute: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(Math.random().toString())
        }, 1000)
      })
    },
    parameters: z.object({}),
  }),
  tool({
    name: 'debug_echo',
    description: 'Echo back the input message for testing',
    execute: async ({ message }) => {
      return `Echo: ${message}`
    },
    parameters: z.object({
      message: z.string().describe('The message to echo back'),
    }),
  }),
  tool({
    name: 'debug_timestamp',
    description: 'Get the current timestamp in various formats',
    execute: async ({ format }) => {
      const now = new Date()
      switch (format) {
        case 'iso':
          return now.toISOString()
        case 'unix':
          return Math.floor(now.getTime() / 1000).toString()
        case 'unix_ms':
          return now.getTime().toString()
        default:
          return now.toISOString()
      }
    },
    parameters: z.object({
      format: z.enum(['iso', 'unix', 'unix_ms']).optional().describe('Timestamp format'),
    }),
  }),
  tool({
    name: 'debug_delay',
    description: 'Wait for a specified number of milliseconds',
    execute: async ({ ms }) => {
      await new Promise(resolve => setTimeout(resolve, Math.min(ms, 5000)))
      return `Waited for ${ms}ms`
    },
    parameters: z.object({
      ms: z.number().min(0).max(5000).describe('Milliseconds to wait (max 5000)'),
    }),
  }),
]

/**
 * Debug tools manifest for automatic discovery
 */
export const debugManifest: ToolManifest = {
  id: 'debug',
  name: 'Debug Tools',
  version: '1.0.0',
  description: 'Development and debugging utilities for testing tool functionality',
  category: ToolCategory.DEBUG,
  tags: ['debug', 'development', 'testing', 'utility'],
  capabilities: [ToolCapability.READ, ToolCapability.EXECUTE],
  requirements: {
    platform: 'any',
  },
  enabledByDefault: process.env.NODE_ENV === 'development',
  priority: 10,
  icon: '🔧',
  provider: async () => Promise.all(debugTools),
}

/**
 * Legacy export for backward compatibility
 */
export const debug = async () => Promise.all(debugTools)

export default debugManifest
