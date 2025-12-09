/**
 * Image Embedding Service using OpenAI
 * 1. GPT-4 Vision describes the image
 * 2. text-embedding-3-small creates embedding (512 dims)
 * 
 * Uses existing OPENAI_API_KEY from .env
 */

import OpenAI from 'openai';

// Initialize OpenAI client (will use OPENAI_API_KEY from env)
let openaiClient = null;

function getOpenAI() {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    return openaiClient;
}

// Embedding configuration
const EMBEDDING_MODEL = 'text-embedding-3-small';
const TARGET_DIMS = 512; // Matches visual-search Pinecone index

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 200ms between requests

/**
 * Wait for rate limit
 */
async function waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve =>
            setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
        );
    }
    lastRequestTime = Date.now();
}

/**
 * Fashion-specific image description prompt
 */
const DESCRIPTION_PROMPT = `Describe this fashion product image in detail for search purposes. Include:
- Product type (shirt, jacket, bag, scarf, etc.)
- Color(s) - be specific (navy blue, sand beige, etc.)
- Material/fabric if visible (cotton, wool, cashmere, leather, etc.)
- Pattern (solid, check, stripe, etc.)
- Style characteristics (casual, formal, relaxed fit, etc.)
- Key visual features

Keep the description concise but comprehensive, around 50-80 words.`;

/**
 * Describe an image using GPT-4 Vision
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} - Description of the image
 */
async function describeImage(imageUrl) {
    const openai = getOpenAI();

    await waitForRateLimit();

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cheaper than gpt-4-vision, still good quality
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: DESCRIPTION_PROMPT },
                    { type: 'image_url', image_url: { url: imageUrl } }
                ]
            }
        ],
        max_tokens: 150
    });

    return response.choices[0]?.message?.content || '';
}

/**
 * Describe an image from base64 using GPT-4 Vision
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} - Description of the image
 */
async function describeImageFromBase64(base64Image) {
    const openai = getOpenAI();

    await waitForRateLimit();

    // Ensure proper data URL format
    let dataUrl = base64Image;
    if (!base64Image.startsWith('data:')) {
        dataUrl = `data:image/jpeg;base64,${base64Image}`;
    }

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: DESCRIPTION_PROMPT },
                    { type: 'image_url', image_url: { url: dataUrl } }
                ]
            }
        ],
        max_tokens: 150
    });

    return response.choices[0]?.message?.content || '';
}

/**
 * Get embedding for text using OpenAI
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 512-dimensional embedding
 */
async function getTextEmbedding(text) {
    const openai = getOpenAI();

    await waitForRateLimit();

    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: TARGET_DIMS  // OpenAI supports custom dimensions!
    });

    return response.data[0].embedding;
}

/**
 * Get embedding for an image URL
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<number[]>} - 512-dimensional embedding
 */
export async function getImageEmbedding(imageUrl) {
    try {
        // Step 1: Describe the image
        const description = await describeImage(imageUrl);

        if (!description) {
            throw new Error('Failed to generate image description');
        }

        // Step 2: Get embedding of the description
        const embedding = await getTextEmbedding(description);

        return embedding;
    } catch (error) {
        console.error(`Error getting embedding for ${imageUrl}:`, error.message);
        throw error;
    }
}

/**
 * Get embedding from base64 image
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<number[]>} - 512-dimensional embedding
 */
export async function getImageEmbeddingFromBase64(base64Image) {
    try {
        // Step 1: Describe the image
        const description = await describeImageFromBase64(base64Image);

        if (!description) {
            throw new Error('Failed to generate image description');
        }

        // Step 2: Get embedding of the description
        const embedding = await getTextEmbedding(description);

        return embedding;
    } catch (error) {
        console.error('Error getting embedding from base64:', error.message);
        throw error;
    }
}

export const CLIP_DIMENSIONS = TARGET_DIMS;
