import Category from '../models/CategoryModel.js';
import asyncHandler from 'express-async-handler';

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
    const { name, description, thumbnailUrl, parentCategory, isActive } = req.body;

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

    // Create category
    const category = await Category.create({
        name,
        description,
        thumbnailUrl,
        parentCategory: parentCategory || null,
        isActive: isActive !== undefined ? isActive : true,
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
    const { name, description, thumbnailUrl, parentCategory, isActive } = req.body;

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
    if (parentCategory) {
        // Prevent category from being its own parent
        if (parentCategory === req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Category cannot be its own parent',
            });
        }

        const parent = await Category.findById(parentCategory);
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent category not found',
            });
        }
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (thumbnailUrl !== undefined) category.thumbnailUrl = thumbnailUrl;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (isActive !== undefined) category.isActive = isActive;

    category = await category.save();

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

    res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
    });
});