import { defineConfig } from 'vite'
import pkg from './package.json';
import builtins from 'builtin-modules'
import { join } from 'path';
import dts from 'vite-plugin-dts'

export default defineConfig((env) => {
  return {
    plugins: [ dts({ rollupTypes: true, exclude: "src/app/**/*" }) ],
    // root: join(process.cwd(), getRoot(env.mode)),
    build: {
      target: "node18",
      minify: false,
      sourcemap: true,
      lib: {
        entry: {
          "index": "src/plugin/marceline.ts",
        },
        formats: [ "es", "cjs" ], 
        name: "index",
      },
      modulePreload: {
        polyfill: false
      },
      ssr: true,
      rollupOptions: {
        output: {
          chunkFileNames: "[name].cjs"
        },
        external: [
          ...Object.keys(pkg.dependencies),
          /^node:/,
          ...builtins
        ]
      },
      outDir: join(__dirname, "dist/plugin"),
      emptyOutDir: true
    },
  }
})