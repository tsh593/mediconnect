import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            crypto: 'crypto-browserify',
            buffer: 'buffer',
            stream: 'stream-browserify',
            util: 'util'
        }
    },
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        hmr: {
            overlay: false
        },
        cors: true,
        // ADD PROXY CONFIGURATION HERE:
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
                ws: true, // Enable WebSocket proxying
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('Proxy error:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        console.log('Proxying:', req.method, req.url);
                    });
                }
            }
        }
    },
    build: {
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            external: [],
            onwarn: (warning, warn) => {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return
                }
                warn(warning)
            }
        }
    },
    optimizeDeps: {
        exclude: ['lucide-react'],
        include: ['@google/generative-ai', 'leaflet', '@google/model-viewer']
    }
})