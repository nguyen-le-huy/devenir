import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter brand name'],
      unique: true,
      trim: true,
      minlength: [2, 'Brand name must be at least 2 characters'],
      maxlength: [50, 'Brand name must not exceed 50 characters'],
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [120, 'Tagline must not exceed 120 characters'],
    },
    originCountry: {
      type: String,
      trim: true,
      maxlength: [60, 'Origin country must not exceed 60 characters'],
    },
    foundedYear: {
      type: Number,
      min: [1850, 'Founded year must be after 1850'],
      max: [new Date().getFullYear() + 1, 'Founded year must be realistic'],
    },
    website: {
      type: String,
      trim: true,
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

// Indexes to optimize queries
brandSchema.index({ name: 1 });
brandSchema.index({ isActive: 1 });

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;