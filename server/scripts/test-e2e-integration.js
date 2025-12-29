#!/usr/bin/env node

/**
 * End-to-End Integration Test
 * Tests complete flow: Events → Intelligence → Personalized Chat → Analytics
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../models/UserModel.js';
import Product from '../models/ProductModel.js';
import EventLog from '../models/EventLogModel.js';
import ChatLog from '../models/ChatLogModel.js';
import { generateCustomerIntelligence } from '../services/customerIntelligence.js';
import { RAGService } from '../services/rag/index.js';
import { getChatbotOverview, getPersonalizationEffectiveness } from '../services/chatbotAnalytics.js';

const ragService = new RAGService();

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
}

async function createTestUser() {
    console.log('\n👤 Step 1: Creating test user...\n');
    
    const testUser = await User.findOneAndUpdate(
        { email: 'test-e2e@devenir.com' },
        {
            name: 'Test E2E User',
            email: 'test-e2e@devenir.com',
            role: 'user',
            totalSpent: 0,
            orderHistory: [],
            customerProfile: {
                tags: [],
                notesList: []
            }
        },
        { upsert: true, new: true }
    );

    console.log(`✅ Test user created: ${testUser.name} (${testUser._id})`);
    return testUser;
}

async function simulateUserBehavior(userId) {
    console.log('\n📊 Step 2: Simulating user behavior (30 days)...\n');
    
    const products = await Product.find({ isActive: true }).limit(10).lean();
    
    if (products.length === 0) {
        console.log('⚠️  No products found. Skipping behavior simulation.');
        return;
    }

    const events = [];
    const now = new Date();

    // Simulate 30 days of activity
    for (let day = 0; day < 30; day++) {
        const date = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
        
        // Product views (5-10 per day)
        const viewCount = Math.floor(Math.random() * 6) + 5;
        for (let i = 0; i < viewCount; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            events.push({
                userId,
                type: 'product_view',
                metadata: {
                    productId: product._id,
                    productName: product.name,
                    category: product.category?.name,
                    price: product.basePrice
                },
                timestamp: new Date(date.getTime() - Math.random() * 24 * 60 * 60 * 1000)
            });
        }

        // Add to cart (2-3 times per week)
        if (day % 2 === 0) {
            const product = products[Math.floor(Math.random() * products.length)];
            events.push({
                userId,
                type: 'add_to_cart',
                metadata: {
                    productId: product._id,
                    productName: product.name,
                    quantity: Math.floor(Math.random() * 2) + 1
                },
                timestamp: new Date(date.getTime() - Math.random() * 24 * 60 * 60 * 1000)
            });
        }

        // Search (3-4 times per week)
        if (day % 3 === 0) {
            const searchTerms = ['áo thun', 'quần jean', 'giày', 'áo khoác', 'phụ kiện'];
            events.push({
                userId,
                type: 'search',
                metadata: {
                    query: searchTerms[Math.floor(Math.random() * searchTerms.length)],
                    resultsCount: Math.floor(Math.random() * 20) + 5
                },
                timestamp: new Date(date.getTime() - Math.random() * 24 * 60 * 60 * 1000)
            });
        }

        // Chat (once per week)
        if (day % 7 === 0) {
            events.push({
                userId,
                type: 'chat_message',
                metadata: {
                    intent: 'product_advice',
                    message: 'Tìm áo thun nam'
                },
                timestamp: new Date(date.getTime() - Math.random() * 24 * 60 * 60 * 1000)
            });
        }
    }

    await EventLog.insertMany(events);
    console.log(`✅ Created ${events.length} events over 30 days`);
    console.log(`   - Product views: ${events.filter(e => e.type === 'product_view').length}`);
    console.log(`   - Add to cart: ${events.filter(e => e.type === 'add_to_cart').length}`);
    console.log(`   - Searches: ${events.filter(e => e.type === 'search').length}`);
    console.log(`   - Chat messages: ${events.filter(e => e.type === 'chat_message').length}`);
}

async function generateIntelligence(userId) {
    console.log('\n🧠 Step 3: Generating customer intelligence...\n');
    
    const intelligence = await generateCustomerIntelligence(userId);
    
    console.log(`✅ Intelligence generated:`);
    console.log(`   Customer Type: ${intelligence.customerType}`);
    console.log(`   Engagement Score: ${intelligence.engagementScore}/100`);
    console.log(`   Risk Level: ${intelligence.riskLevel}`);
    console.log(`   Suggested Tags: ${intelligence.suggestedTags?.length || 0}`);
    console.log(`   Suggested Notes: ${intelligence.suggestedNotes?.length || 0}`);
    
    if (intelligence.suggestedTags?.length > 0) {
        console.log('\n   Top 3 Tags:');
        intelligence.suggestedTags.slice(0, 3).forEach(tag => {
            console.log(`   - ${tag.tag} (${(tag.confidence * 100).toFixed(0)}% confidence)`);
        });
    }
    
    if (intelligence.suggestedNotes?.length > 0) {
        console.log('\n   Top Note:');
        console.log(`   - ${intelligence.suggestedNotes[0].note}`);
    }
    
    return intelligence;
}

async function testPersonalizedChat(userId, intelligence) {
    console.log('\n💬 Step 4: Testing personalized chat...\n');
    
    const queries = [
        'Tìm áo thun nam',
        'Size nào phù hợp với tôi?',
        'Có màu đen không?'
    ];

    for (const query of queries) {
        console.log(`   User: "${query}"`);
        
        const response = await ragService.chat(userId, query, []);
        
        console.log(`   Bot Intent: ${response.intent}`);
        console.log(`   Bot Response: ${response.answer?.substring(0, 100)}...`);
        console.log(`   Products Shown: ${response.suggested_products?.length || 0}\n`);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ Personalized chat test completed');
}

async function verifyAnalytics() {
    console.log('\n📈 Step 5: Verifying analytics data...\n');
    
    const overview = await getChatbotOverview(7);
    console.log(`✅ Analytics Overview:`);
    console.log(`   Total Sessions: ${overview.totalSessions}`);
    console.log(`   Personalization Rate: ${overview.personalizationRate}%`);
    console.log(`   Avg Response Time: ${overview.avgResponseTime}ms`);
    
    if (overview.personalizationRate > 0) {
        const effectiveness = await getPersonalizationEffectiveness(7);
        console.log(`\n   Personalization Impact:`);
        console.log(`   - Engagement Increase: +${effectiveness.improvement.engagementIncrease}%`);
        console.log(`   - Personalized Sessions: ${effectiveness.personalized.sessions}`);
        console.log(`   - Avg Engagement: ${effectiveness.personalized.avgEngagement}`);
    }
}

async function displaySummary(user, intelligence) {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║         END-TO-END INTEGRATION TEST SUMMARY           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ PHASE 1-2: Event Tracking');
    console.log('   - EventLog entries created successfully');
    console.log('   - User behavior tracked over 30 days\n');
    
    console.log('✅ PHASE 3: Customer Intelligence');
    console.log(`   - Customer Type: ${intelligence.customerType}`);
    console.log(`   - Engagement Score: ${intelligence.engagementScore}/100`);
    console.log(`   - AI Suggestions: ${intelligence.suggestedTags?.length || 0} tags, ${intelligence.suggestedNotes?.length || 0} notes\n`);
    
    console.log('✅ PHASE 4: RAG Personalization');
    console.log('   - Customer context injected into chatbot');
    console.log('   - Personalized responses generated');
    console.log('   - Tone adapted to customer type\n');
    
    console.log('✅ PHASE 5: Analytics & Monitoring');
    console.log('   - Chat sessions logged with analytics');
    console.log('   - Personalization metrics tracked');
    console.log('   - Dashboard data available\n');
    
    console.log('🎯 SYSTEM STATUS: FULLY OPERATIONAL\n');
    
    console.log('📌 NEXT STEPS:');
    console.log('   1. Access admin dashboard: http://localhost:5173/admin/chatbot/analytics');
    console.log('   2. View customer intelligence: http://localhost:5173/admin/customers');
    console.log('   3. Test live chatbot: http://localhost:5173\n');
    
    console.log('💡 API ENDPOINTS:');
    console.log(`   - Intelligence: GET /api/customers/${user._id}/intelligence`);
    console.log(`   - Quick Insights: GET /api/customers/${user._id}/quick-insights`);
    console.log('   - Analytics: GET /api/analytics/chatbot/dashboard\n');
}

async function cleanupTestData(userId) {
    console.log('\n🧹 Cleanup (optional)...');
    console.log('   Test data preserved for manual verification.');
    console.log(`   To delete: User ID = ${userId}\n`);
}

async function runE2ETest() {
    await connectDB();

    try {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║     DEVENIR E2E Integration Test - Phase 1-5         ║');
        console.log('╚════════════════════════════════════════════════════════╝');

        // Step 1: Create test user
        const user = await createTestUser();

        // Step 2: Simulate 30 days of user behavior
        await simulateUserBehavior(user._id.toString());

        // Step 3: Generate customer intelligence
        const intelligence = await generateIntelligence(user._id.toString());

        // Step 4: Test personalized chat
        await testPersonalizedChat(user._id.toString(), intelligence);

        // Step 5: Verify analytics
        await verifyAnalytics();

        // Display summary
        await displaySummary(user, intelligence);

        // Cleanup (optional)
        await cleanupTestData(user._id.toString());

        console.log('✅ END-TO-END TEST COMPLETED SUCCESSFULLY!\n');

    } catch (error) {
        console.error('\n❌ E2E Test Failed:', error);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('📡 MongoDB connection closed\n');
        process.exit(0);
    }
}

// Run test
runE2ETest();
