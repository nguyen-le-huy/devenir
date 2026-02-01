import asyncHandler from 'express-async-handler';
import financialService from '../services/financial.service.js';

export const calculateOrderProfit = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  try {
    const record = await financialService.calculateOrderProfit(orderId);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    const status = error.message === 'Order not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

export const getRevenueStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query; // Converted by Zod
  const data = await financialService.getRevenueStats(startDate, endDate);
  res.status(200).json({ success: true, data });
});

export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const result = await financialService.getDashboardMetrics();
  res.status(200).json({ success: true, ...result });
});

// Exports helper for use in other modules (e.g. Order flow)
export const upsertFinancialRecordForOrder = financialService.upsertFinancialRecordForOrder.bind(financialService);
