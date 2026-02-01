import asyncHandler from 'express-async-handler';
import productService from '../services/product/product.service.js';


/**
 * Product Controller
 * Delegates logic to ProductService
 */

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAllProducts(req.query);
  res.status(200).json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
});

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Create new product (Admin)
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);



    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Update product (Admin)
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);



    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    const status = error.message === 'Product not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Delete product (Admin)
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);



    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    const status = error.message === 'Product not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Create variant
 * @route   POST /api/admin/products/:id/variants
 * @access  Private/Admin
 */
export const createVariant = asyncHandler(async (req, res) => {
  try {
    const variant = await productService.createVariant(req.params.id, req.body);
    const variantObj = variant.toObject();



    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      data: {
        ...variantObj,
        quantity: variantObj.quantity ?? 0,
        stock: variantObj.quantity ?? 0,
      },
    });
  } catch (error) {
    const status = error.message === 'Product not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Update variant
 * @route   PUT /api/admin/variants/:skuOrId
 * @access  Private/Admin
 */
export const updateVariant = asyncHandler(async (req, res) => {
  try {
    const { variant, syncedCount } = await productService.updateVariant(req.params.skuOrId, req.body);
    const variantObj = variant.toObject();



    res.status(200).json({
      success: true,
      message: syncedCount > 0
        ? `Variant updated successfully. ${syncedCount} same-color variant(s) also synced.`
        : 'Variant updated successfully',
      data: {
        ...variantObj,
        quantity: variantObj.quantity ?? 0,
        stock: variantObj.quantity ?? 0,
      },
      syncedCount,
    });
  } catch (error) {
    const status = error.message === 'Variant not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Delete variant
 * @route   DELETE /api/admin/variants/:skuOrId
 * @access  Private/Admin
 */
export const deleteVariant = asyncHandler(async (req, res) => {
  try {
    const variant = await productService.deleteVariant(req.params.skuOrId);



    res.status(200).json({
      success: true,
      message: 'Variant deleted successfully',
    });
  } catch (error) {
    const status = error.message === 'Variant not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get all variants
 * @route   GET /api/variants
 * @access  Public
 */
export const getAllVariants = asyncHandler(async (req, res) => {
  try {
    const result = await productService.getAllVariants(req.query);
    res.status(200).json({
      success: true,
      data: result.variants,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get variants by product
 * @route   GET /api/products/:id/variants
 * @access  Public
 */
export const getProductVariants = asyncHandler(async (req, res) => {
  const variants = await productService.getProductVariants(req.params.id);
  res.status(200).json({ success: true, data: variants });
});

/**
 * @desc    Get variant by ID
 * @route   GET /api/variants/:id
 * @access  Public
 */
export const getVariantById = asyncHandler(async (req, res) => {
  try {
    const { variant, product, siblingVariants } = await productService.getVariantById(req.params.id);
    const variantObj = variant.toObject();

    res.status(200).json({
      success: true,
      data: {
        variant: {
          ...variantObj,
          quantity: variantObj.quantity ?? 0,
          stock: variantObj.quantity ?? 0,
        },
        product,
        siblingVariants: siblingVariants || []
      }
    });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Bulk update variants
 * @route   PUT /api/products/admin/variants/bulk-update
 * @access  Private/Admin
 */
export const bulkUpdateVariants = asyncHandler(async (req, res) => {
  try {
    const result = await productService.bulkUpdateVariants(req.body);

    res.status(200).json({
      success: true,
      message: 'Variants bulk updated successfully',
      result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
