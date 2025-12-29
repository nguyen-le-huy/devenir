/**
 * Migration Script: Sync tags from customerProfile.tags to root level tags
 * 
 * Purpose: Consolidate tags into a single location (root level) for consistency
 * Between manual admin updates and AI Intelligence features
 * 
 * Run: node server/scripts/migrate-customer-tags.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/UserModel.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devenir'

async function migrateCustomerTags() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find all users with tags in customerProfile but not in root
    const users = await User.find({
      'customerProfile.tags': { $exists: true, $ne: [] },
    })

    console.log(`\n📊 Found ${users.length} users with customerProfile.tags`)
    
    let updatedCount = 0
    let skippedCount = 0

    for (const user of users) {
      const profileTags = user.customerProfile?.tags || []
      const rootTags = user.tags || []

      // Merge tags (deduplicate)
      const mergedTags = Array.from(new Set([
        ...rootTags.map(t => t.toLowerCase()),
        ...profileTags.map(t => t.toLowerCase())
      ]))

      // Only update if there are new tags to merge
      if (mergedTags.length > rootTags.length) {
        user.tags = mergedTags
        await user.save()
        updatedCount++
        console.log(`✅ Updated user ${user.email}: ${rootTags.length} → ${mergedTags.length} tags`)
      } else {
        skippedCount++
      }
    }

    console.log(`\n📈 Migration Summary:`)
    console.log(`   ✅ Updated: ${updatedCount} users`)
    console.log(`   ⏭️  Skipped: ${skippedCount} users (already synced)`)
    console.log(`\n✨ Migration completed successfully!`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run migration
migrateCustomerTags()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
