/**
 * Tool Registry Implementation
 * 
 * Provides automatic tool discovery, registration, and management.
 * Implements the TODO from llm.ts:55 - "we need Automatic tools discovery"
 */

import type { Tool } from '@xsai/shared-chat'
import type {
  CachedToolEntry,
  ToolFilter,
  ToolManifest,
  ToolRegistryEventPayload,
  ToolRegistryListener,
  ToolRegistryState,
} from './types'

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import {
  ToolCapability,
  ToolCategory,
  ToolRegistryEvent,
} from './types'

/**
 * Check if running in Tauri environment
 */
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Get current platform
 */
function getCurrentPlatform(): 'web' | 'tauri' {
  return isTauriEnvironment() ? 'tauri' : 'web'
}

/**
 * Tool Registry Store
 * 
 * Manages tool manifests, loading, and discovery.
 */
export const useToolRegistry = defineStore('tool-registry', () => {
  // State
  const manifests = ref<Map<string, CachedToolEntry>>(new Map())
  const listeners = shallowRef<Map<ToolRegistryEvent, Set<ToolRegistryListener>>>(new Map())
  const lastDiscovery = ref<number | null>(null)
  const isDiscovering = ref(false)
  
  // Computed
  const registeredCount = computed(() => manifests.value.size)
  const enabledCount = computed(() => 
    Array.from(manifests.value.values()).filter(e => e.enabled).length
  )
  const loadedCount = computed(() => 
    Array.from(manifests.value.values()).filter(e => e.tools !== null).length
  )
  
  /**
   * Emit an event to all listeners
   */
  function emit(event: ToolRegistryEvent, payload: Partial<ToolRegistryEventPayload>) {
    const eventListeners = listeners.value.get(event)
    if (!eventListeners) return
    
    const fullPayload: ToolRegistryEventPayload = {
      event,
      timestamp: Date.now(),
      ...payload,
    }
    
    for (const listener of eventListeners) {
      try {
        void listener(fullPayload)
      }
      catch (err) {
        console.error(`[ToolRegistry] Error in event listener for ${event}:`, err)
      }
    }
  }
  
  /**
   * Register an event listener
   */
  function on(event: ToolRegistryEvent, listener: ToolRegistryListener): () => void {
    if (!listeners.value.has(event)) {
      listeners.value.set(event, new Set())
    }
    listeners.value.get(event)!.add(listener)
    
    // Return unsubscribe function
    return () => off(event, listener)
  }
  
  /**
   * Remove an event listener
   */
  function off(event: ToolRegistryEvent, listener: ToolRegistryListener): void {
    const eventListeners = listeners.value.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
    }
  }
  
  /**
   * Register a tool manifest
   */
  function register(manifest: ToolManifest): void {
    // Validate manifest
    if (!manifest.id || !manifest.name || !manifest.provider) {
      throw new Error(`Invalid tool manifest: missing required fields`)
    }
    
    // Check for duplicate
    if (manifests.value.has(manifest.id)) {
      console.warn(`[ToolRegistry] Tool ${manifest.id} already registered, updating...`)
    }
    
    // Check platform requirements
    const currentPlatform = getCurrentPlatform()
    const platformOk = !manifest.requirements?.platform || 
      manifest.requirements.platform === 'any' ||
      manifest.requirements.platform === currentPlatform
    
    if (!platformOk) {
      console.warn(`[ToolRegistry] Tool ${manifest.id} not available on ${currentPlatform}`)
      return
    }
    
    // Store manifest
    manifests.value.set(manifest.id, {
      manifest,
      tools: null,
      loadedAt: null,
      enabled: manifest.enabledByDefault ?? true,
    })
    
    emit(ToolRegistryEvent.REGISTERED, { toolId: manifest.id, manifest })
  }
  
  /**
   * Unregister a tool
   */
  function unregister(id: string): void {
    const entry = manifests.value.get(id)
    if (!entry) {
      console.warn(`[ToolRegistry] Tool ${id} not found`)
      return
    }
    
    manifests.value.delete(id)
    emit(ToolRegistryEvent.UNREGISTERED, { toolId: id, manifest: entry.manifest })
  }
  
  /**
   * Enable a tool
   */
  function enable(id: string): void {
    const entry = manifests.value.get(id)
    if (!entry) {
      console.warn(`[ToolRegistry] Tool ${id} not found`)
      return
    }
    
    entry.enabled = true
    emit(ToolRegistryEvent.ENABLED, { toolId: id, manifest: entry.manifest })
  }
  
  /**
   * Disable a tool
   */
  function disable(id: string): void {
    const entry = manifests.value.get(id)
    if (!entry) {
      console.warn(`[ToolRegistry] Tool ${id} not found`)
      return
    }
    
    entry.enabled = false
    emit(ToolRegistryEvent.DISABLED, { toolId: id, manifest: entry.manifest })
  }
  
  /**
   * Load tools from a manifest
   */
  async function load(id: string): Promise<Tool[]> {
    const entry = manifests.value.get(id)
    if (!entry) {
      throw new Error(`Tool ${id} not found`)
    }
    
    // Return cached if already loaded
    if (entry.tools !== null) {
      return entry.tools
    }
    
    try {
      const tools = await entry.manifest.provider()
      entry.tools = tools
      entry.loadedAt = Date.now()
      
      emit(ToolRegistryEvent.LOADED, { toolId: id, manifest: entry.manifest, tools })
      
      return tools
    }
    catch (err) {
      emit(ToolRegistryEvent.ERROR, { 
        toolId: id, 
        manifest: entry.manifest, 
        error: err instanceof Error ? err : new Error(String(err)),
      })
      throw err
    }
  }
  
  /**
   * Unload tools from cache
   */
  function unload(id: string): void {
    const entry = manifests.value.get(id)
    if (!entry) return
    
    entry.tools = null
    entry.loadedAt = null
    
    emit(ToolRegistryEvent.UNLOADED, { toolId: id, manifest: entry.manifest })
  }
  
  /**
   * Get all registered manifests
   */
  function getManifests(): ToolManifest[] {
    return Array.from(manifests.value.values()).map(e => e.manifest)
  }
  
  /**
   * Get manifest by ID
   */
  function getManifest(id: string): ToolManifest | undefined {
    return manifests.value.get(id)?.manifest
  }
  
  /**
   * Check if a manifest matches a filter
   */
  function matchesFilter(manifest: ToolManifest, filter: ToolFilter): boolean {
    // Check categories
    if (filter.categories?.length) {
      if (!filter.categories.includes(manifest.category)) {
        return false
      }
    }
    
    // Check capabilities
    if (filter.capabilities?.length) {
      const hasAllCapabilities = filter.capabilities.every(
        cap => manifest.capabilities.includes(cap)
      )
      if (!hasAllCapabilities) {
        return false
      }
    }
    
    // Check tags
    if (filter.tags?.length) {
      const hasAnyTag = filter.tags.some(tag => manifest.tags.includes(tag))
      if (!hasAnyTag) {
        return false
      }
    }
    
    // Check platform
    if (filter.platform) {
      const platformOk = !manifest.requirements?.platform ||
        manifest.requirements.platform === 'any' ||
        manifest.requirements.platform === filter.platform
      if (!platformOk) {
        return false
      }
    }
    
    // Check exclude list
    if (filter.exclude?.includes(manifest.id)) {
      return false
    }
    
    // Check include list (whitelist)
    if (filter.include?.length && !filter.include.includes(manifest.id)) {
      return false
    }
    
    // Check custom filter
    if (filter.custom && !filter.custom(manifest)) {
      return false
    }
    
    return true
  }
  
  /**
   * Discover manifests by filter
   */
  function discover(filter?: ToolFilter): ToolManifest[] {
    let results = Array.from(manifests.value.entries())
    
    // Filter by enabled status
    if (filter?.enabledOnly) {
      results = results.filter(([_, entry]) => entry.enabled)
    }
    
    // Apply manifest filter
    if (filter) {
      results = results.filter(([_, entry]) => matchesFilter(entry.manifest, filter))
    }
    
    // Sort by priority
    results.sort((a, b) => (b[1].manifest.priority ?? 0) - (a[1].manifest.priority ?? 0))
    
    return results.map(([_, entry]) => entry.manifest)
  }
  
  /**
   * Discover by category
   */
  function discoverByCategory(category: ToolCategory): ToolManifest[] {
    return discover({ categories: [category] })
  }
  
  /**
   * Discover by capability
   */
  function discoverByCapability(capability: ToolCapability): ToolManifest[] {
    return discover({ capabilities: [capability] })
  }
  
  /**
   * Discover by tag
   */
  function discoverByTag(tag: string): ToolManifest[] {
    return discover({ tags: [tag] })
  }
  
  /**
   * Load all registered and enabled tools
   */
  async function loadAll(): Promise<Tool[]> {
    const enabledManifests = discover({ enabledOnly: true })
    const allTools: Tool[] = []
    
    for (const manifest of enabledManifests) {
      try {
        const tools = await load(manifest.id)
        allTools.push(...tools)
      }
      catch (err) {
        console.error(`[ToolRegistry] Failed to load tool ${manifest.id}:`, err)
      }
    }
    
    return allTools
  }
  
  /**
   * Load tools matching a filter
   */
  async function loadByFilter(filter: ToolFilter): Promise<Tool[]> {
    const matchingManifests = discover({ ...filter, enabledOnly: true })
    const allTools: Tool[] = []
    
    for (const manifest of matchingManifests) {
      try {
        const tools = await load(manifest.id)
        allTools.push(...tools)
      }
      catch (err) {
        console.error(`[ToolRegistry] Failed to load tool ${manifest.id}:`, err)
      }
    }
    
    return allTools
  }
  
  /**
   * Get registry state snapshot
   */
  function getState(): ToolRegistryState {
    const entries = Array.from(manifests.value.values())
    const totalTools = entries.reduce((sum, e) => sum + (e.tools?.length ?? 0), 0)
    
    return {
      manifests: entries.map(e => e.manifest),
      loadedCount: loadedCount.value,
      enabledCount: enabledCount.value,
      totalTools,
      lastDiscovery: lastDiscovery.value,
    }
  }
  
  /**
   * Clear all registered tools
   */
  function clear(): void {
    manifests.value.clear()
    lastDiscovery.value = null
  }
  
  /**
   * Run discovery from all sources
   */
  async function runDiscovery(): Promise<void> {
    if (isDiscovering.value) {
      console.warn('[ToolRegistry] Discovery already in progress')
      return
    }
    
    isDiscovering.value = true
    
    try {
      // Discovery will be handled by individual providers registering themselves
      // This is a hook for external discovery mechanisms
      lastDiscovery.value = Date.now()
      emit(ToolRegistryEvent.DISCOVERY_COMPLETE, {})
    }
    finally {
      isDiscovering.value = false
    }
  }
  
  return {
    // State
    registeredCount,
    enabledCount,
    loadedCount,
    isDiscovering,
    
    // Registration
    register,
    unregister,
    enable,
    disable,
    
    // Loading
    load,
    unload,
    loadAll,
    loadByFilter,
    
    // Discovery
    discover,
    discoverByCategory,
    discoverByCapability,
    discoverByTag,
    runDiscovery,
    
    // Getters
    getManifests,
    getManifest,
    getState,
    
    // Events
    on,
    off,
    
    // Utilities
    clear,
    matchesFilter,
  }
})

export type ToolRegistryStore = ReturnType<typeof useToolRegistry>
