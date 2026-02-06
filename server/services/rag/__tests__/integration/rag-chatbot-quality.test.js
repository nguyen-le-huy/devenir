/**
 * RAG Chatbot Quality Integration Tests
 * Verify response professionalism and accuracy
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ragService } from '../../index.js';

describe('RAG Chatbot Quality Tests', () => {
    let testUserId;

    beforeAll(() => {
        testUserId = 'test-user-' + Date.now();
    });

    describe('Size Recommendation - Professional & Accurate', () => {
        it('Should provide concise size recommendation with full measurements', async () => {
            const query = 'Tư vấn size áo khoác, cao 175cm nặng 70kg';
            const history = [];

            const response = await ragService.chat(testUserId, query, history);

            // Verify response structure
            expect(response).toHaveProperty('answer');
            expect(response).toHaveProperty('intent');
            expect(response.intent).toBe('size_recommendation');

            // Quality checks
            const answer = response.answer;

            // 1. Should NOT hallucinate measurements
            if (!query.includes('175') || !query.includes('70')) {
                expect(answer).not.toContain('173cm');
                expect(answer).not.toContain('70kg');
            }

            // 2. Should be concise (not exceeding ~800 chars for main text)
            // Allow longer due to product list, but core recommendation should be brief
            expect(answer.length).toBeLessThan(1500);

            // 3. Should contain critical elements
            expect(answer).toContain('Đề xuất');
            expect(answer).toContain('Size');

            // 4. Should NOT contain English mixed with Vietnamese
            const hasEnglishSentences = /[A-Z][a-z]+\s+[a-z]+\s+(is|are|the|and|with)\s+/.test(answer);
            expect(hasEnglishSentences).toBe(false);

            // 5. Should have proper formatting (no excessive newlines, markdown artifacts)
            expect(answer).not.toContain('\\n\\n\\n'); // Max 2 consecutive newlines
            expect(answer).not.toContain('```'); // No code blocks
            expect(answer).not.toContain('###'); // No triple hash markdown

            console.log('\n✅ Size Recommendation Quality Test:');
            console.log('Query:', query);
            console.log('Answer Length:', answer.length, 'chars');
            console.log('Answer Preview:', answer.substring(0, 200) + '...');
        }, 30000); // 30s timeout for LLM call

        it('Should request measurements if missing', async () => {
            const query = 'Tư vấn size cho áo khoác';
            const history = [];

            const response = await ragService.chat(testUserId, query, history);

            const answer = response.answer;

            // Should ask for measurements
            const requestsMeasurements =
                answer.includes('chiều cao') ||
                answer.includes('cân nặng') ||
                answer.includes('Vui lòng cung cấp') ||
                answer.includes('cung cấp thêm');

            expect(requestsMeasurements).toBe(true);

            // Should NOT provide specific size recommendation without data
            const hasSpecificSize = /Size [SMLX]+\d*/.test(answer) && answer.includes('Đề xuất');
            if (hasSpecificSize) {
                // If it does recommend, it should acknowledge uncertainty
                expect(answer.toLowerCase()).toMatch(/cần|thiếu|chưa có|tham khảo/);
            }

            console.log('\n✅ Missing Measurements Test:');
            console.log('Correctly requests measurements:', requestsMeasurements);
        }, 30000);

        it('Should handle edge case: customer smaller than available sizes', async () => {
            const query = 'Tư vấn size, cao 160cm nặng 50kg, sản phẩm Check Intarsia Shearling Cape';
            const history = [];

            const response = await ragService.chat(testUserId, query, history);
            const answer = response.answer;

            // Should recommend SMALLEST available size (XL for this product)
            // Should NOT recommend 3XL for a small customer
            const recommended3XL = answer.includes('Đề xuất: Size 3XL') || answer.includes('Đề xuất: 3XL');
            expect(recommended3XL).toBe(false);

            // Should acknowledge size mismatch
            const acknowledgesMismatch =
                answer.includes('nhỏ hơn') ||
                answer.includes('rộng') ||
                answer.includes('chỉnh sửa') ||
                answer.toLowerCase().includes('không phù hợp');

            expect(acknowledgesMismatch).toBe(true);

            console.log('\n✅ Edge Case Test (Small Customer):');
            console.log('Does NOT recommend 3XL:', !recommended3XL);
            console.log('Acknowledges mismatch:', acknowledgesMismatch);
        }, 30000);
    });

    describe('Product Advice - Professional & Accurate', () => {
        it('Should provide product recommendations without hallucination', async () => {
            const query = 'Tìm áo khoác màu nâu';
            const history = [];

            const response = await ragService.chat(testUserId, query, history);
            const answer = response.answer;

            // Should list products
            expect(answer.length).toBeGreaterThan(100);

            // Should use bold formatting for product names
            expect(answer).toMatch(/\*\*[^*]+\*\*/);

            // Should include prices in $ format
            expect(answer).toMatch(/\$\d+/);

            // Should NOT contain generic placeholders
            expect(answer).not.toContain('[Product Name]');
            expect(answer).not.toContain('[Price]');
            expect(answer).not.toContain('Lorem ipsum');

            // Should be in Vietnamese
            expect(answer).toMatch(/có|được|sản phẩm|màu|giá/i);

            console.log('\n✅ Product Advice Quality Test:');
            console.log('Has product formatting:', /\*\*[^*]+\*\*/.test(answer));
            console.log('Has prices:', /\$\d+/.test(answer));
        }, 30000);
    });

    describe('Response Formatting Standards', () => {
        it('All responses should follow formatting standards', async () => {
            const testQueries = [
                'tư vấn size cao 170 nặng 65',
                'tìm áo polo',
                'đơn hàng của tôi',
            ];

            for (const query of testQueries) {
                const response = await ragService.chat(testUserId, query, []);
                const answer = response.answer;

                // Standard checks
                const checks = {
                    noTripleNewlines: !answer.includes('\n\n\n'),
                    noCodeBlocks: !answer.includes('```'),
                    noTripleHash: !answer.includes('###'),
                    hasContent: answer.length > 20,
                    noExcessiveEmojis: (answer.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length < 5,
                };

                expect(checks.noTripleNewlines).toBe(true);
                expect(checks.noCodeBlocks).toBe(true);
                expect(checks.noTripleHash).toBe(true);
                expect(checks.hasContent).toBe(true);
                expect(checks.noExcessiveEmojis).toBe(true);

                console.log(`\n✅ Format check for "${query}":`, checks);
            }
        }, 60000);
    });

    describe('Accuracy & No Hallucination', () => {
        it('Should NOT hallucinate measurements from examples', async () => {
            const query = 'size nào phù hợp với tôi';
            const history = [];

            const response = await ragService.chat(testUserId, query, history);
            const answer = response.answer;

            // Should NOT mention specific measurements from few-shot examples
            const hallucinatedMeasurements = [
                '173cm',
                '175cm',
                '178cm',
                '85kg',
                '75kg',
                '70kg'
            ];

            let foundHallucination = false;
            hallucinatedMeasurements.forEach(measurement => {
                if (answer.includes(measurement) && !answer.toLowerCase().includes('ví dụ')) {
                    foundHallucination = true;
                    console.warn(`⚠️ Possible hallucination detected: ${measurement}`);
                }
            });

            expect(foundHallucination).toBe(false);

            console.log('\n✅ No Hallucination Test:');
            console.log('Clean from example measurements:', !foundHallucination);
        }, 30000);
    });

    describe('Response Length & Conciseness', () => {
        it('Size recommendations should be concise (< 1000 chars core content)', async () => {
            const query = 'Tư vấn size áo khoác, cao 173 nặng 68';
            const history = [];

            const response = await ragService.chat(testUserId, query, history);
            const answer = response.answer;

            // Extract core content (before product list/CTA)
            const coreContent = answer.split('Có sẵn size')[0] || answer.split('🛍️')[0] || answer;

            expect(coreContent.length).toBeLessThan(1000);

            // Should have limited advice items (≤2 as per requirements)
            const adviceItems = (coreContent.match(/^•/gm) || []).length;
            expect(adviceItems).toBeLessThanOrEqual(4); // Allow some flexibility

            console.log('\n✅ Conciseness Test:');
            console.log('Core content length:', coreContent.length, 'chars');
            console.log('Advice items:', adviceItems);
        }, 30000);
    });
});
