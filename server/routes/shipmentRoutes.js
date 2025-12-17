import express from 'express';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import {
  startShipment,
  markDelivered,
  simulateDelivery,
  getShipmentsList,
  cancelShipment,
} from '../controllers/ShipmentController.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/', getShipmentsList);
router.post('/:id/start', startShipment);
router.post('/:id/deliver', markDelivered);
router.post('/:id/simulate', simulateDelivery);
router.post('/:id/cancel', cancelShipment);

export default router;
