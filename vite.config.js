import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postsMetaPlugin from './vite-plugin-posts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [postsMetaPlugin(), react()],
})
