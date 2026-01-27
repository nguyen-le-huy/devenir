import asyncHandler from 'express-async-handler';
import customerService from '../services/customer.service.js';



export const getCustomers = async (req, res, next) => {
  try {
    const result = await customerService.getCustomers(req.query);
    res.status(200).json({
      success: true,
      data: result.customers,
      pagination: result.pagination,
      meta: result.meta,
    });
  } catch (error) {
    console.error('Error in getCustomers controller:', error);
    next(error);
  }

};

export const getCustomerOverview = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomerOverview();
  res.status(200).json({ success: true, data });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  try {
    const data = await customerService.getCustomerById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

export const getCustomerOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const data = await customerService.getCustomerOrders(req.params.id, limit);
  res.status(200).json({ success: true, data });
});

export const createCustomer = asyncHandler(async (req, res) => {
  try {
    const data = await customerService.createCustomer(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    const status = error.message.includes('exists') ? 409 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

export const updateCustomer = asyncHandler(async (req, res) => {
  try {
    const data = await customerService.updateCustomer(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.message === 'Customer not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === 'Customer not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});
