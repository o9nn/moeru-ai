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

// Provider exports
export {
  allManifests,
  cognitive,
  cognitiveManifest,
  debug,
  debugManifest,
  mcp,
  mcpManifest,
  registerAllProviders,
} from './providers'

// Registry exports
export {
  type CachedToolEntry,
  type DiscoverySource,
  ToolCapability,
  ToolCategory,
  type ToolFilter,
  type ToolHealth,
  type ToolManifest,
  type ToolPlatform,
  ToolRegistryEvent,
  type ToolRegistryEventPayload,
  type ToolRegistryListener,
  type ToolRegistryState,
  type ToolRegistryStore,
  type ToolRequirements,
  useToolRegistry,
} from './registry'
