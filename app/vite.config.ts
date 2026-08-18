import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
// Run `ANALYZE=true npm run build` to emit dist/stats.html (bundle treemap).
const analyze = process.env.ANALYZE === 'true'

export default defineConfig(({ command }) => ({
  base: './',
  plugins: [
    // Dev-only: stamps every JSX element with code-path="<source file>:<line>:<col>"
    // so the browser inspector can jump to source. It has no build-time gate of
    // its own, so it must be gated here — otherwise all ~1,200 of those strings,
    // and the shape of our source tree, ship to production.
    ...(command === 'serve' ? [inspectAttr()] : []),
    react(),
    ...(analyze
      ? [visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
