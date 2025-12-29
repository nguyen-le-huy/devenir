import dotenv from 'dotenv';
import mongoose from 'mongoose';
import EventLog from '../models/EventLogModel.js';
import ChatLog from '../models/ChatLogModel.js';

dotenv.config();

async function checkTracking() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected\n');

    // Count EventLog
    const eventCount = await EventLog.countDocuments();
    console.log(`📊 EventLog Entries: ${eventCount}`);

    if (eventCount > 0) {
      // Recent events
      const recentEvents = await EventLog.find()
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();
      
      console.log('\n📝 Recent 5 Events:');
      recentEvents.forEach(e => {
        console.log(`   - ${e.type} | ${e.userId || 'Guest'} | ${new Date(e.timestamp).toLocaleString()}`);
      });

      // Event types breakdown
      const eventTypes = await EventLog.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n📈 Event Types:');
      eventTypes.forEach(t => {
        console.log(`   - ${t._id}: ${t.count}`);
      });

      // Users with most events
      const topUsers = await EventLog.aggregate([
        { $match: { userId: { $exists: true, $ne: null } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      console.log('\n👥 Top 5 Users by Events:');
      topUsers.forEach(u => {
        console.log(`   - ${u._id}: ${u.count} events`);
      });
    }

    // Count ChatLog
    const chatCount = await ChatLog.countDocuments();
    console.log(`\n💬 ChatLog Sessions: ${chatCount}`);

    if (chatCount > 0) {
      const recentChats = await ChatLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      
      console.log('\n📝 Recent 5 Chat Sessions:');
      recentChats.forEach(c => {
        console.log(`   - ${c.sessionId} | ${c.userId || 'Guest'} | ${c.messages?.length || 0} messages`);
      });
    }

    console.log('\n✅ Tracking Status Check Complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkTracking();
