import asyncHandler from 'express-async-handler';
import shipmentService from '../services/shipment.service.js';

export const startShipment = asyncHandler(async (req, res) => {
  try {
    const data = await shipmentService.startShipment(req.params.id, req.body.trackingNumber, req);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.message === 'Order not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

export const markDelivered = asyncHandler(async (req, res) => {
  try {
    const data = await shipmentService.markDelivered(req.params.id, req);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.message === 'Order not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

export const simulateDelivery = asyncHandler(async (req, res) => {
  // Alias to force delivery
  return markDelivered(req, res);
});

export const getShipmentsList = asyncHandler(async (req, res) => {
  const data = await shipmentService.getShipmentsList(req.query);
  res.status(200).json({ success: true, data });
});

export const cancelShipment = asyncHandler(async (req, res) => {
  try {
    await shipmentService.cancelShipment(req.params.id, req);
    res.status(200).json({ success: true, message: 'Shipment cancelled and inventory restored' });
  } catch (error) {
    const status = error.message === 'Order not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});
