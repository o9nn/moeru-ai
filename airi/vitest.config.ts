import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'build',
      'packages/group-dynamics',
      'packages/character-aion',
      'packages/injecta',
      'packages/stage-ui',
    ],
  },
})
