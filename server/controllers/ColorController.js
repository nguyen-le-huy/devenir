import Color from '../models/ColorModel.js';

// @desc    Get all colors
// @route   GET /api/colors
// @access  Public
export const getColors = async (req, res) => {
    try {
        const colors = await Color.find({ isActive: true }).sort({ name: 1 });
        res.json({ success: true, data: colors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a color
// @route   POST /api/colors
// @access  Private/Admin
export const createColor = async (req, res) => {
    try {
        const { name, hex } = req.body;

        const colorExists = await Color.findOne({ $or: [{ name }, { hex }] });
        if (colorExists) {
            return res.status(400).json({ success: false, message: 'Color already exists' });
        }

        const color = await Color.create({ name, hex });
        res.status(201).json({ success: true, data: color });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update a color
// @route   PUT /api/colors/:id
// @access  Private/Admin
export const updateColor = async (req, res) => {
    try {
        const { name, hex, isActive } = req.body;
        const color = await Color.findById(req.params.id);

        if (!color) {
            return res.status(404).json({ success: false, message: 'Color not found' });
        }

        color.name = name || color.name;
        color.hex = hex || color.hex;
        if (isActive !== undefined) color.isActive = isActive;

        const updatedColor = await color.save();
        res.json({ success: true, data: updatedColor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a color
// @route   DELETE /api/colors/:id
// @access  Private/Admin
export const deleteColor = async (req, res) => {
    try {
        const color = await Color.findById(req.params.id);

        if (!color) {
            return res.status(404).json({ success: false, message: 'Color not found' });
        }

        await color.deleteOne();
        res.json({ success: true, message: 'Color removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
