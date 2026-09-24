import { env } from 'node:process'

import { createOpenRouter } from '@xsai-ext/providers-cloud'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { attemptForToolsCompatibilityDiscovery } from './llm'

function doesHaveOpenRouterApiKey() {
  const apiKey = env.LLM_API_OPENROUTER_API_KEY
  if (!apiKey) {
    console.warn('Skipping llm store tests, because LLM_API_OPENROUTER_API_KEY is not set')
  }

  return !!apiKey
}

const hasOpenRouterApiKey = doesHaveOpenRouterApiKey()

describe.skipIf(!hasOpenRouterApiKey)('llm store', { timeout: 60000 }, async () => {
  it('should be false for phi-4', async () => {
    // TODO: base url should not be hardcoded, wait for https://github.com/moeru-ai/xsai/pull/194
    const res1 = await attemptForToolsCompatibilityDiscovery('microsoft/phi-4', createOpenRouter(env.LLM_API_OPENROUTER_API_KEY!, 'https://openrouter.ai/api/v1/'), [], { toolDiscovery: { useLegacy: true } })
    expect(res1).toBe(false)
  })

  it('should be true for gpt-4o-mini', async () => {
    // TODO: base url should not be hardcoded, wait for https://github.com/moeru-ai/xsai/pull/194
    const res1 = await attemptForToolsCompatibilityDiscovery('openai/gpt-4o-mini', createOpenRouter(env.LLM_API_OPENROUTER_API_KEY!, 'https://openrouter.ai/api/v1/'), [], { toolDiscovery: { useLegacy: true } })
    expect(res1).toBe(true)
  })

  it('should be true for gpt-4o', async () => {
    // TODO: base url should not be hardcoded, wait for https://github.com/moeru-ai/xsai/pull/194
    const res2 = await attemptForToolsCompatibilityDiscovery('openai/gpt-4o', createOpenRouter(env.LLM_API_OPENROUTER_API_KEY!, 'https://openrouter.ai/api/v1/'), [], { toolDiscovery: { useLegacy: true } })
    expect(res2).toBe(true)
  })
})

describe('llm compatibility discovery failures', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects provider errors instead of leaving the discovery pending', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { message: 'simulated provider failure' } }),
      {
        headers: { 'content-type': 'application/json' },
        status: 400,
      },
    )))

    await expect(attemptForToolsCompatibilityDiscovery(
      'test/model',
      createOpenRouter('test-key', 'https://example.test/v1/'),
      [],
      { toolDiscovery: { useLegacy: true } },
    )).rejects.toThrow('Error during tools compatibility discovery')
  }, 5000)
})
