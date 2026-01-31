/**
 * MCP Tools Provider
 * 
 * Model Context Protocol tools with automatic discovery support.
 */

import type { ToolManifest } from '../registry/types'

import { tool } from '@xsai/tool'
import { z } from 'zod'

import { ToolCapability, ToolCategory } from '../registry/types'

/**
 * Check if MCP is available (Tauri environment)
 */
function isMCPAvailable(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Dynamic import of Tauri MCP plugin
 */
async function getMCPModule() {
  if (!isMCPAvailable()) {
    throw new Error('MCP is only available in Tauri environment')
  }
  return import('@proj-airi/tauri-plugin-mcp')
}

/**
 * MCP tool definitions
 */
const mcpTools = [
  tool({
    name: 'mcp_list_tools',
    description: 'List all tools available on the MCP server',
    execute: async () => {
      const { listTools } = await getMCPModule()
      return await listTools()
    },
    parameters: z.object({}),
  }),
  tool({
    name: 'mcp_connect_server',
    description: 'Connect to the MCP server. If "success", the connection to the MCP server is successful. Otherwise, the connection fails.',
    execute: async ({ command, args }) => {
      const { connectServer } = await getMCPModule()
      await connectServer(command, args)
      return 'success'
    },
    parameters: z.object({
      command: z.string().describe('The command to connect to the MCP server'),
      args: z.array(z.string()).describe('The arguments to pass to the MCP server'),
    }),
  }),
  tool({
    name: 'mcp_disconnect_server',
    description: 'Disconnect from the MCP server. If "success", the disconnection from the MCP server is successful. Otherwise, the disconnection fails.',
    execute: async () => {
      const { disconnectServer } = await getMCPModule()
      await disconnectServer()
      return 'success'
    },
    parameters: z.object({}),
  }),
  tool({
    name: 'mcp_call_tool',
    description: 'Call a tool on the MCP server. The result is a list of content and a boolean indicating whether the tool call is an error.',
    execute: async ({ name, parameters }) => {
      const { callTool } = await getMCPModule()
      const parametersObject = Object.fromEntries(parameters.map(({ name, value }) => [name, value]))
      const result = await callTool(name, parametersObject)
      return result satisfies {
        content: {
          type: string
          text: string
        }[]
        isError: boolean
      }
    },
    parameters: z.object({
      name: z.string().describe('The name of the tool to call'),
      parameters: z.array(z.object({
        name: z.string().describe('The name of the parameter'),
        value: z.union([z.string(), z.number(), z.boolean(), z.object({})]).describe('The value of the parameter, it can be a string, a number, a boolean, or an object'),
      })).describe('The parameters to pass to the tool'),
    }),
  }),
]

/**
 * MCP tools manifest for automatic discovery
 */
export const mcpManifest: ToolManifest = {
  id: 'mcp',
  name: 'MCP Tools',
  version: '1.0.0',
  description: 'Model Context Protocol tools for connecting to and interacting with MCP servers',
  category: ToolCategory.MCP,
  tags: ['mcp', 'protocol', 'server', 'integration', 'external'],
  capabilities: [
    ToolCapability.READ,
    ToolCapability.WRITE,
    ToolCapability.EXECUTE,
    ToolCapability.NETWORK,
    ToolCapability.EXTERNAL_SERVICE,
  ],
  requirements: {
    platform: 'tauri',
    permissions: ['mcp:connect', 'mcp:call'],
  },
  enabledByDefault: true,
  priority: 100, // High priority for MCP tools
  icon: '🔌',
  docsUrl: 'https://modelcontextprotocol.io/',
  provider: async () => {
    // Only provide tools if MCP is available
    if (!isMCPAvailable()) {
      console.warn('[MCP] Not available in current environment')
      return []
    }
    return Promise.all(mcpTools)
  },
}

/**
 * Legacy export for backward compatibility
 */
export const mcp = async () => {
  if (!isMCPAvailable()) {
    return []
  }
  return Promise.all(mcpTools)
}

export default mcpManifest
