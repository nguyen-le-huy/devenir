/**
 * Test Setup File
 * Configure global test environment
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// ============================================
// MOCK ENVIRONMENT VARIABLES
// ============================================

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// ============================================
// GLOBAL MOCKS
// ============================================

// Mock winston logger to prevent file I/O
vi.mock('./utils/logger.js', async () => {
    const actual = await vi.importActual('./utils/logger.js');
    return {
        ...actual,
        default: {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        },
        logRequestStart: vi.fn(),
        logRequestComplete: vi.fn(),
        logError: vi.fn(),
        logWarning: vi.fn(),
        logLLMRequest: vi.fn(),
        logVectorSearch: vi.fn()
    };
});

// ============================================
// SETUP HOOKS
// ============================================

beforeAll(() => {
    console.log('🧪 Starting RAG Service Tests...\n');
});

afterAll(() => {
    console.log('\n✅ RAG Service Tests Complete');
});

afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
});
