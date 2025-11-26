import Product from '../models/ProductModel.js';
import ProductVariant from '../models/ProductVariantModel.js';
import asyncHandler from 'express-async-handler';

/**
 * @desc    Get all products with pagination, filtering, and search
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, brand, status, search } = req.query;

  // Build filter object
  const filter = { isActive: true };

  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const products = await Product.find(filter)
    .populate('category')
    .populate('brand')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get product by ID with variants
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category')
    .populate('brand');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Get variants for this product
  const variants = await ProductVariant.find({ product_id: req.params.id });

  res.status(200).json({
    success: true,
    data: {
      ...product.toObject(),
      variants,
    },
  });
});

/**
 * @desc    Create new product (Admin only)
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    brand,
    tags,
    status,
    variants,
    seoTitle,
    seoDescription,
    urlSlug,
  } = req.body;

  // Validate required fields
  if (!name || !description || !category) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, description, category',
    });
  }

  // Create product
  const product = await Product.create({
    name,
    description,
    category,
    brand,
    tags: tags || [],
    status: status || 'draft',
    seoTitle,
    seoDescription,
    urlSlug,
  });

  // Create variants if provided
  if (variants && Array.isArray(variants) && variants.length > 0) {
    try {
      const variantDocs = variants.map((v) => ({
        sku: v.sku,
        color: v.color,
        size: v.size,
        price: v.price,
        quantity: v.quantity,
        mainImage: v.mainImage,
        hoverImage: v.hoverImage,
        images: v.images || [],
        product_id: product._id,
      }));
      await ProductVariant.insertMany(variantDocs);
    } catch (variantError) {
      console.error('Error creating variants:', variantError.message);
      // Delete product if variant creation fails
      await Product.findByIdAndDelete(product._id);
      throw new Error(`Failed to create variants: ${variantError.message}`);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

/**
 * @desc    Update product (Admin only)
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  console.log('=== UPDATE PRODUCT REQUEST ===');
  console.log('Product ID:', req.params.id);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Variants count:', req.body.variants?.length || 0);

  const {
    name,
    description,
    category,
    brand,
    tags,
    status,
    variants,
    seoTitle,
    seoDescription,
    urlSlug,
  } = req.body;

  let product = await Product.findById(req.params.id);

  if (!product) {
    console.log('ERROR: Product not found:', req.params.id);
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  console.log('Found product:', product.name);

  // Update fields
  if (name) product.name = name;
  if (description) product.description = description;
  if (category) product.category = category;
  if (brand) product.brand = brand;
  if (tags) product.tags = tags;
  if (status) product.status = status;
  if (seoTitle) product.seoTitle = seoTitle;
  if (seoDescription) product.seoDescription = seoDescription;
  if (urlSlug) product.urlSlug = urlSlug;

  try {
    product = await product.save();
    console.log('Product saved successfully');
  } catch (saveError) {
    console.error('ERROR saving product:', saveError);
    throw saveError;
  }

  // Handle variants update/replace if provided
  if (variants && Array.isArray(variants)) {
    try {
      console.log(`Updating ${variants.length} variants...`);

      // Delete old variants for this product (by product_id)
      const deleteResult = await ProductVariant.deleteMany({ product_id: req.params.id });
      console.log(`Deleted ${deleteResult.deletedCount} old variants by product_id`);

      // Also delete any existing variants with the new SKUs (to handle orphaned/duplicate SKUs)
      const newSKUs = variants.map(v => v.sku);
      const deleteDuplicates = await ProductVariant.deleteMany({ sku: { $in: newSKUs } });
      console.log(`Deleted ${deleteDuplicates.deletedCount} existing variants with duplicate SKUs`);

      // Create new variants
      if (variants.length > 0) {
        const variantDocs = variants.map((v) => ({
          sku: v.sku,
          color: v.color,
          size: v.size,
          price: v.price,
          quantity: v.quantity,
          mainImage: v.mainImage,
          hoverImage: v.hoverImage,
          images: v.images || [],
          product_id: product._id,
        }));

        console.log('Creating variants with data:', JSON.stringify(variantDocs, null, 2));
        const createdVariants = await ProductVariant.insertMany(variantDocs);
        console.log(`Created ${createdVariants.length} new variants`);
      }
    } catch (variantError) {
      console.error('ERROR updating variants:', variantError);
      console.error('Variant error stack:', variantError.stack);
      console.error('First variant data:', JSON.stringify(variants[0], null, 2));

      return res.status(500).json({
        success: false,
        message: `Failed to update variants: ${variantError.message}`,
        error: variantError.message,
        details: variantError.stack,
      });
    }
  }

  console.log('Product update completed successfully');
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

/**
 * @desc    Delete product (Admin only)
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Delete associated variants
  await ProductVariant.deleteMany({ product_id: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

/**
 * @desc    Create variant for product (Admin only)
 * @route   POST /api/admin/products/:id/variants
 * @access  Private/Admin
 */
export const createVariant = asyncHandler(async (req, res) => {
  const { sku, size, color, price, stock, images } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Check if SKU already exists
  const existingSKU = await ProductVariant.findOne({ sku });
  if (existingSKU) {
    return res.status(400).json({ success: false, message: 'SKU already exists' });
  }

  const variant = await ProductVariant.create({
    productId: req.params.id,
    sku,
    size,
    color,
    price: price || product.basePrice,
    stock: stock || 0,
    images: images || [],
  });

  res.status(201).json({
    success: true,
    message: 'Variant created successfully',
    data: variant,
  });
});

/**
 * @desc    Update variant (Admin only)
 * @route   PUT /api/admin/variants/:skuOrId
 * @access  Private/Admin
 */
export const updateVariant = asyncHandler(async (req, res) => {
  const { price, stock, images, lowStockThreshold, weight, barcode } = req.body;

  let variant = await ProductVariant.findOne({
    $or: [{ _id: req.params.skuOrId }, { sku: req.params.skuOrId }],
  });

  if (!variant) {
    return res.status(404).json({ success: false, message: 'Variant not found' });
  }

  if (price !== undefined) variant.price = price;
  if (stock !== undefined) variant.stock = stock;
  if (images) variant.images = images;
  if (lowStockThreshold !== undefined) variant.lowStockThreshold = lowStockThreshold;
  if (weight !== undefined) variant.weight = weight;
  if (barcode) variant.barcode = barcode;

  variant = await variant.save();

  res.status(200).json({
    success: true,
    message: 'Variant updated successfully',
    data: variant,
  });
});

/**
 * @desc    Delete variant (Admin only)
 * @route   DELETE /api/admin/variants/:skuOrId
 * @access  Private/Admin
 */
export const deleteVariant = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findOneAndDelete({
    $or: [{ _id: req.params.skuOrId }, { sku: req.params.skuOrId }],
  });

  if (!variant) {
    return res.status(404).json({ success: false, message: 'Variant not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Variant deleted successfully',
  });
});

/**
 * @desc    Get all variants with product info
 * @route   GET /api/variants
 * @access  Public
 */
export const getAllVariants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, product, size, color, status } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = {};
  if (product) filter.product = product;
  if (size) filter.size = size;
  if (color) filter.color = color;

  try {
    const variants = await ProductVariant.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    // Enrich with product info
    const enrichedVariants = await Promise.all(
      variants.map(async (variant) => {
        try {
          const prod = await Product.findById(variant.product);
          return {
            ...variant.toObject(),
            productName: prod?.name || '',
          };
        } catch (err) {
          return {
            ...variant.toObject(),
            productName: '',
          };
        }
      })
    );

    const total = await ProductVariant.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: enrichedVariants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getAllVariants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching variants',
      error: error.message,
    });
  }
});

/**
 * @desc    Get product variants by product ID
 * @route   GET /api/products/:id/variants
 * @access  Public
 */
export const getProductVariants = asyncHandler(async (req, res) => {
  const variants = await ProductVariant.find({ product_id: req.params.id });

  res.status(200).json({
    success: true,
    data: variants,
  });
});

/**
 * @desc    Bulk update variants (Admin only)
 * @route   PUT /api/admin/variants/bulk-update
 * @access  Private/Admin
 */
export const bulkUpdateVariants = asyncHandler(async (req, res) => {
  const { skus, operation, amount } = req.body;

  if (!skus || !operation) {
    return res.status(400).json({
      success: false,
      message: 'Please provide skus and operation',
    });
  }

  let updateQuery = {};

  if (operation === 'set') {
    updateQuery = { stock: amount };
  } else if (operation === 'add') {
    updateQuery = { $inc: { stock: amount } };
  } else if (operation === 'subtract') {
    updateQuery = { $inc: { stock: -amount } };
  }

  const result = await ProductVariant.updateMany(
    { sku: { $in: skus } },
    updateQuery
  );

  res.status(200).json({
    success: true,
    message: 'Variants updated successfully',
    data: result,
  });
});
