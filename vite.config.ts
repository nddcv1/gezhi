import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // vitest 2.1 vendors Vite 5 types; @vitejs/plugin-react is typed against root Vite 6
  plugins: [react() as unknown as Plugin],
  base: './',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
