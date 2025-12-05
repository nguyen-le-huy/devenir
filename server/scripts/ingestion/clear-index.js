import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { initializePinecone, getPineconeIndex } from '../../config/pinecone.js';

/**
 * Clear all vectors from Pinecone index
 */
async function clearIndex() {
    try {
        console.log('🔄 Initializing Pinecone...');
        await initializePinecone();

        const index = getPineconeIndex();

        console.log('🗑️ Clearing all vectors from index...');

        // Delete all vectors
        await index.deleteAll();

        console.log('✅ Index cleared successfully!');

    } catch (error) {
        console.error('❌ Error clearing index:', error);
    } finally {
        process.exit(0);
    }
}

// Confirm before clearing
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
    clearIndex();
} else {
    console.log('⚠️ This will delete ALL vectors from the Pinecone index!');
    console.log('To confirm, run: node clear-index.js --confirm');
    process.exit(0);
}
