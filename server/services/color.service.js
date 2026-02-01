import Color from '../models/ColorModel.js';
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js';

class ColorService {
    /**
     * Get All Colors
     */
    async getColors() {
        return Color.find({ isActive: true }).sort({ name: 1 });
    }

    /**
     * Create Color
     */
    async createColor(data) {
        const { name, hex } = data;

        const colorExists = await Color.findOne({ $or: [{ name }, { hex }] });
        if (colorExists) {
            throw new Error('Color already exists');
        }

        const color = await Color.create({ name, hex });

        emitRealtimeEvent('color:created', { id: color._id });

        return color;
    }

    /**
     * Update Color
     */
    async updateColor(id, data) {
        const { name, hex, isActive } = data;
        let color = await Color.findById(id);

        if (!color) {
            throw new Error('Color not found');
        }

        // Check if updating to an existing name/hex
        if (name || hex) {
            const existing = await Color.findOne({
                $and: [
                    { _id: { $ne: id } },
                    { $or: [{ name }, { hex }] }
                ]
            });
            if (existing) throw new Error('Color name or hex already exists');
        }

        if (name) color.name = name;
        if (hex) color.hex = hex;
        if (isActive !== undefined) color.isActive = isActive;

        const updatedColor = await color.save();

        emitRealtimeEvent('color:updated', { id: updatedColor._id });

        return updatedColor;
    }

    /**
     * Delete Color
     */
    async deleteColor(id) {
        const color = await Color.findById(id);

        if (!color) {
            throw new Error('Color not found');
        }

        await color.deleteOne();

        emitRealtimeEvent('color:deleted', { id: id });

        return { message: 'Color removed' };
    }
}

export default new ColorService();
