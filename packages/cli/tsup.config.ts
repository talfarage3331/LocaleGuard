import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/run.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
})
