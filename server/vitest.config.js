/**
 * Vitest Configuration for RAG Service Tests
 */

import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        // Test environment
        environment: 'node',

        // Global test APIs
        globals: true,

        // Test patterns
        include: [
            'services/rag/__tests__/**/*.test.js',
            'services/rag/__tests__/**/*.test.ts'
        ],

        // Exclude patterns
        exclude: [
            '**/node_modules/**',
            '**/dist/**'
        ],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['services/rag/**/*.js'],
            exclude: [
                'services/rag/__tests__/**',
                'services/rag/types/**',
                'services/rag/data/**'
            ],
            thresholds: {
                global: {
                    statements: 80,
                    branches: 70,
                    functions: 80,
                    lines: 80
                }
            }
        },

        // Timeouts
        testTimeout: 10000,
        hookTimeout: 10000,

        // Reporter
        reporters: ['verbose'],

        // Watch configuration
        watch: false,

        // Setup files
        setupFiles: ['services/rag/__tests__/setup.js']
    }
});
