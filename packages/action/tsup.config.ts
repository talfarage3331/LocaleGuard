import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  // CJS: @actions/* are CommonJS; bundling them into ESM breaks on `require`.
  // A single CJS bundle is the conventional GitHub Action artifact anyway.
  format: ['cjs'],
  dts: false,
  clean: true,
  target: 'node20',
  // GitHub runners don't `pnpm install` the action — the committed dist must be
  // self-contained, so bundle every dependency (incl. @actions/* and workspace
  // packages) into one file.
  noExternal: [/.*/],
})
