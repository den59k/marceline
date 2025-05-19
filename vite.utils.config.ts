import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import path from 'path'
import dts from 'vite-plugin-dts'
// @ts-ignore
import svgPlugin from './scripts/viteSvgPlugin.js'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  // root: "src/utils",
  plugins: [vue(), svgPlugin(), dts({ 
    rollupTypes: true, 
    insertTypesEntry: false, 
    strictOutput: true, 
    afterBuild(result) {
      const path = Array.from(result.keys())[0]
      fs.renameSync(path, path.replace("index.d.ts", "vue.d.ts"))
    },
    
    exclude: [ "src/backend/**/*", "src/plugin/**/*", "src/app/**/*" ] 
  }) ],
  build: {
    lib: {
      formats: [ "es" ],
      entry: {
        vue: "src/utils/vue.ts",
      }
    },
    outDir: path.join(__dirname, "./dist/utils"),
    emptyOutDir: true,
    rollupOptions: {
      external: [ "vue", "pinia", "@vueuse/core", "vuesix", "dayjs" ],
    }
  },
})
