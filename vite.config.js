import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from 'vite-plugin-chrome-extension'
import manifest from './manifest.json'

export default defineConfig({
    plugins: [crx({ manifest })],
})
