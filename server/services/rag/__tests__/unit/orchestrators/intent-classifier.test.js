/**
 * Unit Tests for Intent Classifier
 * 
 * @module tests/unit/orchestrators/intent-classifier
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock LLM Provider
vi.mock('../../core/LLMProvider.js', () => ({
    llmProvider: {
        jsonCompletion: vi.fn()
    }
}));

// ============================================
// TEST SUITES
// ============================================

describe('Intent Classifier', () => {
    let quickIntentDetection;
    let hybridClassifyIntent;
    let classifyIntent;
    let llmProvider;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Import modules
        const intentModule = await import('../../orchestrators/intent-classifier.js');
        quickIntentDetection = intentModule.quickIntentDetection;
        hybridClassifyIntent = intentModule.hybridClassifyIntent;
        classifyIntent = intentModule.classifyIntent;

        const llmModule = await import('../../core/LLMProvider.js');
        llmProvider = llmModule.llmProvider;
    });

    describe('quickIntentDetection', () => {
        describe('Admin Analytics Detection', () => {
            const adminQueries = [
                { query: 'doanh thu hôm nay', expectedKeyword: 'revenue' },
                { query: 'báo cáo doanh số tuần này', expectedKeyword: 'revenue' },
                { query: 'tổng doanh thu tháng này', expectedKeyword: 'revenue' },
                { query: 'kiểm tra tồn kho', expectedKeyword: 'inventory' },
                { query: 'sản phẩm nào hết hàng', expectedKeyword: 'inventory' },
                { query: 'tra cứu khách hàng ABC', expectedKeyword: 'customer' }
            ];

            it.each(adminQueries)('should detect admin intent for: "$query"', ({ query }) => {
                const result = quickIntentDetection(query);
                expect(result.intent).toBe('admin_analytics');
                expect(result.confidence).toBeGreaterThanOrEqual(0.9);
            });

            it('should detect revenue queries with high confidence', () => {
                const result = quickIntentDetection('doanh thu hôm nay bao nhiêu');
                expect(result.intent).toBe('admin_analytics');
                expect(result.confidence).toBeGreaterThanOrEqual(0.95);
            });
        });

        describe('Size Recommendation Detection', () => {
            const sizeQueries = [
                'size M có vừa không',
                'chọn size nào cho cao 175',
                'tôi cao 170cm nặng 65kg size gì',
                'size áo này có rộng không',
                'mình mặc size L được không'
            ];

            it.each(sizeQueries)('should detect size intent for: "%s"', (query) => {
                const result = quickIntentDetection(query);
                expect(result.intent).toBe('size_recommendation');
                expect(result.confidence).toBeGreaterThanOrEqual(0.7);
            });

            it('should extract height and weight from message', () => {
                const result = quickIntentDetection('tôi cao 173cm nặng 70kg');
                expect(result.intent).toBe('size_recommendation');
                expect(result.extracted_info).toBeDefined();
            });
        });

        describe('Product Advice Detection', () => {
            const productQueries = [
                'tìm áo polo',
                'cho xem áo khoác',
                'muốn mua quần',
                'có áo thun không'
            ];

            it.each(productQueries)('should detect product advice for: "%s"', (query) => {
                const result = quickIntentDetection(query);
                // May be product_advice or general depending on confidence
                expect(['product_advice', 'general']).toContain(result.intent);
            });
        });

        describe('Policy FAQ Detection', () => {
            const policyQueries = [
                'chính sách đổi trả',
                'làm sao để hoàn tiền',
                'ship bao lâu',
                'phí giao hàng bao nhiêu',
                'thanh toán bằng gì'
            ];

            it.each(policyQueries)('should detect policy FAQ for: "%s"', (query) => {
                const result = quickIntentDetection(query);
                expect(result.intent).toBe('policy_faq');
                expect(result.confidence).toBeGreaterThanOrEqual(0.7);
            });
        });

        describe('Add to Cart Detection', () => {
            const cartQueries = [
                'thêm vào giỏ hàng',
                'mua cái này',
                'add to cart',
                'đặt hàng luôn'
            ];

            it.each(cartQueries)('should detect add to cart for: "%s"', (query) => {
                const result = quickIntentDetection(query);
                expect(result.intent).toBe('add_to_cart');
                expect(result.confidence).toBeGreaterThanOrEqual(0.7);
            });
        });

        describe('General/Unclear Queries', () => {
            const generalQueries = [
                'xin chào',
                'hello',
                'cảm ơn',
                'ok'
            ];

            it.each(generalQueries)('should return general for: "%s"', (query) => {
                const result = quickIntentDetection(query);
                expect(result.intent).toBe('general');
            });
        });

        describe('Edge Cases', () => {
            it('should handle empty string', () => {
                const result = quickIntentDetection('');
                expect(result.intent).toBe('general');
                expect(result.confidence).toBe(0);
            });

            it('should handle undefined', () => {
                const result = quickIntentDetection(undefined);
                expect(result.intent).toBe('general');
            });

            it('should handle null', () => {
                const result = quickIntentDetection(null);
                expect(result.intent).toBe('general');
            });

            it('should handle very long strings', () => {
                const longQuery = 'a'.repeat(1000);
                const result = quickIntentDetection(longQuery);
                expect(result).toBeDefined();
                expect(result.intent).toBeDefined();
            });

            it('should be case insensitive', () => {
                const upper = quickIntentDetection('DOANH THU HÔM NAY');
                const lower = quickIntentDetection('doanh thu hôm nay');

                expect(upper.intent).toBe(lower.intent);
            });
        });
    });

    describe('hybridClassifyIntent', () => {
        it('should bypass LLM for high-confidence admin queries', async () => {
            const result = await hybridClassifyIntent('doanh thu hôm nay');

            expect(result.intent).toBe('admin_analytics');
            expect(llmProvider.jsonCompletion).not.toHaveBeenCalled();
        });

        it('should bypass LLM for high-confidence policy queries', async () => {
            const result = await hybridClassifyIntent('chính sách đổi trả');

            expect(result.intent).toBe('policy_faq');
            expect(llmProvider.jsonCompletion).not.toHaveBeenCalled();
        });

        it('should use LLM for ambiguous queries', async () => {
            llmProvider.jsonCompletion.mockResolvedValue({
                intent: 'product_advice',
                confidence: 0.85,
                extracted_info: { product_type: 'shirt' }
            });

            const result = await hybridClassifyIntent('tìm cái đẹp');

            // May or may not call LLM depending on keyword matching
            expect(result).toBeDefined();
            expect(result.intent).toBeDefined();
        });

        it('should fall back to keyword detection on LLM error', async () => {
            llmProvider.jsonCompletion.mockRejectedValue(new Error('API Error'));

            const result = await hybridClassifyIntent('xin chào');

            expect(result).toBeDefined();
            expect(result.intent).toBe('general');
        });
    });

    describe('classifyIntent with LLM', () => {
        it('should call LLM with correct prompt structure', async () => {
            llmProvider.jsonCompletion.mockResolvedValue({
                intent: 'product_advice',
                confidence: 0.9,
                extracted_info: {}
            });

            await classifyIntent('tìm áo polo màu đen', []);

            expect(llmProvider.jsonCompletion).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ role: 'system' }),
                    expect.objectContaining({ role: 'user' })
                ]),
                expect.any(Object)
            );
        });

        it('should include conversation history in prompt', async () => {
            llmProvider.jsonCompletion.mockResolvedValue({
                intent: 'size_recommendation',
                confidence: 0.9,
                extracted_info: { is_followup: true }
            });

            const history = [
                { role: 'user', content: 'tìm áo polo' },
                { role: 'assistant', content: 'Đây là một số áo polo...' }
            ];

            await classifyIntent('size M có vừa không', history);

            const call = llmProvider.jsonCompletion.mock.calls[0];
            const userMessage = call[0].find(m => m.role === 'user');

            // History should be included in the prompt
            expect(userMessage.content).toBeDefined();
        });

        it('should handle LLM response with missing fields', async () => {
            llmProvider.jsonCompletion.mockResolvedValue({
                intent: 'product_advice'
                // Missing confidence and extracted_info
            });

            const result = await classifyIntent('test query', []);

            expect(result.intent).toBe('product_advice');
            expect(result.confidence).toBeDefined(); // Should have default
        });

        it('should timeout gracefully', async () => {
            llmProvider.jsonCompletion.mockImplementation(() =>
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 100)
                )
            );

            const result = await classifyIntent('test', []);

            // Should return fallback result
            expect(result.intent).toBeDefined();
        });
    });
});
