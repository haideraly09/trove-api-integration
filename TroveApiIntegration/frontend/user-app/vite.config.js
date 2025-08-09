import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            three: ['three']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'three']
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || 'development'),
      'process.env.REACT_APP_GEMINI_API_KEY': JSON.stringify(env.REACT_APP_GEMINI_API_KEY)
    }
  }
})