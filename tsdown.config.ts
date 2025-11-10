import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/**/worker.js',
  ],
  minify: true,
  unbundle: true,
  fixedExtension: false,
})
