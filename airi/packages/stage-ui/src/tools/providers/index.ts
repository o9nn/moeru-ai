/**
 * Tool Providers Index
 *
 * Exports all tool providers and their manifests for automatic discovery.
 */

import { cognitiveManifest } from './cognitive'
// Debug tools
// All manifests for bulk registration
import { debugManifest } from './debug'
import { mcpManifest } from './mcp'

// Cognitive tools
export { cognitive, cognitiveManifest } from './cognitive'

export { debug, debugManifest } from './debug'

// MCP tools
export { mcp, mcpManifest } from './mcp'

export const allManifests = [
  debugManifest,
  mcpManifest,
  cognitiveManifest,
]

/**
 * Register all providers with the tool registry
 */
export function registerAllProviders(registry: { register: (manifest: any) => void }) {
  for (const manifest of allManifests) {
    registry.register(manifest)
  }
}
