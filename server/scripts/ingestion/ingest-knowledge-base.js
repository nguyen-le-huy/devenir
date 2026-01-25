import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializePinecone, getPineconeIndex } from '../../config/pinecone.js';
import { getEmbedding } from '../../services/rag/embeddings/embedding.service.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Path to Knowledge Base
const KB_PATH = path.resolve(__dirname, '../../../.agent/rag/KNOWLEDGE_BASE.md');
const PINECONE_EMBEDDING_DIMENSIONS = 1536;

/**
 * Split Markdown content into chunks based on headers
 * @param {string} content 
 */
function splitMarkdownByHeaders(content) {
    const lines = content.split('\n');
    const chunks = [];
    let currentChunk = {
        title: 'Introduction',
        content: []
    };

    for (const line of lines) {
        // Detect H1, H2, H3 headers
        if (line.startsWith('#')) {
            // Save previous chunk if it has content
            if (currentChunk.content.length > 0) {
                chunks.push({
                    title: currentChunk.title,
                    text: currentChunk.content.join('\n').trim()
                });
            }

            // Start new chunk
            // Remove # characters and trim
            const title = line.replace(/^#+\s+/, '').trim();
            currentChunk = {
                title: title,
                content: [line] // Keep header in content for context
            };
        } else {
            currentChunk.content.push(line);
        }
    }

    // Add last chunk
    if (currentChunk.content.length > 0) {
        chunks.push({
            title: currentChunk.title,
            text: currentChunk.content.join('\n').trim()
        });
    }

    // Filter out empty or too short chunks
    return chunks.filter(c => c.text.length > 50);
}

/**
 * Main ingestion function
 */
async function ingestKnowledgeBase() {
    console.log('🚀 Starting Knowledge Base Ingestion...');
    console.log(`📂 Reading file: ${KB_PATH}`);

    try {
        if (!fs.existsSync(KB_PATH)) {
            throw new Error(`File not found: ${KB_PATH}`);
        }

        const content = fs.readFileSync(KB_PATH, 'utf-8');
        const chunks = splitMarkdownByHeaders(content);

        console.log(`📝 Splitted into ${chunks.length} chunks`);

        // Initialize Pinecone
        await initializePinecone();
        const index = getPineconeIndex();

        const vectors = [];

        console.log('🧠 Generating embeddings...');
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await getEmbedding(chunk.text, PINECONE_EMBEDDING_DIMENSIONS);

            const vectorId = `kb_section_${i}`;

            vectors.push({
                id: vectorId,
                values: embedding,
                metadata: {
                    type: 'knowledge_base',
                    title: chunk.title,
                    text: chunk.text, // Store text for retrieval
                    source: 'KNOWLEDGE_BASE.md',
                    updated_at: new Date().toISOString()
                }
            });
            console.log(`  └─ Processed chunk: ${chunk.title}`);
        }

        if (vectors.length > 0) {
            console.log(`💾 Upserting ${vectors.length} vectors to Pinecone...`);
            await index.upsert(vectors);
            console.log('✅ Ingestion complete!');
        } else {
            console.log('⚠️ No chunks to ingest.');
        }

    } catch (error) {
        console.error('❌ Ingestion failed:', error);
        process.exit(1);
    }
}

// Run ingestion
ingestKnowledgeBase();
