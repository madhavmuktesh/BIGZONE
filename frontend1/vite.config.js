import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This rule says: if a request starts with "/api",
      // forward it to the target server.
      '/api': {
        // This should be the address of your backend server
        target: 'http://localhost:5000', 
        
        // This is important for virtual hosts
        changeOrigin: true, 
        
        // This is not strictly required, but good practice
        secure: false,      
      },
    },
  },
})
