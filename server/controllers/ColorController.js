import asyncHandler from 'express-async-handler';
import colorService from '../services/color.service.js';

// @desc    Get all colors
// @route   GET /api/colors
// @access  Public
export const getColors = asyncHandler(async (req, res) => {
    const colors = await colorService.getColors();
    res.json({ success: true, data: colors });
});

// @desc    Create a color
// @route   POST /api/colors
// @access  Private/Admin
export const createColor = asyncHandler(async (req, res) => {
    try {
        const color = await colorService.createColor(req.body);
        res.status(201).json({ success: true, data: color });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// @desc    Update a color
// @route   PUT /api/colors/:id
// @access  Private/Admin
export const updateColor = asyncHandler(async (req, res) => {
    try {
        const updatedColor = await colorService.updateColor(req.params.id, req.body);
        res.json({ success: true, data: updatedColor });
    } catch (error) {
        const status = error.message === 'Color not found' ? 404 : 400;
        res.status(status).json({ success: false, message: error.message });
    }
});

// @desc    Delete a color
// @route   DELETE /api/colors/:id
// @access  Private/Admin
export const deleteColor = asyncHandler(async (req, res) => {
    try {
        const result = await colorService.deleteColor(req.params.id);
        res.json({ success: true, message: result.message });
    } catch (error) {
        const status = error.message === 'Color not found' ? 404 : 500; // 500 kept for legacy, though 400/404 better
        res.status(status).json({ success: false, message: error.message });
    }
});
