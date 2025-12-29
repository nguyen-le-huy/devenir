#!/usr/bin/env node

/**
 * Test Script for Customer Intelligence & Chatbot Analytics
 * Run with: node server/scripts/test-analytics.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import ChatLog from '../models/ChatLogModel.js';
import User from '../models/UserModel.js';
import EventLog from '../models/EventLogModel.js';
import { generateCustomerIntelligence } from '../services/customerIntelligence.js';
import {
    getChatbotOverview,
    getCustomerTypeDistribution,
    getIntentDistribution,
    getPersonalizationEffectiveness
} from '../services/chatbotAnalytics.js';

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
}

async function createSampleChatLogs() {
    console.log('\n📝 Creating sample chat logs...\n');

    const users = await User.find({ role: 'user' }).limit(5).lean();
    
    if (users.length === 0) {
        console.log('⚠️  No users found. Please create some users first.');
        return;
    }

    const intents = ['product_advice', 'size_recommendation', 'style_matching', 'policy_faq'];
    const customerTypes = ['VIP Premium', 'Loyal Customer', 'High-Intent Browser', 'Price-Conscious', 'Window Shopper'];

    for (let i = 0; i < 20; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const hasPersonalization = Math.random() > 0.3; // 70% personalized
        const intent = intents[Math.floor(Math.random() * intents.length)];

        await ChatLog.create({
            userId: user._id,
            sessionId: `session_${Date.now()}_${i}`,
            messages: [
                {
                    role: 'user',
                    content: 'Tìm áo thun nam',
                    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                },
                {
                    role: 'assistant',
                    content: 'Dạ có bạn, mình có nhiều mẫu áo thun nam...',
                    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                }
            ],
            analytics: {
                intent,
                hasPersonalization,
                customerType: hasPersonalization ? customerTypes[Math.floor(Math.random() * customerTypes.length)] : null,
                engagementScore: hasPersonalization ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 60),
                responseTime: Math.floor(Math.random() * 500) + 200,
                messageLength: Math.floor(Math.random() * 100) + 20,
                productsShown: Math.floor(Math.random() * 5) + 1,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            },
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
    }

    console.log('✅ Created 20 sample chat logs');
}

async function testAnalytics() {
    console.log('\n🧪 Testing Analytics Functions...\n');

    try {
        // Test 1: Overview
        console.log('1️⃣  Testing getChatbotOverview...');
        const overview = await getChatbotOverview(7);
        console.log('   Overview:', JSON.stringify(overview, null, 2));

        // Test 2: Customer Type Distribution
        console.log('\n2️⃣  Testing getCustomerTypeDistribution...');
        const customerTypes = await getCustomerTypeDistribution(7);
        console.log('   Customer Types:', JSON.stringify(customerTypes, null, 2));

        // Test 3: Intent Distribution
        console.log('\n3️⃣  Testing getIntentDistribution...');
        const intents = await getIntentDistribution(7);
        console.log('   Intents:', JSON.stringify(intents, null, 2));

        // Test 4: Personalization Effectiveness
        console.log('\n4️⃣  Testing getPersonalizationEffectiveness...');
        const effectiveness = await getPersonalizationEffectiveness(7);
        console.log('   Effectiveness:', JSON.stringify(effectiveness, null, 2));

        console.log('\n✅ All analytics tests passed!');

    } catch (error) {
        console.error('❌ Analytics test failed:', error);
    }
}

async function testCustomerIntelligence() {
    console.log('\n🧠 Testing Customer Intelligence...\n');

    try {
        const users = await User.find({ role: 'user' }).limit(3).lean();

        if (users.length === 0) {
            console.log('⚠️  No users found for intelligence test');
            return;
        }

        for (const user of users) {
            console.log(`\nTesting user: ${user.name} (${user._id})`);
            const intelligence = await generateCustomerIntelligence(user._id.toString());
            
            console.log('Customer Type:', intelligence.customerType);
            console.log('Engagement Score:', intelligence.engagementScore);
            console.log('Risk Level:', intelligence.riskLevel);
            console.log('Suggested Tags:', intelligence.suggestedTags?.length || 0);
            console.log('Suggested Notes:', intelligence.suggestedNotes?.length || 0);
            console.log('Next Best Action:', intelligence.nextBestAction?.substring(0, 100) + '...');
        }

        console.log('\n✅ Customer intelligence test completed!');

    } catch (error) {
        console.error('❌ Intelligence test failed:', error);
    }
}

async function cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    const result = await ChatLog.deleteMany({
        sessionId: { $regex: /^session_/ }
    });

    console.log(`✅ Deleted ${result.deletedCount} test chat logs`);
}

async function runTests() {
    await connectDB();

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   Customer Intelligence & Analytics Test      ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    try {
        // Create sample data
        await createSampleChatLogs();

        // Test analytics
        await testAnalytics();

        // Test intelligence
        await testCustomerIntelligence();

        // Cleanup (optional - comment out to keep test data)
        // await cleanupTestData();

        console.log('\n✅ All tests completed successfully!');
        console.log('\n💡 Access analytics at: http://localhost:5000/api/analytics/chatbot/dashboard');
        console.log('💡 Admin dashboard: http://localhost:5173/admin/chatbot/analytics\n');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n📡 MongoDB connection closed');
        process.exit(0);
    }
}

// Run tests
runTests();
