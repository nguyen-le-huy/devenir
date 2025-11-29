import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name must not exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null, // null if it is a top-level category
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: null,
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
categorySchema.index({ slug: 1 }); // Unique lookup
categorySchema.index({ parentCategory: 1 }); // Tree building
categorySchema.index({ isActive: 1, sortOrder: 1 }); // Filtered sorted lists
categorySchema.index({ parentCategory: 1, isActive: 1, sortOrder: 1 }); // Compound for tree queries
categorySchema.index({ name: 'text' }); // Full-text search

const Category = mongoose.model('Category', categorySchema);

export default Category;