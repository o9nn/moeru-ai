# Automatic Tool Discovery - Architecture Design

## Overview

This document outlines the architecture for implementing automatic tool discovery in the moeru-ai stage-ui package. The system enables dynamic registration, discovery, and management of tools at runtime.

## Current State

Currently, tools are:
1. Manually imported in `llm.ts` (lines 10, 55-60)
2. Statically defined in separate files (`debug.ts`, `mcp.ts`)
3. Combined at runtime with `Promise.all`

```typescript
// Current approach (llm.ts:55-60)
tools: streamOptionsToolsCompatibilityOk(model, chatProvider, messages, options)
  ? [
      ...await mcp(),
      ...await debug(),
    ]
  : undefined,
```

## Proposed Architecture

### 1. Tool Manifest Schema

Each tool or tool provider defines a manifest:

```typescript
interface ToolManifest {
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  version: string;               // Semantic version
  description: string;           // Tool description
  category: ToolCategory;        // Category for organization
  tags: string[];                // Searchable tags
  capabilities: ToolCapability[]; // What the tool can do
  requirements?: {               // Runtime requirements
    platform?: 'web' | 'tauri' | 'any';
    permissions?: string[];
    dependencies?: string[];
  };
  provider: () => Promise<Tool[]>; // Factory function
}
```

### 2. Tool Categories

```typescript
enum ToolCategory {
  DEBUG = 'debug',           // Development/debugging tools
  MCP = 'mcp',               // Model Context Protocol tools
  SYSTEM = 'system',         // System utilities
  MEDIA = 'media',           // Audio/video/image tools
  MEMORY = 'memory',         // Memory/context management
  COGNITIVE = 'cognitive',   // Cognitive processing tools
  EXTERNAL = 'external',     // External API integrations
  CUSTOM = 'custom',         // User-defined tools
}
```

### 3. Tool Capabilities

```typescript
enum ToolCapability {
  READ = 'read',             // Can read data
  WRITE = 'write',           // Can write/modify data
  EXECUTE = 'execute',       // Can execute actions
  NETWORK = 'network',       // Requires network access
  FILESYSTEM = 'filesystem', // Requires filesystem access
  REALTIME = 'realtime',     // Supports real-time streaming
}
```

### 4. Tool Registry Class

```typescript
class ToolRegistry {
  private manifests: Map<string, ToolManifest>;
  private loadedTools: Map<string, Tool[]>;
  private listeners: Set<ToolRegistryListener>;
  
  // Registration
  register(manifest: ToolManifest): void;
  unregister(id: string): void;
  
  // Discovery
  discover(): Promise<ToolManifest[]>;
  discoverByCategory(category: ToolCategory): Promise<ToolManifest[]>;
  discoverByCapability(capability: ToolCapability): Promise<ToolManifest[]>;
  discoverByTag(tag: string): Promise<ToolManifest[]>;
  
  // Loading
  load(id: string): Promise<Tool[]>;
  loadAll(): Promise<Tool[]>;
  loadByFilter(filter: ToolFilter): Promise<Tool[]>;
  
  // Events
  on(event: ToolRegistryEvent, listener: ToolRegistryListener): void;
  off(event: ToolRegistryEvent, listener: ToolRegistryListener): void;
}
```

### 5. Discovery Mechanisms

#### 5.1 Static Registration
Tools registered at module load time:

```typescript
// tools/debug.ts
export const manifest: ToolManifest = {
  id: 'debug',
  name: 'Debug Tools',
  version: '1.0.0',
  category: ToolCategory.DEBUG,
  provider: async () => [...tools],
};

// Auto-register on import
toolRegistry.register(manifest);
```

#### 5.2 Dynamic Discovery
Scan for tool manifests at runtime:

```typescript
// Discover tools from known locations
async function discoverTools(): Promise<ToolManifest[]> {
  const sources = [
    './tools',           // Local tools
    '@proj-airi/tools',  // Package tools
    'mcp://servers',     // MCP servers
  ];
  
  return Promise.all(sources.map(scanSource));
}
```

#### 5.3 MCP Integration
Discover tools from connected MCP servers:

```typescript
async function discoverMCPTools(): Promise<ToolManifest[]> {
  const mcpTools = await listTools();
  return mcpTools.map(convertToManifest);
}
```

### 6. Integration with LLM Store

```typescript
// llm.ts - Updated implementation
import { useToolRegistry } from './tool-registry';

const toolRegistry = useToolRegistry();

async function streamFrom(model, chatProvider, messages, options) {
  // Automatic tool discovery
  const tools = streamOptionsToolsCompatibilityOk(model, chatProvider, messages, options)
    ? await toolRegistry.loadByFilter({
        categories: options?.toolCategories,
        capabilities: options?.requiredCapabilities,
        tags: options?.toolTags,
      })
    : undefined;
  
  return streamText({
    ...chatProvider.chat(model),
    tools,
    // ...
  });
}
```

### 7. Tool Filtering

```typescript
interface ToolFilter {
  categories?: ToolCategory[];
  capabilities?: ToolCapability[];
  tags?: string[];
  platform?: 'web' | 'tauri' | 'any';
  exclude?: string[];  // Tool IDs to exclude
}
```

### 8. Caching Strategy

```typescript
interface ToolCache {
  manifests: Map<string, { manifest: ToolManifest; timestamp: number }>;
  tools: Map<string, { tools: Tool[]; timestamp: number }>;
  ttl: number;  // Cache TTL in milliseconds
}
```

## Implementation Plan

### Phase 1: Core Registry
1. Create `ToolManifest` interface
2. Create `ToolCategory` and `ToolCapability` enums
3. Implement `ToolRegistry` class with basic registration

### Phase 2: Discovery
1. Implement static discovery (import-based)
2. Implement dynamic discovery (scan-based)
3. Implement MCP tool discovery

### Phase 3: Integration
1. Update `llm.ts` to use registry
2. Migrate existing tools to manifest format
3. Add filtering support to stream options

### Phase 4: Advanced Features
1. Add caching layer
2. Add event system for tool changes
3. Add tool health checks
4. Add tool versioning support

## File Structure

```
packages/stage-ui/src/tools/
├── index.ts                 # Main exports
├── registry/
│   ├── index.ts            # Registry exports
│   ├── types.ts            # Type definitions
│   ├── tool-registry.ts    # Registry implementation
│   ├── discovery.ts        # Discovery mechanisms
│   └── cache.ts            # Caching layer
├── providers/
│   ├── debug.ts            # Debug tools (with manifest)
│   ├── mcp.ts              # MCP tools (with manifest)
│   └── cognitive.ts        # Cognitive tools (new)
└── utils/
    ├── filter.ts           # Filtering utilities
    └── validation.ts       # Manifest validation
```

## Usage Examples

### Registering a New Tool

```typescript
import { toolRegistry, ToolCategory, ToolCapability } from './tools';

toolRegistry.register({
  id: 'my-custom-tool',
  name: 'My Custom Tool',
  version: '1.0.0',
  description: 'Does something useful',
  category: ToolCategory.CUSTOM,
  tags: ['utility', 'custom'],
  capabilities: [ToolCapability.READ, ToolCapability.EXECUTE],
  provider: async () => [
    await tool({
      name: 'my_tool_action',
      description: 'Performs an action',
      parameters: z.object({ input: z.string() }),
      execute: async ({ input }) => `Processed: ${input}`,
    }),
  ],
});
```

### Discovering Tools

```typescript
// Get all tools
const allTools = await toolRegistry.loadAll();

// Get tools by category
const debugTools = await toolRegistry.loadByFilter({
  categories: [ToolCategory.DEBUG],
});

// Get tools with specific capabilities
const networkTools = await toolRegistry.loadByFilter({
  capabilities: [ToolCapability.NETWORK],
});
```

### Stream with Filtered Tools

```typescript
const llm = useLLM();

await llm.stream(model, provider, messages, {
  toolCategories: [ToolCategory.DEBUG, ToolCategory.COGNITIVE],
  requiredCapabilities: [ToolCapability.READ],
  toolTags: ['safe', 'fast'],
});
```
