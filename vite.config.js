import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        booking: resolve(__dirname, 'booking.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        camps: resolve(__dirname, 'camps.html'),
      },
    },
  },
})
