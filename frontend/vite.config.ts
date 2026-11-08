import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import 'dotenv/config';


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
