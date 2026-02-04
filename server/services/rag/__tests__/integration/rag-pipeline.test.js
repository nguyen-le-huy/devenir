/**
 * Integration Tests for RAG Pipeline
 * Tests the full flow from message to response
 * 
 * @module tests/integration/rag-pipeline
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock external dependencies before importing
vi.mock('../../core/LLMProvider.js', () => ({
    LLMProvider: class MockLLMProvider {
        async chatCompletion() {
            return 'Mocked response';
        }
        async jsonCompletion() {
            return { intent: 'product_advice', confidence: 0.85 };
        }
        async fastCompletion() {
            return 'Fast response';
        }
        async embed() {
            return new Array(1536).fill(0.1);
        }
    },
    llmProvider: {
        chatCompletion: vi.fn().mockResolvedValue('Mocked response'),
        jsonCompletion: vi.fn().mockResolvedValue({
            intent: 'product_advice',
            confidence: 0.85,
            extracted_info: {}
        }),
        fastCompletion: vi.fn().mockResolvedValue('Fast response'),
        embed: vi.fn().mockResolvedValue(new Array(1536).fill(0.1))
    }
}));

vi.mock('../../core/VectorStore.js', () => ({
    VectorStore: class MockVectorStore {
        async query() {
            return {
                matches: [
                    { id: 'prod1', score: 0.95, metadata: { product_name: 'Test Product' } }
                ]
            };
        }
    }
}));

// ============================================
// TEST SUITES
// ============================================

describe('RAG Pipeline Integration', () => {
    describe('Intent Classification Flow', () => {
        it('should classify product search intent correctly', async () => {
            const { quickIntentDetection } = await import('../../orchestrators/intent-classifier.js');

            const testCases = [
                { message: 'tìm áo polo', expectedIntent: 'product_advice' },
                { message: 'doanh thu hôm nay', expectedIntent: 'admin_analytics' },
                { message: 'size M có vừa không', expectedIntent: 'size_recommendation' }
            ];

            for (const { message, expectedIntent } of testCases) {
                const result = quickIntentDetection(message);
                console.log(`Message: "${message}" -> Intent: ${result.intent}`);

                // For keyword-detected intents, should match
                if (result.confidence > 0.7) {
                    expect(result.intent).toBe(expectedIntent);
                }
            }
        });

        it('should extract admin keywords with high confidence', async () => {
            const { quickIntentDetection } = await import('../../orchestrators/intent-classifier.js');

            const adminQueries = [
                'báo cáo doanh thu hôm nay',
                'tổng doanh thu tháng này',
                'kiểm tra tồn kho',
                'tra cứu khách hàng'
            ];

            for (const query of adminQueries) {
                const result = quickIntentDetection(query);
                expect(result.intent).toBe('admin_analytics');
                expect(result.confidence).toBeGreaterThanOrEqual(0.9);
            }
        });
    });

    describe('Context Management Flow', () => {
        it('should maintain conversation context', async () => {
            const { ConversationManager } = await import('../../orchestrators/conversation-manager.js');
            const manager = new ConversationManager();

            const userId = 'test-user-123';

            // Add messages
            await manager.addMessage(userId, {
                role: 'user',
                content: 'tìm áo khoác màu đen',
                timestamp: new Date()
            });

            await manager.addMessage(userId, {
                role: 'assistant',
                content: 'Dạ, em có một số áo khoác đen phù hợp...',
                timestamp: new Date()
            });

            // Get context
            const context = await manager.getContext(userId, []);

            expect(context.history).toBeDefined();
            expect(context.history.length).toBe(2);
            expect(context.recent_messages.length).toBeLessThanOrEqual(5);
        });

        it('should clear context properly', async () => {
            const { ConversationManager } = await import('../../orchestrators/conversation-manager.js');
            const manager = new ConversationManager();

            const userId = 'test-clear-user';

            await manager.addMessage(userId, {
                role: 'user',
                content: 'test message'
            });

            await manager.clearContext(userId);

            const context = await manager.getContext(userId, []);
            expect(context.history.length).toBe(0);
        });
    });

    describe('Error Handling Flow', () => {
        it('should handle and wrap unknown errors', async () => {
            const { wrapError, RAGError, isRAGError } = await import('../../utils/errors.js');

            const standardError = new Error('Something went wrong');
            const wrapped = wrapError(standardError, 'test context');

            expect(isRAGError(wrapped)).toBe(true);
            expect(wrapped.code).toBe('UNKNOWN_ERROR');
            expect(wrapped.details.context).toBe('test context');
        });

        it('should return user-friendly messages', async () => {
            const {
                ProductNotFoundError,
                getUserFriendlyMessage
            } = await import('../../utils/errors.js');

            const error = new ProductNotFoundError('prod123');
            const message = getUserFriendlyMessage(error);

            expect(message).toContain('không tìm thấy');
        });
    });

    describe('Utility Functions', () => {
        it('should calculate date ranges correctly', async () => {
            const { calculateDateRange } = await import('../../utils/dateUtils.js');

            const todayRange = calculateDateRange({ period: 'today' });

            expect(todayRange.start).toBeInstanceOf(Date);
            expect(todayRange.end).toBeInstanceOf(Date);
            expect(todayRange.start.getHours()).toBe(0);
            expect(todayRange.end.getHours()).toBe(23);
            expect(todayRange.label).toBe('hôm nay');
        });

        it('should detect colors in Vietnamese text', async () => {
            const { findColorInQuery } = await import('../../utils/colorUtils.js');

            const cases = [
                { query: 'áo màu đen', expected: 'black' },
                { query: 'quần trắng', expected: 'white' },
                { query: 'áo xanh navy', expected: 'navy' }
            ];

            for (const { query, expected } of cases) {
                const result = findColorInQuery(query);
                expect(result).not.toBeNull();
                expect(result.en).toBe(expected);
            }
        });
    });
});

describe('RAG Service Health', () => {
    it('should export all required modules', async () => {
        const ragModule = await import('../../index.js');

        // Core
        expect(ragModule.RAGService).toBeDefined();
        expect(ragModule.LLMProvider).toBeDefined();
        expect(ragModule.VectorStore).toBeDefined();

        // Errors
        expect(ragModule.RAGError).toBeDefined();
        expect(ragModule.ProductNotFoundError).toBeDefined();
        expect(ragModule.LLMProviderError).toBeDefined();

        // Utils
        expect(ragModule.findColorInQuery).toBeDefined();
        expect(ragModule.calculateDateRange).toBeDefined();
        expect(ragModule.logError).toBeDefined();

        // Constants
        expect(ragModule.INTENTS).toBeDefined();
        expect(ragModule.RAG_CONFIG).toBeDefined();
    });

    it('should have valid constants', async () => {
        const { INTENTS, RAG_CONFIG } = await import('../../constants.js');

        expect(Object.keys(INTENTS).length).toBeGreaterThan(0);
        expect(RAG_CONFIG.LLM.MAX_TOKENS).toBeGreaterThan(0);
        expect(RAG_CONFIG.VECTOR.TOP_K).toBeGreaterThan(0);
    });
});
