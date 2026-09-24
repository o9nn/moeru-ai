import { describe, expect, it } from 'vitest'

import { parseGitHubRepository, repositoryUrl } from './repository'

describe('parseGitHubRepository', () => {
  it('parses a workflow repository slug', () => {
    expect(parseGitHubRepository('o9nn/moeru-ai', 'moeru-ai/inventory')).toEqual({
      owner: 'o9nn',
      repo: 'moeru-ai',
    })
  })

  it('uses the standalone inventory fallback', () => {
    expect(parseGitHubRepository(undefined, 'moeru-ai/inventory')).toEqual({
      owner: 'moeru-ai',
      repo: 'inventory',
    })
  })

  it('rejects malformed repository slugs', () => {
    expect(() => parseGitHubRepository('missing-owner', 'moeru-ai/inventory')).toThrow('Invalid GitHub repository')
  })
})

describe('repositoryUrl', () => {
  it('constructs a Git remote URL', () => {
    expect(repositoryUrl({ owner: 'o9nn', repo: 'moeru-ai' }).toString()).toBe('https://github.com/o9nn/moeru-ai.git')
  })
})
