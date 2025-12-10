/**
 * Google Cloud Vision API Product Search Service
 * 
 * Provides visual search functionality using Google's Vision API
 * with the apparel-v2 model optimized for fashion items.
 */

import vision from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const LOCATION = process.env.GOOGLE_LOCATION || 'us-west1';
const PRODUCT_SET_ID = process.env.GOOGLE_PRODUCT_SET_ID || 'fashion-set-01';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Initialize clients lazily
let imageAnnotatorClient = null;
let productSearchClient = null;
let initialized = false;

/**
 * Initialize Google Vision clients
 */
export async function initGoogleVision() {
    if (initialized) {
        return { success: true };
    }

    try {
        // Validate environment
        if (!PROJECT_ID || !CREDENTIALS_PATH) {
            throw new Error('Missing GOOGLE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS');
        }

        const credentialsFullPath = path.resolve(__dirname, '../../', CREDENTIALS_PATH);

        // Initialize Image Annotator (for searching)
        imageAnnotatorClient = new vision.ImageAnnotatorClient({
            projectId: PROJECT_ID,
            keyFilename: credentialsFullPath
        });

        // Initialize Product Search (for management)
        productSearchClient = new vision.ProductSearchClient({
            projectId: PROJECT_ID,
            keyFilename: credentialsFullPath
        });

        initialized = true;
        console.log('✅ Google Vision API initialized');

        return { success: true };
    } catch (error) {
        console.error('❌ Failed to initialize Google Vision:', error.message);
        throw error;
    }
}

/**
 * Search for similar products using an uploaded image
 * 
 * @param {string} base64Image - Base64 encoded image (with or without data URI prefix)
 * @param {number} topK - Maximum number of results to return
 * @returns {Promise<Array>} Array of matching products with scores
 */
export async function searchSimilarProducts(base64Image, topK = 12) {
    if (!initialized) {
        await initGoogleVision();
    }

    try {
        // Strip data URI prefix if present
        let imageContent = base64Image;
        if (base64Image.includes(',')) {
            imageContent = base64Image.split(',')[1];
        }

        // Convert to buffer
        const imageBuffer = Buffer.from(imageContent, 'base64');

        // Build product set path
        const productSetPath = productSearchClient.productSetPath(
            PROJECT_ID,
            LOCATION,
            PRODUCT_SET_ID
        );

        // Perform product search
        const [response] = await imageAnnotatorClient.productSearch({
            image: { content: imageBuffer },
            imageContext: {
                productSearchParams: {
                    productSet: productSetPath,
                    productCategories: ['apparel-v2'],
                    filter: ''
                }
            }
        });

        // Check for errors
        if (response.error) {
            throw new Error(response.error.message);
        }

        // Extract results
        const productSearchResults = response.productSearchResults;

        if (!productSearchResults || !productSearchResults.results) {
            console.log('⚠️ No product search results returned');
            return [];
        }

        // Map results to our format
        const results = productSearchResults.results.slice(0, topK).map(result => {
            const product = result.product;
            const labels = {};

            // Parse product labels into object
            if (product.productLabels) {
                product.productLabels.forEach(label => {
                    labels[label.key] = label.value;
                });
            }

            return {
                variantId: labels.variantId || extractIdFromName(product.name),
                score: result.score || 0,
                productName: product.displayName || 'Unknown',
                color: labels.color || 'unknown',
                price: parseFloat(labels.price) || 0,
                size: labels.size || 'unknown',
                sku: labels.sku || '',
                urlSlug: labels.urlSlug || '',
                productId: labels.productId || ''
            };
        });

        console.log(`🔍 Google Vision found ${results.length} similar products`);
        return results;

    } catch (error) {
        console.error('❌ Google Vision search error:', error);
        throw error;
    }
}

/**
 * Extract product ID from Vision API product name
 * e.g., "projects/xxx/locations/xxx/products/abc123" -> "abc123"
 */
function extractIdFromName(productName) {
    if (!productName) return '';
    const parts = productName.split('/');
    return parts[parts.length - 1] || '';
}

/**
 * Get product set statistics
 */
export async function getProductSetStats() {
    if (!initialized) {
        await initGoogleVision();
    }

    try {
        const productSetPath = productSearchClient.productSetPath(
            PROJECT_ID,
            LOCATION,
            PRODUCT_SET_ID
        );

        // Get product set info
        const [productSet] = await productSearchClient.getProductSet({
            name: productSetPath
        });

        // List products in set
        const [products] = await productSearchClient.listProductsInProductSet({
            name: productSetPath
        });

        return {
            productSetId: PRODUCT_SET_ID,
            displayName: productSet.displayName,
            indexTime: productSet.indexTime,
            indexError: productSet.indexError,
            totalProducts: products.length,
            location: LOCATION
        };

    } catch (error) {
        console.error('❌ Failed to get product set stats:', error);
        return {
            productSetId: PRODUCT_SET_ID,
            error: error.message,
            totalProducts: 0
        };
    }
}

/**
 * Check if Google Vision is properly configured
 */
export function isConfigured() {
    return !!(PROJECT_ID && CREDENTIALS_PATH);
}

/**
 * Health check for Google Vision service
 */
export async function healthCheck() {
    const configured = isConfigured();

    if (!configured) {
        return {
            healthy: false,
            message: 'Missing configuration',
            details: {
                projectId: !!PROJECT_ID,
                credentials: !!CREDENTIALS_PATH,
                location: LOCATION,
                productSetId: PRODUCT_SET_ID
            }
        };
    }

    try {
        await initGoogleVision();
        const stats = await getProductSetStats();

        return {
            healthy: true,
            message: 'Google Vision API ready',
            details: {
                projectId: PROJECT_ID,
                location: LOCATION,
                productSetId: PRODUCT_SET_ID,
                totalProducts: stats.totalProducts,
                indexTime: stats.indexTime
            }
        };
    } catch (error) {
        return {
            healthy: false,
            message: error.message,
            details: {
                projectId: PROJECT_ID,
                location: LOCATION,
                productSetId: PRODUCT_SET_ID
            }
        };
    }
}
