import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import path from 'path'
import dts from 'vite-plugin-dts'
// @ts-ignore
import svgPlugin from './scripts/viteSvgPlugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  // root: "src/utils",
  plugins: [vue(), svgPlugin(), dts({ 
    rollupTypes: true, 
    insertTypesEntry: false, 
    strictOutput: true, 

    exclude: [ "src/backend/**/*", "src/plugin/**/*", "src/app/**/*" ] 
  }) ],
  build: {
    lib: {
      formats: [ "es" ],
      entry: {
        vue: "src/utils/vue.ts",
      },
    },
    outDir: path.join(__dirname, "./dist/utils"),
    emptyOutDir: true,
    rollupOptions: {
      external: [ "vue", "pinia", "@vueuse/core", "vuesix" ],
    }
  },
})
