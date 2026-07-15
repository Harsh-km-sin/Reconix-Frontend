import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
// Run `ANALYZE=true npm run build` to emit dist/stats.html (bundle treemap).
const analyze = process.env.ANALYZE === 'true'

export default defineConfig({
  base: './',
  plugins: [
    inspectAttr(),
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
});
