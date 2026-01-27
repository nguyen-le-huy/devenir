import Product from '../../models/ProductModel.js';
import ProductVariant from '../../models/ProductVariantModel.js';
import mongoose from 'mongoose';
import { clearCache } from '../../middleware/cacheMiddleware.js';
import {
    triggerProductIngestion,
    triggerProductDeletion,
    deleteVariantsFromQdrant
} from '../ingestion/productIngestion.service.js';
import { emitRealtimeEvent } from '../../utils/realtimeEmitter.js';

const BRAND_CACHE_KEY = '__express__/api/brands';

class ProductService {
    /**
     * Helper: Invalidate Cache
     */
    invalidateBrandCache() {
        clearCache(BRAND_CACHE_KEY);
    }

    /**
     * Get All Products
     */
    async getAllProducts(query) {
        const { page = 1, limit = 10, category, brand, status, search } = query;

        const filter = { isActive: true, status: 'published' };

        if (category) filter.category = category;
        if (brand) filter.brand = brand;
        if (status) filter.status = status; // Admin override

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const limitNum = parseInt(limit);

        const products = await Product.find(filter)
            .select('name description category brand averageRating isActive status createdAt')
            .populate('category', 'name thumbnailUrl')
            .limit(limitNum)
            .skip(skip)
            .sort({ createdAt: -1 })
            .lean();

        const total = await Product.countDocuments(filter);

        return {
            products,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            }
        };
    }

    /**
     * Get Product By ID
     */
    async getProductById(id) {
        const [product, variants] = await Promise.all([
            Product.findOne({
                _id: id,
                isActive: true,
                status: 'published'
            })
                .populate('category', 'name description thumbnailUrl')
                .lean(),
            ProductVariant.find({ product_id: id })
                .select('-__v')
                .lean()
        ]);

        if (!product) throw new Error('Product not found');

        return { ...product, variants };
    }

    /**
     * Create Product (Admin)
     */
    async createProduct(data) {
        const {
            name, description, category, brand, tags, status,
            variants, seoTitle, seoDescription, urlSlug
        } = data;

        // Validation handled by Controller or Zod ideally, but double check
        if (!name || !description || !category) {
            throw new Error('Please provide all required fields: name, description, category');
        }

        const productData = {
            name, description, category,
            tags: tags || [],
            status: status || 'draft',
            seoTitle, seoDescription, urlSlug
        };

        if (brand && mongoose.Types.ObjectId.isValid(brand) && brand.length === 24) {
            productData.brand = brand;
        }

        const product = await Product.create(productData);
        let createdVariantIds = [];

        if (variants && Array.isArray(variants) && variants.length > 0) {
            try {
                const variantDocs = variants.map((v) => ({
                    sku: v.sku,
                    color: v.color,
                    size: v.size,
                    price: v.price,
                    quantity: v.quantity,
                    mainImage: v.mainImage,
                    hoverImage: v.hoverImage,
                    images: v.images || [],
                    product_id: product._id,
                }));
                const createdVariants = await ProductVariant.insertMany(variantDocs);
                createdVariantIds = createdVariants.map(v => v._id.toString());
            } catch (err) {
                // Rollback
                await Product.findByIdAndDelete(product._id);
                throw new Error(`Failed to create variants: ${err.message}`);
            }
        }

        this.invalidateBrandCache();
        triggerProductIngestion(product._id.toString(), createdVariantIds);

        emitRealtimeEvent('product:created', {
            productId: product._id,
            name: product.name,
            category: product.category?.toString?.() || product.category,
        });

        return product;
    }

    /**
     * Update Product
     */
    async updateProduct(id, data) {
        const {
            name, description, category, brand, tags, status,
            variants, seoTitle, seoDescription, urlSlug
        } = data;

        let product = await Product.findById(id);
        if (!product) throw new Error('Product not found');

        if (name) product.name = name;
        if (description) product.description = description;
        if (category) product.category = category;

        if (brand && mongoose.Types.ObjectId.isValid(brand)) {
            product.brand = brand;
        } else if (brand) {
            product.brand = undefined;
        }

        if (tags) product.tags = tags;
        if (status) product.status = status;
        if (seoTitle) product.seoTitle = seoTitle;
        if (seoDescription) product.seoDescription = seoDescription;
        if (urlSlug) product.urlSlug = urlSlug;

        await product.save();

        // Variants Handling
        if (variants && Array.isArray(variants)) {
            // 1. Delete old
            await ProductVariant.deleteMany({ product_id: id });

            // 2. Create new
            const newSKUs = variants.map(v => v.sku);
            // Clean conflicts
            await ProductVariant.deleteMany({ sku: { $in: newSKUs } });

            let createdVariantIds = [];
            if (variants.length > 0) {
                const variantDocs = variants.map((v) => ({
                    sku: v.sku,
                    color: v.color,
                    size: v.size,
                    price: v.price,
                    quantity: v.quantity,
                    mainImage: v.mainImage,
                    hoverImage: v.hoverImage,
                    images: v.images || [],
                    product_id: product._id,
                }));
                const createdVariants = await ProductVariant.insertMany(variantDocs);
                createdVariantIds = createdVariants.map(v => v._id.toString());
            }

            triggerProductIngestion(product._id.toString(), createdVariantIds);
        } else {
            triggerProductIngestion(product._id.toString(), []);
        }

        this.invalidateBrandCache();

        emitRealtimeEvent('product:updated', {
            productId: product._id,
            category: product.category?.toString?.() || product.category,
        });

        return product;
    }

    /**
     * Delete Product
     */
    async deleteProduct(id) {
        const variants = await ProductVariant.find({ product_id: id }).select('_id').lean();
        const variantIds = variants.map(v => v._id.toString());

        const product = await Product.findByIdAndDelete(id);
        if (!product) throw new Error('Product not found');

        await ProductVariant.deleteMany({ product_id: id });

        triggerProductDeletion(id, variantIds);
        this.invalidateBrandCache();

        emitRealtimeEvent('product:deleted', {
            productId: product._id,
        });

        return product;
    }

    /**
     * Create Variant
     */
    async createVariant(productId, data) {
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');

        const {
            sku, size, color, price, stock, images,
            mainImage, hoverImage, lowStockThreshold,
            binLocation, reorderPoint, reorderQuantity,
            reorderQty, safetyStock, reserved, incoming
        } = data;

        if (!sku || !size || !color) {
            throw new Error('Please provide sku, size, and color');
        }

        const existingSKU = await ProductVariant.findOne({ sku: sku.toUpperCase() });
        if (existingSKU) throw new Error('SKU already exists');

        const variant = await ProductVariant.create({
            product_id: productId,
            sku: sku.toUpperCase(),
            size,
            color,
            price: price || product.basePrice || 0,
            quantity: stock ?? 0,
            images: images || [],
            mainImage: mainImage || '',
            hoverImage: hoverImage || '',
            lowStockThreshold: typeof lowStockThreshold === 'number' ? lowStockThreshold : 10,
            binLocation,
            reorderPoint: reorderPoint ?? 0,
            reorderQuantity: reorderQuantity ?? reorderQty ?? 0,
            safetyStock: safetyStock ?? 0,
            reserved: Math.max(0, reserved ?? 0),
            incoming: Math.max(0, incoming ?? 0),
        });

        triggerProductIngestion(productId, [variant._id.toString()]);

        emitRealtimeEvent('variant:created', {
            productId: variant.product_id,
            variantId: variant._id,
            sku: variant.sku,
        });

        return variant;
    }

    /**
     * Update Variant
     */
    async updateVariant(skuOrId, data) {
        let variant;
        const isValidObjectId = skuOrId.length === 24 && /^[0-9a-fA-F]{24}$/.test(skuOrId);

        if (isValidObjectId) {
            variant = await ProductVariant.findById(skuOrId);
        }
        if (!variant) {
            variant = await ProductVariant.findOne({ sku: skuOrId.toUpperCase() });
        }
        if (!variant) throw new Error('Variant not found');

        const {
            price, stock, images, lowStockThreshold, weight, barcode,
            sku, size, color, mainImage, hoverImage, binLocation,
            reorderPoint, reorderQuantity, reorderQty, safetyStock,
            reserved, incoming, syncColorGroup
        } = data;

        const originalColor = variant.color;
        const productId = variant.product_id;

        // Update Fields
        if (sku) variant.sku = sku.toUpperCase();
        if (size) variant.size = size;
        if (color) variant.color = color;
        if (price !== undefined) variant.price = price;
        if (stock !== undefined) variant.quantity = stock;
        if (images) variant.images = images;
        if (lowStockThreshold !== undefined) variant.lowStockThreshold = lowStockThreshold;
        if (weight !== undefined) variant.weight = weight;
        if (barcode) variant.barcode = barcode;
        if (mainImage) variant.mainImage = mainImage;
        if (hoverImage) variant.hoverImage = hoverImage;
        if (binLocation) variant.binLocation = binLocation;
        if (reorderPoint !== undefined) variant.reorderPoint = reorderPoint;
        if (reorderQuantity !== undefined) variant.reorderQuantity = reorderQuantity;
        else if (reorderQty !== undefined) variant.reorderQuantity = reorderQty;
        if (safetyStock !== undefined) variant.safetyStock = safetyStock;
        if (reserved !== undefined) variant.reserved = Math.max(0, reserved);
        if (incoming !== undefined) variant.incoming = Math.max(0, incoming);

        await variant.save();
        let syncedCount = 0;

        // Sync Logic
        if (syncColorGroup && originalColor) {
            const syncPayload = {};
            if (price !== undefined) syncPayload.price = price;
            if (images) syncPayload.images = images;
            if (lowStockThreshold !== undefined) syncPayload.lowStockThreshold = lowStockThreshold;
            if (mainImage) syncPayload.mainImage = mainImage;
            if (hoverImage) syncPayload.hoverImage = hoverImage;
            if (weight !== undefined) syncPayload.weight = weight;
            if (binLocation) syncPayload.binLocation = binLocation;
            if (reorderPoint !== undefined) syncPayload.reorderPoint = reorderPoint;
            // ... more sync fields

            if (Object.keys(syncPayload).length > 0) {
                const res = await ProductVariant.updateMany(
                    {
                        product_id: productId,
                        color: originalColor,
                        _id: { $ne: variant._id },
                        isActive: true
                    },
                    { $set: syncPayload }
                );
                syncedCount = res.modifiedCount;

                // Re-ingest siblings if synced
                if (syncedCount > 0) {
                    const siblings = await ProductVariant.find({ product_id: productId, color: originalColor });
                    triggerProductIngestion(productId.toString(), siblings.map(v => v._id.toString()));
                }
            }
        }

        triggerProductIngestion(productId.toString(), [variant._id.toString()]);

        emitRealtimeEvent('variant:updated', {
            productId: variant.product_id,
            variantId: variant._id,
            sku: variant.sku,
            syncedCount,
        });

        return { variant, syncedCount };
    }

    /**
     * Delete Variant
     */
    async deleteVariant(skuOrId) {
        const isValidObjectId = skuOrId.length === 24 && /^[0-9a-fA-F]{24}$/.test(skuOrId);
        let variant;

        if (isValidObjectId) {
            variant = await ProductVariant.findByIdAndDelete(skuOrId);
        } else {
            variant = await ProductVariant.findOneAndDelete({ sku: skuOrId.toUpperCase() });
        }

        if (!variant) throw new Error('Variant not found');

        // Clean up Vectors
        deleteVariantsFromQdrant([variant._id.toString()]);
        triggerProductIngestion(variant.product_id.toString(), []);

        emitRealtimeEvent('variant:deleted', {
            variantId: variant._id,
            sku: variant.sku,
            productId: variant.product_id,
        });

        return variant;
    }

    /**
     * Get All Variants (with pagination & enrichment)
     */
    async getAllVariants(query) {
        const { page = 1, limit = 50, product, size, color } = query;
        const filter = {};
        if (product) filter.product_id = product;
        if (size) filter.size = size;
        if (color) filter.color = color;

        const skip = (page - 1) * limit;
        const variants = await ProductVariant.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const enriched = await Promise.all(variants.map(async v => {
            const prod = await Product.findById(v.product_id);
            return {
                ...v.toObject(),
                productName: prod?.name || '',
                quantity: v.quantity ?? 0,
                stock: v.quantity ?? 0
            };
        }));

        const total = await ProductVariant.countDocuments(filter);

        return {
            variants: enriched,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getVariantById(id) {
        const variant = await ProductVariant.findById(id);
        if (!variant) throw new Error('Variant not found');

        const product = await Product.findOne({
            _id: variant.product_id,
            isActive: true, // Only published? Original code had isActive=true status=published check
            status: 'published'
        })
            .populate({
                path: 'category',
                populate: { path: 'parentCategory', select: 'name' }
            })
            .populate('brand');

        if (!product) throw new Error('Product not found for this variant');

        return { variant, product };
    }

    /**
     * Get Variants by Product ID
     */
    async getProductVariants(productId) {
        const variants = await ProductVariant.find({ product_id: productId });
        return variants.map(v => ({
            ...v.toObject(),
            quantity: v.quantity ?? 0,
            stock: v.quantity ?? 0
        }));
    }

    /**
     * Bulk Update Variants
     */
    async bulkUpdateVariants(data) {
        const { variants, operation, field } = data; // Expecting array of { sku, quantity, price } or similar?
        // Wait, looking at route comment: { skus: string[], operation: 'set'|'add'|'subtract', amount: number }
        // Let's support that format.

        const { skus, operation: op, amount, field: targetField = 'quantity' } = data;

        if (!skus || !Array.isArray(skus)) throw new Error('skus array is required');
        if (!['set', 'add', 'subtract'].includes(op)) throw new Error('Invalid operation. Use set, add, or subtract');
        if (typeof amount !== 'number') throw new Error('Amount must be a number');

        // Allow updating quantity or price
        if (!['quantity', 'price'].includes(targetField)) throw new Error('Field must be quantity or price');

        const operations = skus.map(sku => {
            const update = {};
            if (op === 'set') {
                update[targetField] = amount;
            } else if (op === 'add') {
                update.$inc = { [targetField]: amount };
            } else if (op === 'subtract') {
                update.$inc = { [targetField]: -amount };
            }
            return {
                updateOne: {
                    filter: { sku: sku.toUpperCase() },
                    update: update
                }
            };
        });

        if (operations.length > 0) {
            await ProductVariant.bulkWrite(operations);

            // Trigger ingestion for these variants?
            // Finding IDs might be expensive if bulk is huge, but necessary for RAG syncing.
            // For now, let's skip auto-ingestion for bulk updates to avoid overload, 
            // OR we can do a background job.
            // Let's do a best-effort find.
            const updatedVariants = await ProductVariant.find({ sku: { $in: skus.map(s => s.toUpperCase()) } }).select('product_id');
            const productIds = [...new Set(updatedVariants.map(v => v.product_id.toString()))];

            // Trigger ingestion for affected products (which updates variants in Pinecone too)
            productIds.forEach(pid => triggerProductIngestion(pid, []));
        }

        return { modifiedCount: operations.length };
    }
}

export default new ProductService();
