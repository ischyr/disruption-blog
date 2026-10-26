import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postsMetaPlugin from './vite-plugin-posts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [postsMetaPlugin(), react()],
  build: {
    // maps source files (e.g. post covers) to their hashed output names, so
    // scripts/gen-pages.mjs can point share previews at the right image
    manifest: true,
  },
})
