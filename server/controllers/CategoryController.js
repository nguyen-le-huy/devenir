import Category from '../models/CategoryModel.js';
import Product from '../models/ProductModel.js';
import ProductVariant from '../models/ProductVariantModel.js';
import asyncHandler from 'express-async-handler';
import logger from '../config/logger.js';
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js';

/**
 * Helper: Build tree structure with levels calculated from parent-child relationships
 */
function buildTreeWithLevels(categories, parentId = null, level = 0) {
    return categories
        .filter(cat => {
            const catParentId = cat.parentCategory?.toString();
            if (parentId === null) {
                return !cat.parentCategory;
            }
            return catParentId === parentId.toString();
        })
        .map(cat => {
            const children = buildTreeWithLevels(categories, cat._id, level + 1);
            
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
                level,                          // ← Calculated level
                children,                       // ← Nested children
                hasChildren: children.length > 0,
                childrenCount: children.length,
            };
        })
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

/**
 * @desc    Get categories as tree with levels
 * @route   GET /api/categories/tree
 * @access  Public
 */
export const getCategoriesTree = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .lean()
        .sort('sortOrder');
    
    // Get product counts per category (with error handling)
    let productCountMap = new Map();
    try {
        const productCounts = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        productCountMap = new Map(
            productCounts.map(item => [item._id?.toString(), item.count])
        );
    } catch (error) {
        logger.error('Product count aggregation failed', { error: error.message, stack: error.stack });
        // Continue without counts rather than failing the entire request
    }
    
    // Get variant counts per category (with error handling)
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
            {
                $group: {
                    _id: '$product.category',
                    count: { $sum: 1 }
                }
            }
        ]);
        variantCountMap = new Map(
            variantCounts.map(item => [item._id?.toString(), item.count])
        );
    } catch (error) {
        logger.error('Variant count aggregation failed', { error: error.message, stack: error.stack });
        // Continue without counts rather than failing the entire request
    }
    
    // Add counts to categories
    const categoriesWithCounts = categories.map(cat => ({
        ...cat,
        productCount: productCountMap.get(cat._id.toString()) || 0,
        variantCount: variantCountMap.get(cat._id.toString()) || 0,
    }));
    
    const tree = buildTreeWithLevels(categoriesWithCounts);
    
    res.status(200).json({
        success: true,
        data: tree,
    });
});

/**
 * Helper function to check if a category is a descendant of another
 */
async function checkIsDescendant(categoryId, potentialAncestorId) {
    let currentId = categoryId;
    const visited = new Set();
    
    while (currentId) {
        if (visited.has(currentId)) break; // Prevent infinite loop
        visited.add(currentId);
        
        const category = await Category.findById(currentId);
        if (!category || !category.parentCategory) break;
        
        if (category.parentCategory.toString() === potentialAncestorId) {
            return true; // Found ancestor
        }
        
        currentId = category.parentCategory;
    }
    
    return false;
}

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getAllCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, parentCategory, isActive } = req.query;

    // Build filter
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

    res.status(200).json({
        success: true,
        data: categories,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id)
        .populate('parentCategory', 'name');

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }

    // Get child categories
    const children = await Category.find({ parentCategory: req.params.id });

    res.status(200).json({
        success: true,
        data: {
            ...category.toObject(),
            children,
        },
    });
});

/**
 * @desc    Create new category (Admin only)
 * @route   POST /api/categories/admin
 * @access  Private/Admin
 */
export const createCategory = asyncHandler(async (req, res) => {
    const { name, description, thumbnailUrl, slug, sortOrder, parentCategory, isActive } = req.body;

    logger.info('Create category request', { name, slug, parentCategory });

    // Validate required fields
    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Please provide category name',
        });
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        return res.status(400).json({
            success: false,
            message: 'Category name already exists',
        });
    }

    // Validate parent category if provided
    if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent category not found',
            });
        }
    }

    // Auto-generate slug if not provided
    const finalSlug = slug || name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Create category - slug lưu như field bình thường
    const category = await Category.create({
        name,
        description: description || '',
        thumbnailUrl: thumbnailUrl || '',
        slug: finalSlug,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        parentCategory: parentCategory || null,
        isActive: isActive !== undefined ? isActive : true,
    });

    logger.info('Category created successfully', { _id: category._id, name: category.name, slug: category.slug });

    emitRealtimeEvent(req, 'category:created', {
        categoryId: category._id,
        parentCategory: category.parentCategory,
    });

    res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
    });
});

/**
 * @desc    Update category (Admin only)
 * @route   PUT /api/categories/admin/:id
 * @access  Private/Admin
 */
export const updateCategory = asyncHandler(async (req, res) => {
    const { name, description, thumbnailUrl, slug, sortOrder, level, parentCategory, isActive } = req.body;

    logger.info('Update category request', { id: req.params.id, body: req.body });

    let category = await Category.findById(req.params.id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }

    // Check if updating name to existing name
    if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists',
            });
        }
    }

    // Validate parent category if provided
    let newLevel = category.level || 0;
    if (parentCategory !== undefined) {
        // Prevent category from being its own parent
        if (parentCategory === req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Category cannot be its own parent',
            });
        }

        if (parentCategory) {
            const parent = await Category.findById(parentCategory);
            if (!parent) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent category not found'
                });
            }
            
            // Calculate new level
            newLevel = (parent.level || 0) + 1;
            
            // Check max depth
            if (newLevel > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum category depth (5 levels) exceeded',
                });
            }
            
            // Prevent circular reference (setting child as parent)
            const isDescendant = await checkIsDescendant(req.params.id, parentCategory);
            if (isDescendant) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot set a descendant category as parent (circular reference)',
                });
            }
        } else {
            // Setting to root (no parent)
            newLevel = 0;
        }
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (thumbnailUrl !== undefined) category.thumbnailUrl = thumbnailUrl;
    if (slug !== undefined && slug.trim() !== '') category.slug = slug.trim();
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (parentCategory !== undefined) {
        category.parentCategory = parentCategory || null;
        category.level = newLevel;
    } else if (level !== undefined && level !== null) {
        // Allow manual level override when parentCategory is not changed
        category.level = level;
    }
    if (isActive !== undefined) category.isActive = isActive;

    category = await category.save();

    logger.info('Category updated successfully', {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        level: category.level,
        parentCategory: category.parentCategory
    });

    emitRealtimeEvent(req, 'category:updated', {
        categoryId: category._id,
        parentCategory: category.parentCategory,
        isActive: category.isActive,
    });

    res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
    });
});

/**
 * @desc    Delete category (Admin only)
 * @route   DELETE /api/categories/admin/:id
 * @access  Private/Admin
 */
export const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Category not found'
        });
    }

    // Check if category has child categories
    const childrenCount = await Category.countDocuments({
        parentCategory: req.params.id
    });

    if (childrenCount > 0) {
        return res.status(400).json({
            success: false,
            message: `Cannot delete category. It has ${childrenCount} child categories.`,
        });
    }

    await Category.findByIdAndDelete(req.params.id);

    emitRealtimeEvent(req, 'category:deleted', {
        categoryId: category._id,
    });

    res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
    });
});