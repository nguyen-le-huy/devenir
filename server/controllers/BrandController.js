import asyncHandler from 'express-async-handler';
import brandService from '../services/brand.service.js';

export const getBrands = asyncHandler(async (req, res) => {
  const result = await brandService.getBrands(req.query);
  res.status(200).json({
    success: true,
    data: result.brands,
    pagination: result.pagination,
    meta: result.meta,
    topBrands: result.topBrands,
  });
});

export const getBrandById = asyncHandler(async (req, res) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

export const createBrand = asyncHandler(async (req, res) => {
  try {
    const brand = await brandService.createBrand(req.body);
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export const updateBrand = asyncHandler(async (req, res) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    const status = error.message === 'Brand not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

export const deleteBrand = asyncHandler(async (req, res) => {
  try {
    const result = await brandService.deleteBrand(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === 'Brand not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});
