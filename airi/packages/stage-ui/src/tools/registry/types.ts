/**
 * Tool Registry Type Definitions
 * 
 * Defines the core types for automatic tool discovery and management.
 */

import type { Tool } from '@xsai/shared-chat'

/**
 * Tool categories for organization and filtering
 */
export enum ToolCategory {
  /** Development and debugging tools */
  DEBUG = 'debug',
  /** Model Context Protocol tools */
  MCP = 'mcp',
  /** System utilities */
  SYSTEM = 'system',
  /** Audio/video/image processing tools */
  MEDIA = 'media',
  /** Memory and context management */
  MEMORY = 'memory',
  /** Cognitive processing tools */
  COGNITIVE = 'cognitive',
  /** External API integrations */
  EXTERNAL = 'external',
  /** User-defined custom tools */
  CUSTOM = 'custom',
}

/**
 * Tool capabilities for permission and feature filtering
 */
export enum ToolCapability {
  /** Can read data */
  READ = 'read',
  /** Can write or modify data */
  WRITE = 'write',
  /** Can execute actions */
  EXECUTE = 'execute',
  /** Requires network access */
  NETWORK = 'network',
  /** Requires filesystem access */
  FILESYSTEM = 'filesystem',
  /** Supports real-time streaming */
  REALTIME = 'realtime',
  /** Requires user interaction */
  INTERACTIVE = 'interactive',
  /** Can access external services */
  EXTERNAL_SERVICE = 'external_service',
}

/**
 * Platform requirements for tool availability
 */
export type ToolPlatform = 'web' | 'tauri' | 'any'

/**
 * Tool requirements specification
 */
export interface ToolRequirements {
  /** Platform where the tool can run */
  platform?: ToolPlatform
  /** Required permissions */
  permissions?: string[]
  /** Required dependencies (other tool IDs) */
  dependencies?: string[]
  /** Minimum version requirements */
  minVersions?: Record<string, string>
}

/**
 * Tool manifest - describes a tool or tool provider
 */
export interface ToolManifest {
  /** Unique identifier for the tool */
  id: string
  /** Human-readable name */
  name: string
  /** Semantic version */
  version: string
  /** Tool description */
  description: string
  /** Category for organization */
  category: ToolCategory
  /** Searchable tags */
  tags: string[]
  /** What the tool can do */
  capabilities: ToolCapability[]
  /** Runtime requirements */
  requirements?: ToolRequirements
  /** Factory function that provides the tools */
  provider: () => Promise<Tool[]>
  /** Whether the tool is enabled by default */
  enabledByDefault?: boolean
  /** Priority for loading order (higher = loaded first) */
  priority?: number
  /** Icon for UI display */
  icon?: string
  /** Documentation URL */
  docsUrl?: string
}

/**
 * Filter options for tool discovery
 */
export interface ToolFilter {
  /** Filter by categories */
  categories?: ToolCategory[]
  /** Filter by required capabilities */
  capabilities?: ToolCapability[]
  /** Filter by tags */
  tags?: string[]
  /** Filter by platform */
  platform?: ToolPlatform
  /** Tool IDs to exclude */
  exclude?: string[]
  /** Tool IDs to include (whitelist) */
  include?: string[]
  /** Only include enabled tools */
  enabledOnly?: boolean
  /** Custom filter function */
  custom?: (manifest: ToolManifest) => boolean
}

/**
 * Tool registry events
 */
export enum ToolRegistryEvent {
  /** Tool registered */
  REGISTERED = 'registered',
  /** Tool unregistered */
  UNREGISTERED = 'unregistered',
  /** Tool loaded */
  LOADED = 'loaded',
  /** Tool unloaded */
  UNLOADED = 'unloaded',
  /** Tool enabled */
  ENABLED = 'enabled',
  /** Tool disabled */
  DISABLED = 'disabled',
  /** Discovery completed */
  DISCOVERY_COMPLETE = 'discovery_complete',
  /** Error occurred */
  ERROR = 'error',
}

/**
 * Event payload for registry events
 */
export interface ToolRegistryEventPayload {
  event: ToolRegistryEvent
  toolId?: string
  manifest?: ToolManifest
  tools?: Tool[]
  error?: Error
  timestamp: number
}

/**
 * Listener for registry events
 */
export type ToolRegistryListener = (payload: ToolRegistryEventPayload) => void | Promise<void>

/**
 * Cached tool entry
 */
export interface CachedToolEntry {
  manifest: ToolManifest
  tools: Tool[] | null
  loadedAt: number | null
  enabled: boolean
}

/**
 * Registry state snapshot
 */
export interface ToolRegistryState {
  manifests: ToolManifest[]
  loadedCount: number
  enabledCount: number
  totalTools: number
  lastDiscovery: number | null
}

/**
 * Discovery source configuration
 */
export interface DiscoverySource {
  /** Source identifier */
  id: string
  /** Source type */
  type: 'static' | 'dynamic' | 'mcp' | 'remote'
  /** Source location or configuration */
  config: unknown
  /** Whether to auto-discover on startup */
  autoDiscover?: boolean
  /** Discovery interval in milliseconds (0 = one-time) */
  interval?: number
}

/**
 * Tool health status
 */
export interface ToolHealth {
  toolId: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  lastCheck: number
  latency?: number
  errorCount: number
  lastError?: Error
}
