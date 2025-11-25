import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            unique: true,
            trim: true,
        },
        hex: {
            type: String,
            required: [true, 'Hex code is required'],
            trim: true,
            uppercase: true,
            validate: {
                validator: function (v) {
                    return /^#([0-9A-F]{3}){1,2}$/i.test(v);
                },
                message: props => `${props.value} is not a valid hex color code!`
            }
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
colorSchema.index({ name: 1 });
colorSchema.index({ hex: 1 });

const Color = mongoose.model('Color', colorSchema);

export default Color;
