import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/group-dynamics',
      'packages/injecta',
      'packages/stage-ui',
    ],
  },
})
