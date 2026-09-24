import { describe, expect, it } from 'vitest'

import { debug } from './debug'

describe('debug tool schemas', () => {
  it('requires every declared property for strict OpenAI-compatible tools', async () => {
    const tools = await debug()
    const timestampTool = tools.find(candidate => candidate.function.name === 'debug_timestamp')

    expect(timestampTool?.function).toMatchObject({
      name: 'debug_timestamp',
      parameters: {
        additionalProperties: false,
        required: ['format'],
        type: 'object',
      },
      strict: true,
    })
  })
})
