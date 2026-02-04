/**
 * Unit Tests for RAG Error Classes
 * 
 * @module tests/errors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    RAGError,
    IntentClassificationError,
    ProductNotFoundError,
    VectorSearchError,
    LLMProviderError,
    LLMRateLimitError,
    EntityExtractionError,
    ContextRetrievalError,
    ValidationError,
    TimeoutError,
    isRAGError,
    wrapError,
    getUserFriendlyMessage
} from '../../utils/errors.js';

// ============================================
// RAGROR BASE CLASS TESTS
// ============================================

describe('RAGError', () => {
    describe('constructor', () => {
        it('should create error with all properties', () => {
            const error = new RAGError(
                'Test error',
                'TEST_CODE',
                400,
                { extra: 'data' }
            );

            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_CODE');
            expect(error.statusCode).toBe(400);
            expect(error.details).toEqual({ extra: 'data' });
            expect(error.name).toBe('RAGError');
            expect(error.timestamp).toBeInstanceOf(Date);
        });

        it('should default statusCode to 500', () => {
            const error = new RAGError('Test', 'CODE');
            expect(error.statusCode).toBe(500);
        });

        it('should capture stack trace', () => {
            const error = new RAGError('Test', 'CODE');
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('RAGError');
        });
    });

    describe('toJSON', () => {
        it('should serialize error to JSON', () => {
            const error = new RAGError('Test', 'CODE', 400, { key: 'value' });
            const json = error.toJSON();

            expect(json.name).toBe('RAGError');
            expect(json.code).toBe('CODE');
            expect(json.message).toBe('Test');
            expect(json.statusCode).toBe(400);
            expect(json.details).toEqual({ key: 'value' });
            expect(json.timestamp).toBeDefined();
        });

        it('should include stack in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const error = new RAGError('Test', 'CODE');
            const json = error.toJSON();

            expect(json.stack).toBeDefined();

            process.env.NODE_ENV = originalEnv;
        });
    });
});

// ============================================
// SPECIALIZED ERROR TESTS
// ============================================

describe('IntentClassificationError', () => {
    it('should have correct code and status', () => {
        const error = new IntentClassificationError('Failed');

        expect(error.code).toBe('INTENT_CLASSIFICATION_FAILED');
        expect(error.statusCode).toBe(500);
        expect(error.name).toBe('IntentClassificationError');
    });

    it('should use default message if not provided', () => {
        const error = new IntentClassificationError();
        expect(error.message).toBe('Failed to classify user intent');
    });
});

describe('ProductNotFoundError', () => {
    it('should include product identifier', () => {
        const error = new ProductNotFoundError('prod123', 'id');

        expect(error.code).toBe('PRODUCT_NOT_FOUND');
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('prod123');
        expect(error.details.identifier).toBe('prod123');
        expect(error.details.searchType).toBe('id');
    });
});

describe('LLMProviderError', () => {
    it('should have correct code and status', () => {
        const error = new LLMProviderError('API failed');

        expect(error.code).toBe('LLM_PROVIDER_FAILED');
        expect(error.statusCode).toBe(503);
    });
});

describe('LLMRateLimitError', () => {
    it('should include retryAfter', () => {
        const error = new LLMRateLimitError(30000);

        expect(error.code).toBe('LLM_RATE_LIMIT_EXCEEDED');
        expect(error.statusCode).toBe(429);
        expect(error.retryAfter).toBe(30000);
    });
});

describe('ValidationError', () => {
    it('should include field and reason', () => {
        const error = new ValidationError('email', 'Invalid format', 'bad@');

        expect(error.code).toBe('VALIDATION_FAILED');
        expect(error.statusCode).toBe(400);
        expect(error.details.field).toBe('email');
        expect(error.details.reason).toBe('Invalid format');
    });

    it('should hide sensitive values', () => {
        const error = new ValidationError('password', 'Too short');
        expect(error.details.value).toBe('[hidden]');
    });
});

describe('TimeoutError', () => {
    it('should include operation and timeout', () => {
        const error = new TimeoutError('LLM request', 30000);

        expect(error.code).toBe('TIMEOUT');
        expect(error.statusCode).toBe(504);
        expect(error.message).toContain('30000ms');
        expect(error.details.operation).toBe('LLM request');
    });
});

// ============================================
// UTILITY FUNCTION TESTS
// ============================================

describe('isRAGError', () => {
    it('should return true for RAGError instances', () => {
        expect(isRAGError(new RAGError('test', 'CODE'))).toBe(true);
        expect(isRAGError(new IntentClassificationError())).toBe(true);
        expect(isRAGError(new ProductNotFoundError('123'))).toBe(true);
    });

    it('should return false for non-RAGError', () => {
        expect(isRAGError(new Error('test'))).toBe(false);
        expect(isRAGError({ message: 'fake' })).toBe(false);
        expect(isRAGError(null)).toBe(false);
        expect(isRAGError(undefined)).toBe(false);
    });
});

describe('wrapError', () => {
    it('should return RAGError as-is', () => {
        const original = new ProductNotFoundError('123');
        const wrapped = wrapError(original, 'test');

        expect(wrapped).toBe(original);
    });

    it('should wrap standard Error', () => {
        const original = new Error('Something went wrong');
        const wrapped = wrapError(original, 'testContext');

        expect(wrapped).toBeInstanceOf(RAGError);
        expect(wrapped.code).toBe('UNKNOWN_ERROR');
        expect(wrapped.message).toBe('Something went wrong');
        expect(wrapped.details.context).toBe('testContext');
    });

    it('should wrap non-Error values', () => {
        const wrapped = wrapError('string error', 'test');

        expect(wrapped).toBeInstanceOf(RAGError);
        expect(wrapped.message).toBe('string error');
    });
});

describe('getUserFriendlyMessage', () => {
    it('should return Vietnamese message for known error codes', () => {
        const errors = [
            { error: new IntentClassificationError(), contains: 'chưa hiểu' },
            { error: new ProductNotFoundError('x'), contains: 'không tìm thấy' },
            { error: new LLMRateLimitError(), contains: 'quá tải' },
            { error: new ValidationError('x', 'y'), contains: 'chưa hợp lệ' }
        ];

        errors.forEach(({ error, contains }) => {
            const message = getUserFriendlyMessage(error);
            expect(message.toLowerCase()).toContain(contains);
        });
    });

    it('should return default message for unknown errors', () => {
        const error = new Error('Unknown');
        const message = getUserFriendlyMessage(error);

        expect(message).toContain('Xin lỗi');
        expect(message).toContain('thử lại');
    });
});
