import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import svgPlugin from './scripts/viteSvgPlugin.js'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: "src/frontend",
  plugins: [vue(), svgPlugin()],
  base: "./",
  build: {
    outDir: path.join(__dirname, "./dist/frontend"),
    emptyOutDir: true,
    rollupOptions: {
      // external: [ "vue", "pinia" ],
    }
  },
})
