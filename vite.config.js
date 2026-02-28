import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        booking: resolve(__dirname, 'booking.html'),
        formation: resolve(__dirname, 'formation.html'),
        privacy: resolve(__dirname, 'privacy.html'),
      },
    },
  },
})
