/**
 * Unit Tests for LLMProvider
 * 
 * @module tests/unit/core/LLMProvider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock OpenAI client
const mockOpenAI = {
    chat: {
        completions: {
            create: vi.fn()
        }
    },
    embeddings: {
        create: vi.fn()
    }
};

// Mock the openai import
vi.mock('../../../../config/openai.js', () => ({
    openai: mockOpenAI,
    MODELS: {
        CHAT: 'gpt-4o',
        CHAT_FAST: 'gpt-4o-mini',
        EMBEDDING: 'text-embedding-3-small'
    }
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
    logLLMRequest: vi.fn(),
    logError: vi.fn(),
    logWarning: vi.fn(),
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

// ============================================
// TEST SUITES
// ============================================

describe('LLMProvider', () => {
    let LLMProvider;
    let llmProvider;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Reset mock implementations
        mockOpenAI.chat.completions.create.mockReset();
        mockOpenAI.embeddings.create.mockReset();

        // Import fresh module
        const module = await import('../../core/LLMProvider.js');
        LLMProvider = module.LLMProvider;
        llmProvider = new LLMProvider();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('chatCompletion', () => {
        it('should make successful chat completion call', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Hello, how can I help?' } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            const result = await llmProvider.chatCompletion([
                { role: 'user', content: 'Hello' }
            ]);

            expect(result).toBe('Hello, how can I help?');
            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
        });

        it('should use correct default options', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Response' } }],
                usage: { prompt_tokens: 5, completion_tokens: 10 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            await llmProvider.chatCompletion([{ role: 'user', content: 'Test' }]);

            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: 'gpt-4o',
                    temperature: 0.3,
                    max_tokens: 800
                })
            );
        });

        it('should respect custom options', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Response' } }],
                usage: { prompt_tokens: 5, completion_tokens: 10 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            await llmProvider.chatCompletion(
                [{ role: 'user', content: 'Test' }],
                { temperature: 0.7, maxTokens: 500 }
            );

            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    temperature: 0.7,
                    max_tokens: 500
                })
            );
        });

        it('should handle API errors gracefully', async () => {
            mockOpenAI.chat.completions.create.mockRejectedValue(
                new Error('API rate limit exceeded')
            );

            await expect(
                llmProvider.chatCompletion([{ role: 'user', content: 'Test' }])
            ).rejects.toThrow();
        });

        it('should retry on transient errors', async () => {
            // First call fails, second succeeds
            mockOpenAI.chat.completions.create
                .mockRejectedValueOnce({ status: 503, message: 'Service unavailable' })
                .mockResolvedValueOnce({
                    choices: [{ message: { content: 'Success after retry' } }],
                    usage: { prompt_tokens: 5, completion_tokens: 10 }
                });

            const result = await llmProvider.chatCompletion(
                [{ role: 'user', content: 'Test' }],
                { maxRetries: 2 }
            );

            expect(result).toBe('Success after retry');
            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
        });
    });

    describe('jsonCompletion', () => {
        it('should parse JSON response correctly', async () => {
            const jsonData = { intent: 'product_advice', confidence: 0.9 };
            const mockResponse = {
                choices: [{ message: { content: JSON.stringify(jsonData) } }],
                usage: { prompt_tokens: 10, completion_tokens: 20 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            const result = await llmProvider.jsonCompletion([
                { role: 'user', content: 'Classify this' }
            ]);

            expect(result).toEqual(jsonData);
            expect(result.intent).toBe('product_advice');
        });

        it('should set response_format to json_object', async () => {
            const mockResponse = {
                choices: [{ message: { content: '{"test": true}' } }],
                usage: { prompt_tokens: 5, completion_tokens: 5 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            await llmProvider.jsonCompletion([{ role: 'user', content: 'Test' }]);

            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    response_format: { type: 'json_object' }
                })
            );
        });

        it('should throw on invalid JSON response', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'not valid json' } }],
                usage: { prompt_tokens: 5, completion_tokens: 5 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            await expect(
                llmProvider.jsonCompletion([{ role: 'user', content: 'Test' }])
            ).rejects.toThrow();
        });
    });

    describe('fastCompletion', () => {
        it('should use fast model with low temperature', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Fast response' } }],
                usage: { prompt_tokens: 5, completion_tokens: 5 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            await llmProvider.fastCompletion([{ role: 'user', content: 'Quick test' }]);

            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: 'gpt-4o-mini',
                    temperature: 0.1
                })
            );
        });
    });

    describe('embed', () => {
        it('should generate embeddings', async () => {
            const mockEmbedding = new Array(1536).fill(0.1);
            mockOpenAI.embeddings.create.mockResolvedValue({
                data: [{ embedding: mockEmbedding }],
                usage: { prompt_tokens: 5 }
            });

            const result = await llmProvider.embed('Test text');

            expect(result).toEqual(mockEmbedding);
            expect(result.length).toBe(1536);
        });

        it('should use correct embedding model', async () => {
            mockOpenAI.embeddings.create.mockResolvedValue({
                data: [{ embedding: [] }],
                usage: { prompt_tokens: 5 }
            });

            await llmProvider.embed('Test');

            expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: 'text-embedding-3-small'
                })
            );
        });
    });

    describe('embedBatch', () => {
        it('should generate batch embeddings', async () => {
            const texts = ['text1', 'text2', 'text3'];
            const mockEmbeddings = texts.map(() => new Array(1536).fill(0.1));

            mockOpenAI.embeddings.create.mockResolvedValue({
                data: mockEmbeddings.map(e => ({ embedding: e })),
                usage: { prompt_tokens: 15 }
            });

            const result = await llmProvider.embedBatch(texts);

            expect(result.length).toBe(3);
            expect(result[0].length).toBe(1536);
        });
    });

    describe('Usage Tracking', () => {
        it('should track token usage', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Response' } }],
                usage: { prompt_tokens: 100, completion_tokens: 50 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            await llmProvider.chatCompletion([{ role: 'user', content: 'Test' }]);
            await llmProvider.chatCompletion([{ role: 'user', content: 'Test 2' }]);

            const stats = llmProvider.getUsageStats();

            expect(stats.prompt).toBe(200);
            expect(stats.completion).toBe(100);
            expect(stats.requests).toBe(2);
            expect(stats.totalTokens).toBe(300);
        });

        it('should reset usage stats', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Response' } }],
                usage: { prompt_tokens: 100, completion_tokens: 50 }
            };
            mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

            await llmProvider.chatCompletion([{ role: 'user', content: 'Test' }]);

            llmProvider.resetUsageStats();
            const stats = llmProvider.getUsageStats();

            expect(stats.prompt).toBe(0);
            expect(stats.completion).toBe(0);
            expect(stats.requests).toBe(0);
        });
    });

    describe('Rate Limiter', () => {
        it('should report rate limiter status', () => {
            const status = llmProvider.getRateLimiterStatus();

            expect(status).toHaveProperty('canRequest');
            expect(status).toHaveProperty('currentRequests');
            expect(status).toHaveProperty('maxRequests');
            expect(status.canRequest).toBe(true);
        });
    });
});
