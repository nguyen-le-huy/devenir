import asyncHandler from 'express-async-handler';
import categoryService from '../services/category.service.js';

export const getCategoriesTree = asyncHandler(async (req, res) => {
    const tree = await categoryService.getCategoriesTree();
    res.status(200).json({ success: true, data: tree });
});

export const getAllCategories = asyncHandler(async (req, res) => {
    const result = await categoryService.getAllCategories(req.query);
    res.status(200).json({
        success: true,
        data: result.categories,
        pagination: result.pagination
    });
});

export const getCategoryById = asyncHandler(async (req, res) => {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

export const createCategory = asyncHandler(async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export const updateCategory = asyncHandler(async (req, res) => {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        const status = error.message === 'Category not found' ? 404 : 400;
        res.status(status).json({ success: false, message: error.message });
    }
});

export const deleteCategory = asyncHandler(async (req, res) => {
    try {
        const result = await categoryService.deleteCategory(req.params.id);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        const status = error.message === 'Category not found' ? 404 : 400;
        res.status(status).json({ success: false, message: error.message });
    }
});