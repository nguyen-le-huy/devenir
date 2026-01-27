import Category from '../models/CategoryModel.js';
import Product from '../models/ProductModel.js';
import ProductVariant from '../models/ProductVariantModel.js';
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js';
import logger from '../config/logger.js';

class CategoryService {

    /**
     * Build Tree Structure
     */
    _buildTreeWithLevels(categories, parentId = null, level = 0) {
        return categories
            .filter(cat => {
                const catParentId = cat.parentCategory?.toString();
                if (parentId === null) {
                    return !cat.parentCategory;
                }
                return catParentId === parentId.toString();
            })
            .map(cat => {
                const children = this._buildTreeWithLevels(categories, cat._id, level + 1);

                return {
                    _id: cat._id,
                    name: cat.name,
                    description: cat.description,
                    slug: cat.slug,
                    thumbnailUrl: cat.thumbnailUrl,
                    parentCategory: cat.parentCategory,
                    isActive: cat.isActive,
                    sortOrder: cat.sortOrder,
                    createdAt: cat.createdAt,
                    updatedAt: cat.updatedAt,
                    productCount: cat.productCount || 0,
                    variantCount: cat.variantCount || 0,
                    level,
                    children,
                    hasChildren: children.length > 0,
                    childrenCount: children.length,
                };
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    /**
     * Check if descendant to prevent cycles
     */
    async _checkIsDescendant(categoryId, potentialAncestorId) {
        let currentId = categoryId;
        const visited = new Set();

        while (currentId) {
            if (visited.has(currentId)) break;
            visited.add(currentId);

            const category = await Category.findById(currentId);
            if (!category || !category.parentCategory) break;

            if (category.parentCategory.toString() === potentialAncestorId) {
                return true;
            }

            currentId = category.parentCategory;
        }

        return false;
    }

    /**
     * Fetch Categories Tree with Counts
     */
    async getCategoriesTree() {
        const categories = await Category.find({ isActive: true }).lean().sort('sortOrder');

        // 1. Product Counts
        let productCountMap = new Map();
        try {
            const productCounts = await Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]);
            productCountMap = new Map(productCounts.map(item => [item._id?.toString(), item.count]));
        } catch (error) {
            logger.error('Product count aggregation failed', { error: error.message });
        }

        // 2. Variant Counts
        let variantCountMap = new Map();
        try {
            const variantCounts = await ProductVariant.aggregate([
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                { $match: { 'product.isActive': true } },
                { $group: { _id: '$product.category', count: { $sum: 1 } } }
            ]);
            variantCountMap = new Map(variantCounts.map(item => [item._id?.toString(), item.count]));
        } catch (error) {
            logger.error('Variant count aggregation failed', { error: error.message });
        }

        // Enrich Data
        const categoriesWithCounts = categories.map(cat => ({
            ...cat,
            productCount: productCountMap.get(cat._id.toString()) || 0,
            variantCount: variantCountMap.get(cat._id.toString()) || 0,
        }));

        return this._buildTreeWithLevels(categoriesWithCounts);
    }

    /**
     * Get All Categories with Pagination
     */
    async getAllCategories(query) {
        const { page = 1, limit = 50, parentCategory, isActive } = query;

        const filter = {};
        if (parentCategory) filter.parentCategory = parentCategory;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const skip = (page - 1) * limit;

        const categories = await Category.find(filter)
            .populate('parentCategory', 'name')
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ createdAt: -1 });

        const total = await Category.countDocuments(filter);

        return {
            categories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get Category By ID
     */
    async getCategoryById(id) {
        const category = await Category.findById(id).populate('parentCategory', 'name');
        if (!category) throw new Error('Category not found');

        const children = await Category.find({ parentCategory: id });

        return {
            ...category.toObject(),
            children,
        };
    }

    /**
     * Create Category
     */
    async createCategory(data) {
        const { name, description, thumbnailUrl, slug, sortOrder, parentCategory, isActive } = data;

        if (await Category.findOne({ name })) {
            throw new Error('Category name already exists');
        }

        if (parentCategory) {
            const parent = await Category.findById(parentCategory);
            if (!parent) throw new Error('Parent category not found');
        }

        // Auto-generate slug logic
        const finalSlug = slug || name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const category = await Category.create({
            name,
            description: description || '',
            thumbnailUrl: thumbnailUrl || '',
            slug: finalSlug,
            sortOrder: sortOrder !== undefined ? sortOrder : 0,
            parentCategory: parentCategory || null,
            isActive: isActive !== undefined ? isActive : true,
        });

        emitRealtimeEvent('category:created', {
            categoryId: category._id,
            parentCategory: category.parentCategory,
        });

        return category;
    }

    /**
     * Update Category
     */
    async updateCategory(id, data) {
        const { name, description, thumbnailUrl, slug, sortOrder, level, parentCategory, isActive } = data;

        let category = await Category.findById(id);
        if (!category) throw new Error('Category not found');

        // Name Uniqueness
        if (name && name !== category.name) {
            if (await Category.findOne({ name })) {
                throw new Error('Category name already exists');
            }
        }

        // Parent Logic
        let newLevel = category.level || 0;
        if (parentCategory !== undefined) {
            if (parentCategory === id) throw new Error('Category cannot be its own parent');

            if (parentCategory) {
                const parent = await Category.findById(parentCategory);
                if (!parent) throw new Error('Parent category not found');

                newLevel = (parent.level || 0) + 1;
                if (newLevel > 5) throw new Error('Maximum category depth (5 levels) exceeded');

                if (await this._checkIsDescendant(id, parentCategory)) {
                    throw new Error('Cannot set a descendant category as parent (circular reference)');
                }
            } else {
                newLevel = 0;
            }
        }

        // Apply Updates
        if (name) category.name = name;
        if (description !== undefined) category.description = description;
        if (thumbnailUrl !== undefined) category.thumbnailUrl = thumbnailUrl;
        if (slug && slug.trim() !== '') category.slug = slug.trim();
        if (sortOrder !== undefined) category.sortOrder = sortOrder;

        if (parentCategory !== undefined) {
            category.parentCategory = parentCategory || null;
            category.level = newLevel;
        } else if (level !== undefined && level !== null) {
            category.level = level;
        }

        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        emitRealtimeEvent('category:updated', {
            categoryId: category._id,
            parentCategory: category.parentCategory,
            isActive: category.isActive,
        });

        return category;
    }

    /**
     * Delete Category
     */
    async deleteCategory(id) {
        const category = await Category.findById(id);
        if (!category) throw new Error('Category not found');

        const childrenCount = await Category.countDocuments({ parentCategory: id });
        if (childrenCount > 0) throw new Error(`Cannot delete category. It has ${childrenCount} child categories.`);

        await Category.findByIdAndDelete(id);

        emitRealtimeEvent('category:deleted', { categoryId: category._id });

        return { message: 'Category deleted successfully' };
    }
}

export default new CategoryService();
