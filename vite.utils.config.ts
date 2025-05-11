import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import path from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  root: "src/utils",
  plugins: [vue(),  dts({ include: ".", entryRoot: "." }), ],
  build: {
    lib: {
      formats: [ "es" ],
      entry: {
        vue: "vue.ts",
      },
    },
    outDir: path.join(__dirname, "./dist/utils"),
    emptyOutDir: true,
    rollupOptions: {
      external: [ "vue", "pinia" ],
    }
  },
})
