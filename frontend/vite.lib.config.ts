import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-lib',
    lib: {
      entry: 'src/public-api.ts',
      name: 'DocumentApprovalMfe',
      fileName: 'document-approval-mfe',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM', 'react/jsx-runtime': 'ReactJSXRuntime' },
      },
    },
  },
})
