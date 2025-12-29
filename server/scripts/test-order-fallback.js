import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { generateCustomerIntelligence } from '../services/customerIntelligence.js';
import User from '../models/UserModel.js';
import Order from '../models/OrderModel.js';

dotenv.config();

async function testOrderFallback() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected\n');

    // Find a real customer with orders (Dung Nguyen)
    const customer = await User.findOne({ email: 'dung1322003@gmail.com' });
    
    if (!customer) {
      console.log('❌ Customer not found. Using first customer with orders...');
      const orderWithUser = await Order.findOne().populate('user');
      if (!orderWithUser) {
        console.log('❌ No orders found in database');
        process.exit(1);
      }
      customer = orderWithUser.user;
    }

    console.log(`🔍 Testing Intelligence for: ${customer.name || customer.email}`);
    console.log(`   Customer ID: ${customer._id}`);

    // Check order count
    const orderCount = await Order.countDocuments({ user: customer._id });
    console.log(`   Orders: ${orderCount}\n`);

    // Generate intelligence
    console.log('🧠 Generating Customer Intelligence...\n');
    const intelligence = await generateCustomerIntelligence(customer._id);

    // Display results
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║       CUSTOMER INTELLIGENCE REPORT           ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    console.log(`📊 Data Source: ${intelligence.behavior.dataSource || 'eventlogs'}`);
    console.log(`📅 Analysis Period: ${intelligence.behavior.period.days} days\n`);

    console.log('👤 CUSTOMER TYPE:');
    console.log(`   ${intelligence.insights.customerType}\n`);

    console.log('📈 METRICS:');
    if (intelligence.behavior.dataSource === 'orders') {
      const { totalOrders, totalSpent, avgOrderValue, recency } = intelligence.behavior.shopping.purchaseHistory;
      console.log(`   Total Orders: ${totalOrders}`);
      console.log(`   Total Spent: $${totalSpent.toLocaleString()}`);
      console.log(`   AOV: $${avgOrderValue.toFixed(2)}`);
      console.log(`   Days Since Last Order: ${recency}`);
      console.log(`   Engagement Score: ${intelligence.behavior.engagement.engagementScore}/100`);
    } else {
      console.log(`   Total Events: ${intelligence.behavior.totalEvents}`);
      console.log(`   Engagement Score: ${intelligence.behavior.engagement.engagementScore}/100`);
    }
    console.log(`   Risk Level: ${intelligence.insights.riskLevel.level} (${intelligence.insights.riskLevel.reason})\n`);

    console.log('🏷️  SUGGESTED TAGS:');
    if (intelligence.suggestions.tags.length > 0) {
      intelligence.suggestions.tags.forEach(tag => {
        console.log(`   ✓ ${tag.tag}`);
        console.log(`     Reason: ${tag.reason}`);
        console.log(`     Confidence: ${(tag.confidence * 100).toFixed(0)}%`);
      });
    } else {
      console.log('   (No tags suggested)');
    }
    console.log();

    console.log('📝 SUGGESTED NOTES:');
    if (intelligence.suggestions.notes.length > 0) {
      intelligence.suggestions.notes.forEach(note => {
        const priorityEmoji = note.priority === 'high' ? '🔴' : note.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${priorityEmoji} [${note.type}] ${note.content}`);
      });
    } else {
      console.log('   (No notes suggested)');
    }
    console.log();

    console.log('💡 RECOMMENDED ACTION:');
    console.log(`   ${intelligence.insights.nextBestAction.action}`);
    console.log(`   Message: ${intelligence.insights.nextBestAction.message}`);
    console.log(`   Priority: ${intelligence.insights.nextBestAction.priority}\n`);

    console.log('✅ TEST COMPLETED SUCCESSFULLY!\n');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed');
  }
}

testOrderFallback();
