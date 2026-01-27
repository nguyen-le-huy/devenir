import asyncHandler from 'express-async-handler';
import inventoryService from '../services/inventory.service.js';

export const getInventoryOverview = asyncHandler(async (req, res) => {
  const data = await inventoryService.getInventoryOverview();
  res.status(200).json({ success: true, data });
});

export const getInventoryList = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventoryList(req.query);
  res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
    summary: result.summary,
  });
});

export const getInventoryAlerts = asyncHandler(async (req, res) => {
  const data = await inventoryService.getInventoryAlerts();
  res.status(200).json({ success: true, data });
});

export const createInventoryAdjustment = asyncHandler(async (req, res) => {
  try {
    const result = await inventoryService.createInventoryAdjustment(req.user, req.body, req);
    res.status(201).json({ success: true, message: 'Inventory adjusted successfully', data: result });
  } catch (error) {
    const status = error.message === 'Variant not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

export const getInventoryAdjustments = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventoryAdjustments(req.query);
  res.status(200).json({ success: true, data: result.adjustments, pagination: result.pagination });
});

export const getInventoryVariantDetail = asyncHandler(async (req, res) => {
  try {
    const data = await inventoryService.getInventoryVariantDetail(req.params.variantId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.message === 'Variant not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

export const exportInventoryReport = asyncHandler(async (req, res) => {
  const csvContent = await inventoryService.exportInventory(req.body);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');
  res.send(csvContent);
});
