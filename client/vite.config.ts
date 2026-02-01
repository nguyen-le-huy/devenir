import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
        port: 5174,
        host: 'localhost'
    },

    // ============ PRODUCTION OPTIMIZATIONS ============
    build: {
        // Target modern browsers for smaller bundle
        target: 'es2015',

        // Optimize chunk size
        chunkSizeWarningLimit: 1000,

        // Enable minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
                drop_debugger: true,
            },
        },

        // Rollup options for code splitting
        rollupOptions: {
            output: {
                // Manual chunks for better caching
                manualChunks: {
                    // React core
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],

                    // React Query
                    'query-vendor': ['@tanstack/react-query'],

                    // Other vendors can be added as needed
                },

                // Chunk file names with hash for cache busting
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
            },
        },
    },

    // ============ OPTIMIZATION ============
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    },
})
