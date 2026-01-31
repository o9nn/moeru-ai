/**
 * Tools Module
 * 
 * Provides automatic tool discovery, registration, and management.
 * 
 * Usage:
 * ```typescript
 * import { useToolRegistry, ToolCategory, ToolCapability } from '../tools';
 * 
 * const registry = useToolRegistry();
 * 
 * // Register a custom tool
 * registry.register({
 *   id: 'my-tool',
 *   name: 'My Tool',
 *   version: '1.0.0',
 *   category: ToolCategory.CUSTOM,
 *   // ...
 * });
 * 
 * // Load tools by filter
 * const tools = await registry.loadByFilter({
 *   categories: [ToolCategory.DEBUG],
 *   capabilities: [ToolCapability.READ],
 * });
 * ```
 */

// Registry exports
export {
  useToolRegistry,
  type ToolRegistryStore,
  ToolCategory,
  ToolCapability,
  ToolRegistryEvent,
  type ToolManifest,
  type ToolFilter,
  type ToolRequirements,
  type ToolPlatform,
  type ToolRegistryEventPayload,
  type ToolRegistryListener,
  type CachedToolEntry,
  type ToolRegistryState,
  type DiscoverySource,
  type ToolHealth,
} from './registry'

// Provider exports
export {
  debug,
  debugManifest,
  mcp,
  mcpManifest,
  cognitive,
  cognitiveManifest,
  allManifests,
  registerAllProviders,
} from './providers'
