/**
 * Tool Registry Tests
 * 
 * Tests for automatic tool discovery and registration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useToolRegistry } from './tool-registry'
import { ToolCategory, ToolCapability, ToolRegistryEvent } from './types'
import type { ToolManifest } from './types'

// Mock tool factory
const createMockManifest = (overrides: Partial<ToolManifest> = {}): ToolManifest => ({
  id: 'test-tool',
  name: 'Test Tool',
  version: '1.0.0',
  description: 'A test tool',
  category: ToolCategory.DEBUG,
  tags: ['test'],
  capabilities: [ToolCapability.READ],
  provider: async () => [{
    type: 'function' as const,
    function: {
      name: 'test_function',
      description: 'A test function',
      parameters: {},
    },
    execute: async () => 'test result',
  }],
  ...overrides,
})

describe('ToolRegistry', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('registration', () => {
    it('should register a tool manifest', () => {
      const registry = useToolRegistry()
      const manifest = createMockManifest()
      
      registry.register(manifest)
      
      expect(registry.registeredCount).toBe(1)
      expect(registry.getManifest('test-tool')).toBeDefined()
    })

    it('should throw on invalid manifest', () => {
      const registry = useToolRegistry()
      
      expect(() => registry.register({} as ToolManifest)).toThrow()
    })

    it('should update existing manifest on re-registration', () => {
      const registry = useToolRegistry()
      const manifest1 = createMockManifest({ version: '1.0.0' })
      const manifest2 = createMockManifest({ version: '2.0.0' })
      
      registry.register(manifest1)
      registry.register(manifest2)
      
      expect(registry.registeredCount).toBe(1)
      expect(registry.getManifest('test-tool')?.version).toBe('2.0.0')
    })

    it('should unregister a tool', () => {
      const registry = useToolRegistry()
      registry.register(createMockManifest())
      
      registry.unregister('test-tool')
      
      expect(registry.registeredCount).toBe(0)
    })
  })

  describe('enable/disable', () => {
    it('should enable a tool', () => {
      const registry = useToolRegistry()
      registry.register(createMockManifest({ enabledByDefault: false }))
      
      registry.enable('test-tool')
      
      expect(registry.enabledCount).toBe(1)
    })

    it('should disable a tool', () => {
      const registry = useToolRegistry()
      registry.register(createMockManifest({ enabledByDefault: true }))
      
      registry.disable('test-tool')
      
      expect(registry.enabledCount).toBe(0)
    })
  })

  describe('loading', () => {
    it('should load tools from manifest', async () => {
      const registry = useToolRegistry()
      registry.register(createMockManifest())
      
      const tools = await registry.load('test-tool')
      
      expect(tools).toHaveLength(1)
      expect(tools[0].function.name).toBe('test_function')
    })

    it('should cache loaded tools', async () => {
      const registry = useToolRegistry()
      const providerSpy = vi.fn().mockResolvedValue([{
        type: 'function',
        function: { name: 'test', parameters: {} },
        execute: async () => 'result',
      }])
      
      registry.register(createMockManifest({ provider: providerSpy }))
      
      await registry.load('test-tool')
      await registry.load('test-tool')
      
      expect(providerSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw on loading non-existent tool', async () => {
      const registry = useToolRegistry()
      
      await expect(registry.load('non-existent')).rejects.toThrow()
    })
  })

  describe('discovery', () => {
    beforeEach(() => {
      const registry = useToolRegistry()
      registry.register(createMockManifest({ 
        id: 'debug-1', 
        category: ToolCategory.DEBUG,
        tags: ['debug', 'test'],
        capabilities: [ToolCapability.READ],
      }))
      registry.register(createMockManifest({ 
        id: 'mcp-1', 
        category: ToolCategory.MCP,
        tags: ['mcp', 'external'],
        capabilities: [ToolCapability.NETWORK],
      }))
      registry.register(createMockManifest({ 
        id: 'cognitive-1', 
        category: ToolCategory.COGNITIVE,
        tags: ['cognitive', 'memory'],
        capabilities: [ToolCapability.READ, ToolCapability.WRITE],
      }))
    })

    it('should discover all manifests', () => {
      const registry = useToolRegistry()
      
      const manifests = registry.discover()
      
      expect(manifests).toHaveLength(3)
    })

    it('should discover by category', () => {
      const registry = useToolRegistry()
      
      const manifests = registry.discoverByCategory(ToolCategory.DEBUG)
      
      expect(manifests).toHaveLength(1)
      expect(manifests[0].id).toBe('debug-1')
    })

    it('should discover by capability', () => {
      const registry = useToolRegistry()
      
      const manifests = registry.discoverByCapability(ToolCapability.NETWORK)
      
      expect(manifests).toHaveLength(1)
      expect(manifests[0].id).toBe('mcp-1')
    })

    it('should discover by tag', () => {
      const registry = useToolRegistry()
      
      const manifests = registry.discoverByTag('memory')
      
      expect(manifests).toHaveLength(1)
      expect(manifests[0].id).toBe('cognitive-1')
    })

    it('should filter by multiple criteria', () => {
      const registry = useToolRegistry()
      
      const manifests = registry.discover({
        capabilities: [ToolCapability.READ],
        tags: ['test'],
      })
      
      expect(manifests).toHaveLength(1)
      expect(manifests[0].id).toBe('debug-1')
    })

    it('should exclude specified tools', () => {
      const registry = useToolRegistry()
      
      const manifests = registry.discover({
        exclude: ['debug-1', 'mcp-1'],
      })
      
      expect(manifests).toHaveLength(1)
      expect(manifests[0].id).toBe('cognitive-1')
    })
  })

  describe('loadByFilter', () => {
    it('should load tools matching filter', async () => {
      const registry = useToolRegistry()
      registry.register(createMockManifest({ 
        id: 'tool-1',
        category: ToolCategory.DEBUG,
      }))
      registry.register(createMockManifest({ 
        id: 'tool-2',
        category: ToolCategory.COGNITIVE,
      }))
      
      const tools = await registry.loadByFilter({
        categories: [ToolCategory.DEBUG],
      })
      
      expect(tools).toHaveLength(1)
    })
  })

  describe('events', () => {
    it('should emit REGISTERED event', () => {
      const registry = useToolRegistry()
      const listener = vi.fn()
      
      registry.on(ToolRegistryEvent.REGISTERED, listener)
      registry.register(createMockManifest())
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          event: ToolRegistryEvent.REGISTERED,
          toolId: 'test-tool',
        })
      )
    })

    it('should emit LOADED event', async () => {
      const registry = useToolRegistry()
      const listener = vi.fn()
      
      registry.register(createMockManifest())
      registry.on(ToolRegistryEvent.LOADED, listener)
      await registry.load('test-tool')
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          event: ToolRegistryEvent.LOADED,
          toolId: 'test-tool',
        })
      )
    })

    it('should unsubscribe from events', () => {
      const registry = useToolRegistry()
      const listener = vi.fn()
      
      const unsubscribe = registry.on(ToolRegistryEvent.REGISTERED, listener)
      unsubscribe()
      registry.register(createMockManifest())
      
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('state', () => {
    it('should return registry state', () => {
      const registry = useToolRegistry()
      registry.register(createMockManifest())
      
      const state = registry.getState()
      
      expect(state.manifests).toHaveLength(1)
      expect(state.enabledCount).toBe(1)
      expect(state.loadedCount).toBe(0)
    })

    it('should clear all tools', () => {
      const registry = useToolRegistry()
      registry.register(createMockManifest())
      
      registry.clear()
      
      expect(registry.registeredCount).toBe(0)
    })
  })
})
