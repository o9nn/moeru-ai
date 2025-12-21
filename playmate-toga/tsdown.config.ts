import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'personality/index': 'src/personality/index.ts',
    'avatar/index': 'src/avatar/index.ts',
    'security/index': 'src/security/index.ts',
    'transform/index': 'src/transform/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    'pixi.js',
    'pixi-live2d-display',
    '@proj-airi/live2d-core',
    '@proj-airi/core-character',
    '@proj-airi/cognitive-core',
  ],
})
